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
      syncMarks(ss, payload.marks, payload.students || [], payload.subjectsMap || {});
    }

    // 4. Synchronize Subjects Configuration Tab
    if (payload.subjectsMap) {
      syncSubjects(ss, payload.subjectsMap);
    }

    // 5. Synchronize Teachers Tab (Name, Mobile, PIN, Assigned Class, Role)
    if (payload.teachers && Array.isArray(payload.teachers)) {
      syncTeachers(ss, payload.teachers);
    }

    // 6. Append entry in Sync_Log Tab
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
 * Handles GET requests: returns full database JSON when called by the web application
 */
function doGet(e) {
  try {
    var ss = getSpreadsheet();
    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Active Spreadsheet not found. If using standalone script, specify SPREADSHEET_ID."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var students = readStudentsFromSheet(ss);
    var exams = readExamsFromSheet(ss);
    var marks = readMarksFromSheet(ss);
    var subjectsMap = readSubjectsFromSheet(ss);
    var teachers = readTeachersFromSheet(ss);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      sheetName: ss.getName(),
      students: students,
      exams: exams,
      marks: marks,
      subjectsMap: subjectsMap,
      teachers: teachers,
      serverTime: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Reads Students sheet into structured objects
 * Sequence: Class, Roll No, Student Name, Father's Name, Contact Number
 */
function readStudentsFromSheet(ss) {
  var sheet = ss.getSheetByName("Students");
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getDataRange().getValues();
  var header = data[0].map(function (h) { return String(h || "").trim().toLowerCase(); });
  
  var classIdx = header.indexOf("class");
  if (classIdx === -1) classIdx = 0;

  var rollIdx = header.indexOf("roll no");
  if (rollIdx === -1) rollIdx = header.indexOf("rollno");
  if (rollIdx === -1) rollIdx = header.indexOf("roll");
  if (rollIdx === -1) rollIdx = 1;

  var nameIdx = header.indexOf("student name");
  if (nameIdx === -1) nameIdx = header.indexOf("name");
  if (nameIdx === -1) nameIdx = 2;

  var fatherIdx = header.indexOf("father's name");
  if (fatherIdx === -1) fatherIdx = header.indexOf("fathername");
  if (fatherIdx === -1) fatherIdx = header.indexOf("father's");
  if (fatherIdx === -1) fatherIdx = 3;

  var contactIdx = header.indexOf("contact number");
  if (contactIdx === -1) contactIdx = header.indexOf("contact");
  if (contactIdx === -1) contactIdx = header.indexOf("mobile");
  if (contactIdx === -1) contactIdx = header.indexOf("phone");
  if (contactIdx === -1) contactIdx = 4;

  var list = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var roll = String(row[rollIdx] || "").trim();
    var name = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : "";
    if (!roll && !name) continue;

    list.push({
      className: classIdx !== -1 && row[classIdx] ? String(row[classIdx]).trim() : "10A",
      rollNo: roll || String(i),
      name: name || "Student " + (roll || i),
      fatherName: fatherIdx !== -1 && row[fatherIdx] ? String(row[fatherIdx]).trim() : "",
      contactNumber: contactIdx !== -1 && row[contactIdx] ? String(row[contactIdx]).trim() : undefined
    });
  }
  return list;
}

/**
 * Reads Exams sheet into structured objects
 */
function readExamsFromSheet(ss) {
  var sheet = ss.getSheetByName("Exams");
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getDataRange().getValues();
  var header = data[0].map(function (h) { return String(h || "").trim().toLowerCase(); });

  var idIdx = header.indexOf("exam id");
  if (idIdx === -1) idIdx = header.indexOf("examid");
  if (idIdx === -1) idIdx = 0;

  var nameIdx = header.indexOf("exam name");
  if (nameIdx === -1) nameIdx = header.indexOf("examname");

  var classIdx = header.indexOf("class");
  var maxIdx = header.indexOf("max marks per subject");
  if (maxIdx === -1) maxIdx = header.indexOf("maxmarks");

  var dateIdx = header.indexOf("date");
  var yearIdx = header.indexOf("academic year");
  if (yearIdx === -1) yearIdx = header.indexOf("academicyear");

  var list = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var id = String(row[idIdx] || "").trim();
    if (!id) continue;
    list.push({
      examId: id,
      examName: nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : id,
      className: classIdx !== -1 && row[classIdx] ? String(row[classIdx]).trim() : "10A",
      maxMarksPerSubject: maxIdx !== -1 && Number(row[maxIdx]) ? Number(row[maxIdx]) : 100,
      date: dateIdx !== -1 && row[dateIdx] ? String(row[dateIdx]).trim() : "",
      academicYear: yearIdx !== -1 && row[yearIdx] ? String(row[yearIdx]).trim() : "2026-27"
    });
  }
  return list;
}

