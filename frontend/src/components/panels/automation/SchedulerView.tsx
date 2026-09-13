import React, { useState, useEffect } from 'react';
import {
  VscPlay,
  VscAdd,
  VscTrash,
  VscEdit,
  VscRefresh,
  VscHistory,
  VscBell,
  VscRadioTower,
  VscCheck,
  VscClose,
  VscLoading,
  VscWatch,
  VscCalendar,
  VscGlobe,
  VscLink,
} from 'react-icons/vsc';

export interface ScheduledTask {
  id: string;
  name: string;
  flow_id: string;
  schedule_type: 'interval' | 'cron';
  schedule_value: string;
  target_url?: string;
  webhook_url?: string;
  notify_on_complete: boolean;
  notify_on_error: boolean;
  enabled: boolean;
  last_run?: string;
  last_status?: string;
  last_result?: string;
  created_at?: string;
}

export interface TaskRunLog {
  id: string;
  task_id: string;
  flow_id?: string;
  status: 'success' | 'failed';
  duration_ms: number;
  completed_steps: number;
  total_steps: number;
  error?: string;
  webhook_status?: string;
  created_at: string;
}

interface SchedulerViewProps {
  flows: any[];
}

export const SchedulerView: React.FC<SchedulerViewProps> = ({ flows }) => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'paused'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formFlowId, setFormFlowId] = useState('');
  const [formScheduleType, setFormScheduleType] = useState<'interval' | 'cron'>('interval');
  const [formScheduleValue, setFormScheduleValue] = useState('15m');
  const [formTargetUrl, setFormTargetUrl] = useState('');
  const [formWebhookUrl, setFormWebhookUrl] = useState('');
  const [formNotifyComplete, setFormNotifyComplete] = useState(true);
  const [formNotifyError, setFormNotifyError] = useState(true);
  const [formEnabled, setFormEnabled] = useState(true);

  // Webhook Test State
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<string | null>(null);

  // Logs Modal State
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [selectedTaskForLogs, setSelectedTaskForLogs] = useState<ScheduledTask | null>(null);
  const [taskLogs, setTaskLogs] = useState<TaskRunLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchTasks = async () => {
    if (!window.chrome?.automation?.getTasks) return;
    setLoading(true);
    try {
      const list = await window.chrome.automation.getTasks();
      setTasks(list || []);
    } catch (err) {
      console.error('Failed to fetch scheduled tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    if (window.chrome?.automation?.onTaskUpdated) {
      const unsub = window.chrome.automation.onTaskUpdated(() => {
        fetchTasks();
      });
      return unsub;
    }
  }, []);

  const openCreateModal = () => {
    setEditingTask(null);
    setFormName('Hourly Price Monitor');
    setFormFlowId(flows[0]?.id || '');
    setFormScheduleType('interval');
    setFormScheduleValue('15m');
    setFormTargetUrl('');
    setFormWebhookUrl('');
    setFormNotifyComplete(true);
    setFormNotifyError(true);
    setFormEnabled(true);
    setWebhookTestResult(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: ScheduledTask) => {
    setEditingTask(task);
    setFormName(task.name);
    setFormFlowId(task.flow_id);
    setFormScheduleType(task.schedule_type);
    setFormScheduleValue(task.schedule_value);
    setFormTargetUrl(task.target_url || '');
    setFormWebhookUrl(task.webhook_url || '');
    setFormNotifyComplete(task.notify_on_complete);
    setFormNotifyError(task.notify_on_error);
    setFormEnabled(task.enabled);
    setWebhookTestResult(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.chrome?.automation?.saveTask) return;
    if (!formName.trim()) {
      alert('Task name is required');
      return;
    }
    if (!formFlowId) {
      alert('Please select an automation flow to execute');
      return;
    }

    try {
      await window.chrome.automation.saveTask({
        id: editingTask?.id,
        name: formName.trim(),
        flow_id: formFlowId,
        schedule_type: formScheduleType,
        schedule_value: formScheduleValue.trim() || '15m',
        target_url: formTargetUrl.trim(),
        webhook_url: formWebhookUrl.trim(),
        notify_on_complete: formNotifyComplete,
        notify_on_error: formNotifyError,
        enabled: formEnabled,
      });
      setIsModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete scheduled task "${name}"?`)) return;
    if (!window.chrome?.automation?.deleteTask) return;
    try {
      await window.chrome.automation.deleteTask(id);
      fetchTasks();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleToggle = async (task: ScheduledTask) => {
    if (!window.chrome?.automation?.saveTask) return;
    try {
      await window.chrome.automation.saveTask({
        ...task,
        enabled: !task.enabled,
      });
      fetchTasks();
    } catch (err: any) {
      alert('Toggle failed: ' + err.message);
    }
  };

  const handleRunNow = async (task: ScheduledTask) => {
    if (!window.chrome?.automation?.runTaskNow) return;
    setRunningTaskId(task.id);
    try {
      const res = await window.chrome.automation.runTaskNow(task.id);
      if (res?.success) {
        alert(`Task "${task.name}" completed headlessly!\n${res.completedSteps}/${res.totalSteps} steps in ${res.durationMs}ms`);
      } else {
        alert(`Task "${task.name}" failed: ${res?.error || 'Unknown error'}`);
      }
      fetchTasks();
    } catch (err: any) {
      alert('Run error: ' + err.message);
    } finally {
      setRunningTaskId(null);
    }
  };

  const handleTestWebhook = async () => {
    if (!formWebhookUrl.trim() || !window.chrome?.automation?.testWebhook) return;
    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await window.chrome.automation.testWebhook(formWebhookUrl.trim());
      if (res.success) {
        setWebhookTestResult(`Success! Endpoint responded with HTTP ${res.status}`);
      } else {
        setWebhookTestResult(`Failed: ${res.error || 'Connection refused'}`);
      }
    } catch (err: any) {
      setWebhookTestResult(`Failed: ${err.message}`);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleOpenLogs = async (task: ScheduledTask) => {
    setSelectedTaskForLogs(task);
    setIsLogsModalOpen(true);
    if (!window.chrome?.automation?.getTaskLogs) return;
    setLogsLoading(true);
    try {
      const logs = await window.chrome.automation.getTaskLogs(task.id, 50);
      setTaskLogs(logs || []);
    } catch (err) {
      console.error('Failed to get logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'active') return t.enabled;
    if (activeTab === 'paused') return !t.enabled;
    return true;
  });

  return (
    <div className="flex flex-col h-full gap-2 text-xs">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg">
        <div className="flex items-center gap-1 bg-gray-200/70 dark:bg-neutral-800 p-0.5 rounded-md">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${activeTab === 'all'
                ? 'bg-white dark:bg-neutral-700 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900'
              }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${activeTab === 'active'
                ? 'bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900'
              }`}
          >
            Active ({tasks.filter((t) => t.enabled).length})
          </button>
          <button
            onClick={() => setActiveTab('paused')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${activeTab === 'paused'
                ? 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 shadow-xs'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900'
              }`}
          >
            Paused ({tasks.filter((t) => !t.enabled).length})
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={fetchTasks}
            disabled={loading}
            title="Refresh Task Roster"
            className="p-1.5 rounded text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
          >
            <VscRefresh size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-medium transition-colors shadow-xs"
          >
            <VscAdd size={12} />
            <span>Schedule Flow</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-gray-200 dark:border-neutral-800 rounded-lg text-gray-400 dark:text-neutral-500 my-auto">
            <VscWatch size={28} className="text-gray-300 dark:text-neutral-600 mb-2" />
            <p className="font-medium text-gray-600 dark:text-neutral-400 text-xs">No scheduled automations found</p>
            <p className="text-[11px] text-gray-400 dark:text-neutral-500 mt-1 max-w-sm">
              Schedule macros to run autonomously in the background at regular intervals or specific times with desktop notifications and webhooks.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-3 flex items-center gap-1 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium transition-colors"
            >
              <VscAdd size={12} />
              <span>Create First Schedule</span>
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const flow = flows.find((f) => f.id === task.flow_id);
            const isRunningThis = runningTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`flex flex-col gap-2 p-3 rounded-lg border transition-all ${task.enabled
                    ? 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 shadow-xs'
                    : 'bg-gray-50/70 dark:bg-neutral-950/60 border-gray-200/60 dark:border-neutral-800/60 opacity-80'
                  }`}
              >
                {/* Row 1: Title, Status Badge, Controls */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-neutral-100 text-xs truncate">
                        {task.name}
                      </span>
                      <span
                        className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-medium ${task.enabled
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-gray-500/10 text-gray-500 dark:text-neutral-400 border border-gray-500/30'
                          }`}
                      >
                        {task.enabled ? 'Active' : 'Paused'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10.5px] text-gray-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1 font-mono text-amber-600 dark:text-amber-400">
                        {task.schedule_type === 'cron' ? <VscCalendar size={11} /> : <VscWatch size={11} />}
                        <span>{task.schedule_type === 'cron' ? `cron: ${task.schedule_value}` : `every ${task.schedule_value}`}</span>
                      </span>
                      <span>•</span>
                      <span className="truncate text-gray-600 dark:text-neutral-300">
                        Flow: {flow ? flow.name : 'Unknown Flow'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRunNow(task)}
                      disabled={isRunningThis}
                      title="Run Headless Now (Background)"
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 text-[10.5px] font-medium transition-colors"
                    >
                      {isRunningThis ? <VscLoading size={11} className="animate-spin" /> : <VscPlay size={11} />}
                      <span>{isRunningThis ? 'Running...' : 'Run Now'}</span>
                    </button>

                    <button
                      onClick={() => handleToggle(task)}
                      title={task.enabled ? 'Pause Task' : 'Activate Task'}
                      className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                    >
                      {task.enabled ? <VscClose size={12} className="text-amber-500" /> : <VscCheck size={12} className="text-emerald-500" />}
                    </button>

                    <button
                      onClick={() => handleOpenLogs(task)}
                      title="View Run History & Logs"
                      className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                    >
                      <VscHistory size={12} />
                    </button>

                    <button
                      onClick={() => openEditModal(task)}
                      title="Edit Schedule & Integrations"
                      className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                    >
                      <VscEdit size={12} />
                    </button>

                    <button
                      onClick={() => handleDelete(task.id, task.name)}
                      title="Delete Task"
                      className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-gray-200 dark:border-neutral-700"
                    >
                      <VscTrash size={12} />
                    </button>
                  </div>
                </div>

                {/* Row 2: Integration Badges & Last Run */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-neutral-800/80 text-[10.5px]">
                  <div className="flex items-center gap-2">
                    {task.target_url && (
                      <span className="flex items-center gap-1 text-gray-500 dark:text-neutral-400 truncate max-w-[180px]" title={task.target_url}>
                        <VscGlobe size={11} className="text-sky-500 flex-shrink-0" />
                        <span className="truncate">{task.target_url.replace(/^https?:\/\//, '')}</span>
                      </span>
                    )}
                    {task.webhook_url && (
                      <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400" title={`Webhook: ${task.webhook_url}`}>
                        <VscRadioTower size={11} />
                        <span>Webhook</span>
                      </span>
                    )}
                    {(task.notify_on_complete || task.notify_on_error) && (
                      <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400" title="Desktop Notifications Enabled">
                        <VscBell size={11} />
                        <span>Alerts</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-neutral-400">
                    <span>Last run:</span>
                    {task.last_run ? (
                      <span
                        className={`font-medium ${task.last_status === 'success'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                          }`}
                        title={task.last_result}
                      >
                        {new Date(task.last_run).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({task.last_status})
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Never</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
              <div className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-neutral-100 text-xs">
                <VscCalendar size={14} className="text-sky-500" />
                <span>{editingTask ? 'Edit Scheduled Automation' : 'Schedule New Automation'}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-800"
              >
                <VscClose size={13} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 flex flex-col gap-3 overflow-y-auto text-xs">
              {/* Task Name */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 dark:text-neutral-300">Task Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Daily Competitor Scraper"
                  className="px-2.5 py-1.5 rounded bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-neutral-100 outline-none focus:border-sky-500"
                  required
                />
              </div>

              {/* Automation Flow Dropdown */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 dark:text-neutral-300">Target Flow</label>
                <select
                  value={formFlowId}
                  onChange={(e) => setFormFlowId(e.target.value)}
                  className="px-2 py-1.5 rounded bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-neutral-100 outline-none focus:border-sky-500"
                  required
                >
                  <option value="" disabled>
                    -- Select Automation Flow --
                  </option>
                  {flows.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.steps?.length || 0} steps)
                    </option>
                  ))}
                </select>
              </div>

              {/* Initial Target URL */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 dark:text-neutral-300">
                  Initial URL <span className="font-normal text-gray-400 text-[10.5px]">(Optional override)</span>
                </label>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800">
                  <VscGlobe size={13} className="text-gray-400" />
                  <input
                    type="url"
                    value={formTargetUrl}
                    onChange={(e) => setFormTargetUrl(e.target.value)}
                    placeholder="https://example.com/products"
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-neutral-100 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Schedule Type & Expression */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800">
                <label className="font-semibold text-gray-700 dark:text-neutral-300">Execution Frequency</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormScheduleType('interval');
                      setFormScheduleValue('15m');
                    }}
                    className={`flex-1 py-1 rounded text-center font-medium transition-colors ${formScheduleType === 'interval'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-gray-200 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300'
                      }`}
                  >
                    Regular Interval
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormScheduleType('cron');
                      setFormScheduleValue('0 9 * * *');
                    }}
                    className={`flex-1 py-1 rounded text-center font-medium transition-colors ${formScheduleType === 'cron'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-gray-200 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300'
                      }`}
                  >
                    Cron Schedule
                  </button>
                </div>

                {formScheduleType === 'interval' ? (
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      {['5m', '15m', '30m', '1h', '6h', '24h'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormScheduleValue(val)}
                          className={`px-2 py-0.5 rounded text-[10.5px] border ${formScheduleValue === val
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                              : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-400'
                            }`}
                        >
                          Every {val}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={formScheduleValue}
                      onChange={(e) => setFormScheduleValue(e.target.value)}
                      placeholder="e.g. 15m, 2h, 1d"
                      className="px-2 py-1 rounded bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 font-mono text-xs mt-1"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 mt-1">
                    <input
                      type="text"
                      value={formScheduleValue}
                      onChange={(e) => setFormScheduleValue(e.target.value)}
                      placeholder="* * * * * (min hour dom mon dow)"
                      className="px-2 py-1 rounded bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 font-mono text-xs"
                    />
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-neutral-500 flex-wrap">
                      <button type="button" onClick={() => setFormScheduleValue('0 9 * * *')} className="hover:text-sky-500 underline">Daily 9am</button>
                      <span>•</span>
                      <button type="button" onClick={() => setFormScheduleValue('0 * * * *')} className="hover:text-sky-500 underline">Hourly</button>
                      <span>•</span>
                      <button type="button" onClick={() => setFormScheduleValue('*/15 * * * *')} className="hover:text-sky-500 underline">Every 15m</button>
                      <span>•</span>
                      <button type="button" onClick={() => setFormScheduleValue('0 8 * * 1-5')} className="hover:text-sky-500 underline">Weekdays 8am</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Webhook Dispatch */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-gray-700 dark:text-neutral-300">Webhook URL</label>
                  {formWebhookUrl.trim() && (
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={isTestingWebhook}
                      className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      {isTestingWebhook ? <VscLoading size={10} className="animate-spin" /> : <VscRadioTower size={10} />}
                      <span>Test Webhook</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800">
                  <VscLink size={13} className="text-gray-400" />
                  <input
                    type="url"
                    value={formWebhookUrl}
                    onChange={(e) => setFormWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/... or https://hooks.slack.com/..."
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-neutral-100 font-mono text-[11px]"
                  />
                </div>
                {webhookTestResult && (
                  <div className={`p-1.5 rounded text-[10.5px] ${webhookTestResult.startsWith('Success') ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'}`}>
                    {webhookTestResult}
                  </div>
                )}
              </div>

              {/* Desktop Notifications & Status */}
              <div className="flex flex-col gap-1.5 pt-1">
                <label className="font-semibold text-gray-700 dark:text-neutral-300">Alerts & Status</label>
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 text-gray-700 dark:text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formNotifyComplete}
                      onChange={(e) => setFormNotifyComplete(e.target.checked)}
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Send Windows desktop notification on job success</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-700 dark:text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formNotifyError}
                      onChange={(e) => setFormNotifyError(e.target.checked)}
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Send Windows desktop notification on job failure / error</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-700 dark:text-neutral-300 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={formEnabled}
                      onChange={(e) => setFormEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">Enable schedule immediately</span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-neutral-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1 rounded bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-xs"
                >
                  {editingTask ? 'Save Changes' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Run Logs Modal */}
      {isLogsModalOpen && selectedTaskForLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
              <div className="flex items-center gap-2">
                <VscHistory size={14} className="text-sky-500" />
                <span className="font-semibold text-gray-900 dark:text-neutral-100 text-xs">
                  Run History: {selectedTaskForLogs.name}
                </span>
              </div>
              <button
                onClick={() => setIsLogsModalOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-800"
              >
                <VscClose size={13} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              {logsLoading ? (
                <div className="flex items-center justify-center p-8 gap-2 text-gray-500 dark:text-neutral-400">
                  <VscLoading size={15} className="animate-spin" />
                  <span>Loading execution history...</span>
                </div>
              ) : taskLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-400 dark:text-neutral-500">
                  No execution logs recorded yet for this task.
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px] font-mono">
                    <thead className="bg-gray-100 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
                      <tr>
                        <th className="px-3 py-1.5 font-semibold text-gray-600 dark:text-neutral-400">Time</th>
                        <th className="px-3 py-1.5 font-semibold text-gray-600 dark:text-neutral-400">Status</th>
                        <th className="px-3 py-1.5 font-semibold text-gray-600 dark:text-neutral-400">Steps</th>
                        <th className="px-3 py-1.5 font-semibold text-gray-600 dark:text-neutral-400">Duration</th>
                        <th className="px-3 py-1.5 font-semibold text-gray-600 dark:text-neutral-400">Webhook</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/80">
                      {taskLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/40">
                          <td className="px-3 py-1.5 text-gray-700 dark:text-neutral-300">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-3 py-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${log.status === 'success'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                }`}
                            >
                              {log.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-gray-600 dark:text-neutral-300">
                            {log.completed_steps}/{log.total_steps}
                          </td>
                          <td className="px-3 py-1.5 text-gray-500 dark:text-neutral-400">
                            {log.duration_ms}ms
                          </td>
                          <td className="px-3 py-1.5 text-purple-600 dark:text-purple-400 truncate max-w-[120px]" title={log.webhook_status || 'N/A'}>
                            {log.webhook_status || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
