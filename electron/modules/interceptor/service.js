const db = require("../../services/database");
const defaultConfig = require("./config");
const logger = require("../../services/logger").forSubsystem("Interceptor");

class InterceptorService {
  constructor() {
    this.config = { ...defaultConfig };
    this.mainWindow = null;
    this.attachedContents = new Set();
    this.wsFrames = new Map(); // requestId -> frames[]
    this.activeMockRules = [];
  }

  async init(mainWindow) {
    this.mainWindow = mainWindow;
    await this.loadMockRules();
  }

  matchUrl(pattern, url) {
    if (!pattern || pattern === "*") return true;
    if (pattern.startsWith("/") && pattern.endsWith("/")) {
      try {
        return new RegExp(pattern.slice(1, -1)).test(url);
      } catch { }
    }
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    try {
      return new RegExp("^" + escaped + "$", "i").test(url) || url.toLowerCase().includes(pattern.toLowerCase());
    } catch {
      return url.toLowerCase().includes(pattern.toLowerCase());
    }
  }

  async loadMockRules() {
    try {
      const rows = await db.all(`SELECT * FROM mock_rules WHERE enabled = 1`);
      this.activeMockRules = rows || [];
    } catch (err) {
      this.activeMockRules = [];
    }
  }

  async handleFetchRequestPaused(contents, params) {
    if (!contents || contents.isDestroyed()) return;
    const req = params.request || {};
    const url = req.url || "";
    const method = (req.method || "GET").toUpperCase();

    // Check if any enabled mock rule matches
    const rule = this.activeMockRules.find(
      (r) =>
        (r.method === "*" || r.method.toUpperCase() === method) &&
        this.matchUrl(r.url_pattern, url)
    );

    if (rule) {
      try {
        if (rule.action === "mock_response") {
          const bodyBuf = Buffer.from(rule.response_body || "", "utf8");
          let headers = [];
          try {
            const parsed = JSON.parse(rule.response_headers || '{"content-type":"application/json"}');
            headers = Object.entries(parsed).map(([name, value]) => ({ name, value: String(value) }));
          } catch {
            headers = [{ name: "content-type", value: "application/json" }];
          }

          await contents.debugger.sendCommand("Fetch.fulfillRequest", {
            requestId: params.requestId,
            responseCode: Number(rule.response_status) || 200,
            responseHeaders: headers,
            body: bodyBuf.toString("base64")
          });
          logger.info(`Mocked request [${rule.name}]: ${method} ${url} -> ${rule.response_status}`);
          return;
        }

        if (rule.action === "block") {
          await contents.debugger.sendCommand("Fetch.failRequest", {
            requestId: params.requestId,
            errorReason: "BlockedByClient"
          });
          logger.info(`Blocked request [${rule.name}]: ${method} ${url}`);
          return;
        }

        if (rule.action === "modify_headers") {
          let custom = {};
          try { custom = JSON.parse(rule.response_headers || "{}"); } catch { }
          const merged = { ...(req.headers || {}), ...custom };
          const headers = Object.entries(merged).map(([name, value]) => ({ name, value: String(value) }));

          await contents.debugger.sendCommand("Fetch.continueRequest", {
            requestId: params.requestId,
            headers
          });
          return;
        }
      } catch (err) {
        logger.debug("Error processing mock rule:", err.message);
      }
    }

    // Default: continue request without pause
    try {
      await contents.debugger.sendCommand("Fetch.continueRequest", {
        requestId: params.requestId
      });
    } catch { }
  }

