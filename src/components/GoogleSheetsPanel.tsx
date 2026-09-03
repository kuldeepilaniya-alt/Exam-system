import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  DownloadCloud,
  ExternalLink,
  FileSpreadsheet,
  Link,
  RefreshCw,
  Sheet,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  Exam,
  GoogleSheetsSyncState,
  MarkRecord,
  Student,
  TeacherUser,
} from '../types';
import {
  buildSpreadsheetUrl,
  createMarksDbSpreadsheet,
  extractSpreadsheetId,
  loadDataFromGoogleSheet,
  syncDataToGoogleSheet,
} from '../services/googleSheets';
import { saveLinkedSheetId } from '../data/mockDatabase';
import { ConfirmationModal } from './ConfirmationModal';

interface GoogleSheetsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  googleSheetsState: GoogleSheetsSyncState;
  onUpdateGoogleSheetsState: (state: Partial<GoogleSheetsSyncState>) => void;
  googleAccessToken: string | null;
  onOpenGoogleAuth: () => void;
  students: Student[];
  exams: Exam[];
  marks: MarkRecord[];
  subjectsMap: { [className: string]: string[] };
  teachers: TeacherUser[];
  onImportData: (data: { students?: Student[]; exams?: Exam[]; marks?: MarkRecord[] }) => void;
}

