export interface Student {
  rollNo: string;
  name: string;
  className: string;
  fatherName: string;
  motherName?: string;
  gender?: string;
  dateOfBirth?: string;
  contactNumber?: string;
}

export interface Exam {
  examId: string;
  examName: string;
  className: string;
  maxMarksPerSubject: number;
  date: string;
  academicYear: string;
}

export interface SubjectMarksMap {
  [subjectName: string]: number;
}

export interface MarkRecord {
  id?: string;
  examId: string;
  rollNo: string;
  marks: SubjectMarksMap; // e.g. { Mathematics: 88, Science: 92, English: 84, ... }
  remarks?: string;
}

export interface ClassSubjectConfig {
  className: string;
  subjects: string[];
}

export interface TeacherUser {
  id: string;
  name: string;
  mobile: string;
  pin: string; // 4-digit PIN
  assignedClass?: string; // e.g. "Class 10" or "All Classes"
  role: 'Teacher' | 'Principal' | 'Admin';
}

export interface StudentExamResult {
  student: Student;
  exam: Exam;
  subjects: {
    name: string;
    maxMarks: number;
    obtainedMarks: number;
    percentage: number;
    grade: string;
    isPassing: boolean;
  }[];
  totalMaxMarks: number;
  totalObtainedMarks: number;
  percentage: number;
  overallGrade: string;
  rank: number;
  totalStudentsInClass: number;
  status: 'PASSED' | 'FAILED' | 'COMPARTMENT';
  remarks: string;
}

export interface ClassRankRow {
  rank: number;
  rollNo: string;
  name: string;
  fatherName: string;
  subjectMarks: SubjectMarksMap;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  status: 'PASSED' | 'FAILED' | 'COMPARTMENT';
}

export interface GoogleSheetsSyncState {
  isConnected: boolean;
  userEmail: string | null;
  webAppUrl: string | null;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
  syncInProgress: boolean;
  error: string | null;
}
