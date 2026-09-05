import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ClassRankRow, StudentExamResult } from '../types';
import { SCHOOL_INFO, getDisplayClassName } from '../data/mockDatabase';

export interface GeneratedPDFResult {
  doc: jsPDF;
  blob: Blob;
  file: File;
  filename: string;
}

/**
 * Generates the official 2-Page A4 PDF Marksheet:
 * Page 1: Official Statement of Marks (Header, Student Box, Highlights, Subject Breakdown with Grade, Remarks, Signatures, Footer)
 * Page 2: Term-by-Term Examination Performance & Progression Report (Header, Summary Pill, 1. Cards, 2. Complete Trajectory Table, 3. Subject-wise Summary, Advice Box, Signatures, Footer)
 */
export async function generateStudentMarksheetPDF(
  currentResult: StudentExamResult,
  allExamResults: StudentExamResult[]
): Promise<GeneratedPDFResult> {
  const { student, exam } = currentResult;
  const studentClass = getDisplayClassName(student.className);
  const nowStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Create temporary container for high-res offscreen rendering
  const container = document.createElement('div');
  container.id = 'pdf-render-container';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // 210mm at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  container.style.color = '#0f172a';
  container.style.zIndex = '-1000';

  // ==========================================
  // PAGE 1: STATEMENT OF MARKS (210mm x 297mm)
  // ==========================================
  const page1 = document.createElement('div');
  page1.style.width = '794px';
  page1.style.height = '1120px'; // Exact A4 height at 96 DPI
  page1.style.maxHeight = '1120px';
  page1.style.boxSizing = 'border-box';
  page1.style.padding = '36px 40px';
  page1.style.backgroundColor = '#ffffff';
  page1.style.display = 'flex';
  page1.style.flexDirection = 'column';
  page1.style.justifyContent = 'space-between';

  page1.innerHTML = `
    <div>
      <!-- School Header -->
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <h1 style="font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0; color: #0f172a; letter-spacing: -0.01em; line-height: 1.2; text-align: center;">
          ${SCHOOL_INFO.name}
        </h1>
        <p style="font-size: 10.5px; font-weight: 700; color: #475569; text-transform: uppercase; margin: 4px 0 0 0; letter-spacing: 0.05em; line-height: 1.2; text-align: center;">
          Affiliated to Board of Secondary Education, Rajasthan (RBSE)
        </p>
        <div style="margin-top: 8px; display: inline-flex; align-items: center; justify-content: center; height: 26px; line-height: 1; vertical-align: middle; background-color: ${
          currentResult.isUpcoming ? '#fef3c7' : '#ecfdf5'
        }; color: ${currentResult.isUpcoming ? '#92400e' : '#065f46'}; border: 1px solid ${
          currentResult.isUpcoming ? '#fde68a' : '#a7f3d0'
        }; padding: 0 16px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">
          ${currentResult.isUpcoming ? 'UPCOMING' : 'STATEMENT OF MARKS'} — ${exam.examName.toUpperCase()} • SESSION 2026-27
        </div>
      </div>

      <!-- Student Metadata Box (4 Columns) -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #cbd5e1; border-radius: 10px; background-color: #f8fafc; margin-bottom: 16px; overflow: hidden;">
        <div style="padding: 10px 12px; text-align: center; border-right: 1px solid #cbd5e1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Class &amp; Section</div>
          <div style="font-size: 13.5px; font-weight: 700; color: #0f172a; margin-top: 3px; line-height: 1.2;">${studentClass}</div>
        </div>
        <div style="padding: 10px 12px; text-align: center; border-right: 1px solid #cbd5e1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Roll Number</div>
          <div style="font-size: 14px; font-weight: 800; color: #2563eb; margin-top: 3px; font-family: monospace; line-height: 1.2;">#${student.rollNo}</div>
        </div>
        <div style="padding: 10px 12px; text-align: center; border-right: 1px solid #cbd5e1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Student Name</div>
          <div style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin-top: 3px; line-height: 1.2;">${student.name}</div>
        </div>
        <div style="padding: 10px 12px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Father's Name</div>
          <div style="font-size: 13.5px; font-weight: 700; color: #0f172a; margin-top: 3px; line-height: 1.2;">${student.fatherName || 'N/A'}</div>
        </div>
      </div>

      <!-- Highlights Banner (Total, %, Rank, Status) -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #cbd5e1; border-radius: 10px; background-color: #ffffff; margin-bottom: 20px; overflow: hidden;">
        <div style="padding: 12px 10px; text-align: center; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; line-height: 1.2;">Total Marks</div>
          <div style="font-size: 19px; font-weight: 800; color: #0f172a; margin-top: 4px; font-family: monospace; line-height: 1.2; display: flex; align-items: baseline; justify-content: center; gap: 4px;">
            ${
              currentResult.isUpcoming
                ? `<span style="color: #94a3b8;">-</span> <span style="font-size: 11px; font-weight: 400; color: #64748b;">/ ${currentResult.totalMaxMarks}</span>`
                : `${currentResult.totalObtainedMarks} <span style="font-size: 11px; font-weight: 400; color: #64748b;">/ ${currentResult.totalMaxMarks}</span>`
            }
          </div>
        </div>
        <div style="padding: 12px 10px; text-align: center; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; line-height: 1.2;">Percentage</div>
          <div style="font-size: 19px; font-weight: 800; color: #059669; margin-top: 4px; font-family: monospace; line-height: 1.2;">
            ${currentResult.isUpcoming ? '<span style="color: #94a3b8;">-</span>' : `${currentResult.percentage}%`}
          </div>
        </div>
        <div style="padding: 12px 10px; text-align: center; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; line-height: 1.2;">Class Rank</div>
          <div style="font-size: 19px; font-weight: 800; color: #0f172a; margin-top: 4px; line-height: 1.2; display: flex; align-items: baseline; justify-content: center; gap: 4px;">
            ${
              currentResult.isUpcoming
                ? '<span style="font-size: 13px; font-weight: 700; color: #94a3b8;">Upcoming</span>'
                : `${currentResult.rank} <span style="font-size: 11px; font-weight: 400; color: #64748b;">/ ${currentResult.totalStudentsInClass}</span>`
            }
          </div>
        </div>
        <div style="padding: 12px 10px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; line-height: 1.2;">Result Status</div>
          <div style="margin-top: 4px; display: flex; align-items: center; justify-content: center;">
            <span style="display: inline-flex; align-items: center; justify-content: center; height: 24px; padding: 0 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; line-height: 1; vertical-align: middle; background-color: ${
              currentResult.isUpcoming ? '#fef3c7' : currentResult.status === 'PASSED' ? '#dcfce7' : '#fee2e2'
            }; color: ${
              currentResult.isUpcoming ? '#92400e' : currentResult.status === 'PASSED' ? '#166534' : '#991b1b'
            }; border: ${currentResult.isUpcoming ? '1px solid #fde68a' : 'none'};">
              ${currentResult.isUpcoming ? 'Upcoming' : currentResult.status}
            </span>
          </div>
        </div>
      </div>

      <!-- Subject Table (Statement of Marks) -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 11px;">
        <thead>
          <tr style="background-color: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; text-transform: uppercase; font-size: 9.5px; font-weight: 800; color: #475569;">
            <th style="padding: 8px 10px; text-align: center; vertical-align: middle; width: 40px; border: 1px solid #cbd5e1;">#</th>
            <th style="padding: 8px 12px; text-align: left; vertical-align: middle; border: 1px solid #cbd5e1;">Subject Name</th>
            <th style="padding: 8px 10px; text-align: center; vertical-align: middle; border: 1px solid #cbd5e1; width: 100px;">Max Marks</th>
            <th style="padding: 8px 10px; text-align: center; vertical-align: middle; border: 1px solid #cbd5e1; width: 120px;">Marks Obtained</th>
            <th style="padding: 8px 10px; text-align: center; vertical-align: middle; border: 1px solid #cbd5e1; width: 105px;">Percentage</th>
            <th style="padding: 8px 12px; text-align: right; vertical-align: middle; border: 1px solid #cbd5e1; width: 95px;">Result</th>
          </tr>
        </thead>
        <tbody>
          ${currentResult.subjects
            .map(
              (sub, idx) => `
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td style="padding: 7px 10px; text-align: center; vertical-align: middle; color: #64748b; font-family: monospace; border: 1px solid #cbd5e1;">${idx + 1}</td>
              <td style="padding: 7px 12px; text-align: left; vertical-align: middle; font-weight: 700; color: #0f172a; border: 1px solid #cbd5e1;">${sub.name}</td>
              <td style="padding: 7px 10px; text-align: center; vertical-align: middle; color: #475569; font-family: monospace; border: 1px solid #cbd5e1;">${sub.maxMarks}</td>
              <td style="padding: 7px 10px; text-align: center; vertical-align: middle; font-weight: 800; color: #0f172a; font-family: monospace; border: 1px solid #cbd5e1;">${currentResult.isUpcoming ? '-' : sub.obtainedMarks}</td>
              <td style="padding: 7px 10px; text-align: center; vertical-align: middle; font-weight: 800; color: #2563eb; font-family: monospace; border: 1px solid #cbd5e1;">${currentResult.isUpcoming ? '-' : `${sub.percentage}%`}</td>
              <td style="padding: 7px 12px; text-align: right; vertical-align: middle; font-weight: 800; color: ${
                currentResult.isUpcoming ? '#92400e' : sub.isPassing ? '#16a34a' : '#dc2626'
              }; border: 1px solid #cbd5e1;">
                ${currentResult.isUpcoming ? 'UPCOMING' : sub.isPassing ? 'PASS' : 'FAIL'}
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
        <tfoot>
          <tr style="background-color: #f8fafc; border-top: 2px solid #0f172a; font-weight: 800; color: #0f172a;">
            <td colspan="2" style="padding: 8px 12px; text-align: left; vertical-align: middle; text-transform: uppercase; font-size: 9.5px; border: 1px solid #cbd5e1;">GRAND TOTAL</td>
            <td style="padding: 8px 10px; text-align: center; vertical-align: middle; font-family: monospace; border: 1px solid #cbd5e1;">${currentResult.totalMaxMarks}</td>
            <td style="padding: 8px 10px; text-align: center; vertical-align: middle; font-family: monospace; color: #2563eb; font-size: 13px; border: 1px solid #cbd5e1;">${currentResult.isUpcoming ? '-' : currentResult.totalObtainedMarks}</td>
            <td style="padding: 8px 10px; text-align: center; vertical-align: middle; font-family: monospace; color: #059669; font-size: 13px; border: 1px solid #cbd5e1;">${currentResult.isUpcoming ? '-' : `${currentResult.percentage}%`}</td>
            <td style="padding: 8px 12px; text-align: right; vertical-align: middle; color: ${
              currentResult.isUpcoming ? '#92400e' : currentResult.status === 'PASSED' ? '#16a34a' : '#dc2626'
            }; border: 1px solid #cbd5e1;">
              ${currentResult.isUpcoming ? 'Upcoming' : currentResult.status}
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- Evaluation Remarks Box -->
      <div style="border: 1px solid #cbd5e1; border-radius: 10px; background-color: #f8fafc; padding: 12px 16px; margin-bottom: 24px;">
        <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Academic Evaluation Remarks</div>
        <div style="font-size: 12px; font-weight: 600; font-style: italic; color: #334155; margin-top: 4px; line-height: 1.4;">
          "${currentResult.remarks}"
        </div>
      </div>
    </div>

    <!-- Signatures & Footer for Page 1 -->
    <div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; padding-top: 18px; border-top: 1px solid #cbd5e1;">
        <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: center; text-align: center;">
          <div style="height: 28px; width: 80%; border-bottom: 1px dashed #94a3b8;"></div>
          <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #475569; margin-top: 6px; letter-spacing: 0.05em; line-height: 1.2;">
            Class Teacher
          </div>
        </div>
        <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: center; text-align: center;">
          <div style="height: 28px; width: 80%; border-bottom: 1px dashed #94a3b8; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 12px; font-style: italic; font-weight: 700; color: #334155; line-height: 1;">Kapil Dev Sir</span>
          </div>
          <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #475569; margin-top: 6px; letter-spacing: 0.05em; line-height: 1.2;">
            Controller of Exams
          </div>
        </div>
        <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: center; text-align: center;">
          <div style="height: 28px; width: 80%; border-bottom: 1px dashed #94a3b8; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 13px; font-style: italic; font-weight: 800; color: #2563eb; line-height: 1;">${SCHOOL_INFO.principal}</span>
          </div>
          <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #475569; margin-top: 6px; letter-spacing: 0.05em; line-height: 1.2;">
            Principal (Attestation Seal)
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 8.5px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 8px; line-height: 1.2;">
        <span>Page 1 of 2 • Official Scorecard Document</span>
        <span>Generated on ${nowStr} • ${SCHOOL_INFO.name}</span>
      </div>
    </div>
  `;

  container.appendChild(page1);

  // =========================================================================
  // PAGE 2: TERM-BY-TERM PROGRESSION & PERFORMANCE REPORT (210mm x 297mm)
  // =========================================================================
  const page2 = document.createElement('div');
  page2.style.width = '794px';
  page2.style.height = '1120px'; // Exact A4 height at 96 DPI
  page2.style.maxHeight = '1120px';
  page2.style.boxSizing = 'border-box';
  page2.style.padding = '32px 38px';
  page2.style.backgroundColor = '#ffffff';
  page2.style.display = 'flex';
  page2.style.flexDirection = 'column';
  page2.style.justifyContent = 'space-between';

  // Compute progression metrics
  const evaluatedTerms = allExamResults.filter((r) => !r.isUpcoming);
  const evaluatedCount = evaluatedTerms.length;

  // Extract distinct subjects across all terms
  const allSubjectNames = Array.from(
    new Set(allExamResults.flatMap((r) => r.subjects.map((s) => s.name)))
  );

  page2.innerHTML = `
    <div>
      <!-- School Header & Title -->
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <h1 style="font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0; color: #0f172a; letter-spacing: -0.01em; line-height: 1.2; text-align: center;">
          ${SCHOOL_INFO.name}
        </h1>
        <div style="font-size: 11px; font-weight: 800; color: #1e40af; text-transform: uppercase; margin: 3px 0 0 0; letter-spacing: 0.05em; line-height: 1.2; text-align: center;">
          TERM-BY-TERM EXAMINATION PERFORMANCE &amp; PROGRESSION REPORT
        </div>
        <p style="font-size: 9px; font-weight: 600; color: #64748b; margin: 2px 0 0 0; line-height: 1.2; text-align: center;">
          Comprehensive multi-term performance tracking, rank trajectories, and subject growth analysis
        </p>
      </div>

      <!-- Student Summary Pill Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; padding: 6px 14px; margin-bottom: 10px; font-size: 10px;">
        <div>
          <span style="font-weight: 700; color: #64748b;">Student:</span>
          <strong style="color: #0f172a; margin-left: 4px;">${student.name.toUpperCase()}</strong>
          <span style="color: #cbd5e1; margin: 0 8px;">|</span>
          <span style="font-weight: 700; color: #64748b;">Roll No:</span>
          <strong style="color: #2563eb; font-family: monospace; margin-left: 4px;">#${student.rollNo}</strong>
          <span style="color: #cbd5e1; margin: 0 8px;">|</span>
          <span style="font-weight: 700; color: #64748b;">Class:</span>
          <strong style="color: #0f172a; margin-left: 4px;">${studentClass}</strong>
        </div>
        <div style="font-weight: 800; color: #1e40af; background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 6px; font-size: 9px;">
          ${evaluatedCount} Evaluated Terms
        </div>
      </div>

      <!-- 1. Examination Terms Performance Cards Grid -->
      <div style="margin-bottom: 10px;">
        <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 5px;">
          1. Examination Terms Performance Cards
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
          ${allExamResults
            .slice(0, 8)
            .map((res, index) => {
              const prev = index > 0 && !allExamResults[index - 1].isUpcoming ? allExamResults[index - 1] : null;
              const pctDiff = !res.isUpcoming && prev ? Math.round((res.percentage - prev.percentage) * 10) / 10 : null;

              return `
                <div style="border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff; padding: 6px 8px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
                  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 2px; margin-bottom: 3px;">
                    <strong style="font-size: 9px; font-weight: 800; color: #0f172a; line-height: 1.2;">${res.exam.examName}</strong>
                    <span style="font-size: 7.5px; color: #64748b; font-family: monospace; line-height: 1.2;">${res.exam.date}</span>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
                    <span style="font-size: 8px; font-weight: 800; color: #92400e; background-color: #fef3c7; border: 1px solid #fde68a; padding: 1px 4px; border-radius: 3px; line-height: 1.1;">
                      ${res.isUpcoming ? 'Upcoming' : `Rank ${res.rank}`}
                    </span>
                    <span style="font-size: 8px; font-weight: 800; color: ${
                      res.isUpcoming ? '#92400e' : res.status === 'PASSED' ? '#166534' : '#991b1b'
                    }; background-color: ${
                      res.isUpcoming ? '#fef3c7' : res.status === 'PASSED' ? '#dcfce7' : '#fee2e2'
                    }; padding: 1px 4px; border-radius: 3px; line-height: 1.1;">
                      ${res.isUpcoming ? 'Upcoming' : res.status}
                    </span>
                  </div>
                  <div style="display: flex; align-items: baseline; justify-content: space-between;">
                    <span style="font-size: ${res.isUpcoming ? '10px' : '13px'}; font-weight: 800; color: ${res.isUpcoming ? '#92400e' : '#0f172a'}; font-family: monospace; line-height: 1.2;">
                      ${res.isUpcoming ? 'Upcoming' : `${res.percentage}%`}
                    </span>
                    <span style="font-size: 8px; color: #64748b; font-family: monospace; line-height: 1.2;">
                      ${res.isUpcoming ? `(Max: ${res.totalMaxMarks})` : `(${res.totalObtainedMarks}/${res.totalMaxMarks})`}
                    </span>
                  </div>
                  <div style="font-size: 7.5px; margin-top: 2px; color: ${
                    pctDiff !== null ? (pctDiff >= 0 ? '#16a34a' : '#dc2626') : '#64748b'
                  }; font-weight: 700; line-height: 1.1;">
                    ${
                      res.isUpcoming
                        ? '• Scheduled'
                        : pctDiff !== null
                        ? pctDiff >= 0
                          ? `▲ +${pctDiff}% vs previous`
                          : `▼ ${pctDiff}% vs previous`
                        : '• Baseline Term'
                    }
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- 2. Complete Examination History & Trajectory Table -->
      <div style="margin-bottom: 10px;">
        <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 4px;">
          2. Complete Examination History &amp; Trajectory
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
          <thead>
            <tr style="background-color: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; text-transform: uppercase; font-size: 8px; font-weight: 800; color: #475569;">
              <th style="padding: 4px 6px; text-align: left; border: 1px solid #cbd5e1;">Examination Name</th>
              <th style="padding: 4px 6px; text-align: center; border: 1px solid #cbd5e1; width: 75px;">Date</th>
              <th style="padding: 4px 6px; text-align: center; border: 1px solid #cbd5e1; width: 75px;">Max Marks</th>
              <th style="padding: 4px 6px; text-align: center; border: 1px solid #cbd5e1; width: 75px;">Obtained</th>
              <th style="padding: 4px 6px; text-align: center; border: 1px solid #cbd5e1; width: 80px;">Percentage</th>
              <th style="padding: 4px 6px; text-align: center; border: 1px solid #cbd5e1; width: 80px;">Class Rank</th>
              <th style="padding: 4px 6px; text-align: right; border: 1px solid #cbd5e1; width: 70px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${allExamResults
              .map(
                (res, idx) => `
              <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 3.5px 6px; font-weight: 700; color: #0f172a; border: 1px solid #cbd5e1;">${res.exam.examName}</td>
                <td style="padding: 3.5px 6px; text-align: center; font-family: monospace; color: #64748b; border: 1px solid #cbd5e1;">${res.exam.date}</td>
                <td style="padding: 3.5px 6px; text-align: center; font-family: monospace; color: #475569; border: 1px solid #cbd5e1;">${res.totalMaxMarks}</td>
                <td style="padding: 3.5px 6px; text-align: center; font-family: monospace; font-weight: 800; color: #2563eb; border: 1px solid #cbd5e1;">${res.isUpcoming ? '-' : res.totalObtainedMarks}</td>
                <td style="padding: 3.5px 6px; text-align: center; font-family: monospace; font-weight: 800; color: #059669; border: 1px solid #cbd5e1;">${res.isUpcoming ? '-' : `${res.percentage}%`}</td>
                <td style="padding: 3.5px 6px; text-align: center; font-family: monospace; font-weight: 800; color: #0f172a; border: 1px solid #cbd5e1;">${res.isUpcoming ? 'Upcoming' : `#${res.rank}/${res.totalStudentsInClass}`}</td>
                <td style="padding: 3.5px 6px; text-align: right; font-weight: 800; color: ${
                  res.isUpcoming ? '#92400e' : res.status === 'PASSED' ? '#16a34a' : '#dc2626'
                }; border: 1px solid #cbd5e1;">
                  ${res.isUpcoming ? 'UPCOMING' : res.status}
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <!-- 3. Subject-Wise Progression Summary Table -->
      <div style="margin-bottom: 10px;">
        <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 4px;">
          3. Subject-Wise Progression Summary
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5px;">
          <thead>
            <tr style="background-color: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; text-transform: uppercase; font-size: 7.5px; font-weight: 800; color: #475569;">
              <th style="padding: 4px 6px; text-align: left; border: 1px solid #cbd5e1; width: 85px;">Subject</th>
              ${allExamResults
                .map(
                  (res) =>
                    `<th style="padding: 4px 4px; text-align: center; border: 1px solid #cbd5e1;">${res.exam.examName.toUpperCase()}</th>`
                )
                .join('')}
            </tr>
          </thead>
          <tbody>
            ${allSubjectNames
              .map(
                (subjName, idx) => `
              <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 3.5px 6px; font-weight: 700; color: #0f172a; border: 1px solid #cbd5e1;">${subjName}</td>
                ${allExamResults
                  .map((res) => {
                    const foundSub = res.subjects.find((s) => s.name.toLowerCase() === subjName.toLowerCase());
                    if (!foundSub) {
                      return `<td style="padding: 3.5px 4px; text-align: center; color: #94a3b8; font-family: monospace; border: 1px solid #cbd5e1;">-</td>`;
                    }
                    return `
                      <td style="padding: 3.5px 4px; text-align: center; font-family: monospace; font-size: 8px; border: 1px solid #cbd5e1; color: ${
                        res.isUpcoming ? '#94a3b8' : foundSub.isPassing ? '#0f172a' : '#dc2626'
                      }; font-weight: ${foundSub.isPassing ? '600' : '700'};">
                        ${res.isUpcoming ? `- / ${foundSub.maxMarks}` : `${foundSub.obtainedMarks} / ${foundSub.maxMarks}`}
                      </td>
                    `;
                  })
                  .join('')}
              </tr>
            `
              )
              .join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8fafc; border-top: 2px solid #0f172a; font-weight: 800; color: #0f172a;">
              <td style="padding: 4px 6px; font-weight: 800; text-transform: uppercase; font-size: 8px; border: 1px solid #cbd5e1;">TOTAL MARKS</td>
              ${allExamResults
                .map(
                  (res) => `
                <td style="padding: 4px 4px; text-align: center; font-family: monospace; font-size: 8px; font-weight: 800; color: #2563eb; border: 1px solid #cbd5e1;">
                  ${res.isUpcoming ? '-' : `${res.totalObtainedMarks} / ${res.totalMaxMarks}`}
                </td>
              `
                )
                .join('')}
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Term Progression Insights & Advice Box -->
      <div style="border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; padding: 7px 12px; margin-bottom: 12px;">
        <div style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">
          Term Progression Insights &amp; Advice
        </div>
        <div style="font-size: 9.5px; font-weight: 600; color: #334155; margin-top: 2px; line-height: 1.3;">
          Student has appeared in ${evaluatedCount} term examination(s). Maintain continuous revision and rigorous focus across all subjects for board examination preparation.
        </div>
      </div>
    </div>

    <!-- Signatures & Footer for Page 2 -->
    <div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center; padding-top: 10px; border-top: 1px solid #cbd5e1;">
        <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: center; text-align: center;">
          <div style="height: 20px; width: 80%; border-bottom: 1px dashed #94a3b8;"></div>
          <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #475569; margin-top: 3px; letter-spacing: 0.05em; line-height: 1.2;">
            Academic Counselor
          </div>
        </div>
        <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: center; text-align: center;">
          <div style="height: 20px; width: 80%; border-bottom: 1px dashed #94a3b8; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 10px; font-style: italic; font-weight: 700; color: #334155; line-height: 1;">Kapil Dev Sir</span>
          </div>
          <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #475569; margin-top: 3px; letter-spacing: 0.05em; line-height: 1.2;">
            Examination In-Charge
          </div>
        </div>
        <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: center; text-align: center;">
          <div style="height: 20px; width: 80%; border-bottom: 1px dashed #94a3b8; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 11px; font-style: italic; font-weight: 800; color: #2563eb; line-height: 1;">${SCHOOL_INFO.principal}</span>
          </div>
          <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #475569; margin-top: 3px; letter-spacing: 0.05em; line-height: 1.2;">
            Principal (Institutional Stamp)
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 8px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 4px; line-height: 1.2;">
        <span>Page 2 of 2 • Term-by-Term Examination Performance &amp; Progression</span>
        <span>${SCHOOL_INFO.name} • Session 2026-27</span>
      </div>
    </div>
  `;

  container.appendChild(page2);
  document.body.appendChild(container);

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Render Page 1 to Canvas & PDF
    const canvas1 = await html2canvas(page1, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    const imgData1 = canvas1.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData1, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    // Render Page 2 to Canvas & PDF
    const canvas2 = await html2canvas(page2, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    const imgData2 = canvas2.toDataURL('image/jpeg', 0.95);
    pdf.addPage('a4', 'portrait');
    pdf.addImage(imgData2, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    // Clean filename
    const cleanStudentName = student.name.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanExamName = exam.examName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanStudentName}_Roll_${student.rollNo}_${cleanExamName}_Official_Marksheet.pdf`;

    const blob = pdf.output('blob');
    const file = new File([blob], filename, { type: 'application/pdf' });

    return {
      doc: pdf,
      blob,
      file,
      filename,
    };
  } finally {
    // Clean up temporary DOM container
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Downloads the student marksheet PDF
 */
export async function downloadStudentMarksheetPDF(
  currentResult: StudentExamResult,
  allExamResults: StudentExamResult[]
): Promise<void> {
  const { doc, filename } = await generateStudentMarksheetPDF(currentResult, allExamResults);
  doc.save(filename);
}

/**
 * Generates and downloads a Class Merit List PDF
 */
export async function downloadMeritListPDF(
  examName: string,
  className: string,
  classRanks: ClassRankRow[],
  subjects: string[],
  summaryMetrics: { total: number; avg: number; topper: ClassRankRow | null; passRate: number }
): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  container.style.padding = '36px 40px';
  container.style.boxSizing = 'border-box';
  container.style.color = '#0f172a';

  container.innerHTML = `
    <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <h1 style="font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0; color: #0f172a; line-height: 1.2; text-align: center;">
        ${SCHOOL_INFO.name}
      </h1>
      <p style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; margin: 3px 0 0 0; line-height: 1.2; text-align: center;">
        Affiliated to Board of Secondary Education, Rajasthan (RBSE)
      </p>
      <div style="margin-top: 8px; display: inline-flex; align-items: center; justify-content: center; height: 26px; line-height: 1; vertical-align: middle; background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 0 16px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">
        OFFICIAL CLASS MERIT LIST — ${className} • ${examName.toUpperCase()}
      </div>
    </div>

    <!-- Summary Metrics Box -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #cbd5e1; border-radius: 10px; background-color: #f8fafc; margin-bottom: 16px; overflow: hidden; text-align: center;">
      <div style="padding: 10px; border-right: 1px solid #cbd5e1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; line-height: 1.2;">Total Students</div>
        <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 2px; line-height: 1.2;">${summaryMetrics.total}</div>
      </div>
      <div style="padding: 10px; border-right: 1px solid #cbd5e1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; line-height: 1.2;">Class Average</div>
        <div style="font-size: 16px; font-weight: 800; color: #2563eb; margin-top: 2px; line-height: 1.2;">${summaryMetrics.avg}%</div>
      </div>
      <div style="padding: 10px; border-right: 1px solid #cbd5e1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; line-height: 1.2;">Class Topper</div>
        <div style="font-size: 13px; font-weight: 800; color: #d97706; margin-top: 2px; line-height: 1.2;">${summaryMetrics.topper?.name || 'N/A'}</div>
      </div>
      <div style="padding: 10px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; line-height: 1.2;">Pass Percentage</div>
        <div style="font-size: 16px; font-weight: 800; color: #16a34a; margin-top: 2px; line-height: 1.2;">${summaryMetrics.passRate}%</div>
      </div>
    </div>

    <!-- Merit Table -->
    <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; text-transform: uppercase; font-size: 9px; font-weight: 800; color: #475569;">
          <th style="padding: 6px 6px; text-align: center; vertical-align: middle; line-height: 1.2; width: 40px; border: 1px solid #cbd5e1;">Rank</th>
          <th style="padding: 6px 8px; text-align: center; vertical-align: middle; line-height: 1.2; width: 55px; border: 1px solid #cbd5e1;">Roll</th>
          <th style="padding: 6px 10px; text-align: left; vertical-align: middle; line-height: 1.2; border: 1px solid #cbd5e1;">Student Name</th>
          <th style="padding: 6px 10px; text-align: left; vertical-align: middle; line-height: 1.2; border: 1px solid #cbd5e1;">Father's Name</th>
          ${subjects.map((s) => `<th style="padding: 6px 6px; text-align: center; vertical-align: middle; line-height: 1.2; border: 1px solid #cbd5e1;">${s}</th>`).join('')}
          <th style="padding: 6px 8px; text-align: center; vertical-align: middle; line-height: 1.2; border: 1px solid #cbd5e1; width: 55px;">Total</th>
          <th style="padding: 6px 8px; text-align: center; vertical-align: middle; line-height: 1.2; border: 1px solid #cbd5e1; width: 55px;">%</th>
          <th style="padding: 6px 8px; text-align: right; vertical-align: middle; line-height: 1.2; border: 1px solid #cbd5e1; width: 60px;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${classRanks
          .map(
            (row, idx) => `
          <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 5px 6px; text-align: center; vertical-align: middle; line-height: 1.2; font-weight: 800; color: ${
              row.rank === 1 ? '#d97706' : '#0f172a'
            }; border: 1px solid #cbd5e1;">${row.rank}</td>
            <td style="padding: 5px 8px; text-align: center; vertical-align: middle; line-height: 1.2; font-family: monospace; font-weight: 700; color: #2563eb; border: 1px solid #cbd5e1;">#${row.rollNo}</td>
            <td style="padding: 5px 10px; text-align: left; vertical-align: middle; line-height: 1.2; font-weight: 700; color: #0f172a; border: 1px solid #cbd5e1;">${row.name}</td>
            <td style="padding: 5px 10px; text-align: left; vertical-align: middle; line-height: 1.2; color: #475569; border: 1px solid #cbd5e1;">${row.fatherName || '-'}</td>
            ${subjects
              .map((s) => {
                const score = row.subjectMarks[s] ?? 0;
                return `<td style="padding: 5px 6px; text-align: center; vertical-align: middle; line-height: 1.2; font-family: monospace; border: 1px solid #cbd5e1;">${score}</td>`;
              })
              .join('')}
            <td style="padding: 5px 8px; text-align: center; vertical-align: middle; line-height: 1.2; font-family: monospace; font-weight: 800; color: #2563eb; border: 1px solid #cbd5e1;">${row.totalObtained}</td>
            <td style="padding: 5px 8px; text-align: center; vertical-align: middle; line-height: 1.2; font-family: monospace; font-weight: 800; color: #059669; border: 1px solid #cbd5e1;">${row.percentage}%</td>
            <td style="padding: 5px 8px; text-align: right; vertical-align: middle; line-height: 1.2; font-weight: 800; color: ${
              row.status === 'PASSED' ? '#16a34a' : '#dc2626'
            }; border: 1px solid #cbd5e1;">${row.status}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; padding-top: 18px; border-top: 1px solid #cbd5e1;">
      <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: center; text-align: center;">
        <div style="height: 25px; width: 80%; border-bottom: 1px dashed #94a3b8;"></div>
        <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #475569; margin-top: 4px; line-height: 1.2;">Class Teacher</div>
      </div>
      <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: center; text-align: center;">
        <div style="height: 25px; width: 80%; border-bottom: 1px dashed #94a3b8; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 10px; font-style: italic; font-weight: 700; color: #334155; line-height: 1;">Kapil Dev Sir</span>
        </div>
        <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #475569; margin-top: 4px; line-height: 1.2;">Examination In-Charge</div>
      </div>
      <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: center; text-align: center;">
        <div style="height: 25px; width: 80%; border-bottom: 1px dashed #94a3b8; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 10px; font-style: italic; font-weight: 800; color: #2563eb; line-height: 1;">${SCHOOL_INFO.principal}</span>
        </div>
        <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #475569; margin-top: 4px; line-height: 1.2;">Principal (Attestation)</div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    const cleanExam = examName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanClass = className.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    pdf.save(`Merit_List_${cleanClass}_${cleanExam}.pdf`);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
