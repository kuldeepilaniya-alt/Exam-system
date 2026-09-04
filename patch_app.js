const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const handlers = `
  const handleUpdateExams = (newExams: Exam[]) => {
    setExams(newExams);
    saveExams(newExams);
  };

  const handleUpdateSubjectsMap = (newMap: { [className: string]: string[] }) => {
    setSubjectsMap(newMap);
    saveSubjectsMap(newMap);
  };

  const handleUpdateTeachers = (newTeachers: TeacherUser[]) => {
    setTeachers(newTeachers);
    saveTeachers(newTeachers);
  };
`;

content = content.replace(/const handleAddExam[\s\S]*?saveExams\(updated\);\n  };/, \`$&
\${handlers}\`);

content = content.replace(/<TeacherDashboard\n/, \`<TeacherDashboard
            teachers={teachers}
            onUpdateExams={handleUpdateExams}
            onUpdateSubjectsMap={handleUpdateSubjectsMap}
            onUpdateTeachers={handleUpdateTeachers}
\`);

fs.writeFileSync('src/App.tsx', content, 'utf8');
