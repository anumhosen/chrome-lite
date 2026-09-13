import React from 'react';
import { VscFileMedia, VscDeviceCameraVideo, VscSymbolColor, VscCode, VscFile } from 'react-icons/vsc';
import type { ChromeAsset } from '../../../types/chrome';

interface Props {
  assets: ChromeAsset[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onPreview: (asset: ChromeAsset) => void;
}

export const ExplorerGridView: React.FC<Props> = ({
  assets,
  selectedIds,
  onToggleSelect,
  onPreview,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <VscFileMedia size={18} className="text-amber-400" />;
      case 'video':
      case 'media': return <VscDeviceCameraVideo size={18} className="text-purple-400" />;
      case 'css': return <VscSymbolColor size={18} className="text-sky-400" />;
      case 'js': return <VscCode size={18} className="text-yellow-400" />;
      default: return <VscFile size={18} className="text-neutral-400" />;
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {assets.map((a) => {
        const isSelected = selectedIds.has(a.id || a.url);
        const name = a.filename || a.url.split('/').pop()?.split('?')[0] || 'item';

        return (
          <div
            key={a.id || a.url}
            onClick={() => onPreview(a)}
            className={`group relative flex flex-col items-center p-2 rounded border cursor-pointer transition-all select-none ${isSelected
              ? 'bg-sky-950/40 border-sky-500/80 shadow-sm'
              : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
              }`}
            title={`${name}\n${a.url}`}
          >
            {/* Checkbox */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(a.id || a.url);
              }}
              className="absolute top-1.5 left-1.5 z-10"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => { }}
                className="accent-sky-500 rounded cursor-pointer"
              />
            </div>

            {/* Thumbnail */}
            <div className="w-14 h-14 rounded bg-neutral-900 flex items-center justify-center mb-1.5 overflow-hidden border border-neutral-800/60">
              {a.type === 'image' ? (
                <img
                  src={a.url}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                getTypeIcon(a.type)
              )}
            </div>

            {/* Info */}
            <span className="text-[10px] text-neutral-300 truncate w-full text-center font-medium">
              {name}
            </span>
            <div className="flex items-center justify-between w-full mt-0.5 text-[9.5px] text-neutral-500 font-mono">
              <span className="uppercase text-sky-400/80">{a.type}</span>
              <span>{formatSize(a.size)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
