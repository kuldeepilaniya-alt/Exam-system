import React, { useState } from 'react';
import { CalendarPlus, X } from 'lucide-react';
import { Exam } from '../types';
import { ORDERED_CLASSES } from '../data/mockDatabase';

interface AddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExam: (exam: Exam) => void;
  defaultClass?: string;
}

export const AddExamModal: React.FC<AddExamModalProps> = ({
  isOpen,
  onClose,
  onAddExam,
  defaultClass = '10A',
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [examName, setExamName] = useState('');
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [examDate, setExamDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim()) return;

    const cleanName = examName.trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15);
    const examId = `2026-${selectedClass.toLowerCase()}-${slug}-${Date.now().toString().slice(-4)}`;

    const newExam: Exam = {
      examId,
      examName: cleanName,
      className: selectedClass,
      maxMarksPerSubject: Number(maxMarks) || 100,
      academicYear: '2026-27',
      date: examDate,
    };

    onAddExam(newExam);
    setExamName('');
    setMaxMarks(100);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs print:hidden">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Create New Examination
              </h3>
              <p className="text-xs text-slate-500">Session 2026-27 Examination Cell</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Target Class *
            </label>
            <select
              id="add-exam-class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-bold text-slate-800 shadow-xs focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
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
              Examination Name *
            </label>
            <input
              type="text"
              required
              id="new-exam-name-input"
              placeholder="e.g. Second Periodic Test, Pre-Board..."
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Max Marks per Subject
            </label>
            <input
              type="number"
              required
              min={10}
              max={200}
              id="new-exam-maxmarks-input"
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Exam Date
            </label>
            <input
              type="date"
              required
              id="new-exam-date-input"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-add-exam-btn"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
            >
              Create Exam
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
