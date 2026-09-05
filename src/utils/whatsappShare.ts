import { ClassRankRow, StudentExamResult } from '../types';
import { SCHOOL_INFO, getDisplayClassName } from '../data/mockDatabase';

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
      `🌟 _Issued by Govt Senior Secondary School, Piprali (RBSE)_`
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
    `📜 *OFFICIAL STUDENT MARKSHEET*\n` +
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
    `🌟 _Issued by Govt Senior Secondary School, Piprali (RBSE)_`
  );
}

/**
 * Opens WhatsApp to send student scorecard to their registered mobile number or general share
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
