import { ClassRankRow, StudentExamResult } from '../types';
import { SCHOOL_INFO, getDisplayClassName, normalizeClassName } from '../data/mockDatabase';
import { generateStudentMarksheetPDF } from './pdfGenerator';

/**
 * Returns ordinal string e.g. 1st, 2nd, 3rd, 4th, 11th, 21st
 */
export function getOrdinalRank(n: number): string {
  if (!n || n <= 0) return '-';
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) {
    return `${n}st`;
  }
  if (j === 2 && k !== 12) {
    return `${n}nd`;
  }
  if (j === 3 && k !== 13) {
    return `${n}rd`;
  }
  return `${n}th`;
}

/**
 * Formats class name for WhatsApp display
 * e.g., '12B' -> '12B (Agriculture)'
 */
export function getWhatsAppDisplayClassName(className: string): string {
  const norm = normalizeClassName(className);
  if (norm === '12B') return '12B (Agriculture)';
  if (norm === '12A') return '12A (Science)';
  if (norm === '12C') return '12C (Arts)';
  if (norm === '10A') return '10A';
  if (norm === '8A') return '8A';
  if (norm === '5A') return '5A';
  return getDisplayClassName(className).replace(/^Class\s+/i, '');
}

/**
 * Normalizes a phone number for WhatsApp wa.me links
 * e.g., "9876543210", "+91 98765 43210", "09876543210" -> "919876543210"
 */
export function normalizeWhatsAppNumber(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (!digitsOnly) return '';

  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `91${digitsOnly.slice(1)}`;
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return digitsOnly;
  }
  return digitsOnly;
}

/**
 * Formats student marksheet message matching standard WhatsApp notification format
 */
export function formatStudentMarksheetWhatsAppMessage(
  result: StudentExamResult,
  schoolName: string = SCHOOL_INFO.name,
  customDownloadBaseUrl: string = 'https://exam-system-xi-lime.vercel.app/?roll='
): string {
  const { student, exam, subjects } = result;
  const displayClass = getDisplayClassName(student.className);
  const studentRoll = student.rollNo.toString().trim();
  const directRollUrl = customDownloadBaseUrl.endsWith('=')
    ? `${customDownloadBaseUrl}${encodeURIComponent(studentRoll)}`
    : customDownloadBaseUrl;

  if (result.isUpcoming) {
    const subjectList = subjects
      .map((s) => `• *${s.name}*: (Max Marks: ${s.maxMarks})`)
      .join('\n');

    return (
      `🏫 *${schoolName.toUpperCase()}*\n` +
      `📜 *STUDENT MARKSHEET (UPCOMING)*\n` +
      `🎯 *Exam:* ${exam.examName.toUpperCase()} (${exam.academicYear || '2026-27'})\n` +
      `───────────────────────\n` +
      `👤 *Student Name:* ${student.name.toUpperCase()}\n` +
      `🆔 *Roll Number:* #${student.rollNo}\n` +
      `📚 *Class:* ${displayClass}\n` +
      `👨👧 *Father's Name:* ${student.fatherName ? student.fatherName.toUpperCase() : 'N/A'}\n` +
      `───────────────────────\n` +
      `📋 *EXAMINATION SUBJECTS:*\n` +
      `${subjectList}\n` +
      `───────────────────────\n` +
      `🔔 *STATUS:* Upcoming Examination Scheduled\n` +
      `• *Exam Date:* ${exam.date}\n` +
      `───────────────────────\n` +
      `📄 _Attached: Marksheet PDF_\n` +
      `${directRollUrl}`
    );
  }

  const subjectLines = subjects
    .map(
      (s) =>
        `• *${s.name}*: ${s.obtainedMarks}/${s.maxMarks} (${s.percentage}%) ${
          s.isPassing ? '✅ PASS' : '❌ FAIL'
        }`
    )
    .join('\n');

  const statusBadge =
    result.status === 'PASS' || result.status === 'PASSED'
      ? '✅ PASS'
      : result.status === 'GRACE' || result.status === 'COMPARTMENT'
      ? '⚠️ GRACE'
      : '❌ FAIL';

  return (
    `🏫 *${schoolName.toUpperCase()}*\n` +
    `📜 *STUDENT MARKSHEET*\n` +
    `🎯 *Exam:* ${exam.examName.toUpperCase()} (${exam.academicYear || '2026-27'})\n` +
    `───────────────────────\n` +
    `👤 *Student Name:* ${student.name.toUpperCase()}\n` +
    `🆔 *Roll Number:* #${student.rollNo}\n` +
    `📚 *Class:* ${displayClass}\n` +
    `👨👧 *Father's Name:* ${student.fatherName ? student.fatherName.toUpperCase() : 'N/A'}\n` +
    `───────────────────────\n` +
    `📊 *SUBJECT-WISE MARKS:*\n` +
    `${subjectLines}\n` +
    `───────────────────────\n` +
    `🏆 *OVERALL EVALUATION:*\n` +
    `• *Total Marks:* ${result.totalObtainedMarks} / ${result.totalMaxMarks}\n` +
    `• *Percentage:* ${result.percentage}%\n` +
    `• *Class Rank:* #${result.rank} (out of ${result.totalStudentsInClass} students)\n` +
    `• *Status:* ${statusBadge}\n` +
    `───────────────────────\n` +
    `📄 _Attached: Marksheet PDF_\n` +
    `${directRollUrl}`
  );
}

