import React, { useState } from 'react';
import { VscTrash } from 'react-icons/vsc';

interface GenericPanelProps {
  panel: string;
  title: string;
}

export const GenericPanel: React.FC<GenericPanelProps> = ({ panel, title }) => {
  const [logs, setLogs] = useState<string[]>([
    '[System] Chrome Developer Environment v0.2 ready.',
    '[Info] React + Vite + TypeScript + Zustand interface active.',
  ]);

  const clearLogs = () => {
    setLogs(['[System] Console cleared.']);
  };

  if (panel === 'console') {
    return (
      <div className="flex flex-col h-full gap-2">
        <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase">Browser Output</span>
          <button
            onClick={clearLogs}
            className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white"
          >
            <VscTrash size={11} />
            <span>Clear</span>
          </button>
        </div>
        <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded p-2 overflow-y-auto font-mono text-xs flex flex-col gap-1">
          {logs.map((log, i) => (
            <div key={i} className="text-neutral-300">
              {log}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (panel === 'settings') {
    return (
      <div className="flex flex-col gap-4 text-xs">
        <div className="flex flex-col gap-2 p-3 bg-neutral-950 border border-neutral-800 rounded-md">
          <span className="font-semibold text-neutral-200">Default Search Engine</span>
          <select className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 outline-none">
            <option value="google">Google (Default)</option>
            <option value="duckduckgo">DuckDuckGo</option>
            <option value="bing">Bing</option>
            <option value="brave">Brave</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 p-3 bg-neutral-950 border border-neutral-800 rounded-md">
          <span className="font-semibold text-neutral-200">Privacy & Blocker</span>
          <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
            <input type="checkbox" defaultChecked className="accent-sky-500 rounded" />
            <span>Enable built-in ad & tracker blocker</span>
          </label>
        </div>

        <div className="flex flex-col gap-2 p-3 bg-neutral-950 border border-neutral-800 rounded-md">
          <span className="font-semibold text-neutral-200">Theme</span>
          <span className="text-neutral-400 text-[11px]">Dark Theme (Tailwind Grayscale VS Code Slate)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12 text-neutral-500 gap-2">
      <span className="text-neutral-300 font-medium">{title}</span>
      <span className="text-[11px]">Panel module active and ready.</span>
    </div>
  );
};
