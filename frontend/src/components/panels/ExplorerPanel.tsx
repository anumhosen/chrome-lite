import React, { useState, useEffect } from 'react';
import { VscRefresh, VscListFlat, VscFileMedia, VscFolder, VscCloudDownload, VscChecklist } from 'react-icons/vsc';
import { useTabBindingStore } from '../../stores/useTabBindingStore';
import { TabBindingBar } from '../common/TabBindingBar';
import type { ChromeAsset } from '../../types/chrome';
import { ExplorerGridView } from './explorer/ExplorerGridView';
import { ExplorerDetailsView } from './explorer/ExplorerDetailsView';
import { ExplorerTreeView } from './explorer/ExplorerTreeView';
import { ExplorerPreviewModal } from './explorer/ExplorerPreviewModal';

export const ExplorerPanel: React.FC = () => {
  const { getBoundTab } = useTabBindingStore();
  const boundTab = getBoundTab();
  const boundTabId = boundTab?.id || null;

  const [assets, setAssets] = useState<ChromeAsset[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'details' | 'tree'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewAsset, setPreviewAsset] = useState<ChromeAsset | null>(null);
  const [scanStatus, setScanStatus] = useState<{ message: string; isError?: boolean } | null>(null);

  const loadAssets = async () => {
    if (!boundTabId || !window.chrome?.explorer) return;
    setIsLoading(true);
    try {
      const res = await window.chrome.explorer.getAssets({ tabId: boundTabId });
      setAssets(Array.isArray(res) ? res : []);
    } catch {
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const scanPage = async () => {
    if (!boundTabId || !window.chrome?.explorer) return;
    setIsLoading(true);
    setScanStatus(null);
    try {
      const res = await window.chrome.explorer.scanPage(boundTabId);
      const list = Array.isArray(res) ? res : [];
      setAssets(list);
      setScanStatus({ message: `Scanned: found ${list.length} asset${list.length === 1 ? '' : 's'}` });
      setTimeout(() => setScanStatus(null), 4000);
    } catch (err: any) {
      console.error("Asset scan failed:", err);
      setScanStatus({ message: err?.message || "Scan failed", isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAssets(); setSelectedIds(new Set()); setScanStatus(null); }, [boundTabId]);

  const filtered = assets.filter((a) => (filterType === 'all' ? true : a.type === filterType));
  const allFilteredSelected = filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id || a.url));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectMultiple = (ids: string[], select: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (select ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(allFilteredSelected ? new Set() : new Set(filtered.map((a) => a.id || a.url)));
  };

  const handleDownloadSelected = async () => {
    const selectedAssets = assets.filter((a) => selectedIds.has(a.id || a.url));
    if (selectedAssets.length === 0 || !window.chrome?.downloads?.batchQueue) return;
    try {
      await window.chrome.downloads.batchQueue(selectedAssets);
      alert(`Queued ${selectedAssets.length} assets for download! Check the Downloads panel.`);
      setSelectedIds(new Set());
    } catch (err: any) { alert(`Download failed: ${err.message}`); }
  };

  const handleDownloadSingle = async (asset: ChromeAsset) => {
    if (!window.chrome?.downloads?.batchQueue) return;
    try {
      await window.chrome.downloads.batchQueue([asset]);
      alert(`Download started for ${asset.url.split('/').pop() || 'asset'}`);
    } catch (err: any) { alert(`Download error: ${err.message}`); }
  };


  return (
    <div className="flex flex-col h-full gap-2 select-none">
      {/* Target Tab Binding Bar */}
      <TabBindingBar />

      {/* Ribbon */}
      <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          <button
            onClick={scanPage}
            disabled={!boundTabId}
            title={boundTabId ? "Scan Page Assets" : "Select a target tab to scan"}
            className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded text-[11px] font-medium transition-colors"
          >
            <VscRefresh size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>Scan Page</span>
          </button>

          {/* View Toggles */}
          <div className="flex items-center bg-gray-100 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-neutral-300'}`}
            >
              <VscFileMedia size={13} />
            </button>
            <button
              onClick={() => setViewMode('details')}
              title="Details View"
              className={`p-1 rounded ${viewMode === 'details' ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-neutral-300'}`}
            >
              <VscListFlat size={13} />
            </button>
            <button
              onClick={() => setViewMode('tree')}
              title="Tree View"
              className={`p-1 rounded ${viewMode === 'tree' ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-neutral-300'}`}
            >
              <VscFolder size={13} />
            </button>
          </div>

          {scanStatus && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded transition-opacity ${scanStatus.isError
                ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}
            >
              {scanStatus.message}
            </span>
          )}
        </div>

        {/* Download Selected Action */}
        <button
          onClick={handleDownloadSelected}
          disabled={selectedIds.size === 0}
          title="Download all selected assets"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-medium text-[11px] transition-colors"
        >
          <VscCloudDownload size={13} />
          <span>Download ({selectedIds.size})</span>
        </button>
      </div>

      {/* Select All Ribbon & Filter Pills */}
      <div className="flex items-center justify-between gap-1 text-[10.5px]">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {['all', 'image', 'video', 'css', 'js'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2 py-0.5 rounded capitalize ${filterType === type
                ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-semibold'
                : 'bg-gray-100 dark:bg-neutral-950 text-gray-600 dark:text-neutral-400 border border-gray-200 dark:border-neutral-800 hover:text-gray-900 dark:hover:text-neutral-200'
                }`}
            >
              {type}
            </button>
          ))}
        </div>

        <button
          onClick={toggleSelectAll}
          className="flex items-center gap-1 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          title={allFilteredSelected ? 'Deselect all' : 'Select all'}
        >
          <VscChecklist size={12} className={allFilteredSelected ? 'text-sky-500 dark:text-sky-400' : ''} />
          <span>{allFilteredSelected ? 'None' : 'All'}</span>
        </button>
      </div>

      {/* Viewport */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-neutral-500 text-xs">
            {isLoading ? 'Scanning assets...' : !boundTabId ? 'Select a web tab above to explore assets.' : 'No assets found. Click "Scan Page" to extract.'}
          </div>
        ) : viewMode === 'grid' ? (
          <ExplorerGridView
            assets={filtered}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onPreview={setPreviewAsset}
          />
        ) : viewMode === 'details' ? (
          <ExplorerDetailsView
            assets={filtered}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onPreview={setPreviewAsset}
          />
        ) : (
          <ExplorerTreeView
            assets={filtered}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectMultiple={selectMultiple}
            onPreview={setPreviewAsset}
          />
        )}
      </div>

      {/* Deep Preview Modal */}
      <ExplorerPreviewModal
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
        onDownload={handleDownloadSingle}
      />
    </div>
  );
};
