import React, { useState } from 'react';
import { VscCode, VscClose, VscCheck, VscCopy, VscCloudDownload } from 'react-icons/vsc';

interface PlaywrightExportModalProps {
  isOpen: boolean;
  script: string;
  flowName: string;
  onClose: () => void;
}

export const PlaywrightExportModal: React.FC<PlaywrightExportModalProps> = ({
  isOpen,
  script,
  flowName,
  onClose,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([script], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safe = flowName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    a.download = `${safe || 'flow'}.spec.ts`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-xl w-full max-w-xl max-h-[85%] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <VscCode size={16} className="text-sky-500" />
            <span className="font-semibold text-gray-800 dark:text-neutral-200">
              Playwright Test Script (.spec.ts)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <VscClose size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 bg-gray-50 dark:bg-neutral-950 font-mono text-[11px] select-text">
          <pre className="text-gray-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
            {script}
          </pre>
        </div>

        <div className="flex items-center justify-between p-3 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <span className="text-[11px] text-gray-500 dark:text-neutral-400">
            Ready to run in Playwright CI / local runners.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 font-medium transition-colors border border-gray-200 dark:border-neutral-700"
            >
              {isCopied ? <VscCheck size={13} className="text-emerald-500" /> : <VscCopy size={13} />}
              <span>{isCopied ? 'Copied!' : 'Copy Script'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors shadow-xs"
            >
              <VscCloudDownload size={13} />
              <span>Download .spec.ts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
