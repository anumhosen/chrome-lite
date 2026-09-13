import React, { useEffect, useState } from 'react';
import { VscRefresh, VscTrash, VscCloudDownload } from 'react-icons/vsc';

interface DetailedMemory {
  residentSet: number;
  heapUsed: number;
  privateMemory?: number;
  dbSizeMb: string | number;
  totalTabs: number;
  activeTabs: number;
  hibernatedTabs: number;
}

export const SystemDashboardPanel: React.FC = () => {
  const [mem, setMem] = useState<DetailedMemory | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchMetrics = async () => {
    if (!window.chrome?.system?.getDetailedMemory) return;
    try {
      const data = await window.chrome.system.getDetailedMemory();
      setMem(data);
    } catch (err: any) {
      setMsg(`Error querying metrics: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2500);
    return () => clearInterval(interval);
  }, []);

  const handlePurgeCache = async () => {
    setLoading(true);
    try {
      if (window.chrome?.history?.clearCache) {
        await window.chrome.history.clearCache();
        setMsg('Memory cache successfully purged.');
        await fetchMetrics();
      }
    } catch (err: any) {
      setMsg(`Cache clear failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForceHibernate = async () => {
    setLoading(true);
    try {
      if (window.chrome?.system?.forceHibernate) {
        await window.chrome.system.forceHibernate();
        setMsg('Inactive tabs successfully hibernated.');
        await fetchMetrics();
      }
    } catch (err: any) {
      setMsg(`Hibernation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const rss = mem?.residentSet || 0;
  const isHighRam = rss > 450;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Live System Metrics</span>
        <button
          onClick={fetchMetrics}
          title="Refresh Metrics"
          className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
        >
          <VscRefresh size={13} />
        </button>
      </div>

      {msg && (
        <div className="text-[11px] px-2.5 py-1.5 rounded bg-sky-950/60 border border-sky-800/80 text-sky-300">
          {msg}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded bg-neutral-950 border border-neutral-800 flex flex-col gap-1">
          <span className="text-[10px] uppercase text-neutral-500 font-semibold">Total RSS RAM</span>
          <span className={`text-xl font-bold font-mono ${isHighRam ? 'text-amber-400' : 'text-emerald-400'}`}>
            {mem ? `${mem.residentSet} MB` : '--'}
          </span>
          <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full transition-all ${isHighRam ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (rss / 600) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded bg-neutral-950 border border-neutral-800 flex flex-col gap-1">
          <span className="text-[10px] uppercase text-neutral-500 font-semibold">V8 JS Heap</span>
          <span className="text-xl font-bold font-mono text-sky-400">
            {mem ? `${mem.heapUsed} MB` : '--'}
          </span>
          <span className="text-[10px] text-neutral-500">Internal JS engine memory</span>
        </div>

        <div className="p-3 rounded bg-neutral-950 border border-neutral-800 flex flex-col gap-1">
          <span className="text-[10px] uppercase text-neutral-500 font-semibold">Active / Total Tabs</span>
          <span className="text-xl font-bold font-mono text-neutral-200">
            {mem ? `${mem.activeTabs} / ${mem.totalTabs}` : '--'}
          </span>
          <span className="text-[10px] text-neutral-500">Current open tabs</span>
        </div>

        <div className="p-3 rounded bg-neutral-950 border border-neutral-800 flex flex-col gap-1">
          <span className="text-[10px] uppercase text-neutral-500 font-semibold">Sleeping Tabs</span>
          <span className="text-xl font-bold font-mono text-purple-400">
            {mem ? `${mem.hibernatedTabs}` : '--'}
          </span>
          <span className="text-[10px] text-neutral-500">Hibernated to save RAM</span>
        </div>
      </div>

      <div className="p-3 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between">
        <span className="text-[11px] text-neutral-400">SQLite Database Footprint</span>
        <span className="font-mono font-medium text-neutral-200 text-xs">
          {mem ? `${mem.dbSizeMb} MB` : '--'}
        </span>
      </div>

      {/* RAM Optimization Actions */}
      <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800">
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Memory Optimizer</span>

        <button
          onClick={handlePurgeCache}
          disabled={loading}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
        >
          <VscTrash size={13} className="text-amber-400" />
          <span>Purge Browser Cache & Memory</span>
        </button>

        <button
          onClick={handleForceHibernate}
          disabled={loading}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
        >
          <VscCloudDownload size={13} className="text-purple-400" />
          <span>Force Hibernate Inactive Tabs</span>
        </button>
      </div>
    </div>
  );
};
