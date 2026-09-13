import React, { useEffect } from 'react';
import {
  VscPlay,
  VscAdd,
  VscSave,
  VscFolderOpened,
  VscNewFile,
  VscLinkExternal,
  VscClearAll,
  VscGlobe,
  VscLoading,
  VscLibrary,
  VscFileCode,
  VscCloudDownload,
} from 'react-icons/vsc';
import { useNotebookStore } from '../../stores/useNotebookStore';
import { useTabBindingStore } from '../../stores/useTabBindingStore';
import { TabBindingBar } from '../common/TabBindingBar';
import { NotebookCellComponent } from './notebook/NotebookCellComponent';
import { NotebookLibraryModal } from './NotebookLibraryModal';

export const NotebookPanel: React.FC = () => {
  const {
    title,
    setTitle,
    cells,
    activeCellId,
    setActiveCellId,
    targetDomain,
    autoRunDomain,
    setAutoRunDomain,
    isRunningAll,
    libraryFiles,
    isLibraryOpen,
    addCell,
    clearAllOutputs,
    runAllCells,
    newNotebook,
    openFileDialog,
    saveFileDialog,
    openLibrary,
    closeLibrary,
    loadScript,
    syncActiveTabDomain,
    exportAsIpynb,
    exportAsHtml,
  } = useNotebookStore();

  const { getBoundTab } = useTabBindingStore();
  const boundTab = getBoundTab();
  const boundTabId = boundTab?.id || null;

  // Auto-sync target domain with bound tab
  useEffect(() => {
    if (boundTab?.url) {
      syncActiveTabDomain(boundTab.url);
    }
  }, [boundTab?.url, syncActiveTabDomain]);

  const handleRunAll = () => {
    if (boundTabId) {
      runAllCells(boundTabId);
    }
  };

  const handleExportIpynb = async () => {
    const content = exportAsIpynb();
    const baseName = (title || 'notebook').replace(/\.[^/.]+$/, '');
    const filename = `${baseName}.ipynb`;
    if (window.chrome?.notebook?.chooseFileSave) {
      try {
        await window.chrome.notebook.chooseFileSave(content, filename);
        return;
      } catch { }
    }
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHtml = () => {
    const content = exportAsHtml();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      const a = document.createElement('a');
      a.href = url;
      a.download = (title || 'notebook').replace(/\.[^/.]+$/, '') + '.html';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getDomainDisplay = () => {
    if (targetDomain) return targetDomain;
    if (boundTab?.url) {
      try {
        const u = new URL(boundTab.url);
        return u.hostname || boundTab.url;
      } catch {
        return boundTab.url;
      }
    }
    return 'about:blank';
  };

  return (
    <div className="flex flex-col h-full gap-2 select-none">
      {/* Target Tab Binding Bar */}
      <TabBindingBar />

      {/* Top Google Colab / Jupyter Header */}
      <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-200 dark:border-neutral-800">
        {/* Row 1: File Title & System Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono tracking-tight">
              .ijsnb
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="notebook.ijsnb"
              className="flex-1 bg-transparent hover:bg-gray-100 dark:hover:bg-neutral-800/60 focus:bg-white dark:focus:bg-neutral-900 px-1.5 py-0.5 rounded border border-transparent focus:border-sky-500 font-semibold text-xs text-gray-900 dark:text-neutral-100 outline-none truncate transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => saveFileDialog(false)}
              title="Save (.ijsnb)"
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 rounded text-[11px] font-medium transition-colors border border-gray-200 dark:border-neutral-700"
            >
              <VscSave size={12} />
              <span>Save</span>
            </button>
            <button
              onClick={openFileDialog}
              title="Open .ijsnb File"
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 rounded text-[11px] font-medium transition-colors border border-gray-200 dark:border-neutral-700"
            >
              <VscFolderOpened size={12} />
              <span>Open</span>
            </button>
            <button
              onClick={openLibrary}
              title="Notebook Library"
              className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-transparent hover:border-gray-200 dark:hover:border-neutral-700"
            >
              <VscLibrary size={13} />
            </button>
            <button
              onClick={newNotebook}
              title="New Notebook"
              className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-transparent hover:border-gray-200 dark:hover:border-neutral-700"
            >
              <VscNewFile size={13} />
            </button>
            <button
              onClick={() => window.chrome?.notebook?.openFloating()}
              title="Pop out Floating Window"
              className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              <VscLinkExternal size={13} />
            </button>
          </div>
        </div>

        {/* Row 2: Colab Primary Controls Bar */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => addCell('code', activeCellId || undefined)}
              className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 rounded text-[11px] font-medium transition-colors shadow-sm"
            >
              <VscAdd size={12} />
              <span>+ Code</span>
            </button>
            <button
              onClick={() => addCell('markdown', activeCellId || undefined)}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded text-[11px] font-medium transition-colors shadow-sm"
            >
              <VscAdd size={12} />
              <span>+ Text</span>
            </button>
            <button
              onClick={handleRunAll}
              disabled={isRunningAll}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-[11px] font-medium transition-colors shadow-sm"
            >
              {isRunningAll ? <VscLoading size={12} className="animate-spin" /> : <VscPlay size={12} />}
              <span>Run all</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={clearAllOutputs}
              title="Clear all cell outputs"
              className="flex items-center gap-1 px-2 py-0.5 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 text-[10.5px] rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              <VscClearAll size={12} />
              <span>Clear outputs</span>
            </button>
            <span className="text-gray-300 dark:text-neutral-700">|</span>
            <button
              onClick={handleExportIpynb}
              title="Export as standard Jupyter Notebook (.ipynb)"
              className="flex items-center gap-1 px-1.5 py-0.5 text-gray-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 text-[10.5px] rounded hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <VscFileCode size={12} className="text-amber-500" />
              <span>.ipynb</span>
            </button>
            <button
              onClick={handleExportHtml}
              title="Print to PDF / Export HTML"
              className="flex items-center gap-1 px-1.5 py-0.5 text-gray-600 dark:text-neutral-300 hover:text-sky-600 dark:hover:text-sky-400 text-[10.5px] rounded hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <VscCloudDownload size={12} className="text-sky-500" />
              <span>PDF / HTML</span>
            </button>
          </div>
        </div>

        {/* Row 3: Active Tab Domain Binding Bar */}
        <div className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800/80 text-[11px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <VscGlobe size={13} className="text-emerald-500 flex-shrink-0" />
            <span className="text-gray-500 dark:text-neutral-500 text-[10.5px] flex-shrink-0">Target:</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-medium truncate" title={boundTab?.url}>
              {getDomainDisplay()}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[10px] text-gray-400 dark:text-neutral-500">Auto-run:</span>
            <input
              type="text"
              value={autoRunDomain}
              onChange={(e) => setAutoRunDomain(e.target.value)}
              placeholder="*.example.com"
              className="w-24 px-1.5 py-0.5 rounded bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-neutral-200 text-[10.5px] outline-none focus:border-sky-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Cells List (Colab Style) */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
        {cells.map((cell) => (
          <NotebookCellComponent
            key={cell.id}
            cell={cell}
            activeTabId={boundTabId || undefined}
            isActive={activeCellId === cell.id}
            onSelect={() => setActiveCellId(cell.id)}
          />
        ))}

        {/* Bottom Append Bar */}
        <div className="flex items-center justify-center gap-2 py-4 border-t border-dashed border-gray-200 dark:border-neutral-800 mt-2">
          <button
            onClick={() => addCell('code')}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-200 text-xs font-medium hover:border-sky-500 hover:text-sky-500 shadow-sm transition-colors"
          >
            <VscAdd size={12} />
            <span>+ Code</span>
          </button>
          <button
            onClick={() => addCell('markdown')}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-200 text-xs font-medium hover:border-amber-500 hover:text-amber-500 shadow-sm transition-colors"
          >
            <VscAdd size={12} />
            <span>+ Text</span>
          </button>
        </div>
      </div>

      {/* Library Modal */}
      <NotebookLibraryModal
        isOpen={isLibraryOpen}
        files={libraryFiles}
        onClose={closeLibrary}
        onLoad={loadScript}
      />
    </div>
  );
};
