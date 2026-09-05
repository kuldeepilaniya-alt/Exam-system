import React, { useEffect, useState, useCallback } from 'react';
import {
  Exam,
  GoogleSheetsSyncState,
  MarkRecord,
  Student,
  TeacherUser,
} from './types';
import {
  getStoredActiveTeacher,
  getStoredExams,
  getStoredLinkedSheetId,
  getStoredMarks,
  getStoredStudents,
  getStoredSubjectsMap,
  getStoredTeachers,
  getStoredWebAppUrl,
  resetToDefaults,
  saveActiveTeacher,
  saveExams,
  saveLinkedSheetId,
  saveMarks,
  saveStudents,
  saveSubjectsMap,
  saveTeachers,
  saveStoredWebAppUrl,
} from './data/mockDatabase';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { TeacherLoginModal } from './components/TeacherLoginModal';
import { GoogleSheetsPanel } from './components/GoogleSheetsPanel';
import { MobileSidebarDrawer } from './components/MobileSidebarDrawer';
import { AddSubjectModal } from './components/AddSubjectModal';
import { AddStudentModal } from './components/AddStudentModal';
import { AddExamModal } from './components/AddExamModal';
import { initAuth, googleSignIn } from './services/firebaseAuth';
import { fetchDataFromAnyGoogleSource, extractSpreadsheetId } from './services/googleSheets';
import { RotateCcw, RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'student' | 'teacher'>('student');
  const [activeTeacher, setActiveTeacher] = useState<TeacherUser | null>(() => getStoredActiveTeacher());
  const [students, setStudents] = useState<Student[]>(() => getStoredStudents());
  const [exams, setExams] = useState<Exam[]>(() => getStoredExams());
  const [marks, setMarks] = useState<MarkRecord[]>(() => getStoredMarks());
  const [subjectsMap, setSubjectsMap] = useState<{ [className: string]: string[] }>(() => getStoredSubjectsMap());
  const [teachers, setTeachers] = useState<TeacherUser[]>(() => getStoredTeachers());

  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleSheetsState, setGoogleSheetsState] = useState<GoogleSheetsSyncState>(() => {
    const linkedId = getStoredLinkedSheetId();
    return {
      isConnected: false,
      userEmail: null,
      spreadsheetId: linkedId,
      spreadsheetUrl: linkedId ? `https://docs.google.com/spreadsheets/d/${linkedId}/edit` : null,
      lastSyncedAt: null,
      syncInProgress: false,
      error: null,
    };
  });

  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [syncBanner, setSyncBanner] = useState<{
    type: 'syncing' | 'success' | 'info';
    message: string;
    details?: string;
  } | null>(null);

  const [isTeacherLoginOpen, setIsTeacherLoginOpen] = useState(false);
  const [isSheetsPanelOpen, setIsSheetsPanelOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [selectedStudentRoll, setSelectedStudentRoll] = useState<string | null>(null);
  const [selectedExamIdToView, setSelectedExamIdToView] = useState<string | null>(null);

  // Initialize Firebase Auth listener for Google OAuth token
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleAccessToken(token);
        setGoogleSheetsState((prev) => ({
          ...prev,
          isConnected: true,
          userEmail: user.email,
        }));
      },
      () => {
        setGoogleAccessToken(null);
        setGoogleSheetsState((prev) => ({
          ...prev,
          isConnected: false,
        }));
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Universal function to load latest live data from Google Sheets or Web App
  const syncDataFromGoogleSheet = useCallback(
    async (override?: { spreadsheetId?: string; webAppUrl?: string }) => {
      const sheetId = override?.spreadsheetId || getStoredLinkedSheetId();
      const webAppUrl = override?.webAppUrl || getStoredWebAppUrl();

      if (!sheetId && !webAppUrl) {
        return;
      }

      setIsAutoSyncing(true);
      setSyncBanner({
        type: 'syncing',
        message: 'Syncing live student marks from Google Sheets...',
      });

      try {
        const data = await fetchDataFromAnyGoogleSource({
          spreadsheetId: sheetId,
          webAppUrl: webAppUrl,
          accessToken: googleAccessToken,
        });

        let updatedStudents = false;
        let updatedExams = false;
        let updatedMarks = false;

        if (data.students && data.students.length > 0) {
          setStudents(data.students);
          saveStudents(data.students);
          updatedStudents = true;
        }

        if (data.exams && data.exams.length > 0) {
          setExams(data.exams);
          saveExams(data.exams);
          updatedExams = true;
        }

        if (data.marks && data.marks.length > 0) {
          setMarks(data.marks);
          saveMarks(data.marks);
          updatedMarks = true;
        }

        if (data.subjectsMap && Object.keys(data.subjectsMap).length > 0) {
          setSubjectsMap(data.subjectsMap);
          saveSubjectsMap(data.subjectsMap);
        }

        if (data.teachers && data.teachers.length > 0) {
          setTeachers(data.teachers);
          saveTeachers(data.teachers);
        }

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setGoogleSheetsState((prev) => ({
          ...prev,
          isConnected: true,
          lastSyncedAt: timeStr,
          error: null,
        }));

        if (updatedStudents || updatedMarks || updatedExams) {
          setSyncBanner({
            type: 'success',
            message: `Live data loaded from Google Sheet (${data.students?.length || 0} students, ${data.marks?.length || 0} marks)`,
            details: `Updated at ${timeStr}`,
          });

          // Auto-hide success message after 4.5 seconds
          setTimeout(() => {
            setSyncBanner((curr) => (curr?.type === 'success' ? null : curr));
          }, 4500);
        } else {
          setSyncBanner(null);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn('Google Sheets auto-fetch notice:', errorMsg);
        setSyncBanner(null);
      } finally {
        setIsAutoSyncing(false);
      }
    },
    [googleAccessToken]
  );

  // Auto-fetch data on URL load and extract parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSheet =
      params.get('sheetId') ||
      params.get('sheetUrl') ||
      params.get('spreadsheetId') ||
      params.get('sheet') ||
      params.get('url');

    const urlWebApp = params.get('webAppUrl') || params.get('scriptUrl') || params.get('webhook');
    const urlRoll = params.get('roll') || params.get('rollNo') || params.get('r');
    const urlExam = params.get('exam') || params.get('examId');

    let cleanSheetId: string | undefined = undefined;
    if (urlSheet) {
      cleanSheetId = extractSpreadsheetId(urlSheet);
      if (cleanSheetId) {
        saveLinkedSheetId(cleanSheetId);
        setGoogleSheetsState((prev) => ({
          ...prev,
          spreadsheetId: cleanSheetId,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanSheetId}/edit`,
          isConnected: true,
        }));
      }
    }

    if (urlWebApp) {
      saveStoredWebAppUrl(urlWebApp);
    }

    if (urlRoll) {
      setSelectedStudentRoll(urlRoll.trim());
      if (urlExam) {
        setSelectedExamIdToView(urlExam.trim());
      }
      setCurrentView('student');
    }

    // Trigger auto-fetch from Google Sheet or Web App immediately
    syncDataFromGoogleSheet({
      spreadsheetId: cleanSheetId,
      webAppUrl: urlWebApp || undefined,
    });
  }, [syncDataFromGoogleSheet]);

  // Update handlers
  const handleTeacherLoginSuccess = (teacher: TeacherUser, token?: string) => {
    setActiveTeacher(teacher);
    saveActiveTeacher(teacher);
    if (token) {
      setGoogleAccessToken(token);
      setGoogleSheetsState((prev) => ({
        ...prev,
        isConnected: true,
      }));
    }
    setCurrentView('teacher');
  };

  const handleTeacherLogout = () => {
    setActiveTeacher(null);
    saveActiveTeacher(null);
    setCurrentView('student');
  };

  const handleUpdateMarks = (newMarks: MarkRecord[]) => {
    setMarks(newMarks);
    saveMarks(newMarks);
  };

  const handleAddStudent = (newStudent: Student) => {
    const updated = [...students, newStudent];
    setStudents(updated);
    saveStudents(updated);
  };

  const handleUpdateTeachers = (newTeachers: TeacherUser[]) => {
    setTeachers(newTeachers);
    saveTeachers(newTeachers);
  };

  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    saveStudents(newStudents);
  };

  const handleUpdateExams = (newExams: Exam[]) => {
    setExams(newExams);
    saveExams(newExams);
  };

  const handleAddExam = (newExam: Exam) => {
    const updated = [...exams, newExam];
    setExams(updated);
    saveExams(updated);
  };

  const handleSaveSubjects = (className: string, subjects: string[]) => {
    const updated = {
      ...subjectsMap,
      [className]: subjects,
    };
    setSubjectsMap(updated);
    saveSubjectsMap(updated);
  };

  const handleDeleteExam = (examId: string) => {
    const updatedExams = exams.filter((e) => e.examId !== examId);
    setExams(updatedExams);
    saveExams(updatedExams);

    const updatedMarks = marks.filter((m) => m.examId !== examId);
    setMarks(updatedMarks);
    saveMarks(updatedMarks);
  };

  const handleDeleteStudentMarks = (examId: string, rollNo: string) => {
    const updatedMarks = marks.filter(
      (m) => !(m.examId === examId && m.rollNo.toString().trim() === rollNo.toString().trim())
    );
    setMarks(updatedMarks);
    saveMarks(updatedMarks);
  };

  const handleDeleteStudent = (rollNo: string, className: string) => {
    const updatedStudents = students.filter(
      (s) => !(s.rollNo.toString().trim() === rollNo.toString().trim() && s.className === className)
    );
    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    const updatedMarks = marks.filter(
      (m) => m.rollNo.toString().trim() !== rollNo.toString().trim()
    );
    setMarks(updatedMarks);
    saveMarks(updatedMarks);
  };

  const handleSaveToDatabase = () => {
    if (activeTeacher) {
      setCurrentView('teacher');
      setTimeout(() => {
        const syncBtn = document.getElementById('google-sync-top-btn');
        if (syncBtn) {
          syncBtn.click();
        } else {
          setIsSheetsPanelOpen(true);
        }
      }, 150);
    } else {
      setIsSheetsPanelOpen(true);
    }
  };

  const handleUpdateGoogleSheetsState = (partial: Partial<GoogleSheetsSyncState>) => {
    setGoogleSheetsState((prev) => {
      const next = { ...prev, ...partial };
      if (next.spreadsheetId) {
        saveLinkedSheetId(next.spreadsheetId);
        if (!next.spreadsheetUrl) {
          next.spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${next.spreadsheetId}/edit`;
        }
      }
      return next;
    });
  };

  const handleOpenGoogleAuth = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleAccessToken(res.accessToken);
        setGoogleSheetsState((prev) => ({
          ...prev,
          isConnected: true,
          userEmail: res.user.email,
        }));
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (!errorMsg.includes('popup-closed-by-user') && !errorMsg.includes('cancelled-popup-request')) {
        console.warn('Google sign-in could not be completed:', errorMsg);
      }
    }
  };

  const handleImportData = (data: {
    students?: Student[];
    exams?: Exam[];
    marks?: MarkRecord[];
  }) => {
    if (data.students && data.students.length > 0) {
      setStudents(data.students);
      saveStudents(data.students);
    }
    if (data.exams && data.exams.length > 0) {
      setExams(data.exams);
      saveExams(data.exams);
    }
    if (data.marks && data.marks.length > 0) {
      setMarks(data.marks);
      saveMarks(data.marks);
    }
  };

  const handleViewStudentResult = (rollNo: string, examId: string) => {
    setSelectedStudentRoll(rollNo);
    setSelectedExamIdToView(examId);
    setCurrentView('student');
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo marks, students, and exams to original defaults?')) {
      resetToDefaults();
      setStudents(getStoredStudents());
      setExams(getStoredExams());
      setMarks(getStoredMarks());
      setSubjectsMap(getStoredSubjectsMap());
      setTeachers(getStoredTeachers());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        activeTeacher={activeTeacher}
        onOpenTeacherLogin={() => setIsTeacherLoginOpen(true)}
        onTeacherLogout={handleTeacherLogout}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        isSyncing={isAutoSyncing}
        lastSyncedAt={googleSheetsState.lastSyncedAt}
        onRefreshSync={() => syncDataFromGoogleSheet()}
      />

      {/* Floating / Top Live Sync Notification Banner */}
      {syncBanner && (
        <aside
          aria-label="Google Sheets Sync Status"
          className="bg-indigo-900 text-white px-4 py-2 text-xs transition-all flex items-center justify-between border-b border-indigo-800 shadow-xs print:hidden"
        >
          <div className="mx-auto flex max-w-7xl w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {syncBanner.type === 'syncing' ? (
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-300 shrink-0" />
              ) : syncBanner.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              )}
              <span className="font-semibold">{syncBanner.message}</span>
              {syncBanner.details && (
                <span className="hidden sm:inline text-indigo-200 text-[11px]">
                  ({syncBanner.details})
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSyncBanner(null)}
              className="text-indigo-300 hover:text-white transition p-1"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Body */}
      <main className="flex-1">
        {currentView === 'student' ? (
          <StudentPortal
            students={students}
            exams={exams}
            marks={marks}
            subjectsMap={subjectsMap}
            initialRollNo={selectedStudentRoll}
            initialExamId={selectedExamIdToView}
          />
        ) : activeTeacher ? (
          <TeacherDashboard
            activeTeacher={activeTeacher}
            students={students}
            exams={exams}
            marks={marks}
            subjectsMap={subjectsMap}
            teachers={teachers}
            onUpdateTeachers={handleUpdateTeachers}
            onUpdateStudents={handleUpdateStudents}
            onUpdateExams={handleUpdateExams}
            googleSheetsState={googleSheetsState}
            onUpdateMarks={handleUpdateMarks}
            onAddStudent={handleAddStudent}
            onAddExam={handleAddExam}
            onDeleteExam={handleDeleteExam}
            onDeleteStudentMarks={handleDeleteStudentMarks}
            onDeleteStudent={handleDeleteStudent}
            onOpenAddSubject={() => setIsAddSubjectOpen(true)}
            onSaveSubjects={handleSaveSubjects}
            onUpdateGoogleSheetsState={handleUpdateGoogleSheetsState}
            onViewStudentResult={handleViewStudentResult}
            onOpenGoogleAuth={handleOpenGoogleAuth}
            googleAccessToken={googleAccessToken}
            onImportData={handleImportData}
          />
        ) : (
          <div className="mx-auto max-w-md py-20 px-4 text-center">
            <h2 className="text-xl font-bold">Teacher Authorization Required</h2>
            <p className="mt-2 text-sm text-slate-500">
              Please sign in using your mobile number or 4-digit PIN to access class marks and rankings.
            </p>
            <button
              type="button"
              onClick={() => setIsTeacherLoginOpen(true)}
              className="mt-4 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              Open Teacher Login
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row sm:px-6">
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Govt. Sr. Sec. School, Sanwaloda Purohitan, Sikar
            </span>{' '}
            • Principal: Narendra Singh Chauhan • Examination Cell
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleResetData}
              className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              title="Reset records to default sample data"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Sample Data</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Google Sheets &amp; Drive Integrated</span>
          </div>
        </div>
      </footer>

      {/* Mobile Side Menu Drawer */}
      <MobileSidebarDrawer
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        currentView={currentView}
        onSelectView={setCurrentView}
        activeTeacher={activeTeacher}
        onOpenTeacherLogin={() => setIsTeacherLoginOpen(true)}
        onTeacherLogout={handleTeacherLogout}
        onOpenAddSubject={() => setIsAddSubjectOpen(true)}
        onOpenAddStudent={() => setIsAddStudentOpen(true)}
        onOpenAddExam={() => setIsAddExamOpen(true)}
        onSaveToDatabase={handleSaveToDatabase}
        lastSyncedAt={googleSheetsState.lastSyncedAt}
        isSyncing={isAutoSyncing}
        onRefreshSync={() => syncDataFromGoogleSheet()}
      />

      {/* Add Subject Modal */}
      <AddSubjectModal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        subjectsMap={subjectsMap}
        onSaveSubjects={handleSaveSubjects}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onAddStudent={handleAddStudent}
      />

      {/* Add Exam Modal */}
      <AddExamModal
        isOpen={isAddExamOpen}
        onClose={() => setIsAddExamOpen(false)}
        onAddExam={handleAddExam}
      />

      {/* Modals */}
      <TeacherLoginModal
        isOpen={isTeacherLoginOpen}
        onClose={() => setIsTeacherLoginOpen(false)}
        teachers={teachers}
        onLoginSuccess={handleTeacherLoginSuccess}
      />

      <GoogleSheetsPanel
        isOpen={isSheetsPanelOpen}
        onClose={() => setIsSheetsPanelOpen(false)}
        googleSheetsState={googleSheetsState}
        onUpdateGoogleSheetsState={handleUpdateGoogleSheetsState}
        googleAccessToken={googleAccessToken}
        onOpenGoogleAuth={handleOpenGoogleAuth}
        students={students}
        exams={exams}
        marks={marks}
        subjectsMap={subjectsMap}
        teachers={teachers}
        onImportData={handleImportData}
      />
    </div>
  );
}
