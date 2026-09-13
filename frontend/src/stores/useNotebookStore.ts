import { create } from 'zustand';

export interface NotebookCell {
  id: string;
  cell_type: 'code' | 'markdown';
  source: string;
  execution_count?: number | null;
  status?: 'ready' | 'running' | 'success' | 'error';
  durationMs?: number | null;
  outputStr?: string;
  errorStr?: string;
  isEditingText?: boolean;
}

export interface NotebookMetadata {
  title: string;
  target_domain?: string;
  auto_run_domain?: string;
  language: string;
  created_at: number;
  updated_at: number;
}

interface NotebookState {
  title: string;
  filePath: string | null;
  cells: NotebookCell[];
  activeCellId: string | null;
  targetDomain: string;
  autoRunDomain: string;
  notebookId: string | null;
  isRunningAll: boolean;
  nextExecCount: number;
  libraryFiles: { name: string; size: number }[];
  isLibraryOpen: boolean;

  // Actions
  setTitle: (title: string) => void;
  setTargetDomain: (domain: string) => void;
  setAutoRunDomain: (domain: string) => void;
  setActiveCellId: (id: string | null) => void;
  syncActiveTabDomain: (url?: string) => void;

  addCell: (type: 'code' | 'markdown', afterId?: string) => void;
  updateCellSource: (id: string, source: string) => void;
  setCellEditingText: (id: string, isEditing: boolean) => void;
  removeCell: (id: string) => void;
  moveCell: (id: string, direction: 'up' | 'down') => void;
  toggleCellType: (id: string) => void;
  clearCellOutput: (id: string) => void;
  clearAllOutputs: () => void;

  runCell: (cellId: string, activeTabId?: string) => Promise<void>;
  runAllCells: (activeTabId?: string) => Promise<void>;

  newNotebook: () => void;
  openFileDialog: () => Promise<void>;
  saveFileDialog: (saveAs?: boolean) => Promise<void>;
  openLibrary: () => Promise<void>;
  closeLibrary: () => void;
  loadScript: (filename: string) => Promise<void>;
  saveScript: () => Promise<void>;
  loadNotebookFromData: (content: string, name?: string, path?: string) => void;
  exportAsIjsnb: () => string;
  exportAsIpynb: () => string;
  exportAsHtml: () => string;
}

const DEFAULT_CELLS: NotebookCell[] = [
  {
    id: 'cell_intro',
    cell_type: 'markdown',
    source: '# 🚀 Chrome Lite Notebook\nInteractive JavaScript notebook running directly inside the active web page context. Access `document`, `window`, and all page DOM APIs.',
    isEditingText: false,
  },
  {
    id: 'cell_page_info',
    cell_type: 'code',
    source: `// Inspect current active page metadata
return {
  title: document.title,
  url: window.location.href,
  domain: window.location.hostname,
  totalLinks: document.querySelectorAll("a").length,
  totalImages: document.querySelectorAll("img").length,
  readyState: document.readyState
};`,
    execution_count: null,
    status: 'ready',
    outputStr: '',
    errorStr: '',
  },
  {
    id: 'cell_links_header',
    cell_type: 'markdown',
    source: '### 🔗 Extract Links\nExtract and filter all hyperlinks currently on the active page:',
    isEditingText: false,
  },
  {
    id: 'cell_extract_links',
    cell_type: 'code',
    source: `const links = Array.from(document.querySelectorAll("a"))
  .map(a => ({ text: a.innerText.trim(), href: a.href }))
  .filter(l => l.text && l.href.startsWith("http"));

return links.slice(0, 10);`,
    execution_count: null,
    status: 'ready',
    outputStr: '',
    errorStr: '',
  }
];

