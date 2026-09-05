import { Exam, MarkRecord, Student, TeacherUser } from '../types';
import { calculateClassRanks } from '../utils/rankCalculations';
import { DEFAULT_SUBJECT_CONFIGS, ORDERED_CLASSES } from '../data/mockDatabase';

export interface SyncDataPayload {
  students: Student[];
  exams: Exam[];
  marks: MarkRecord[];
  subjectsMap: { [className: string]: string[] };
  teachers: TeacherUser[];
}

export interface SheetImportResult {
  students?: Student[];
  exams?: Exam[];
  marks?: MarkRecord[];
  subjectsMap?: { [className: string]: string[] };
  teachers?: TeacherUser[];
}

/**
 * Extracts a clean Google Spreadsheet ID from either a full Google Sheet URL
 * (e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit#gid=0)
 * or a raw ID string.
 */
export function extractSpreadsheetId(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Builds a standard Google Sheets edit URL from a spreadsheet ID
 */
export function buildSpreadsheetUrl(spreadsheetId: string): string {
  if (!spreadsheetId) return '';
  const cleanId = extractSpreadsheetId(spreadsheetId);
  return `https://docs.google.com/spreadsheets/d/${cleanId}/edit`;
}

/**
 * Parses raw 2D row array for Students sheet into Student[]
 */
export function parseStudentRows(allStudentRows: (string | number)[][]): Student[] {
  if (!allStudentRows || allStudentRows.length <= 1) return [];
  const header = allStudentRows[0].map((h) => String(h || '').trim().toLowerCase());
  const dataRows = allStudentRows.slice(1);

  const rollIdx = header.findIndex((h) => h.includes('roll'));
  const classIdx = header.findIndex((h) => h === 'class' || h.includes('class'));
  const nameIdx = header.findIndex(
    (h) => (h === 'name' || h.includes('student') || h.includes('name')) && !h.includes('father') && !h.includes('mother')
  );
  const fatherIdx = header.findIndex((h) => h.includes('father'));
  const motherIdx = header.findIndex((h) => h.includes('mother'));
  const genderIdx = header.findIndex((h) => h.includes('gender') || h === 'sex');
  const dobIdx = header.findIndex((h) => h.includes('dob') || h.includes('birth') || h.includes('date of birth'));
  const contactIdx = header.findIndex((h) => h.includes('mobile') || h.includes('contact') || h.includes('phone'));

  return dataRows
    .filter((r) => r[rollIdx !== -1 ? rollIdx : 0])
    .map((r) => {
      const rollNo = String(r[rollIdx !== -1 ? rollIdx : 0]).trim();
      const name = nameIdx !== -1 && r[nameIdx] ? String(r[nameIdx]).trim() : `Student ${rollNo}`;
      const className = classIdx !== -1 && r[classIdx] ? String(r[classIdx]).trim() : '10A';
      const fatherName = fatherIdx !== -1 && r[fatherIdx] ? String(r[fatherIdx]).trim() : '';
      const motherName = motherIdx !== -1 && r[motherIdx] ? String(r[motherIdx]).trim() : undefined;
      const gender = genderIdx !== -1 && r[genderIdx] ? String(r[genderIdx]).trim() : undefined;
      const dateOfBirth = dobIdx !== -1 && r[dobIdx] ? String(r[dobIdx]).trim() : undefined;
      const contactNumber = contactIdx !== -1 && r[contactIdx] ? String(r[contactIdx]).trim() : undefined;

      return {
        rollNo,
        name,
        className,
        fatherName,
        motherName,
        gender,
        dateOfBirth,
        contactNumber,
      };
    });
}

/**
 * Parses raw 2D row array for Exams sheet into Exam[]
 */
export function parseExamRows(allExamRows: (string | number)[][]): Exam[] {
  if (!allExamRows || allExamRows.length <= 1) return [];
  const header = allExamRows[0].map((h) => String(h || '').trim().toLowerCase());
  const dataRows = allExamRows.slice(1);

  const idIdx = header.findIndex((h) => h.includes('examid') || (h.includes('exam') && h.includes('id')));
  const nameIdx = header.findIndex((h) => h.includes('examname') || (h.includes('exam') && h.includes('name')));
  const classIdx = header.findIndex((h) => h === 'class' || h.includes('class'));
  const maxMarksIdx = header.findIndex((h) => h.includes('max') || h.includes('marks'));
  const dateIdx = header.findIndex((h) => h.includes('date'));
  const yearIdx = header.findIndex((h) => h.includes('year') || h.includes('academic'));

  return dataRows
    .filter((r) => r[idIdx !== -1 ? idIdx : 0])
    .map((r) => {
      const examId = String(r[idIdx !== -1 ? idIdx : 0]).trim();
      const examName = nameIdx !== -1 && r[nameIdx] ? String(r[nameIdx]).trim() : examId;
      const className = classIdx !== -1 && r[classIdx] ? String(r[classIdx]).trim() : '10A';
      const maxMarks = maxMarksIdx !== -1 && Number(r[maxMarksIdx]) ? Number(r[maxMarksIdx]) : 100;
      const date = dateIdx !== -1 && r[dateIdx] ? String(r[dateIdx]).trim() : '';
      const academicYear = yearIdx !== -1 && r[yearIdx] ? String(r[yearIdx]).trim() : '2026-27';

      return {
        examId,
        examName,
        className,
        maxMarksPerSubject: maxMarks,
        date,
        academicYear,
      };
    });
}

/**
 * Parses raw 2D row array for Marks sheet into MarkRecord[]
 */
export function parseMarksRows(allMarksRows: (string | number)[][]): MarkRecord[] {
  if (!allMarksRows || allMarksRows.length <= 1) return [];
  const headerRow = allMarksRows[0].map((h) => String(h || '').trim());
  const dataRows = allMarksRows.slice(1);

  const headerLower = headerRow.map((h) => h.toLowerCase());
  const examIdIdx = headerLower.findIndex((h) => h.includes('exam'));
  const rollNoIdx = headerLower.findIndex((h) => h.includes('roll'));
  const remarksIdx = headerLower.findIndex((h) => h.includes('remark'));

  const subjectsColIdx = headerLower.findIndex((h) => h === 'subjects' || h === 'subject');
  const marksColIdx = headerLower.findIndex(
    (h) => h === 'marksobtained' || h === 'marks obtained' || h === 'marks' || h === 'respectivemarks'
  );

  const ignoredHeaders = new Set([
    'examid',
    'rollno',
    'studentname',
    'name',
    'class',
    'subjects',
    'subject',
    'marksobtained',
    'marks obtained',
    'marks',
    'respectivemarks',
    'total',
    'totalmarks',
    'total marks',
    'maxtotal',
    'max total',
    'percentage',
    'percent',
    '%',
    'rank',
    'remarks',
  ]);

  return dataRows
    .filter((r) => (examIdIdx !== -1 ? r[examIdIdx] : r[0]) && (rollNoIdx !== -1 ? r[rollNoIdx] : r[1]))
    .map((r) => {
      const examId = String(examIdIdx !== -1 ? r[examIdIdx] : r[0]).trim();
      const rollNo = String(rollNoIdx !== -1 ? r[rollNoIdx] : r[1]).trim();
      const marksMap: { [key: string]: number } = {};

      // If stored as single-cell subjects and respective marks in adjacent cell
      if (subjectsColIdx !== -1 && marksColIdx !== -1) {
        const subArr = String(r[subjectsColIdx] || '')
          .split(/[,;\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
        const marksArr = String(r[marksColIdx] || '')
          .split(/[,;\n]/)
          .map((s) => s.trim())
          .filter(Boolean);

        subArr.forEach((sName, i) => {
          const val = Number(marksArr[i] ?? 0);
          marksMap[sName] = isNaN(val) ? 0 : val;
        });
      } else {
        // Standard wide column layout (one column per subject)
        headerRow.forEach((colName, colIdx) => {
          const norm = colName.toLowerCase().replace(/\s+/g, '');
          if (!ignoredHeaders.has(colName.toLowerCase()) && !ignoredHeaders.has(norm)) {
            const raw = r[colIdx];
            const num = Number(raw ?? 0);
            if (!isNaN(num)) {
              marksMap[colName] = num;
            }
          }
        });
      }

      const remarks = remarksIdx !== -1 && r[remarksIdx] ? String(r[remarksIdx]).trim() : undefined;

      return {
        examId,
        rollNo,
        marks: marksMap,
        remarks,
      };
    });
}

/**
 * Parses raw 2D row array for Subjects sheet into { [className: string]: string[] }
 */
export function parseSubjectRows(allSubjectRows: (string | number)[][]): { [className: string]: string[] } {
  if (!allSubjectRows || allSubjectRows.length <= 1) return {};
  const map: { [className: string]: string[] } = {};
  allSubjectRows.slice(1).forEach((r) => {
    if (r[0] && r[1]) {
      const cls = String(r[0]).trim();
      // Second column can be subject count or subject string list, check column 2 (third column) if column 1 is count
      const rawSub = r.length > 2 && isNaN(Number(r[2])) && !isNaN(Number(r[1])) ? r[2] : r[1];
      const list = String(rawSub)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length > 0) {
        map[cls] = list;
      }
    }
  });
  return map;
}

/**
 * Parses raw 2D row array for Teachers sheet into TeacherUser[]
 * Sequence: Name, Mobile, PIN, Assigned Class, Role
 */
export function parseTeacherRows(allTeacherRows: (string | number)[][]): TeacherUser[] {
  if (!allTeacherRows || allTeacherRows.length <= 1) return [];
  const header = allTeacherRows[0].map((h) => String(h || '').trim().toLowerCase());
  const dataRows = allTeacherRows.slice(1);

  const nameIdx = header.findIndex((h) => h.includes('name'));
  const mobileIdx = header.findIndex((h) => h.includes('mobile') || h.includes('phone'));
  const pinIdx = header.findIndex((h) => h.includes('pin') || h.includes('password'));
  const classIdx = header.findIndex((h) => h.includes('class'));
  const roleIdx = header.findIndex((h) => h.includes('role') || h.includes('designation'));

  return dataRows
    .filter((r) => (nameIdx !== -1 ? r[nameIdx] : r[0]))
    .map((r, i) => {
      const name = nameIdx !== -1 && r[nameIdx] ? String(r[nameIdx]).trim() : `Teacher ${i + 1}`;
      const mobile = mobileIdx !== -1 && r[mobileIdx] ? String(r[mobileIdx]).trim() : '';
      const pin = pinIdx !== -1 && r[pinIdx] ? String(r[pinIdx]).trim() : '1234';
      const assignedClass = classIdx !== -1 && r[classIdx] ? String(r[classIdx]).trim() : 'All Classes';
      const role = (roleIdx !== -1 && r[roleIdx] ? String(r[roleIdx]).trim() : 'Teacher') as any;

      return {
        id: `TCH-${i + 1}`,
        name,
        mobile,
        pin,
        assignedClass,
        role,
      };
    });
}

/**
 * Fetches sheet data using Google Visualization API (public / shared sheets)
 */
export async function fetchGvizSheet(
  spreadsheetId: string,
  sheetName: string
): Promise<(string | number)[][] | null> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
      sheetName
    )}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    
    // Parse Google visualization JSON wrapper
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) return null;
    
    const json = JSON.parse(text.substring(startIdx, endIdx + 1));
    if (!json.table) return null;

    const cols = json.table.cols || [];
    const colLabels = cols.map((c: any) => String(c.label || c.id || '').trim());
    const hasColLabels = colLabels.some((l: string) => l.length > 0);

    const rows: (string | number)[][] = [];
    if (hasColLabels) {
      rows.push(colLabels);
    }

    (json.table.rows || []).forEach((row: any) => {
      if (!row || !row.c) return;
      const rowVals = row.c.map((cell: any) => {
        if (!cell) return '';
        return cell.v !== undefined && cell.v !== null ? cell.v : (cell.f || '');
      });
      rows.push(rowVals);
    });

    return rows.length > 0 ? rows : null;
  } catch {
    return null;
  }
}

