import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Code,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers,
  Link,
  MessageSquare,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Sheet,
  Sparkles,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import {
  ClassRankRow,
  Exam,
  GoogleSheetsSyncState,
  MarkRecord,
  Student,
  TeacherUser,
} from '../types';
import { calculateClassRanks, getStudentExamResult } from '../utils/rankCalculations';
import { downloadMeritListPDF, downloadStudentMarksheetPDF } from '../utils/pdfGenerator';
import {
  shareClassMeritListOnWhatsApp,
  shareStudentMarksheetOnWhatsApp,
  shareStudentMarksheetPDFOnWhatsApp,
} from '../utils/whatsappShare';
import { ConfirmationModal } from './ConfirmationModal';
import {
  buildSpreadsheetUrl,
  createMarksDbSpreadsheet,
  extractSpreadsheetId,
  loadDataFromGoogleSheet,
  syncDataToGoogleSheet,
} from '../services/googleSheets';
import {
  createDefaultExams,
  DEFAULT_SUBJECT_CONFIGS,
  generateAllSampleMarks,
  ORDERED_CLASSES,
  normalizeClassName,
  saveLinkedSheetId,
  saveLinkedSheetUrl,
  getStoredLinkedSheetUrl,
  getStoredWebAppUrl,
  saveStoredWebAppUrl,
  SCHOOL_INFO,
} from '../data/mockDatabase';
import { GOOGLE_APPS_SCRIPT_CODE } from '../data/googleAppsScriptCode';
import { GoogleSettingsModal } from './GoogleSettingsModal';
import { TeachersManager } from './TeachersManager';
import { StudentsManager } from './StudentsManager';
import { SubjectsManager } from './SubjectsManager';
import { ExamsManager } from './ExamsManager';
import { DEFAULT_TEACHERS, saveTeachers, saveStudents, saveExams } from '../data/mockDatabase';

export type ManagementTab = 'merit' | 'teachers' | 'students' | 'subjects' | 'exams';

