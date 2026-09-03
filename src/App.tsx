import React, { useEffect, useState } from 'react';
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
  resetToDefaults,
  saveActiveTeacher,
  saveExams,
  saveLinkedSheetId,
  saveMarks,
  saveStudents,
  saveTeachers,
} from './data/mockDatabase';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { TeacherLoginModal } from './components/TeacherLoginModal';
import { GoogleSheetsPanel } from './components/GoogleSheetsPanel';
import { initAuth, googleSignIn } from './services/firebaseAuth';
import { RotateCcw } from 'lucide-react';

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

  const [isTeacherLoginOpen, setIsTeacherLoginOpen] = useState(false);
  const [isSheetsPanelOpen, setIsSheetsPanelOpen] = useState(false);

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

  // Update handlers
  const handleTeacherLoginSuccess = (teacher: TeacherUser, token?: string) => {
    setActiveTeacher(teacher);
    saveActiveTeacher(teacher);
    if (token) {
      setGoogleAccessToken(token);
      setGoogleSheetsState((prev) => ({
        ...prev,
        isConnected: true,
        userEmail: teacher.email || null,
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

  const handleAddExam = (newExam: Exam) => {
    const updated = [...exams, newExam];
    setExams(updated);
    saveExams(updated);
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

  const handleViewStudentResult = (rollNo: string, _examId: string) => {
    setCurrentView('student');
    // The student portal will load the selected student
    const input = document.getElementById('student-roll-input') as HTMLInputElement;
    if (input) {
      input.value = rollNo;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const btn = document.getElementById('search-result-btn');
      btn?.click();
    }
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
        googleSheetsState={googleSheetsState}
        onOpenSheetsPanel={() => setIsSheetsPanelOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {currentView === 'student' ? (
          <StudentPortal
            students={students}
            exams={exams}
            marks={marks}
            subjectsMap={subjectsMap}
          />
        ) : activeTeacher ? (
          <TeacherDashboard
            activeTeacher={activeTeacher}
            students={students}
            exams={exams}
            marks={marks}
            subjectsMap={subjectsMap}
            googleSheetsState={googleSheetsState}
            onUpdateMarks={handleUpdateMarks}
            onAddStudent={handleAddStudent}
            onAddExam={handleAddExam}
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
