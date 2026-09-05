import React, { useState } from 'react';
import { KeyRound, LogIn, Phone, ShieldCheck, UserCheck, X } from 'lucide-react';
import { TeacherUser } from '../types';
import { googleSignIn } from '../services/firebaseAuth';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherUser[];
  onLoginSuccess: (teacher: TeacherUser, googleAccessToken?: string) => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onClose,
  teachers,
  onLoginSuccess,
}) => {
  const [mobileInput, setMobileInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanMobile = mobileInput.trim().replace(/\D/g, '');
    const cleanPin = pinInput.trim();

    if (!cleanMobile || !cleanPin) {
      setErrorMessage('Please enter both your registered mobile number and 4-digit PIN.');
      return;
    }

    const matchedTeacher = teachers.find(
      (t) => t.mobile.replace(/\D/g, '') === cleanMobile && t.pin === cleanPin
    );

    if (!matchedTeacher) {
      setErrorMessage('Invalid mobile number or 4-digit PIN combination.');
      return;
    }

    onLoginSuccess(matchedTeacher);
    onClose();
  };

  const handleQuickSelect = (teacher: TeacherUser) => {
    setMobileInput(teacher.mobile);
    setPinInput(teacher.pin);
    setErrorMessage('');
    onLoginSuccess(teacher);
    onClose();
  };

  const handleGoogleSignInClick = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    try {
      const result = await googleSignIn();
      if (result) {
        // Find existing or create teacher user profile from Google info
        const displayName = result.user.displayName?.toLowerCase() || '';
        const existing = teachers.find((t) => t.name.toLowerCase() === displayName);
        const teacherProfile: TeacherUser = existing || {
          id: `TCH-${Date.now()}`,
          name: result.user.displayName || 'Authorized Educator',
          mobile: teachers[0]?.mobile || '9876543210',
          pin: '1234',
          assignedClass: 'All Classes',
          role: 'Teacher',
        };
        onLoginSuccess(teacherProfile, result.accessToken);
        onClose();
      }
      // If result is null, user closed/cancelled the popup; no error needed
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (
        !errorMsg.includes('popup-closed-by-user') &&
        !errorMsg.includes('cancelled-popup-request')
      ) {
        setErrorMessage(errorMsg || 'Google Sign-in was cancelled or encountered an issue.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div
        id="teacher-login-modal"
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Teacher &amp; Admin Login</h2>
              <p className="text-xs text-slate-500 mt-0.5">Access class ranking, marks entry &amp; Sheets sync</p>
            </div>
          </div>
          <button
            type="button"
            id="close-login-modal"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleCredentialLogin} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Teacher Mobile Number
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Phone className="h-4 w-4" />
              </div>
              <input
                type="tel"
                id="teacher-mobile-input"
                placeholder="e.g. 9876543210"
                value={mobileInput}
                onChange={(e) => setMobileInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Enter your 10-digit mobile number and 4-digit PIN below
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              4-Digit Security PIN
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <KeyRound className="h-4 w-4" />
              </div>
              <input
                type="password"
                maxLength={4}
                id="teacher-pin-input"
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-mono font-bold tracking-widest text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
              />
            </div>
          </div>

          <button
            type="submit"
            id="submit-teacher-login"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 px-4 text-xs font-bold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 transition active:scale-98"
          >
            <LogIn className="h-4 w-4" />
            Sign In to Teacher Dashboard
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-5 pt-3.5 border-t border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
            Quick Demo Accounts (Click to login):
          </p>
          <div className="space-y-1.5">
            {teachers.map((t) => (
              <button
                key={t.id}
                type="button"
                id={`demo-teacher-${t.id}`}
                onClick={() => handleQuickSelect(t)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs hover:bg-slate-100 transition"
              >
                <div>
                  <span className="font-bold text-slate-800">{t.name}</span>
                  <span className="ml-1.5 text-[10px] font-medium text-slate-400">({t.role})</span>
                </div>
                <div className="text-[11px] font-mono text-blue-600 font-bold">
                  PIN: {t.pin}
                </div>
              </button>
            ))}
          </div>
        </div>

        
      </div>
    </div>
  );
};
