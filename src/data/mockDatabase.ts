import { ClassSubjectConfig, Exam, MarkRecord, Student, TeacherUser } from '../types';
import { OFFICIAL_STUDENTS, generateInitialMarks } from './rosterData';

export const SCHOOL_INFO = {
  name: 'Govt. Sr. Sec. School, Sanwaloda Purohitan, Sikar',
  shortName: 'GSSS Sanwaloda Purohitan',
  principal: 'Narendra Singh Chauhan',
  board: 'Board of Secondary Education, Rajasthan (RBSE)',
  address: 'Sanwaloda Purohitan, District Sikar, Rajasthan - 332001',
};

// Official Classes per Google Sheets database
export const ORDERED_CLASSES = [
  '5A',
  '8A',
  '10A',
  '12A',
  '12B',
  '12C',
] as const;

export function normalizeClassName(className: string): string {
  if (!className) return '10A';
  const c = className.trim().toLowerCase();
  if (c === '5a' || c === '5' || c.includes('class 5') || c.includes('class5')) return '5A';
  if (c === '10a' || c === '10' || c.includes('class 10') || c.includes('class10')) return '10A';
  if (c === '8a' || c === '8' || c.includes('class 8') || c.includes('class8')) return '8A';
  if (c === '12a' || c.includes('12a') || (c.includes('12') && c.includes('sci'))) return '12A';
  if (c === '12b' || c.includes('12b') || (c.includes('12') && c.includes('ag'))) return '12B';
  if (c === '12c' || c.includes('12c') || (c.includes('12') && (c.includes('art') || c.includes('hum')))) return '12C';
  return className.trim();
}

export function getDisplayClassName(className: string): string {
  const norm = normalizeClassName(className);
  if (norm === '5A') return 'Class 5 (5A)';
  if (norm === '10A') return 'Class 10 (10A)';
  if (norm === '8A') return 'Class 8 (8A)';
  if (norm === '12A') return 'Class 12A (Science)';
  if (norm === '12B') return 'Class 12B (Agriculture)';
  if (norm === '12C') return 'Class 12C (Arts)';
  return className;
}

// Curriculum mapping per user's Google Sheet (Strict single canonical records)
export const DEFAULT_SUBJECT_CONFIGS: ClassSubjectConfig[] = [
  {
    className: '5A',
    subjects: ['Hindi', 'English', 'Maths', 'Environmental Studies'],
  },
  {
    className: '8A',
    subjects: ['Hindi', 'English', 'Science', 'Maths', 'Social Science', 'Sanskrit'],
  },
  {
    className: '10A',
    subjects: ['Hindi', 'English', 'Science', 'Maths', 'Social Science', 'Sanskrit'],
  },
  {
    className: '12A',
    subjects: ['Hindi', 'English', 'Physic', 'Chemistry', 'Maths'],
  },
  {
    className: '12B',
    subjects: ['Hindi', 'English', 'Ag Chemistry', 'Ag Biology', 'Agriculture'],
  },
  {
    className: '12C',
    subjects: ['Hindi', 'English', 'History', 'Geography', 'Hindi Literature'],
  },
];

/**
 * Normalizes and consolidates subjectsMap into single unique records per class.
 * Strictly removes duplicate rows: Class 10, Class 8, Class 12A, Class 12B, Class 12C, Class 5
 * Consolidating them into the canonical class records: 5A, 8A, 10A, 12A, 12B, 12C.
 */
