import React, { useState, useEffect, useRef } from 'react';
import {
  VscSearch,
  VscAdd,
  VscEllipsis,
  VscEdit,
  VscTrash,
  VscSync,
  VscBook,
  VscPulse,
  VscPlay,
  VscExtensions,
  VscSettingsGear,
  VscCloudDownload,
  VscGlobe,
  VscClose,
  VscSymbolColor,
  VscHistory,
} from 'react-icons/vsc';
import { useTabStore } from '../../stores/useTabStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useShortcutStore, type ShortcutItem } from '../../stores/useShortcutStore';
import { wallpaperService, type WallpaperInfo } from '../../services/wallpaperService';

export const NewTabPage: React.FC = () => {
  const { navigate, createTab } = useTabStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const { shortcuts, addShortcut, updateShortcut, removeShortcut, resetToDefaults } = useShortcutStore();

  const [query, setQuery] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');

  // Wallpaper state
  const [wallpaper, setWallpaper] = useState<WallpaperInfo>(wallpaperService.getWallpaper());
  const [wallpaperEnabled, setWallpaperEnabled] = useState<boolean>(wallpaperService.isWallpaperEnabled());
  const [isShuffling, setIsShuffling] = useState(false);

  // Shortcut editing modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShortcutItem | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalUrl, setModalUrl] = useState('');

  // Context menu on shortcut tiles
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Favicon error fallback tracking (map of shortcut id -> boolean)
  const [failedFavicons, setFailedFavicons] = useState<Record<string, boolean>>({});

  // Clock and greeting
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const mins = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hours.toString().padStart(2, '0')}:${mins}`);

      if (hours < 12) {
        setGreeting('Good morning');
      } else if (hours < 18) {
        setGreeting('Good afternoon');
      } else {
        setGreeting('Good evening');
      }

      setDateStr(
        now.toLocaleDateString([], {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Bing daily wallpaper once in background
  useEffect(() => {
    wallpaperService.fetchDailyWallpaper().then((daily) => {
      if (daily && daily.url !== wallpaper.url) {
        setWallpaper(daily);
      }
    });
  }, []);

  // Validate wallpaper image loading; fallback if error
  useEffect(() => {
    if (!wallpaper.url) return;
    const img = new Image();
    img.src = wallpaper.url;
    img.onerror = () => {
      console.warn('Wallpaper failed to load, switching to fallback:', wallpaper.url);
      const fallback = wallpaperService.shuffleWallpaper();
      setWallpaper(fallback);
    };
  }, [wallpaper.url]);

  // Close context menu on external click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(query.trim());
  };

  const handleOpenApp = (path: string) => {
    createTab(`chrome://${path}`);
  };

  const handleShuffleWallpaper = () => {
    setIsShuffling(true);
    const next = wallpaperService.shuffleWallpaper();
    setWallpaper(next);
    setTimeout(() => setIsShuffling(false), 500);
  };

  const handleToggleWallpaper = () => {
    const next = wallpaperService.toggleWallpaperEnabled();
    setWallpaperEnabled(next);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setModalTitle('');
    setModalUrl('');
    setModalOpen(true);
    setActiveMenuId(null);
  };

  const openEditModal = (item: ShortcutItem) => {
    setEditingItem(item);
    setModalTitle(item.title);
    setModalUrl(item.url);
    setModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalUrl.trim()) return;
    if (editingItem) {
      updateShortcut(editingItem.id, modalTitle.trim() || modalUrl.trim(), modalUrl.trim());
    } else {
      addShortcut(modalTitle.trim() || modalUrl.trim(), modalUrl.trim());
    }
    setModalOpen(false);
  };

  return (
    <div
      className={`relative isolate w-full h-full flex flex-col items-center justify-between px-4 py-3 select-none overflow-y-auto overflow-x-hidden transition-colors duration-300 ${
        wallpaperEnabled
          ? 'text-white'
          : 'bg-gray-100 dark:bg-neutral-950 text-gray-900 dark:text-neutral-100'
      }`}
    >
      {/* Background Wallpaper Layer */}
      {wallpaperEnabled ? (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
            style={{ backgroundImage: `url(${wallpaper.url})` }}
          />
          {/* Responsive overlay for optimal text contrast and aesthetics in light and dark mode */}
          <div className="absolute inset-0 bg-black/25 dark:bg-black/50 backdrop-brightness-[0.98] dark:backdrop-brightness-90 transition-colors duration-300" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gray-100 dark:bg-neutral-950 pointer-events-none transition-colors duration-300" />
      )}

      {/* Top Bar / Wallpaper Info */}
      <div className="relative z-10 w-full flex items-center justify-between max-w-4xl px-2 opacity-80 text-xs font-medium flex-shrink-0">
        <div className="flex items-center gap-2">
          {wallpaperEnabled && wallpaper.title && (
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full border truncate max-w-[280px] backdrop-blur-sm transition-colors ${
                wallpaperEnabled
                  ? 'text-white/90 bg-black/40 border-white/20'
                  : 'text-gray-600 dark:text-neutral-400 bg-white/70 dark:bg-neutral-800/70 border-gray-200 dark:border-neutral-700'
              }`}
              title={`${wallpaper.title} (${wallpaper.copyright || 'Bing / Unsplash'})`}
            >
              {wallpaper.title}
            </span>
          )}
        </div>
      </div>

      {/* Center Main Content (Clock, Search, 2-Row Shortcuts) */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-3xl my-auto py-2">
        {/* Minimalist Clock & Greeting */}
        <div className="flex flex-col items-center text-center mb-4">
          <span
            className={`text-5xl sm:text-6xl font-light tracking-tight transition-colors ${
              wallpaperEnabled
                ? 'text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {timeStr || '12:00'}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs sm:text-sm font-medium transition-colors ${
                wallpaperEnabled
                  ? 'text-white/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]'
                  : 'text-gray-700 dark:text-neutral-300'
              }`}
            >
              {greeting}
            </span>
            <span className={wallpaperEnabled ? 'text-white/50' : 'text-gray-400 dark:text-neutral-600'}>
              &bull;
            </span>
            <span
              className={`text-[11px] sm:text-xs font-normal transition-colors ${
                wallpaperEnabled
                  ? 'text-white/85 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]'
                  : 'text-gray-500 dark:text-neutral-400'
              }`}
            >
              {dateStr}
            </span>
          </div>
        </div>

        {/* Omnibox Search Bar */}
        <form
          onSubmit={handleSearch}
          className={`w-full max-w-xl h-11 px-4 rounded-full backdrop-blur-xl border transition-all flex items-center gap-3 mb-5 ${
            wallpaperEnabled
              ? 'bg-white/95 dark:bg-neutral-900/90 border-white/40 dark:border-neutral-700/60 shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] focus-within:shadow-[0_12px_36px_rgba(14,165,233,0.35)] focus-within:border-sky-400'
              : 'bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 shadow-md hover:shadow-lg focus-within:shadow-lg focus-within:border-sky-500'
          }`}
        >
          <VscSearch size={17} className="text-gray-500 dark:text-neutral-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Google or enter URL"
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-gray-900 dark:text-neutral-100 placeholder-gray-500 dark:placeholder-neutral-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 p-1"
            >
              <VscClose size={14} />
            </button>
          )}
        </form>

        {/* Two-Row Shortcuts Grid (8 columns x 2 rows) */}
        <div className="w-full max-w-4xl grid grid-cols-4 sm:grid-cols-8 gap-y-2.5 gap-x-2 mb-3">
          {shortcuts.map((sc) => {
            const isMenuOpen = activeMenuId === sc.id;
            const hasIconError = failedFavicons[sc.id];

            return (
              <div
                key={sc.id}
                className="relative group flex flex-col items-center"
              >
                {/* Shortcut Card Button */}
                <button
                  onClick={() => navigate(sc.url)}
                  title={`${sc.title}\n${sc.url}`}
                  className={`flex flex-col items-center gap-2 p-2 rounded-2xl w-full transition-all ${
                    wallpaperEnabled
                      ? 'hover:bg-black/20 dark:hover:bg-white/10 backdrop-blur-[2px]'
                      : 'hover:bg-gray-200/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl backdrop-blur-md shadow-md border flex items-center justify-center group-hover:scale-105 group-hover:shadow-lg transition-transform overflow-hidden ${
                      wallpaperEnabled
                        ? 'bg-white/90 dark:bg-neutral-900/85 border-white/50 dark:border-neutral-700/60'
                        : 'bg-white dark:bg-neutral-800/90 border-gray-200 dark:border-neutral-700/80 shadow-sm'
                    }`}
                  >
                    {!hasIconError ? (
                      <img
                        src={sc.faviconUrl}
                        alt={sc.title}
                        className="w-6 h-6 object-contain rounded-sm"
                        onError={() =>
                          setFailedFavicons((prev) => ({ ...prev, [sc.id]: true }))
                        }
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold text-base flex items-center justify-center">
                        {sc.fallbackInitial}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[11.5px] font-medium truncate max-w-[76px] text-center transition-colors ${
                      wallpaperEnabled
                        ? 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]'
                        : 'text-gray-700 dark:text-neutral-300'
                    }`}
                  >
                    {sc.title}
                  </span>
                </button>

                {/* Hover Three-Dot Action Trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(isMenuOpen ? null : sc.id);
                  }}
                  title="More actions"
                  className={`absolute top-1 right-1 p-1 rounded-full transition-all ${
                    wallpaperEnabled
                      ? 'bg-black/60 text-white/80 hover:text-white hover:bg-black/90'
                      : 'bg-gray-300/80 dark:bg-neutral-700/80 text-gray-700 dark:text-neutral-200 hover:bg-gray-400 dark:hover:bg-neutral-600'
                  } ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <VscEllipsis size={13} />
                </button>

                {/* Kebab Dropdown Menu */}
                {isMenuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute top-8 right-1 z-30 w-32 py-1 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-xl flex flex-col text-xs text-gray-800 dark:text-neutral-200"
                  >
                    <button
                      onClick={() => openEditModal(sc)}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition-colors"
                    >
                      <VscEdit size={13} className="text-sky-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        removeShortcut(sc.id);
                        setActiveMenuId(null);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 text-left transition-colors"
                    >
                      <VscTrash size={13} />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* "+ Add Shortcut" Tile */}
          <button
            onClick={openAddModal}
            className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all group ${
              wallpaperEnabled
                ? 'hover:bg-black/20 dark:hover:bg-white/10 backdrop-blur-[2px]'
                : 'hover:bg-gray-200/70 dark:hover:bg-neutral-800/60'
            }`}
            title="Add new shortcut"
          >
            <div
              className={`w-12 h-12 rounded-2xl backdrop-blur-md border border-dashed flex items-center justify-center group-hover:scale-105 group-hover:border-sky-400 transition-all ${
                wallpaperEnabled
                  ? 'bg-white/40 dark:bg-neutral-900/50 border-white/60 dark:border-neutral-600 text-white/90 group-hover:text-white'
                  : 'bg-gray-200/60 dark:bg-neutral-800/50 border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 group-hover:text-sky-500'
              }`}
            >
              <VscAdd size={18} />
            </div>
            <span
              className={`text-[11.5px] font-medium transition-colors ${
                wallpaperEnabled
                  ? 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]'
                  : 'text-gray-600 dark:text-neutral-400'
              }`}
            >
              Add
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Customizable Widget Dock */}
      <div className="relative z-10 w-full flex items-center justify-center pb-1.5 pt-0.5 flex-shrink-0">
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-xl border transition-all shadow-[0_8px_30px_rgba(0,0,0,0.25)] ${
            wallpaperEnabled
              ? isDark
                ? 'bg-neutral-950/80 border-neutral-800/80 text-neutral-300'
                : 'bg-white/85 border-white/40 text-gray-700'
              : isDark
                ? 'bg-neutral-900/90 border-neutral-800 text-neutral-300'
                : 'bg-white/95 border-gray-200 text-gray-700'
          }`}
        >
          {/* Developer Tools */}
          <button
            onClick={() => handleOpenApp('notebook')}
            title="Dev Notebook (chrome://notebook)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium hover:text-teal-400 transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <VscBook size={14} className="text-teal-500 dark:text-teal-400" />
            <span className="hidden sm:inline">Notebook</span>
          </button>

          <button
            onClick={() => handleOpenApp('interceptor')}
            title="API Inspector (chrome://interceptor)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium hover:text-sky-400 transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <VscPulse size={14} className="text-sky-500 dark:text-sky-400" />
            <span className="hidden sm:inline">API Inspector</span>
          </button>

          <button
            onClick={() => handleOpenApp('scraper')}
            title="Web Scraper (chrome://scraper)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium hover:text-indigo-400 transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <VscSearch size={14} className="text-indigo-500 dark:text-indigo-400" />
            <span className="hidden sm:inline">Scraper</span>
          </button>

          <button
            onClick={() => handleOpenApp('automation')}
            title="Macro Automation (chrome://automation)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium hover:text-pink-400 transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <VscPlay size={14} className="text-pink-500 dark:text-pink-400" />
            <span className="hidden sm:inline">Automation</span>
          </button>

          <button
            onClick={() => handleOpenApp('extensions')}
            title="Extensions (chrome://extensions)"
            className={`p-1.5 rounded-xl hover:text-amber-400 transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <VscExtensions size={15} className="text-amber-500 dark:text-amber-400" />
          </button>

          <button
            onClick={() => handleOpenApp('downloads')}
            title="Downloads Manager (chrome://downloads)"
            className={`p-1.5 rounded-xl hover:text-emerald-400 transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <VscCloudDownload size={15} className="text-emerald-500 dark:text-emerald-400" />
          </button>

          <button
            onClick={() => handleOpenApp('settings')}
            title="Settings (chrome://settings)"
            className={`p-1.5 rounded-xl hover:text-sky-400 transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <VscSettingsGear size={15} />
          </button>

          {/* Separator */}
          <div className={`w-[1px] h-4 mx-1 ${isDark ? 'bg-white/20' : 'bg-gray-300'}`} />

          {/* Wallpaper Controls */}
          <button
            onClick={handleShuffleWallpaper}
            title="Shuffle / Change Wallpaper"
            className={`p-1.5 rounded-xl hover:text-sky-400 transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <VscSync size={14} className={isShuffling ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleToggleWallpaper}
            title={wallpaperEnabled ? 'Switch to Solid Theme' : 'Enable Wallpaper'}
            className={`p-1.5 rounded-xl transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            } ${wallpaperEnabled ? 'text-sky-500 dark:text-sky-400' : 'text-gray-400 dark:text-neutral-500'}`}
          >
            <VscSymbolColor size={14} />
          </button>

          <button
            onClick={() => {
              if (confirm('Reset shortcuts to default services?')) {
                resetToDefaults();
              }
            }}
            title="Reset shortcuts to defaults"
            className={`p-1.5 rounded-xl hover:text-red-400 transition-colors ${
              isDark ? 'hover:bg-white/10 text-neutral-400' : 'hover:bg-black/5 text-gray-500'
            }`}
          >
            <VscHistory size={14} />
          </button>
        </div>
      </div>

      {/* Edit / Add Shortcut Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-2xl p-5 text-gray-900 dark:text-white flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                <VscGlobe className="text-sky-500 dark:text-sky-400" size={16} />
                <span>{editingItem ? 'Edit Shortcut' : 'Add Shortcut'}</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-neutral-100 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                <VscClose size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600 dark:text-neutral-400 font-medium">Name</label>
                <input
                  type="text"
                  placeholder="e.g. GitHub"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-800 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-neutral-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600 dark:text-neutral-400 font-medium">URL</label>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={modalUrl}
                  onChange={(e) => setModalUrl(e.target.value)}
                  autoFocus
                  required
                  className="bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-800 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-neutral-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-sky-500 hover:bg-sky-400 text-white transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
