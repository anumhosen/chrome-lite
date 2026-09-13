import React, { useRef, useEffect } from 'react';
import {
  VscExtensions,
  VscPin,
  VscPinned,
  VscSettingsGear,
  VscShield,
  VscDatabase,
  VscCode,
  VscPulse,
  VscSearch,
  VscPlay,
  VscBook,
  VscFolderOpened,
} from 'react-icons/vsc';
import { useExtensionStore } from '../../stores/useExtensionStore';
import { useTabStore } from '../../stores/useTabStore';

export const getExtensionIcon = (id: string, size = 15) => {
  switch (id) {
    case 'shield':
      return <VscShield size={size} className="text-emerald-500" />;
    case 'cookies':
      return <VscDatabase size={size} className="text-amber-500" />;
    case 'userscripts':
      return <VscCode size={size} className="text-purple-500" />;
    case 'interceptor':
      return <VscPulse size={size} className="text-sky-500" />;
    case 'scraper':
      return <VscSearch size={size} className="text-indigo-500" />;
    case 'automation':
      return <VscPlay size={size} className="text-pink-500" />;
    case 'notebook':
      return <VscBook size={size} className="text-teal-500" />;
    case 'explorer':
      return <VscFolderOpened size={size} className="text-orange-500" />;
    default:
      return <VscExtensions size={size} className="text-gray-400" />;
  }
};

export const ExtensionsMenu: React.FC = () => {
  const { extensions, togglePin, closeExtensionsMenu, openPopup } = useExtensionStore();
  const { createTab } = useTabStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeExtensionsMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeExtensionsMenu]);

  const handleManageExtensions = () => {
    createTab('chrome://extensions');
    closeExtensionsMenu();
  };

  const handleExtensionClick = (ext: any) => {
    if (ext.hasPopup) {
      openPopup(ext.id as any);
    } else {
      createTab(`chrome://${ext.id}`);
      closeExtensionsMenu();
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute top-10 right-16 w-[310px] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-800 p-2 select-none text-xs text-gray-800 dark:text-neutral-200 z-50 animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Menu Header */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-neutral-800">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-neutral-100">Extensions</h3>
        <p className="text-[11px] text-gray-500 dark:text-neutral-400">
          Built-in extensions & developer tools
        </p>
      </div>

      {/* Extension Items */}
      <div className="py-1 max-h-[300px] overflow-y-auto space-y-0.5">
        {extensions.map((ext) => (
          <div
            key={ext.id}
            className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors group cursor-pointer"
            onClick={() => handleExtensionClick(ext)}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                {getExtensionIcon(ext.id, 14)}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-medium text-xs text-gray-900 dark:text-neutral-200 truncate">
                  {ext.name}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-neutral-500 truncate">
                  {ext.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Pin / Unpin Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePin(ext.id);
              }}
              title={ext.pinned ? 'Unpin from toolbar' : 'Pin to toolbar'}
              className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                ext.pinned
                  ? 'text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-neutral-700'
                  : 'text-gray-400 hover:text-gray-800 dark:hover:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-700'
              }`}
            >
              {ext.pinned ? <VscPinned size={14} /> : <VscPin size={14} />}
            </button>
          </div>
        ))}
      </div>

      {/* Footer Link */}
      <div className="pt-1.5 border-t border-gray-100 dark:border-neutral-800">
        <button
          onClick={handleManageExtensions}
          className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 font-medium text-xs text-sky-600 dark:text-sky-400 flex items-center justify-between transition-colors"
        >
          <span>Manage extensions</span>
          <VscSettingsGear size={14} />
        </button>
      </div>
    </div>
  );
};
