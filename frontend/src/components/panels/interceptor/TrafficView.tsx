import React, { useState } from 'react';
import { VscFilter } from 'react-icons/vsc';
import type { RequestItem } from './interceptorTypes';

interface TrafficViewProps {
  requests: RequestItem[];
  onSelectRequest: (req: RequestItem) => void;
}

export const TrafficView: React.FC<TrafficViewProps> = ({
  requests,
  onSelectRequest,
}) => {
  const [filter, setFilter] = useState('');

  const filtered = requests.filter(
    (r) =>
      r.url.toLowerCase().includes(filter.toLowerCase()) ||
      r.method.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      {/* Filter Bar */}
      <div className="flex items-center bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 py-1 gap-1.5 focus-within:border-sky-500 transition-colors">
        <VscFilter size={13} className="text-gray-400 dark:text-neutral-500 flex-shrink-0" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter URL or method (GET, POST)..."
          className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-neutral-200 text-xs placeholder-gray-400 dark:placeholder-neutral-500 font-mono"
        />
      </div>

      {/* Request List */}
      <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-gray-200 dark:divide-neutral-800/80 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-md">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-neutral-500 text-xs">
            {requests.length === 0 ? 'No network requests intercepted yet.' : 'No requests match your filter.'}
          </div>
        ) : (
          filtered.map((r) => {
            const isOk = !r.status || (r.status >= 200 && r.status < 400);
            return (
              <div
                key={r.id}
                onClick={() => onSelectRequest(r)}
                className="p-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-neutral-900/60 cursor-pointer transition-colors gap-2"
              >
                <span
                  className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                    r.method === 'POST'
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400'
                      : r.method === 'DELETE'
                      ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400'
                      : 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-400'
                  }`}
                >
                  {r.method}
                </span>

                <span className="flex-1 font-mono text-[11px] text-gray-700 dark:text-neutral-300 truncate">
                  {r.url}
                </span>

                <span
                  className={`font-mono text-[10.5px] font-medium ${
                    isOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {r.status || '...'}
                </span>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};
