import React from 'react';
import { VscGlobe, VscFolder } from 'react-icons/vsc';
import { useHistoryBookmarkStore } from '../../stores/useHistoryBookmarkStore';
import { useTabStore } from '../../stores/useTabStore';

export const BookmarksBar: React.FC = () => {
  const { bookmarks } = useHistoryBookmarkStore();
  const { navigate, createTab } = useTabStore();

  const handleBookmarkClick = (url: string) => {
    navigate(url);
  };

  const handleOpenApps = () => {
    navigate('chrome://apps');
  };

  return (
    <div className="h-[28px] bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex items-center px-3 gap-1 select-none flex-shrink-0 text-xs text-gray-700 dark:text-neutral-300 overflow-x-auto no-scrollbar">
      {/* Apps Launcher Shortcut */}
      <button
        onClick={handleOpenApps}
        title="Open Chrome Lite Apps (chrome://apps)"
        className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors mr-1 flex-shrink-0"
      >
        <div className="grid grid-cols-3 gap-0.5 w-3 h-3 text-gray-500 dark:text-neutral-400">
          {[...Array(9)].map((_, i) => (
            <span key={i} className="w-0.5 h-0.5 rounded-full bg-current" />
          ))}
        </div>
        <span className="text-[11px] font-medium">Apps</span>
      </button>

      <div className="w-[1px] h-3.5 bg-gray-200 dark:bg-neutral-800 mx-0.5" />

      {/* Bookmarks List */}
      <div className="flex items-center gap-0.5 flex-1 min-w-0">
        {bookmarks.length === 0 ? (
          <span className="text-[11px] text-gray-400 dark:text-neutral-500 italic px-2">
            Bookmark pages by clicking the star in the address bar (Ctrl+D)
          </span>
        ) : (
          bookmarks.map((bm) => (
            <button
              key={bm.id}
              onClick={() => handleBookmarkClick(bm.url)}
              title={`${bm.title}\n${bm.url}`}
              className="flex items-center gap-1.5 px-2 py-0.5 max-w-[160px] rounded hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 transition-colors truncate flex-shrink-0"
            >
              <VscGlobe size={12} className="text-gray-400 dark:text-neutral-500 flex-shrink-0" />
              <span className="truncate text-[11px]">{bm.title || bm.url}</span>
            </button>
          ))
        )}
      </div>

      {/* All Bookmarks Button */}
      {bookmarks.length > 0 && (
        <button
          onClick={() => createTab('chrome://bookmarks')}
          title="All Bookmarks"
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors flex-shrink-0 text-[11px]"
        >
          <VscFolder size={12} />
          <span>All Bookmarks</span>
        </button>
      )}
    </div>
  );
};