export const useNotebookStore = create<NotebookState>((set, get) => ({
  title: 'notebook.ijsnb',
  filePath: null,
  cells: DEFAULT_CELLS,
  activeCellId: 'cell_page_info',
  targetDomain: '',
  autoRunDomain: '',
  notebookId: null,
  isRunningAll: false,
  nextExecCount: 1,
  libraryFiles: [],
  isLibraryOpen: false,

  setTitle: (title) => set({ title }),
  setTargetDomain: (targetDomain) => set({ targetDomain }),
  setAutoRunDomain: (autoRunDomain) => set({ autoRunDomain }),
  setActiveCellId: (activeCellId) => set({ activeCellId }),

  syncActiveTabDomain: (url?: string) => {
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.hostname) {
        set({ targetDomain: parsed.hostname });
      }
    } catch { }
  },

  addCell: (type, afterId) => {
    const { cells } = get();
    const newCell: NotebookCell = {
      id: `cell_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cell_type: type,
      source: type === 'code' ? '// JavaScript code\n' : '### Text block\nDouble-click to edit Markdown...',
      execution_count: null,
      status: 'ready',
      outputStr: '',
      errorStr: '',
      isEditingText: type === 'markdown',
    };

    if (!afterId) {
      set({ cells: [...cells, newCell], activeCellId: newCell.id });
      return;
    }

    const idx = cells.findIndex((c) => c.id === afterId);
    if (idx < 0) {
      set({ cells: [...cells, newCell], activeCellId: newCell.id });
    } else {
      const next = [...cells];
      next.splice(idx + 1, 0, newCell);
      set({ cells: next, activeCellId: newCell.id });
    }
  },

  updateCellSource: (id, source) => {
    set((state) => ({
      cells: state.cells.map((c) => (c.id === id ? { ...c, source } : c)),
    }));
  },

  setCellEditingText: (id, isEditing) => {
    set((state) => ({
      cells: state.cells.map((c) => (c.id === id ? { ...c, isEditingText: isEditing } : c)),
    }));
  },

  removeCell: (id) => {
    const { cells, activeCellId } = get();
    if (cells.length <= 1) {
      // Keep at least one cell
      set({
        cells: [
          {
            id: `cell_${Date.now()}`,
            cell_type: 'code',
            source: '// JavaScript code\n',
            execution_count: null,
            status: 'ready',
          }
        ],
        activeCellId: null,
      });
      return;
    }

    const next = cells.filter((c) => c.id !== id);
    set({
      cells: next,
      activeCellId: activeCellId === id ? next[0]?.id || null : activeCellId,
    });
  },

  moveCell: (id, direction) => {
    const { cells } = get();
    const idx = cells.findIndex((c) => c.id === id);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === cells.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const next = [...cells];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    set({ cells: next });
  },

  toggleCellType: (id) => {
    set((state) => ({
      cells: state.cells.map((c) => {
        if (c.id !== id) return c;
        const newType = c.cell_type === 'code' ? 'markdown' : 'code';
        return {
          ...c,
          cell_type: newType,
          isEditingText: newType === 'markdown',
          outputStr: '',
          errorStr: '',
        };
      }),
    }));
  },

  clearCellOutput: (id) => {
    set((state) => ({
      cells: state.cells.map((c) =>
        c.id === id
          ? { ...c, status: 'ready', outputStr: '', errorStr: '', durationMs: null }
          : c
      ),
    }));
  },

  clearAllOutputs: () => {
    set((state) => ({
      cells: state.cells.map((c) => ({
        ...c,
        status: 'ready',
        outputStr: '',
        errorStr: '',
        durationMs: null,
      })),
    }));
  },

  runCell: async (cellId, activeTabId) => {
    const { cells, notebookId, nextExecCount } = get();
    const cell = cells.find((c) => c.id === cellId);
    if (!cell || cell.cell_type !== 'code' || !cell.source.trim()) return;
    if (!window.chrome?.notebook) return;

    set((state) => ({
      cells: state.cells.map((c) =>
        c.id === cellId ? { ...c, status: 'running', errorStr: '', outputStr: '' } : c
      ),
    }));

    try {
      const res = await window.chrome.notebook.execute(activeTabId, cell.source, {
        notebookId,
        cellId,
      });

      set((state) => ({
        nextExecCount: state.nextExecCount + 1,
        cells: state.cells.map((c) =>
          c.id === cellId
            ? {
              ...c,
              execution_count: nextExecCount,
              durationMs: res.durationMs,
              status: res.success ? 'success' : 'error',
              outputStr: res.success ? res.outputStr : '',
              errorStr: res.success ? '' : res.error || 'Execution failed',
            }
            : c
        ),
      }));
    } catch (err: any) {
      set((state) => ({
        cells: state.cells.map((c) =>
          c.id === cellId
            ? { ...c, status: 'error', errorStr: err.message || String(err), durationMs: null }
            : c
        ),
      }));
    }
  },

  runAllCells: async (activeTabId) => {
    const { cells, isRunningAll, runCell } = get();
    if (isRunningAll) return;

    set({ isRunningAll: true });
    try {
      for (const cell of cells) {
        if (cell.cell_type === 'code') {
          await runCell(cell.id, activeTabId);
        }
      }
    } finally {
      set({ isRunningAll: false });
    }
  },

  newNotebook: () => {
    set({
      title: 'untitled.ijsnb',
      filePath: null,
      cells: DEFAULT_CELLS,
      activeCellId: 'cell_page_info',
      notebookId: null,
      nextExecCount: 1,
    });
  },

  exportAsIjsnb: () => {
    const { cells, title, targetDomain, autoRunDomain } = get();
    const notebookJson = {
      nbformat: 1,
      nbformat_minor: 0,
      metadata: {
        title,
        language: 'javascript',
        target_domain: targetDomain,
        auto_run_domain: autoRunDomain,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
      cells: cells.map((c) => ({
        id: c.id,
        cell_type: c.cell_type,
        source: c.source,
        execution_count: c.execution_count || null,
        outputs: c.outputStr
          ? [
            {
              output_type: 'execute_result',
              data: c.outputStr,
              duration_ms: c.durationMs || 0,
            }
          ]
          : c.errorStr
            ? [
              {
                output_type: 'error',
                error: c.errorStr,
              }
            ]
            : [],
        metadata: {},
      })),
    };
    return JSON.stringify(notebookJson, null, 2);
  },

  exportAsIpynb: () => {
    const { cells } = get();
    const ipynb = {
      cells: cells.map((c) => ({
        cell_type: c.cell_type,
        metadata: {},
        execution_count: c.cell_type === 'code' ? (c.execution_count || null) : undefined,
        source: c.source.split('\n').map((line, i, arr) => i < arr.length - 1 ? line + '\n' : line),
        outputs: c.cell_type === 'code' && c.outputStr ? [
          {
            output_type: 'execute_result',
            execution_count: c.execution_count || 1,
            data: {
              'text/plain': [c.outputStr]
            },
            metadata: {}
          }
        ] : []
      })),
      metadata: {
        kernelspec: {
          display_name: 'JavaScript (Chrome)',
          language: 'javascript',
          name: 'chrome-js'
        },
        language_info: {
          name: 'javascript',
          version: 'ES2024'
        }
      },
      nbformat: 4,
      nbformat_minor: 5
    };
    return JSON.stringify(ipynb, null, 2);
  },

  exportAsHtml: () => {
    const { title, cells } = get();
    let body = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>${title}</title>\n`;
    body += `<style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fafafa; color: #1e293b; max-width: 900px; margin: 40px auto; padding: 0 20px; }
      @media (prefers-color-scheme: dark) { body { background: #0f172a; color: #e2e8f0; } }
      .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
      .cell { margin-bottom: 20px; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; background: #ffffff; }
      @media (prefers-color-scheme: dark) { .cell { background: #1e293b; border-color: #334155; } }
      .cell-header { padding: 6px 12px; font-size: 11px; font-family: monospace; background: rgba(0,0,0,0.03); border-bottom: 1px solid rgba(0,0,0,0.06); color: #64748b; }
      pre { margin: 0; padding: 12px; font-family: Consolas, "Courier New", monospace; font-size: 12px; line-height: 1.5; overflow-x: auto; }
      .output { border-top: 1px solid #e2e8f0; background: rgba(0,0,0,0.02); }
      @media (prefers-color-scheme: dark) { .output { border-color: #334155; } }
      .markdown-content { padding: 16px; line-height: 1.6; }
      .print-btn { background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 12px; }
      @media print { .print-btn { display: none; } body { max-width: 100%; margin: 0; } }
    </style>\n</head>\n<body>\n`;
    body += `<div class="header"><h1>${title}</h1><button class="print-btn" onclick="window.print()">Print / Save as PDF</button></div>\n`;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (c.cell_type === 'markdown') {
        body += `<div class="cell"><div class="markdown-content">${c.source.replace(/\n/g, '<br>')}</div></div>\n`;
      } else {
        body += `<div class="cell"><div class="cell-header">In [${c.execution_count || i + 1}]:</div><pre>${c.source.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
        if (c.outputStr) {
          body += `<div class="output"><div class="cell-header">Out [${c.execution_count || i + 1}]:</div><pre>${c.outputStr.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></div>`;
        }
        body += `</div>\n`;
      }
    }
    body += `</body>\n</html>`;
    return body;
  },

  loadNotebookFromData: (content: string, name?: string, path?: string) => {
    try {
      const parsed = JSON.parse(content);

      // Check for standard Jupyter notebook format (.ipynb)
      if (parsed.nbformat && Array.isArray(parsed.cells)) {
        const loadedCells: NotebookCell[] = parsed.cells.map((c: any, index: number) => {
          const sourceText = Array.isArray(c.source) ? c.source.join('') : String(c.source || '');
          let outputStr = '';
          let errorStr = '';

          if (Array.isArray(c.outputs)) {
            for (const out of c.outputs) {
              if (out.output_type === 'error' || out.ename) {
                errorStr += (out.traceback ? out.traceback.join('\n') : (out.evalue || 'Error')) + '\n';
              } else if (out.data && out.data['text/plain']) {
                const txt = out.data['text/plain'];
                outputStr += (Array.isArray(txt) ? txt.join('') : String(txt)) + '\n';
              } else if (Array.isArray(out.text)) {
                outputStr += out.text.join('') + '\n';
              } else if (typeof out.text === 'string') {
                outputStr += out.text + '\n';
              }
            }
          }

          return {
            id: `cell_${index}_${Date.now()}`,
            cell_type: c.cell_type === 'markdown' ? 'markdown' : 'code',
            source: sourceText,
            execution_count: typeof c.execution_count === 'number' ? c.execution_count : null,
            status: errorStr ? 'error' : outputStr ? 'success' : 'ready',
            outputStr: outputStr.trim(),
            errorStr: errorStr.trim(),
            durationMs: null,
            isEditingText: false,
          };
        });

        set({
          cells: loadedCells.length > 0 ? loadedCells : DEFAULT_CELLS,
          title: name || 'notebook.ipynb',
          filePath: path || null,
        });
        return;
      }

      if (parsed && Array.isArray(parsed.cells)) {
        const loadedCells: NotebookCell[] = parsed.cells.map((c: any, index: number) => {
          let sourceText = '';
          if (Array.isArray(c.source)) {
            sourceText = c.source.join('');
          } else if (typeof c.source === 'string') {
            sourceText = c.source;
          }

          let outputStr = '';
          let errorStr = '';
          let durationMs: number | null = null;

          if (Array.isArray(c.outputs) && c.outputs.length > 0) {
            const out = c.outputs[0];
            if (out.output_type === 'error' || out.error) {
              errorStr = out.error || out.ename || 'Error';
            } else if (out.data) {
              outputStr = typeof out.data === 'object' ? JSON.stringify(out.data, null, 2) : String(out.data);
              durationMs = out.duration_ms || null;
            }
          }

          return {
            id: c.id || `cell_${index}_${Date.now()}`,
            cell_type: c.cell_type === 'markdown' ? 'markdown' : 'code',
            source: sourceText,
            execution_count: typeof c.execution_count === 'number' ? c.execution_count : null,
            status: errorStr ? 'error' : outputStr ? 'success' : 'ready',
            outputStr,
            errorStr,
            durationMs,
            isEditingText: false,
          };
        });

        set({
          cells: loadedCells.length > 0 ? loadedCells : DEFAULT_CELLS,
          title: name || parsed.metadata?.title || 'notebook.ijsnb',
          filePath: path || null,
          targetDomain: parsed.metadata?.target_domain || get().targetDomain,
          autoRunDomain: parsed.metadata?.auto_run_domain || '',
        });
        return;
      }
    } catch {
      // Content was not JSON, wrap as single code cell
    }

    // Fallback: load raw JS or plain text
    set({
      title: name || 'notebook.ijsnb',
      filePath: path || null,
      cells: [
        {
          id: `cell_${Date.now()}`,
          cell_type: 'code',
          source: content,
          status: 'ready',
        }
      ],
    });
  },

  openFileDialog: async () => {
    if (!window.chrome?.notebook?.chooseFileOpen) return;
    try {
      const res = await window.chrome.notebook.chooseFileOpen();
      if (!res || res.canceled || !res.content) return;

      const filename = res.filePath ? res.filePath.split(/[\\/]/).pop() || 'notebook.ijsnb' : 'notebook.ijsnb';
      get().loadNotebookFromData(res.content, filename, res.filePath);
    } catch (err: any) {
      alert('Failed to open file: ' + err.message);
    }
  },

  saveFileDialog: async (saveAs = false) => {
    const { filePath, exportAsIjsnb, title } = get();
    const content = exportAsIjsnb();

    if (!saveAs && filePath && window.chrome?.notebook?.saveFile) {
      try {
        await window.chrome.notebook.saveFile(filePath, content);
        return;
      } catch { }
    }

    if (window.chrome?.notebook?.chooseFileSave) {
      try {
        const res = await window.chrome.notebook.chooseFileSave(content);
        if (res && !res.canceled && res.filePath) {
          const newName = res.filePath.split(/[\\/]/).pop() || title;
          set({ filePath: res.filePath, title: newName });
        }
      } catch (err: any) {
        alert('Failed to save file: ' + err.message);
      }
    }
  },

  openLibrary: async () => {
    set({ isLibraryOpen: true });
    if (!window.chrome?.notebook?.listLibrary) return;
    try {
      const files = await window.chrome.notebook.listLibrary();
      set({ libraryFiles: files || [] });
    } catch { }
  },

  closeLibrary: () => set({ isLibraryOpen: false }),

  loadScript: async (fname: string) => {
    if (!window.chrome?.notebook?.openFile) return;
    try {
      const res = await window.chrome.notebook.openFile(fname);
      if (res?.content) {
        get().loadNotebookFromData(res.content, fname, fname);
        set({ isLibraryOpen: false });
      }
    } catch (err: any) {
      alert('Load error: ' + err.message);
    }
  },

  saveScript: async () => {
    const { title, exportAsIjsnb, autoRunDomain, notebookId } = get();
    const name = prompt('Notebook name to save in library:', title.replace(/\.[^/.]+$/, ''));
    if (!name || !window.chrome?.notebook?.save) return;

    const fullFilename = name.endsWith('.ijsnb') ? name : `${name}.ijsnb`;
    const content = exportAsIjsnb();

    try {
      await window.chrome.notebook.saveFile(fullFilename, content);
      await window.chrome.notebook.save({
        id: notebookId,
        name: fullFilename,
        content,
        autoRunDomains: autoRunDomain,
      });
      set({ title: fullFilename });
    } catch (err: any) {
      alert('Save error: ' + err.message);
    }
  },
}));
