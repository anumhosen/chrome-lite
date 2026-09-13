import React, { useEffect } from 'react';
import { VscTrash, VscFile, VscFolder, VscLinkExternal } from 'react-icons/vsc';
import { FaRegImage, FaJs, FaCss3Alt, FaVideo, FaMusic } from 'react-icons/fa';
import { useDownloadStore } from '../../stores/useDownloadStore';
import { useTabStore } from '../../stores/useTabStore';

export const DownloadsPanel: React.FC = () => {
  const { queue, history, currentTab, setTab, refresh, clearQueue, openFile, showItem, runBatchDownload, isLoading } =
    useDownloadStore();
  const { activeTabId, tabs } = useTabStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  useEffect(() => { refresh(); }, [refresh]);

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return <FaRegImage size={14} className="text-amber-400" />;
    if (['js', 'mjs', 'ts'].includes(ext)) return <FaJs size={14} className="text-yellow-400" />;
    if (['css', 'scss'].includes(ext)) return <FaCss3Alt size={14} className="text-sky-400" />;
    if (['mp4', 'webm', 'mov'].includes(ext)) return <FaVideo size={14} className="text-purple-400" />;
    if (['mp3', 'wav', 'ogg'].includes(ext)) return <FaMusic size={14} className="text-rose-400" />;
    return <VscFile size={14} className="text-neutral-400" />;
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const items = currentTab === 'active' ? queue : history;

  return (
    <div className="flex flex-col h-full gap-2.5 select-none">
      {/* Batch Actions Box */}
      <div className="p-2 rounded-md bg-neutral-950 border border-neutral-800 flex flex-col gap-1.5">
        <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">
          Batch Download Active Page Assets
        </span>
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

      {/* Tabs & Clear Action */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTab('active')}
            className={`px-2.5 py-1 text-xs font-medium border-b-2 transition-colors ${
              currentTab === 'active' ? 'text-sky-400 border-sky-500 font-semibold' : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            Queue ({queue.length})
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-2.5 py-1 text-xs font-medium border-b-2 transition-colors ${
              currentTab === 'history' ? 'text-sky-400 border-sky-500 font-semibold' : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            History ({history.length})
          </button>
        </div>

        <button
          onClick={clearQueue}
          title="Clear Finished Queue"
          className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
        >
          <VscTrash size={11} />
          <span>Clear</span>
        </button>
      </div>

      {/* Downloads List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
        {isLoading ? (
          <div className="text-center py-8 text-neutral-500">Loading downloads...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            {currentTab === 'active' ? 'No active downloads in queue.' : 'No past download history found.'}
          </div>
        ) : (
          items.map((item, idx) => {
            const isProgressing = item.state === 'progressing' || item.state === 'downloading';
            const pct = item.total_bytes && item.received_bytes
              ? Math.min(100, Math.round((item.received_bytes / item.total_bytes) * 100))
              : 0;

            return (
              <div
                key={item.id || idx}
                className="flex items-center gap-2 p-2 rounded bg-neutral-950/60 border border-neutral-800/80 hover:bg-neutral-800/50 transition-colors"
              >
                <div className="w-7 h-7 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center flex-shrink-0">
                  {getFileIcon(item.filename)}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-[11.5px] font-medium text-neutral-200 truncate" title={item.filename}>
                    {item.filename}
                  </span>
                  <span className="text-[10px] text-neutral-500 truncate">
                    {item.domain || 'web'} &bull; {formatBytes(item.received_bytes || item.total_bytes || item.size)}
                  </span>
                  {isProgressing && (
                    <div className="w-full h-1 bg-neutral-800 rounded overflow-hidden mt-0.5">
                      <div className="h-full bg-sky-500 transition-all duration-200" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.save_path && item.state === 'completed' && (
                    <>
                      <button
                        onClick={() => openFile(item.save_path)}
                        title="Open downloaded file"
                        className="p-1 rounded text-neutral-400 hover:text-sky-400 hover:bg-neutral-800 transition-colors"
                      >
                        <VscLinkExternal size={13} />
                      </button>
                      <button
                        onClick={() => showItem(item.save_path)}
                        title="Reveal file in folder"
                        className="p-1 rounded text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                      >
                        <VscFolder size={13} />
                      </button>
                    </>
                  )}
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wide ${
                      item.state === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : isProgressing
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}
                  >
                    {item.state}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
