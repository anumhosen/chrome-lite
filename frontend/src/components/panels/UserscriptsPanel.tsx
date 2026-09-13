import React, { useEffect, useState, useMemo } from 'react';
import CodeMirror, { keymap, Prec } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { VscAdd, VscEdit, VscPlay, VscTrash, VscArrowLeft, VscSave } from 'react-icons/vsc';
import { useTabStore } from '../../stores/useTabStore';
import { useThemeStore } from '../../stores/useThemeStore';

interface ScriptItem {
  id?: string;
  name: string;
  code: string;
  enabled?: boolean | number;
  match_patterns?: string;
}

const DEFAULT_SCRIPT = `// ==UserScript==
// @name         Custom Script
// @match        *://*/*
// @run-at       document-end
// @description  Chrome automation script
// ==/UserScript==

console.log("Chrome Userscript active on:", window.location.href);

// Example GM_* APIs supported in Chrome Lite:
// GM_addStyle("body { border: 2px solid #38bdf8 !important; }");
// GM_setValue("lastVisit", Date.now());
// GM_log("Stored last visit:", GM_getValue("lastVisit"));
`;

export const UserscriptsPanel: React.FC = () => {
  const { theme } = useThemeStore();
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeScript, setActiveScript] = useState<ScriptItem | null>(null);
  const { activeTabId } = useTabStore();

  const loadScripts = async () => {
    if (!window.chrome?.userscripts?.getAll) return;
    try {
      const all = await window.chrome.userscripts.getAll();
      setScripts(all || []);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadScripts();
  }, []);

  const handleToggle = async (id: string, enabled: boolean) => {
    setScripts((prev) => prev.map((s) => (s.id === id ? { ...s, enabled } : s)));
    if (window.chrome?.userscripts?.toggle) await window.chrome.userscripts.toggle(id, enabled);
  };

  const handleRunNow = async (code: string, name: string) => {
    if (!activeTabId || !window.chrome?.notebook?.execute) return;
    try {
      await window.chrome.notebook.execute(activeTabId, code);
      alert(`Injected userscript "${name}" into active tab.`);
    } catch (err: any) { alert(`Execution error: ${err.message}`); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this userscript?')) return;
    if (window.chrome?.userscripts?.delete) { await window.chrome.userscripts.delete(id); await loadScripts(); }
  };

  const handleSave = async () => {
    if (!activeScript || !activeScript.name.trim() || !window.chrome?.userscripts?.save) return;
    await window.chrome.userscripts.save({
      id: activeScript.id,
      name: activeScript.name.trim(),
      code: activeScript.code,
      enabled: activeScript.enabled !== false,
    });
    setIsEditing(false);
    setActiveScript(null);
    await loadScripts();
  };

  const codeMirrorExtensions = useMemo(() => {
    return [
      javascript(),
      Prec.highest(
        keymap.of([
          {
            key: 'Mod-s',
            run: () => {
              handleSave();
              return true;
            },
          },
        ])
      ),
    ];
  }, [activeScript]);

  if (isEditing && activeScript) {
    return (
      <div className="flex flex-col h-full gap-2">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-neutral-800">
          <button
            onClick={() => setIsEditing(false)}
            className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            title="Back to script list"
          >
            <VscArrowLeft size={14} />
          </button>
          <input
            type="text"
            value={activeScript.name}
            onChange={(e) => setActiveScript({ ...activeScript, name: e.target.value })}
            placeholder="Script name..."
            className="flex-1 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 py-1 text-gray-800 dark:text-neutral-200 outline-none focus:border-sky-500 text-xs"
          />
          <button
            onClick={handleSave}
            title="Save script (Ctrl+S)"
            className="flex items-center gap-1 px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors"
          >
            <VscSave size={13} />
            <span>Save</span>
          </button>
        </div>
        <div className="flex-1 border border-gray-200 dark:border-neutral-800 rounded overflow-hidden bg-white dark:bg-neutral-950">
          <CodeMirror
            height="100%"
            value={activeScript.code}
            theme={theme === 'dark' ? 'dark' : 'light'}
            extensions={codeMirrorExtensions}
            onChange={(val) => setActiveScript({ ...activeScript, code: val })}
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              dropCursor: false,
              allowMultipleSelections: false,
              indentOnInput: true,
              tabSize: 2,
            }}
            className="h-full text-xs font-mono"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          Installed Userscripts ({scripts.length})
        </span>
        <button
          onClick={() => {
            setActiveScript({ name: 'New Userscript', code: DEFAULT_SCRIPT, enabled: true });
            setIsEditing(true);
          }}
          className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white transition-colors"
        >
          <VscAdd size={12} />
          <span>New Script</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2">
        {scripts.length === 0 ? (
          <div className="text-center py-10 text-neutral-500 text-xs">
            No userscripts found. Click "+ New Script" to create one.
          </div>
        ) : (
          scripts.map((s) => {
            let patterns = ['*'];
            try {
              if (s.match_patterns) patterns = JSON.parse(s.match_patterns);
            } catch { }

            return (
              <div
                key={s.id || s.name}
                className="p-2.5 rounded bg-neutral-950 border border-neutral-800 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-200 text-xs truncate max-w-[200px]">
                    {s.name}
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(s.enabled)}
                    onChange={(e) => s.id && handleToggle(s.id, e.target.checked)}
                    className="accent-sky-500 rounded"
                    title="Toggle script active state"
                  />
                </div>

                <span className="text-[10px] text-neutral-500 font-mono truncate">
                  {patterns.join(', ')}
                </span>

                <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-900">
                  <button onClick={() => { setActiveScript(s); setIsEditing(true); }} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300">
                    <VscEdit size={11} /> <span>Edit</span>
                  </button>
                  <button onClick={() => handleRunNow(s.code, s.name)} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400">
                    <VscPlay size={11} /> <span>Run</span>
                  </button>
                  <button onClick={() => s.id && handleDelete(s.id)} className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-rose-400 ml-auto" title="Delete Script">
                    <VscTrash size={11} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

