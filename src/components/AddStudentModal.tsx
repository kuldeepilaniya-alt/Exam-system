import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { Student } from '../types';
import { ORDERED_CLASSES } from '../data/mockDatabase';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (student: Student) => void;
  defaultClass?: string;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
  defaultClass = '10A',
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [contact, setContact] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo.trim() || !name.trim()) return;

    const newStudent: Student = {
      rollNo: rollNo.trim(),
      name: name.trim(),
      fatherName: fatherName.trim() || 'N/A',
      className: selectedClass,
      contact: contact.trim() || undefined,
    };

    onAddStudent(newStudent);
    setRollNo('');
    setName('');
    setFatherName('');
    setContact('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs print:hidden">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Add New Student
              </h3>
              <p className="text-xs text-slate-500">Register a student into class roster</p>
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
              Class *
            </label>
            <select
              id="add-student-class-select"
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
              Roll Number *
            </label>
            <input
              type="text"
              required
              id="new-student-roll-input"
              placeholder="e.g. 109"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Full Student Name *
            </label>
            <input
              type="text"
              required
              id="new-student-name-input"
              placeholder="e.g. Meera Kapoor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Father&apos;s Name
            </label>
            <input
              type="text"
              id="new-student-father-input"
              placeholder="e.g. Anand Kapoor"
              value={fatherName}
              onChange={(e) => setFatherName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Contact Mobile Number
            </label>
            <input
              type="tel"
              id="new-student-contact-input"
              placeholder="e.g. 9870001009"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
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
              id="confirm-add-student-btn"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
            >
              Add Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
