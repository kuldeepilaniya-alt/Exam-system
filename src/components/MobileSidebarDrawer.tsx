import React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  UserPlus,
  CalendarPlus,
  Database,
  LogOut,
  X,
  ShieldAlert,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  Sheet,
} from 'lucide-react';
import { TeacherUser } from '../types';

interface MobileSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'student' | 'teacher';
  onSelectView: (view: 'student' | 'teacher') => void;
  activeTeacher: TeacherUser | null;
  onOpenTeacherLogin: () => void;
  onTeacherLogout: () => void;
  onOpenAddSubject: () => void;
  onOpenAddStudent: () => void;
  onOpenAddExam: () => void;
  onSaveToDatabase: () => void;
  lastSyncedAt?: string | null;
  isSyncing?: boolean;
  onRefreshSync?: () => void;
}

export const MobileSidebarDrawer: React.FC<MobileSidebarDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  onSelectView,
  activeTeacher,
  onOpenTeacherLogin,
  onTeacherLogout,
  onOpenAddSubject,
  onOpenAddStudent,
  onOpenAddExam,
  onSaveToDatabase,
  lastSyncedAt,
  isSyncing = false,
  onRefreshSync,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex print:hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Drawer Container */}
      <aside
        id="mobile-sidebar-drawer"
        className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col bg-white text-slate-900 shadow-2xl transition-transform duration-300 ease-in-out"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation & School Actions Menu"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-900 font-black text-lg shadow-sm">
              G
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm leading-tight text-white tracking-tight">
                Govt. Sr. Sec. School
              </span>
              <span className="text-[10px] font-bold text-slate-400 truncate max-w-[170px]">
                Sanwaloda Purohitan, Sikar
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 mt-0.5">
                Session 2026-27
              </span>
            </div>
          </div>

          <button
            type="button"
            id="close-mobile-sidebar-btn"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-xl p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation & Action Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Main Views */}
          <div className="space-y-1.5">
            <span className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Navigation
            </span>

            {/* Student Result */}
            <button
              type="button"
              id="sidebar-student-result-btn"
              onClick={() => {
                onSelectView('student');
                onClose();
              }}
              className={`w-full flex items-center justify-between rounded-2xl p-3 text-left transition ${
                currentView === 'student'
                  ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold shadow-xs'
                  : 'hover:bg-slate-50 text-slate-700 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    currentView === 'student' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold">Student Result</div>
                  <div className="text-[11px] text-slate-500">Student scorecards &amp; marksheet</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>

            {/* Staff Portal */}
            <button
              type="button"
              id="sidebar-staff-portal-btn"
              onClick={() => {
                if (activeTeacher) {
                  onSelectView('teacher');
                } else {
                  onOpenTeacherLogin();
                }
                onClose();
              }}
              className={`w-full flex items-center justify-between rounded-2xl p-3 text-left transition ${
                currentView === 'teacher'
                  ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold shadow-xs'
                  : 'hover:bg-slate-50 text-slate-700 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    currentView === 'teacher' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold flex items-center gap-1.5">
                    <span>Staff Portal</span>
                    {!activeTeacher && (
                      <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[9px] font-black uppercase text-slate-700">
                        PIN
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">Teacher mark entry &amp; merit lists</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          {/* Live Data Sync Section (For all users & teachers) */}
          {onRefreshSync && (
            <div className="space-y-1.5">
              <span className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Live Google Sheet Sync
              </span>
              <button
                type="button"
                id="sidebar-fetch-sheets-btn"
                onClick={() => {
                  onRefreshSync();
                  onClose();
                }}
                disabled={isSyncing}
                className="w-full flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 text-left hover:bg-indigo-100/70 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                    {isSyncing ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <Sheet className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-indigo-950">
                      {isSyncing ? 'Fetching Live Data...' : 'Refresh Sheet Data'}
                    </div>
                    <div className="text-[11px] text-indigo-700 flex items-center gap-1">
                      {lastSyncedAt ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Last synced {lastSyncedAt}</span>
                        </>
                      ) : (
                        <span>Fetch marks from Google Sheets</span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-indigo-400" />
              </button>
            </div>
          )}

          {/* School Operations & Management Actions (Accessible after Teacher login) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Teacher Management
              </span>
              {activeTeacher ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                  Logged In
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                  Staff Only
                </span>
              )}
            </div>

            {activeTeacher ? (
              <>
                {/* Add Subject */}
                <button
                  type="button"
                  id="sidebar-add-subject-btn"
                  onClick={() => {
                    onOpenAddSubject();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-2xl p-3 text-left hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Add Subject</div>
                      <div className="text-[11px] text-slate-500">Configure class subjects</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>

                {/* Add Student */}
                <button
                  type="button"
                  id="sidebar-add-student-btn"
                  onClick={() => {
                    onOpenAddStudent();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-2xl p-3 text-left hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Add Student</div>
                      <div className="text-[11px] text-slate-500">Register student to roster</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>

                {/* Add Exam */}
                <button
                  type="button"
                  id="sidebar-add-exam-btn"
                  onClick={() => {
                    onOpenAddExam();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-2xl p-3 text-left hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <CalendarPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Add Exam</div>
                      <div className="text-[11px] text-slate-500">Create new test/exam</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>

                {/* Save to Database */}
                <button
                  type="button"
                  id="sidebar-save-database-btn"
                  onClick={() => {
                    onSaveToDatabase();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-left hover:bg-emerald-100/70 transition shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-emerald-950">Save to Database</div>
                      <div className="text-[11px] text-emerald-700 flex items-center gap-1">
                        {lastSyncedAt ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>Synced at {lastSyncedAt}</span>
                          </>
                        ) : (
                          <span>Sync marks to Google Sheets</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-emerald-600" />
                </button>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3.5 text-center">
                <ShieldAlert className="mx-auto h-6 w-6 text-amber-500 mb-1.5" />
                <p className="text-xs font-bold text-slate-800">Teacher Login Required</p>
                <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                  Sign in with Staff PIN to add subjects, register students, create exams, and sync database.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onOpenTeacherLogin();
                    onClose();
                  }}
                  className="mt-2.5 inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Teacher Sign In
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Teacher Logout / Authentication Area (Bottom of Sidebar) */}
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <span className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Teacher Session
          </span>

          {activeTeacher ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white text-sm font-bold">
                    {activeTeacher.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {activeTeacher.name}
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 truncate">
                      {activeTeacher.role} ({activeTeacher.assignedClass})
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  id="sidebar-teacher-logout-btn"
                  onClick={() => {
                    onTeacherLogout();
                    onClose();
                  }}
                  title="Log out from Teacher Portal"
                  className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shrink-0"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">Not Authenticated</span>
                </div>
                <button
                  type="button"
                  id="sidebar-teacher-login-btn"
                  onClick={() => {
                    onOpenTeacherLogin();
                    onClose();
                  }}
                  className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                >
                  Staff Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