/**
 * Shares the student marksheet PDF directly on WhatsApp:
 * 1. Generates 2-Page Official PDF matching the print document
 * 2. Uses native Web Share API with attached PDF file on supported devices (Mobile Android/iOS)
 * 3. Fallback: Automatically downloads the PDF file and launches WhatsApp with the detailed scorecard summary
 */
export async function shareStudentMarksheetPDFOnWhatsApp(
  currentResult: StudentExamResult,
  allExamResults: StudentExamResult[],
  targetMobile?: string,
  classTeacherName: string = ''
): Promise<{ method: 'native-share' | 'download-and-web' }> {
  // Generate 2-Page PDF matching print design
  const { blob, file, filename } = await generateStudentMarksheetPDF(currentResult, allExamResults, classTeacherName);
  const message = formatStudentMarksheetWhatsAppMessage(currentResult);
  const cleanNumber = targetMobile ? normalizeWhatsAppNumber(targetMobile) : '';

  // 1. Check if Web Share API supports file sharing (Mobile Chrome/Safari/WhatsApp)
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `${currentResult.student.name} - Marksheet`,
        text: message,
      });
      return { method: 'native-share' };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User closed or cancelled native share sheet
        return { method: 'native-share' };
      }
      console.warn('Native file share failed, falling back to download and WhatsApp web:', err);
    }
  }

  // 2. Fallback for Desktop browsers or environments without file share support:
  // Auto-download the PDF
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  // Open WhatsApp with pre-filled message
  const encodedText = encodeURIComponent(message);
  let waUrl = '';
  if (cleanNumber) {
    waUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;
  } else {
    waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  window.open(waUrl, '_blank', 'noopener,noreferrer');
  return { method: 'download-and-web' };
}

/**
 * Text-only WhatsApp sharing
 */
