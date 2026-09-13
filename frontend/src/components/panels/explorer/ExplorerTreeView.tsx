import React, { useState, useMemo } from 'react';
import {
  VscChevronDown,
  VscChevronRight,
  VscGlobe,
  VscFolder,
  VscFolderOpened,
  VscFileMedia,
  VscFileCode,
  VscFile,
  VscEye,
  VscCopy,
  VscCheck,
  VscCollapseAll,
  VscExpandAll,
} from 'react-icons/vsc';
import type { ChromeAsset } from '../../../types/chrome';

interface Props {
  assets: ChromeAsset[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectMultiple: (ids: string[], select: boolean) => void;
  onPreview: (asset: ChromeAsset) => void;
}

interface TreeNodeFile {
  type: 'file';
  asset: ChromeAsset;
  name: string;
  id: string;
}

interface TreeNodeDir {
  type: 'dir';
  name: string;
  path: string;
  children: Record<string, TreeNodeDir | TreeNodeFile>;
  allFileIds: string[];
}

const getFileIcon = (asset: ChromeAsset, filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const assetType = asset.type?.toLowerCase() || '';

  if (assetType === 'image' || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'avif', 'bmp'].includes(ext)) {
    return <VscFileMedia size={13} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0" />;
  }
  if (assetType === 'video' || assetType === 'audio' || ['mp4', 'webm', 'ogg', 'mp3', 'wav'].includes(ext)) {
    return <VscFileMedia size={13} className="text-purple-500 dark:text-purple-400 flex-shrink-0" />;
  }
  if (assetType === 'css' || ['css', 'scss', 'less'].includes(ext)) {
    return <VscFileCode size={13} className="text-sky-500 dark:text-sky-400 flex-shrink-0" />;
  }
  if (assetType === 'js' || ['js', 'mjs', 'ts', 'jsx', 'tsx'].includes(ext)) {
    return <VscFileCode size={13} className="text-amber-500 dark:text-amber-400 flex-shrink-0" />;
  }
  if (assetType === 'font' || ['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext)) {
    return <VscFile size={13} className="text-pink-500 dark:text-pink-400 flex-shrink-0" />;
  }
  return <VscFile size={13} className="text-gray-400 dark:text-neutral-500 flex-shrink-0" />;
};

const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const ExplorerTreeView: React.FC<Props> = ({
  assets,
  selectedIds,
  onToggleSelect,
  onSelectMultiple,
  onPreview,
}) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Build hierarchical tree: Domain -> Directory Segments -> File
  const treeData = useMemo(() => {
    const root: Record<string, TreeNodeDir> = {};

    for (const asset of assets) {
      let domain = asset.domain;
      let pathname = '';
      try {
        const u = new URL(asset.url);
        domain = u.hostname || domain || 'external';
        pathname = u.pathname;
      } catch {
        domain = domain || 'external';
        pathname = asset.url;
      }

      if (!root[domain]) {
        root[domain] = {
          type: 'dir',
          name: domain,
          path: domain,
          children: {},
          allFileIds: [],
        };
      }

      const assetId = asset.id || asset.url;
      root[domain].allFileIds.push(assetId);

      // Parse path segments
      const segments = pathname.split('/').filter(Boolean);
      const filename = segments.pop() || asset.filename || 'item';

      let currentDir = root[domain];
      let currentPath = domain;

      // Create folder nodes up to the file (limit to max 3 levels deep for clean explorer layout)
      const folderSegments = segments.slice(0, 3);
      for (const seg of folderSegments) {
        currentPath += `/${seg}`;
        if (!currentDir.children[seg]) {
          currentDir.children[seg] = {
            type: 'dir',
            name: seg,
            path: currentPath,
            children: {},
            allFileIds: [],
          };
        }
        const nextDir = currentDir.children[seg] as TreeNodeDir;
        nextDir.allFileIds.push(assetId);
        currentDir = nextDir;
      }

      // Add file leaf
      currentDir.children[filename] = {
        type: 'file',
        name: filename,
        id: assetId,
        asset,
      };
    }

    return root;
  }, [assets]);

