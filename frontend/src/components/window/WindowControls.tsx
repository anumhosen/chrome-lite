import React, { useEffect, useState } from 'react';
import {
  VscChromeMinimize,
  VscChromeMaximize,
  VscChromeRestore,
  VscChromeClose,
} from 'react-icons/vsc';

import { getChromeAPI } from '../../lib/chrome';

export const WindowControls: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const api = getChromeAPI();
    if (!api?.window) return;

    api.window.isMaximized().then(setIsMaximized).catch(() => { });

    if (api.on) {
      const unsub = api.on('chrome:window:maximized-change', (maxState: boolean) => {
        setIsMaximized(maxState);
      });
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, []);

  const handleMinimize = () => {
    getChromeAPI()?.window?.minimize();
  };

  const handleMaximize = () => {
    getChromeAPI()?.window?.maximize();
  };

  const handleClose = () => {
    getChromeAPI()?.window?.close();
  };

  return (
    <div className="flex items-center h-[38px] select-none app-no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
      <button
        onClick={handleMinimize}
        title="Minimize"
        className="h-full px-3 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center text-xs"
      >
        <VscChromeMinimize size={16} />
      </button>
      <button
        onClick={handleMaximize}
        title={isMaximized ? 'Restore Down' : 'Maximize'}
        className="h-full px-3 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center text-xs"
      >
        {isMaximized ? <VscChromeRestore size={16} /> : <VscChromeMaximize size={14} />}
      </button>
      <button
        onClick={handleClose}
        title="Close"
        className="h-full px-3.5 text-gray-500 dark:text-neutral-400 hover:text-white hover:bg-red-600 transition-colors flex items-center justify-center text-xs"
      >
        <VscChromeClose size={14} />
      </button>
    </div>
  );
};