/**
 * Fetches all tabs from a public Google Sheet via GViz API
 */
export async function fetchDataFromPublicGoogleSheet(spreadsheetId: string): Promise<SheetImportResult> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) {
    throw new Error('Invalid Google Spreadsheet ID.');
  }

  const result: SheetImportResult = {};

  const [studentRows, examRows, markRows, subjectRows, teacherRows] = await Promise.all([
    fetchGvizSheet(cleanId, 'Students'),
    fetchGvizSheet(cleanId, 'Exams'),
    fetchGvizSheet(cleanId, 'Marks'),
    fetchGvizSheet(cleanId, 'Subjects'),
    fetchGvizSheet(cleanId, 'Teachers'),
  ]);

  if (studentRows) result.students = parseStudentRows(studentRows);
  if (examRows) result.exams = parseExamRows(examRows);
  if (markRows) result.marks = parseMarksRows(markRows);
  if (subjectRows) result.subjectsMap = parseSubjectRows(subjectRows);
  if (teacherRows) result.teachers = parseTeacherRows(teacherRows);

  return result;
}

/**
 * Fetches full database JSON directly from Google Apps Script Web App
 */
export async function fetchDataFromWebApp(webAppUrl: string): Promise<SheetImportResult> {
  if (!webAppUrl || !webAppUrl.trim()) {
    throw new Error('Invalid Web App URL');
  }

  const url = webAppUrl.trim();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const result: SheetImportResult = {};

    if (data.students && Array.isArray(data.students)) {
      result.students = data.students;
    }
    if (data.exams && Array.isArray(data.exams)) {
      result.exams = data.exams;
    }
    if (data.marks && Array.isArray(data.marks)) {
      result.marks = data.marks;
    }
    if (data.subjectsMap && typeof data.subjectsMap === 'object') {
      result.subjectsMap = data.subjectsMap;
    }
    if (data.teachers && Array.isArray(data.teachers)) {
      result.teachers = data.teachers;
    }

    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw new Error(err.message || 'Failed to fetch from Web App');
  }
}

