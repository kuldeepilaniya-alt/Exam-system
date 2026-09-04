import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, X } from 'lucide-react';
import { ORDERED_CLASSES } from '../data/mockDatabase';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectsMap: { [className: string]: string[] };
  onSaveSubjects: (className: string, subjects: string[]) => void;
  initialClass?: string;
}

const COMMON_SUBJECT_SUGGESTIONS = [
  'Hindi',
  'English',
  'Science',
  'Maths',
  'Social Science',
  'Sanskrit',
  'Physic',
  'Chemistry',
  'Biology',
  'Agriculture',
  'Drawing',
  'Computer',
  'Urdu',
];

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  isOpen,
  onClose,
  subjectsMap,
  onSaveSubjects,
  initialClass = '10A',
}) => {
  const [targetClass, setTargetClass] = useState<string>(initialClass);
  const [newSubjectInput, setNewSubjectInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSubjects = subjectsMap[targetClass] || [
    'Hindi',
    'English',
    'Science',
    'Maths',
    'Social Science',
    'Sanskrit',
  ];

  const handleAddSubject = (subjectToAdd?: string) => {
    const name = (subjectToAdd || newSubjectInput).trim();
    if (!name) return;

    if (currentSubjects.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setStatusMessage(`"${name}" is already added to Class ${targetClass}`);
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    const updated = [...currentSubjects, name];
    onSaveSubjects(targetClass, updated);
    setNewSubjectInput('');
    setStatusMessage(`✓ Added "${name}" to Class ${targetClass}`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    if (currentSubjects.length <= 1) {
      alert('A class must have at least one subject.');
      return;
    }
    const updated = currentSubjects.filter((s) => s !== subjectToRemove);
    onSaveSubjects(targetClass, updated);
    setStatusMessage(`Removed "${subjectToRemove}" from Class ${targetClass}`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs print:hidden">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Class Subjects Manager
              </h3>
              <p className="text-xs text-slate-500">
                Add, configure, or adjust subjects for each class curriculum
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-5 space-y-4">
          {/* Class Select */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Select Class
            </label>
            <select
              id="add-subject-class-select"
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-800 shadow-xs focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
            >
              {ORDERED_CLASSES.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>
          </div>

          {/* Current Subjects List */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Active Subjects for Class {targetClass} ({currentSubjects.length})
            </label>
            <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 min-h-[50px]">
              {currentSubjects.map((sub) => (
                <span
                  key={sub}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs"
                >
                  <span>{sub}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(sub)}
                    title={`Remove ${sub}`}
                    className="text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Add New Subject Input */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              New Subject Name
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddSubject();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                id="new-subject-name-input"
                placeholder="e.g. Drawing, Sanskrit, Computer..."
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
              />
              <button
                type="submit"
                id="submit-add-subject-btn"
                className="flex items-center gap-1 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 active:scale-95 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Quick Suggestions */}
          <div>
            <span className="block text-[10px] font-bold text-slate-400 mb-1.5">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SUBJECT_SUGGESTIONS.filter(
                (s) => !currentSubjects.some((cs) => cs.toLowerCase() === s.toLowerCase())
              ).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAddSubject(s)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50 transition"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-bold text-emerald-800 text-center animate-fade-in">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