export function normalizeSubjectsMap(
  rawMap?: { [className: string]: string[] } | null
): { [className: string]: string[] } {
  const result: { [className: string]: string[] } = {};

  const canonicalDefaults: { [className: string]: string[] } = {};
  DEFAULT_SUBJECT_CONFIGS.forEach((c) => {
    canonicalDefaults[c.className] = c.subjects;
  });

  const canonicalOrder = ['5A', '8A', '10A', '12A', '12B', '12C'];

  // Explicit duplicate / removable row labels
  const REMOVABLE_ALIASES = new Set([
    'class 5',
    'class 5a',
    'class5',
    'class5a',
    'class 10',
    'class 8',
    'class 12a',
    'class 12b',
    'class 12c',
    'class10',
    'class8',
    'class12a',
    'class12b',
    'class12c',
  ]);

  if (rawMap && typeof rawMap === 'object') {
    // 1. First assign exact canonical records if present
    canonicalOrder.forEach((cls) => {
      if (rawMap[cls] && Array.isArray(rawMap[cls]) && rawMap[cls].length > 0) {
        result[cls] = rawMap[cls];
      }
    });

    // 2. For any other keys, fold them into canonical if missing, and omit duplicate alias keys
    Object.entries(rawMap).forEach(([rawKey, list]) => {
      const trimmed = rawKey.trim();
      const lower = trimmed.toLowerCase();

      if (REMOVABLE_ALIASES.has(lower)) {
        // Target canonical key
        const norm = normalizeClassName(trimmed);
        if (!result[norm] && Array.isArray(list) && list.length > 0) {
          result[norm] = list;
        }
        // Always discard the removable duplicate key
        return;
      }

      const norm = normalizeClassName(trimmed);
      if (canonicalOrder.includes(norm)) {
        if (!result[norm] && Array.isArray(list) && list.length > 0) {
          result[norm] = list;
        }
      } else {
        // Custom classes beyond the 5
        if (!result[trimmed] && Array.isArray(list) && list.length > 0) {
          result[trimmed] = list;
        }
      }
    });
  }

  // 3. Guarantee all 5 canonical single records exist
  canonicalOrder.forEach((cls) => {
    if (!result[cls] || result[cls].length === 0) {
      result[cls] = canonicalDefaults[cls] || [
        'Hindi',
        'English',
        'Science',
        'Maths',
        'Social Science',
        'Sanskrit',
      ];
    }
  });

  return result;
}

// Official 90 Students from Google Sheets roster
export const DEFAULT_STUDENTS: Student[] = OFFICIAL_STUDENTS;

// Create 8 standard exams (RT1-4: 20 marks, PB1-4: 80 marks) for each class
export function createDefaultExams(): Exam[] {
  const exams: Exam[] = [];
  ORDERED_CLASSES.forEach((cls) => {
    // Rank Tests 1 to 4 (20 Marks each subject)
    const rtDates = ['2026-07-25', '2026-08-28', '2026-10-14', '2026-11-18'];
    for (let i = 1; i <= 4; i++) {
      exams.push({
        examId: `${cls}-RT${i}`,
        examName: `Rank Test ${i}`,
        className: cls,
        maxMarksPerSubject: 20,
        date: rtDates[i - 1],
        academicYear: '2026-27',
      });
    }
    // Pre Board 1 to 4 (80 Marks each subject)
    const pbDates = ['2026-12-20', '2027-01-12', '2027-01-28', '2027-02-18'];
    for (let i = 1; i <= 4; i++) {
      exams.push({
        examId: `${cls}-PB${i}`,
        examName: `Pre Board ${i}`,
        className: cls,
        maxMarksPerSubject: 80,
        date: pbDates[i - 1],
        academicYear: '2026-27',
      });
    }
  });
  return exams;
}

export const DEFAULT_EXAMS: Exam[] = createDefaultExams();

// Teachers per official roster
export const DEFAULT_TEACHERS: TeacherUser[] = [
  {
    id: 'TCH-001',
    name: 'Narendra Singh Chauhan',
    mobile: '9876543210',
    pin: '1234',
    assignedClass: 'All Classes',
    role: 'Principal',
  },
  {
    id: 'TCH-002',
    name: 'Rajesh Malhotra',
    mobile: '9123456780',
    pin: '4321',
    assignedClass: '10A',
    role: 'Teacher',
  },
  {
    id: 'TCH-003',
    name: 'Kavita Sharma',
    mobile: '9988776655',
    pin: '9999',
    assignedClass: '8A',
    role: 'Teacher',
  },
  {
    id: 'TCH-004',
    name: 'Virendra Singh',
    mobile: '9829012345',
    pin: '1122',
    assignedClass: '12A',
    role: 'Teacher',
  },
  {
    id: 'TCH-005',
    name: 'Gopal Lal Jat',
    mobile: '9414012345',
    pin: '3344',
    assignedClass: '12B',
    role: 'Teacher',
  },
  {
    id: 'TCH-006',
    name: 'Mahesh Kumar Sharma',
    mobile: '9828012345',
    pin: '5566',
    assignedClass: '12C',
    role: 'Teacher',
  },
  {
    id: 'TCH-007',
    name: 'Pooja Pareek',
    mobile: '9829554433',
    pin: '7788',
    assignedClass: '5A',
    role: 'Teacher',
  },
];

