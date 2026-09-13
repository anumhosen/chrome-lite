import React, { useState } from 'react';
import { VscChevronRight, VscChevronDown } from 'react-icons/vsc';

interface ObjectTreeProps {
  data: any;
  name?: string;
  depth?: number;
  maxDepth?: number;
}

export const ObjectTree: React.FC<ObjectTreeProps> = ({
  data,
  name,
  depth = 0,
  maxDepth = 6,
}) => {
  const [isExpanded, setIsExpanded] = useState(depth < 1);

  if (data === null) {
    return (
      <span className="font-mono text-xs">
        {name && <span className="text-gray-500 dark:text-neutral-400 mr-1">{name}:</span>}
        <span className="text-neutral-400 italic">null</span>
      </span>
    );
  }

  if (data === undefined) {
    return (
      <span className="font-mono text-xs">
        {name && <span className="text-gray-500 dark:text-neutral-400 mr-1">{name}:</span>}
        <span className="text-neutral-400 italic">undefined</span>
      </span>
    );
  }

  const type = typeof data;

  if (type === 'string') {
    return (
      <span className="font-mono text-xs">
        {name && <span className="text-gray-500 dark:text-neutral-400 mr-1">{name}:</span>}
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">"{data}"</span>
      </span>
    );
  }

  if (type === 'number') {
    return (
      <span className="font-mono text-xs">
        {name && <span className="text-gray-500 dark:text-neutral-400 mr-1">{name}:</span>}
        <span className="text-sky-600 dark:text-sky-400 font-medium">{data}</span>
      </span>
    );
  }

  if (type === 'boolean') {
    return (
      <span className="font-mono text-xs">
        {name && <span className="text-gray-500 dark:text-neutral-400 mr-1">{name}:</span>}
        <span className="text-amber-600 dark:text-amber-400 font-medium">{String(data)}</span>
      </span>
    );
  }

  if (type !== 'object') {
    return (
      <span className="font-mono text-xs">
        {name && <span className="text-gray-500 dark:text-neutral-400 mr-1">{name}:</span>}
        <span className="text-gray-700 dark:text-neutral-300">{String(data)}</span>
      </span>
    );
  }

  const isArray = Array.isArray(data);
  const keys = Object.keys(data);
  const preview = isArray
    ? `Array(${data.length})`
    : `{ ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''} }`;

  if (depth >= maxDepth) {
    return (
      <span className="font-mono text-xs text-gray-500 dark:text-neutral-400">
        {name && <span className="mr-1">{name}:</span>}
        <span>{preview}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col font-mono text-xs my-0.5">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800/50 rounded py-0.5 px-1 w-fit select-none"
      >
        <span className="text-gray-400 dark:text-neutral-500">
          {isExpanded ? <VscChevronDown size={11} /> : <VscChevronRight size={11} />}
        </span>
        {name && <span className="text-sky-600 dark:text-sky-400 font-medium">{name}:</span>}
        <span className="text-gray-600 dark:text-neutral-400 italic">
          {isExpanded ? (isArray ? '[' : '{') : preview}
        </span>
      </div>

      {isExpanded && (
        <div className="flex flex-col pl-4 border-l border-gray-200 dark:border-neutral-800/80 ml-2 mt-0.5 gap-0.5">
          {keys.map((key) => (
            <ObjectTree
              key={key}
              data={data[key]}
              name={key}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
          <span className="text-gray-500 dark:text-neutral-400 text-[11px] select-none">
            {isArray ? ']' : '}'}
          </span>
        </div>
      )}
    </div>
  );
};
