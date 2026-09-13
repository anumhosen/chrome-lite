import React, { useEffect, useMemo } from 'react';
import { VscSearch, VscTrash, VscGlobe, VscClose, VscHistory } from 'react-icons/vsc';
import { useHistoryBookmarkStore } from '../../stores/useHistoryBookmarkStore';
import { useTabStore } from '../../stores/useTabStore';
import { usePanelStore } from '../../stores/usePanelStore';

export const HistoryPanel: React.FC = () => {
  const { history, searchQuery, setSearchQuery, loadHistory, clearHistory, removeHistoryItem, isLoading } =
    useHistoryBookmarkStore();
  const { navigate } = useTabStore();
  const { closePanel } = usePanelStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return history;
    return history.filter(
      (h) => (h.title && h.title.toLowerCase().includes(q)) || (h.url && h.url.toLowerCase().includes(q))
    );
  }, [history, searchQuery]);

  const formatTime = (ts?: number | string) => {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleClear = () => {
    if (confirm('Clear all browsing history?')) {
      clearHistory();
    }
  };

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Search & Action Bar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex-1 flex items-center bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2.5 h-[28px] focus-within:border-sky-500 transition-colors">
          <VscSearch size={13} className="text-gray-400 dark:text-neutral-500 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history by title or URL..."
            className="flex-1 bg-transparent border-none outline-none text-xs text-gray-800 dark:text-neutral-200 placeholder-gray-400 dark:placeholder-neutral-500"
          />
        </div>
        <button
          onClick={handleClear}
          title="Clear All History"
          className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
        >
          <VscTrash size={12} />
          <span>Clear</span>
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
        {isLoading ? (
          <div className="text-center py-8 text-gray-400 dark:text-neutral-500">Loading history...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-neutral-500">
            {searchQuery ? 'No history matching search.' : 'No browsing history recorded.'}
          </div>
        ) : (
          filtered.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => {
                navigate(item.url);
                closePanel();
              }}
              className="group flex items-center gap-2.5 p-2 rounded bg-white dark:bg-neutral-950/60 border border-gray-200 dark:border-neutral-800/80 hover:bg-gray-100 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors shadow-sm"
            >
              <div className="w-5 h-5 flex items-center justify-center text-gray-400 dark:text-neutral-400 flex-shrink-0">
                <VscGlobe size={14} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className="text-[11.5px] font-medium text-gray-800 dark:text-neutral-200 truncate" title={item.title || item.url}>
                  {item.title || item.url}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-neutral-500 truncate">{item.url}</span>
              </div>
              {(item.visited_at || item.last_visited) && (
                <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-neutral-500 whitespace-nowrap">
                  <VscHistory size={10} />
                  <span>{formatTime(item.visited_at || item.last_visited)}</span>
                </div>
              )}
              {item.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeHistoryItem(item.id!);
                  }}
                  className="w-5 h-5 rounded flex items-center justify-center text-gray-400 dark:text-neutral-500 hover:text-red-500 hover:bg-red-500/15 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from history"
                >
                  <VscClose size={12} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
