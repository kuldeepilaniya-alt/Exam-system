import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  GraduationCap,
  Printer,
  Search,
  Sparkles,
  TrendingUp,
  User,
  XCircle,
} from 'lucide-react';
import { Exam, MarkRecord, Student } from '../types';
import { getStudentExamResult } from '../utils/rankCalculations';
import { getDisplayClassName, normalizeClassName } from '../data/mockDatabase';

interface StudentPortalProps {
  students: Student[];
  exams: Exam[];
  marks: MarkRecord[];
  subjectsMap: { [className: string]: string[] };
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  students,
  exams,
  marks,
  subjectsMap,
}) => {
  const [rollNumberInput, setRollNumberInput] = useState<string>('801');
  const [searchedRoll, setSearchedRoll] = useState<string>('801');
  const [selectedExamId, setSelectedExamId] = useState<string>('8A-RT1');

  // Find student by entered roll number
  const student = useMemo(() => {
    const clean = searchedRoll.trim().toLowerCase();
    return students.find((s) => s.rollNo.trim().toLowerCase() === clean);
  }, [searchedRoll, students]);

  // Find all exams applicable for this student's class
  const applicableExams = useMemo(() => {
    if (!student) return [];
    return exams.filter(
      (e) => normalizeClassName(e.className) === normalizeClassName(student.className)
    );
  }, [student, exams]);

  // Ensure selectedExamId matches applicable exams
  const activeExam = useMemo(() => {
    if (applicableExams.length === 0) return null;
    const found = applicableExams.find((e) => e.examId === selectedExamId);
    return found || applicableExams[0];
  }, [applicableExams, selectedExamId]);

  // Compute result for selected exam
  const currentResult = useMemo(() => {
    if (!student || !activeExam) return null;
    return getStudentExamResult(
      student.rollNo,
      activeExam.examId,
      students,
      exams,
      marks,
      subjectsMap
    );
  }, [student, activeExam, students, exams, marks, subjectsMap]);

  // Compute all exam results for this student (for multi-exam performance progression)
  const allExamResults = useMemo(() => {
    if (!student || applicableExams.length === 0) return [];
    return applicableExams
      .map((exam) =>
        getStudentExamResult(
          student.rollNo,
          exam.examId,
          students,
          exams,
          marks,
          subjectsMap
        )
      )
      .filter((res): res is NonNullable<typeof res> => res !== null);
  }, [student, applicableExams, students, exams, marks, subjectsMap]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rollNumberInput.trim()) {
      setSearchedRoll(rollNumberInput.trim());
    }
  };

  const handleSampleClick = (roll: string) => {
    setRollNumberInput(roll);
    setSearchedRoll(roll);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Search Header & Input Box */}
      <section className="print:hidden">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">
              Scorecard Access
            </span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Student Result Portal
            </h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Enter Student Roll Number to view subject-wise marks, percentage, and Class rank.
            </p>

            {/* Search Input Form */}
            <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  id="student-roll-input"
                  value={rollNumberInput}
                  onChange={(e) => setRollNumberInput(e.target.value)}
                  placeholder="Enter Roll Number (e.g. 801, 802, 803)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-hidden transition-all"
                />
              </div>
              <button
                type="submit"
                id="search-result-btn"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all text-sm"
              >
                <span>View Result</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Result Display Section */}
      {!student ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <XCircle className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
            No Student Found for Roll No &quot;{searchedRoll}&quot;
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Please verify the roll number entered. You can try sample roll numbers like 801, 802 (Class 8), 1001, 1002 (Class 10), 1401 (Class 12A), 1501 (Class 12B), or 1601 (Class 12C).
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Examination Selector Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Examination Term:
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {applicableExams.map((exam) => {
                const isSelected = activeExam?.examId === exam.examId;
                return (
                  <button
                    key={exam.examId}
                    type="button"
                    id={`exam-tab-${exam.examId}`}
                    onClick={() => setSelectedExamId(exam.examId)}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Calendar className="h-3 w-3" />
                    <span>{exam.examName}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              id="print-marksheet-btn"
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save to PDF</span>
            </button>
          </div>

          {/* Official Printable Mark Sheet Card */}
          {currentResult && (
            <div
              id="official-marksheet-card"
              className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 print:border-none print:shadow-none print:p-0"
            >
              {/* Header Badge */}
              <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-6 sm:px-10 text-center">
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase sm:text-2xl">
                  Govt. Sr. Sec. School, Sanwaloda Purohitan, Sikar
                </h2>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                  Affiliated to Board of Secondary Education, Rajasthan (RBSE) • Sanwaloda Purohitan, Sikar (Raj.)
                </p>
                <div className="mt-3 inline-block rounded-full bg-emerald-100 text-emerald-800 px-4 py-1 text-[11px] font-black uppercase tracking-wider">
                  STATEMENT OF MARKS — {currentResult.exam.examName.toUpperCase()}
                </div>
              </div>

              {/* Student Metadata Card */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 bg-white px-6 py-5 sm:grid-cols-4 sm:px-10 text-center">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class &amp; Section</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {getDisplayClassName(currentResult.student.className)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll Number</div>
                  <div className="text-sm font-bold font-mono text-blue-600 mt-1">
                    #{currentResult.student.rollNo}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</div>
                  <div className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1.5 mt-1">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    {currentResult.student.name}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Father&apos;s Name</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {currentResult.student.fatherName || 'N/A'}
                  </div>
                  {currentResult.student.motherName && (
                    <div className="text-[11px] text-slate-500 font-medium">
                      Mother: {currentResult.student.motherName}
                    </div>
                  )}
                </div>
              </div>

              {/* Key Score Highlights Banner */}
              <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50/50 sm:grid-cols-4">
                <div className="p-4 text-center">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Marks</div>
                  <div className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl font-mono">
                    {currentResult.totalObtainedMarks} <span className="text-xs font-normal text-slate-400">/ {currentResult.totalMaxMarks}</span>
                  </div>
                </div>

                <div className="p-4 text-center">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Percentage</div>
                  <div className="mt-1 text-2xl font-extrabold text-emerald-600 sm:text-3xl font-mono">
                    {currentResult.percentage}%
                  </div>
                </div>

                <div className="p-4 text-center">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class Rank</div>
                  <div className="mt-1 flex items-center justify-center gap-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                    {currentResult.rank}
                    <span className="text-xs font-normal text-slate-400">/ {currentResult.totalStudentsInClass}</span>
                  </div>
                </div>

                <div className="p-4 text-center">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Result Status</div>
                  <div className="mt-1.5 flex items-center justify-center">
                    {currentResult.status === 'PASSED' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black text-emerald-800 uppercase tracking-tight">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        PASSED ({currentResult.overallGrade})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3.5 py-1 text-xs font-black text-rose-800 uppercase tracking-tight">
                        <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        {currentResult.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="px-6 py-6 sm:px-10">
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Subject Name</th>
                        <th className="py-3 px-4 text-center">Max Marks</th>
                        <th className="py-3 px-4 text-center">Marks Obtained</th>
                        <th className="py-3 px-4 text-center">Percentage</th>
                        <th className="py-3 px-4 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentResult.subjects.map((sub, idx) => (
                        <tr key={sub.name} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{sub.name}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                            {sub.maxMarks}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-900">
                            {sub.obtainedMarks}
                          </td>
                          <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-600">
                            {sub.percentage}%
                          </td>
                          
                          <td className="py-3.5 px-4 text-right">
                            {sub.isPassing ? (
                              <span className="text-xs font-bold text-emerald-600 uppercase tracking-tight">Pass</span>
                            ) : (
                              <span className="text-xs font-bold text-rose-600 uppercase tracking-tight">Fail</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-900 bg-slate-50/80 font-bold text-slate-900">
                        <td colSpan={2} className="py-3.5 px-4 font-extrabold uppercase text-xs tracking-wider">
                          Grand Total &amp; Aggregate
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          {currentResult.totalMaxMarks}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-extrabold text-blue-600">
                          {currentResult.totalObtainedMarks}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          {currentResult.percentage}%
                        </td>
                        
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                          {currentResult.status}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Teacher Remarks & Signatures Footer */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Academic Evaluation Remarks
                  </div>
                  <p className="mt-1 text-sm font-medium italic text-slate-700">
                    &quot;{currentResult.remarks}&quot;
                  </p>
                </div>

                {/* Formal Signature Blocks */}
                <div className="mt-8 grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-center">
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                      <span className="font-serif italic text-xs text-slate-600">_____</span>
                    </div>
                    <div className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Class Teacher</div>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                      <span className="font-serif italic text-xs text-slate-600">Kapil Dev Sir</span>
                    </div>
                    <div className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Controller of Exams</div>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                      <span className="font-serif italic text-xs text-blue-600 font-bold">Narendra Singh Chauhan</span>
                    </div>
                    <div className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Principal</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multi-Examination Comparison Bar (Progress Overview) */}
          {allExamResults.length > 1 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm print:hidden">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Examination Progression &amp; Term Comparison
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Performance history of {student.name} across all terms of this academic year:
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {allExamResults.map((res) => {
                  const isCurrent = res.exam.examId === activeExam?.examId;
                  return (
                    <button
                      key={res.exam.examId}
                      type="button"
                      onClick={() => {
                        setSelectedExamId(res.exam.examId);
                        const el = document.getElementById('official-marksheet-card');
                        if (el) {
                          const y = el.getBoundingClientRect().top + window.scrollY - 80;
                          window.scrollTo({ top: y, behavior: 'smooth' });
                        }
                      }}
                      className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {res.exam.examName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{res.exam.date}</span>
                      </div>

                      <div className="my-3 flex items-baseline justify-between">
                        <span className="text-2xl font-extrabold text-slate-900 font-mono">
                          {res.percentage}%
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-slate-700">
                          <Award className="h-3.5 w-3.5 text-amber-500" />
                          Rank {res.rank}
                        </span>
                      </div>

                      {/* Mini progress bar */}
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                          style={{ width: `${Math.min(100, res.percentage)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
