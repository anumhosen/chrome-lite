import React, { useState, useEffect } from 'react';
import {
  VscPlay,
  VscDebugStop,
  VscSave,
  VscTrash,
  VscLoading,
  VscFolderOpened,
  VscCheck,
  VscCode,
  VscGitBranch,
  VscSync,
  VscWatch,
  VscGlobe,
} from 'react-icons/vsc';
import { useTabBindingStore } from '../../stores/useTabBindingStore';
import { TabBindingBar } from '../common/TabBindingBar';
import { SchedulerView } from './automation/SchedulerView';
import { StepEditor } from './automation/StepEditor';
import { PlaywrightExportModal } from './automation/PlaywrightExportModal';
import { generateLocalPlaywrightScript } from './automation/playwrightGenerator';
import { chromeApi } from '../../services/chromeApi';
import type { AutomationStep, AutomationFlow, StepProgress } from './automation/automationTypes';

export type { AutomationStep };

export const AutomationPanel: React.FC = () => {
  const [panelTab, setPanelTab] = useState<'builder' | 'scheduler'>('builder');
  const [flows, setFlows] = useState<AutomationFlow[]>([]);
  const [flowName, setFlowName] = useState('New Macro Flow');
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [steps, setSteps] = useState<AutomationStep[]>([{ type: 'wait', ms: 1000 }]);
  const [isRecording, setIsRecording] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<StepProgress | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [isSaved, setIsSaved] = useState(false);

  // Playwright Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [playwrightScript, setPlaywrightScript] = useState('');

  const { getBoundTab } = useTabBindingStore();
  const boundTab = getBoundTab();
  const boundTabId = boundTab?.id || null;

  const fetchFlows = async () => {
    try {
      const list = await chromeApi.automation.getFlows();
      setFlows(list || []);
    } catch { }
  };

  useEffect(() => {
    fetchFlows();

    const unsub = chromeApi.automation.onProgress((data: any) => {
      setProgress(data);
      if (data.status === 'error') {
        setStatusMessage(`Step ${data.stepIndex + 1} failed: ${data.error}`);
      } else if (data.status === 'running') {
        setStatusMessage(`Running Step ${data.stepIndex + 1} of ${data.totalSteps}...`);
      }
    });

    return unsub;
  }, []);

  const handleStartRecording = async () => {
    if (!boundTabId) {
      setStatusMessage('Please select a target web tab above before recording.');
      return;
    }
    try {
      await chromeApi.automation.startRecorder(boundTabId);
      setIsRecording(true);
      setStatusMessage('🔴 Recording live user actions on the target tab...');
    } catch (err: any) {
      setStatusMessage(`Failed to start recorder: ${err.message}`);
    }
  };

  const handleStopRecording = async () => {
    if (!boundTabId) return;
    try {
      const recordedSteps = await chromeApi.automation.stopRecorder(boundTabId);
      setIsRecording(false);
      if (Array.isArray(recordedSteps) && recordedSteps.length > 0) {
        setSteps((prev) => [...prev, ...recordedSteps]);
        setStatusMessage(`Captured ${recordedSteps.length} live actions into steps!`);
      } else {
        setStatusMessage('Recorder stopped. No actions captured.');
      }
    } catch (err: any) {
      setIsRecording(false);
      setStatusMessage(`Error stopping recorder: ${err.message}`);
    }
  };

  const handleRunFlow = async () => {
    if (!boundTabId) {
      setStatusMessage('Please select a target web tab above.');
      return;
    }
    if (steps.length === 0) {
      setStatusMessage('Flow has no steps to execute.');
      return;
    }

    setIsRunning(true);
    setProgress(null);
    setStatusMessage('Executing automation flow...');

    try {
      const report = await chromeApi.automation.runFlow(boundTabId, {
        id: activeFlowId,
        name: flowName,
        steps,
      });

      if (report?.success) {
        setStatusMessage(`Completed ${report.completedSteps}/${report.totalSteps} steps in ${report.durationMs}ms`);
      } else {
        setStatusMessage(`Flow stopped with error: ${report?.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setStatusMessage(`Execution error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunHeadless = async () => {
    if (steps.length === 0) {
      setStatusMessage('Flow has no steps to execute.');
      return;
    }

    setIsRunning(true);
    setStatusMessage('Running flow headlessly in background...');
    try {
      const res = await chromeApi.automation.runFlowHeadless(
        { id: activeFlowId, name: flowName, steps },
        boundTab?.url || undefined
      );
      if (res?.success) {
        setStatusMessage(`Headless run complete: ${res.completedSteps}/${res.totalSteps} steps (${res.durationMs}ms)`);
      } else {
        setStatusMessage(`Headless run failed: ${res?.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setStatusMessage(`Headless error: ${err.message}`);
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  const handleSaveFlow = async () => {
    if (!flowName.trim()) return;
    try {
      const saved = await chromeApi.automation.saveFlow({
        id: activeFlowId || undefined,
        name: flowName,
        steps,
      });
      if (saved?.id) {
        setActiveFlowId(saved.id);
        fetchFlows();
        setIsSaved(true);
        setStatusMessage(`Saved flow "${flowName}" to library!`);
        setTimeout(() => setIsSaved(false), 2000);
      }
    } catch (err: any) {
      setStatusMessage(`Save failed: ${err.message}`);
    }
  };

  const handleLoadFlow = (flow: any) => {
    setActiveFlowId(flow.id);
    setFlowName(flow.name);
    setSteps(flow.steps || []);
    setStatusMessage(`Loaded flow "${flow.name}"`);
  };

  const handleDeleteFlow = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chromeApi.automation.deleteFlow(id);
      if (activeFlowId === id) {
        setActiveFlowId(null);
        setFlowName('New Macro Flow');
        setSteps([]);
      }
      fetchFlows();
      setStatusMessage('Flow deleted.');
    } catch { }
  };

  const handleAddStep = (type: AutomationStep['type']) => {
    const defaultStep: AutomationStep = { type };
    if (type === 'wait') defaultStep.ms = 1000;
    if (type === 'click') defaultStep.selector = 'button';
    if (type === 'type') {
      defaultStep.selector = 'input';
      defaultStep.value = '';
    }
    if (type === 'navigate') defaultStep.url = boundTab?.url || 'https://';
    if (type === 'scroll') defaultStep.y = 500;
    if (type === 'extract') defaultStep.selector = 'h2';
    if (type === 'if_element_exists') {
      defaultStep.selector = '.cookie-modal, .banner-close';
      defaultStep.thenAction = 'click';
      defaultStep.thenSelector = 'button.close, button.accept';
    }
    if (type === 'if_text_contains') {
      defaultStep.text = 'Error';
      defaultStep.selector = 'body';
      defaultStep.thenAction = 'click';
      defaultStep.thenSelector = 'button.retry';
    }
    if (type === 'loop_elements') {
      defaultStep.selector = '.product-card, .search-result';
      defaultStep.maxIterations = 5;
      defaultStep.loopAction = 'extract';
    }

    setSteps((prev) => [...prev, defaultStep]);
  };

  const handleUpdateStep = (index: number, updates: Partial<AutomationStep>) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    setSteps((prev) => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  const handleOpenExportPlaywright = async () => {
    let script = await chromeApi.automation.exportPlaywright({
      name: flowName,
      steps,
    });
    if (!script) {
      script = generateLocalPlaywrightScript(flowName, steps);
    }
    setPlaywrightScript(script);
    setIsExportModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full gap-2.5 text-xs select-none relative">
      <TabBindingBar />

      {/* Top View Switcher */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 pb-1.5">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-900 p-0.5 rounded-lg border border-gray-200 dark:border-neutral-800 text-[11px]">
          <button
            onClick={() => setPanelTab('builder')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
              panelTab === 'builder'
                ? 'bg-white dark:bg-neutral-800 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200'
            }`}
          >
            <VscPlay size={12} />
            <span>Macro Flow Builder</span>
          </button>
          <button
            onClick={() => setPanelTab('scheduler')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
              panelTab === 'scheduler'
                ? 'bg-white dark:bg-neutral-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200'
            }`}
          >
            <VscWatch size={12} />
            <span>Cron & Scheduler</span>
          </button>
        </div>
      </div>

      {panelTab === 'scheduler' ? (
        <SchedulerView flows={flows} />
      ) : (
        <>
          {/* Recording & Execution Banner */}
          <div className="p-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-md flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="Macro Flow Name"
                className="flex-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded px-2 py-1 text-gray-800 dark:text-neutral-100 font-semibold text-xs outline-none focus:border-sky-500"
              />

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isRecording ? (
                  <button
                    onClick={handleStopRecording}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-medium text-xs transition-colors shadow-xs animate-pulse"
                  >
                    <VscDebugStop size={13} />
                    <span>Stop Recording</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartRecording}
                    disabled={!boundTabId || isRunning}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-700 dark:text-rose-400 font-medium text-xs transition-colors disabled:opacity-40"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Record Macro</span>
                  </button>
                )}

                <button
                  onClick={handleRunFlow}
                  disabled={!boundTabId || isRunning || isRecording || steps.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium text-xs transition-colors shadow-xs"
                >
                  {isRunning ? <VscLoading size={13} className="animate-spin" /> : <VscPlay size={13} />}
                  <span>Run Flow</span>
                </button>

                <button
                  onClick={handleRunHeadless}
                  disabled={isRunning || isRecording || steps.length === 0}
                  title="Run Flow Headlessly in background hidden window"
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-600/15 hover:bg-teal-600/25 border border-teal-500/40 text-teal-700 dark:text-teal-400 font-medium text-xs transition-colors disabled:opacity-40"
                >
                  <VscGlobe size={12} />
                  <span>Headless</span>
                </button>

                <button
                  onClick={() => {
                    handleSaveFlow();
                    setPanelTab('scheduler');
                  }}
                  title="Save & Schedule this flow"
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-700 dark:text-purple-400 font-medium text-xs transition-colors"
                >
                  <VscWatch size={12} />
                  <span>Schedule</span>
                </button>

                <button
                  onClick={handleOpenExportPlaywright}
                  disabled={steps.length === 0}
                  title="Export flow to Playwright test script"
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 transition-colors border border-gray-300 dark:border-neutral-700 font-medium text-xs disabled:opacity-40"
                >
                  <VscCode size={13} />
                  <span>Playwright</span>
                </button>

                <button
                  onClick={handleSaveFlow}
                  title="Save flow to library"
                  className="p-1.5 rounded bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 transition-colors border border-gray-300 dark:border-neutral-700"
                >
                  {isSaved ? <VscCheck size={13} className="text-emerald-500" /> : <VscSave size={13} />}
                </button>
              </div>
            </div>

            {/* Live Status Bar */}
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-neutral-400 pt-0.5">
              <span className="truncate flex-1">
                Status: <strong className="text-sky-600 dark:text-sky-400 font-medium">{statusMessage}</strong>
              </span>
              {progress && isRunning && (
                <span className="font-mono text-[10px] text-sky-500 font-bold ml-2">
                  [{progress.stepIndex + 1}/{progress.totalSteps}]
                </span>
              )}
            </div>
          </div>

          {/* Step Builder Toolbar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                Action Steps ({steps.length})
              </span>

              <div className="flex items-center gap-1 flex-wrap justify-end">
                {(['click', 'type', 'wait', 'scroll', 'screenshot', 'extract'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleAddStep(st)}
                    className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-300 text-[10px] font-medium uppercase transition-colors border border-gray-200 dark:border-neutral-700"
                  >
                    + {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10.5px]">
              <span className="text-gray-400 dark:text-neutral-500 font-medium text-[10px] uppercase">Control Flow:</span>
              <button
                onClick={() => handleAddStep('if_element_exists')}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300/60 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 font-medium text-[10px] transition-colors"
              >
                <VscGitBranch size={11} />
                <span>+ If Element</span>
              </button>
              <button
                onClick={() => handleAddStep('if_text_contains')}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300/60 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 font-medium text-[10px] transition-colors"
              >
                <VscGitBranch size={11} />
                <span>+ If Text</span>
              </button>
              <button
                onClick={() => handleAddStep('loop_elements')}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-300/60 dark:border-purple-700/60 text-purple-700 dark:text-purple-300 font-medium text-[10px] transition-colors"
              >
                <VscSync size={11} />
                <span>+ Loop Items</span>
              </button>
            </div>
          </div>

          {/* Step List Viewport */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5">
            {steps.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-neutral-500 text-xs">
                No steps in this flow. Click "Record Macro" or add actions above.
              </div>
            ) : (
              steps.map((step, idx) => (
                <StepEditor
                  key={idx}
                  step={step}
                  index={idx}
                  totalSteps={steps.length}
                  isCurrent={Boolean(progress && isRunning && progress.stepIndex === idx)}
                  onUpdate={(updates) => handleUpdateStep(idx, updates)}
                  onRemove={() => handleRemoveStep(idx)}
                  onMoveUp={() => handleMoveStep(idx, 'up')}
                  onMoveDown={() => handleMoveStep(idx, 'down')}
                />
              ))
            )}
          </div>

          {/* Saved Flows Library Drawer */}
          {flows.length > 0 && (
            <div className="border-t border-gray-200 dark:border-neutral-800 pt-2 flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <VscFolderOpened size={12} />
                <span>Saved Flows ({flows.length})</span>
              </span>

              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {flows.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => handleLoadFlow(f)}
                    className={`group flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-colors border text-[11px] ${
                      activeFlowId === f.id
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300 font-medium'
                        : 'bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span className="truncate max-w-[120px]">{f.name}</span>
                    <span className="text-[9.5px] font-mono text-gray-400 dark:text-neutral-500">
                      ({(f.steps || []).length})
                    </span>
                    <button
                      onClick={(e) => f.id && handleDeleteFlow(f.id, e)}
                      title="Delete flow"
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-500 ml-1"
                    >
                      <VscTrash size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Playwright Script Export Modal */}
      <PlaywrightExportModal
        isOpen={isExportModalOpen}
        script={playwrightScript}
        flowName={flowName}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};
