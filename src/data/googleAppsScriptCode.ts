/**
 * Google Apps Script Webhook receiver code for syncing school marks database
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * MarksDB - Google Apps Script Webhook Receiver
 * Govt. Sr. Sec. School, Sanwaloda Purohitan, Sikar
 * ==============================================================================
 * 
 * STEP-BY-STEP DEPLOYMENT INSTRUCTIONS:
 * 1. Open your Google Sheet (or visit https://sheets.new to create one)
 * 2. In Google Sheets menu, click: Extensions > Apps Script
 * 3. Clear any existing code in Code.gs and PASTE ALL of this code.
 * 4. Click the blue "Deploy" button (top-right) > "New deployment"
 * 5. Click the gear icon next to "Select type" > select "Web app"
 * 6. Set Description: "MarksDB Sync Webhook"
 * 7. Set "Execute as": "Me (<your email>)"
 * 8. Set "Who has access": "Anyone"  (REQUIRED: allows app to sync without login popups)
 * 9. Click "Deploy", review/grant permissions when prompted.
 * 10. Copy the generated "Web app URL" (ends with /exec)
 * 11. Return to the School Dashboard, paste that URL into the input field, and click "Update URL".
 * 12. Click "Save Data to Database" anytime to synchronize all records instantly!
 * ==============================================================================
 */

// OPTIONAL: If this script is run as a standalone script (script.google.com),
// paste your target Google Sheet ID below. Otherwise, leave it blank ("").
var SPREADSHEET_ID = "";

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Handles incoming POST requests containing students, exams, marks, subjects
 */
