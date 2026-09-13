import React from 'react';
import { VscArrowUp, VscArrowDown, VscTrash } from 'react-icons/vsc';
import type { AutomationStep } from './automationTypes';

interface StepEditorProps {
  step: AutomationStep;
  index: number;
  totalSteps: number;
  isCurrent: boolean;
  onUpdate: (updates: Partial<AutomationStep>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const StepEditor: React.FC<StepEditorProps> = ({
  step,
  index,
  totalSteps,
  isCurrent,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}) => {
  return (
    <div
      className={`p-2 rounded border flex flex-col gap-1.5 transition-colors ${
        isCurrent
          ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-500/80 shadow-xs'
          : 'bg-white dark:bg-neutral-900/80 border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-neutral-800 font-mono font-bold text-[10px] flex items-center justify-center text-gray-700 dark:text-neutral-300">
            {index + 1}
          </span>
          <span
            className={`font-mono uppercase font-bold text-[10.5px] ${
              step.type.startsWith('if_')
                ? 'text-amber-600 dark:text-amber-400'
                : step.type === 'loop_elements'
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-sky-600 dark:text-sky-400'
            }`}
          >
            {step.type.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 disabled:opacity-20"
            title="Move step up"
          >
            <VscArrowUp size={11} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalSteps - 1}
            className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 disabled:opacity-20"
            title="Move step down"
          >
            <VscArrowDown size={11} />
          </button>
          <button
            onClick={onRemove}
            className="p-1 rounded text-gray-400 hover:text-rose-500"
            title="Delete step"
          >
            <VscTrash size={11} />
          </button>
        </div>
      </div>

      {/* Step Field Inputs */}
      <div className="flex items-center gap-1.5 text-xs font-mono flex-wrap">
        {step.type === 'click' && (
          <input
            type="text"
            value={step.selector || ''}
            onChange={(e) => onUpdate({ selector: e.target.value })}
            placeholder="CSS selector (e.g. button.submit)"
            className="flex-1 min-w-[200px] bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 py-0.5 text-[10.5px] outline-none focus:border-sky-500 text-gray-800 dark:text-neutral-200"
          />
        )}

        {step.type === 'type' && (
          <>
            <input
              type="text"
              value={step.selector || ''}
              onChange={(e) => onUpdate({ selector: e.target.value })}
              placeholder="Selector (e.g. input#email)"
              className="w-1/2 min-w-[140px] bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 py-0.5 text-[10.5px] outline-none focus:border-sky-500 text-gray-800 dark:text-neutral-200"
            />
            <input
              type="text"
              value={step.value || ''}
              onChange={(e) => onUpdate({ value: e.target.value })}
              placeholder="Text to type"
              className="flex-1 min-w-[140px] bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 py-0.5 text-[10.5px] outline-none focus:border-sky-500 text-gray-800 dark:text-neutral-200"
            />
          </>
        )}

        {step.type === 'wait' && (
          <div className="flex items-center gap-1">
            <span className="text-gray-400 dark:text-neutral-500 text-[10.5px]">Sleep (ms):</span>
            <input
              type="number"
              value={step.ms || 1000}
              onChange={(e) => onUpdate({ ms: parseInt(e.target.value, 10) || 500 })}
              className="w-24 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 py-0.5 text-[10.5px] outline-none focus:border-sky-500 text-gray-800 dark:text-neutral-200"
            />
          </div>
        )}

        {step.type === 'scroll' && (
          <div className="flex items-center gap-1">
            <span className="text-gray-400 dark:text-neutral-500 text-[10.5px]">Offset Y (px):</span>
            <input
              type="number"
              value={step.y || 500}
              onChange={(e) => onUpdate({ y: parseInt(e.target.value, 10) || 500 })}
              className="w-24 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 py-0.5 text-[10.5px] outline-none focus:border-sky-500 text-gray-800 dark:text-neutral-200"
            />
          </div>
        )}

        {step.type === 'navigate' && (
          <input
            type="text"
            value={step.url || ''}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder="https://..."
            className="flex-1 min-w-[200px] bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 py-0.5 text-[10.5px] outline-none focus:border-sky-500 text-gray-800 dark:text-neutral-200"
          />
        )}

        {step.type === 'extract' && (
          <input
            type="text"
            value={step.selector || ''}
            onChange={(e) => onUpdate({ selector: e.target.value })}
            placeholder="Extraction selector (e.g. h2, .item)"
            className="flex-1 min-w-[200px] bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 py-0.5 text-[10.5px] outline-none focus:border-sky-500 text-gray-800 dark:text-neutral-200"
          />
        )}

        {step.type === 'screenshot' && (
          <span className="text-[10px] text-gray-400 dark:text-neutral-500 italic">
            Saves viewport PNG to storage/exports/
          </span>
        )}

        {step.type === 'if_element_exists' && (
          <div className="w-full flex flex-col gap-1.5 mt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-neutral-400 text-[10.5px] font-sans">Check Selector:</span>
              <input
                type="text"
                value={step.selector || ''}
                onChange={(e) => onUpdate({ selector: e.target.value })}
                placeholder="e.g. .cookie-modal, #recaptcha"
                className="flex-1 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 py-0.5 text-[10.5px] text-gray-800 dark:text-neutral-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-neutral-400 text-[10.5px] font-sans">Then Action:</span>
              <select
                value={step.thenAction || 'click'}
                onChange={(e) => onUpdate({ thenAction: e.target.value as any })}
                className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 py-0.5 text-[10.5px] text-gray-800 dark:text-neutral-200"
              >
                <option value="click">Click Target</option>
                <option value="wait">Wait 1s</option>
                <option value="extract">Extract</option>
                <option value="scroll">Scroll Down</option>
              </select>
              <input
                type="text"
                value={step.thenSelector || ''}
                onChange={(e) => onUpdate({ thenSelector: e.target.value })}
                placeholder="Target selector to click (optional if same)"
                className="flex-1 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 py-0.5 text-[10.5px] text-gray-800 dark:text-neutral-200"
              />
            </div>
          </div>
        )}

        {step.type === 'if_text_contains' && (
          <div className="w-full flex flex-col gap-1.5 mt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-neutral-400 text-[10.5px] font-sans">Text to find:</span>
              <input
                type="text"
                value={step.text || ''}
                onChange={(e) => onUpdate({ text: e.target.value })}
                placeholder="e.g. Welcome back, Error, Out of stock"
                className="flex-1 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 py-0.5 text-[10.5px] text-gray-800 dark:text-neutral-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-neutral-400 text-[10.5px] font-sans">If found, click:</span>
              <input
                type="text"
                value={step.thenSelector || ''}
                onChange={(e) => onUpdate({ thenSelector: e.target.value, thenAction: 'click' })}
                placeholder="Target selector (e.g. button.retry)"
                className="flex-1 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 py-0.5 text-[10.5px] text-gray-800 dark:text-neutral-200"
              />
            </div>
          </div>
        )}

        {step.type === 'loop_elements' && (
          <div className="w-full flex items-center gap-2 mt-0.5">
            <span className="text-gray-500 dark:text-neutral-400 text-[10.5px] font-sans">For each item in:</span>
            <input
              type="text"
              value={step.selector || ''}
              onChange={(e) => onUpdate({ selector: e.target.value })}
              placeholder=".item-card, .search-row"
              className="flex-1 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 py-0.5 text-[10.5px] text-gray-800 dark:text-neutral-200"
            />
            <span className="text-gray-500 dark:text-neutral-400 text-[10.5px] font-sans">Max:</span>
            <input
              type="number"
              value={step.maxIterations || 5}
              onChange={(e) => onUpdate({ maxIterations: parseInt(e.target.value, 10) || 5 })}
              className="w-14 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-1.5 py-0.5 text-[10.5px] text-gray-800 dark:text-neutral-200"
            />
            <select
              value={step.loopAction || 'extract'}
              onChange={(e) => onUpdate({ loopAction: e.target.value as any })}
              className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 py-0.5 text-[10.5px] text-gray-800 dark:text-neutral-200"
            >
              <option value="extract">Extract text</option>
              <option value="click">Click each</option>
              <option value="scroll">Scroll to each</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
