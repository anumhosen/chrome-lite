import React, { useEffect, useState } from 'react';
import { VscTerminal, VscShield } from 'react-icons/vsc';
import { usePanelStore } from '../../stores/usePanelStore';

export const StatusBar: React.FC = () => {
  const { togglePanel } = usePanelStore();
  const [ramMb, setRamMb] = useState<number | null>(null);

  useEffect(() => {
    const updateRam = async () => {
      if (window.chrome?.system?.getMemory) {
        try {
          const mem = await window.chrome.system.getMemory();
          if (mem?.residentSet !== undefined) {
            setRamMb(mem.residentSet);
          } else if (mem?.mainProcessRss) {
            setRamMb(Math.round(mem.mainProcessRss / 1024 / 1024));
          }
        } catch {
          // Ignore
        }
      }
    };

    updateRam();
    const interval = setInterval(updateRam, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="h-[20px] bg-gray-100 dark:bg-neutral-950 border-t border-gray-200 dark:border-neutral-800 flex items-center justify-between px-3 text-[11px] text-gray-600 dark:text-neutral-400 select-none flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-gray-800 dark:text-neutral-300 font-medium">Personal</span>
        <span className="text-gray-300 dark:text-neutral-600">|</span>
        <span className="text-gray-500 dark:text-neutral-400">Ready</span>
        <span className="text-gray-300 dark:text-neutral-600">|</span>
        <button
          onClick={() => togglePanel('console')}
          className="flex items-center gap-1 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-800/80 px-1.5 py-0.5 rounded transition-colors"
          title="Toggle Developer Console (Ctrl+`)"
        >
          <VscTerminal size={12} />
          <span>Console</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <VscShield size={12} />
          <span>Shield Active</span>
        </div>
        <span className="text-gray-300 dark:text-neutral-600">|</span>
        <button
          onClick={() => togglePanel('memory')}
          className="text-gray-700 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-800/80 px-1.5 py-0.5 rounded font-mono text-[10.5px] transition-colors"
          title="Open RAM & System Dashboard"
        >
          RAM: {ramMb !== null ? `${ramMb} MB` : '-- MB'}
        </button>
      </div>
    </footer>
  );
};

