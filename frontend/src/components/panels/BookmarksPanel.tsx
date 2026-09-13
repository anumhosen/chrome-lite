import React, { useEffect } from 'react';
import { VscStarFull, VscTrash } from 'react-icons/vsc';
import { useHistoryBookmarkStore } from '../../stores/useHistoryBookmarkStore';
import { useTabStore } from '../../stores/useTabStore';
import { usePanelStore } from '../../stores/usePanelStore';

export const BookmarksPanel: React.FC = () => {
  const { bookmarks, loadBookmarks, removeBookmark } = useHistoryBookmarkStore();
  const { navigate } = useTabStore();
  const { closePanel } = usePanelStore();

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
        {bookmarks.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            No bookmarks saved yet. Click the star in the address bar to bookmark any page.
          </div>
        ) : (
          bookmarks.map((bm) => (
            <div
              key={bm.id}
              onClick={() => {
                navigate(bm.url);
                closePanel();
              }}
              className="group flex items-center gap-2.5 p-2 rounded bg-neutral-950/60 border border-neutral-800/80 hover:bg-neutral-800/50 cursor-pointer transition-colors"
            >
              <div className="w-5 h-5 flex items-center justify-center text-amber-400 flex-shrink-0">
                <VscStarFull size={14} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className="text-[11.5px] font-medium text-neutral-200 truncate" title={bm.title || bm.url}>
                  {bm.title || bm.url}
                </span>
                <span className="text-[10px] text-neutral-500 truncate">{bm.url}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeBookmark(bm.id);
                }}
                className="w-5 h-5 rounded flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-red-500/15 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete bookmark"
              >
                <VscTrash size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
