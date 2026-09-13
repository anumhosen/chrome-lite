import React, { useState, useEffect } from 'react';
import { VscCode, VscClose, VscLinkExternal } from 'react-icons/vsc';
import { useTabStore } from '../../../stores/useTabStore';
import { useExtensionStore } from '../../../stores/useExtensionStore';

export const UserscriptsPopup: React.FC = () => {
  const { createTab } = useTabStore();
  const { closePopup } = useExtensionStore();
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.chrome?.userscripts?.getAll) {
      setLoading(true);
      window.chrome.userscripts.getAll().then((list: any[]) => {
        setScripts(Array.isArray(list) ? list : []);
      }).catch(() => {
        setScripts([]);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, []);

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    const next = !currentEnabled;
    setScripts((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: next } : s)));
    if (window.chrome?.userscripts?.toggle) {
      await window.chrome.userscripts.toggle(id, next);
    }
  };

  const handleOpenManager = () => {
    createTab('chrome://userscripts');
    closePopup();
  };

  return (
    <div className="w-[300px] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-800 p-4 select-none text-xs text-gray-800 dark:text-neutral-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <VscCode size={15} />
          </div>
          <span className="font-semibold text-sm text-gray-900 dark:text-neutral-100">Userscript Engine</span>
        </div>
        <button
          onClick={closePopup}
          className="w-5 h-5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 transition-colors"
        >
          <VscClose size={14} />
        </button>
      </div>

      {/* Script List */}
      <div className="py-2">
        <div className="text-[11px] text-gray-500 dark:text-neutral-400 mb-2">Installed Userscripts:</div>
        <div className="max-h-[180px] overflow-y-auto space-y-1.5">
          {loading ? (
            <div className="text-center py-4 text-gray-400 text-xs">Loading scripts...</div>
          ) : scripts.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-xs">No userscripts installed</div>
          ) : (
            scripts.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-neutral-950 border border-gray-200/80 dark:border-neutral-800/80"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-medium text-xs text-gray-900 dark:text-neutral-200 truncate">{s.name}</span>
                  <span className="text-[10px] text-gray-400 truncate">{s.match || 'All sites'}</span>
                </div>
                <button
                  onClick={() => handleToggle(s.id, s.enabled)}
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors flex-shrink-0 ${
                    s.enabled ? 'bg-sky-600' : 'bg-gray-300 dark:bg-neutral-700'
                  }`}
                >
                  <span
                    className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                      s.enabled ? 'translate-x-3.5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-gray-100 dark:border-neutral-800 mt-2 flex gap-2">
        <button
          onClick={handleOpenManager}
          className="flex-1 py-1.5 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 font-medium text-xs text-gray-700 dark:text-neutral-300 flex items-center justify-center gap-1.5 transition-colors"
        >
          <VscLinkExternal size={13} />
          <span>Manager</span>
        </button>
      </div>
    </div>
  );
};
