import React from 'react';
import { VscFileMedia, VscDeviceCameraVideo, VscSymbolColor, VscCode, VscFile, VscEye } from 'react-icons/vsc';
import type { ChromeAsset } from '../../../types/chrome';

interface Props {
  assets: ChromeAsset[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onPreview: (asset: ChromeAsset) => void;
}

export const ExplorerDetailsView: React.FC<Props> = ({
  assets,
  selectedIds,
  onToggleSelect,
  onPreview,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <VscFileMedia size={14} className="text-amber-400" />;
      case 'video':
      case 'media': return <VscDeviceCameraVideo size={14} className="text-purple-400" />;
      case 'css': return <VscSymbolColor size={14} className="text-sky-400" />;
      case 'js': return <VscCode size={14} className="text-yellow-400" />;
      default: return <VscFile size={14} className="text-neutral-400" />;
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-1 select-none">
      {assets.map((a) => {
        const isSelected = selectedIds.has(a.id || a.url);
        const name = a.filename || a.url.split('/').pop()?.split('?')[0] || 'item';
        let host = a.domain;
        if (!host) {
          try { host = new URL(a.url).hostname; } catch { host = '--'; }
        }

        return (
          <div
            key={a.id || a.url}
            onClick={() => onPreview(a)}
            className={`group flex items-center gap-2 p-1.5 rounded border cursor-pointer transition-colors ${isSelected
              ? 'bg-sky-950/40 border-sky-500/70'
              : 'bg-neutral-950 border-neutral-800/80 hover:bg-neutral-900/60'
              }`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => { }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(a.id || a.url);
              }}
              className="accent-sky-500 rounded cursor-pointer ml-0.5"
            />

            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              {getTypeIcon(a.type)}
            </div>

            <span className="text-xs text-neutral-200 truncate flex-1 font-medium" title={a.url}>
              {name}
            </span>

            <span className="text-[10px] font-mono text-neutral-500 truncate max-w-[100px]">
              {host}
            </span>

            <span className="text-[10px] font-mono text-sky-400 uppercase w-10 text-right">
              {a.type}
            </span>

            <span className="text-[10px] font-mono text-neutral-400 w-14 text-right">
              {formatSize(a.size)}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview(a);
              }}
              title="Preview Asset"
              className="p-1 text-neutral-500 hover:text-sky-400 hover:bg-neutral-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <VscEye size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
