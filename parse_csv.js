import fs from 'fs';

const csv = fs.readFileSync('students_data.csv', 'utf8');
const lines = csv.trim().split('\n').slice(1);
const students = lines.map(line => {
  const [className, rollNo, name, fatherName, dob, contact] = line.split(',');
  return {
    studentId: `STU-${rollNo}`,
    name: name.trim(),
    rollNo: rollNo.trim(),
    className: className.trim(),
    fatherName: fatherName.trim(),
    motherName: '',
    dob: dob.trim(),
    contactNumber: contact.trim()
  };
});
console.log('import { Student } from "../types";\n\nexport const OFFICIAL_STUDENTS: Student[] = ' + JSON.stringify(students, null, 2) + ';');
