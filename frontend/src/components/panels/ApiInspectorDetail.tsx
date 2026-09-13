import React, { useState } from 'react';
import { VscClose, VscCopy, VscPlay, VscCheck, VscServerProcess } from 'react-icons/vsc';

interface RequestItem {
  id: string;
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  headers?: string;
  responseHeaders?: string;
  post_data?: string;
  body?: string;
  duration?: number;
}

export const ApiInspectorDetail: React.FC<{
  req: RequestItem;
  onClose: () => void;
  onCreateMock?: (req: RequestItem) => void;
}> = ({ req, onClose, onCreateMock }) => {
  const [tab, setTab] = useState<'headers' | 'payload' | 'response' | 'code'>('headers');
  const [codeLang, setCodeLang] = useState<'curl' | 'fetch' | 'python'>('curl');
  const [replayStatus, setReplayStatus] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  let reqHeaders: Record<string, string> = {};
  let resHeaders: Record<string, string> = {};
  try { reqHeaders = JSON.parse(req.headers || '{}'); } catch { }
  try { resHeaders = JSON.parse(req.responseHeaders || '{}'); } catch { }

  const generateCurl = () => {
    let curl = `curl -X ${req.method} "${req.url}"`;
    for (const [k, v] of Object.entries(reqHeaders)) {
      if (k.toLowerCase() !== 'host' && k.toLowerCase() !== 'content-length') {
        curl += ` \\\n  -H "${k}: ${v}"`;
      }
    }
    if (req.post_data) {
      curl += ` \\\n  --data-raw '${req.post_data.replace(/'/g, "'\\''")}'`;
    }
    return curl;
  };

  const generateFetch = () => {
    const opts: any = {
      method: req.method,
      headers: reqHeaders,
    };
    if (req.post_data && req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        opts.body = JSON.parse(req.post_data);
      } catch {
        opts.body = req.post_data;
      }
    }
    return `fetch("${req.url}", ${JSON.stringify(opts, null, 2)});`;
  };

  const generatePython = () => {
    let py = `import requests\n\nurl = "${req.url}"\nheaders = ${JSON.stringify(reqHeaders, null, 4)}\n`;
    if (req.post_data) {
      try {
        const jsonBody = JSON.parse(req.post_data);
        py += `json_data = ${JSON.stringify(jsonBody, null, 4)}\n\n`;
        py += `response = requests.${req.method.toLowerCase()}(url, headers=headers, json=json_data)\n`;
      } catch {
        py += `data = ${JSON.stringify(req.post_data)}\n\n`;
        py += `response = requests.${req.method.toLowerCase()}(url, headers=headers, data=data)\n`;
      }
    } else {
      py += `\nresponse = requests.${req.method.toLowerCase()}(url, headers=headers)\n`;
    }
    py += `print(response.status_code, response.text)\n`;
    return py;
  };

  const getActiveCode = () => {
    if (codeLang === 'curl') return generateCurl();
    if (codeLang === 'fetch') return generateFetch();
    return generatePython();
  };

  const handleReplay = async () => {
    setReplayStatus('Replaying request...');
    if (!window.chrome?.interceptor?.replay) return;
    try {
      const res = await window.chrome.interceptor.replay(req.id);
      if (res.error) {
        setReplayStatus(`Error: ${res.error}`);
      } else {
        setReplayStatus(`Success: ${res.status} ${res.statusText || 'OK'} (${res.durationMs}ms)`);
      }
    } catch (err: any) {
      setReplayStatus(`Failed: ${err.message}`);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-md p-3 gap-2.5 text-xs overflow-hidden select-none">
      {/* Detail Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-2 truncate">
          <span className="font-bold text-sky-600 dark:text-sky-400 font-mono text-[11px] uppercase">
            {req.method}
          </span>
          <span className="text-gray-700 dark:text-neutral-300 truncate max-w-[240px] text-[11px] font-mono">
            {req.url}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onCreateMock && (
            <button
              onClick={() => onCreateMock(req)}
              title="Create a Mock Rule matching this request"
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-colors"
            >
              <VscServerProcess size={12} />
              <span>Mock Rule</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <VscClose size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-neutral-800 text-[11px]">
        {(['headers', 'payload', 'response', 'code'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-2.5 py-1 capitalize font-medium transition-colors border-b-2 ${tab === t
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
              }`}
          >
            {t === 'code' ? 'Code & Replay' : t}
          </button>
        ))}
      </div>

      {/* Body Viewport */}
      <div className="flex-1 overflow-y-auto pr-1 select-text font-mono text-[11px]">
        {tab === 'headers' && (
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-gray-400 dark:text-neutral-500 font-sans uppercase font-bold text-[10px]">
                General Information
              </span>
              <div className="text-gray-800 dark:text-neutral-200 mt-1">
                <strong>Status:</strong>{' '}
                <span className={req.status && req.status >= 400 ? 'text-red-500' : 'text-emerald-500'}>
                  {req.status || 'Pending'} {req.statusText || ''}
                </span>{' '}
                {req.duration ? `(${req.duration}ms)` : ''}
              </div>
            </div>

            <div>
              <span className="text-gray-400 dark:text-neutral-500 font-sans uppercase font-bold text-[10px]">
                Request Headers
              </span>
              <div className="flex flex-col gap-0.5 mt-1 bg-gray-50 dark:bg-neutral-900/60 p-2 rounded border border-gray-200 dark:border-neutral-800/80">
                {Object.keys(reqHeaders).length === 0 ? (
                  <span className="text-gray-400 dark:text-neutral-500 italic">No headers captured</span>
                ) : (
                  Object.entries(reqHeaders).map(([k, v]) => (
                    <div key={k} className="text-gray-600 dark:text-neutral-400">
                      <strong className="text-gray-800 dark:text-neutral-200">{k}:</strong> {String(v)}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <span className="text-gray-400 dark:text-neutral-500 font-sans uppercase font-bold text-[10px]">
                Response Headers
              </span>
              <div className="flex flex-col gap-0.5 mt-1 bg-gray-50 dark:bg-neutral-900/60 p-2 rounded border border-gray-200 dark:border-neutral-800/80">
                {Object.keys(resHeaders).length === 0 ? (
                  <span className="text-gray-400 dark:text-neutral-500 italic">No headers captured</span>
                ) : (
                  Object.entries(resHeaders).map(([k, v]) => (
                    <div key={k} className="text-gray-600 dark:text-neutral-400">
                      <strong className="text-gray-800 dark:text-neutral-200">{k}:</strong> {String(v)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'payload' && (
          <div className="flex flex-col gap-2 h-full">
            <button
              onClick={() => copyText(req.post_data || '')}
              className="self-end flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
              {isCopied ? <VscCheck size={11} className="text-emerald-500" /> : <VscCopy size={11} />}
              <span>Copy</span>
            </button>
            <pre className="flex-1 bg-gray-50 dark:bg-neutral-900/80 p-2.5 rounded text-[10.5px] text-gray-800 dark:text-neutral-200 overflow-auto whitespace-pre-wrap border border-gray-200 dark:border-neutral-800">
              {req.post_data || 'No payload data for this request.'}
            </pre>
          </div>
        )}

        {tab === 'response' && (
          <div className="flex flex-col gap-2 h-full">
            <button
              onClick={() => copyText(req.body || '')}
              className="self-end flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
              {isCopied ? <VscCheck size={11} className="text-emerald-500" /> : <VscCopy size={11} />}
              <span>Copy</span>
            </button>
            <pre className="flex-1 bg-gray-50 dark:bg-neutral-900/80 p-2.5 rounded text-[10.5px] text-gray-800 dark:text-neutral-200 overflow-auto whitespace-pre-wrap border border-gray-200 dark:border-neutral-800">
              {req.body || 'No response body recorded.'}
            </pre>
          </div>
        )}

        {tab === 'code' && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              {/* Language Pills */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-900 p-0.5 rounded border border-gray-200 dark:border-neutral-800">
                {(['curl', 'fetch', 'python'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLang(lang)}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-medium uppercase transition-colors ${codeLang === lang
                        ? 'bg-white dark:bg-neutral-800 text-sky-600 dark:text-sky-400 shadow-xs'
                        : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200'
                      }`}
                  >
                    {lang === 'python' ? 'Python' : lang === 'fetch' ? 'Fetch JS' : 'cURL'}
                  </button>
                ))}
              </div>

              {/* Copy & Replay Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => copyText(getActiveCode())}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 text-[11px] font-medium transition-colors border border-gray-200 dark:border-neutral-700"
                >
                  {isCopied ? <VscCheck size={12} className="text-emerald-500" /> : <VscCopy size={12} />}
                  <span>Copy</span>
                </button>
                <button
                  onClick={handleReplay}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-medium transition-colors shadow-xs"
                >
                  <VscPlay size={12} />
                  <span>Replay</span>
                </button>
              </div>
            </div>

            {replayStatus && (
              <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/20 text-[11px] text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 font-sans">
                {replayStatus}
              </div>
            )}

            <pre className="bg-gray-50 dark:bg-neutral-900/90 p-2.5 rounded font-mono text-[10.5px] text-gray-800 dark:text-neutral-200 overflow-x-auto whitespace-pre-wrap border border-gray-200 dark:border-neutral-800">
              {getActiveCode()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
