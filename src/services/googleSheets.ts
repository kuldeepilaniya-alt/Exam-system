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

  // 1. Students Sheet
  const studentValues = [
    ['RollNo', 'Name', 'Class', 'FatherName', 'DateOfBirth', 'ContactNumber'],
    ...data.students.map((s) => [
      s.rollNo,
      s.name,
      s.className,
      s.fatherName,
      s.dateOfBirth || '',
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
    ['Email', 'Name', 'Mobile', 'PIN', 'AssignedClass', 'Role'],
    ...data.teachers.map((t) => [
      t.email || '',
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
    ...allKnownSubjects,
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

      const row = [
        exam.examId,
        r.rollNo,
        r.name,
        exam.className,
        ...allKnownSubjects.map((sub) => r.subjectMarks[sub] ?? 0),
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

    const ignoredHeaders = new Set([
      'examid',
      'rollno',
      'studentname',
      'name',
      'class',
      'total',
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