/**
 * Universal data loader: tries Web App, then Public Google Sheet (GViz), then OAuth API v4
 */
export async function fetchDataFromAnyGoogleSource(options: {
  spreadsheetId?: string | null;
  webAppUrl?: string | null;
  accessToken?: string | null;
}): Promise<SheetImportResult> {
  const { spreadsheetId, webAppUrl, accessToken } = options;

  // 1. Try Apps Script Web App first if available
  if (webAppUrl && webAppUrl.trim()) {
    try {
      const data = await fetchDataFromWebApp(webAppUrl);
      if (
        (data.students && data.students.length > 0) ||
        (data.exams && data.exams.length > 0) ||
        (data.marks && data.marks.length > 0)
      ) {
        return data;
      }
    } catch (e) {
      console.warn('Web App fetch error, falling back to Google Sheet:', e);
    }
  }

  // 2. Try Public Google Sheet via GViz
  if (spreadsheetId) {
    const cleanId = extractSpreadsheetId(spreadsheetId);
    if (cleanId) {
      try {
        const data = await fetchDataFromPublicGoogleSheet(cleanId);
        if (
          (data.students && data.students.length > 0) ||
          (data.exams && data.exams.length > 0) ||
          (data.marks && data.marks.length > 0)
        ) {
          return data;
        }
      } catch (e) {
        console.warn('Public Google Sheet fetch error:', e);
      }
    }
  }

  // 3. Try Authenticated Google Sheets API v4 if accessToken provided
  if (accessToken && spreadsheetId) {
    const cleanId = extractSpreadsheetId(spreadsheetId);
    if (cleanId) {
      return await loadDataFromGoogleSheet(accessToken, cleanId);
    }
  }

  return {};
}

