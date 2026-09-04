import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  Edit2,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { ORDERED_CLASSES } from '../data/mockDatabase';
import { ConfirmationModal } from './ConfirmationModal';

interface SubjectsManagerProps {
  subjectsMap: { [className: string]: string[] };
  onSaveSubjects: (className: string, subjects: string[]) => void;
  onSaveToDatabase?: () => void;
}

const COMMON_PRESET_SUBJECTS = [
  'Hindi',
  'English',
  'Science',
  'Maths',
  'Social Science',
  'Sanskrit',
  'Physics',
  'Chemistry',
  'Biology',
  'Agriculture',
  'Ag Chemistry',
  'Ag Biology',
  'History',
  'Geography',
  'Political Science',
  'Economics',
  'Hindi Literature',
  'English Literature',
  'Computer Science',
  'Information Technology',
  'Drawing',
  'Urdu',
];

export const SubjectsManager: React.FC<SubjectsManagerProps> = ({
  subjectsMap,
  onSaveSubjects,
  onSaveToDatabase,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('10A');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubjectIndex, setEditingSubjectIndex] = useState<number | null>(null);
  const [editSubjectValue, setEditSubjectValue] = useState('');
  const [deleteTargetSubject, setDeleteTargetSubject] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const currentClassSubjects = subjectsMap[selectedClass] || [
    'Hindi',
    'English',
    'Science',
    'Maths',
    'Social Science',
    'Sanskrit',
  ];

  const handleAddSubject = (subjectToAdd?: string) => {
    const name = (subjectToAdd || newSubjectName).trim();
    if (!name) return;

    if (currentClassSubjects.some((s) => s.toLowerCase() === name.toLowerCase())) {
      alert(`"${name}" is already part of the Class ${selectedClass} curriculum.`);
      return;
    }

    const updated = [...currentClassSubjects, name];
    onSaveSubjects(selectedClass, updated);
    setNewSubjectName('');
    setFeedbackMessage(`✓ Added "${name}" to Class ${selectedClass} curriculum.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleStartEdit = (idx: number, currentVal: string) => {
    setEditingSubjectIndex(idx);
    setEditSubjectValue(currentVal);
  };

  const handleSaveEditSubject = (idx: number) => {
    const val = editSubjectValue.trim();
    if (!val) return;

    if (
      currentClassSubjects.some(
        (s, i) => i !== idx && s.toLowerCase() === val.toLowerCase()
      )
    ) {
      alert(`Subject "${val}" already exists in Class ${selectedClass}.`);
      return;
    }

    const updated = [...currentClassSubjects];
    updated[idx] = val;
    onSaveSubjects(selectedClass, updated);
    setEditingSubjectIndex(null);
    setFeedbackMessage(`✓ Subject updated to "${val}".`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleMoveSubject = (idx: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && idx === 0) ||
      (direction === 'down' && idx === currentClassSubjects.length - 1)
    ) {
      return;
    }

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...currentClassSubjects];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;

    onSaveSubjects(selectedClass, updated);
  };

  const handleConfirmDeleteSubject = () => {
    if (!deleteTargetSubject) return;
    if (currentClassSubjects.length <= 1) {
      alert('A class curriculum must have at least one subject.');
      setDeleteTargetSubject(null);
      return;
    }

    const updated = currentClassSubjects.filter((s) => s !== deleteTargetSubject);
    onSaveSubjects(selectedClass, updated);
    setDeleteTargetSubject(null);
    setFeedbackMessage(`✓ Removed "${deleteTargetSubject}" from Class ${selectedClass}.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
                  Subjects &amp; Curriculum Management
                </h2>
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-black text-purple-800">
                  {ORDERED_CLASSES.length} Classes
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                Configure, rename, reorder, and assign academic subject papers for each class in the examination system.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onSaveToDatabase && (
              <button
                type="button"
                onClick={onSaveToDatabase}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              >
                <span>Save to Database</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Banner */}
        {feedbackMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 animate-fadeIn">
            {feedbackMessage}
          </div>
        )}

        {/* Class Selection Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">
            Select Class:
          </span>
          {ORDERED_CLASSES.map((c) => {
            const isSelected = selectedClass === c;
            const subCount = (subjectsMap[c] || []).length;
            return (
              <button
                key={c}
                type="button"
                id={`subject-class-tab-${c}`}
                onClick={() => {
                  setSelectedClass(c);
                  setEditingSubjectIndex(null);
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <span>Class {c}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                    isSelected ? 'bg-purple-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {subCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Subject Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Editable List of Subjects for Selected Class */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Class {selectedClass} Subject Papers ({currentClassSubjects.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Drag / reorder, rename inline, or remove subjects for Class {selectedClass}.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                RBSE Format
              </span>
            </div>

            {/* Quick Add Subject Row */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Enter subject name (e.g. Information Technology)..."
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-900 focus:bg-white focus:border-purple-500 focus:outline-hidden transition"
              />
              <button
                type="button"
                onClick={() => handleAddSubject()}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-black text-white shadow-xs hover:bg-purple-500 active:scale-95 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add Subject</span>
              </button>
            </div>

            {/* Subjects List */}
            <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/50">
              {currentClassSubjects.map((sub, idx) => {
                const isEditing = editingSubjectIndex === idx;

                return (
                  <div
                    key={`${sub}-${idx}`}
                    className="flex items-center justify-between p-3.5 hover:bg-white transition rounded-xl"
                  >
                    {/* Number & Name */}
                    <div className="flex items-center gap-3 flex-1 mr-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 font-mono text-xs font-black text-slate-700">
                        {idx + 1}
                      </span>

                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editSubjectValue}
                            onChange={(e) => setEditSubjectValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditSubject(idx)}
                            autoFocus
                            className="w-full max-w-xs rounded-lg border border-purple-500 bg-white py-1 px-2.5 text-xs font-bold text-slate-900 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditSubject(idx)}
                            className="rounded-lg bg-purple-600 p-1.5 text-white hover:bg-purple-700"
                            title="Save"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSubjectIndex(null)}
                            className="rounded-lg bg-slate-200 p-1.5 text-slate-600 hover:bg-slate-300"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-900 text-sm">{sub}</span>
                      )}
                    </div>

                    {/* Actions & Ordering */}
                    <div className="flex items-center gap-1.5">
                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveSubject(idx, 'up')}
                        className={`rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition ${
                          idx === 0 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={idx === currentClassSubjects.length - 1}
                        onClick={() => handleMoveSubject(idx, 'down')}
                        className={`rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition ${
                          idx === currentClassSubjects.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>

                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(idx, sub)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs ml-1"
                        >
                          <Edit2 className="h-3 w-3 text-slate-500" />
                          <span>Rename</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeleteTargetSubject(sub)}
                        disabled={currentClassSubjects.length <= 1}
                        className={`rounded-lg p-1.5 text-xs font-bold transition ml-1 ${
                          currentClassSubjects.length <= 1
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-rose-600 hover:bg-rose-50'
                        }`}
                        title="Delete Subject"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Quick Preset Subject Suggestions */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Quick Preset Subjects
              </h3>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Click any suggestion to quickly add it to <b>Class {selectedClass}</b>:
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {COMMON_PRESET_SUBJECTS.map((p) => {
                const isAlreadyAdded = currentClassSubjects.some(
                  (s) => s.toLowerCase() === p.toLowerCase()
                );

                return (
                  <button
                    key={p}
                    type="button"
                    disabled={isAlreadyAdded}
                    onClick={() => handleAddSubject(p)}
                    className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
                      isAlreadyAdded
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                        : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 hover:border-purple-300 active:scale-95'
                    }`}
                  >
                    + {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* All Classes Overview Box */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Layers className="h-4 w-4 text-slate-700" />
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Curriculum at a Glance
              </h3>
            </div>

            <div className="mt-3 space-y-2.5">
              {ORDERED_CLASSES.map((c) => {
                const list = subjectsMap[c] || [];
                return (
                  <div
                    key={c}
                    onClick={() => setSelectedClass(c)}
                    className={`cursor-pointer rounded-xl p-2.5 text-xs transition border ${
                      selectedClass === c
                        ? 'bg-purple-50/50 border-purple-200'
                        : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>Class {c}</span>
                      <span className="text-[10px] font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        {list.length} Subjects
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 truncate">
                      {list.join(', ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTargetSubject}
        title={`Remove Subject from Class ${selectedClass}?`}
        message={`Are you sure you want to delete "${deleteTargetSubject}" from Class ${selectedClass} curriculum?`}
        confirmLabel="Delete Subject"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDeleteSubject}
        onCancel={() => setDeleteTargetSubject(null)}
      />
    </div>
  );
};
