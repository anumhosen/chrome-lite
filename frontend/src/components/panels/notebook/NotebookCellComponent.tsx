import React, { useState, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import {
  VscPlay,
  VscLoading,
  VscCheck,
  VscClose,
  VscArrowUp,
  VscArrowDown,
  VscTrash,
  VscEdit,
  VscEye,
  VscCode,
  VscMarkdown,
  VscCopy,
  VscAdd,
  VscTable,
} from 'react-icons/vsc';
import { useNotebookStore, type NotebookCell } from '../../../stores/useNotebookStore';
import { useThemeStore } from '../../../stores/useThemeStore';
import { MarkdownRenderer } from './MarkdownRenderer';

interface NotebookCellProps {
  cell: NotebookCell;
  activeTabId?: string;
  isActive: boolean;
  onSelect: () => void;
}

export const NotebookCellComponent: React.FC<NotebookCellProps> = ({
  cell,
  activeTabId,
  isActive,
  onSelect,
}) => {
  const { theme } = useThemeStore();
  const {
    updateCellSource,
    setCellEditingText,
    removeCell,
    moveCell,
    toggleCellType,
    clearCellOutput,
    runCell,
    addCell,
  } = useNotebookStore();

  const [isCopied, setIsCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'raw'>('table');

  const lineCount = (cell.source || '').split('\n').length;
  const editorHeight = Math.max(64, Math.min(480, lineCount * 19 + 18));

  // Detect if output is an array of objects for tabular visualization
  const tabularData = useMemo(() => {
    if (!cell.outputStr) return null;
    try {
      const parsed = JSON.parse(cell.outputStr);
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        typeof parsed[0] === 'object' &&
        parsed[0] !== null &&
        !Array.isArray(parsed[0])
      ) {
        const columns = Array.from(
          new Set(parsed.slice(0, 50).flatMap((item) => (item && typeof item === 'object' ? Object.keys(item) : [])))
        );
        if (columns.length > 0) {
          return { rows: parsed, columns };
        }
      }
    } catch {}
    return null;
  }, [cell.outputStr]);

  const handleRun = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    runCell(cell.id, activeTabId);
  };

  const handleCopyOutput = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cell.outputStr) {
      navigator.clipboard.writeText(cell.outputStr);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  };

  return (
    <div
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={`group relative rounded-lg border transition-all flex flex-col bg-white dark:bg-neutral-900 ${
        isActive
          ? 'border-sky-500/80 shadow-md ring-1 ring-sky-500/30'
          : 'border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700'
      }`}
    >
      {/* Top Hover Controls Bar (Colab Style) */}
      <div className="flex items-center justify-between px-2.5 py-1 border-b border-gray-100 dark:border-neutral-800/80 bg-gray-50/50 dark:bg-neutral-950/40 rounded-t-lg text-[10.5px]">
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-neutral-400">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCellType(cell.id);
            }}
            title={`Switch to ${cell.cell_type === 'code' ? 'Markdown Text' : 'Code'} cell`}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-300 font-medium"
          >
            {cell.cell_type === 'code' ? <VscCode size={12} className="text-sky-500" /> : <VscMarkdown size={12} className="text-amber-500" />}
            <span className="capitalize">{cell.cell_type}</span>
          </button>
          {cell.cell_type === 'code' && cell.execution_count !== null && cell.execution_count !== undefined && (
            <span className="text-gray-400 dark:text-neutral-500 font-mono text-[10px]">
              [{cell.execution_count}]
            </span>
          )}
          {cell.durationMs !== null && cell.durationMs !== undefined && (
            <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-mono">
              {cell.durationMs}ms
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
          {cell.cell_type === 'markdown' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCellEditingText(cell.id, !cell.isEditingText);
              }}
              title={cell.isEditingText ? 'Preview Markdown' : 'Edit Markdown'}
              className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-800"
            >
              {cell.isEditingText ? <VscEye size={12} /> : <VscEdit size={12} />}
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              moveCell(cell.id, 'up');
            }}
            title="Move Cell Up"
            className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-800"
          >
            <VscArrowUp size={12} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              moveCell(cell.id, 'down');
            }}
            title="Move Cell Down"
            className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-800"
          >
            <VscArrowDown size={12} />
          </button>

          {cell.cell_type === 'code' && (cell.outputStr || cell.errorStr) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearCellOutput(cell.id);
              }}
              title="Clear Cell Output"
              className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-800"
            >
              <VscTrash size={12} />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              removeCell(cell.id);
            }}
            title="Delete Cell"
            className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40"
          >
            <VscClose size={13} />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex items-start p-2 gap-2">
        {/* Left Colab-Style Gutter */}
        <div className="flex flex-col items-center gap-1 pt-0.5 select-none w-7 flex-shrink-0">
          {cell.cell_type === 'code' ? (
            <button
              onClick={handleRun}
              title="Run Cell (Ctrl+Enter)"
              disabled={cell.status === 'running'}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                cell.status === 'running'
                  ? 'bg-amber-500 text-white animate-pulse'
                  : cell.status === 'error'
                  ? 'bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white border border-red-500/40'
                  : cell.status === 'success'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/40'
                  : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-sky-500 hover:text-white border border-gray-300 dark:border-neutral-700'
              }`}
            >
              {cell.status === 'running' ? (
                <VscLoading size={13} className="animate-spin" />
              ) : cell.status === 'success' ? (
                <VscCheck size={13} />
              ) : cell.status === 'error' ? (
                <VscClose size={13} />
              ) : (
                <VscPlay size={11} className="ml-0.5" />
              )}
            </button>
          ) : (
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 dark:text-neutral-500">
              <VscMarkdown size={14} />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {cell.cell_type === 'code' ? (
            <div className="border border-gray-200 dark:border-neutral-800 rounded bg-gray-50/70 dark:bg-neutral-950 overflow-hidden">
              <Editor
                height={`${editorHeight}px`}
                language="javascript"
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={cell.source}
                onChange={(val) => updateCellSource(cell.id, val || '')}
                options={{
                  fontSize: 12,
                  fontFamily: 'Consolas, "Courier New", monospace',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  lineNumbersMinChars: 3,
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 0,
                  renderLineHighlight: 'all',
                  wordWrap: 'on',
                  tabSize: 2,
                  automaticLayout: true,
                  overviewRulerLanes: 0,
                  scrollbar: {
                    vertical: 'auto',
                    horizontal: 'hidden',
                    verticalScrollbarSize: 6,
                  },
                }}
              />
            </div>
          ) : cell.isEditingText ? (
            <div className="flex flex-col gap-1">
              <div className="border border-gray-200 dark:border-neutral-800 rounded bg-gray-50/70 dark:bg-neutral-950 overflow-hidden text-xs p-1">
                <textarea
                  value={cell.source}
                  onChange={(e) => updateCellSource(cell.id, e.target.value)}
                  placeholder="Enter Markdown content..."
                  rows={Math.max(3, cell.source.split('\n').length)}
                  className="w-full bg-transparent border-none outline-none resize-y text-gray-900 dark:text-neutral-200 font-mono text-xs leading-relaxed"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setCellEditingText(cell.id, false)}
                  className="px-2 py-0.5 rounded bg-sky-500 hover:bg-sky-600 text-white text-[10.5px] font-medium"
                >
                  Done Editing
                </button>
              </div>
            </div>
          ) : (
            <div
              onDoubleClick={() => setCellEditingText(cell.id, true)}
              title="Double-click to edit Markdown"
              className="p-2 min-h-[36px] rounded hover:bg-gray-50 dark:hover:bg-neutral-800/40 cursor-text transition-colors border border-transparent hover:border-gray-200 dark:hover:border-neutral-800"
            >
              <MarkdownRenderer content={cell.source} />
            </div>
          )}

          {/* Code Cell Output Box (Google Colab style directly below code) */}
          {cell.cell_type === 'code' && (cell.outputStr || cell.errorStr || cell.status === 'running') && (
            <div className="mt-2 rounded border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 overflow-hidden text-xs">
              <div className="flex items-center justify-between px-2 py-1 bg-gray-100 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 text-[10.5px]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-500 dark:text-neutral-400">
                    {cell.status === 'running'
                      ? 'Executing on page...'
                      : cell.errorStr
                      ? 'Error'
                      : 'Output'}
                  </span>
                  {tabularData && (
                    <div className="flex items-center bg-gray-200 dark:bg-neutral-800 rounded p-0.5">
                      <button
                        onClick={() => setViewMode('table')}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          viewMode === 'table'
                            ? 'bg-white dark:bg-neutral-700 text-sky-600 dark:text-sky-400 shadow-xs'
                            : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200'
                        }`}
                      >
                        <VscTable size={11} />
                        <span>Table ({tabularData.rows.length})</span>
                      </button>
                      <button
                        onClick={() => setViewMode('raw')}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          viewMode === 'raw'
                            ? 'bg-white dark:bg-neutral-700 text-sky-600 dark:text-sky-400 shadow-xs'
                            : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200'
                        }`}
                      >
                        <VscCode size={11} />
                        <span>JSON</span>
                      </button>
                    </div>
                  )}
                </div>
                {cell.outputStr && (
                  <button
                    onClick={handleCopyOutput}
                    className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200"
                  >
                    <VscCopy size={11} />
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              <div className="p-2.5 overflow-x-auto max-h-[350px] font-mono text-[11px] select-text">
                {cell.status === 'running' ? (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 italic">
                    <VscLoading size={13} className="animate-spin" />
                    <span>Running in tab context...</span>
                  </div>
                ) : cell.errorStr ? (
                  <div className="text-red-600 dark:text-red-400 whitespace-pre-wrap">
                    {cell.errorStr}
                  </div>
                ) : tabularData && viewMode === 'table' ? (
                  <div className="overflow-x-auto max-h-[320px]">
                    <table className="w-full text-left border-collapse text-[11px] font-mono">
                      <thead className="bg-gray-100/80 dark:bg-neutral-900/80 sticky top-0 border-b border-gray-200 dark:border-neutral-800 z-10 backdrop-blur-xs">
                        <tr>
                          <th className="px-2 py-1 text-gray-400 dark:text-neutral-500 font-semibold w-8 text-center">#</th>
                          {tabularData.columns.map((col) => (
                            <th key={col} className="px-2.5 py-1 text-gray-700 dark:text-neutral-300 font-semibold truncate border-r border-gray-200/60 dark:border-neutral-800/60 last:border-r-0">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/60">
                        {tabularData.rows.slice(0, 100).map((row: any, rIdx: number) => (
                          <tr key={rIdx} className="hover:bg-sky-50/40 dark:hover:bg-sky-950/20 transition-colors">
                            <td className="px-2 py-0.5 text-gray-400 dark:text-neutral-500 text-center select-none text-[10px]">
                              {rIdx + 1}
                            </td>
                            {tabularData.columns.map((col) => {
                              const val = row[col];
                              const isNullOrUndef = val === null || val === undefined;
                              const display = isNullOrUndef
                                ? 'null'
                                : typeof val === 'object'
                                ? JSON.stringify(val)
                                : String(val);
                              return (
                                <td
                                  key={col}
                                  className="px-2.5 py-0.5 text-gray-800 dark:text-neutral-200 max-w-[280px] truncate border-r border-gray-100 dark:border-neutral-900 last:border-r-0"
                                  title={display}
                                >
                                  {isNullOrUndef ? (
                                    <span className="text-gray-400 italic">null</span>
                                  ) : typeof val === 'boolean' ? (
                                    <span className={val ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-500 font-bold'}>
                                      {String(val)}
                                    </span>
                                  ) : typeof val === 'number' ? (
                                    <span className="text-blue-600 dark:text-blue-400">{val}</span>
                                  ) : (
                                    display
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {tabularData.rows.length > 100 && (
                      <div className="py-1 px-3 text-center text-[10px] text-gray-400 dark:text-neutral-500 bg-gray-50 dark:bg-neutral-950 border-t border-gray-200 dark:border-neutral-800">
                        Showing first 100 of {tabularData.rows.length} rows
                      </div>
                    )}
                  </div>
                ) : (
                  <pre className="text-gray-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                    {cell.outputStr}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insert Between Cells Indicator on Hover */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 py-1 -mb-3 z-10 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            addCell('code', cell.id);
          }}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 shadow text-[10px] text-gray-700 dark:text-neutral-300 hover:text-sky-500 dark:hover:text-sky-400 font-medium transition-colors"
        >
          <VscAdd size={11} />
          <span>Code</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            addCell('markdown', cell.id);
          }}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 shadow text-[10px] text-gray-700 dark:text-neutral-300 hover:text-amber-500 dark:hover:text-amber-400 font-medium transition-colors"
        >
          <VscAdd size={11} />
          <span>Text</span>
        </button>
      </div>
    </div>
  );
};
