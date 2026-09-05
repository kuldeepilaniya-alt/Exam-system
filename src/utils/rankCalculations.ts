import { ClassRankRow, Exam, MarkRecord, Student, StudentExamResult } from '../types';
import { DEFAULT_SUBJECT_CONFIGS, normalizeClassName } from '../data/mockDatabase';

export function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 33) return 'D';
  return 'F';
}

export function isPassingScore(obtained: number, maxMarks: number): boolean {
  return (obtained / maxMarks) * 100 >= 33;
}

/**
 * Determines if an exam is upcoming / result awaited:
 * 1. If date of exam is in the future compared to today, OR
 * 2. If all class marks entered for this exam are 0 (or no marks entered at all)
 */
export function isExamUpcoming(exam: Exam, marksRecords: MarkRecord[]): boolean {
  if (exam.date) {
    const examDate = new Date(exam.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!isNaN(examDate.getTime())) {
      examDate.setHours(0, 0, 0, 0);
      if (examDate.getTime() > today.getTime()) {
        return true;
      }
    }
  }

  // Filter marks for this specific exam
  const examMarks = marksRecords.filter((m) => m.examId === exam.examId);
  if (examMarks.length === 0) {
    return true;
  }

  // Calculate sum of all marks recorded across all students/subjects in this exam
  let totalMarks = 0;
  for (const record of examMarks) {
    if (record.marks) {
      for (const val of Object.values(record.marks)) {
        totalMarks += Number(val || 0);
      }
    }
  }

  return totalMarks === 0;
}

/**
 * Calculates class-wise ranks strictly following SOP Section 5:
 * Sorts by total descending, ties receive the same rank, next gets standard competition rank.
 */
export function calculateClassRanks(
  students: Student[],
  exam: Exam,
  marksRecords: MarkRecord[],
  subjectList: string[]
): ClassRankRow[] {
  // Filter students belonging to this class
  const classStudents = students.filter(
    (s) => normalizeClassName(s.className) === normalizeClassName(exam.className)
  );

  const rows: Omit<ClassRankRow, 'rank'>[] = classStudents.map((student) => {
    const markRecord = marksRecords.find(
      (m) => m.examId === exam.examId && m.rollNo.toString().trim() === student.rollNo.toString().trim()
    );

    const subjectMarks = markRecord ? { ...markRecord.marks } : {};
    let totalObtained = 0;
    let failedCount = 0;

    subjectList.forEach((sub) => {
      const val = Number(subjectMarks[sub] ?? 0);
      subjectMarks[sub] = val;
      totalObtained += val;
      if (!isPassingScore(val, exam.maxMarksPerSubject)) {
        failedCount++;
      }
    });

    const totalMax = subjectList.length * exam.maxMarksPerSubject;
    const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
    const grade = calculateGrade(percentage);

    let status: 'PASSED' | 'FAILED' | 'COMPARTMENT' = 'PASSED';
    if (failedCount === 1) {
      status = 'COMPARTMENT';
    } else if (failedCount > 1) {
      status = 'FAILED';
    }

    return {
      rollNo: student.rollNo,
      name: student.name,
      fatherName: student.fatherName,
      subjectMarks,
      totalObtained,
      totalMax,
      percentage,
      grade,
      status,
    };
  });

  // Sort descending by totalObtained
  rows.sort((a, b) => b.totalObtained - a.totalObtained);

  // Assign ranks according to SOP Section 5 logic
  const rankedRows: ClassRankRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    let rank = 1;
    if (i > 0 && rows[i].totalObtained === rows[i - 1].totalObtained) {
      rank = rankedRows[i - 1].rank; // tie = same rank
    } else {
      rank = i + 1;
    }

    rankedRows.push({
      ...rows[i],
      rank,
    });
  }

  return rankedRows;
}

/**
 * Computes individual student result including their rank within the class
 */
export function getStudentExamResult(
  rollNo: string,
  examId: string,
  students: Student[],
  exams: Exam[],
  marksRecords: MarkRecord[],
  subjectsConfig: { [className: string]: string[] }
): StudentExamResult | null {
  const cleanRoll = rollNo.toString().trim().toLowerCase();
  const student = students.find((s) => s.rollNo.toString().trim().toLowerCase() === cleanRoll);
  if (!student) return null;

  const exam = exams.find((e) => e.examId === examId);
  if (!exam) return null;

  const subjects =
    subjectsConfig[student.className] ||
    DEFAULT_SUBJECT_CONFIGS.find((c) => c.className === student.className)?.subjects || [
      'Hindi',
      'English',
      'Science',
      'Maths',
      'Social Science',
      'Sanskrit',
    ];
  const classRankList = calculateClassRanks(students, exam, marksRecords, subjects);

  const studentRankRow = classRankList.find(
    (r) => r.rollNo.toString().trim().toLowerCase() === cleanRoll
  );

  const markRecord = marksRecords.find(
    (m) => m.examId === exam.examId && m.rollNo.toString().trim().toLowerCase() === cleanRoll
  );

  const subjectResults = subjects.map((subName) => {
    const obtainedMarks = Number(markRecord?.marks?.[subName] ?? 0);
    const maxMarks = exam.maxMarksPerSubject;
    const percentage = maxMarks > 0 ? Number(((obtainedMarks / maxMarks) * 100).toFixed(1)) : 0;
    const grade = calculateGrade(percentage);
    const isPassing = isPassingScore(obtainedMarks, maxMarks);
    return {
      name: subName,
      maxMarks,
      obtainedMarks,
      percentage,
      grade,
      isPassing,
    };
  });

  const totalMaxMarks = subjects.length * exam.maxMarksPerSubject;
  const totalObtainedMarks = subjectResults.reduce((acc, curr) => acc + curr.obtainedMarks, 0);
  const percentage = totalMaxMarks > 0 ? Number(((totalObtainedMarks / totalMaxMarks) * 100).toFixed(2)) : 0;
  const overallGrade = calculateGrade(percentage);

  const failedSubjects = subjectResults.filter((s) => !s.isPassing).length;
  let status: 'PASSED' | 'FAILED' | 'COMPARTMENT' = 'PASSED';
  if (failedSubjects === 1) {
    status = 'COMPARTMENT';
  } else if (failedSubjects > 1) {
    status = 'FAILED';
  }

  const isUpcoming = isExamUpcoming(exam, marksRecords);

  let remarks = 'Outstanding Academic Performance!';
  if (isUpcoming) {
    remarks = 'Upcoming Examination. Results will be published after evaluation.';
  } else if (percentage >= 80) remarks = 'Excellent performance and commendable diligence!';
  else if (percentage >= 65) remarks = 'Good progress, keep aspiring for higher excellence.';
  else if (percentage >= 50) remarks = 'Satisfactory performance. Regular revision is recommended.';
  else if (status === 'COMPARTMENT') remarks = 'Compartment in 1 subject. Special remedial classes advised.';
  else remarks = 'Needs substantial improvement and dedicated academic focus.';

  return {
    student,
    exam,
    subjects: subjectResults,
    totalMaxMarks,
    totalObtainedMarks,
    percentage,
    overallGrade,
    rank: studentRankRow?.rank ?? 1,
    totalStudentsInClass: classRankList.length,
    status,
    isUpcoming,
    remarks: markRecord?.remarks || remarks,
  };
}