export function shareStudentMarksheetOnWhatsApp(
  result: StudentExamResult,
  targetMobile?: string
): void {
  const message = formatStudentMarksheetWhatsAppMessage(result);
  const encodedText = encodeURIComponent(message);

  const cleanNumber = targetMobile ? normalizeWhatsAppNumber(targetMobile) : '';

  let url = '';
  if (cleanNumber) {
    url = `https://wa.me/${cleanNumber}?text=${encodedText}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Formats a structured WhatsApp message for the Class Merit List & Top Rankers
 */
export function formatClassMeritListWhatsAppMessage(
  examName: string,
  className: string,
  classRanks: ClassRankRow[],
  summary: { total: number; avg: number; topper: ClassRankRow | null; passRate: number },
  schoolName: string = SCHOOL_INFO.name
): string {
  const displayClass = getDisplayClassName(className);
  const topRankers = classRanks.slice(0, 10);

  const rankLines = topRankers
    .map((r) => {
      const badge =
        r.rank === 1 ? '🥇 Rank 1' : r.rank === 2 ? '🥈 Rank 2' : r.rank === 3 ? '🥉 Rank 3' : `🏅 Rank #${r.rank}`;
      return `${badge}: *${r.name}* (Roll #${r.rollNo})\n   ↳ Marks: *${r.totalObtained}* (${r.percentage}%)`;
    })
    .join('\n\n');

  return (
    `🏫 *${schoolName.toUpperCase()}*\n` +
    `🏆 *OFFICIAL CLASS MERIT LIST*\n` +
    `📚 *Class:* ${displayClass}  |  🎯 *Exam:* ${examName.toUpperCase()}\n` +
    `───────────────────────\n` +
    `📈 *CLASS OVERVIEW:*\n` +
    `• Total Students: *${summary.total}*\n` +
    `• Class Average: *${summary.avg}%*\n` +
    `• Passing Rate: *${summary.passRate}%*\n` +
    (summary.topper
      ? `• Class Topper: *${summary.topper.name}* (${summary.topper.percentage}%, Roll #${summary.topper.rollNo})\n`
      : '') +
    `───────────────────────\n` +
    `🌟 *TOP PERFORMERS MERIT LIST:*\n\n` +
    `${rankLines}\n` +
    `───────────────────────\n` +
    `✨ _Generated via School Result & Merit Portal — Session 2026-27_`
  );
}

/**
 * Opens WhatsApp to broadcast class rank & merit list to class WhatsApp groups
 */
export function shareClassMeritListOnWhatsApp(
  examName: string,
  className: string,
  classRanks: ClassRankRow[],
  summary: { total: number; avg: number; topper: ClassRankRow | null; passRate: number },
  targetMobile?: string
): void {
  const message = formatClassMeritListWhatsAppMessage(examName, className, classRanks, summary);
  const encodedText = encodeURIComponent(message);

  const cleanNumber = targetMobile ? normalizeWhatsAppNumber(targetMobile) : '';

  let url = '';
  if (cleanNumber) {
    url = `https://wa.me/${cleanNumber}?text=${encodedText}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Shares the Class Merit List PDF directly on WhatsApp
 */
export async function shareClassMeritListPDFOnWhatsApp(
  examName: string,
  className: string,
  classRanks: ClassRankRow[],
  subjects: string[],
  summaryMetrics: { total: number; avg: number; topper: ClassRankRow | null; passRate: number },
  targetMobile?: string,
  classTeacherName: string = ''
): Promise<{ method: 'native-share' | 'download-and-web' }> {
  // We need to import generateMeritListPDF. Wait, let's just do it directly.
  const { generateMeritListPDF } = await import('./pdfGenerator');
  const { blob, file, filename } = await generateMeritListPDF(examName, className, classRanks, subjects, summaryMetrics, classTeacherName);
  const message = formatClassMeritListWhatsAppMessage(examName, className, classRanks, summaryMetrics);
  const cleanNumber = targetMobile ? normalizeWhatsAppNumber(targetMobile) : '';

  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Merit List - ${className} - ${examName}`,
        text: message,
      });
      return { method: 'native-share' };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { method: 'native-share' };
      }
      console.warn('Native file share failed:', err);
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  const encodedText = encodeURIComponent(message);
  let waUrl = '';
  if (cleanNumber) {
    waUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;
  } else {
    waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  }
  window.open(waUrl, '_blank', 'noopener,noreferrer');
  return { method: 'download-and-web' };
}
