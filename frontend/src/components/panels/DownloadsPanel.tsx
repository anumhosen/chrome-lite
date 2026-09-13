import React, { useEffect, useState } from 'react';
import {
  VscTrash,
  VscFolder,
  VscFolderOpened,
  VscLinkExternal,
  VscCloudDownload,
  VscSearch,
  VscCopy,
  VscCheck,
  VscRefresh,
  VscFile,
} from 'react-icons/vsc';
import {
  FaRegImage,
  FaJs,
  FaCss3Alt,
  FaVideo,
  FaMusic,
  FaFilePdf,
  FaFileArchive,
  FaFileCode,
  FaFileAlt,
} from 'react-icons/fa';
import { useDownloadStore } from '../../stores/useDownloadStore';
import { useTabStore } from '../../stores/useTabStore';
import type { ChromeDownloadItem } from '../../types/chrome';

interface DownloadsPanelProps {
  mode?: 'drawer' | 'tab' | 'popout' | 'sidebar' | 'sidepanel' | 'floating';
}

export const DownloadsPanel: React.FC<DownloadsPanelProps> = ({ mode = 'sidebar' }) => {
  const {
    queue,
    downloads,
    currentTab,
    searchQuery,
    isLoading,
    setTab,
    setSearchQuery,
    refresh,
    clearDownloads,
    clearQueue,
    removeItem,
    openFolder,
    openFile,
    showItem,
    runBatchDownload,
  } = useDownloadStore();

  const { activeTabId, tabs } = useTabStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showBatchTools, setShowBatchTools] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isTabMode = mode === 'tab';
  const isQueueTab = currentTab === 'queue';
  const baseItems = isQueueTab ? queue : downloads;

  const filteredItems = baseItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.filename && item.filename.toLowerCase().includes(q)) ||
      (item.url && item.url.toLowerCase().includes(q)) ||
      (item.domain && item.domain.toLowerCase().includes(q))
    );
  });

  const hasActiveDownloads = downloads.some(
    (d) => d.state === 'progressing' || d.state === 'downloading'
  );

  const getFileIcon = (filename: string, size = 15) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext)) {
      return <FaRegImage size={size} className="text-amber-400 flex-shrink-0" />;
    }
    if (['mp4', 'webm', 'mkv', 'mov', 'avi'].includes(ext)) {
      return <FaVideo size={size} className="text-purple-400 flex-shrink-0" />;
    }
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) {
      return <FaMusic size={size} className="text-rose-400 flex-shrink-0" />;
    }
    if (['pdf'].includes(ext)) {
      return <FaFilePdf size={size} className="text-red-400 flex-shrink-0" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
      return <FaFileArchive size={size} className="text-emerald-400 flex-shrink-0" />;
    }
    if (['js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx'].includes(ext)) {
      return <FaJs size={size} className="text-yellow-400 flex-shrink-0" />;
    }
    if (['css', 'scss', 'sass', 'less'].includes(ext)) {
      return <FaCss3Alt size={size} className="text-sky-400 flex-shrink-0" />;
    }
    if (['html', 'json', 'py', 'rs', 'go', 'cpp', 'c', 'java', 'xml', 'yaml', 'yml'].includes(ext)) {
      return <FaFileCode size={size} className="text-sky-400 flex-shrink-0" />;
    }
    if (['txt', 'md', 'doc', 'docx', 'rtf'].includes(ext)) {
      return <FaFileAlt size={size} className="text-neutral-400 flex-shrink-0" />;
    }
    return <VscFile size={size} className="text-neutral-400 flex-shrink-0" />;
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateStr?: string | number) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleCopyUrl = (item: ChromeDownloadItem) => {
    if (!item.url) return;
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className={`flex flex-col h-full select-none ${isTabMode ? 'gap-4 max-w-5xl mx-auto w-full' : 'gap-2.5'}`}>
      {/* Top Search & Actions Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1">
            <VscSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search downloads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 pl-8 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 hover:text-neutral-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Open Downloads Folder */}
          <button
            onClick={openFolder}
            title="Open Downloads folder in file explorer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded transition-colors whitespace-nowrap"
          >
            <VscFolderOpened size={14} className="text-amber-400" />
            <span className={isTabMode ? 'inline' : 'hidden sm:inline'}>Open Folder</span>
          </button>

          {/* Refresh */}
          <button
            onClick={refresh}
            title="Refresh downloads list"
            className="p-1.5 text-neutral-400 hover:text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded transition-colors"
          >
            <VscRefresh size={13} />
          </button>
        </div>

        {/* Tabs & Batch Actions Toggle */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-1 pt-0.5">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTab('all')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border-b-2 transition-colors ${
                !isQueueTab
                  ? 'text-sky-400 border-sky-500 font-semibold'
                  : 'text-neutral-400 border-transparent hover:text-neutral-200'
              }`}
            >
              <span>All Downloads ({downloads.length})</span>
              {hasActiveDownloads && (
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" title="Download in progress" />
              )}
            </button>

            <button
              onClick={() => setTab('queue')}
              className={`px-2.5 py-1 text-xs font-medium border-b-2 transition-colors ${
                isQueueTab
                  ? 'text-sky-400 border-sky-500 font-semibold'
                  : 'text-neutral-400 border-transparent hover:text-neutral-200'
              }`}
            >
              Batch Queue ({queue.length})
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowBatchTools(!showBatchTools)}
              className="text-[11px] text-neutral-400 hover:text-sky-400 transition-colors px-1 py-0.5"
            >
              {showBatchTools ? 'Hide Scraper' : 'Scrape Page'}
            </button>

            <button
              onClick={isQueueTab ? clearQueue : clearDownloads}
              title={isQueueTab ? 'Clear finished queue items' : 'Clear finished download records'}
              className="flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              <VscTrash size={11} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Batch Page Asset Scraper Bar (Collapsible) */}
      {showBatchTools && (
        <div className="p-2.5 rounded-md bg-neutral-950 border border-neutral-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">
              Batch Save Page Assets ({activeTab?.title?.slice(0, 30) || 'Current Tab'})
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => activeTabId && runBatchDownload('image', activeTabId, activeTab?.url)}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-neutral-900 border border-neutral-800 hover:border-sky-500 rounded text-[11px] font-medium text-neutral-200 transition-colors"
            >
              <FaRegImage size={11} className="text-amber-400" />
              <span>Images</span>
            </button>
            <button
              onClick={() => activeTabId && runBatchDownload('js', activeTabId, activeTab?.url)}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-neutral-900 border border-neutral-800 hover:border-sky-500 rounded text-[11px] font-medium text-neutral-200 transition-colors"
            >
              <FaJs size={11} className="text-yellow-400" />
              <span>Scripts</span>
            </button>
            <button
              onClick={() => activeTabId && runBatchDownload('css', activeTabId, activeTab?.url)}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-neutral-900 border border-neutral-800 hover:border-sky-500 rounded text-[11px] font-medium text-neutral-200 transition-colors"
            >
              <FaCss3Alt size={11} className="text-sky-400" />
              <span>Styles</span>
            </button>
            <button
              onClick={() => activeTabId && runBatchDownload('video', activeTabId, activeTab?.url)}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-neutral-900 border border-neutral-800 hover:border-sky-500 rounded text-[11px] font-medium text-neutral-200 transition-colors"
            >
              <FaVideo size={11} className="text-purple-400" />
              <span>Media</span>
            </button>
          </div>
        </div>
      )}

      {/* Downloads List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
        {isLoading && filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-500 gap-2">
            <VscCloudDownload size={28} className="animate-bounce text-sky-400" />
            <span className="text-xs">Loading downloads...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-500 gap-3 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
              <VscCloudDownload size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-300">
                {searchQuery
                  ? `No downloads match "${searchQuery}"`
                  : isQueueTab
                  ? 'No items in batch queue.'
                  : 'No downloads yet.'}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {searchQuery
                  ? 'Try searching with a different term.'
                  : 'Files you download in the browser will appear here.'}
              </p>
            </div>
            {!searchQuery && !isQueueTab && (
              <button
                onClick={openFolder}
                className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 transition-colors"
              >
                <VscFolderOpened size={13} className="text-amber-400" />
                <span>Open Downloads Folder</span>
              </button>
            )}
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isProgressing = item.state === 'progressing' || item.state === 'downloading';
            const received = item.receivedBytes ?? item.received_bytes ?? 0;
            const total = item.totalBytes ?? item.total_bytes ?? item.size ?? 0;
            const pct = total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0;
            const filePath = item.savePath || item.save_path;
            const isCompleted = item.state === 'completed';
            const isCancelled = item.state === 'cancelled';
            const isFailed = item.state === 'failed';
            const dateStr = formatDate(item.started_at || item.created_at);

            return (
              <div
                key={item.id || idx}
                className={`group flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  isProgressing
                    ? 'bg-neutral-950/80 border-sky-500/40 shadow-sm shadow-sky-500/5'
                    : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/60'
                }`}
              >
                {/* File Icon */}
                <div className="w-9 h-9 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getFileIcon(item.filename, 18)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  {/* Filename & URL */}
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="text-xs font-semibold text-neutral-100 truncate cursor-pointer hover:text-sky-400 transition-colors"
                      title={filePath || item.filename}
                      onClick={() => filePath && isCompleted && openFile(filePath)}
                    >
                      {item.filename || 'download'}
                    </span>
                    {dateStr && (
                      <span className="text-[10px] text-neutral-500 flex-shrink-0 whitespace-nowrap">
                        {dateStr}
                      </span>
                    )}
                  </div>

                  {/* Domain & Size */}
                  <div className="flex items-center gap-1.5 text-[10.5px] text-neutral-400">
                    <span className="truncate max-w-[160px] text-neutral-500" title={item.url}>
                      {item.domain || 'web'}
                    </span>
                    <span>&bull;</span>
                    {isProgressing ? (
                      <span className="text-sky-400 font-medium">
                        {formatBytes(received)} / {total > 0 ? formatBytes(total) : 'unknown'} ({pct}%)
                      </span>
                    ) : (
                      <span>{formatBytes(total || received)}</span>
                    )}
                  </div>

                  {/* Progress Bar (if progressing) */}
                  {isProgressing && (
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-sky-500 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}

                  {/* Save Path preview */}
                  {filePath && isTabMode && (
                    <div className="text-[10px] text-neutral-500 font-mono truncate mt-0.5" title={filePath}>
                      {filePath}
                    </div>
                  )}
                </div>

                {/* Status Badge & Actions */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {/* Status Badge */}
                  <span
                    className={`text-[9.5px] font-semibold uppercase px-2 py-0.5 rounded tracking-wide ${
                      isCompleted
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : isProgressing
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 animate-pulse'
                        : isCancelled
                        ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        : isFailed
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}
                  >
                    {isProgressing ? `Downloading ${pct}%` : item.state}
                  </span>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    {/* Open file */}
                    {filePath && isCompleted && (
                      <button
                        onClick={() => openFile(filePath)}
                        title="Open file"
                        className="p-1.5 rounded text-neutral-400 hover:text-sky-400 hover:bg-neutral-800 transition-colors"
                      >
                        <VscLinkExternal size={13} />
                      </button>
                    )}

                    {/* Show in folder */}
                    {filePath && isCompleted && (
                      <button
                        onClick={() => showItem(filePath)}
                        title="Show in folder"
                        className="p-1.5 rounded text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                      >
                        <VscFolder size={13} />
                      </button>
                    )}

                    {/* Copy URL */}
                    {item.url && (
                      <button
                        onClick={() => handleCopyUrl(item)}
                        title={copiedId === item.id ? 'Copied URL!' : 'Copy download URL'}
                        className="p-1.5 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                      >
                        {copiedId === item.id ? <VscCheck size={13} className="text-emerald-400" /> : <VscCopy size={13} />}
                      </button>
                    )}

                    {/* Delete / Remove item */}
                    {item.id && (
                      <button
                        onClick={() => removeItem(item.id)}
                        title="Remove from list"
                        className="p-1.5 rounded text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <VscTrash size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