  async attachToContents(contents) {
    if (!this.config.enabled || !contents || this.attachedContents.has(contents.id)) return;
    this.attachedContents.add(contents.id);

    try {
      contents.debugger.attach("1.3");
      await contents.debugger.sendCommand("Network.enable");
      if (this.activeMockRules && this.activeMockRules.length > 0) {
        try {
          await contents.debugger.sendCommand("Fetch.enable", {
            patterns: [{ urlPattern: "*", requestStage: "Request" }]
          });
        } catch (fErr) {
          logger.debug("Fetch.enable warning:", fErr.message);
        }
      }
      logger.info(`Debugger attached to contents ${contents.id} for network interception & mocking`);

      contents.debugger.on("message", async (event, method, params) => {
        try {
          if (method === "Fetch.requestPaused") {
            await this.handleFetchRequestPaused(contents, params);
          } else if (method === "Network.requestWillBeSent") {
            await this.handleRequest(contents, params);
          } else if (method === "Network.responseReceived") {
            await this.handleResponse(contents, params);
          } else if (method === "Network.webSocketFrameReceived" || method === "Network.webSocketFrameSent") {
            this.handleWebSocketFrame(params, method);
          }
        } catch (err) {
          logger.debug("Error handling CDP message:", err.message);
        }
      });

      contents.once("destroyed", () => {
        this.attachedContents.delete(contents.id);
      });
    } catch (err) {
      logger.warn(`Could not attach debugger to contents ${contents.id}: ${err.message}`);
    }
  }

  handleWebSocketFrame(params, method) {
    const { requestId, response } = params;
    if (!this.wsFrames.has(requestId)) this.wsFrames.set(requestId, []);
    const frames = this.wsFrames.get(requestId);
    if (frames.length < 50) {
      frames.push({
        dir: method.includes("Sent") ? "out" : "in",
        payload: response && response.payloadData ? response.payloadData.substring(0, 500) : "",
        timestamp: Date.now()
      });
    }
  }

