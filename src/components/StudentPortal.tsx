import React, { useMemo, useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Printer,
  Search,
  Share2,
  TrendingDown,
  TrendingUp,
  User,
  XCircle,
} from 'lucide-react';
import { Exam, MarkRecord, Student } from '../types';
import { calculateGrade, getStudentExamResult } from '../utils/rankCalculations';
import { getDisplayClassName, normalizeClassName, SCHOOL_INFO } from '../data/mockDatabase';
import { downloadStudentMarksheetPDF } from '../utils/pdfGenerator';
import {
  shareStudentMarksheetOnWhatsApp,
  shareStudentMarksheetPDFOnWhatsApp,
} from '../utils/whatsappShare';

interface StudentPortalProps {
  students: Student[];
  exams: Exam[];
  marks: MarkRecord[];
  subjectsMap: { [className: string]: string[] };
  initialRollNo?: string | null;
  initialExamId?: string | null;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  students,
  exams,
  marks,
  subjectsMap,
  initialRollNo,
  initialExamId,
}) => {
  const [rollNumberInput, setRollNumberInput] = useState<string>(initialRollNo || '');
  const [searchedRoll, setSearchedRoll] = useState<string>(initialRollNo || '');
  const [hasSearched, setHasSearched] = useState<boolean>(Boolean(initialRollNo));
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || '');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isSharingPdfWhatsApp, setIsSharingPdfWhatsApp] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Update when initialRollNo or initialExamId changes from parent
  React.useEffect(() => {
    if (initialRollNo) {
      setRollNumberInput(initialRollNo);
      setSearchedRoll(initialRollNo);
      setHasSearched(true);
      if (initialExamId) {
        setSelectedExamId(initialExamId);
      }
    }
  }, [initialRollNo, initialExamId]);

  // Find student by entered roll number
  const student = useMemo(() => {
    if (!hasSearched || !searchedRoll.trim()) return null;
    const clean = searchedRoll.trim().toLowerCase();
    return students.find((s) => s.rollNo.trim().toLowerCase() === clean);
  }, [hasSearched, searchedRoll, students]);

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
      setHasSearched(true);
    }
  };

  const handleSampleClick = (roll: string) => {
    setRollNumberInput(roll);
    setSearchedRoll(roll);
    setHasSearched(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!currentResult) return;
    setIsGeneratingPdf(true);
    try {
      await downloadStudentMarksheetPDF(currentResult, allExamResults);
      setToastMessage('✓ PDF Marksheet downloaded successfully!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Unable to generate PDF directly. Please use the Print button to Save as PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSharePDFOnWhatsApp = async () => {
    if (!currentResult) return;
    setIsSharingPdfWhatsApp(true);
    try {
      const { method } = await shareStudentMarksheetPDFOnWhatsApp(
        currentResult,
        allExamResults,
        student?.contactNumber
      );
      if (method === 'download-and-web') {
        setToastMessage(
          '✓ PDF Marksheet downloaded! You can attach the PDF and send the scorecard in WhatsApp.'
        );
      } else {
        setToastMessage('✓ Shared official marksheet PDF to WhatsApp!');
      }
      setTimeout(() => setToastMessage(null), 6000);
    } catch (err) {
      console.error('WhatsApp PDF share error:', err);
      shareStudentMarksheetOnWhatsApp(currentResult, student?.contactNumber);
    } finally {
      setIsSharingPdfWhatsApp(false);
    }
  };

  // Extract distinct subject names for subject-wise progression
  const allSubjectNames = useMemo(() => {
    return Array.from(new Set(allExamResults.flatMap((r) => r.subjects.map((s) => s.name))));
  }, [allExamResults]);

  const evaluatedCount = useMemo(() => {
    return allExamResults.filter((r) => !r.isUpcoming).length;
  }, [allExamResults]);

  const studentClassDisplay = student ? getDisplayClassName(student.className) : '';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Toast feedback banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-fade-in rounded-2xl border border-emerald-300 bg-emerald-900 text-white px-5 py-3.5 shadow-2xl flex items-center gap-3 text-sm font-semibold">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
              Enter Student Roll Number and click <strong>View Result</strong> to view official subject marksheet, percentages, and Class rank.
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
                  placeholder="Enter Roll Number (e.g. 801, 802, 1001, 1401)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-hidden transition-all"
                />
              </div>
              <button
                type="submit"
                id="search-result-btn"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all text-sm cursor-pointer"
              >
                <span>View Result</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick Sample Roll Numbers */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-400 mr-1">Sample Roll Nos:</span>
              {[
                { roll: '801', label: '801 (Class 8)' },
                { roll: '802', label: '802 (Class 8)' },
                { roll: '1001', label: '1001 (Class 10)' },
                { roll: '1401', label: '1401 (12A Sci)' },
                { roll: '1402', label: '1402 (12A Sci)' },
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

      {/* Conditional Display Area */}
      {!hasSearched ? (
        /* Initial State Before Search - Marksheet & Performance Area Hidden */
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-xs p-10 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-2xs">
            <Search className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-extrabold text-slate-900">
            Awaiting Roll Number Search
          </h3>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Please enter the student&apos;s Roll Number in the search box above and click <strong className="text-emerald-700 font-semibold">&quot;View Result&quot;</strong> to generate and view the verified statement of marks, subject analytics, and merit rankings.
          </p>
        </div>
      ) : !student ? (
        /* Search Performed But Student Not Found */
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <XCircle className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            No Student Found for Roll No &quot;{searchedRoll}&quot;
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Please verify the roll number entered. You can click on any sample roll number above like 801, 802 (Class 8), 1001 (Class 10), or 1401 (Class 12A).
          </p>
        </div>
      ) : (
        /* Search Performed And Student Found: Show Full Marksheet and Performance Area */
        <div className="mt-8 space-y-6">
          {/* Examination Selector & Action Bar */}
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

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="download-marksheet-pdf-btn"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf || !currentResult}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 text-xs font-bold shadow-xs active:scale-95 transition disabled:opacity-60 cursor-pointer"
                title="Download 2-Page Official Marksheet & Progression PDF"
              >
                <Download className={`h-3.5 w-3.5 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
                <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
              </button>

              <button
                type="button"
                id="share-student-portal-whatsapp-btn"
                onClick={handleSharePDFOnWhatsApp}
                disabled={isSharingPdfWhatsApp || !currentResult}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold shadow-xs active:scale-95 transition disabled:opacity-60 cursor-pointer"
                title="Share Marksheet PDF on WhatsApp"
              >
                <Share2 className={`h-3.5 w-3.5 ${isSharingPdfWhatsApp ? 'animate-spin' : ''}`} />
                <span>{isSharingPdfWhatsApp ? 'Preparing PDF...' : 'Share PDF on WhatsApp'}</span>
              </button>

              <button
                type="button"
                id="print-marksheet-btn"
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
                title="Print Official Marksheet"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Official Printable Mark Sheet Card (Page 1) */}
          {currentResult && (
            <div
              id="official-marksheet-card"
              className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 print:border-slate-300 print:shadow-none print:p-0 print:break-after-page"
            >
              <div className="px-6 py-6 sm:px-10">
                {/* Header Badge */}
                <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-6 sm:px-10 text-center">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase sm:text-2xl">
                    {SCHOOL_INFO.name}
                  </h2>

                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                    Affiliated to Board of Secondary Education, Rajasthan (RBSE)
                  </p>
                  <div
                    className={`mt-3 inline-block rounded-full px-4 py-1 text-[11px] font-black uppercase tracking-wider ${
                      currentResult.isUpcoming
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {currentResult.isUpcoming
                      ? `UPCOMING — ${currentResult.exam.examName.toUpperCase()} • SESSION 2026-27`
                      : `STATEMENT OF MARKS — ${currentResult.exam.examName.toUpperCase()} • SESSION 2026-27`}
                  </div>
                </div>

                {/* Student Metadata Card (4 Columns) */}
                <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 border-b border-slate-200 bg-white sm:grid-cols-4 sm:divide-y-0">
                  <div className="p-4 text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Class &amp; Section
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      {getDisplayClassName(currentResult.student.className)}
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Roll Number
                    </div>
                    <div className="text-sm font-bold font-mono text-blue-600 mt-1">
                      #{currentResult.student.rollNo}
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Student Name
                    </div>
                    <div className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1.5 mt-1">
                      <User className="h-3.5 w-3.5 text-blue-600" />
                      {currentResult.student.name}
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Father&apos;s Name
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      {currentResult.student.fatherName || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Key Score Highlights Banner (4 Columns) */}
                <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50/50 sm:grid-cols-4">
                  <div className="p-4 text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Total Marks
                    </div>
                    <div className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl font-mono">
                      {currentResult.isUpcoming ? (
                        <span className="text-slate-400">
                          - <span className="text-xs font-normal text-slate-400">/ {currentResult.totalMaxMarks}</span>
                        </span>
                      ) : (
                        <>
                          {currentResult.totalObtainedMarks}{' '}
                          <span className="text-xs font-normal text-slate-400">/ {currentResult.totalMaxMarks}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-4 text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Percentage
                    </div>
                    <div className="mt-1 text-2xl font-extrabold text-emerald-600 sm:text-3xl font-mono">
                      {currentResult.isUpcoming ? <span className="text-slate-400">-</span> : `${currentResult.percentage}%`}
                    </div>
                  </div>

                  <div className="p-4 text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Class Rank
                    </div>
                    <div className="mt-1 flex items-center justify-center gap-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                      {currentResult.isUpcoming ? (
                        <span className="text-slate-400 text-lg font-bold">Upcoming</span>
                      ) : (
                        <>
                          {currentResult.rank}
                          <span className="text-xs font-normal text-slate-400">
                            / {currentResult.totalStudentsInClass}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-4 text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Result Status
                    </div>
                    <div className="mt-1.5 flex items-center justify-center">
                      {currentResult.isUpcoming ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3.5 py-1 text-xs font-black text-amber-800 uppercase tracking-tight">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          UPCOMING
                        </span>
                      ) : currentResult.status === 'PASSED' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black text-emerald-800 uppercase tracking-tight">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          PASSED
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

                {/* Subject Breakdown Table (With Grade Column) */}
                <div className="mt-6 overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <th className="py-3 px-4 text-center w-12">#</th>
                        <th className="py-3 px-4">Subject Name</th>
                        <th className="py-3 px-4 text-center">Max Marks</th>
                        <th className="py-3 px-4 text-center">Marks Obtained</th>
                        <th className="py-3 px-4 text-center">Percentage</th>
                        <th className="py-3 px-4 text-center">Grade</th>
                        <th className="py-3 px-4 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentResult.subjects.map((sub, idx) => (
                        <tr key={sub.name} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono text-xs text-slate-400 text-center">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{sub.name}</td>
                          <td className="py-3 px-4 text-center font-mono text-slate-600">{sub.maxMarks}</td>
                          <td className="py-3 px-4 text-center font-bold font-mono text-slate-900">
                            {currentResult.isUpcoming ? <span className="text-slate-400 font-normal">-</span> : sub.obtainedMarks}
                          </td>
                          <td className="py-3 px-4 text-center text-xs font-mono text-slate-600">
                            {currentResult.isUpcoming ? <span className="text-slate-400 font-normal">-</span> : `${sub.percentage}%`}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">
                            {currentResult.isUpcoming ? <span className="text-slate-400 font-normal">-</span> : calculateGrade(sub.percentage)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {currentResult.isUpcoming ? (
                              <span className="text-xs font-bold text-amber-700 uppercase tracking-tight">Upcoming</span>
                            ) : sub.isPassing ? (
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
                        <td colSpan={2} className="py-3 px-4 font-extrabold uppercase text-xs tracking-wider">
                          Grand Total
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">{currentResult.totalMaxMarks}</td>
                        <td className="py-3 px-4 text-center font-mono font-extrabold text-blue-600">
                          {currentResult.isUpcoming ? <span className="text-slate-400 font-normal">-</span> : currentResult.totalObtainedMarks}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          {currentResult.isUpcoming ? <span className="text-slate-400 font-normal">-</span> : `${currentResult.percentage}%`}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">
                          {currentResult.isUpcoming ? <span className="text-slate-400 font-normal">-</span> : calculateGrade(currentResult.percentage)}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-600">
                          {currentResult.isUpcoming ? (
                            <span className="text-amber-800 font-extrabold">Upcoming</span>
                          ) : (
                            currentResult.status
                          )}
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
                    <div className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Class Teacher
                    </div>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                      <span className="font-serif italic text-xs text-slate-600">Kapil Dev Sir</span>
                    </div>
                    <div className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Controller of Exams
                    </div>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                      <span className="font-serif italic text-xs text-blue-600 font-bold">
                        {SCHOOL_INFO.principal}
                      </span>
                    </div>
                    <div className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Principal (Attestation Seal)
                    </div>
                  </div>
                </div>

                {/* Page 1 Footer for Print */}
                <div className="mt-6 flex justify-between items-center text-[10px] text-slate-400 pt-3 border-t border-slate-100 print:flex">
                  <span>Page 1 of 2 • Official Scorecard Document</span>
                  <span>Govt. Sr. Sec. School, Sanwaloda Purohitan, Sikar</span>
                </div>
              </div>
            </div>
          )}

          {/* Term-by-Term Examination Performance & Progression (Page 2) */}
          {allExamResults.length > 0 && (
            <div
              id="term-by-term-progression"
              className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm print:border-slate-300 print:shadow-none print:p-6 print:mt-6 print:block print:break-before-page"
            >
              {/* Report Header for Print / View */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">
                      Term-by-Term Examination Performance &amp; Progression Report
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comprehensive multi-term performance tracking, rank trajectories, and subject growth analysis
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  <span>Student: <strong>{student.name}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>Roll: <strong>#{student.rollNo}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span className="font-bold text-blue-700">{evaluatedCount} Evaluated Terms</span>
                </div>
              </div>

              {/* 1. Examination Terms Performance Cards */}
              <div className="mb-8">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
                  1. Examination Terms Performance Cards
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {allExamResults.map((res, index) => {
                    const isCurrent = activeExam?.examId === res.exam.examId;
                    const prevRes =
                      index > 0 && !allExamResults[index - 1].isUpcoming ? allExamResults[index - 1] : null;
                    const pctDiff =
                      !res.isUpcoming && prevRes
                        ? Math.round((res.percentage - prevRes.percentage) * 10) / 10
                        : null;

                    return (
                      <div
                        key={res.exam.examId}
                        className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
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

                          <div className="my-2.5 flex items-center justify-between">
                            {res.isUpcoming ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                <Clock className="h-3 w-3 text-amber-600" />
                                Upcoming
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                <Award className="h-3 w-3 text-amber-500" />
                                Rank {res.rank}
                              </span>
                            )}

                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                                res.isUpcoming
                                  ? 'bg-amber-100 text-amber-800'
                                  : res.status === 'PASSED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {res.isUpcoming ? 'Upcoming' : res.status}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between">
                            {res.isUpcoming ? (
                              <>
                                <span className="text-lg font-black text-amber-800 font-mono">Upcoming</span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  (Max: {res.totalMaxMarks})
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-xl font-black text-slate-900 font-mono">
                                  {res.percentage}%
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  ({res.totalObtainedMarks}/{res.totalMaxMarks})
                                </span>
                              </>
                            )}
                          </div>

                          {/* Growth indicator */}
                          <div className="mt-2 text-[10px]">
                            {res.isUpcoming ? (
                              <span className="text-slate-400">• Scheduled</span>
                            ) : pctDiff !== null ? (
                              pctDiff >= 0 ? (
                                <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                                  <TrendingUp className="h-3 w-3" />
                                  +{pctDiff}% vs previous
                                </span>
                              ) : (
                                <span className="font-bold text-rose-600 flex items-center gap-0.5">
                                  <TrendingDown className="h-3 w-3" />
                                  {pctDiff}% vs previous
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400 font-semibold">• Baseline Term</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                          <button
                            type="button"
                            id={`term-btn-${res.exam.examId}`}
                            onClick={() => {
                              setSelectedExamId(res.exam.examId);
                              const el = document.getElementById('official-marksheet-card');
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className={`flex items-center gap-1 text-[11px] font-bold transition cursor-pointer print:hidden ${
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

              {/* 2. Complete Examination History & Trajectory */}
              <div className="mb-8">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
                  2. Complete Examination History &amp; Trajectory
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <th className="py-2.5 px-3">Examination Name</th>
                        <th className="py-2.5 px-3 text-center">Date</th>
                        <th className="py-2.5 px-3 text-center">Max Marks</th>
                        <th className="py-2.5 px-3 text-center">Obtained</th>
                        <th className="py-2.5 px-3 text-center">Percentage</th>
                        <th className="py-2.5 px-3 text-center">Class Rank</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allExamResults.map((res) => (
                        <tr key={res.exam.examId} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{res.exam.examName}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">{res.exam.date}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">{res.totalMaxMarks}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-600">
                            {res.isUpcoming ? '-' : res.totalObtainedMarks}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">
                            {res.isUpcoming ? '-' : `${res.percentage}%`}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                            {res.isUpcoming ? 'Upcoming' : `#${res.rank}/${res.totalStudentsInClass}`}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-600">
                            {res.isUpcoming ? '-' : calculateGrade(res.percentage)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {res.isUpcoming ? (
                              <span className="text-amber-800 font-bold uppercase text-[10px]">Upcoming</span>
                            ) : res.status === 'PASSED' ? (
                              <span className="text-emerald-600 font-bold uppercase text-[10px]">PASSED</span>
                            ) : (
                              <span className="text-rose-600 font-bold uppercase text-[10px]">FAILED</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Subject-Wise Progression Summary */}
              <div className="mb-8">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
                  3. Subject-Wise Progression Summary
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <th className="py-2.5 px-3">Subject</th>
                        {allExamResults.map((res) => (
                          <th key={res.exam.examId} className="py-2.5 px-2 text-center">
                            {res.exam.examName.toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allSubjectNames.map((subjName) => (
                        <tr key={subjName} className="hover:bg-slate-50/80 transition">
                          <td className="py-2 px-3 font-bold text-slate-900">{subjName}</td>
                          {allExamResults.map((res) => {
                            const foundSub = res.subjects.find(
                              (s) => s.name.toLowerCase() === subjName.toLowerCase()
                            );
                            if (!foundSub) {
                              return (
                                <td key={res.exam.examId} className="py-2 px-2 text-center text-slate-400 font-mono">
                                  -
                                </td>
                              );
                            }
                            return (
                              <td
                                key={res.exam.examId}
                                className={`py-2 px-2 text-center font-mono text-xs ${
                                  res.isUpcoming
                                    ? 'text-slate-400'
                                    : foundSub.isPassing
                                    ? 'text-slate-900 font-semibold'
                                    : 'text-rose-600 font-bold'
                                }`}
                              >
                                {res.isUpcoming
                                  ? `- / ${foundSub.maxMarks}`
                                  : `${foundSub.obtainedMarks} / ${foundSub.maxMarks}`}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Term Progression Insights & Advice */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 mb-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Term Progression Insights &amp; Advice
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-700 leading-relaxed">
                  Student has appeared in {evaluatedCount} term examination(s). Maintain continuous revision and rigorous focus across all subjects for board examination preparation.
                </p>
              </div>

              {/* Signatures Block for Page 2 */}
              <div className="mt-8 grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-center">
                <div>
                  <div className="h-8 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                    <span className="font-serif italic text-xs text-slate-600"></span>
                  </div>
                  <div className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Academic Counselor
                  </div>
                </div>
                <div>
                  <div className="h-8 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                    <span className="font-serif italic text-xs text-slate-600">Kapil Dev Sir</span>
                  </div>
                  <div className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Examination In-Charge
                  </div>
                </div>
                <div>
                  <div className="h-8 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                    <span className="font-serif italic text-xs text-blue-600 font-bold">
                      {SCHOOL_INFO.principal}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Principal (Institutional Stamp)
                  </div>
                </div>
              </div>

              {/* Footer for Page 2 Print */}
              <div className="mt-6 flex justify-between items-center text-[10px] text-slate-400 pt-3 border-t border-slate-100 print:flex">
                <span>Page 2 of 2 • Term-by-Term Examination Performance &amp; Progression</span>
                <span>{SCHOOL_INFO.name} • Session 2026-27</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