/**
 * Reads Marks sheet into structured objects
 */
function readMarksFromSheet(ss) {
  var sheet = ss.getSheetByName("Marks");
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getDataRange().getValues();
  var headerRow = data[0];
  var header = headerRow.map(function (h) { return String(h || "").trim().toLowerCase(); });

  var examIdIdx = header.indexOf("exam id");
  if (examIdIdx === -1) examIdIdx = header.indexOf("examid");
  if (examIdIdx === -1) examIdIdx = 0;

  var rollNoIdx = header.indexOf("roll no");
  if (rollNoIdx === -1) rollNoIdx = header.indexOf("rollno");
  if (rollNoIdx === -1) rollNoIdx = 1;

  var subjectsIdx = header.indexOf("subjects");
  var marksIdx = header.indexOf("marks obtained");
  if (marksIdx === -1) marksIdx = header.indexOf("marksobtained");

  var remarksIdx = header.indexOf("teacher remarks");
  if (remarksIdx === -1) remarksIdx = header.indexOf("remarks");

  var ignored = [
    "exam id", "examid", "roll no", "rollno", "student name", "name",
    "class", "subjects", "marks obtained", "marksobtained", "total marks",
    "total", "maxtotal", "percentage", "percent", "%", "rank", "teacher remarks", "remarks"
  ];

  var list = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var eId = String(row[examIdIdx] || "").trim();
    var roll = String(row[rollNoIdx] || "").trim();
    if (!eId || !roll) continue;

    var marksMap = {};
    if (subjectsIdx !== -1 && marksIdx !== -1) {
      var subs = String(row[subjectsIdx] || "").split(new RegExp("[,;\\n]")).map(function (s) { return s.trim(); }).filter(Boolean);
      var mrks = String(row[marksIdx] || "").split(new RegExp("[,;\\n]")).map(function (s) { return s.trim(); }).filter(Boolean);
      for (var s = 0; s < subs.length; s++) {
        var val = Number(mrks[s] !== undefined ? mrks[s] : 0);
        marksMap[subs[s]] = isNaN(val) ? 0 : val;
      }
    } else {
      for (var col = 0; col < headerRow.length; col++) {
        var hName = String(headerRow[col] || "").trim();
        if (ignored.indexOf(hName.toLowerCase()) === -1 && row[col] !== undefined && row[col] !== "") {
          var num = Number(row[col]);
          if (!isNaN(num)) marksMap[hName] = num;
        }
      }
    }

    list.push({
      examId: eId,
      rollNo: roll,
      marks: marksMap,
      remarks: remarksIdx !== -1 && row[remarksIdx] ? String(row[remarksIdx]).trim() : undefined
    });
  }
  return list;
}

/**
 * Reads Subjects sheet into class curriculum map
 */
function readSubjectsFromSheet(ss) {
  var sheet = ss.getSheetByName("Subjects");
  if (!sheet || sheet.getLastRow() < 2) return {};
  var data = sheet.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0] && row.length > 1) {
      var cls = String(row[0]).trim();
      var rawSub = row.length > 2 && isNaN(Number(row[2])) && !isNaN(Number(row[1])) ? row[2] : row[1];
      var list = String(rawSub).split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      if (list.length > 0) {
        map[cls] = list;
      }
    }
  }
  return map;
}

/**
 * Reads Teachers sheet into structured objects (No Email column)
 * Sequence: Name, Mobile, PIN, Assigned Class, Role
 */
function readTeachersFromSheet(ss) {
  var sheet = ss.getSheetByName("Teachers");
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0].map(function (h) { return String(h).toLowerCase().trim(); });
  
  var nameIdx = headers.findIndex(function (h) { return h.indexOf("name") !== -1 || h.indexOf("teacher") !== -1; });
  var mobileIdx = headers.findIndex(function (h) { return h.indexOf("mobile") !== -1 || h.indexOf("phone") !== -1 || h.indexOf("contact") !== -1; });
  var pinIdx = headers.findIndex(function (h) { return h.indexOf("pin") !== -1 || h.indexOf("pass") !== -1; });
  var classIdx = headers.findIndex(function (h) { return h.indexOf("class") !== -1; });
  var roleIdx = headers.findIndex(function (h) { return h.indexOf("role") !== -1 || h.indexOf("designation") !== -1; });

  if (nameIdx === -1) nameIdx = 0;
  if (mobileIdx === -1) mobileIdx = 1;
  if (pinIdx === -1) pinIdx = 2;
  if (classIdx === -1) classIdx = 3;
  if (roleIdx === -1) roleIdx = 4;

  var list = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var name = row[nameIdx] ? String(row[nameIdx]).trim() : "";
    var mobile = row[mobileIdx] ? String(row[mobileIdx]).replace(/\\D/g, "") : "";
    if (!name && !mobile) continue;

    var pin = row[pinIdx] ? String(row[pinIdx]).trim() : "1234";
    var assignedClass = row[classIdx] ? String(row[classIdx]).trim() : "All Classes";
    var role = row[roleIdx] ? String(row[roleIdx]).trim() : "Teacher";

    list.push({
      id: "T-" + (mobile || ("00" + i)),
      name: name,
      mobile: mobile,
      pin: pin,
      assignedClass: assignedClass,
      role: role
    });
  }
  return list;
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
 * Sequence: Class, Roll No, Student Name, Father's Name, Contact Number
 */