const subjectsMapDefaults: { [className: string]: string[] } = {};
DEFAULT_SUBJECT_CONFIGS.forEach((c) => {
  subjectsMapDefaults[c.className] = c.subjects;
});

export const DEFAULT_MARKS: MarkRecord[] = generateInitialMarks(
  DEFAULT_STUDENTS,
  DEFAULT_EXAMS,
  subjectsMapDefaults
);

export function generateAllSampleMarks(
  students: Student[],
  exams: Exam[],
  subjectsMap: { [className: string]: string[] }
): MarkRecord[] {
  return generateInitialMarks(students, exams, subjectsMap);
}

// Storage keys versioned to v3 to automatically pick up the official 90-student roster
const STORAGE_KEYS = {
  STUDENTS: 'marksdb_students_v3',
  EXAMS: 'marksdb_exams_v3',
  MARKS: 'marksdb_marks_v3',
  SUBJECTS: 'marksdb_subjects_v3',
  TEACHERS: 'marksdb_teachers_v3',
  ACTIVE_TEACHER: 'marksdb_active_teacher',
  LINKED_SHEET: 'marksdb_linked_sheet_id',
  LINKED_SHEET_URL: 'marksdb_linked_sheet_url',
  WEB_APP_URL: 'marksdb_web_app_url',
};

export function getStoredStudents(): Student[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!data) return DEFAULT_STUDENTS;
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length < 50) {
      saveStudents(DEFAULT_STUDENTS);
      return DEFAULT_STUDENTS;
    }
    const has5A = parsed.some((s: Student) => normalizeClassName(s.className) === '5A');
    if (!has5A) {
      const students5A = DEFAULT_STUDENTS.filter((s) => normalizeClassName(s.className) === '5A');
      const merged = [...parsed, ...students5A];
      saveStudents(merged);
      return merged;
    }
    return parsed;
  } catch {
    return DEFAULT_STUDENTS;
  }
}

export function saveStudents(students: Student[]): void {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
}

export function getStoredExams(): Exam[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
    if (!data) return DEFAULT_EXAMS;
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length < 20) {
      saveExams(DEFAULT_EXAMS);
      return DEFAULT_EXAMS;
    }
    const normalized = parsed.map((e: Exam) => ({ ...e, academicYear: '2026-27' }));
    const has5AExams = normalized.some((e: Exam) => normalizeClassName(e.className) === '5A');
    if (!has5AExams) {
      const exams5A = DEFAULT_EXAMS.filter((e) => normalizeClassName(e.className) === '5A');
      const merged = [...normalized, ...exams5A];
      saveExams(merged);
      return merged;
    }
    return normalized;
  } catch {
    return DEFAULT_EXAMS;
  }
}

export function saveExams(exams: Exam[]): void {
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
}

export function getStoredMarks(): MarkRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MARKS);
    if (!data) return DEFAULT_MARKS;
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length < 100) {
      saveMarks(DEFAULT_MARKS);
      return DEFAULT_MARKS;
    }
    const has5AMarks = parsed.some((m: MarkRecord) => m.examId.startsWith('5A-'));
    if (!has5AMarks) {
      const marks5A = DEFAULT_MARKS.filter((m) => m.examId.startsWith('5A-'));
      const merged = [...parsed, ...marks5A];
      saveMarks(merged);
      return merged;
    }
    return parsed;
  } catch {
    return DEFAULT_MARKS;
  }
}

export function saveMarks(marks: MarkRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.MARKS, JSON.stringify(marks));
}

export function getStoredSubjectsMap(): { [className: string]: string[] } {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (data) {
      const parsed = JSON.parse(data);
      const normalized = normalizeSubjectsMap(parsed);
      // Auto-cleanup stored duplicates in localStorage so stale copies are permanently fixed
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(normalized));
      return normalized;
    }
  } catch {
    // fallback
  }
  const map: { [className: string]: string[] } = {};
  DEFAULT_SUBJECT_CONFIGS.forEach((c) => {
    map[c.className] = c.subjects;
  });
  return map;
}

