# 05 - Macro Automation & Playwright 🤖

## Overview
The **Browser Macro & Automation Engine** (`chrome://automation`) lets you record user interactions live on web pages, configure multi-step workflow routines, run automated tasks in the background, and export recorded flows directly into production **TypeScript Playwright** test scripts.

---

## 🎬 Action Recording

1. Open **Automation & Macros** from the side panel or dock.
2. Click **Record Flow** on any active tab.
3. Perform actions on the web page:
   - **Clicking buttons and links**.
   - **Typing text into input fields**.
   - **Form submissions and selections**.
   - **Page scrolling and navigation**.
4. Chrome Lite's recorder captures element CSS selectors, coordinates, text values, and timings into editable workflow steps.
5. Click **Stop Recording** when finished.

---

## 🔧 Configuring Steps & Control Flows

The visual **Step Editor** allows you to fine-tune each step:

| Step Type | Configuration Options | Purpose |
|---|---|---|
| **Navigate** | Target URL | Navigates the tab to a new page. |
| **Click** | CSS Selector, coordinates | Simulates a user mouse click. |
| **Type** | CSS Selector, text value, clearFirst | Enters text into inputs. |
| **Wait** | Delay (ms) or wait_for_element | Pauses until an element appears or timer elapses. |
| **Scroll** | Direction (`up`, `down`, `to_element`), distance (px) | Scrolls the viewport. |
| **Condition (If)** | `if_element_exists`, `if_text_contains` | Branches flow execution based on live page state. |
| **Loop** | `loop_elements`, max iterations | Iterates over lists, product cards, or search results. |

---

## 🎭 Exporting to TypeScript Playwright

Any recorded or manually composed workflow can be converted into standard Playwright code with one click:

1. In the automation panel, click **Export Playwright**.
2. Chrome Lite generates a clean, standalone TypeScript test script:

```typescript
import { test, expect } from '@playwright/test';

test('Automated Workflow: User Search & Filter', async ({ page }) => {
  // Step 1: Navigate
  await page.goto('https://example.com/search');

  // Step 2: Type search term
  await page.locator('input[name="q"]').fill('Chrome Lite browser');

  // Step 3: Click search button
  await page.locator('button[type="submit"]').click();

  // Step 4: Wait for results container
  await page.locator('.search-results').waitFor({ state: 'visible', timeout: 5000 });

  // Verification
  await expect(page.locator('.search-results')).toBeVisible();
});
```

3. Click **Copy Code** or **Download .spec.ts** to commit directly into your CI/CD test suite.

---

## ⏱️ Autonomous Scheduling & Headless Execution
- **Cron Scheduler**: Configure flows to trigger automatically on an interval (e.g. every 15 minutes, daily at 09:00).
- **Headless Mode**: Execute scheduled automations in an invisible background process without interrupting active browsing tabs.

---

## 🧭 Next Step
Proceed to **[06 - Web Scraper & Site Mirroring](file:///d:/Development/electron/Chrome%20Lite/docs/guides/06-web-scraper-and-mirroring.md)** to learn how to extract structured web data and archive site assets.
