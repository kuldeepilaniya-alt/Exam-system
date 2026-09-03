import React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Sheet,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { GoogleSheetsSyncState, TeacherUser } from '../types';

interface NavbarProps {
  currentView: 'student' | 'teacher';
  onViewChange: (view: 'student' | 'teacher') => void;
  activeTeacher: TeacherUser | null;
  onOpenTeacherLogin: () => void;
  onTeacherLogout: () => void;
  googleSheetsState: GoogleSheetsSyncState;
  onOpenSheetsPanel: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  activeTeacher,
  onOpenTeacherLogin,
  onTeacherLogout,
  googleSheetsState,
  onOpenSheetsPanel,
}) => {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white shadow-xs print:hidden">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-8">
        {/* Brand / School Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-lg shadow-xs">
            G
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
              Govt. Sr. Sec. School
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate max-w-xs sm:max-w-md">
              Sanwaloda Purohitan, Sikar • Examination Cell
            </span>
          </div>
        </div>

        {/* Center / Navigation Switcher & Status */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Navigation Mode Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              id="nav-student-view-btn"
              onClick={() => onViewChange('student')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                currentView === 'student'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Student Result</span>
            </button>
            <button
              type="button"
              id="nav-teacher-view-btn"
              onClick={() => {
                if (activeTeacher) {
                  onViewChange('teacher');
                } else {
                  onOpenTeacherLogin();
                }
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                currentView === 'teacher'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Staff Portal</span>
              {!activeTeacher && (
                <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.2 text-[9px] font-black uppercase text-slate-700">
                  PIN
                </span>
              )}
            </button>
          </div>

          {/* Session & Online Status Indicator */}
          <div className="hidden lg:flex items-center gap-6 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <div className="flex flex-col items-end leading-tight">
              <span className="text-slate-900 font-bold">Session 2025–2026</span>
              <span className="text-blue-600 font-semibold tracking-normal text-[10px]">Evaluation Phase II</span>
            </div>
            <div className="h-7 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>System Online</span>
            </div>
          </div>

          {/* Teacher Status / Actions */}
          {activeTeacher ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="nav-sheets-status-btn"
                onClick={onOpenSheetsPanel}
                title="Google Sheets Database Status"
                className={`hidden md:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  googleSheetsState.isConnected
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Sheet className="h-3.5 w-3.5" />
                <span>{googleSheetsState.isConnected ? 'Sheets Synced' : 'Sync Sheets'}</span>
              </button>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-1 px-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-bold">
                  {activeTeacher.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {activeTeacher.name}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500">
                    {activeTeacher.role} ({activeTeacher.assignedClass})
                  </div>
                </div>
                <button
                  type="button"
                  id="nav-logout-btn"
                  onClick={onTeacherLogout}
                  title="Sign out of Teacher portal"
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              id="nav-teacher-login-btn"
              onClick={onOpenTeacherLogin}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-slate-900/10 hover:bg-slate-800 active:scale-95 transition"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Authenticate Staff</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
