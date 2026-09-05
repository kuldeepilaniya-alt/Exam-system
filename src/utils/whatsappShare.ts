import { ClassRankRow, StudentExamResult } from '../types';
import { SCHOOL_INFO, getDisplayClassName } from '../data/mockDatabase';
import { generateStudentMarksheetPDF } from './pdfGenerator';

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
 * Formats a comprehensive, professional WhatsApp scorecard message for a student
 */
export function formatStudentMarksheetWhatsAppMessage(
  result: StudentExamResult,
  schoolName: string = SCHOOL_INFO.name
): string {
  const { student, exam, subjects } = result;
  const className = getDisplayClassName(student.className);

  if (result.isUpcoming) {
    const subjectList = subjects.map((s) => `• *${s.name}*: (Max Marks: ${s.maxMarks})`).join('\n');

    return (
      `🏫 *${schoolName.toUpperCase()}*\n` +
      `⏳ *UPCOMING EXAMINATION NOTICE*\n` +
      `🎯 *Exam:* ${exam.examName.toUpperCase()} (${exam.academicYear || '2026-27'})\n` +
      `📅 *Date of Exam:* ${exam.date}\n` +
      `───────────────────────\n` +
      `👤 *Student Name:* ${student.name}\n` +
      `🆔 *Roll Number:* #${student.rollNo}\n` +
      `📚 *Class:* ${className}\n` +
      `👨‍👧 *Father's Name:* ${student.fatherName || 'N/A'}\n` +
      `───────────────────────\n` +
      `📋 *EXAMINATION SUBJECTS:*\n` +
      `${subjectList}\n` +
      `───────────────────────\n` +
      `🔔 *STATUS:* Upcoming / Examination Scheduled\n` +
      `• *Remarks:* "${result.remarks}"\n` +
      `───────────────────────\n` +
      `🌟 _Official Marksheet Document Issued by Govt. Sr. Sec. School, Sanwaloda Purohitan, Sikar (RBSE)_`
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

  return (
    `🏫 *${schoolName.toUpperCase()}*\n` +
    `📜 *OFFICIAL STUDENT MARKSHEET & PERFORMANCE REPORT*\n` +
    `🎯 *Exam:* ${exam.examName.toUpperCase()} (${exam.academicYear || '2026-27'})\n` +
    `───────────────────────\n` +
    `👤 *Student Name:* ${student.name}\n` +
    `🆔 *Roll Number:* #${student.rollNo}\n` +
    `📚 *Class:* ${className}\n` +
    `👨‍👧 *Father's Name:* ${student.fatherName || 'N/A'}\n` +
    `───────────────────────\n` +
    `📊 *SUBJECT-WISE MARKS:*\n` +
    `${subjectLines}\n` +
    `───────────────────────\n` +
    `🏆 *OVERALL EVALUATION:*\n` +
    `• *Total Marks:* ${result.totalObtainedMarks} / ${result.totalMaxMarks}\n` +
    `• *Percentage:* ${result.percentage}%\n` +
    `• *Class Rank:* #${result.rank} (out of ${result.totalStudentsInClass} students)\n` +
    `• *Status:* ${result.status === 'PASSED' ? '✅ PASSED' : '⚠️ NEEDS IMPROVEMENT'}\n` +
    `• *Teacher Remarks:* "${result.remarks}"\n` +
    `───────────────────────\n` +
    `📄 _Attached: 2-Page Official Marksheet & Term Progression PDF Document_\n` +
    `🌟 _Govt. Sr. Sec. School, Sanwaloda Purohitan, Sikar (RBSE)_`
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
  targetMobile?: string
): Promise<{ method: 'native-share' | 'download-and-web' }> {
  // Generate 2-Page PDF matching print design
  const { blob, file, filename } = await generateStudentMarksheetPDF(currentResult, allExamResults);
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
