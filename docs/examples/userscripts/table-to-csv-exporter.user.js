// ==UserScript==
// @name         Table to CSV / JSON Quick Exporter
// @match        *://*/*
// @run-at       document-end
// @description  Detects data tables on any website and injects an instant 'Export to CSV / JSON' toolbar over each table.
// ==/UserScript==

(function () {
  'use strict';

  function exportTable(table, format) {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return;

    // Parse headers
    const headerCells = rows[0].querySelectorAll('th, td');
    const headers = Array.from(headerCells).map((c, i) => c.innerText.trim() || `Col_${i + 1}`);

    // Parse data rows
    const dataRows = rows.slice(1);
    const records = [];

    dataRows.forEach((r) => {
      const cells = r.querySelectorAll('td');
      if (cells.length === 0) return;
      const record = {};
      headers.forEach((h, i) => {
        record[h] = cells[i] ? cells[i].innerText.trim() : '';
      });
      records.push(record);
    });

    if (records.length === 0) {
      alert('No data rows found in this table.');
      return;
    }

    let fileContent = '';
    let fileName = `table_export_${Date.now()}`;
    let mimeType = 'text/plain';

    if (format === 'csv') {
      mimeType = 'text/csv;charset=utf-8;';
      fileName += '.csv';
      const csvLines = [];
      // Header line
      csvLines.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));
      // Data lines
      records.forEach((rec) => {
        const line = headers.map((h) => `"${(rec[h] || '').replace(/"/g, '""')}"`).join(',');
        csvLines.push(line);
      });
      fileContent = csvLines.join('\n');
    } else {
      mimeType = 'application/json;charset=utf-8;';
      fileName += '.json';
      fileContent = JSON.stringify(records, null, 2);
    }

    // Trigger download
    const blob = new Blob([fileContent], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function injectTableToolbar(table) {
    if (table.dataset.chromeLiteExportInjected) return;
    table.dataset.chromeLiteExportInjected = 'true';

    // Verify table has content
    if (table.querySelectorAll('tr').length < 2) return;

    const bar = document.createElement('div');
    bar.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      font-size: 11px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    `;

    const csvBtn = document.createElement('button');
    csvBtn.innerText = '📥 Export CSV';
    csvBtn.style.cssText = `
      padding: 3px 8px;
      background: #0284c7;
      color: #ffffff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    `;
    csvBtn.onclick = (e) => {
      e.preventDefault();
      exportTable(table, 'csv');
    };

    const jsonBtn = document.createElement('button');
    jsonBtn.innerText = '📋 Export JSON';
    jsonBtn.style.cssText = `
      padding: 3px 8px;
      background: #475569;
      color: #ffffff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    `;
    jsonBtn.onclick = (e) => {
      e.preventDefault();
      exportTable(table, 'json');
    };

    bar.appendChild(csvBtn);
    bar.appendChild(jsonBtn);

    table.parentNode.insertBefore(bar, table);
  }

  function scanTables() {
    document.querySelectorAll('table').forEach(injectTableToolbar);
  }

  scanTables();
  setInterval(scanTables, 2000);
})();
