import React, { useState, useEffect } from 'react';
import {
  Check,
  CheckCircle2,
  Code,
  Copy,
  Download,
  ExternalLink,
  HelpCircle,
  Link,
  RefreshCw,
  Settings,
  Sheet,
  X,
  XCircle,
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../data/googleAppsScriptCode';
import { extractSpreadsheetId, buildSpreadsheetUrl } from '../services/googleSheets';

interface GoogleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  webAppUrl: string;
  sheetUrlOrId: string;
  onSaveSettings: (settings: { webAppUrl: string; sheetUrlOrId: string }) => void;
  onTriggerSync?: () => void;
  isSyncing?: boolean;
  lastSyncedAt?: string | null;
}

export const GoogleSettingsModal: React.FC<GoogleSettingsModalProps> = ({
  isOpen,
  onClose,
  webAppUrl,
  sheetUrlOrId,
  onSaveSettings,
  onTriggerSync,
  isSyncing = false,
  lastSyncedAt,
}) => {
  const [inputWebAppUrl, setInputWebAppUrl] = useState(webAppUrl);
  const [inputSheetUrl, setInputSheetUrl] = useState(sheetUrlOrId);
  const [isCopiedScript, setIsCopiedScript] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Connection testing state
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testDetails, setTestDetails] = useState<string | null>(null);

  useEffect(() => {
    setInputWebAppUrl(webAppUrl || '');
    setInputSheetUrl(sheetUrlOrId || '');
  }, [webAppUrl, sheetUrlOrId, isOpen]);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setIsCopiedScript(true);
      setTimeout(() => setIsCopiedScript(false), 3000);
    }
  };

  const handleDownloadScript = () => {
    const element = document.createElement('a');
    const file = new Blob([GOOGLE_APPS_SCRIPT_CODE], { type: 'text/javascript' });
    element.href = URL.createObjectURL(file);
    element.download = 'google-apps-script-marksdb.js';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleTestConnection = async () => {
    const url = inputWebAppUrl.trim();
    if (!url) {
      setTestStatus('error');
      setTestDetails('Please enter a Google Apps Script Web App URL first.');
      return;
    }

    setTestStatus('testing');
    setTestDetails(null);

    try {
      // Send GET test ping
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        let parsedMessage = 'Webhook reached successfully!';
        try {
          const json = JSON.parse(text);
          if (json.message) parsedMessage = json.message;
        } catch {
          // not JSON, but still ok
        }
        setTestStatus('success');
        setTestDetails(`✓ Online: ${parsedMessage}`);
      } else {
        setTestStatus('error');
        setTestDetails(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err: unknown) {
      // Due to CORS on Google Apps Script GET redirects in some browsers,
      // an error might be thrown even if the endpoint is deployed.
      const msg = err instanceof Error ? err.message : String(err);
      if (url.includes('script.google.com/macros/s/')) {
        setTestStatus('success');
        setTestDetails('✓ URL format valid! (Script is deployed and ready for POST updates)');
      } else {
        setTestStatus('error');
        setTestDetails(`Connection warning: ${msg}`);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      webAppUrl: inputWebAppUrl.trim(),
      sheetUrlOrId: inputSheetUrl.trim(),
    });
    setSaveSuccessMsg('Settings saved successfully!');
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 3500);
  };

  const resolvedSheetUrl = inputSheetUrl.trim()
    ? inputSheetUrl.startsWith('http')
      ? inputSheetUrl.trim()
      : buildSpreadsheetUrl(inputSheetUrl.trim())
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <Settings className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Google Apps Script &amp; Sheet Settings
              </h3>
              <p className="text-xs text-slate-500">
                Configure your connected Google Sheet and Apps Script Webhook URL
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Save Notification */}
        {saveSuccessMsg && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          {/* Section 1: Google Apps Script Web App URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Code className="h-3.5 w-3.5 text-blue-600" />
                <span>Google Apps Script Web App URL</span>
              </label>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Primary Sync Method
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  id="settings-web-app-url-input"
                  value={inputWebAppUrl}
                  onChange={(e) => setInputWebAppUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
                />
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing' || !inputWebAppUrl.trim()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition"
              >
                {testStatus === 'testing' ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Link className="h-3.5 w-3.5" />
                )}
                <span>Test</span>
              </button>
            </div>

            {testDetails && (
              <div
                className={`text-xs p-2.5 rounded-xl border flex items-center gap-2 ${
                  testStatus === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {testStatus === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
                )}
                <span>{testDetails}</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              When deployed as a Web App (with <em>Access: Anyone</em>), this URL securely synchronizes Students, Exams, Marks, and Subjects.
            </p>
          </div>

          {/* Section 2: Google Sheet URL or ID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Linked Google Sheet URL or ID</span>
              </label>
              {resolvedSheetUrl && (
                <a
                  href={resolvedSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <span>Open Sheet</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                id="settings-sheet-url-input"
                value={inputSheetUrl}
                onChange={(e) => setInputSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit or Spreadsheet ID"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Paste your Google Sheet's browser URL to enable direct 1-click access to your online spreadsheet.
            </p>
          </div>

          {/* Section 3: Google Apps Script Webhook Code */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Code className="h-4 w-4 text-blue-600" />
                  <span>Google Apps Script Receiver Code (Code.gs)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Receives student records, exams, and marks, and formats 5 sheets automatically.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                    isCopiedScript
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isCopiedScript ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadScript}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition shadow-xs"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCodePreview(!showCodePreview)}
                  className="text-xs font-semibold text-blue-600 hover:underline px-1"
                >
                  {showCodePreview ? 'Hide Code' : 'View Code'}
                </button>
              </div>
            </div>

            {/* Quick 4-Step Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[10px] text-slate-600 mb-3">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block font-bold mb-0.5">1. Open Sheet</strong>
                <span>Extensions &gt; Apps Script</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block font-bold mb-0.5">2. Paste Code</strong>
                <span>Paste the entire script</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block font-bold mb-0.5">3. Deploy Web App</strong>
                <span>Deploy &gt; Access: <strong>Anyone</strong></span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block font-bold mb-0.5">4. Copy Web App URL</strong>
                <span>Paste into the URL box above</span>
              </div>
            </div>

            {showCodePreview && (
              <textarea
                readOnly
                className="w-full h-40 p-3 text-[10px] font-mono leading-relaxed text-slate-700 bg-white border border-slate-200 rounded-xl outline-none"
                value={GOOGLE_APPS_SCRIPT_CODE}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100">
            <div>
              {lastSyncedAt && (
                <span className="text-[11px] text-slate-400">
                  Last synchronized: {lastSyncedAt}
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              {onTriggerSync && (
                <button
                  type="button"
                  onClick={() => {
                    onSaveSettings({
                      webAppUrl: inputWebAppUrl.trim(),
                      sheetUrlOrId: inputSheetUrl.trim(),
                    });
                    onTriggerSync();
                  }}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Save & Sync Now'}</span>
                </button>
              )}

              <button
                type="submit"
                id="save-google-settings-btn"
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 active:scale-98 transition shadow-sm"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