function syncStudents(ss, students) {
  var sheet = getOrCreateSheet(ss, "Students");
  sheet.clear();

  var headers = [
    "Class",
    "Roll No",
    "Student Name",
    "Father's Name",
    "Contact Number"
  ];
  applyHeaderStyles(sheet, headers);

  if (students.length === 0) return;

  var rows = students.map(function (s) {
    return [
      s.className || "",
      s.rollNo ? String(s.rollNo) : "",
      s.name || "",
      s.fatherName || "",
      s.contactNumber ? String(s.contactNumber) : ""
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  
  // Center alignment for Class, Roll No, Contact Number
  sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
  sheet.getRange(2, 2, rows.length, 1).setHorizontalAlignment("center");
  sheet.getRange(2, 5, rows.length, 1).setHorizontalAlignment("center");

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
 * Stores all subjects in a single cell, and respective marks in the next cell
 */
function syncMarks(ss, marks, students, subjectsMap) {
  var sheet = getOrCreateSheet(ss, "Marks");
  sheet.clear();

  var headers = [
    "Exam ID",
    "Roll No",
    "Student Name",
    "Class",
    "Subjects",
    "Marks Obtained",
    "Total Marks",
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
    var subjectKeys = Object.keys(subjMap);

    // If subjectsMap is provided for this class, preserve curriculum order
    if (subjectsMap && stClass && subjectsMap[stClass] && Array.isArray(subjectsMap[stClass])) {
      var classSubs = subjectsMap[stClass];
      var ordered = [];
      classSubs.forEach(function (cs) {
        if (subjMap.hasOwnProperty(cs)) {
          ordered.push(cs);
        }
      });
      subjectKeys.forEach(function (k) {
        if (ordered.indexOf(k) === -1) {
          ordered.push(k);
        }
      });
      subjectKeys = ordered;
    }

    var subjectsList = [];
    var marksList = [];
    var totalMarks = 0;

    subjectKeys.forEach(function (subject) {
      subjectsList.push(subject);
      var val = subjMap[subject];
      var numVal = (val !== undefined && val !== null && !isNaN(Number(val))) ? Number(val) : 0;
      marksList.push(numVal);
      totalMarks += numVal;
    });

    rows.push([
      examId,
      rollNo,
      stName,
      stClass,
      subjectsList.join(", "),
      marksList.join(", "),
      totalMarks,
      remarks
    ]);
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(2, 1, rows.length, 2).setHorizontalAlignment("center"); // Exam ID, Roll No
    sheet.getRange(2, 4, rows.length, 1).setHorizontalAlignment("center"); // Class
    sheet.getRange(2, 5, rows.length, 1).setHorizontalAlignment("left");   // Subjects
    sheet.getRange(2, 6, rows.length, 2).setHorizontalAlignment("center"); // Marks Obtained, Total Marks

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
 * 5. Synchronize Teachers Tab (Name, Mobile, PIN, Assigned Class, Role)
 */
function syncTeachers(ss, teachers) {
  var sheet = getOrCreateSheet(ss, "Teachers");
  sheet.clear();

  var headers = ["Name", "Mobile", "PIN", "Assigned Class", "Role"];
  applyHeaderStyles(sheet, headers);

  if (!teachers || teachers.length === 0) return;

  var rows = teachers.map(function (t) {
    return [
      t.name || "",
      t.mobile || "",
      t.pin || "1234",
      t.assignedClass || "All Classes",
      t.role || "Teacher"
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.getRange(2, 2, rows.length, 4).setHorizontalAlignment("center");

  for (var c = 1; c <= headers.length; c++) {
    sheet.autoResizeColumn(c);
  }
}

/**
 * 6. Append Log entry in Sync_Log Sheet
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
