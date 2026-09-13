import React, { useState, useEffect } from 'react';
import { VscEdit, VscTrash, VscClose, VscCheck } from 'react-icons/vsc';
import type { MockRule } from './interceptorTypes';

interface MockRulesViewProps {
  mockRules: MockRule[];
  isCreatingRule: boolean;
  editingRule: MockRule | null;
  onCloseForm: () => void;
  onSaveRule: (ruleData: {
    id?: string;
    name: string;
    url_pattern: string;
    method: string;
    action: 'mock_response' | 'modify_headers' | 'block';
    response_status?: number;
    response_headers?: string;
    response_body?: string;
    enabled: number | boolean;
  }) => Promise<void>;
  onEditRule: (rule: MockRule) => void;
  onToggleRule: (rule: MockRule) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
}

export const MockRulesView: React.FC<MockRulesViewProps> = ({
  mockRules,
  isCreatingRule,
  editingRule,
  onCloseForm,
  onSaveRule,
  onEditRule,
  onToggleRule,
  onDeleteRule,
}) => {
  const [ruleName, setRuleName] = useState('Custom Mock');
  const [rulePattern, setRulePattern] = useState('*/api/*');
  const [ruleMethod, setRuleMethod] = useState('*');
  const [ruleAction, setRuleAction] = useState<'mock_response' | 'modify_headers' | 'block'>('mock_response');
  const [ruleStatus, setRuleStatus] = useState<number>(200);
  const [ruleHeaders, setRuleHeaders] = useState('{"content-type":"application/json"}');
  const [ruleBody, setRuleBody] = useState('{\n  "mocked": true,\n  "status": "success"\n}');

  useEffect(() => {
    if (editingRule) {
      setRuleName(editingRule.name);
      setRulePattern(editingRule.url_pattern);
      setRuleMethod(editingRule.method || '*');
      setRuleAction(editingRule.action || 'mock_response');
      setRuleStatus(editingRule.response_status || 200);
      setRuleHeaders(editingRule.response_headers || '{"content-type":"application/json"}');
      setRuleBody(editingRule.response_body || '{}');
    } else {
      setRuleName('Custom Mock');
      setRulePattern('*/api/*');
      setRuleMethod('*');
      setRuleAction('mock_response');
      setRuleStatus(200);
      setRuleHeaders('{"content-type":"application/json"}');
      setRuleBody('{\n  "mocked": true,\n  "status": "success"\n}');
    }
  }, [editingRule, isCreatingRule]);

  const handleSubmit = async () => {
    if (!ruleName.trim() || !rulePattern.trim()) return;
    await onSaveRule({
      id: editingRule?.id,
      name: ruleName.trim(),
      url_pattern: rulePattern.trim(),
      method: ruleMethod,
      action: ruleAction,
      response_status: ruleStatus,
      response_headers: ruleHeaders,
      response_body: ruleBody,
      enabled: editingRule ? editingRule.enabled : 1,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-3">
      {/* Rule Editor (if open) */}
      {isCreatingRule && (
        <div className="p-3 bg-gray-50 dark:bg-neutral-900/80 border border-emerald-500/30 rounded-lg flex flex-col gap-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-neutral-800">
            <span className="font-semibold text-[11px] text-gray-700 dark:text-neutral-200">
              {editingRule ? 'Edit Mock Rule' : 'Create New Mock Rule'}
            </span>
            <button
              onClick={onCloseForm}
              className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <VscClose size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 dark:text-neutral-400 font-medium">Rule Name</label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g. Mock Users List"
                className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded text-xs text-gray-800 dark:text-neutral-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-neutral-400 font-medium">HTTP Method</label>
              <select
                value={ruleMethod}
                onChange={(e) => setRuleMethod(e.target.value)}
                className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded text-xs text-gray-800 dark:text-neutral-200 font-mono"
              >
                <option value="*">* (All Methods)</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 dark:text-neutral-400 font-medium">
              URL Pattern (Wildcard * or Regex /.../)
            </label>
            <input
              type="text"
              value={rulePattern}
              onChange={(e) => setRulePattern(e.target.value)}
              placeholder="e.g. */api/v1/users* or https://example.com/api/*"
              className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded text-xs text-gray-800 dark:text-neutral-200 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 dark:text-neutral-400 font-medium">Action</label>
              <select
                value={ruleAction}
                onChange={(e) => setRuleAction(e.target.value as any)}
                className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded text-xs text-gray-800 dark:text-neutral-200"
              >
                <option value="mock_response">Mock Response (Return Custom Body)</option>
                <option value="block">Block Request (Simulate Network Error)</option>
                <option value="modify_headers">Modify Headers</option>
              </select>
            </div>
            {ruleAction === 'mock_response' && (
              <div>
                <label className="text-[10px] text-gray-500 dark:text-neutral-400 font-medium">Status Code</label>
                <input
                  type="number"
                  value={ruleStatus}
                  onChange={(e) => setRuleStatus(Number(e.target.value))}
                  className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded text-xs text-gray-800 dark:text-neutral-200 font-mono"
                />
              </div>
            )}
          </div>

          {ruleAction === 'mock_response' && (
            <div>
              <label className="text-[10px] text-gray-500 dark:text-neutral-400 font-medium">
                Mock Response Body (JSON or Text)
              </label>
              <textarea
                rows={4}
                value={ruleBody}
                onChange={(e) => setRuleBody(e.target.value)}
                className="w-full mt-0.5 p-2 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded text-xs font-mono text-gray-800 dark:text-neutral-200 resize-none outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onCloseForm}
              className="px-3 py-1 rounded bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 text-xs hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
            >
              <VscCheck size={12} />
              <span>Save Rule</span>
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="flex flex-col divide-y divide-gray-200 dark:divide-neutral-800/80 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-md">
        {mockRules.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-neutral-500 text-xs">
            No active mock rules. Click "+ New Mock Rule" to intercept or mock network calls.
          </div>
        ) : (
          mockRules.map((rule) => {
            const isEnabled = Boolean(rule.enabled);
            return (
              <div
                key={rule.id}
                className="p-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-neutral-900/60 transition-colors gap-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => onToggleRule(rule)}
                    title={isEnabled ? 'Rule is Active' : 'Rule is Disabled'}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-800 dark:text-neutral-200 text-[11px]">
                        {rule.name}
                      </span>
                      <span className="font-mono text-[9.5px] px-1 py-0.2 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 rounded">
                        {rule.method}
                      </span>
                    </div>
                    <span className="font-mono text-[10.5px] text-gray-500 dark:text-neutral-400 truncate max-w-[280px]">
                      {rule.url_pattern}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      rule.action === 'mock_response'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                        : rule.action === 'block'
                        ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400'
                        : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {rule.action === 'mock_response'
                      ? `MOCK ${rule.response_status || 200}`
                      : rule.action === 'block'
                      ? 'BLOCKED'
                      : 'MODIFY'}
                  </span>

                  <button
                    onClick={() => onEditRule(rule)}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    title="Edit Rule"
                  >
                    <VscEdit size={13} />
                  </button>

                  <button
                    onClick={() => rule.id && onDeleteRule(rule.id)}
                    className="p-1 rounded text-gray-400 hover:text-rose-600 dark:hover:text-rose-400"
                    title="Delete Rule"
                  >
                    <VscTrash size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