export function saveSubjectsMap(map: { [className: string]: string[] }): void {
  const normalized = normalizeSubjectsMap(map);
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(normalized));
}

export function getStoredTeachers(): TeacherUser[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    if (!data) return DEFAULT_TEACHERS;
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || !parsed.some((t: TeacherUser) => t.pin === '4321')) {
      saveTeachers(DEFAULT_TEACHERS);
      return DEFAULT_TEACHERS;
    }
    const has5ATeacher = parsed.some((t: TeacherUser) => t.assignedClass === '5A');
    if (!has5ATeacher) {
      const teacher5A = DEFAULT_TEACHERS.find((t: TeacherUser) => t.assignedClass === '5A');
      if (teacher5A) {
        const merged = [...parsed, teacher5A];
        saveTeachers(merged);
        return merged;
      }
    }
    return parsed;
  } catch {
    return DEFAULT_TEACHERS;
  }
}

export function saveTeachers(teachers: TeacherUser[]): void {
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
}

export function getStoredActiveTeacher(): TeacherUser | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_TEACHER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveActiveTeacher(teacher: TeacherUser | null): void {
  if (teacher) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TEACHER, JSON.stringify(teacher));
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TEACHER);
  }
}

export function getStoredLinkedSheetId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.LINKED_SHEET) || '1-PucE1sY7dJs_rFFQM9heWMLhMzrMrbMZD9YeDhs46Y';
  } catch {
    return '1-PucE1sY7dJs_rFFQM9heWMLhMzrMrbMZD9YeDhs46Y';
  }
}

export function getStoredLinkedSheetUrl(): string | null {
  try {
    const id = getStoredLinkedSheetId();
    return localStorage.getItem(STORAGE_KEYS.LINKED_SHEET_URL) || (id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null);
  } catch {
    const id = getStoredLinkedSheetId();
    return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null;
  }
}

export function saveLinkedSheetUrl(url: string | null): void {
  if (url) {
    localStorage.setItem(STORAGE_KEYS.LINKED_SHEET_URL, url);
  } else {
    localStorage.removeItem(STORAGE_KEYS.LINKED_SHEET_URL);
  }
}

export function getStoredWebAppUrl(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.WEB_APP_URL) || 'https://script.google.com/macros/s/AKfycbzAQPwVNSsISIM9ufKVYGInfAD_i7g3WY6nRI7MBFr-GPNqxyH_WJ5Pl_2ypTsKbFPl/exec';
  } catch {
    return 'https://script.google.com/macros/s/AKfycbzAQPwVNSsISIM9ufKVYGInfAD_i7g3WY6nRI7MBFr-GPNqxyH_WJ5Pl_2ypTsKbFPl/exec';
  }
}

export function saveStoredWebAppUrl(url: string | null): void {
  if (url) {
    localStorage.setItem(STORAGE_KEYS.WEB_APP_URL, url);
  } else {
    localStorage.removeItem(STORAGE_KEYS.WEB_APP_URL);
  }
}

export function saveLinkedSheetId(id: string | null): void {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.LINKED_SHEET, id);
    localStorage.setItem(STORAGE_KEYS.LINKED_SHEET_URL, `https://docs.google.com/spreadsheets/d/${id}/edit`);
  } else {
    localStorage.removeItem(STORAGE_KEYS.LINKED_SHEET);
    localStorage.removeItem(STORAGE_KEYS.LINKED_SHEET_URL);
  }
}

export function resetToDefaults(): void {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(DEFAULT_EXAMS));
  localStorage.setItem(STORAGE_KEYS.MARKS, JSON.stringify(DEFAULT_MARKS));
  const map: { [className: string]: string[] } = {};
  DEFAULT_SUBJECT_CONFIGS.forEach((c) => {
    map[c.className] = c.subjects;
  });
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(map));
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(DEFAULT_TEACHERS));
}

export function formatSyncDateTime(date: Date = new Date()): string {
  const dateStr = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr}, ${timeStr}`;
}

export function getStoredLastSyncedAt(): string | null {
  try {
    return localStorage.getItem('marksdb_last_synced_at') || null;
  } catch {
    return null;
  }
}

export function saveStoredLastSyncedAt(val: string): void {
  try {
    localStorage.setItem('marksdb_last_synced_at', val);
  } catch {}
}
