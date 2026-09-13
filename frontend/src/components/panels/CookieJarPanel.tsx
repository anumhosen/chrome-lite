import React, { useEffect, useState } from 'react';
import { VscRefresh, VscTrash, VscCloudDownload, VscKey } from 'react-icons/vsc';

interface CookieItem {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  expirationDate?: number;
}

export const CookieJarPanel: React.FC = () => {
  const [cookies, setCookies] = useState<CookieItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCookies = async () => {
    if (!window.chrome?.cookies?.get) return;
    setLoading(true);
    try {
      const list = await window.chrome.cookies.get({});
      setCookies(list || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCookies();
  }, []);

  const handleDelete = async (cookie: CookieItem) => {
    const protocol = cookie.secure ? 'https://' : 'http://';
    const domain = (cookie.domain || 'localhost').replace(/^\./, '');
    const url = `${protocol}${domain}${cookie.path || '/'}`;
    if (window.chrome?.cookies?.remove) {
      await window.chrome.cookies.remove(url, cookie.name);
      await fetchCookies();
    }
  };

  const handleExport = async () => {
    if (!window.chrome?.cookies?.export) return;
    try {
      const res = await window.chrome.cookies.export();
      const text = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chrome-cookies-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const filtered = cookies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.domain && c.domain.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full gap-3 text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          Active Cookie Jar ({cookies.length})
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchCookies}
            disabled={loading}
            title="Refresh Cookies"
            className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <VscRefresh size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExport}
            disabled={cookies.length === 0}
            title="Export Cookies as JSON"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors text-[11px]"
          >
            <VscCloudDownload size={12} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter by name or domain..."
        className="bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-neutral-200 outline-none focus:border-sky-500 text-xs"
      />

      <div className="flex-1 overflow-y-auto flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 text-xs">
            {cookies.length === 0 ? 'No cookies stored in session.' : 'No cookies match your filter.'}
          </div>
        ) : (
          filtered.map((c, i) => (
            <div
              key={`${c.domain}-${c.name}-${i}`}
              className="p-2.5 rounded bg-neutral-950 border border-neutral-800 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-neutral-200 text-xs truncate max-w-[200px]">
                  <VscKey size={13} className="text-amber-400 flex-shrink-0" />
                  <span className="truncate">{c.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(c)}
                  title="Delete Cookie"
                  className="p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                >
                  <VscTrash size={12} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10.5px] text-neutral-400 font-mono">
                <span className="truncate max-w-[150px]">{c.domain || 'localhost'}</span>
                <span>{c.path || '/'}</span>
                {c.secure && <span className="text-emerald-400">Secure</span>}
                {c.httpOnly && <span className="text-sky-400">HttpOnly</span>}
              </div>

              <div className="p-1.5 rounded bg-neutral-900 border border-neutral-800/80 font-mono text-[10px] text-neutral-300 break-all select-all">
                {c.value.length > 80 ? `${c.value.slice(0, 80)}...` : c.value}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