function doPost(e) {
  try {
    var rawContent = e && e.postData ? e.postData.contents : "";
    if (!rawContent) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "No data payload received in POST body."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(rawContent);
    var ss = getSpreadsheet();

    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Active Spreadsheet not found. If using a standalone script, specify SPREADSHEET_ID."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Synchronize Students Tab
    if (payload.students && Array.isArray(payload.students)) {
      syncStudents(ss, payload.students);
    }

    // 2. Synchronize Exams Tab
    if (payload.exams && Array.isArray(payload.exams)) {
      syncExams(ss, payload.exams);
    }

    // 3. Synchronize Marks Tab
    if (payload.marks && Array.isArray(payload.marks)) {
      syncMarks(ss, payload.marks, payload.students || []);
    }

    // 4. Synchronize Subjects Configuration Tab
    if (payload.subjectsMap) {
      syncSubjects(ss, payload.subjectsMap);
    }

    // 5. Append entry in Sync_Log Tab
    logSync(ss, payload);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Database successfully synchronized with Google Sheets!",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles GET requests (for browser validation)
 */
function doGet(e) {
  var ss = getSpreadsheet();
  var sheetName = ss ? ss.getName() : "Unknown";
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "MarksDB Google Apps Script Webhook is active and listening for POST requests!",
    connectedSpreadsheet: sheetName,
    serverTime: new Date().toString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------------------------------------------------------
// DATA SYNCHRONIZATION HELPERS
// ----------------------------------------------------------------------------

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function applyHeaderStyles(sheet, headers) {
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#0f172a"); // Dark slate
  headerRange.setFontColor("#ffffff");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 32);
  sheet.setFrozenRows(1);
}

/**
 * 1. Synchronize Students Sheet
 */
function syncStudents(ss, students) {
  var sheet = getOrCreateSheet(ss, "Students");
  sheet.clear();

  var headers = [
    "Roll No",
    "Student Name",
    "Class",
    "Father's Name",
    "Mother's Name",
    "Date of Birth",
    "Contact Number"
  ];
  applyHeaderStyles(sheet, headers);

  if (students.length === 0) return;

  var rows = students.map(function (s) {
    return [
      s.rollNo ? String(s.rollNo) : "",
      s.name || "",
      s.className || "",
      s.fatherName || "",
      s.motherName || "",
      s.dateOfBirth || s.dob || "",
      s.contactNumber ? String(s.contactNumber) : ""
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  
  sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
  sheet.getRange(2, 3, rows.length, 1).setHorizontalAlignment("center");
  sheet.getRange(2, 6, rows.length, 1).setHorizontalAlignment("center");
  sheet.getRange(2, 7, rows.length, 1).setHorizontalAlignment("center");

  for (var c = 1; c <= headers.length; c++) {
    sheet.autoResizeColumn(c);
  }
}

/**
 * 2. Synchronize Exams Sheet
 */
function syncExams(ss, exams) {
  var sheet = getOrCreateSheet(ss, "Exams");
  sheet.clear();

  var headers = [
    "Exam ID",
    "Exam Name",
    "Class",
    "Max Marks Per Subject",
    "Date",
    "Academic Year"
  ];
  applyHeaderStyles(sheet, headers);

  if (exams.length === 0) return;

  var rows = exams.map(function (ex) {
    return [
      ex.examId || "",
      ex.examName || "",
      ex.className || "",
      ex.maxMarksPerSubject || 0,
      ex.date || "",
      ex.academicYear || ""
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
  sheet.getRange(2, 3, rows.length, 2).setHorizontalAlignment("center");

  for (var c = 1; c <= headers.length; c++) {
    sheet.autoResizeColumn(c);
  }
}

/**
 * 3. Synchronize Marks Sheet
 */
function syncMarks(ss, marks, students) {
  var sheet = getOrCreateSheet(ss, "Marks");
  sheet.clear();

  var headers = [
    "Exam ID",
    "Roll No",
    "Student Name",
    "Class",
    "Subject",
    "Marks Obtained",
    "Teacher Remarks"
  ];
  applyHeaderStyles(sheet, headers);

  if (marks.length === 0) return;

  var studentMap = {};
  if (Array.isArray(students)) {
    students.forEach(function (st) {
      studentMap[String(st.rollNo)] = st;
    });
  }

  var rows = [];
  marks.forEach(function (rec) {
    var examId = rec.examId || "";
    var rollNo = String(rec.rollNo || "");
    var remarks = rec.remarks || "";
    var st = studentMap[rollNo] || {};
    var stName = st.name || "";
    var stClass = st.className || "";

    var subjMap = rec.marks || {};
    Object.keys(subjMap).forEach(function (subject) {
      rows.push([
        examId,
        rollNo,
        stName,
        stClass,
        subject,
        Number(subjMap[subject]),
        remarks
      ]);
    });
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(2, 1, rows.length, 2).setHorizontalAlignment("center");
    sheet.getRange(2, 4, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 6, rows.length, 1).setHorizontalAlignment("center");

    for (var c = 1; c <= headers.length; c++) {
      sheet.autoResizeColumn(c);
    }
  }
}

/**
 * 4. Synchronize Subjects Configuration Sheet
 */
function syncSubjects(ss, subjectsMap) {
  var sheet = getOrCreateSheet(ss, "Subjects");
  sheet.clear();

  var headers = ["Class", "Subject Count", "Subjects"];
  applyHeaderStyles(sheet, headers);

  var classes = Object.keys(subjectsMap);
  if (classes.length === 0) return;

  var rows = classes.map(function (cls) {
    var list = subjectsMap[cls] || [];
    var strList = Array.isArray(list) ? list.join(", ") : String(list);
    return [cls, Array.isArray(list) ? list.length : 0, strList];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.getRange(2, 1, rows.length, 2).setHorizontalAlignment("center");

  for (var c = 1; c <= headers.length; c++) {
    sheet.autoResizeColumn(c);
  }
}

/**
 * 5. Append Log entry in Sync_Log Sheet
 */
function logSync(ss, payload) {
  var sheet = getOrCreateSheet(ss, "Sync_Log");
  
  if (sheet.getLastRow() === 0) {
    applyHeaderStyles(sheet, [
      "Timestamp",
      "Students Count",
      "Exams Count",
      "Marks Rows",
      "Status"
    ]);
  }

  var studentCount = payload.students ? payload.students.length : 0;
  var examCount = payload.exams ? payload.exams.length : 0;
  var marksCount = payload.marks ? payload.marks.length : 0;

  sheet.appendRow([
    new Date(),
    studentCount,
    examCount,
    marksCount,
    "Sync successful"
  ]);

  sheet.autoResizeColumn(1);
  sheet.autoResizeColumn(5);
}
`;
