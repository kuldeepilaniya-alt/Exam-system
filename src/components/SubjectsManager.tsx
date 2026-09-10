import React, { useState, useMemo } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  CheckCircle2,
  Edit2,
  Plus,
  RotateCcw,
  Sparkles,
  Table,
  Trash2,
  X,
} from 'lucide-react';
import {
  normalizeClassName,
  normalizeSubjectsMap,
  DEFAULT_SUBJECT_CONFIGS,
} from '../data/mockDatabase';
import { ConfirmationModal } from './ConfirmationModal';

interface SubjectsManagerProps {
  subjectsMap: { [className: string]: string[] };
  onSaveSubjects: (className: string, subjects: string[]) => void;
  onSaveToDatabase?: () => void;
  hasUnsavedChanges?: boolean;
  isSyncing?: boolean;
  lastUpdatedTime?: string | null;
}

const CANONICAL_CLASSES = ['5A', '8A', '10A', '12A', '12B', '12C'] as const;

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
  hasUnsavedChanges = false,
  isSyncing = false,
  lastUpdatedTime = null,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('10A');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubjectIndex, setEditingSubjectIndex] = useState<number | null>(null);
  const [editSubjectValue, setEditSubjectValue] = useState('');
  const [deleteTargetSubject, setDeleteTargetSubject] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Normalized map: guaranteed single records for 10A, 8A, 12A, 12B, 12C
  const cleanSubjectsMap = useMemo(() => normalizeSubjectsMap(subjectsMap), [subjectsMap]);

  // Check if raw subjectsMap currently contains redundant rows: Class 10, Class 8, Class 12A, Class 12B, Class 12C, Class 5
  const hasDuplicateRows = useMemo(() => {
    return Object.keys(subjectsMap).some((k) => {
      const lower = k.trim().toLowerCase();
      return (
        lower === 'class 5' ||
        lower === 'class 5a' ||
        lower === 'class5' ||
        lower === 'class5a' ||
        lower === 'class 10' ||
        lower === 'class 8' ||
        lower === 'class 12a' ||
        lower === 'class 12b' ||
        lower === 'class 12c' ||
        lower === 'class10' ||
        lower === 'class8' ||
        lower === 'class12a' ||
        lower === 'class12b' ||
        lower === 'class12c'
      );
    });
  }, [subjectsMap]);

  // List of active classes to display (strictly single records, starting with canonical 10A, 8A, 12A, 12B, 12C)
  const displayClasses = useMemo(() => {
    const extra = Object.keys(cleanSubjectsMap).filter(
      (c) => !(CANONICAL_CLASSES as readonly string[]).includes(c)
    );
    return [...CANONICAL_CLASSES, ...extra];
  }, [cleanSubjectsMap]);

  const currentClassSubjects =
    cleanSubjectsMap[selectedClass] ||
    DEFAULT_SUBJECT_CONFIGS.find((c) => c.className === selectedClass)?.subjects || [
      'Hindi',
      'English',
      'Science',
      'Maths',
      'Social Science',
      'Sanskrit',
    ];

  const handleConsolidateDuplicates = () => {
    const consolidated = normalizeSubjectsMap(subjectsMap);
    Object.entries(consolidated).forEach(([cls, list]) => {
      onSaveSubjects(cls, list);
    });
    setFeedbackMessage(
      '✓ Consolidated duplicate class records! Maintained single canonical records for 10A, 8A, 12A, 12B, and 12C; removed duplicate rows (Class 10, Class 8, Class 12A, Class 12B, Class 12C).'
    );
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

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
                  Subject Area
                </h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Single Records ({displayClasses.length} Classes)
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                Official single-record class curriculum mapping. Duplicate entries (Class 10, Class 8, Class 12A, Class 12B, Class 12C) have been consolidated.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {hasDuplicateRows && (
              <button
                type="button"
                onClick={handleConsolidateDuplicates}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Consolidate to Single Records</span>
              </button>
            )}
            {onSaveToDatabase && (
              <button
                type="button"
                id="sync-subjects-database-btn"
                onClick={onSaveToDatabase}
                disabled={isSyncing}
                title={hasUnsavedChanges ? 'Changes detected in subjects. Click to save to Google Sheet database.' : (lastUpdatedTime ? `Subjects up to date. Last saved at ${lastUpdatedTime}` : 'Save subjects to database')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer ${
                  hasUnsavedChanges
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-200 animate-pulse'
                    : 'border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 shadow-2xs'
                }`}
              >
                {hasUnsavedChanges ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span>{isSyncing ? 'Saving Subjects...' : 'Save to Database (Update Needed)'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{isSyncing ? 'Saving...' : lastUpdatedTime ? `Saved (${lastUpdatedTime})` : 'Save to Database'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Feedback Banner */}
        {feedbackMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 animate-fadeIn flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Notice if duplicates were found */}
        {hasDuplicateRows && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <span className="font-bold">Duplicate Rows Detected:</span>
              <span>Redundant alias rows ("Class 10", "Class 8", "Class 12A", "Class 12B", "Class 12C") are present. Click below to clean them instantly.</span>
            </div>
            <button
              type="button"
              onClick={handleConsolidateDuplicates}
              className="rounded-lg bg-amber-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-amber-700 transition shrink-0 ml-3"
            >
              Clean Duplicates Now
            </button>
          </div>
        )}
      </div>

      {/* Primary Subject Area Master Table (Single Records per Class) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Table className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Subject Area Curriculum Table
              </h3>
              <p className="text-xs text-slate-500">
                Consolidated single records without duplicates. Click any row to view and configure its subjects.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {displayClasses.length} Unique Classes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4 rounded-l-xl">Class</th>
                <th className="py-3 px-4 text-center">Subject Count</th>
                <th className="py-3 px-4">Subjects</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayClasses.map((cls) => {
                const list = cleanSubjectsMap[cls] || [];
                const isSelected = selectedClass === cls;

                return (
                  <tr
                    key={cls}
                    onClick={() => {
                      setSelectedClass(cls);
                      setEditingSubjectIndex(null);
                    }}
                    className={`cursor-pointer transition hover:bg-purple-50/40 ${
                      isSelected ? 'bg-purple-50/80 font-medium' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      <span>{cls.toLowerCase().startsWith('class') ? cls : `Class ${cls}`}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block rounded-full bg-purple-100 px-3 py-1 font-mono text-xs font-black text-purple-800">
                        {list.length}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex flex-wrap gap-1.5 max-w-2xl">
                        {list.map((sub) => (
                          <span
                            key={sub}
                            className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800 border border-slate-200/60"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClass(cls);
                          setEditingSubjectIndex(null);
                        }}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Editing' : 'Edit Subjects'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Class Selection Tabs for quick navigation */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">
          Active Class Editor:
        </span>
        {displayClasses.map((c) => {
          const isSelected = selectedClass === c;
          const subCount = (cleanSubjectsMap[c] || []).length;
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
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>Class {c}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                  isSelected ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {subCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Subject Editor Grid for Selected Class */}
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
                  Reorder, rename inline, or remove subjects for Class {selectedClass}.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                RBSE Standard
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
