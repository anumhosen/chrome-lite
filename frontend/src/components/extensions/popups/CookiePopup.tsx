import React, { useState, useEffect } from 'react';
import { VscDatabase, VscTrash, VscClose, VscLinkExternal } from 'react-icons/vsc';
import { useTabStore } from '../../../stores/useTabStore';
import { useExtensionStore } from '../../../stores/useExtensionStore';

export const CookiePopup: React.FC = () => {
  const { tabs, activeTabId, createTab } = useTabStore();
  const { closePopup } = useExtensionStore();
  const [cookies, setCookies] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeUrl = activeTab?.url || '';

  let hostname = '';
  try {
    if (activeUrl && !activeUrl.startsWith('chrome://') && !activeUrl.startsWith('about:')) {
      hostname = new URL(activeUrl).hostname;
    }
  } catch { }

  const fetchCookies = async () => {
    if (!hostname || !window.chrome?.cookies?.get) return;
    setLoading(true);
    try {
      const res = await window.chrome.cookies.get({ domain: hostname });
      setCookies(Array.isArray(res) ? res : []);
    } catch {
      setCookies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCookies();
  }, [hostname]);

  const handleDelete = async (cookie: any) => {
    if (window.chrome?.cookies?.remove) {
      const url = `http${cookie.secure ? 's' : ''}://${cookie.domain?.replace(/^\./, '') || hostname}${cookie.path || '/'}`;
      await window.chrome.cookies.remove(url, cookie.name);
      setCookies((prev) => prev.filter((c) => c.name !== cookie.name));
    }
  };

  const handleOpenManager = () => {
    createTab('chrome://cookies');
    closePopup();
  };

  const filtered = cookies.filter((c) =>
    (c.name || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="w-[320px] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-800 p-4 select-none text-xs text-gray-800 dark:text-neutral-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <VscDatabase size={15} />
          </div>
          <span className="font-semibold text-sm text-gray-900 dark:text-neutral-100">Cookie Jar</span>
        </div>
        <button
          onClick={closePopup}
          className="w-5 h-5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 transition-colors"
        >
          <VscClose size={14} />
        </button>
      </div>

      {/* Domain */}
      <div className="py-2.5 flex items-center justify-between">
        <span className="text-[11px] text-gray-500 dark:text-neutral-400 truncate max-w-[200px]" title={hostname || 'No site'}>
          {hostname ? `Domain: ${hostname}` : 'No active domain'}
        </span>
        <span className="text-[10px] font-medium bg-gray-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-neutral-300">
          {cookies.length} cookies
        </span>
      </div>

      {/* Filter */}
      {cookies.length > 0 && (
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter cookies..."
          className="w-full bg-gray-100 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2.5 py-1 text-xs mb-2 outline-none focus:border-sky-500 text-gray-900 dark:text-neutral-100"
        />
      )}

      {/* Cookie List */}
      <div className="max-h-[180px] overflow-y-auto space-y-1 my-1">
        {loading ? (
          <div className="text-center py-4 text-gray-400 text-xs">Loading cookies...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-xs">No cookies found for this site</div>
        ) : (
          filtered.map((c, i) => (
            <div
              key={`${c.name}-${i}`}
              className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50 dark:hover:bg-neutral-800/60 transition-colors"
            >
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-mono text-[11px] font-medium text-gray-900 dark:text-neutral-200 truncate" title={c.name}>
                  {c.name}
                </span>
                <span className="text-[9.5px] text-gray-400 truncate font-mono" title={String(c.value)}>
                  {String(c.value).slice(0, 24)}...
                </span>
              </div>
              <button
                onClick={() => handleDelete(c)}
                title="Delete cookie"
                className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex-shrink-0"
              >
                <VscTrash size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-gray-100 dark:border-neutral-800 mt-2">
        <button
          onClick={handleOpenManager}
          className="w-full py-1.5 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 font-medium text-xs text-gray-700 dark:text-neutral-300 flex items-center justify-center gap-1.5 transition-colors"
        >
          <VscLinkExternal size={13} />
          <span>Open Full Cookie Jar</span>
        </button>
      </div>
    </div>
  );
};
