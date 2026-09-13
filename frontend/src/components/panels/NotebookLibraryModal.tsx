import React from 'react';
import { VscClose } from 'react-icons/vsc';

interface NotebookLibraryModalProps {
  isOpen: boolean;
  files: { name: string; size: number }[];
  onClose: () => void;
  onLoad: (filename: string) => void;
}

export const NotebookLibraryModal: React.FC<NotebookLibraryModalProps> = ({
  isOpen,
  files,
  onClose,
  onLoad,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg w-[400px] max-h-[70vh] flex flex-col overflow-hidden">
        <div className="h-[36px] px-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-200">Script Library</span>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <VscClose size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {files.length === 0 ? (
            <div className="text-center py-6 text-neutral-500 text-xs">No saved scripts found.</div>
          ) : (
            files.map((f) => (
              <div
                key={f.name}
                className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800 hover:bg-neutral-800/50"
              >
                <span className="text-xs text-neutral-200 font-mono">{f.name}</span>
                <button
                  onClick={() => onLoad(f.name)}
                  className="px-2 py-0.5 text-[10px] font-medium rounded bg-sky-600 text-white"
                >
                  Load
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
