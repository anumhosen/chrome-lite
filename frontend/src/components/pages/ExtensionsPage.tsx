import React, { useState, useEffect } from 'react';
import {
  VscExtensions,
  VscSearch,
  VscPin,
  VscPinned,
  VscRefresh,
  VscClose,
  VscCheck,
  VscCopy,
  VscLinkExternal,
} from 'react-icons/vsc';
import { useExtensionStore } from '../../stores/useExtensionStore';
import { useTabStore } from '../../stores/useTabStore';
import { getExtensionIcon } from '../extensions/ExtensionsMenu';
import type { ChromeExtension } from '../../types/chrome';

export const ExtensionsPage: React.FC = () => {
  const { extensions, togglePin, toggleEnabled, initExtensionStates } = useExtensionStore();
  const { createTab } = useTabStore();
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [selectedExt, setSelectedExt] = useState<ChromeExtension | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    initExtensionStates();
  }, [initExtensionStates]);

  const enabledCount = extensions.filter((e) => e.enabled).length;
  const disabledCount = extensions.filter((e) => !e.enabled).length;

  const filteredExtensions = extensions.filter((ext) => {
    // Search text filter
    const matchesSearch =
      ext.name.toLowerCase().includes(filter.toLowerCase()) ||
      ext.description.toLowerCase().includes(filter.toLowerCase()) ||
      ext.id.toLowerCase().includes(filter.toLowerCase());

    if (!matchesSearch) return false;

    // Status tab filter
    if (activeTab === 'enabled') return ext.enabled;
    if (activeTab === 'disabled') return !ext.enabled;
    return true;
  });

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
    }, 800);
  };

  const handleLaunchExtension = (ext: ChromeExtension) => {
    if (ext.hasPopup) {
      useExtensionStore.getState().openPopup(ext.id as any);
    } else {
      createTab(`chrome://${ext.id}`);
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 flex flex-col select-none overflow-y-auto">
      {/* Chrome Extensions Header */}
      <header className="h-[56px] px-8 bg-white dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <VscExtensions size={20} />
          </div>
          <span className="font-semibold text-lg tracking-tight">Extensions</span>
        </div>

        {/* Search Extensions Bar */}
        <div className="w-96 h-9 px-3 bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full flex items-center gap-2 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition-all">
          <VscSearch size={15} className="text-gray-400 dark:text-neutral-500 flex-shrink-0" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search extensions"
            className="flex-1 bg-transparent border-none outline-none text-xs text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500"
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200"
              title="Clear search"
            >
              <VscClose size={14} />
            </button>
          )}
        </div>

        {/* Developer Mode Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600 dark:text-neutral-400 font-medium">Developer mode</span>
          <button
            type="button"
            role="switch"
            aria-checked={isDeveloperMode}
            onClick={() => setIsDeveloperMode((prev) => !prev)}
            title={isDeveloperMode ? 'Disable developer mode' : 'Enable developer mode'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer p-1 ${
              isDeveloperMode ? 'bg-sky-600' : 'bg-gray-300 dark:bg-neutral-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                isDeveloperMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </header>

      {/* Developer Mode Sub-Bar */}
      {isDeveloperMode && (
        <div className="h-12 px-8 bg-gray-100/90 dark:bg-neutral-900/90 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => alert('Standard unpacked extensions will be loaded from local directory in Developer Mode.')}
              className="px-3.5 py-1.5 rounded-md bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-800 dark:text-neutral-200 font-medium transition-colors shadow-sm"
            >
              Load unpacked
            </button>
            <button
              onClick={() => alert('Pack extension feature ready.')}
              className="px-3.5 py-1.5 rounded-md bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-800 dark:text-neutral-200 font-medium transition-colors shadow-sm"
            >
              Pack extension
            </button>
            <button
              onClick={handleUpdate}
              className="px-3.5 py-1.5 rounded-md bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-800 dark:text-neutral-200 font-medium transition-colors shadow-sm flex items-center gap-1.5"
            >
              <VscRefresh size={13} className={isUpdating ? 'animate-spin' : ''} />
              <span>{isUpdating ? 'Updating...' : 'Update'}</span>
            </button>
          </div>
          <span className="text-[11px] text-gray-500 dark:text-neutral-400 font-mono">
            Developer Mode Active
          </span>
        </div>
      )}

      {/* Main Extensions Content */}
      <main className="max-w-6xl w-full mx-auto p-8 flex-1">
        {/* Top Controls: Status Tabs & Counts */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200/80 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-sky-600 text-white'
                  : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-800'
              }`}
            >
              All ({extensions.length})
            </button>
            <button
              onClick={() => setActiveTab('enabled')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeTab === 'enabled'
                  ? 'bg-sky-600 text-white'
                  : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-800'
              }`}
            >
              Active ({enabledCount})
            </button>
            <button
              onClick={() => setActiveTab('disabled')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeTab === 'disabled'
                  ? 'bg-sky-600 text-white'
                  : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-800'
              }`}
            >
              Disabled ({disabledCount})
            </button>
          </div>

          <span className="text-xs text-gray-500 dark:text-neutral-400">
            Chrome Lite Core Extensions
          </span>
        </div>

        {/* Empty State */}
        {filteredExtensions.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 p-8 shadow-sm">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-neutral-900 flex items-center justify-center text-gray-400 dark:text-neutral-500">
              <VscExtensions size={24} />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-neutral-200">No extensions found</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
              {filter ? `No extension matches "${filter}".` : 'No extensions in this category.'}
            </p>
            {filter && (
              <button
                onClick={() => setFilter('')}
                className="mt-3 px-3 py-1 text-xs text-sky-600 dark:text-sky-400 font-medium hover:underline"
              >
                Clear search filter
              </button>
            )}
          </div>
        )}

        {/* Extensions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExtensions.map((ext) => (
            <div
              key={ext.id}
              className={`rounded-xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                ext.enabled
                  ? 'bg-white dark:bg-neutral-950 border-gray-200 dark:border-neutral-800'
                  : 'bg-gray-50/70 dark:bg-neutral-950/40 border-gray-200/60 dark:border-neutral-800/60 opacity-80'
              }`}
            >
              <div>
                {/* Header: Icon, Name, Version, Status Pill, Toggle Switch */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors ${
                        ext.enabled
                          ? 'bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800'
                          : 'bg-gray-100/50 dark:bg-neutral-900/50 border-gray-200/50 dark:border-neutral-800/50 grayscale'
                      }`}
                    >
                      {getExtensionIcon(ext.id, 24)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900 dark:text-neutral-100 truncate">
                          {ext.name}
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-neutral-500 font-mono">
                          {ext.version}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            ext.enabled
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-gray-200/60 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              ext.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400 dark:bg-neutral-500'
                            }`}
                          />
                          {ext.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <span className="text-[11.5px] text-gray-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {ext.description}
                      </span>
                    </div>
                  </div>

                  {/* Enable / Disable Toggle Switch */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={ext.enabled}
                      onClick={() => toggleEnabled(ext.id)}
                      title={ext.enabled ? 'Click to disable extension' : 'Click to enable extension'}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer p-1 focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
                        ext.enabled ? 'bg-sky-600' : 'bg-gray-300 dark:bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                          ext.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[9.5px] font-medium text-gray-400 dark:text-neutral-500">
                      {ext.enabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>

                {/* Developer Mode Metadata */}
                {isDeveloperMode && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-900 flex flex-col gap-1 text-[11px] text-gray-400 dark:text-neutral-500 font-mono animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span>ID: {ext.id}</span>
                      <button
                        onClick={(e) => handleCopyId(ext.id, e)}
                        className="flex items-center gap-1 text-[10.5px] text-sky-600 dark:text-sky-400 hover:underline"
                        title="Copy extension ID"
                      >
                        {copiedId === ext.id ? <VscCheck size={12} className="text-emerald-500" /> : <VscCopy size={11} />}
                        <span>{copiedId === ext.id ? 'Copied' : 'Copy ID'}</span>
                      </button>
                    </div>
                    {ext.permissions && (
                      <div className="text-[10px] text-gray-500 truncate">
                        Permissions: {ext.permissions.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-2.5 flex items-center justify-between border-t border-gray-100 dark:border-neutral-900">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedExt(ext)}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
                  >
                    Details
                  </button>

                  <button
                    onClick={() => alert(`Built-in extension "${ext.name}" is a core component of Chrome Lite and cannot be removed. You can disable it anytime using the toggle switch.`)}
                    className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Remove extension"
                  >
                    Remove
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Launch / Options Button */}
                  <button
                    onClick={() => handleLaunchExtension(ext)}
                    disabled={!ext.enabled}
                    title={ext.enabled ? 'Open extension interface' : 'Enable extension to open'}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      ext.enabled
                        ? 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                        : 'text-gray-400 dark:text-neutral-600 cursor-not-allowed'
                    }`}
                  >
                    <VscLinkExternal size={12} />
                    <span>Open</span>
                  </button>

                  {/* Pin to Toolbar Button */}
                  <button
                    onClick={() => togglePin(ext.id)}
                    disabled={!ext.enabled}
                    title={
                      !ext.enabled
                        ? 'Enable extension to pin to toolbar'
                        : ext.pinned
                        ? 'Unpin from toolbar'
                        : 'Pin to toolbar'
                    }
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
                      !ext.enabled
                        ? 'text-gray-300 dark:text-neutral-700 cursor-not-allowed'
                        : ext.pinned
                        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-medium border border-sky-200/50 dark:border-sky-800/40'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {ext.pinned ? <VscPinned size={13} /> : <VscPin size={13} />}
                    <span>{ext.pinned ? 'Pinned' : 'Pin'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Details Modal */}
      {selectedExt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 flex items-center justify-center flex-shrink-0">
                  {getExtensionIcon(selectedExt.id, 22)}
                </div>
                <div className="flex flex-col">
                  <h3 className="font-semibold text-base text-gray-900 dark:text-neutral-100">
                    {selectedExt.name}
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">Version {selectedExt.version}</span>
                </div>
              </div>

              {/* Modal Enable Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-neutral-400">
                  {selectedExt.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={selectedExt.enabled}
                  onClick={() => toggleEnabled(selectedExt.id)}
                  title={selectedExt.enabled ? 'Disable extension' : 'Enable extension'}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer p-1 ${
                    selectedExt.enabled ? 'bg-sky-600' : 'bg-gray-300 dark:bg-neutral-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                      selectedExt.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-3.5 text-xs text-gray-700 dark:text-neutral-300">
              <div>
                <span className="font-semibold text-gray-900 dark:text-neutral-100 block mb-0.5">Description</span>
                <p className="text-gray-600 dark:text-neutral-400 leading-relaxed">
                  {selectedExt.description}
                </p>
              </div>

              <div>
                <span className="font-semibold text-gray-900 dark:text-neutral-100 block mb-0.5">Permissions</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(selectedExt.permissions || ['activeTab']).map((p: string) => (
                    <span
                      key={p}
                      className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-[11px] font-mono text-gray-700 dark:text-neutral-300"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-neutral-900/60 border border-gray-100 dark:border-neutral-800">
                  <span className="text-gray-400 block text-[10.5px] uppercase font-semibold">Source</span>
                  <span className="text-gray-800 dark:text-neutral-200 font-medium">Chrome Lite Core</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-neutral-900/60 border border-gray-100 dark:border-neutral-800">
                  <span className="text-gray-400 block text-[10.5px] uppercase font-semibold">Site Access</span>
                  <span className="text-gray-800 dark:text-neutral-200 font-medium">On all sites</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <button
                onClick={() => {
                  togglePin(selectedExt.id);
                }}
                disabled={!selectedExt.enabled}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !selectedExt.enabled
                    ? 'text-gray-400 dark:text-neutral-600 cursor-not-allowed'
                    : selectedExt.pinned
                    ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/40'
                    : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-700'
                }`}
              >
                {selectedExt.pinned ? <VscPinned size={14} /> : <VscPin size={14} />}
                <span>{selectedExt.pinned ? 'Pinned to toolbar' : 'Pin to toolbar'}</span>
              </button>

              <button
                onClick={() => setSelectedExt(null)}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