/**
 * Creates a complete Google Spreadsheet with the 5 required sheets per the SOP:
 * Students, Exams, Marks, Subjects, Teachers
 */
export async function createMarksDbSpreadsheet(
  accessToken: string,
  title: string = 'MarksDB - Student Marks & Results System'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        { properties: { title: 'Students', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'Exams', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'Marks', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'Subjects', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'Teachers', gridProperties: { frozenRowCount: 1 } } },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create spreadsheet: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
}

/**
 * Populates or updates the full MarksDB data inside an existing Google Spreadsheet
 */
export async function syncDataToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  data: SyncDataPayload
): Promise<void> {
  // First, let's build the rows for each tab

  const sortedStudents = [...data.students].sort((a, b) => {
    const idxA = ORDERED_CLASSES.indexOf(a.className as any);
    const idxB = ORDERED_CLASSES.indexOf(b.className as any);
    if (idxA !== idxB) {
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    }
    return String(a.rollNo).localeCompare(String(b.rollNo), undefined, { numeric: true });
  });

  // 1. Students Sheet (Sequence: Class, Roll No, Student Name, Father's Name, Contact Number)
  const studentValues = [
    ['Class', 'Roll No', 'Student Name', "Father's Name", 'Contact Number'],
    ...sortedStudents.map((s) => [
      s.className,
      s.rollNo,
      s.name,
      s.fatherName || '',
      s.contactNumber || '',
    ]),
  ];

  // 2. Exams Sheet
  const examValues = [
    ['ExamID', 'ExamName', 'Class', 'MaxMarksPerSubject', 'Date', 'AcademicYear'],
    ...data.exams.map((e) => [
      e.examId,
      e.examName,
      e.className,
      e.maxMarksPerSubject,
      e.date,
      e.academicYear,
    ]),
  ];

  // 3. Subjects Sheet
  const subjectValues = [
    ['Class', 'SubjectList'],
    ...Object.entries(data.subjectsMap).map(([className, subjects]) => [
      className,
      subjects.join(', '),
    ]),
  ];

  // 4. Teachers Sheet
  const teacherValues = [
    ['Name', 'Mobile', 'PIN', 'AssignedClass', 'Role'],
    ...data.teachers.map((t) => [
      t.name,
      t.mobile,
      t.pin,
      t.assignedClass || 'All Classes',
      t.role,
    ]),
  ];

  // 5. Marks Sheet (detailed with rank calculation per SOP Section 3 & 5)
  // Ordered subjects list across all classes
  const allKnownSubjects: string[] = [];
  ORDERED_CLASSES.forEach((cls) => {
    const subs =
      data.subjectsMap[cls] ||
      DEFAULT_SUBJECT_CONFIGS.find((c) => c.className === cls)?.subjects ||
      [];
    subs.forEach((s) => {
      if (!allKnownSubjects.includes(s)) allKnownSubjects.push(s);
    });
  });
  Object.values(data.subjectsMap).forEach((subs) => {
    subs.forEach((s) => {
      if (!allKnownSubjects.includes(s)) allKnownSubjects.push(s);
    });
  });

  const marksHeader = [
    'ExamID',
    'RollNo',
    'StudentName',
    'Class',
    'Subjects',
    'MarksObtained',
    'Total',
    'MaxTotal',
    'Percentage',
    'Rank',
    'Remarks',
  ];

  // For each exam, compute accurate ranks per class
  const marksRows: (string | number)[][] = [marksHeader];

  for (const exam of data.exams) {
    const subjects = data.subjectsMap[exam.className] || allKnownSubjects;
    const rankedClass = calculateClassRanks(data.students, exam, data.marks, subjects);

    rankedClass.forEach((r) => {
      const markRecord = data.marks.find(
        (m) => m.examId === exam.examId && m.rollNo.toString().trim() === r.rollNo.toString().trim()
      );

      const subjectsList: string[] = [];
      const marksList: (number | string)[] = [];

      subjects.forEach((sub) => {
        subjectsList.push(sub);
        marksList.push(r.subjectMarks[sub] ?? 0);
      });

      const row = [
        exam.examId,
        r.rollNo,
        r.name,
        exam.className,
        subjectsList.join(', '),
        marksList.join(', '),
        r.totalObtained,
        r.totalMax,
        r.percentage,
        r.rank,
        markRecord?.remarks || '',
      ];
      marksRows.push(row);
    });
  }

  // Clear existing ranges and write fresh data via batchUpdate
  const batchBody = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: 'Students!A1:Z',
        values: studentValues,
      },
      {
        range: 'Exams!A1:Z',
        values: examValues,
      },
      {
        range: 'Subjects!A1:Z',
        values: subjectValues,
      },
      {
        range: 'Teachers!A1:Z',
        values: teacherValues,
      },
      {
        range: 'Marks!A1:Z',
        values: marksRows,
      },
    ],
  };

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchBody),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to sync to Google Sheet: ${response.statusText}`);
  }
}

/**
 * Loads data from a user's Google Sheet if they choose to import or link their own spreadsheet.
 * Uses dynamic header inspection so columns can be in any order (e.g. RollNo, Class, Name, etc.).
 */
export async function loadDataFromGoogleSheet(
  accessToken: string,
  rawSpreadsheetId: string
): Promise<SheetImportResult> {
  const spreadsheetId = extractSpreadsheetId(rawSpreadsheetId);
  if (!spreadsheetId) {
    throw new Error('Please provide a valid Google Spreadsheet URL or ID.');
  }

  const fetchRange = async (range: string) => {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.values as (string | number)[][] | undefined;
  };

  const result: SheetImportResult = {};

  // 1. Fetch Students (A1:Z)
  const allStudentRows = await fetchRange('Students!A1:Z');
  if (allStudentRows && allStudentRows.length > 1) {
    const header = allStudentRows[0].map((h) => String(h || '').trim().toLowerCase());
    const dataRows = allStudentRows.slice(1);

    const rollIdx = header.findIndex((h) => h.includes('roll'));
    const classIdx = header.findIndex((h) => h === 'class' || h.includes('class'));
    const nameIdx = header.findIndex(
      (h) => (h === 'name' || h.includes('student') || h.includes('name')) && !h.includes('father') && !h.includes('mother')
    );
    const fatherIdx = header.findIndex((h) => h.includes('father'));
    const motherIdx = header.findIndex((h) => h.includes('mother'));
    const genderIdx = header.findIndex((h) => h.includes('gender') || h === 'sex');
    const dobIdx = header.findIndex((h) => h.includes('dob') || h.includes('birth'));
    const contactIdx = header.findIndex((h) => h.includes('mobile') || h.includes('contact') || h.includes('phone'));

    result.students = dataRows
      .filter((r) => r[rollIdx !== -1 ? rollIdx : 0])
      .map((r) => {
        const rollNo = String(r[rollIdx !== -1 ? rollIdx : 0]).trim();
        const name = nameIdx !== -1 && r[nameIdx] ? String(r[nameIdx]).trim() : `Student ${rollNo}`;
        const className = classIdx !== -1 && r[classIdx] ? String(r[classIdx]).trim() : '10A';
        const fatherName = fatherIdx !== -1 && r[fatherIdx] ? String(r[fatherIdx]).trim() : '';
        const motherName = motherIdx !== -1 && r[motherIdx] ? String(r[motherIdx]).trim() : undefined;
        const gender = genderIdx !== -1 && r[genderIdx] ? String(r[genderIdx]).trim() : undefined;
        const dateOfBirth = dobIdx !== -1 && r[dobIdx] ? String(r[dobIdx]).trim() : undefined;
        const contactNumber = contactIdx !== -1 && r[contactIdx] ? String(r[contactIdx]).trim() : undefined;

        return {
          rollNo,
          name,
          className,
          fatherName,
          motherName,
          gender,
          dateOfBirth,
          contactNumber,
        };
      });
  }

  // 2. Fetch Exams (A1:Z)
  const allExamRows = await fetchRange('Exams!A1:Z');
  if (allExamRows && allExamRows.length > 1) {
    const header = allExamRows[0].map((h) => String(h || '').trim().toLowerCase());
    const dataRows = allExamRows.slice(1);

    const idIdx = header.findIndex((h) => h.includes('examid') || (h.includes('exam') && h.includes('id')));
    const nameIdx = header.findIndex((h) => h.includes('examname') || (h.includes('exam') && h.includes('name')));
    const classIdx = header.findIndex((h) => h === 'class' || h.includes('class'));
    const maxMarksIdx = header.findIndex((h) => h.includes('max') || h.includes('marks'));
    const dateIdx = header.findIndex((h) => h.includes('date'));
    const yearIdx = header.findIndex((h) => h.includes('year') || h.includes('academic'));

    result.exams = dataRows
      .filter((r) => r[idIdx !== -1 ? idIdx : 0])
      .map((r) => {
        const examId = String(r[idIdx !== -1 ? idIdx : 0]).trim();
        const examName = nameIdx !== -1 && r[nameIdx] ? String(r[nameIdx]).trim() : examId;
        const className = classIdx !== -1 && r[classIdx] ? String(r[classIdx]).trim() : '10A';
        const maxMarks = maxMarksIdx !== -1 && Number(r[maxMarksIdx]) ? Number(r[maxMarksIdx]) : 100;
        const date = dateIdx !== -1 && r[dateIdx] ? String(r[dateIdx]).trim() : '';
        const academicYear = yearIdx !== -1 && r[yearIdx] ? String(r[yearIdx]).trim() : '2026-27';

        return {
          examId,
          examName,
          className,
          maxMarksPerSubject: maxMarks,
          date,
          academicYear,
        };
      });
  }

  // 3. Fetch Marks (A1:Z)
  const allMarksRows = await fetchRange('Marks!A1:Z');
  if (allMarksRows && allMarksRows.length > 1) {
    const headerRow = allMarksRows[0].map((h) => String(h || '').trim());
    const dataRows = allMarksRows.slice(1);

    const headerLower = headerRow.map((h) => h.toLowerCase());
    const examIdIdx = headerLower.findIndex((h) => h.includes('exam'));
    const rollNoIdx = headerLower.findIndex((h) => h.includes('roll'));
    const remarksIdx = headerLower.findIndex((h) => h.includes('remark'));

    const subjectsColIdx = headerLower.findIndex((h) => h === 'subjects' || h === 'subject');
    const marksColIdx = headerLower.findIndex(
      (h) => h === 'marksobtained' || h === 'marks obtained' || h === 'marks' || h === 'respectivemarks'
    );

    const ignoredHeaders = new Set([
      'examid',
      'rollno',
      'studentname',
      'name',
      'class',
      'subjects',
      'subject',
      'marksobtained',
      'marks obtained',
      'marks',
      'respectivemarks',
      'total',
      'totalmarks',
      'total marks',
      'maxtotal',
      'max total',
      'percentage',
      'percent',
      '%',
      'rank',
      'remarks',
    ]);

    result.marks = dataRows
      .filter((r) => (examIdIdx !== -1 ? r[examIdIdx] : r[0]) && (rollNoIdx !== -1 ? r[rollNoIdx] : r[1]))
      .map((r) => {
        const examId = String(examIdIdx !== -1 ? r[examIdIdx] : r[0]).trim();
        const rollNo = String(rollNoIdx !== -1 ? r[rollNoIdx] : r[1]).trim();
        const marksMap: { [key: string]: number } = {};

        // If stored as single-cell subjects and respective marks in adjacent cell
        if (subjectsColIdx !== -1 && marksColIdx !== -1) {
          const subArr = String(r[subjectsColIdx] || '')
            .split(/[,;\n]/)
            .map((s) => s.trim())
            .filter(Boolean);
          const marksArr = String(r[marksColIdx] || '')
            .split(/[,;\n]/)
            .map((s) => s.trim())
            .filter(Boolean);

          subArr.forEach((sName, i) => {
            const val = Number(marksArr[i] ?? 0);
            marksMap[sName] = isNaN(val) ? 0 : val;
          });
        } else {
          // Standard wide column layout (one column per subject)
          headerRow.forEach((colName, colIdx) => {
            const norm = colName.toLowerCase().replace(/\s+/g, '');
            if (!ignoredHeaders.has(colName.toLowerCase()) && !ignoredHeaders.has(norm)) {
              const raw = r[colIdx];
              const num = Number(raw ?? 0);
              if (!isNaN(num)) {
                marksMap[colName] = num;
              }
            }
          });
        }

        const remarks = remarksIdx !== -1 && r[remarksIdx] ? String(r[remarksIdx]).trim() : undefined;

        return {
          examId,
          rollNo,
          marks: marksMap,
          remarks,
        };
      });
  }

  // 4. Fetch Subjects (A1:B) if present
  const allSubjectRows = await fetchRange('Subjects!A1:B');
  if (allSubjectRows && allSubjectRows.length > 1) {
    const map: { [className: string]: string[] } = {};
    allSubjectRows.slice(1).forEach((r) => {
      if (r[0] && r[1]) {
        const cls = String(r[0]).trim();
        const list = String(r[1])
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (list.length > 0) {
          map[cls] = list;
        }
      }
    });
    if (Object.keys(map).length > 0) {
      result.subjectsMap = map;
    }
  }

  return result;
}