  async handleRequest(contents, params) {
    const { requestId, request, type } = params;
    const url = request.url;

    // Feed to asset collector if explorer module is loaded
    try {
      const assetCollector = require("../explorer/assetCollector");
      assetCollector.recordAsset(contents.id, {
        url,
        resourceType: type,
        mimeType: ""
      });
    } catch { }

    const isMatch = this.config.filterKeywords.some((kw) => url.toLowerCase().includes(kw)) ||
      (type === "XHR" || type === "Fetch" || type === "WebSocket" || url.includes("graphql"));

    if (!isMatch) return;

    const record = {
      id: requestId,
      sessionId: "current",
      url,
      method: request.method,
      headers: JSON.stringify(request.headers || {}),
      postData: request.postData || null,
      resourceType: type
    };

    try {
      await db.run(
        `INSERT OR REPLACE INTO requests (id, session_id, url, method, headers, post_data, resource_type, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [record.id, record.sessionId, record.url, record.method, record.headers, record.postData, record.resourceType]
      );
    } catch { }

    this.notifyRenderer("chrome:network-request", record);
  }

  async handleResponse(contents, params) {
    const { requestId, response } = params;
    const url = response.url;

    // Feed to asset collector with size & mime
    try {
      const assetCollector = require("../explorer/assetCollector");
      assetCollector.recordAsset(contents.id, {
        url,
        status: response.status,
        mimeType: response.mimeType,
        size: response.encodedDataLength || 0
      });
    } catch { }

    let body = "";
    try {
      const result = await contents.debugger.sendCommand("Network.getResponseBody", { requestId });
      if (result && result.body) {
        body = result.body.substring(0, this.config.maxBodyLength);
      }
    } catch { }

    const record = {
      id: "resp_" + requestId,
      requestId,
      status: response.status,
      statusText: response.statusText,
      headers: JSON.stringify(response.headers || {}),
      body,
      mimeType: response.mimeType
    };

    try {
      await db.run(
        `INSERT OR REPLACE INTO responses (id, request_id, status, status_text, headers, body, mime_type, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [record.id, record.requestId, record.status, record.statusText, record.headers, record.body, record.mimeType]
      );
    } catch { }

    this.notifyRenderer("chrome:network-response", record);
  }

  async getRecentRequests(limit = 100) {
    try {
      return await db.all(
        `SELECT r.*, res.status, res.status_text, res.body, res.mime_type 
         FROM requests r 
         LEFT JOIN responses res ON r.id = res.request_id 
         ORDER BY r.timestamp DESC LIMIT ?`,
        [limit]
      );
    } catch (err) {
      logger.error("Failed to query requests:", err.message);
      return [];
    }
  }

  async clearRequests() {
    try {
      await db.run(`DELETE FROM responses`);
      await db.run(`DELETE FROM requests`);
      this.wsFrames.clear();
      return true;
    } catch (err) {
      return false;
    }
  }

  async replayRequest(requestId, customHeaders = null) {
    try {
      const reqRow = await db.get(`SELECT * FROM requests WHERE id = ? LIMIT 1`, [requestId]);
      if (!reqRow) throw new Error("Request not found");

      let headers = customHeaders || {};
      if (!customHeaders) {
        try { headers = JSON.parse(reqRow.headers || "{}"); } catch { }
      }

      delete headers["host"];
      delete headers["Host"];
      delete headers["content-length"];

      const startTime = Date.now();
      const fetchOpts = { method: reqRow.method || "GET", headers };
      if (reqRow.post_data && reqRow.method !== "GET") {
        fetchOpts.body = reqRow.post_data;
      }

      const res = await fetch(reqRow.url, fetchOpts);
      const text = await res.text();
      return {
        requestId,
        status: res.status,
        statusText: res.statusText,
        durationMs: Date.now() - startTime,
        headers: Object.fromEntries(res.headers.entries()),
        body: text.substring(0, this.config.maxBodyLength)
      };
    } catch (err) {
      return { error: err.message };
    }
  }

  async getMockRules() {
    try {
      return await db.all(`SELECT * FROM mock_rules ORDER BY created_at DESC`);
    } catch (err) {
      logger.error("Failed to get mock rules:", err.message);
      return [];
    }
  }

  async saveMockRule(rule) {
    const id = rule.id || "mock_" + Date.now().toString(36);
    const name = rule.name || "Untitled Mock";
    const urlPattern = rule.url_pattern || "*";
    const method = rule.method || "*";
    const action = rule.action || "mock_response";
    const status = Number(rule.response_status) || 200;
    const headers = typeof rule.response_headers === "string" ? rule.response_headers : JSON.stringify(rule.response_headers || { "content-type": "application/json" });
    const body = rule.response_body || "{}";
    const enabled = rule.enabled === false || rule.enabled === 0 ? 0 : 1;

    try {
      const existing = await db.get(`SELECT id FROM mock_rules WHERE id = ?`, [id]);
      if (existing) {
        await db.run(
          `UPDATE mock_rules 
           SET name = ?, url_pattern = ?, method = ?, action = ?, response_status = ?, response_headers = ?, response_body = ?, enabled = ?
           WHERE id = ?`,
          [name, urlPattern, method, action, status, headers, body, enabled, id]
        );
      } else {
        await db.run(
          `INSERT INTO mock_rules (id, name, url_pattern, method, action, response_status, response_headers, response_body, enabled, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [id, name, urlPattern, method, action, status, headers, body, enabled]
        );
      }
      await this.loadMockRules();
      logger.info(`Saved mock rule: ${name} (${id})`);
      return { id, name, url_pattern: urlPattern, method, action, response_status: status, response_headers: headers, response_body: body, enabled };
    } catch (err) {
      logger.error("Failed to save mock rule:", err.message);
      throw err;
    }
  }

  async deleteMockRule(id) {
    try {
      await db.run(`DELETE FROM mock_rules WHERE id = ?`, [id]);
      await this.loadMockRules();
      logger.info(`Deleted mock rule: ${id}`);
      return true;
    } catch (err) {
      logger.error("Failed to delete mock rule:", err.message);
      throw err;
    }
  }

  async toggleMockRule(id, enabled) {
    try {
      const val = enabled ? 1 : 0;
      await db.run(`UPDATE mock_rules SET enabled = ? WHERE id = ?`, [val, id]);
      await this.loadMockRules();
      logger.info(`Toggled mock rule: ${id} -> ${val}`);
      return true;
    } catch (err) {
      logger.error("Failed to toggle mock rule:", err.message);
      throw err;
    }
  }

  async generateOpenApi(domainFilter = null) {
    try {
      const rows = await db.all(
        `SELECT r.url, r.method, r.headers, r.post_data, res.status, res.headers as resp_headers, res.body as resp_body
         FROM requests r
         LEFT JOIN responses res ON r.id = res.request_id
         ORDER BY r.timestamp ASC LIMIT 300`
      );

      const paths = {};
      const serversMap = new Set();

      for (const row of rows) {
        try {
          const u = new URL(row.url);
          if (domainFilter && !u.hostname.toLowerCase().includes(domainFilter.toLowerCase())) {
            continue;
          }

          serversMap.add(u.origin);

          // Normalize path: replace UUIDs and numbers with {param}
          let normalizedPath = u.pathname;
          normalizedPath = normalizedPath.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, "{id}");
          normalizedPath = normalizedPath.replace(/\/\d+(?=\/|$)/g, "/{id}");

          if (!paths[normalizedPath]) paths[normalizedPath] = {};

          const method = (row.method || "GET").toLowerCase();
          if (!paths[normalizedPath][method]) {
            paths[normalizedPath][method] = {
              summary: `${method.toUpperCase()} ${normalizedPath}`,
              parameters: [],
              responses: {}
            };

            // Extract query parameters
            u.searchParams.forEach((val, key) => {
              paths[normalizedPath][method].parameters.push({
                name: key,
                in: "query",
                required: false,
                schema: { type: "string" }
              });
            });

            // If path has {id}, add path param
            if (normalizedPath.includes("{id}")) {
              paths[normalizedPath][method].parameters.push({
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" }
              });
            }
          }

          // Request Body
          if (row.post_data && method !== "get" && method !== "head") {
            try {
              const parsedBody = JSON.parse(row.post_data);
              paths[normalizedPath][method].requestBody = {
                content: {
                  "application/json": {
                    schema: this._inferSchema(parsedBody)
                  }
                }
              };
            } catch {
              paths[normalizedPath][method].requestBody = {
                content: {
                  "text/plain": {
                    schema: { type: "string" }
                  }
                }
              };
            }
          }

          // Responses
          const status = String(row.status || 200);
          if (!paths[normalizedPath][method].responses[status]) {
            let responseSchema = { type: "string" };
            let contentType = "text/plain";

            if (row.resp_body) {
              try {
                const parsed = JSON.parse(row.resp_body);
                responseSchema = this._inferSchema(parsed);
                contentType = "application/json";
              } catch { }
            }

            paths[normalizedPath][method].responses[status] = {
              description: status === "200" ? "Successful response" : `Status ${status}`,
              content: {
                [contentType]: {
                  schema: responseSchema
                }
              }
            };
          }
        } catch { }
      }

      return {
        openapi: "3.0.3",
        info: {
          title: domainFilter ? `${domainFilter} API Specification` : "Chrome Inferred API Specification",
          version: "1.0.0",
          description: "Generated by Chrome Lite Network Inspector from live session traffic."
        },
        servers: Array.from(serversMap).map((url) => ({ url })),
        paths
      };
    } catch (err) {
      logger.error("Failed to generate OpenAPI spec:", err.message);
      throw err;
    }
  }

  _inferSchema(val) {
    if (val === null || val === undefined) return { type: "string", nullable: true };
    if (Array.isArray(val)) {
      return {
        type: "array",
        items: val.length > 0 ? this._inferSchema(val[0]) : { type: "string" }
      };
    }
    if (typeof val === "object") {
      const properties = {};
      for (const [k, v] of Object.entries(val)) {
        properties[k] = this._inferSchema(v);
      }
      return { type: "object", properties };
    }
    if (typeof val === "number") return { type: Number.isInteger(val) ? "integer" : "number" };
    if (typeof val === "boolean") return { type: "boolean" };
    return { type: "string" };
  }

  notifyRenderer(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
}

module.exports = new InterceptorService();
