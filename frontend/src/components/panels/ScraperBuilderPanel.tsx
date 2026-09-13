import React, { useState } from 'react';
import {
  VscSearch,
  VscCloudDownload,
  VscSave,
  VscAdd,
  VscTrash,
  VscInspect,
  VscLoading,
  VscTable,
  VscCheck,
} from 'react-icons/vsc';
import { useTabBindingStore } from '../../stores/useTabBindingStore';
import { TabBindingBar } from '../common/TabBindingBar';

interface FieldRule {
  id: string;
  name: string;
  selector: string;
  type: 'text' | 'href' | 'src';
}

export const ScraperBuilderPanel: React.FC = () => {
  const [selector, setSelector] = useState('article, .post, .card, .product-item');
  const [pagination, setPagination] = useState('');
  const [maxPages, setMaxPages] = useState(5);
  const [status, setStatus] = useState('Ready');
  const [items, setItems] = useState<any[]>([]);
  const [isPicking, setIsPicking] = useState(false);
  const [useMultiField, setUseMultiField] = useState(false);
  const [fields, setFields] = useState<FieldRule[]>([
    { id: 'f-1', name: 'title', selector: 'h2, h3, .title, a', type: 'text' },
    { id: 'f-2', name: 'link', selector: 'a', type: 'href' },
    { id: 'f-3', name: 'image', selector: 'img', type: 'src' },
  ]);
  const [isSaved, setIsSaved] = useState(false);

  const { getBoundTab } = useTabBindingStore();
  const boundTab = getBoundTab();
  const boundTabId = boundTab?.id || null;

  // Visual Element Picker
  const handleStartVisualPick = async (fieldId?: string) => {
    if (!boundTabId) {
      setStatus('Please select a target web tab above before picking.');
      return;
    }
    if (!window.chrome?.scraper?.startPicker) {
      setStatus('Visual picker bridge not available.');
      return;
    }

    setIsPicking(true);
    setStatus('🎯 Hover & click an element on the target page (Press Esc to cancel)...');

    try {
      const res = await window.chrome.scraper.startPicker(boundTabId);
      if (res && res.selector) {
        if (fieldId) {
          setFields((prev) =>
            prev.map((f) => (f.id === fieldId ? { ...f, selector: res.selector } : f))
          );
          setStatus(`Set field selector to "${res.selector}" (<${res.tagName}>)`);
        } else {
          setSelector(res.selector);
          setStatus(`Picked container selector: "${res.selector}" (<${res.tagName}>)`);
        }
      } else {
        setStatus('Picker canceled.');
      }
    } catch (err: any) {
      setStatus(`Picker error: ${err.message}`);
    } finally {
      setIsPicking(false);
    }
  };

  const handleAddField = () => {
    const id = `f-${Date.now()}`;
    setFields((prev) => [
      ...prev,
      { id, name: `field_${prev.length + 1}`, selector: '', type: 'text' },
    ]);
  };

  const handleRemoveField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdateField = (id: string, updates: Partial<FieldRule>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleDetectPagination = async () => {
    if (!boundTabId) {
      setStatus('Please select a target web tab above.');
      return;
    }
    setStatus('Detecting pagination...');
    if (!window.chrome?.scraperBuilder?.detectPagination) return;
    try {
      const res = await window.chrome.scraperBuilder.detectPagination(boundTabId);
      if (res?.selector) {
        setPagination(res.selector);
        setStatus(`Found pager: "${res.text || res.selector}"`);
      } else {
        setStatus('No pagination links detected.');
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleTestExtract = async () => {
    if (!selector.trim()) return;
    if (!boundTabId) {
      setStatus('Please select a target web tab above.');
      return;
    }
    if (!window.chrome?.notebook?.execute) return;

    setStatus('Extracting page elements...');
    try {
      let code = '';
      if (useMultiField && fields.length > 0) {
        code = `
          (() => {
            const containers = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
            const fieldRules = ${JSON.stringify(fields)};
            return containers.slice(0, 50).map((c, i) => {
              const row = { index: i + 1 };
              fieldRules.forEach(f => {
                const target = f.selector ? c.querySelector(f.selector) : c;
                if (!target) {
                  row[f.name] = null;
                  return;
                }
                if (f.type === 'href') {
                  row[f.name] = target.href || target.getAttribute('href') || null;
                } else if (f.type === 'src') {
                  row[f.name] = target.src || target.getAttribute('src') || null;
                } else {
                  row[f.name] = (target.innerText || target.textContent || '').trim();
                }
              });
              return row;
            });
          })();
        `;
      } else {
        code = `
          (() => {
            const els = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
            return els.slice(0, 50).map((el, i) => ({
              index: i + 1,
              tag: el.tagName.toLowerCase(),
              text: (el.innerText || el.textContent || "").trim().slice(0, 250),
              href: el.href || el.querySelector('a')?.href || null,
              src: el.src || el.querySelector('img')?.src || null
            }));
          })();
        `;
      }

      const res = await window.chrome.notebook.execute(boundTabId, code);
      if (res?.success && Array.isArray(res.result)) {
        setItems(res.result);
        setStatus(`Extracted ${res.result.length} items from ${boundTab?.title || 'page'}`);
      } else {
        setItems([]);
        setStatus('No matching elements found.');
      }
    } catch (err: any) {
      setStatus(`Extraction failed: ${err.message}`);
    }
  };

  const handleExportJson = () => {
    if (items.length === 0) return;
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chrome-scraped-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (items.length === 0) return;
    const keys = Object.keys(items[0] || {});
    const headerRow = keys.map((k) => `"${k.replace(/"/g, '""')}"`).join(',');
    const rows = items.map((row) =>
      keys.map((k) => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headerRow, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chrome-scraped-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveWorkflow = async () => {
    if (!selector.trim() || !window.chrome?.scraperBuilder?.saveWorkflow) return;
    try {
      await window.chrome.scraperBuilder.saveWorkflow({
        name: `Scraper: ${selector.slice(0, 30)}`,
        selector,
        paginationSelector: pagination || null,
        maxPages,
      });
      setStatus('Workflow saved to Automation Engine!');
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err: any) {
      setStatus(`Save failed: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full gap-2.5 text-xs select-none">
      {/* Target Tab Binding Bar */}
      <TabBindingBar />

      {/* Visual Picker Banner */}
      {isPicking && (
        <div className="p-2 rounded bg-sky-500/15 border border-sky-500/40 text-sky-700 dark:text-sky-300 text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <VscLoading size={13} className="animate-spin" />
            <span>Targeting live DOM: Click any element on the page (or press Esc)...</span>
          </div>
        </div>
      )}

      {/* Query & Control Card */}
      <div className="p-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-md flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
            Container / Element Query
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseMultiField(!useMultiField)}
              className={`text-[10.5px] px-2 py-0.5 rounded transition-colors ${useMultiField
                  ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/30'
                  : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200'
                }`}
            >
              {useMultiField ? '✓ Multi-field Schema' : '+ Multi-field Schema'}
            </button>
          </div>
        </div>

        {/* Main Selector & Visual Pick Button */}
        <div className="flex gap-1.5 items-center">
          <input
            type="text"
            value={selector}
            onChange={(e) => setSelector(e.target.value)}
            placeholder="Container selector (e.g. .card, article, tr)"
            className="flex-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded px-2.5 py-1 text-gray-800 dark:text-neutral-200 outline-none focus:border-sky-500 font-mono text-[11px]"
          />
          <button
            onClick={() => handleStartVisualPick()}
            disabled={!boundTabId || isPicking}
            title="Pick element visually by clicking on the page"
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 disabled:opacity-50 text-gray-800 dark:text-neutral-200 rounded font-medium text-xs transition-colors border border-gray-300 dark:border-neutral-700 flex-shrink-0"
          >
            <VscInspect size={13} className="text-sky-500" />
            <span>Visual Pick</span>
          </button>
          <button
            onClick={handleTestExtract}
            disabled={!boundTabId}
            className="flex items-center gap-1 px-3 py-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded font-medium text-xs transition-colors flex-shrink-0 shadow-xs"
          >
            <VscSearch size={13} />
            <span>Extract</span>
          </button>
        </div>

        {/* Multi-Field Schema Sub-Form */}
        {useMultiField && (
          <div className="flex flex-col gap-1.5 p-2 bg-white dark:bg-neutral-900/60 rounded border border-gray-200 dark:border-neutral-800/80 mt-1">
            <div className="flex items-center justify-between text-[10.5px]">
              <span className="font-semibold text-gray-500 dark:text-neutral-400 uppercase">
                Sub-Field Mappings
              </span>
              <button
                onClick={handleAddField}
                className="flex items-center gap-0.5 text-sky-600 dark:text-sky-400 hover:underline font-medium"
              >
                <VscAdd size={11} />
                <span>Add Field</span>
              </button>
            </div>

            {fields.map((f) => (
              <div key={f.id} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={f.name}
                  onChange={(e) => handleUpdateField(f.id, { name: e.target.value })}
                  placeholder="name"
                  className="w-20 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-1.5 py-0.5 text-[10.5px] font-mono text-gray-800 dark:text-neutral-200 outline-none"
                />
                <input
                  type="text"
                  value={f.selector}
                  onChange={(e) => handleUpdateField(f.id, { selector: e.target.value })}
                  placeholder="selector (e.g. h2)"
                  className="flex-1 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-1.5 py-0.5 text-[10.5px] font-mono text-gray-800 dark:text-neutral-200 outline-none focus:border-sky-500"
                />
                <select
                  value={f.type}
                  onChange={(e) => handleUpdateField(f.id, { type: e.target.value as any })}
                  className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-1.5 py-0.5 text-[10.5px] text-gray-700 dark:text-neutral-300 outline-none"
                >
                  <option value="text">text</option>
                  <option value="href">href</option>
                  <option value="src">src</option>
                </select>
                <button
                  onClick={() => handleStartVisualPick(f.id)}
                  title="Pick this field visually"
                  className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:text-sky-500 hover:bg-gray-200 dark:hover:bg-neutral-800"
                >
                  <VscInspect size={12} />
                </button>
                <button
                  onClick={() => handleRemoveField(f.id)}
                  title="Remove field"
                  className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-neutral-800"
                >
                  <VscTrash size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Row */}
        <div className="flex gap-1.5 items-center">
          <input
            type="text"
            value={pagination}
            onChange={(e) => setPagination(e.target.value)}
            placeholder="Pagination link selector (e.g. a.next, rel='next')"
            className="flex-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded px-2.5 py-1 text-gray-800 dark:text-neutral-200 outline-none focus:border-sky-500 font-mono text-[11px]"
          />
          <button
            onClick={handleDetectPagination}
            disabled={!boundTabId}
            className="px-2.5 py-1 bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 disabled:opacity-50 text-gray-700 dark:text-neutral-300 rounded text-xs transition-colors flex-shrink-0"
          >
            Auto Detect
          </button>
        </div>

        {/* Status Bar & Pages */}
        <div className="flex items-center justify-between text-gray-600 dark:text-neutral-400 text-[11px] pt-0.5">
          <span className="truncate mr-2">
            Status: <strong className="text-sky-600 dark:text-sky-400 font-medium">{status}</strong>
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span>Pages:</span>
            <input
              type="number"
              value={maxPages}
              min={1}
              max={50}
              onChange={(e) => setMaxPages(parseInt(e.target.value, 10) || 1)}
              className="w-12 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded px-1 text-center text-gray-800 dark:text-neutral-200 outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-500 dark:text-neutral-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <VscTable size={13} />
          <span>Results ({items.length})</span>
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportCsv}
            disabled={items.length === 0}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 disabled:opacity-40 text-gray-700 dark:text-neutral-300 transition-colors text-[11px] font-medium"
          >
            <VscCloudDownload size={12} />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportJson}
            disabled={items.length === 0}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 disabled:opacity-40 text-gray-700 dark:text-neutral-300 transition-colors text-[11px] font-medium"
          >
            <VscCloudDownload size={12} />
            <span>JSON</span>
          </button>
          <button
            onClick={handleSaveWorkflow}
            disabled={items.length === 0}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-medium transition-colors text-[11px] shadow-xs"
          >
            {isSaved ? <VscCheck size={12} /> : <VscSave size={12} />}
            <span>Save Workflow</span>
          </button>
        </div>
      </div>

      {/* Extracted Records Viewport */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-md p-1 font-mono text-[11px]">
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-neutral-500 text-xs font-sans">
            {!boundTabId
              ? 'Select a web tab above to begin scraping.'
              : 'Enter a selector or click "Visual Pick", then click "Extract" to preview matching items.'}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-200 dark:divide-neutral-800/60">
            {items.map((it, idx) => (
              <div key={idx} className="p-2 flex flex-col gap-1 hover:bg-gray-100/70 dark:hover:bg-neutral-900/40">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-sky-600 dark:text-sky-400 font-bold">
                    #{it.index || idx + 1} {it.tag ? `<${it.tag}>` : ''}
                  </span>
                  {it.href && (
                    <a
                      href={it.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-500 dark:text-neutral-500 hover:text-sky-500 dark:hover:text-sky-400 truncate max-w-[200px]"
                    >
                      {it.href}
                    </a>
                  )}
                </div>

                {/* Render fields */}
                {useMultiField ? (
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {Object.entries(it)
                      .filter(([k]) => k !== 'index')
                      .map(([k, v]) => (
                        <div key={k} className="flex flex-col text-[10.5px]">
                          <span className="text-gray-400 dark:text-neutral-500 uppercase text-[9.5px] font-semibold">
                            {k}
                          </span>
                          <span className="text-gray-800 dark:text-neutral-200 truncate">
                            {String(v || '-')}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-700 dark:text-neutral-300 text-[11.5px] leading-relaxed break-words font-sans">
                    {it.text || '(empty)'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
