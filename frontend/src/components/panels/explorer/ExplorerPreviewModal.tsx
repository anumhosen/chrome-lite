import React, { useState, useEffect } from 'react';
import { VscClose, VscCloudDownload, VscCopy, VscLinkExternal, VscZoomIn, VscZoomOut } from 'react-icons/vsc';
import { useTabStore } from '../../../stores/useTabStore';
import type { ChromeAsset } from '../../../types/chrome';

interface Props {
  asset: ChromeAsset | null;
  onClose: () => void;
  onDownload: (asset: ChromeAsset) => void;
}

export const ExplorerPreviewModal: React.FC<Props> = ({ asset, onClose, onDownload }) => {
  const { createTab } = useTabStore();
  const [zoom, setZoom] = useState(1);
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    setZoom(1);
    setTextContent(null);
    if (asset && (asset.type === 'js' || asset.type === 'css' || asset.type === 'json' || asset.type === 'html')) {
      fetch(asset.url)
        .then((r) => r.text())
        .then((t) => setTextContent(t.slice(0, 3000)))
        .catch(() => setTextContent('// Failed to fetch preview content over network.'));
    }
  }, [asset]);

  if (!asset) return null;

  const copyUrl = () => {
    navigator.clipboard.writeText(asset.url);
    alert('Asset URL copied to clipboard!');
  };

  const name = asset.filename || asset.url.split('/').pop()?.split('?')[0] || 'Asset Preview';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2 truncate flex-1 mr-2">
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 font-mono">
              {asset.type}
            </span>
            <span className="text-xs text-neutral-200 font-medium truncate">{name}</span>
          </div>

          <div className="flex items-center gap-1">
            {asset.type === 'image' && (
              <>
                <button
                  onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                  title="Zoom Out"
                  className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                  <VscZoomOut size={13} />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  title="Zoom In"
                  className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                  <VscZoomIn size={13} />
                </button>
              </>
            )}
            <button
              onClick={copyUrl}
              title="Copy URL"
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <VscCopy size={13} />
            </button>
            <button
              onClick={() => {
                createTab(asset.url);
                onClose();
              }}
              title="Open in new tab"
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <VscLinkExternal size={13} />
            </button>
            <button
              onClick={() => onDownload(asset)}
              title="Download Asset"
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-medium"
            >
              <VscCloudDownload size={12} />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              title="Close Preview"
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 ml-1"
            >
              <VscClose size={14} />
            </button>
          </div>
        </div>

        {/* Preview Body */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60 min-h-[260px] max-h-[60vh]">
          {asset.type === 'image' ? (
            <div className="overflow-auto max-w-full max-h-full flex items-center justify-center">
              <img
                src={asset.url}
                alt=""
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                className="max-w-full max-h-[50vh] object-contain transition-transform"
              />
            </div>
          ) : asset.type === 'video' ? (
            <video src={asset.url} controls autoPlay className="max-w-full max-h-[50vh] rounded" />
          ) : asset.type === 'audio' ? (
            <div className="w-full flex justify-center p-6">
              <audio src={asset.url} controls autoPlay className="w-full max-w-md" />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              <pre className="p-3 rounded bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-auto max-h-[50vh] whitespace-pre-wrap select-text">
                {textContent || '// Loading preview content...'}
              </pre>
            </div>
          )}
        </div>

        {/* Footer URL metadata */}
        <div className="px-3 py-1.5 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-[10.5px] text-neutral-500 font-mono">
          <span className="truncate max-w-[400px] select-all">{asset.url}</span>
          <span>{asset.size ? `${(asset.size / 1024).toFixed(1)} KB` : ''}</span>
        </div>
      </div>
    </div>
  );
};
