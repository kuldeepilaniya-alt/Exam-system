import React, { useMemo, useState } from 'react';
import {
  Download,
  Edit2,
  ExternalLink,
  GraduationCap,
  Phone,
  Plus,
  Printer,
  Search,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { MarkRecord, Student } from '../types';
import { ORDERED_CLASSES } from '../data/mockDatabase';
import { ConfirmationModal } from './ConfirmationModal';

interface StudentsManagerProps {
  students: Student[];
  marks: MarkRecord[];
  onUpdateStudents: (students: Student[]) => void;
  onDeleteStudentMarks?: (examId: string, rollNo: string) => void;
  onViewStudentResult?: (rollNo: string, examId: string) => void;
  onSaveToDatabase?: () => void;
  activeExamId?: string;
}

export const StudentsManager: React.FC<StudentsManagerProps> = ({
  students,
  marks,
  onUpdateStudents,
  onViewStudentResult,
  onSaveToDatabase,
  activeExamId,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'roll' | 'name' | 'class'>('roll');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteTargetStudent, setDeleteTargetStudent] = useState<Student | null>(null);

  // Form states for Add / Edit
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('10A');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [gender, setGender] = useState('Male');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    // Suggest next roll number
    const classToUse = selectedClass !== 'ALL' ? selectedClass : '10A';
    const studentsInClass = students.filter((s) => s.className === classToUse);
    const maxRoll = studentsInClass.reduce((max, s) => {
      const num = parseInt(s.rollNo.replace(/\D/g, ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 100);

    setRollNo((maxRoll + 1).toString());
    setName('');
    setClassName(classToUse);
    setFatherName('');
    setMotherName('');
    setContactNumber('');
    setGender('Male');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setRollNo(student.rollNo);
    setName(student.name);
    setClassName(student.className);
    setFatherName(student.fatherName || '');
    setMotherName(student.motherName || '');
    setContactNumber(student.contactNumber || '');
    setGender(student.gender || 'Male');
  };

  const handleSaveAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo.trim() || !name.trim() || !className) return;

    // Check duplicate roll number in class
    if (
      students.some(
        (s) =>
          s.className === className &&
          s.rollNo.toString().trim() === rollNo.trim()
      )
    ) {
      alert(`Roll No #${rollNo.trim()} already exists in Class ${className}.`);
      return;
    }

    const newStudent: Student = {
      rollNo: rollNo.trim(),
      name: name.trim(),
      className: className,
      fatherName: fatherName.trim() || 'N/A',
      motherName: motherName.trim() || undefined,
      contactNumber: contactNumber.trim() || undefined,
      gender: gender || 'Male',
    };

    const updated = [...students, newStudent];
    onUpdateStudents(updated);
    setIsAddModalOpen(false);
    setFeedbackMessage(`✓ Student "${newStudent.name}" (Roll #${newStudent.rollNo}) registered.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!rollNo.trim() || !name.trim() || !className) return;

    // Check duplicate roll if changed
    if (
      (editingStudent.rollNo !== rollNo.trim() || editingStudent.className !== className) &&
      students.some(
        (s) =>
          !(s.rollNo === editingStudent.rollNo && s.className === editingStudent.className) &&
          s.className === className &&
          s.rollNo.toString().trim() === rollNo.trim()
      )
    ) {
      alert(`Roll No #${rollNo.trim()} is already used by another student in Class ${className}.`);
      return;
    }

    const updated = students.map((s) => {
      if (s.rollNo === editingStudent.rollNo && s.className === editingStudent.className) {
        return {
          ...s,
          rollNo: rollNo.trim(),
          name: name.trim(),
          className: className,
          fatherName: fatherName.trim() || 'N/A',
          motherName: motherName.trim() || undefined,
          contactNumber: contactNumber.trim() || undefined,
          gender: gender || 'Male',
        };
      }
      return s;
    });

    onUpdateStudents(updated);
    setEditingStudent(null);
    setFeedbackMessage(`✓ Updated student profile for "${name.trim()}".`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleConfirmDeleteStudent = () => {
    if (!deleteTargetStudent) return;
    const { rollNo: targetRoll, className: targetClass, name: targetName } = deleteTargetStudent;

    const updated = students.filter(
      (s) => !(s.rollNo.toString().trim() === targetRoll.toString().trim() && s.className === targetClass)
    );

    onUpdateStudents(updated);
    setDeleteTargetStudent(null);
    setFeedbackMessage(`✓ Removed student "${targetName}" (Roll #${targetRoll}) from Class ${targetClass}.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const matchesClass = selectedClass === 'ALL' || s.className === selectedClass;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          s.rollNo.toString().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          (s.fatherName && s.fatherName.toLowerCase().includes(q)) ||
          (s.motherName && s.motherName.toLowerCase().includes(q)) ||
          (s.contactNumber && s.contactNumber.includes(q)) ||
          s.className.toLowerCase().includes(q);

        return matchesClass && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'roll') {
          const numA = parseInt(a.rollNo.replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(b.rollNo.replace(/\D/g, ''), 10) || 0;
          if (numA !== numB) return numA - numB;
          return a.rollNo.localeCompare(b.rollNo);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'class') {
          return a.className.localeCompare(b.className);
        }
        return 0;
      });
  }, [students, selectedClass, searchQuery, sortBy]);

  // Export CSV of students
  const handleExportRosterCSV = () => {
    const headers = ['Roll No', 'Student Name', 'Class', 'Father Name', 'Mother Name', 'Contact Number', 'Gender'];
    const rows = filteredStudents.map((s) => [
      s.rollNo,
      `"${s.name}"`,
      `"${s.className}"`,
      `"${s.fatherName || ''}"`,
      `"${s.motherName || ''}"`,
      `"${s.contactNumber || ''}"`,
      `"${s.gender || 'Male'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Student_Roster_${selectedClass === 'ALL' ? 'All_Classes' : selectedClass}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
                  Student Roster Management
                </h2>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-black text-blue-800">
                  {students.length} Total Enrolled
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                Add, edit, reassign, search, and manage student admission roll records across all RBSE classes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportRosterCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              title="Download CSV Roster"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

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
              id="add-student-manager-btn"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-slate-800 active:scale-95 transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add New Student</span>
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
              All ({students.length})
            </button>
            {ORDERED_CLASSES.map((c) => {
              const count = students.filter((s) => s.className === c).length;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedClass(c)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    selectedClass === c
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  Class {c} ({count})
                </button>
              );
            })}
          </div>

          {/* Search & Sort */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roll, name, father..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-8 text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
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

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'roll' | 'name' | 'class')}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:bg-white focus:outline-hidden"
            >
              <option value="roll">Sort by Roll No</option>
              <option value="name">Sort by Name</option>
              <option value="class">Sort by Class</option>
            </select>
          </div>
        </div>
      </div>

      {/* Editable Student Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="py-3.5 px-4 text-center">#</th>
                <th className="py-3.5 px-4">Roll No</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-3">Class</th>
                <th className="py-3.5 px-4">Father&apos;s Name</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Mother&apos;s Name</th>
                <th className="py-3.5 px-4 hidden sm:table-cell">Contact Mobile</th>
                <th className="py-3.5 px-4 text-center">Marks Recorded</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium text-xs">
                    No students found matching your search.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const studentMarksCount = marks.filter(
                    (m) => m.rollNo.toString().trim() === s.rollNo.toString().trim()
                  ).length;

                  return (
                    <tr key={`${s.className}-${s.rollNo}`} className="hover:bg-slate-50/70 transition">
                      {/* Index */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Roll No */}
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        #{s.rollNo}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 whitespace-nowrap">{s.name}</div>
                        {s.gender && (
                          <span className="text-[10px] text-slate-400 font-medium">{s.gender}</span>
                        )}
                      </td>

                      {/* Class Badge */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-800">
                          Class {s.className}
                        </span>
                      </td>

                      {/* Father */}
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                        {s.fatherName || '-'}
                      </td>

                      {/* Mother */}
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-500 hidden md:table-cell whitespace-nowrap">
                        {s.motherName || '-'}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600 hidden sm:table-cell">
                        {s.contactNumber ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{s.contactNumber}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Marks Recorded */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                            studentMarksCount > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {studentMarksCount} tests
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {onViewStudentResult && (
                            <button
                              type="button"
                              onClick={() => onViewStudentResult(s.rollNo, activeExamId || '')}
                              title="View student result card"
                              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                            >
                              <ExternalLink className="h-3 w-3 text-blue-500" />
                              <span className="hidden lg:inline">Result</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(s)}
                            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
                          >
                            <Edit2 className="h-3 w-3 text-slate-500" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTargetStudent(s)}
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

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Add New Student
                  </h3>
                  <p className="text-xs text-slate-500">Register into school examination roll</p>
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

            <form onSubmit={handleSaveAddStudent} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Class *
                  </label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
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
                    placeholder="e.g. 119"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Full Student Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Father&apos;s Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Mother&apos;s Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sunita Devi"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Contact Mobile
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9829012345"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
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
                  Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Edit Student Profile
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingStudent.name} (Roll #{editingStudent.rollNo} • Class {editingStudent.className})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStudent} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Class *
                  </label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
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
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Full Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Father&apos;s Name
                  </label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Mother&apos;s Name
                  </label>
                  <input
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Contact Mobile
                  </label>
                  <input
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTargetStudent}
        title="Delete Student from Roster?"
        message={`Are you sure you want to permanently remove "${deleteTargetStudent?.name}" (Roll #${deleteTargetStudent?.rollNo} • Class ${deleteTargetStudent?.className})?`}
        confirmLabel="Delete Student"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDeleteStudent}
        onCancel={() => setDeleteTargetStudent(null)}
      />
    </div>
  );
};