export const GoogleSheetsPanel: React.FC<GoogleSheetsPanelProps> = ({
  isOpen,
  onClose,
  googleSheetsState,
  onUpdateGoogleSheetsState,
  googleAccessToken,
  onOpenGoogleAuth,
  students,
  exams,
  marks,
  subjectsMap,
  teachers,
  onImportData,
}) => {
  const [customSheetId, setCustomSheetId] = useState(googleSheetsState.spreadsheetId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Confirmation modal state for destructive / mutating workspace operation
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'sync_out' | 'import_in' | null>(null);

  const handleSaveSheetUrl = () => {
    if (!customSheetId.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a valid Google Sheet URL or spreadsheet ID.' });
      return;
    }
    const cleanId = extractSpreadsheetId(customSheetId.trim());
    const formattedUrl = buildSpreadsheetUrl(cleanId);
    saveLinkedSheetId(cleanId);
    setCustomSheetId(formattedUrl);
    onUpdateGoogleSheetsState({
      isConnected: true,
      spreadsheetId: cleanId,
      spreadsheetUrl: formattedUrl,
      error: null,
    });
    setFeedback({
      type: 'success',
      message: `✓ Google Sheet URL updated & linked! ID: ${cleanId}`,
    });
  };

  if (!isOpen) return null;

  const handleCreateAndSync = async () => {
    if (!googleAccessToken) {
      onOpenGoogleAuth();
      return;
    }
    setPendingAction('sync_out');
    setIsConfirmOpen(true);
  };

  const handleImportClick = () => {
    if (!googleAccessToken) {
      onOpenGoogleAuth();
      return;
    }
    if (!customSheetId.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a valid Google Sheet URL or Spreadsheet ID first.' });
      return;
    }
    setPendingAction('import_in');
    setIsConfirmOpen(true);
  };

  const handleExecuteConfirmedAction = async () => {
    if (!googleAccessToken) return;
    setIsLoading(true);
    setFeedback(null);

    try {
      if (pendingAction === 'sync_out') {
        const rawInput = customSheetId.trim() || googleSheetsState.spreadsheetId || '';
        let sheetId = rawInput ? extractSpreadsheetId(rawInput) : '';
        let sheetUrl = sheetId ? buildSpreadsheetUrl(sheetId) : googleSheetsState.spreadsheetUrl;

        if (!sheetId) {
          const created = await createMarksDbSpreadsheet(
            googleAccessToken,
            'MarksDB - Govt. Sr. Sec. School, Sanwaloda Purohitan, Sikar'
          );
          sheetId = created.spreadsheetId;
          sheetUrl = created.spreadsheetUrl;
          setCustomSheetId(sheetUrl);
        }

        await syncDataToGoogleSheet(googleAccessToken, sheetId, {
          students,
          exams,
          marks,
          subjectsMap,
          teachers,
        });

        saveLinkedSheetId(sheetId);
        onUpdateGoogleSheetsState({
          isConnected: true,
          spreadsheetId: sheetId,
          spreadsheetUrl: sheetUrl || buildSpreadsheetUrl(sheetId),
          lastSyncedAt: new Date().toLocaleTimeString(),
          error: null,
        });

        setFeedback({
          type: 'success',
          message: 'All 5 sheets successfully written and formatted in Google Sheets!',
        });
      } else if (pendingAction === 'import_in') {
        const rawInput = customSheetId.trim() || googleSheetsState.spreadsheetId || '';
        const cleanId = extractSpreadsheetId(rawInput);
        const sheetUrl = buildSpreadsheetUrl(cleanId);
        const imported = await loadDataFromGoogleSheet(googleAccessToken, cleanId);

        const countStudents = imported.students?.length || 0;
        const countExams = imported.exams?.length || 0;
        const countMarks = imported.marks?.length || 0;

        if (countStudents === 0 && countExams === 0 && countMarks === 0) {
          setFeedback({
            type: 'error',
            message: 'No compatible tables found in the specified Google Sheet. Ensure sheet tabs are named Students, Exams, Marks.',
          });
        } else {
          onImportData(imported);
          saveLinkedSheetId(cleanId);
          onUpdateGoogleSheetsState({
            isConnected: true,
            spreadsheetId: cleanId,
            spreadsheetUrl: sheetUrl,
            lastSyncedAt: new Date().toLocaleTimeString(),
          });
          setFeedback({
            type: 'success',
            message: `Imported ${countStudents} students, ${countExams} exams, and ${countMarks} marks records from Google Sheets!`,
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation encountered an error.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
      setIsConfirmOpen(false);
      setPendingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div
        id="google-sheets-panel-modal"
        className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Sheet className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Google Sheets Database Manager
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct Google Drive &amp; Sheets synchronization (Cloud Persistence)
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-sheets-panel"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 rounded-2xl border p-3.5 text-xs font-semibold ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Auth Connection Status Card */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Google Workspace Authorization
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                {googleAccessToken ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Connected with Google Drive &amp; Sheets
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                    <AlertCircle className="h-4 w-4 text-amber-600" /> Not Connected (Sign in with Google to enable cloud sync)
                  </span>
                )}
              </div>
            </div>

            {!googleAccessToken ? (
              <button
                type="button"
                id="panel-google-connect-btn"
                onClick={onOpenGoogleAuth}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <span>Authorize Google Sheets</span>
              </button>
            ) : (
              <div className="text-xs font-medium text-slate-500">
                Scopes: <code className="text-emerald-700 font-mono text-[11px] font-bold">spreadsheets, drive.file</code>
              </div>
            )}
          </div>
        </div>

        {/* Spreadsheet Link / ID Configuration */}
        <div className="mt-5 space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
            Target Google Spreadsheet URL or ID:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              id="spreadsheet-id-input"
              value={customSheetId}
              onChange={(e) => setCustomSheetId(e.target.value)}
              placeholder="Paste Google Sheet URL (https://docs.google.com/spreadsheets/d/...) or ID"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
            />
            <button
              type="button"
              id="panel-update-sheet-url-btn"
              onClick={handleSaveSheetUrl}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
            >
              <Link className="h-3.5 w-3.5" />
              <span>Update URL</span>
            </button>
            {googleSheetsState.spreadsheetUrl && (
              <a
                href={googleSheetsState.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <span>Open</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </a>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Paste your full Google Sheets link from the browser bar or just the ID. The system automatically normalizes and connects to the sheet.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            id="panel-export-sync-btn"
            disabled={isLoading || !googleAccessToken}
            onClick={handleCreateAndSync}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 px-4 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 transition active:scale-98"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Export &amp; Sync Local Data to Sheets</span>
          </button>

          <button
            type="button"
            id="panel-import-btn"
            disabled={isLoading || !googleAccessToken || !customSheetId.trim()}
            onClick={handleImportClick}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 px-4 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 transition active:scale-98"
          >
            <DownloadCloud className="h-4 w-4 text-slate-500" />
            <span>Import Data from Google Sheets</span>
          </button>
        </div>

        {/* SOP Schema Documentation Reference */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 mb-3">
            <Database className="h-4 w-4 text-blue-600" />
            <span>Automatic Multi-Sheet Architecture (CBSE Compliant Schema):</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs text-slate-600">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <span className="font-bold text-blue-600 block mb-0.5">1. Students Sheet</span>
              RollNo, Name, Class, FatherName, Contact
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <span className="font-bold text-blue-600 block mb-0.5">2. Exams Sheet</span>
              ExamID, ExamName, Class, MaxMarks, Date
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <span className="font-bold text-blue-600 block mb-0.5">3. Marks Sheet</span>
              RollNo, Subject scores, Total, %, Rank, Remarks
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <span className="font-bold text-blue-600 block mb-0.5">4. Subjects &amp; 5. Teachers</span>
              Curriculum mappings &amp; Educator credentials
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog before modifying or overwriting Google Sheets */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        title={pendingAction === 'sync_out' ? 'Confirm Google Sheets Sync' : 'Confirm Import from Google Sheets'}
        message={
          pendingAction === 'sync_out'
            ? `Are you sure you want to write current application records (${students.length} students, ${exams.length} exams, ${marks.length} marks entries) into Google Sheets? This will update the sheets.`
            : 'Importing will merge records from the Google Sheet into your current dashboard session. Proceed?'
        }
        confirmLabel={pendingAction === 'sync_out' ? 'Proceed with Sync' : 'Proceed with Import'}
        cancelLabel="Cancel"
        isLoading={isLoading}
        onConfirm={handleExecuteConfirmedAction}
        onCancel={() => {
          setIsConfirmOpen(false);
          setPendingAction(null);
        }}
      />
    </div>
  );
};