interface TeacherDashboardProps {
  activeTeacher: TeacherUser;
  students: Student[];
  exams: Exam[];
  marks: MarkRecord[];
  subjectsMap: { [className: string]: string[] };
  googleSheetsState: GoogleSheetsSyncState;
  teachers?: TeacherUser[];
  onUpdateTeachers?: (newTeachers: TeacherUser[]) => void;
  onUpdateStudents?: (newStudents: Student[]) => void;
  onUpdateExams?: (newExams: Exam[]) => void;
  initialManagementTab?: ManagementTab;
  onUpdateMarks: (newMarks: MarkRecord[]) => void;
  onAddStudent: (newStudent: Student) => void;
  onAddExam: (newExam: Exam) => void;
  onDeleteExam?: (examId: string) => void;
  onDeleteStudentMarks?: (examId: string, rollNo: string) => void;
  onDeleteStudent?: (rollNo: string, className: string) => void;
  onOpenAddSubject?: () => void;
  onSaveSubjects?: (className: string, subjects: string[]) => void;
  onUpdateGoogleSheetsState: (state: Partial<GoogleSheetsSyncState>) => void;
  onViewStudentResult: (rollNo: string, examId: string) => void;
  onOpenGoogleAuth: () => void;
  googleAccessToken: string | null;
  onImportData?: (data: {
    students?: Student[];
    exams?: Exam[];
    marks?: MarkRecord[];
  }) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  activeTeacher,
  students,
  exams,
  marks,
  subjectsMap,
  googleSheetsState,
  teachers = DEFAULT_TEACHERS,
  onUpdateTeachers,
  onUpdateStudents,
  onUpdateExams,
  initialManagementTab = 'merit',
  onUpdateMarks,
  onAddStudent,
  onAddExam,
  onDeleteExam,
  onDeleteStudentMarks,
  onDeleteStudent,
  onOpenAddSubject,
  onSaveSubjects,
  onUpdateGoogleSheetsState,
  onViewStudentResult,
  onOpenGoogleAuth,
  googleAccessToken,
  onImportData,
}) => {
  const [activeManagementTab, setActiveManagementTab] = useState<ManagementTab>(initialManagementTab);

  const handleUpdateTeachersList = (updatedTeachers: TeacherUser[]) => {
    if (onUpdateTeachers) {
      onUpdateTeachers(updatedTeachers);
    } else {
      saveTeachers(updatedTeachers);
    }

    // Auto-sync teachers to Google Apps Script Web App if configured
    const activeUrl = webAppUrl || googleSheetsState.spreadsheetUrl || getStoredWebAppUrl();
    if (activeUrl && activeUrl.startsWith('https://script.google.com/')) {
      fetch(activeUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          students,
          exams,
          marks,
          subjectsMap,
          teachers: updatedTeachers,
        }),
      }).catch((e) => console.warn('Teacher background sync note:', e));
    }
  };

  const handleUpdateStudentsList = (updatedStudents: Student[]) => {
    if (onUpdateStudents) {
      onUpdateStudents(updatedStudents);
    } else if (onImportData) {
      onImportData({ students: updatedStudents });
    } else {
      saveStudents(updatedStudents);
    }
  };

  const handleUpdateExamsList = (updatedExams: Exam[]) => {
    if (onUpdateExams) {
      onUpdateExams(updatedExams);
    } else if (onImportData) {
      onImportData({ exams: updatedExams });
    } else {
      saveExams(updatedExams);
    }
  };
  // Available classes ordered strictly as per user-specified sequence
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    ORDERED_CLASSES.forEach((c) => set.add(c));
    exams.forEach((e) => set.add(e.className));
    students.forEach((s) => set.add(s.className));
    const list = Array.from(set);
    return list.sort((a, b) => {
      const idxA = ORDERED_CLASSES.indexOf(a as (typeof ORDERED_CLASSES)[number]);
      const idxB = ORDERED_CLASSES.indexOf(b as (typeof ORDERED_CLASSES)[number]);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [exams, students]);

  // Selected Class and Exam Filters
  const [selectedClass, setSelectedClass] = useState<string>(
    activeTeacher.assignedClass && activeTeacher.assignedClass !== 'All Classes'
      ? activeTeacher.assignedClass
      : ORDERED_CLASSES[0] || 'Class 10'
  );

  // Exams for selected class
  const classExams = useMemo(() => {
    return exams.filter(
      (e) => e.className.toLowerCase().trim() === selectedClass.toLowerCase().trim()
    );
  }, [exams, selectedClass]);

  const [selectedExamId, setSelectedExamId] = useState<string>(
    classExams[0]?.examId || '2026-10-HY'
  );

  // Active exam object
  const activeExam = useMemo(() => {
    const found = classExams.find((e) => e.examId === selectedExamId);
    return found || classExams[0] || null;
  }, [classExams, selectedExamId]);

  // Active subject list for selected class
  const subjects = useMemo(() => {
    return (
      subjectsMap[selectedClass] ||
      DEFAULT_SUBJECT_CONFIGS.find((c) => c.className === selectedClass)?.subjects || [
        'Hindi',
        'English',
        'Science',
        'Maths',
        'Social Science',
        'Sanskrit',
      ]
    );
  }, [subjectsMap, selectedClass]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'roll' | 'name' | 'total'>('rank');

  // Modal States
  const [isEditMarksModalOpen, setIsEditMarksModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editSubjectMarks, setEditSubjectMarks] = useState<{ [subject: string]: number }>({});
  const [editRemarks, setEditRemarks] = useState('');

  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newRollNo, setNewRollNo] = useState('');
  const [newName, setNewName] = useState('');
  const [newFatherName, setNewFatherName] = useState('');
  const [newContact, setNewContact] = useState('');

  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamMaxMarks, setNewExamMaxMarks] = useState(100);
  const [newExamDate, setNewExamDate] = useState(new Date().toISOString().split('T')[0]);

  // Google Sheets confirmation & settings modal state
  const [isConfirmSyncOpen, setIsConfirmSyncOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Targets for Deleting Exam or Student Test Marks
  const [deleteExamTarget, setDeleteExamTarget] = useState<Exam | null>(null);
  const [deleteMarksTarget, setDeleteMarksTarget] = useState<{ student: Student; exam: Exam } | null>(null);
  const [deleteStudentTarget, setDeleteStudentTarget] = useState<Student | null>(null);

  const handleConfirmDeleteExam = () => {
    if (!deleteExamTarget) return;
    const targetId = deleteExamTarget.examId;
    const targetName = deleteExamTarget.examName;

    if (onDeleteExam) {
      onDeleteExam(targetId);
    } else {
      const updatedMarks = marks.filter((m) => m.examId !== targetId);
      onUpdateMarks(updatedMarks);
    }

    const remaining = classExams.filter((e) => e.examId !== targetId);
    if (remaining.length > 0) {
      setSelectedExamId(remaining[0].examId);
    }

    setDeleteExamTarget(null);
    setSyncStatusMessage(`✓ Exam "${targetName}" and all associated student marks permanently deleted.`);
    setTimeout(() => setSyncStatusMessage(null), 4500);
  };

  const handleConfirmDeleteMarks = () => {
    if (!deleteMarksTarget) return;
    const { student, exam } = deleteMarksTarget;

    if (onDeleteStudentMarks) {
      onDeleteStudentMarks(exam.examId, student.rollNo);
    } else {
      const updated = marks.filter(
        (m) => !(m.examId === exam.examId && m.rollNo.toString().trim() === student.rollNo.toString().trim())
      );
      onUpdateMarks(updated);
    }

    setDeleteMarksTarget(null);
    setSyncStatusMessage(`✓ Cleared/deleted test marks for student ${student.name} in ${exam.examName}.`);
    setTimeout(() => setSyncStatusMessage(null), 4500);
  };

  const handleConfirmDeleteStudent = () => {
    if (!deleteStudentTarget) return;
    const { rollNo, name, className } = deleteStudentTarget;

    if (onDeleteStudent) {
      onDeleteStudent(rollNo, className);
    }

    setDeleteStudentTarget(null);
    setSyncStatusMessage(`✓ Student ${name} (Roll #${rollNo}) removed from class roster.`);
    setTimeout(() => setSyncStatusMessage(null), 4500);
  };

  // Stored URLs for Apps Script Web App and Google Sheet
  const [webAppUrl, setWebAppUrl] = useState<string>(
    () => getStoredWebAppUrl() || googleSheetsState.spreadsheetUrl || ''
  );
  const [linkedSheetUrl, setLinkedSheetUrl] = useState<string>(
    () => getStoredLinkedSheetUrl() || (googleSheetsState.spreadsheetId ? buildSpreadsheetUrl(googleSheetsState.spreadsheetId) : '')
  );

  const handleSaveGoogleSettings = (newSettings: { webAppUrl: string; sheetUrlOrId: string }) => {
    const cleanWeb = newSettings.webAppUrl.trim();
    const cleanSheet = newSettings.sheetUrlOrId.trim();

    setWebAppUrl(cleanWeb);
    saveStoredWebAppUrl(cleanWeb);

    setLinkedSheetUrl(cleanSheet);
    saveLinkedSheetUrl(cleanSheet);

    const sheetId = extractSpreadsheetId(cleanSheet);
    saveLinkedSheetId(sheetId);

    onUpdateGoogleSheetsState({
      spreadsheetUrl: cleanWeb || (sheetId ? buildSpreadsheetUrl(sheetId) : null),
      spreadsheetId: sheetId || cleanWeb,
      isConnected: Boolean(cleanWeb || sheetId),
      error: null,
    });

    setSyncStatusMessage('✓ Google Sheet & Webhook settings updated successfully.');
    setTimeout(() => setSyncStatusMessage(null), 4500);
  };


  // Compute Class Ranks using SOP Section 5 logic
  const rankedStudents = useMemo(() => {
    if (!activeExam) return [];
    return calculateClassRanks(students, activeExam, marks, subjects);
  }, [students, activeExam, marks, subjects]);

  // Filtered and sorted students for the table
  const displayedStudents = useMemo(() => {
    let result = [...rankedStudents];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q) ||
          s.fatherName.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'roll') {
      result.sort((a, b) => Number(a.rollNo) - Number(b.rollNo));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'total') {
      result.sort((a, b) => b.totalObtained - a.totalObtained);
    }
    // Default is already sorted by rank

    return result;
  }, [rankedStudents, searchQuery, sortBy]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    if (rankedStudents.length === 0) {
      return { total: 0, avg: 0, topper: null, passRate: 0, passedCount: 0 };
    }
    const total = rankedStudents.length;
    const totalPct = rankedStudents.reduce((acc, curr) => acc + curr.percentage, 0);
    const avg = Number((totalPct / total).toFixed(1));
    const topper = rankedStudents[0]; // first is highest total
    const passedCount = rankedStudents.filter((s) => s.status === 'PASSED').length;
    const passRate = Number(((passedCount / total) * 100).toFixed(1));

    return { total, avg, topper, passRate, passedCount };
  }, [rankedStudents]);

  // Handle Edit Marks
  const handleOpenEditMarks = (row: ClassRankRow) => {
    const student = students.find((s) => s.rollNo === row.rollNo);
    if (!student || !activeExam) return;

    setEditingStudent(student);
    const existingRecord = marks.find(
      (m) => m.examId === activeExam.examId && m.rollNo === student.rollNo
    );

    const initialMarks: { [subject: string]: number } = {};
    subjects.forEach((sub) => {
      initialMarks[sub] = existingRecord?.marks?.[sub] ?? 0;
    });

    setEditSubjectMarks(initialMarks);
    setEditRemarks(existingRecord?.remarks || '');
    setIsEditMarksModalOpen(true);
  };

  const handleSaveMarks = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !activeExam) return;

    // Filter out existing record
    const updated = marks.filter(
      (m) => !(m.examId === activeExam.examId && m.rollNo === editingStudent.rollNo)
    );

    updated.push({
      examId: activeExam.examId,
      rollNo: editingStudent.rollNo,
      marks: editSubjectMarks,
      remarks: editRemarks,
    });

    onUpdateMarks(updated);
    setIsEditMarksModalOpen(false);
  };

  // Handle Add Student
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRollNo.trim() || !newName.trim()) return;

    const newStudent: Student = {
      rollNo: newRollNo.trim(),
      name: newName.trim(),
      className: selectedClass,
      fatherName: newFatherName.trim() || 'Not Disclosed',
      contactNumber: newContact.trim() || undefined,
    };

    onAddStudent(newStudent);
    setNewRollNo('');
    setNewName('');
    setNewFatherName('');
    setNewContact('');
    setIsAddStudentModalOpen(false);
  };

  // Handle Add Exam
  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName.trim()) return;

    const examId = `${new Date().getFullYear()}-${selectedClass.replace(/\s+/g, '')}-${newExamName.replace(/\s+/g, '').slice(0, 4)}-${Date.now().toString().slice(-4)}`;
    const newExam: Exam = {
      examId,
      examName: newExamName.trim(),
      className: selectedClass,
      maxMarksPerSubject: Number(newExamMaxMarks) || 100,
      date: newExamDate,
      academicYear: '2026-27',
    };

    onAddExam(newExam);
    setSelectedExamId(examId);
    setNewExamName('');
    setIsAddExamModalOpen(false);
  };

  // Export CSV of Class Rankings
  const handleExportCSV = () => {
    if (!activeExam) return;

    const header = [
      'Rank',
      'Roll No',
      'Student Name',
      'Father Name',
      'Class',
      ...subjects,
      'Total Obtained',
      'Total Maximum',
      'Percentage',
      'Status',
    ];

    const rows = rankedStudents.map((r) => [
      r.rank,
      r.rollNo,
      `"${r.name}"`,
      `"${r.fatherName}"`,
      `"${selectedClass}"`,
      ...subjects.map((sub) => r.subjectMarks[sub] ?? 0),
      r.totalObtained,
      r.totalMax,
      `${r.percentage}%`,
      r.status,
    ]);

    const csvContent = [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${selectedClass.replace(/\s+/g, '_')}_${activeExam.examName.replace(/\s+/g, '_')}_RankList.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isGeneratingMeritPdf, setIsGeneratingMeritPdf] = useState(false);
  const [downloadingMarksheetRoll, setDownloadingMarksheetRoll] = useState<string | null>(null);

  const handleDownloadMeritPDF = async () => {
    if (!activeExam || rankedStudents.length === 0) return;
    setIsGeneratingMeritPdf(true);
    try {
      await downloadMeritListPDF(
        activeExam.examName,
        selectedClass,
        rankedStudents,
        subjects,
        summaryMetrics
      );
    } catch (err) {
      console.error('Error downloading merit list PDF:', err);
      alert('Failed to generate Merit List PDF. You can also use Print / PDF to save as PDF.');
    } finally {
      setIsGeneratingMeritPdf(false);
    }
  };

  const handleDownloadSingleStudentMarksheet = async (rollNo: string) => {
    if (!activeExam) return;
    const applicableExams = exams.filter(
      (e) => normalizeClassName(e.className) === normalizeClassName(selectedClass)
    );
    const currentResult = getStudentExamResult(
      rollNo,
      activeExam.examId,
      students,
      exams,
      marks,
      subjectsMap
    );
    if (!currentResult) {
      alert('Could not compute marksheet for this student.');
      return;
    }
    const allExamResults = applicableExams
      .map((e) =>
        getStudentExamResult(
          rollNo,
          e.examId,
          students,
          exams,
          marks,
          subjectsMap
        )
      )
      .filter((r): r is NonNullable<typeof r> => r !== null);

    setDownloadingMarksheetRoll(rollNo);
    try {
      await downloadStudentMarksheetPDF(currentResult, allExamResults);
    } catch (err) {
      console.error('Failed to download student marksheet PDF:', err);
      alert('Failed to generate student marksheet PDF.');
    } finally {
      setDownloadingMarksheetRoll(null);
    }
  };

  const handleShareMeritListWhatsApp = () => {
    if (!activeExam || rankedStudents.length === 0) return;
    shareClassMeritListOnWhatsApp(
      activeExam.examName,
      selectedClass,
      rankedStudents,
      summaryMetrics
    );
  };

  const handleShareSingleStudentMarksheetWhatsApp = async (rollNo: string) => {
    if (!activeExam) return;
    const currentResult = getStudentExamResult(
      rollNo,
      activeExam.examId,
      students,
      exams,
      marks,
      subjectsMap
    );
    if (!currentResult) {
      alert('Could not compute marksheet for this student.');
      return;
    }

    const applicableExams = exams.filter(
      (e) => e.className.toString().trim() === activeExam.className.toString().trim()
    );
    const allExamResults = applicableExams
      .map((exam) =>
        getStudentExamResult(rollNo, exam.examId, students, exams, marks, subjectsMap)
      )
      .filter((res): res is NonNullable<typeof res> => res !== null);

    const studentObj = students.find((s) => s.rollNo.toString().trim() === rollNo.toString().trim());
    
    try {
      await shareStudentMarksheetPDFOnWhatsApp(currentResult, allExamResults, studentObj?.contactNumber);
    } catch {
      shareStudentMarksheetOnWhatsApp(currentResult, studentObj?.contactNumber);
    }
  };

  // Auto Sync: Get student data from sheet, create complete sample marks, and auto-sync
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  const handleUpdateDataAndAutoSync = async () => {
    setIsAutoSyncing(true);
    setSyncStatusMessage(null);
    try {
      let currentStudents = [...students];
      let currentExams = [...exams];

      // If connected to Google Sheets, pull student data from sheet
      if (googleAccessToken && googleSheetsState.spreadsheetId) {
        try {
          const imported = await loadDataFromGoogleSheet(
            googleAccessToken,
            googleSheetsState.spreadsheetId
          );
          if (imported.students && imported.students.length > 0) {
            const mapByRoll = new Map<string, Student>();
            currentStudents.forEach((s) => mapByRoll.set(s.rollNo, s));
            imported.students.forEach((s) => mapByRoll.set(s.rollNo, s));
            currentStudents = Array.from(mapByRoll.values());
          }
        } catch (err) {
          console.warn('Could not read students from Google Sheets:', err);
        }
      }

      // Ensure all 8 exams per class exist (Rank Test 1-4 with 20 marks, Pre Board 1-4 with 80 marks)
      const defaultExams = createDefaultExams();
      const existingExamIds = new Set(currentExams.map((e) => e.examId));
      defaultExams.forEach((de) => {
        if (!existingExamIds.has(de.examId)) {
          currentExams.push(de);
        }
      });

      // Generate complete sample marks for every student and exam
      const freshMarks = generateAllSampleMarks(currentStudents, currentExams, subjectsMap);

      // Update state via onImportData or onUpdateMarks
      if (onImportData) {
        onImportData({
          students: currentStudents,
          exams: currentExams,
          marks: freshMarks,
        });
      } else {
        onUpdateMarks(freshMarks);
      }

      // If connected to Google Sheets, auto-sync everything to the sheet
      if (googleAccessToken && googleSheetsState.spreadsheetId) {
        await syncDataToGoogleSheet(
          googleAccessToken,
          googleSheetsState.spreadsheetId,
          {
            students: currentStudents,
            exams: currentExams,
            marks: freshMarks,
            subjectsMap,
            teachers: teachers,
          }
        );

        onUpdateGoogleSheetsState({
          isConnected: true,
          lastSyncedAt: new Date().toLocaleTimeString(),
          syncInProgress: false,
          error: null,
        });

        setSyncStatusMessage(
          '✓ Successfully auto-synced with Google Sheet! Updated student roster, generated full sample marks for Rank Tests 1-4 (20 marks) & Pre Boards 1-4 (80 marks), and pushed to cloud.'
        );
      } else {
        setSyncStatusMessage(
          '✓ Updated student data & created complete sample marks for all 8 exams across all classes. Click "Sync Sheets" to connect to Google Drive!'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncStatusMessage(`Update data error: ${msg}`);
    } finally {
      setIsAutoSyncing(false);
    }
  };

  // View Mode: 'merit' | 'subject-entry'
  const [dashboardViewMode, setDashboardViewMode] = useState<'merit' | 'subject-entry'>('merit');
  const [activeSubject, setActiveSubject] = useState<string>(subjects[0] || 'Hindi');

  // Keep activeSubject in sync when class changes
  useEffect(() => {
    if (subjects.length > 0 && !subjects.includes(activeSubject)) {
      setActiveSubject(subjects[0]);
    }
  }, [subjects, activeSubject]);

  // Students in selected class sorted by roll number
  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.className.toLowerCase().trim() === selectedClass.toLowerCase().trim())
      .sort((a, b) => Number(a.rollNo) - Number(b.rollNo));
  }, [students, selectedClass]);

  // Subject draft marks for all students in current class
  const [subjectDraftMarks, setSubjectDraftMarks] = useState<{ [rollNo: string]: number | string }>({});

  useEffect(() => {
    if (!activeExam) return;
    const draft: { [rollNo: string]: number | string } = {};
    classStudents.forEach((st) => {
      const rec = marks.find(
        (m) =>
          m.examId === activeExam.examId &&
          m.rollNo.toString().trim() === st.rollNo.toString().trim()
      );
      const val = rec?.marks?.[activeSubject];
      draft[st.rollNo] = val !== undefined && val !== null ? val : '';
    });
    setSubjectDraftMarks(draft);
  }, [activeExam, activeSubject, classStudents, marks]);

  const handleSubjectMarkChange = (rollNo: string, val: string) => {
    setSubjectDraftMarks((prev) => ({
      ...prev,
      [rollNo]: val,
    }));
  };

  const handleAutoFillSubjectSampleMarks = () => {
    if (!activeExam) return;
    const max = activeExam.maxMarksPerSubject;
    const draft: { [rollNo: string]: number | string } = {};
    classStudents.forEach((st, idx) => {
      const rollNum = parseInt(st.rollNo.replace(/\D/g, ''), 10) || 100;
      const basePct = Math.max(0.48, Math.min(0.98, 0.95 - idx * 0.045 + ((rollNum % 5) - 2) * 0.02));
      let score = Math.round(basePct * max);
      if (max === 20) score = Math.max(8, Math.min(20, score));
      if (max === 80) score = Math.max(28, Math.min(79, score));
      draft[st.rollNo] = score;
    });
    setSubjectDraftMarks(draft);
  };

  const handleSetAllSubjectFullMarks = () => {
    if (!activeExam) return;
    const max = activeExam.maxMarksPerSubject;
    const draft: { [rollNo: string]: number | string } = {};
    classStudents.forEach((st) => {
      draft[st.rollNo] = max;
    });
    setSubjectDraftMarks(draft);
  };

  const handleClearSubjectMarks = () => {
    const draft: { [rollNo: string]: number | string } = {};
    classStudents.forEach((st) => {
      draft[st.rollNo] = '';
    });
    setSubjectDraftMarks(draft);
  };

  const handleSubmitSubjectMarks = async () => {
    if (!activeExam) return;
    const max = activeExam.maxMarksPerSubject;

    const updatedMarks = [...marks];

    classStudents.forEach((st) => {
      const entered = subjectDraftMarks[st.rollNo];
      const numVal =
        entered === '' || entered === undefined
          ? 0
          : Math.max(0, Math.min(max, Number(entered)));

      const existingIdx = updatedMarks.findIndex(
        (m) =>
          m.examId === activeExam.examId &&
          m.rollNo.toString().trim() === st.rollNo.toString().trim()
      );

      if (existingIdx !== -1) {
        updatedMarks[existingIdx] = {
          ...updatedMarks[existingIdx],
          marks: {
            ...updatedMarks[existingIdx].marks,
            [activeSubject]: numVal,
          },
        };
      } else {
        updatedMarks.push({
          examId: activeExam.examId,
          rollNo: st.rollNo,
          marks: { [activeSubject]: numVal },
          remarks: 'Entered via Subject Marks Portal',
        });
      }
    });

    onUpdateMarks(updatedMarks);

    if (googleAccessToken && googleSheetsState.spreadsheetId) {
      try {
        await syncDataToGoogleSheet(
          googleAccessToken,
          googleSheetsState.spreadsheetId,
          {
            students,
            exams,
            marks: updatedMarks,
            subjectsMap,
            teachers: teachers,
          }
        );
        setSyncStatusMessage(
          `✓ Submitted & auto-synced marks for "${activeSubject}" across ${classStudents.length} students to Google Sheet!`
        );
      } catch {
        setSyncStatusMessage(
          `✓ Marks for "${activeSubject}" updated locally! (Google Sheet sync pending)`
        );
      }
    } else {
      setSyncStatusMessage(
        `✓ Successfully submitted and updated marks for "${activeSubject}" across all ${classStudents.length} students in ${activeExam.examName}! Class rankings updated.`
      );
    }
  };

  const handleNextSubject = () => {
    const currIdx = subjects.indexOf(activeSubject);
    if (currIdx !== -1 && currIdx < subjects.length - 1) {
      setActiveSubject(subjects[currIdx + 1]);
    } else {
      setActiveSubject(subjects[0]);
    }
  };

  // Sync to Google Sheets
  
  const handleInitiateGoogleSync = () => {
    const activeUrl = webAppUrl || googleSheetsState.spreadsheetUrl || getStoredWebAppUrl();
    if (!activeUrl || !activeUrl.startsWith('https://script.google.com/')) {
      setIsSettingsModalOpen(true);
      return;
    }
    setIsConfirmSyncOpen(true);
  };

  const handleExecuteGoogleSync = async () => {
    setIsSyncing(true);
    setSyncStatusMessage(null);
    try {
      const activeUrl = webAppUrl || googleSheetsState.spreadsheetUrl || getStoredWebAppUrl();
      if (!activeUrl) throw new Error('No Google Apps Script Web App URL configured. Please click Settings to configure it.');
      
      const payload = {
        students,
        exams,
        marks,
        subjectsMap,
        teachers,
      };

      await fetch(activeUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload)
      });

      // Also sync directly via Google Sheets API if accessToken exists
      if (googleAccessToken && googleSheetsState.spreadsheetId) {
        try {
          await syncDataToGoogleSheet(
            googleAccessToken,
            googleSheetsState.spreadsheetId,
            payload
          );
        } catch (apiErr) {
          console.warn('Direct Google Sheet API sync note:', apiErr);
        }
      }
      
      const timestamp = new Date().toLocaleTimeString();
      onUpdateGoogleSheetsState({
        isConnected: true,
        spreadsheetUrl: activeUrl,
        lastSyncedAt: timestamp,
        syncInProgress: false,
        error: null,
      });

      setSyncStatusMessage('✓ Successfully saved all database records (Students, Exams, Marks, Subjects & Teachers) to Google Sheets!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Webhook synchronization failed.';
      setSyncStatusMessage(`Sync error: ${msg}`);
      onUpdateGoogleSheetsState({ error: msg });
    } finally {
      setIsSyncing(false);
      setIsConfirmSyncOpen(false);
    }
  };


  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Top Header & Quick Actions - ALL HEADINGS AT THIS PLACE COLOR TO WHITE */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-xl text-white mb-6 print:hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white bg-white/15 px-3 py-1 rounded-full border border-white/20">
                Educator Gateway
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-white bg-emerald-600 px-3 py-1 rounded-full border border-emerald-500">
                Session 2026-27
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Teacher Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-white/90 font-medium">
              Welcome, <span className="text-white font-bold">{activeTeacher.name}</span>. Manage Student Examination Marks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="google-settings-top-btn"
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-white/20 transition"
              title="Google Apps Script & Sheet Settings"
            >
              <Settings className="h-4 w-4 text-emerald-400" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              id="google-sync-top-btn"
              onClick={handleInitiateGoogleSync}
              className="flex items-center gap-1.5 rounded-xl bg-white text-slate-900 px-4 py-2.5 text-xs font-black shadow-sm hover:bg-slate-100 active:scale-95 transition"
            >
              <Sheet className="h-4 w-4 text-emerald-600" />
              <span>Save Data to Database</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMessage && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 print:hidden">
          <span>{syncStatusMessage}</span>
          {googleSheetsState.spreadsheetUrl && (
            <a
              href={googleSheetsState.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold underline"
            >
              Open in Google Sheets <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {/* Primary Section Navigation Tabs */}
      <div className="mt-6 mb-6 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3.5 print:hidden">
        <button
          type="button"
          id="tab-merit-list"
          onClick={() => setActiveManagementTab('merit')}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition ${
            activeManagementTab === 'merit'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs'
          }`}
        >
          <Award className={`h-4 w-4 ${activeManagementTab === 'merit' ? 'text-amber-400' : 'text-slate-500'}`} />
          <span>Class Merit List &amp; Marks</span>
        </button>

        <button
          type="button"
          id="tab-teacher-management"
          onClick={() => setActiveManagementTab('teachers')}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition ${
            activeManagementTab === 'teachers'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs'
          }`}
        >
          <Users className={`h-4 w-4 ${activeManagementTab === 'teachers' ? 'text-white' : 'text-indigo-600'}`} />
          <span>Teacher Management</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
              activeManagementTab === 'teachers' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {teachers.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-students"
          onClick={() => setActiveManagementTab('students')}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition ${
            activeManagementTab === 'students'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs'
          }`}
        >
          <GraduationCap className={`h-4 w-4 ${activeManagementTab === 'students' ? 'text-white' : 'text-blue-600'}`} />
          <span>Students</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
              activeManagementTab === 'students' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {students.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-subjects"
          onClick={() => setActiveManagementTab('subjects')}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition ${
            activeManagementTab === 'subjects'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs'
          }`}
        >
          <BookOpen className={`h-4 w-4 ${activeManagementTab === 'subjects' ? 'text-white' : 'text-purple-600'}`} />
          <span>Subjects</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
              activeManagementTab === 'subjects' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {Object.keys(subjectsMap).length} Classes
          </span>
        </button>

        <button
          type="button"
          id="tab-exams"
          onClick={() => setActiveManagementTab('exams')}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition ${
            activeManagementTab === 'exams'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs'
          }`}
        >
          <Calendar className={`h-4 w-4 ${activeManagementTab === 'exams' ? 'text-white' : 'text-amber-600'}`} />
          <span>Exams</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
              activeManagementTab === 'exams' ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {exams.length}
          </span>
        </button>
      </div>

      {/* Render Active Management View */}
      {activeManagementTab === 'teachers' && (
        <TeachersManager
          teachers={teachers}
          activeTeacher={activeTeacher}
          onUpdateTeachers={handleUpdateTeachersList}
          onSaveToDatabase={handleInitiateGoogleSync}
          isSyncing={isSyncing}
        />
      )}

      {activeManagementTab === 'students' && (
        <StudentsManager
          students={students}
          marks={marks}
          exams={exams}
          subjectsMap={subjectsMap}
          onUpdateStudents={handleUpdateStudentsList}
          onViewStudentResult={onViewStudentResult}
          onSaveToDatabase={handleInitiateGoogleSync}
          activeExamId={activeExam?.examId}
        />
      )}

      {activeManagementTab === 'subjects' && (
        <SubjectsManager
          subjectsMap={subjectsMap}
          onSaveSubjects={onSaveSubjects || ((cls, subs) => {})}
          onSaveToDatabase={handleInitiateGoogleSync}
        />
      )}

      {activeManagementTab === 'exams' && (
        <ExamsManager
          exams={exams}
          students={students}
          marks={marks}
          subjectsMap={subjectsMap}
          onUpdateExams={handleUpdateExamsList}
          onDeleteExam={onDeleteExam}
          onSelectExamForGrading={(examId, cls) => {
            setSelectedClass(cls);
            setSelectedExamId(examId);
            setActiveManagementTab('merit');
          }}
          onSaveToDatabase={handleInitiateGoogleSync}
        />
      )}

      {activeManagementTab === 'merit' && (
        <>
          {/* Filters Bar: Class Selector & Examination Selector */}
          <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class:</span>
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {availableClasses.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  id={`class-select-${cls.replace(/\s+/g, '')}`}
                  onClick={() => setSelectedClass(cls)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    selectedClass === cls
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Exam Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exam:</span>
            <select
              id="exam-select-dropdown"
              value={activeExam?.examId || ''}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-xs focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
            >
              {classExams.map((exam) => (
                <option key={exam.examId} value={exam.examId}>
                  {exam.examName} (Max {exam.maxMarksPerSubject} marks/sub)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              id="table-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or roll..."
              className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-0.5">
            <ArrowDownUp className="h-3 w-3 text-slate-400 ml-1.5" />
            <select
              id="table-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rank' | 'roll' | 'name' | 'total')}
              className="bg-transparent py-1 px-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="rank">Sort by Rank</option>
              <option value="roll">Sort by Roll No</option>
              <option value="name">Sort by Name</option>
              <option value="total">Sort by Total Marks</option>
            </select>
          </div>

          <button
            type="button"
            id="export-csv-btn"
            onClick={handleExportCSV}
            title="Download CSV"
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            type="button"
            id="download-merit-list-pdf-btn"
            onClick={handleDownloadMeritPDF}
            disabled={isGeneratingMeritPdf || rankedStudents.length === 0}
            title="Download Class Merit List PDF Document"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-xs font-bold shadow-xs active:scale-95 transition disabled:opacity-60 cursor-pointer"
          >
            <Download className={`h-3.5 w-3.5 ${isGeneratingMeritPdf ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{isGeneratingMeritPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          <button
            type="button"
            id="share-merit-list-whatsapp-btn"
            onClick={handleShareMeritListWhatsApp}
            disabled={rankedStudents.length === 0}
            title="Share Class Rank & Merit List PDF Summary on WhatsApp"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold shadow-xs active:scale-95 transition disabled:opacity-60 cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share on WhatsApp</span>
          </button>

          <button
            type="button"
            id="print-merit-list-btn"
            onClick={() => window.print()}
            title="Print or Save as PDF"
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Banner */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 print:hidden">
        {/* Total Appeared */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Appeared</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
            {summaryMetrics.total}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{selectedClass} students</p>
        </div>

        {/* Class Average */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class Average</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-blue-600 font-mono">
            {summaryMetrics.avg}%
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Across {subjects.length} subjects</p>
        </div>

        {/* Class Topper */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class Topper</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-bold text-slate-900 truncate">
            {summaryMetrics.topper ? summaryMetrics.topper.name : 'N/A'}
          </div>
          <p className="mt-1 text-[11px] font-bold text-amber-600 font-mono">
            {summaryMetrics.topper ? `${summaryMetrics.topper.totalObtained} pts (${summaryMetrics.topper.percentage}%)` : '-'}
          </p>
        </div>

        {/* Pass Percentage */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pass Rate</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 font-mono">
            {summaryMetrics.passRate}%
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {summaryMetrics.passedCount} of {summaryMetrics.total} passed
          </p>
        </div>
      </div>

      {/* Class Merit List Table Header (Print Only) */}
      <div className="hidden print:block text-center mb-6">
        <h2 className="text-xl font-bold uppercase">{SCHOOL_INFO.name}</h2>
        <p className="text-xs text-slate-600">CLASS EXAMINATION MERIT LIST &amp; RANK STATEMENT • PRINCIPAL: {SCHOOL_INFO.principal.toUpperCase()}</p>
        <div className="mt-2 text-sm font-semibold">
          Class: {selectedClass} • Exam: {activeExam?.examName} • Date: {activeExam?.date}
        </div>
      </div>

      {/* View Switcher Tabs: Class Merit List vs Subject Marks Entry */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="tab-merit-list"
            onClick={() => setDashboardViewMode('merit')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
              dashboardViewMode === 'merit'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-950 hover:bg-slate-200'
            }`}
          >
            <Award className="h-4 w-4 text-amber-400" />
            <span>Class Merit Ranking List</span>
          </button>

          <button
            type="button"
            id="tab-subject-entry"
            onClick={() => setDashboardViewMode('subject-entry')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
              dashboardViewMode === 'subject-entry'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                : 'bg-slate-100 text-slate-600 hover:text-slate-950 hover:bg-slate-200'
            }`}
          >
            <Edit3 className="h-4 w-4 text-blue-300" />
            <span>Fill Marks by Subject Selection</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800">
              {subjects.length} Subjects
            </span>
          </button>
        </div>

        {dashboardViewMode === 'subject-entry' && (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Selected Subject:</span>
            <span className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-1 font-black text-blue-700">
              {activeSubject} ({activeExam?.maxMarksPerSubject || 100} Marks)
            </span>
          </div>
        )}
      </div>

      {dashboardViewMode === 'subject-entry' ? (
        /* Subject-wise Marks Entry Panel */
        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 print:hidden">
          {/* Header of Subject Entry */}
          <div className="border-b border-slate-800 bg-slate-900 p-6 text-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                    Subject Portal
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    {selectedClass} • {activeExam?.examName}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
                  Fill Marks for &ldquo;{activeSubject}&rdquo;
                </h2>
                <p className="mt-1 text-xs text-slate-300">
                  Total maximum: <span className="font-extrabold text-white">{activeExam?.maxMarksPerSubject || 100} Marks</span> per student. Fill or edit marks below, then submit to auto-update class merit ranks.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSubmitSubjectMarks}
                id="submit-subject-marks-top-btn"
                className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow-md active:scale-95 transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Update &ldquo;{activeSubject}&rdquo; Marks</span>
              </button>
            </div>

            {/* Subject Selector Buttons (Chips) */}
            <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mr-1">
                Select Subject:
              </span>
              {subjects.map((sub) => {
                const filledCount = classStudents.filter((st) => {
                  const m = marks.find(
                    (rec) =>
                      rec.examId === activeExam?.examId &&
                      rec.rollNo.toString().trim() === st.rollNo.toString().trim()
                  );
                  return m?.marks?.[sub] !== undefined && m?.marks?.[sub] !== null;
                }).length;

                const isCurrent = activeSubject === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    id={`subject-tab-${sub.replace(/\s+/g, '')}`}
                    onClick={() => setActiveSubject(sub)}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{sub}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                        isCurrent ? 'bg-blue-700 text-white' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {filledCount}/{classStudents.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Helper Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-6 py-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <Users className="h-4 w-4 text-blue-600" />
              <span>All {classStudents.length} Students in {selectedClass}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAutoFillSubjectSampleMarks}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Auto-fill Sample Marks</span>
              </button>

              <button
                type="button"
                onClick={handleSetAllSubjectFullMarks}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              >
                <span>Set Full Marks ({activeExam?.maxMarksPerSubject})</span>
              </button>

              <button
                type="button"
                onClick={handleClearSubjectMarks}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition shadow-2xs"
              >
                <span>Clear Column</span>
              </button>
            </div>
          </div>

          {/* Table of all students for the selected subject */}
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="py-3.5 px-4 text-center">#</th>
                  <th className="py-3.5 px-4">Roll No</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4 hidden sm:table-cell print:table-cell">Father Name</th>
                  <th className="py-3.5 px-4 text-center">Saved Score</th>
                  <th className="py-3.5 px-6 text-center">
                    Enter Marks (Max {activeExam?.maxMarksPerSubject || 100})
                  </th>
                  <th className="py-3.5 px-4 text-center">Result Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((st, idx) => {
                  const rawVal = subjectDraftMarks[st.rollNo];
                  const numVal =
                    rawVal === '' || rawVal === undefined ? null : Number(rawVal);
                  const maxMarks = activeExam?.maxMarksPerSubject || 100;
                  const isPassing =
                    numVal !== null ? (numVal / maxMarks) * 100 >= 33 : true;
                  const isInvalid =
                    numVal !== null && (numVal < 0 || numVal > maxMarks);

                  const prevRec = marks.find(
                    (m) =>
                      m.examId === activeExam?.examId &&
                      m.rollNo.toString().trim() === st.rollNo.toString().trim()
                  );
                  const prevMark = prevRec?.marks?.[activeSubject];

                  return (
                    <tr key={st.rollNo} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400 text-center">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {st.rollNo}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {st.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 hidden sm:table-cell print:table-cell whitespace-nowrap">
                        {st.fatherName}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">
                        {prevMark !== undefined ? `${prevMark} / ${maxMarks}` : '-'}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            step="0.5"
                            id={`subject-input-${st.rollNo}`}
                            value={rawVal ?? ''}
                            onChange={(e) =>
                              handleSubjectMarkChange(st.rollNo, e.target.value)
                            }
                            placeholder="0"
                            className={`w-24 rounded-xl border px-3 py-1.5 text-center font-mono text-sm font-bold shadow-xs focus:ring-4 focus:outline-hidden transition ${
                              isInvalid
                                ? 'border-rose-500 bg-rose-50 text-rose-700 focus:ring-rose-500/20'
                                : numVal !== null && !isPassing
                                ? 'border-amber-400 bg-amber-50 text-amber-900 focus:ring-amber-500/20'
                                : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-blue-500/10'
                            }`}
                          />
                          <span className="font-mono text-xs text-slate-400 font-semibold">
                            / {maxMarks}
                          </span>
                        </div>
                        {isInvalid && (
                          <div className="text-[10px] text-rose-600 font-bold mt-1">
                            Must be 0 - {maxMarks}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {numVal === null ? (
                          <span className="text-xs text-slate-400 font-medium">Pending</span>
                        ) : isPassing ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                            Pass ({((numVal / maxMarks) * 100).toFixed(0)}%)
                          </span>
                        ) : (
                          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                            Needs Imp.
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Submit Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div className="text-xs text-slate-500">
              Ready to submit? Click <b>Submit &amp; Update Marks</b> to update {activeSubject} marks for all {classStudents.length} students.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSubmitSubjectMarks}
                id="submit-subject-marks-bottom-btn"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-extrabold text-white shadow-md active:scale-95 transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Update &ldquo;{activeSubject}&rdquo; Marks</span>
              </button>
              <button
                type="button"
                onClick={handleNextSubject}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Next Subject →
              </button>              
            </div>
          </div>
        </div>
      ) : (
        /* Class Rankings Table */
        <div className="mt-4 overflow-hidden print:overflow-visible print:border-none print:shadow-none rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            <h3 className="font-extrabold text-slate-900 tracking-tight">
              Students Rank List
            </h3>
            <span className="text-xs font-bold text-slate-400">
              ({displayedStudents.length} Students)
            </span>
          </div>

          <div className="text-[11px] font-bold text-slate-400 hidden sm:block uppercase tracking-wider">
            (RBSE)
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-3">Roll No</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-3 hidden lg:table-cell print:table-cell">Father Name</th>
                {subjects.map((sub) => (
                  <th key={sub} className="py-3.5 px-2.5 text-center font-bold">
                    {sub}
                  </th>
                ))}
                <th className="py-3.5 px-3 text-center">Total</th>
                <th className="py-3.5 px-3 text-center">%</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={10 + subjects.length} className="py-12 text-center text-slate-400 font-medium">
                    No student records found for this criteria.
                  </td>
                </tr>
              ) : (
                displayedStudents.map((row) => {
                  return (
                    <tr
                      key={row.rollNo}
                      className="hover:bg-slate-50/80 transition"
                    >
                      {/* Rank Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {row.rank === 1 ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 font-black text-amber-950 shadow-xs ring-2 ring-amber-200">
                            1
                          </span>
                        ) : row.rank === 2 ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 font-black text-slate-800 shadow-xs ring-2 ring-slate-300">
                            2
                          </span>
                        ) : row.rank === 3 ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-700 font-black text-white shadow-xs ring-2 ring-amber-600/30">
                            3
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-slate-500">
                            #{row.rank}
                          </span>
                        )}
                      </td>

                      {/* Roll No */}
                      <td className="py-3.5 px-3 font-mono font-bold text-blue-600">
                        {row.rollNo}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {row.name}
                        {row.rank === 1 && (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800">
                            Topper
                          </span>
                        )}
                      </td>

                      {/* Father Name */}
                      <td className="py-3.5 px-3 text-xs font-medium text-slate-500 hidden lg:table-cell print:table-cell whitespace-nowrap">
                        {row.fatherName}
                      </td>

                      {/* Subject Marks */}
                      {subjects.map((sub) => {
                        const markVal = row.subjectMarks[sub];
                        const isPassing = markVal !== undefined ? (markVal / (activeExam?.maxMarksPerSubject || 100)) * 100 >= 33 : true;
                        return (
                          <td
                            key={sub}
                            className={`py-3.5 px-2.5 text-center font-mono text-xs ${
                              !isPassing ? 'font-bold text-rose-600' : 'font-medium text-slate-700'
                            }`}
                          >
                            {markVal !== undefined ? markVal : '-'}
                          </td>
                        );
                      })}

                      {/* Total Marks */}
                      <td className="py-3.5 px-3 text-center font-mono font-extrabold text-slate-900">
                        {row.totalObtained}
                        <span className="text-[10px] font-normal text-slate-400">/{row.totalMax}</span>
                      </td>

                      {/* Percentage */}
                      <td className="py-3.5 px-3 text-center font-mono font-extrabold text-emerald-600">
                        {row.percentage}%
                      </td>

                     

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-black uppercase tracking-tight ${
                            row.status === 'PASSED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.status === 'COMPARTMENT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right print:hidden whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            id={`download-student-marksheet-${row.rollNo}`}
                            onClick={() => handleDownloadSingleStudentMarksheet(row.rollNo)}
                            disabled={downloadingMarksheetRoll === row.rollNo}
                            title="Download 2-Page A4 Marksheet PDF for this student"
                            className="flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/70 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition disabled:opacity-50 cursor-pointer"
                          >
                            <FileText className={`h-3 w-3 ${downloadingMarksheetRoll === row.rollNo ? 'animate-bounce' : ''}`} />
                            <span className="hidden md:inline">{downloadingMarksheetRoll === row.rollNo ? 'PDF...' : 'Marksheet'}</span>
                          </button>

                          <button
                            type="button"
                            id={`share-student-whatsapp-${row.rollNo}`}
                            onClick={() => handleShareSingleStudentMarksheetWhatsApp(row.rollNo)}
                            title="Share Marksheet on WhatsApp (to student's mobile number)"
                            className="flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                          >
                            <MessageSquare className="h-3 w-3 text-emerald-600" />
                            <span className="hidden md:inline">WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditMarks(row)}
                            title="Edit marks for this student"
                            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3 text-slate-500" />
                            <span>Edit</span>
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
      )}

      {/* Google Sheets Integration Card */}
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm print:hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Sheet className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 tracking-tight">
                  Google Sheets Database Synchronization
                </h3>
                {webAppUrl ? (
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                    Connected
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                    Setup Required
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 max-w-xl mt-0.5">
                Maintains 5 sheets (<b>Students</b>, <b>Exams</b>, <b>Marks</b>, <b>Subjects</b>, <b>Teachers</b>) directly your Google Sheets. </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="google-settings-card-btn"
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition"
              title="Configure Google Apps Script & Sheet Settings"
            >
              <Settings className="h-4 w-4 text-slate-600" />
              <span>Settings</span>
            </button>

            {linkedSheetUrl && (
              <a
                href={linkedSheetUrl.startsWith('http') ? linkedSheetUrl : buildSpreadsheetUrl(linkedSheetUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <span>Open Sheet</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </a>
            )}

            <button
              type="button"
              id="google-sync-card-btn"
              onClick={handleInitiateGoogleSync}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Save Data to Database</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-600">
              <span className={`inline-block h-2 w-2 rounded-full ${webAppUrl ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              Webhook: {webAppUrl ? 'Configured' : 'Not set (Click Settings)'}
            </span>
            {linkedSheetUrl && (
              <span className="text-[11px] font-mono text-slate-400">
                Sheet: {extractSpreadsheetId(linkedSheetUrl).substring(0, 16)}...
              </span>
            )}
          </div>

          {googleSheetsState.lastSyncedAt && (
            <span className="text-[11px] text-slate-400">
              Last synced at {googleSheetsState.lastSyncedAt}
            </span>
          )}
        </div>
      </div>
      </>
      )}

      {/* Edit Marks Modal */}
      {isEditMarksModalOpen && editingStudent && activeExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Enter / Update Marks
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingStudent.name} (Roll #{editingStudent.rollNo}) — {activeExam.examName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditMarksModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMarks} className="mt-4 space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                {subjects.map((sub) => (
                  <div key={sub} className="flex items-center justify-between gap-4">
                    <label className="text-xs font-bold text-slate-700 flex-1">
                      {sub} <span className="text-[10px] text-slate-400 font-normal">(Max: {activeExam.maxMarksPerSubject})</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={activeExam.maxMarksPerSubject}
                      value={editSubjectMarks[sub] ?? 0}
                      onChange={(e) => {
                        const val = Math.min(
                          activeExam.maxMarksPerSubject,
                          Math.max(0, Number(e.target.value))
                        );
                        setEditSubjectMarks({ ...editSubjectMarks, [sub]: val });
                      }}
                      className="w-24 rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-center font-mono text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Teacher Remarks / Comments
                </label>
                <input
                  type="text"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="e.g. Excellent conceptual clarity, consistent focus"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditMarksModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-marks-btn"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  Save &amp; Recalculate Class Ranks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Add New Student ({selectedClass})
              </h3>
              <button
                type="button"
                onClick={() => setIsAddStudentModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Roll Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 109"
                  value={newRollNo}
                  onChange={(e) => setNewRollNo(e.target.value)}
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
                  placeholder="e.g. Meera Kapoor"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Father&apos;s Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anand Kapoor"
                  value={newFatherName}
                  onChange={(e) => setNewFatherName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Contact Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9870001009"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
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
      )}

      {/* Add Exam Modal */}
      {isAddExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Create New Examination ({selectedClass} • Session 2026-27)
              </h3>
              <button
                type="button"
                onClick={() => setIsAddExamModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Examination Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pre-Board Examination"
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Max Marks per Subject
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  max={200}
                  value={newExamMaxMarks}
                  onChange={(e) => setNewExamMaxMarks(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Exam Date
                </label>
                <input
                  type="date"
                  required
                  value={newExamDate}
                  onChange={(e) => setNewExamDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddExamModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="confirm-add-exam-btn"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  Create Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Apps Script & Sheet Settings Modal */}
      <GoogleSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        webAppUrl={webAppUrl}
        sheetUrlOrId={linkedSheetUrl}
        onSaveSettings={handleSaveGoogleSettings}
        onTriggerSync={handleInitiateGoogleSync}
        isSyncing={isSyncing}
        lastSyncedAt={googleSheetsState.lastSyncedAt}
      />

      {/* Confirmation Modal for Google Sheets Sync */}
      <ConfirmationModal
        isOpen={isConfirmSyncOpen}
        title="Save Data on Google Sheets?"
        message={`This will update the 5 database sheets (Students: ${students.length} records, Exams: ${exams.length} exams, Marks: ${marks.length} entries, Subjects, and Teachers) in your Google Drive. Existing sheet contents will be refreshed with current data.`}
        confirmLabel="Update Data"
        cancelLabel="Cancel"
        isLoading={isSyncing}
        onConfirm={handleExecuteGoogleSync}
        onCancel={() => setIsConfirmSyncOpen(false)}
      />
    </div>
  );
};
