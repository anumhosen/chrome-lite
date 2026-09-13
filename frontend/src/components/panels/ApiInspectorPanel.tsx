import React, { useEffect, useState } from 'react';
import {
  VscTrash,
  VscCloudDownload,
  VscFileCode,
  VscServerProcess,
  VscAdd,
} from 'react-icons/vsc';
import { ApiInspectorDetail } from './ApiInspectorDetail';
import { TrafficView } from './interceptor/TrafficView';
import { MockRulesView } from './interceptor/MockRulesView';
import { chromeApi } from '../../services/chromeApi';
import type { RequestItem, MockRule } from './interceptor/interceptorTypes';

export type { RequestItem, MockRule };

export const ApiInspectorPanel: React.FC = () => {
  const [panelTab, setPanelTab] = useState<'traffic' | 'mocks'>('traffic');
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [selectedReq, setSelectedReq] = useState<RequestItem | null>(null);

  // Mock Rules State
  const [mockRules, setMockRules] = useState<MockRule[]>([]);
  const [editingRule, setEditingRule] = useState<MockRule | null>(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  const fetchRecent = async () => {
    try {
      const list = await chromeApi.interceptor.getRequests(100);
      setRequests(list || []);
    } catch { }
  };

  const fetchMockRules = async () => {
    try {
      const rules = await chromeApi.interceptor.getMockRules();
      setMockRules(rules || []);
    } catch { }
  };

  useEffect(() => {
    fetchRecent();
    fetchMockRules();

    const unsubReq = chromeApi.on('chrome:network-request', (req: any) => {
      setRequests((prev) => [req, ...prev.slice(0, 99)]);
    });
    const unsubRes = chromeApi.on('chrome:network-response', (res: any) => {
      setRequests((prev) =>
        prev.map((r) => (r.id === res.id ? { ...r, ...res } : r))
      );
    });

    return () => {
      if (typeof unsubReq === 'function') unsubReq();
      if (typeof unsubRes === 'function') unsubRes();
    };
  }, []);

  const handleClear = async () => {
    await chromeApi.interceptor.clear();
    setRequests([]);
    setSelectedReq(null);
  };

  const handleExportHar = () => {
    if (requests.length === 0) return;
    const har = {
      log: {
        version: '1.2',
        creator: { name: 'Chrome Lite', version: '0.2.0' },
        pages: [],
        entries: requests.map((r) => {
          let reqHeaders: Record<string, string> = {};
          let resHeaders: Record<string, string> = {};
          try { reqHeaders = JSON.parse(r.headers || '{}'); } catch { }
          try { resHeaders = JSON.parse(r.responseHeaders || '{}'); } catch { }

          return {
            startedDateTime: new Date().toISOString(),
            time: r.duration || 50,
            request: {
              method: r.method,
              url: r.url,
              httpVersion: 'HTTP/1.1',
              headers: Object.entries(reqHeaders).map(([name, value]) => ({ name, value: String(value) })),
              queryString: [],
              cookies: [],
              headersSize: -1,
              bodySize: r.post_data ? r.post_data.length : 0,
              postData: r.post_data ? { mimeType: 'application/json', text: r.post_data } : undefined,
            },
            response: {
              status: r.status || 200,
              statusText: r.statusText || 'OK',
              httpVersion: 'HTTP/1.1',
              headers: Object.entries(resHeaders).map(([name, value]) => ({ name, value: String(value) })),
              cookies: [],
              content: {
                size: r.body ? r.body.length : 0,
                mimeType: 'application/json',
                text: r.body || '',
              },
              redirectURL: '',
              headersSize: -1,
              bodySize: r.body ? r.body.length : 0,
            },
            cache: {},
            timings: { send: 1, wait: r.duration || 40, receive: 5 },
          };
        }),
      },
    };

    const blob = new Blob([JSON.stringify(har, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chrome-traffic-${Date.now()}.har`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportOpenApi = async () => {
    try {
      const spec = await chromeApi.interceptor.generateOpenApi();
      if (!spec) return;
      const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chrome-openapi-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Failed to export OpenAPI 3.0: ${err.message}`);
    }
  };

  const handleCreateMockFromRequest = (req: RequestItem) => {
    setSelectedReq(null);
    setPanelTab('mocks');
    setEditingRule(null);

    let cleanPath = req.url;
    try {
      const u = new URL(req.url);
      cleanPath = `*${u.pathname}*`;
    } catch { }

    setEditingRule({
      name: `Mock ${req.method} ${cleanPath}`,
      url_pattern: cleanPath,
      method: req.method || '*',
      action: 'mock_response',
      response_status: req.status || 200,
      response_headers: req.responseHeaders || '{"content-type":"application/json"}',
      response_body: req.body || '{\n  "mocked": true\n}',
      enabled: 1,
    });
    setIsCreatingRule(true);
  };

  const handleSaveRule = async (ruleData: any) => {
    try {
      await chromeApi.interceptor.saveMockRule(ruleData);
      setIsCreatingRule(false);
      setEditingRule(null);
      await fetchMockRules();
    } catch (err: any) {
      alert(`Failed to save mock rule: ${err.message}`);
    }
  };

  const handleToggleRule = async (rule: MockRule) => {
    if (!rule.id) return;
    const nextState = !rule.enabled;
    try {
      await chromeApi.interceptor.toggleMockRule(rule.id, nextState);
      setMockRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, enabled: nextState } : r))
      );
    } catch { }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await chromeApi.interceptor.deleteMockRule(id);
      setMockRules((prev) => prev.filter((r) => r.id !== id));
    } catch { }
  };

  if (selectedReq) {
    return (
      <ApiInspectorDetail
        req={selectedReq}
        onClose={() => setSelectedReq(null)}
        onCreateMock={handleCreateMockFromRequest}
      />
    );
  }

  return (
    <div className="flex flex-col h-full gap-2.5 text-xs select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-900 p-0.5 rounded-md border border-gray-200 dark:border-neutral-800">
          <button
            onClick={() => setPanelTab('traffic')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
              panelTab === 'traffic'
                ? 'bg-white dark:bg-neutral-800 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Live Traffic ({requests.length})
          </button>
          <button
            onClick={() => setPanelTab('mocks')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
              panelTab === 'mocks'
                ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <VscServerProcess size={12} />
            <span>Mock Rules ({mockRules.length})</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {panelTab === 'traffic' ? (
            <>
              <button
                onClick={handleExportOpenApi}
                disabled={requests.length === 0}
                title="Infer and export OpenAPI 3.0 schema from captured traffic"
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-40 text-gray-700 dark:text-neutral-300 transition-colors border border-gray-200 dark:border-neutral-700"
              >
                <VscFileCode size={12} />
                <span>OpenAPI 3.0</span>
              </button>

              <button
                onClick={handleExportHar}
                disabled={requests.length === 0}
                title="Export session to HAR 1.2 format"
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-40 text-gray-700 dark:text-neutral-300 transition-colors border border-gray-200 dark:border-neutral-700"
              >
                <VscCloudDownload size={12} />
                <span>HAR</span>
              </button>

              <button
                onClick={handleClear}
                title="Clear Traffic Log"
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 transition-colors border border-gray-200 dark:border-neutral-700"
              >
                <VscTrash size={12} />
                <span>Clear</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setEditingRule(null);
                setIsCreatingRule(true);
              }}
              title="Add a new mock or interception rule"
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
            >
              <VscAdd size={12} />
              <span>New Mock Rule</span>
            </button>
          )}
        </div>
      </div>

      {panelTab === 'traffic' ? (
        <TrafficView
          requests={requests}
          onSelectRequest={(req) => setSelectedReq(req)}
        />
      ) : (
        <MockRulesView
          mockRules={mockRules}
          isCreatingRule={isCreatingRule}
          editingRule={editingRule}
          onCloseForm={() => {
            setIsCreatingRule(false);
            setEditingRule(null);
          }}
          onSaveRule={handleSaveRule}
          onEditRule={(rule) => {
            setEditingRule(rule);
            setIsCreatingRule(true);
          }}
          onToggleRule={handleToggleRule}
          onDeleteRule={handleDeleteRule}
        />
      )}
    </div>
  );
};
