# 04 - API Interceptor & Network Mocking 🛰️

## Overview
The **API & Network Interceptor** (`chrome://interceptor`) allows you to inspect real-time HTTP/HTTPS requests from web pages, simulate backend edge cases, rewrite API responses with custom JSON mocks, and automatically generate API documentation.

---

## 🔍 Live Traffic Inspection

The **Traffic** tab captures live network calls originating from any active tab:

- **Filter by Method**: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`.
- **Status Indicators**: Color-coded badges for `2xx` (success), `3xx` (redirect), `4xx` (client error), and `5xx` (server error).
- **Request Details**: Inspect request headers, POST body payloads, response status, and response bodies.
- **Single-Click Replay**: Re-send any captured request directly from Chrome Lite to test API responsiveness.

---

## 🎭 Creating Mock Rules

Mock rules allow you to intercept specific network requests and return synthetic responses without changing backend servers.

1. Navigate to the **Mock Rules** tab in the API Inspector.
2. Click **+ Add Mock Rule**.
3. Configure the rule parameters:
   - **URL Pattern**: String match or glob (e.g. `*/api/v1/user/profile*`).
   - **HTTP Method**: Match any method or specific (`GET`, `POST`, etc.).
   - **Status Code**: Return `200 OK`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`, or `503 Service Unavailable`.
   - **Simulate Network Delay**: Add artificial latency in milliseconds (e.g. `1200ms`) to test UI loading states and skeleton screens.
   - **Simulate Network Failure**: Force network drops (`ERR_CONNECTION_RESET`, `ERR_TIMED_OUT`) to verify offline handling.
   - **Mock Response Body**: Custom JSON or text payload returned to the web page.

### Example Mock JSON:
```json
{
  "user": {
    "id": 999,
    "name": "Alex Developer",
    "role": "enterprise_admin",
    "isPremium": true
  },
  "mockedBy": "Chrome Lite Interceptor"
}
```

---

## 📦 HAR Export & OpenAPI 3.0 Generation

Chrome Lite bridges the gap between manual inspection and automated documentation:

1. **Export to HAR 1.2**: Click **Export HAR** to generate a standard HTTP Archive file compatible with Postman, Charles, Fiddler, and browser network analyzers.
2. **Generate OpenAPI 3.0**: Click **Generate OpenAPI Spec**. Chrome Lite analyzes captured request and response schemas across all endpoints and produces a valid OpenAPI 3.0 YAML/JSON specification ready for Swagger UI or API client generators.

---

## 🧭 Next Step
Proceed to **[05 - Macro Automation & Playwright](file:///d:/Development/electron/Chrome%20Lite/docs/guides/05-macro-automation-and-playwright.md)** to learn how to visually record and automate browser tasks.
