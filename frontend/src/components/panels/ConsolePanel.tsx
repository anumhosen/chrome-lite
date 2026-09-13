import React, { useState, useEffect, useRef } from 'react';
import {
  VscClearAll,
  VscPlay,
  VscError,
  VscWarning,
  VscInfo,
  VscSearch,
  VscCloudDownload,
  VscCheck,
} from 'react-icons/vsc';
import { TabBindingBar } from '../common/TabBindingBar';
import { useTabBindingStore } from '../../stores/useTabBindingStore';
import { ObjectTree } from './console/ObjectTree';

interface ConsoleEntry {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error' | 'input' | 'result';
  text: string;
  data?: any;
  timestamp: number;
  line?: number;
  source?: string;
}

export const ConsolePanel: React.FC = () => {
  const { getBoundTab } = useTabBindingStore();
  const boundTab = getBoundTab();
  const boundTabId = boundTab?.id || null;

  const [entries, setEntries] = useState<ConsoleEntry[]>([
    {
      id: 'init-1',
      type: 'info',
      text: '[Chrome Console] Developer Console ready. Expressions evaluate in the bound tab context.',
      timestamp: Date.now(),
    },
  ]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [preserveLog, setPreserveLog] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isExported, setIsExported] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  // Listen for console-message from bound tab
  useEffect(() => {
    if (!window.chrome?.on) return;

    const unsubMsg = window.chrome.on('chrome:console-message', (data: any) => {
      if (!data) return;
      if (boundTabId && data.tabId && data.tabId !== boundTabId) return;

      const level = data.level;
      let type: 'log' | 'info' | 'warn' | 'error' = 'log';
      if (level === 2 || level === 'warn') type = 'warn';
      else if (level === 3 || level === 'error') type = 'error';
      else if (level === 1 || level === 'info') type = 'info';

      // Parse JSON data if possible
      let parsedData: any = undefined;
      const msgText = String(data.message || '');
      if (msgText.startsWith('{') || msgText.startsWith('[')) {
        try {
          parsedData = JSON.parse(msgText);
        } catch { }
      }

      setEntries((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type,
          text: msgText,
          data: parsedData,
          timestamp: data.timestamp || Date.now(),
          line: data.line,
          source: data.sourceId,
        },
      ]);
    });

    // Handle tab navigation: clear if preserveLog is false
    const unsubNav = window.chrome.on('chrome:tab-navigated', (navData: any) => {
      if (!preserveLog && navData?.tabId === boundTabId) {
        setEntries([
          {
            id: `nav-${Date.now()}`,
            type: 'info',
            text: `[Navigated to ${navData.url || 'new page'}]`,
            timestamp: Date.now(),
          },
        ]);
      }
    });

    return () => {
      if (typeof unsubMsg === 'function') unsubMsg();
      if (typeof unsubNav === 'function') unsubNav();
    };
  }, [boundTabId, preserveLog]);

  const handleExecute = async () => {
    const code = inputVal.trim();
    if (!code) return;

    const inputEntry: ConsoleEntry = {
      id: `in-${Date.now()}`,
      type: 'input',
      text: `> ${code}`,
      timestamp: Date.now(),
    };

    setHistory((prev) => [...prev, code]);
    setHistoryIndex(-1);
    setInputVal('');

    if (!boundTabId) {
      setEntries((prev) => [
        ...prev,
        inputEntry,
        {
          id: `err-${Date.now()}`,
          type: 'error',
          text: 'Error: No active web tab bound to evaluate expression.',
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    if (!window.chrome?.notebook?.execute) {
      setEntries((prev) => [
        ...prev,
        inputEntry,
        {
          id: `err-${Date.now()}`,
          type: 'error',
          text: 'Error: Execution bridge unavailable.',
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    setEntries((prev) => [...prev, inputEntry]);

    try {
      const res = await window.chrome.notebook.execute(boundTabId, code);
      if (res.success) {
        const rawRes = res.result;
        const isObj = rawRes !== null && typeof rawRes === 'object';
        const outStr = isObj ? JSON.stringify(rawRes, null, 2) : String(rawRes);

        setEntries((prev) => [
          ...prev,
          {
            id: `res-${Date.now()}`,
            type: 'result',
            text: outStr,
            data: isObj ? rawRes : undefined,
            timestamp: Date.now(),
          },
        ]);
      } else {
        setEntries((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            type: 'error',
            text: res.error || 'Execution failed',
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err: any) {
      setEntries((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          type: 'error',
          text: err.message || 'Execution error',
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      if (history.length > 0) {
        e.preventDefault();
        const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex >= 0) {
        e.preventDefault();
        const nextIdx = historyIndex + 1;
        if (nextIdx >= history.length) {
          setHistoryIndex(-1);
          setInputVal('');
        } else {
          setHistoryIndex(nextIdx);
          setInputVal(history[nextIdx] || '');
        }
      }
    }
  };

  const handleExportLog = () => {
    if (entries.length === 0) return;
    const logContent = entries
      .map(
        (e) =>
          `[${new Date(e.timestamp).toISOString()}] [${e.type.toUpperCase()}] ${e.text}${e.source ? ` (${e.source}:${e.line})` : ''
          }`
      )
      .join('\n');

    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chrome-console-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);

    setIsExported(true);
    setTimeout(() => setIsExported(false), 2000);
  };

  const filteredEntries = entries.filter((e) => {
    if (filter === 'error' && e.type !== 'error') return false;
    if (filter === 'warn' && e.type !== 'warn') return false;
    if (filter === 'info' && e.type !== 'info' && e.type !== 'log') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = e.text.toLowerCase().includes(q);
      const matchSource = e.source ? e.source.toLowerCase().includes(q) : false;
      return matchText || matchSource;
    }
    return true;
  });

  const clearConsole = () => {
    setEntries([]);
  };

  return (
    <div className="flex flex-col h-full gap-2 select-none">
      {/* Top: Tab Binding Bar */}
      <TabBindingBar />

      {/* Filter, Search & Action Toolbar */}
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-gray-200 dark:border-neutral-800 text-xs">
        {/* Left: Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${filter === 'all'
              ? 'bg-sky-500 text-white'
              : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${filter === 'error'
              ? 'bg-red-500 text-white'
              : 'text-red-500 hover:bg-red-500/10'
              }`}
          >
            <VscError size={11} />
            <span>Errors</span>
          </button>
          <button
            onClick={() => setFilter('warn')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${filter === 'warn'
              ? 'bg-amber-500 text-white'
              : 'text-amber-500 hover:bg-amber-500/10'
              }`}
          >
            <VscWarning size={11} />
            <span>Warn</span>
          </button>
          <button
            onClick={() => setFilter('info')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${filter === 'info'
              ? 'bg-sky-600 text-white'
              : 'text-sky-600 dark:text-sky-400 hover:bg-sky-500/10'
              }`}
          >
            <VscInfo size={11} />
            <span>Info</span>
          </button>
        </div>

        {/* Center: Search Filter Input */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-xs w-36 max-w-xs focus-within:border-sky-500 transition-colors">
          <VscSearch size={11} className="text-gray-400 dark:text-neutral-500 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter messages..."
            className="w-full bg-transparent border-none outline-none font-mono text-[10.5px] text-gray-800 dark:text-neutral-200 placeholder-gray-400 dark:placeholder-neutral-500"
          />
        </div>

        {/* Right: Preserve Log Checkbox & Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <label className="flex items-center gap-1 text-[10.5px] text-gray-500 dark:text-neutral-400 cursor-pointer hover:text-gray-900 dark:hover:text-neutral-200">
            <input
              type="checkbox"
              checked={preserveLog}
              onChange={(e) => setPreserveLog(e.target.checked)}
              className="accent-sky-500 rounded w-3 h-3 cursor-pointer"
            />
            <span>Preserve log</span>
          </label>

          <button
            onClick={handleExportLog}
            title="Export logs to file"
            className="flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
          >
            {isExported ? <VscCheck size={12} className="text-emerald-500" /> : <VscCloudDownload size={12} />}
            <span>Export</span>
          </button>

          <button
            onClick={clearConsole}
            title="Clear console output"
            className="flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <VscClearAll size={12} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Output Console Log View */}
      <div
        ref={scrollRef}
        className="flex-1 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded p-2 overflow-y-auto font-mono text-[11px] flex flex-col gap-1 select-text"
      >
        {filteredEntries.length === 0 ? (
          <div className="text-gray-400 dark:text-neutral-500 italic py-4 text-center">
            {searchQuery ? 'No matching logs found' : 'Console is empty'}
          </div>
        ) : (
          filteredEntries.map((e) => {
            const isError = e.type === 'error';
            const isWarn = e.type === 'warn';
            const isInput = e.type === 'input';
            const isResult = e.type === 'result';

            return (
              <div
                key={e.id}
                className={`py-0.5 px-1.5 rounded flex items-start gap-1.5 break-all leading-relaxed ${isError
                  ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-l-2 border-red-500'
                  : isWarn
                    ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-l-2 border-amber-500'
                    : isInput
                      ? 'text-sky-600 dark:text-sky-400 font-bold'
                      : isResult
                        ? 'text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-500/50 pl-2'
                        : 'text-gray-800 dark:text-neutral-300'
                  }`}
              >
                <div className="flex-1 min-w-0">
                  {e.data ? (
                    <ObjectTree data={e.data} />
                  ) : (
                    <span>{e.text}</span>
                  )}
                </div>
                {e.source && (
                  <span className="text-[9.5px] text-gray-400 dark:text-neutral-500 flex-shrink-0">
                    {e.source.split('/').pop()}:{e.line}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* REPL Interactive Prompt */}
      <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 h-[30px] focus-within:border-sky-500 transition-colors">
        <span className="text-sky-500 font-bold font-mono text-xs">&gt;</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Evaluate JavaScript in bound tab (e.g. document.title)..."
          className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500"
        />
        <button
          onClick={handleExecute}
          title="Run expression"
          className="w-5 h-5 rounded flex items-center justify-center text-sky-600 dark:text-sky-400 hover:text-sky-700 hover:bg-sky-500/10 transition-colors"
        >
          <VscPlay size={11} />
        </button>
      </div>
    </div>
  );
};
