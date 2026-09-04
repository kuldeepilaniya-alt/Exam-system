import React, { useMemo, useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Download,
  Edit2,
  ExternalLink,
  Plus,
  PlusCircle,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Exam, MarkRecord, Student } from '../types';
import { ORDERED_CLASSES } from '../data/mockDatabase';
import { ConfirmationModal } from './ConfirmationModal';

interface ExamsManagerProps {
  exams: Exam[];
  students: Student[];
  marks: MarkRecord[];
  subjectsMap: { [className: string]: string[] };
  onUpdateExams: (exams: Exam[]) => void;
  onDeleteExam?: (examId: string) => void;
  onSelectExamForGrading?: (examId: string, className: string) => void;
  onSaveToDatabase?: () => void;
}

export const ExamsManager: React.FC<ExamsManagerProps> = ({
  exams,
  students,
  marks,
  subjectsMap,
  onUpdateExams,
  onDeleteExam,
  onSelectExamForGrading,
  onSaveToDatabase,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deleteTargetExam, setDeleteTargetExam] = useState<Exam | null>(null);

  // Form states for Add / Edit
  const [examName, setExamName] = useState('');
  const [className, setClassName] = useState('10A');
  const [maxMarks, setMaxMarks] = useState<number>(20);
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    const defaultCls = selectedClass !== 'ALL' ? selectedClass : '10A';
    setExamName('');
    setClassName(defaultCls);
    setMaxMarks(20);
    setExamDate(new Date().toISOString().split('T')[0]);
    setAcademicYear('2026-27');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setExamName(exam.examName);
    setClassName(exam.className);
    setMaxMarks(exam.maxMarksPerSubject);
    setExamDate(exam.date);
    setAcademicYear(exam.academicYear || '2026-27');
  };

  const handleSaveAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim() || !className) return;

    const cleanName = examName.trim();
    const cleanId = `${className}-${cleanName.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const newExam: Exam = {
      examId: cleanId,
      examName: cleanName,
      className: className,
      maxMarksPerSubject: Number(maxMarks) || 20,
      date: examDate,
      academicYear: academicYear || '2026-27',
    };

    const updated = [...exams, newExam];
    onUpdateExams(updated);
    setIsAddModalOpen(false);
    setFeedbackMessage(`✓ Created exam "${newExam.examName}" for Class ${newExam.className}.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleSaveEditExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;
    if (!examName.trim() || !className) return;

    const updated = exams.map((ex) => {
      if (ex.examId === editingExam.examId) {
        return {
          ...ex,
          examName: examName.trim(),
          className: className,
          maxMarksPerSubject: Number(maxMarks) || 20,
          date: examDate,
          academicYear: academicYear || '2026-27',
        };
      }
      return ex;
    });

    onUpdateExams(updated);
    setEditingExam(null);
    setFeedbackMessage(`✓ Updated details for "${examName.trim()}".`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleConfirmDeleteExam = () => {
    if (!deleteTargetExam) return;
    const targetId = deleteTargetExam.examId;
    const targetName = deleteTargetExam.examName;

    if (onDeleteExam) {
      onDeleteExam(targetId);
    } else {
      const updated = exams.filter((e) => e.examId !== targetId);
      onUpdateExams(updated);
    }

    setDeleteTargetExam(null);
    setFeedbackMessage(`✓ Deleted exam "${targetName}" and associated marks.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const filteredExams = useMemo(() => {
    return exams.filter((ex) => {
      const matchesClass = selectedClass === 'ALL' || ex.className === selectedClass;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        ex.examName.toLowerCase().includes(q) ||
        ex.examId.toLowerCase().includes(q) ||
        ex.date.includes(q) ||
        ex.className.toLowerCase().includes(q);

      return matchesClass && matchesQuery;
    });
  }, [exams, selectedClass, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
                  Examination Scheme Management
                </h2>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-800">
                  {exams.length} Total Exams
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                Manage Rank Tests (RT1-4 • 20 Marks), Pre Boards (PB1-4 • 80 Marks), and custom scheduled evaluations.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onSaveToDatabase && (
              <button
                type="button"
                onClick={onSaveToDatabase}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              >
                <span>Save to Database</span>
              </button>
            )}

            <button
              type="button"
              id="add-exam-manager-btn"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-slate-800 active:scale-95 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Exam</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 animate-fadeIn">
            {feedbackMessage}
          </div>
        )}

        {/* Class Filter Bar & Search */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-5">
          {/* Class Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">
              Class:
            </span>
            <button
              type="button"
              onClick={() => setSelectedClass('ALL')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                selectedClass === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              All Classes ({exams.length})
            </button>
            {ORDERED_CLASSES.map((c) => {
              const count = exams.filter((e) => e.className === c).length;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedClass(c)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    selectedClass === c
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  Class {c} ({count})
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exam name, date..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-8 text-xs font-medium text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-hidden transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editable Exams Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="py-3.5 px-4 text-center">#</th>
                <th className="py-3.5 px-4">Class</th>
                <th className="py-3.5 px-5">Exam Name &amp; ID</th>
                <th className="py-3.5 px-4 text-center">Max Marks / Sub</th>
                <th className="py-3.5 px-4 text-center">Total Test Max</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-center">Marks Entered</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium text-xs">
                    No examination records found.
                  </td>
                </tr>
              ) : (
                filteredExams.map((ex, idx) => {
                  const classStudentCount = students.filter((s) => s.className === ex.className).length;
                  const enteredMarksCount = marks.filter((m) => m.examId === ex.examId).length;
                  const classSubjects = subjectsMap[ex.className] || [
                    'Hindi',
                    'English',
                    'Science',
                    'Maths',
                    'Social Science',
                    'Sanskrit',
                  ];
                  const totalAggregateMax = classSubjects.length * ex.maxMarksPerSubject;

                  return (
                    <tr key={ex.examId} className="hover:bg-slate-50/70 transition">
                      {/* Index */}
                      <td className="py-4 px-4 text-center font-mono text-xs text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Class */}
                      <td className="py-4 px-4">
                        <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-800">
                          Class {ex.className}
                        </span>
                      </td>

                      {/* Exam Name & ID */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900">{ex.examName}</div>
                        <span className="font-mono text-[11px] text-slate-400">{ex.examId}</span>
                      </td>

                      {/* Max Marks / Sub */}
                      <td className="py-4 px-4 text-center font-mono font-bold text-slate-800">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${
                            ex.maxMarksPerSubject === 20
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : ex.maxMarksPerSubject === 80
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ex.maxMarksPerSubject} marks
                        </span>
                      </td>

                      {/* Total Test Max */}
                      <td className="py-4 px-4 text-center font-mono text-xs text-slate-500 font-semibold">
                        {totalAggregateMax} pts ({classSubjects.length} subs)
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 font-mono text-xs text-slate-600">
                        {ex.date}
                      </td>

                      {/* Marks Entered Progress */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-bold ${
                            enteredMarksCount >= classStudentCount && classStudentCount > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : enteredMarksCount > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {enteredMarksCount} / {classStudentCount} students
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {onSelectExamForGrading && (
                            <button
                              type="button"
                              onClick={() => onSelectExamForGrading(ex.examId, ex.className)}
                              title="Enter marks or view merit list for this exam"
                              className="flex items-center gap-1 rounded-xl bg-slate-900 text-white px-2.5 py-1 text-xs font-bold shadow-2xs hover:bg-slate-800 transition"
                            >
                              <Award className="h-3 w-3 text-amber-400" />
                              <span>Open Exam</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(ex)}
                            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
                          >
                            <Edit2 className="h-3 w-3 text-slate-500" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTargetExam(ex)}
                            className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Exam Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Schedule New Examination
                  </h3>
                  <p className="text-xs text-slate-500">Session 2026-27</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddExam} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Class *
                  </label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-hidden transition"
                  >
                    {ORDERED_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Max Marks / Subject *
                  </label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={200}
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-hidden transition font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Examination Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rank Test 5 / Mid Term Examination"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-hidden transition font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-hidden transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-hidden transition font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  Create Examination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {editingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Edit Examination Details
                  </h3>
                  <p className="text-xs text-slate-500">{editingExam.examId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingExam(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditExam} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Class *
                  </label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-hidden transition"
                  >
                    {ORDERED_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Max Marks / Subject *
                  </label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={200}
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-hidden transition font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Examination Name *
                </label>
                <input
                  type="text"
                  required
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-hidden transition font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-hidden transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-hidden transition font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  Save Exam Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTargetExam}
        title="Delete Examination Scheme?"
        message={`Are you sure you want to permanently delete "${deleteTargetExam?.examName}" (Class ${deleteTargetExam?.className})? All recorded student marks for this exam will also be removed.`}
        confirmLabel="Delete Exam"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDeleteExam}
        onCancel={() => setDeleteTargetExam(null)}
      />
    </div>
  );
};
