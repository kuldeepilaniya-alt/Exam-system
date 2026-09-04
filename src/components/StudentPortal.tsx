import React, { useMemo, useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Printer,
  Search,
  TrendingDown,
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

            {/* Quick Sample Roll Numbers */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-400 mr-1">Quick Select:</span>
              {[
                { roll: '801', label: '801 (Class 8)' },
                { roll: '802', label: '802 (Class 8)' },
                { roll: '1001', label: '1001 (Class 10)' },
                { roll: '1401', label: '1401 (12A Sci)' },
                { roll: '1501', label: '1501 (12B Agri)' },
                { roll: '1601', label: '1601 (12C Arts)' },
              ].map((item) => (
                <button
                  key={item.roll}
                  type="button"
                  onClick={() => handleSampleClick(item.roll)}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-700 transition cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
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
              <span>Print</span>
            </button>
          </div>

          {/* Official Printable Mark Sheet Card */}
          {currentResult && (
            
          <div
              id="official-marksheet-card"
              className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 print:border-none print:shadow-none print:p-0"
              >
            <div className="px-6 py-6 sm:px-10">
              {/* Header Badge */}
              <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-6 sm:px-10 text-center">
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase sm:text-2xl">
                  Govt. Sr. Sec. School, Sanwaloda Purohitan, Sikar
                </h2>

                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                  Affiliated to Board of Secondary Education, Rajasthan (RBSE)
                </p>
                <div className="mt-3 inline-block rounded-full bg-emerald-100 text-emerald-800 px-4 py-1 text-[11px] font-black uppercase tracking-wider">
                  STATEMENT OF MARKS — {currentResult.exam.examName.toUpperCase()} • SESSION 2026-27
                </div>   
                </div>            
              

              {/* Student Metadata Card */}
              <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 border-b border-slate-200 bg-white sm:grid-cols-4 sm:divide-y-0">
                <div className="p-4 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class &amp; Section</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {getDisplayClassName(currentResult.student.className)}
                  </div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll Number</div>
                  <div className="text-sm font-bold font-mono text-blue-600 mt-1">
                    #{currentResult.student.rollNo}
                  </div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</div>
                  <div className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1.5 mt-1">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    {currentResult.student.name}
                  </div>
                </div>
                <div className="p-4 text-center">
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
              <br></br>
                <div className="overflow-x-auto border border-slate-200">
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
                          Grand Total
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
                      <span className="font-serif italic text-xs text-slate-600"></span>
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

          {/* Term-by-Term Examination Performance & Progression */}
          {allExamResults.length > 0 && (
            <div id="term-by-term-progression" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm print:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      Term-by-Term Examination Performance &amp; Progression
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Compare marks, percentages, and class ranks across every examination term
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  <span>Evaluated Terms:</span>
                  <span className="font-bold text-slate-900 font-mono">{allExamResults.length}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {allExamResults.map((res, index) => {
                  const isCurrent = activeExam?.examId === res.exam.examId;
                  const prevRes = index > 0 ? allExamResults[index - 1] : null;
                  const pctDiff = prevRes ? Math.round((res.percentage - prevRes.percentage) * 10) / 10 : null;

                  return (
                    <div
                      key={res.exam.examId}
                      className={`flex flex-col justify-between rounded-2xl border p-5 transition ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-slate-900">{res.exam.examName}</span>
                          <span className="text-[10px] font-mono text-slate-400">{res.exam.date}</span>
                        </div>

                        <div className="my-3 space-y-2">
                          <div className="flex items-center">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-800">
                              <Award className="h-3 w-3 text-amber-500" />
                              Rank {res.rank}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black text-slate-900 font-mono">
                              {res.percentage}%
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              ({res.totalObtainedMarks}/{res.totalMaxMarks})
                            </span>
                          </div>                          
                        </div>

                        {/* Growth indicator */}
                        <div className="mb-3 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Term Standing:</span>
                          {pctDiff !== null ? (
                            pctDiff >= 0 ? (
                              <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                                <TrendingUp className="h-3 w-3" />
                                +{pctDiff}% vs prev
                              </span>
                            ) : (
                              <span className="font-bold text-rose-600 flex items-center gap-0.5">
                                <TrendingDown className="h-3 w-3" />
                                {pctDiff}% vs prev
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400 font-semibold">Baseline Exam</span>
                          )}
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                            style={{ width: `${Math.min(100, res.percentage)}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {res.status}
                        </span>
                        <button
                          type="button"
                          id={`term-btn-${res.exam.examId}`}
                          onClick={() => {
                            setSelectedExamId(res.exam.examId);
                            const el = document.getElementById('official-marksheet-card');
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className={`flex items-center gap-1 text-xs font-bold transition cursor-pointer ${
                            isCurrent ? 'text-blue-700 font-black' : 'text-blue-600 hover:text-blue-800'
                          }`}
                        >
                          <span>{isCurrent ? 'Active Marksheet' : 'View Marksheet'}</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
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