  const toggleCollapse = (key: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCollapseAll = () => {
    const allDirs = new Set<string>();
    const collect = (dir: TreeNodeDir) => {
      allDirs.add(dir.path);
      for (const child of Object.values(dir.children)) {
        if (child.type === 'dir') collect(child);
      }
    };
    Object.values(treeData).forEach(collect);
    setCollapsedNodes(allDirs);
  };

  const handleExpandAll = () => {
    setCollapsedNodes(new Set());
  };

  const copyUrl = (asset: ChromeAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id || asset.url);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const renderDir = (dir: TreeNodeDir, depth = 0) => {
    const isCollapsed = collapsedNodes.has(dir.path);
    const allSelected = dir.allFileIds.length > 0 && dir.allFileIds.every((id) => selectedIds.has(id));
    const someSelected = dir.allFileIds.some((id) => selectedIds.has(id)) && !allSelected;
    const isRootDomain = depth === 0;

    return (
      <div key={dir.path} className="flex flex-col">
        {/* Directory Row (VS Code style) */}
        <div
          onClick={() => toggleCollapse(dir.path)}
          className={`group flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors text-xs ${isRootDomain
            ? 'bg-gray-100/70 dark:bg-neutral-900/60 font-semibold text-gray-800 dark:text-neutral-200 mt-1 border-b border-gray-200/50 dark:border-neutral-800/40'
            : 'hover:bg-gray-100 dark:hover:bg-neutral-800/50 text-gray-700 dark:text-neutral-300'
            }`}
          style={{ paddingLeft: `${Math.max(depth * 12 + 6, 6)}px` }}
        >
          {/* Chevron */}
          <span className="text-gray-400 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-neutral-200">
            {isCollapsed ? <VscChevronRight size={12} /> : <VscChevronDown size={12} />}
          </span>

          {/* Select all in directory checkbox */}
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectMultiple(dir.allFileIds, !allSelected);
            }}
            onChange={() => { }}
            className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-0 focus:outline-none accent-sky-500 cursor-pointer"
          />

          {/* Icon */}
          {isRootDomain ? (
            <VscGlobe size={13} className="text-sky-500 dark:text-sky-400 flex-shrink-0" />
          ) : isCollapsed ? (
            <VscFolder size={13} className="text-amber-500 dark:text-amber-400 flex-shrink-0" />
          ) : (
            <VscFolderOpened size={13} className="text-amber-500 dark:text-amber-400 flex-shrink-0" />
          )}

          {/* Directory Name */}
          <span className={`truncate flex-1 font-mono ${isRootDomain ? 'text-[11px]' : 'text-[11.5px]'}`}>
            {dir.name}
          </span>

          {/* Count Badge */}
          <span className="text-[10px] font-mono text-gray-400 dark:text-neutral-500 px-1 py-0.2 rounded bg-gray-200/50 dark:bg-neutral-800">
            {dir.allFileIds.length}
          </span>
        </div>

        {/* Children Rows */}
        {!isCollapsed && (
          <div className="flex flex-col relative">
            {/* VS Code Vertical Tree Guide Line */}
            <div
              className="absolute top-0 bottom-0 border-l border-gray-200 dark:border-neutral-800/80 pointer-events-none"
              style={{ left: `${depth * 12 + 12}px` }}
            />

            {Object.values(dir.children).map((child) =>
              child.type === 'dir'
                ? renderDir(child, depth + 1)
                : renderFile(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFile = (file: TreeNodeFile, depth = 0) => {
    const isSelected = selectedIds.has(file.id);
    const sizeStr = formatBytes(file.asset.size);

    return (
      <div
        key={file.id}
        onClick={() => onPreview(file.asset)}
        className={`group flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors text-xs ${isSelected
          ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 font-medium'
          : 'hover:bg-gray-100 dark:hover:bg-neutral-800/50 text-gray-600 dark:text-neutral-400'
          }`}
        style={{ paddingLeft: `${depth * 12 + 18}px` }}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(file.id);
          }}
          onChange={() => { }}
          className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-0 focus:outline-none accent-sky-500 cursor-pointer"
        />

        {/* File Type Icon */}
        {getFileIcon(file.asset, file.name)}

        {/* Filename */}
        <span
          className="truncate flex-1 font-mono text-[11px] group-hover:text-gray-900 dark:group-hover:text-neutral-100"
          title={file.asset.url}
        >
          {file.name}
        </span>

        {/* Size Badge */}
        {sizeStr && (
          <span className="text-[10px] font-mono text-gray-400 dark:text-neutral-500 flex-shrink-0">
            {sizeStr}
          </span>
        )}

        {/* Quick Action Buttons on Hover */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0 transition-opacity">
          <button
            onClick={(e) => copyUrl(file.asset, e)}
            title="Copy URL"
            className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-700"
          >
            {copiedId === file.id ? <VscCheck size={11} className="text-emerald-500" /> : <VscCopy size={11} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(file.asset);
            }}
            title="Preview Asset"
            className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-700"
          >
            <VscEye size={11} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full select-none">
      {/* VS Code Explorer Toolbar */}
      <div className="flex items-center justify-between px-2 py-1 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded mb-1 text-xs">
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-neutral-400 font-medium text-[10.5px] uppercase tracking-wider">
          <span>Hierarchy</span>
          <span className="font-mono text-[10px] text-gray-400 dark:text-neutral-500">
            ({assets.length} items)
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleExpandAll}
            title="Expand All Folders"
            className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <VscExpandAll size={13} />
          </button>
          <button
            onClick={handleCollapseAll}
            title="Collapse All Folders"
            className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <VscCollapseAll size={13} />
          </button>
        </div>
      </div>

      {/* Tree Content Area */}
      <div className="flex-1 overflow-y-auto pr-1">
        {Object.values(treeData).map((domainDir) => renderDir(domainDir, 0))}
      </div>
    </div>
  );
};
