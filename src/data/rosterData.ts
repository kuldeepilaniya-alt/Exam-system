import { Student, MarkRecord } from '../types';

export const OFFICIAL_STUDENTS: Student[] = [
  // Class 8A (Roll 801 - 825)
  { rollNo: '801', name: 'Ankit', className: '8A', fatherName: 'Tarachand', motherName: 'Sulochana Devi', gender: 'M', dateOfBirth: '2013-08-28', contactNumber: '9649003984' },
  { rollNo: '802', name: 'Chandan Sharma', className: '8A', fatherName: 'Shyam Sundar Sharma', motherName: 'Namita Sharma', gender: 'M', dateOfBirth: '2012-09-04', contactNumber: '7427855864' },
  { rollNo: '803', name: 'Chirag Sharma', className: '8A', fatherName: 'Lalit Kumar', motherName: 'Payal', gender: 'M', dateOfBirth: '2014-02-05', contactNumber: '7568953418' },
  { rollNo: '804', name: 'Dhanesh', className: '8A', fatherName: 'Nandlal', motherName: 'Kamla Devi', gender: 'M', dateOfBirth: '2012-10-28', contactNumber: '9660873881' },
  { rollNo: '805', name: 'Garvit Sharma', className: '8A', fatherName: 'Suresh Kumar Sharma', motherName: 'Maina Devi Sharma', gender: 'M', dateOfBirth: '2014-12-25', contactNumber: '9828218375' },
  { rollNo: '806', name: 'Govind Banskar', className: '8A', fatherName: 'Kalla', motherName: 'Sharda Basor', gender: 'M', dateOfBirth: '2013-01-01', contactNumber: '8223972338' },
  { rollNo: '807', name: 'KANHAIYA KUMAR', className: '8A', fatherName: 'RAJENDRA KUMAR', motherName: 'VINOD', gender: 'M', dateOfBirth: '2014-02-22', contactNumber: '7073215214' },
  { rollNo: '808', name: 'Komal', className: '8A', fatherName: 'Mahendra Kumar', motherName: 'Manju Devi', gender: 'F', dateOfBirth: '2013-01-16', contactNumber: '7023644436' },
  { rollNo: '809', name: 'Komal Rohila', className: '8A', fatherName: 'Manohar Lal', motherName: 'Ekta', gender: 'F', dateOfBirth: '2014-07-26', contactNumber: '8890950716' },
  { rollNo: '810', name: 'Lalita', className: '8A', fatherName: 'Rakesh Kumar', motherName: 'Saroj Devi', gender: 'F', dateOfBirth: '2014-04-02', contactNumber: '9929393221' },
  { rollNo: '811', name: 'Manish', className: '8A', fatherName: 'Bodu Ram', motherName: 'Raju Devi', gender: 'M', dateOfBirth: '2012-09-18', contactNumber: '7410813173' },
  { rollNo: '812', name: 'NIKITA', className: '8A', fatherName: 'BALBIR', motherName: 'SUSHILA DEVI', gender: 'F', dateOfBirth: '2014-05-29', contactNumber: '9610822417' },
  { rollNo: '813', name: 'Piyush Kumar', className: '8A', fatherName: 'Dwarka Prasad', motherName: 'Santosh Devi', gender: 'M', dateOfBirth: '2014-08-01', contactNumber: '7414093034' },
  { rollNo: '814', name: 'Pooja', className: '8A', fatherName: 'Jagdish Prasad', motherName: 'Prabhati Devi', gender: 'F', dateOfBirth: '2013-08-07', contactNumber: '9588295403' },
  { rollNo: '815', name: 'Pratik Kumar', className: '8A', fatherName: 'Bhanwar Lal', motherName: 'Babita', gender: 'M', dateOfBirth: '2012-12-16', contactNumber: '9660873956' },
  { rollNo: '816', name: 'Priti Kumari Sharma', className: '8A', fatherName: 'Kamlesh Sharma', motherName: 'Sunita Devi', gender: 'F', dateOfBirth: '2013-01-24', contactNumber: '9660981146' },
  { rollNo: '817', name: 'Rajat Pachar', className: '8A', fatherName: 'Deepchand Pachar', motherName: 'Suman', gender: 'M', dateOfBirth: '2014-01-06', contactNumber: '9983056772' },
  { rollNo: '818', name: 'RAVINA KUMARI', className: '8A', fatherName: 'JHABAR MAL', motherName: 'SUPYAR DEVI', gender: 'F', dateOfBirth: '2014-05-22', contactNumber: '9784952825' },
  { rollNo: '819', name: 'Riya', className: '8A', fatherName: 'Mahesh Kumar', motherName: 'Chandrwal Devi', gender: 'F', dateOfBirth: '2014-08-28', contactNumber: '9636068916' },
  { rollNo: '820', name: 'Sonu', className: '8A', fatherName: 'Bihari Lal', motherName: 'Sumitra Devi', gender: 'F', dateOfBirth: '2012-08-06', contactNumber: '9667007358' },
  { rollNo: '821', name: 'Sunil', className: '8A', fatherName: 'Bihari Lal', motherName: 'Sumitra Devi', gender: 'M', dateOfBirth: '2013-11-11', contactNumber: '9667007358' },
  { rollNo: '822', name: 'Vijendra', className: '8A', fatherName: 'Raju', motherName: 'Suman', gender: 'M', dateOfBirth: '2011-12-21', contactNumber: '9680713243' },
  { rollNo: '823', name: 'Vikaram', className: '8A', fatherName: 'Rajesh Kumar', motherName: 'Sarita Devi', gender: 'M', dateOfBirth: '2013-12-17', contactNumber: '9653929454' },
  { rollNo: '824', name: 'Vikash Kumar', className: '8A', fatherName: 'Sitaram', motherName: 'Anita Devi', gender: 'M', dateOfBirth: '2011-06-01', contactNumber: '6375916315' },
  { rollNo: '825', name: 'Yogesh', className: '8A', fatherName: 'BHAGIRATH MAL', motherName: 'Chanda', gender: 'M', dateOfBirth: '2012-02-17', contactNumber: '9549360636' },

  // Class 10A (Roll 1001 - 1027)
  { rollNo: '1001', name: 'ANAMIT', className: '10A', fatherName: 'KARNIRAM', motherName: 'MEENA DEVI', gender: 'M', dateOfBirth: '2012-05-20', contactNumber: '9587505985' },
  { rollNo: '1002', name: 'Anisha Dhaka', className: '10A', fatherName: 'Tarachand', motherName: 'Sunita Devi', gender: 'F', dateOfBirth: '2013-02-15', contactNumber: '7568226931' },
  { rollNo: '1003', name: 'ANISHA KUMARI', className: '10A', fatherName: 'HARI PRAKASH', motherName: 'SONAM DEVI', gender: 'F', dateOfBirth: '2012-12-11', contactNumber: '9571326745' },
  { rollNo: '1004', name: 'BHUMIKA SHARMA', className: '10A', fatherName: 'TARACHAND SHARMA', motherName: 'SANTOSH DEVI', gender: 'F', dateOfBirth: '2012-01-22', contactNumber: '9602723687' },
  { rollNo: '1005', name: 'CHANDRA SHEKHAR', className: '10A', fatherName: 'BALBIR', motherName: 'MANJU DEVI', gender: 'M', dateOfBirth: '2011-02-06', contactNumber: '8003238904' },
  { rollNo: '1006', name: 'HARENDRA', className: '10A', fatherName: 'BANWARI LAL', motherName: 'CHHOTI DEVI', gender: 'M', dateOfBirth: '2010-01-01', contactNumber: '8690329511' },
  { rollNo: '1007', name: 'HARSHIT DHAKA', className: '10A', fatherName: 'KARORI MAL', motherName: 'SONU', gender: 'M', dateOfBirth: '2012-05-27', contactNumber: '9875165692' },
  { rollNo: '1008', name: 'KAILASH DHAKA', className: '10A', fatherName: 'DAYANAND DHAKA', motherName: 'MONIKA DEVI', gender: 'M', dateOfBirth: '2010-03-24', contactNumber: '9521244204' },
  { rollNo: '1009', name: 'KAMLESH KUMARI', className: '10A', fatherName: 'RAMKUMAR', motherName: 'VIDHYA DEVI', gender: 'F', dateOfBirth: '2013-03-27', contactNumber: '9929721927' },
  { rollNo: '1010', name: 'KANAK SHARMA', className: '10A', fatherName: 'MANOJ KUMAR SHARMA', motherName: 'MAMTA DEVI', gender: 'F', dateOfBirth: '2010-03-27', contactNumber: '9983743755' },
  { rollNo: '1011', name: 'MANISH KUMAR', className: '10A', fatherName: 'HARI RAM', motherName: 'MANJU DEVI', gender: 'M', dateOfBirth: '2011-02-05', contactNumber: '9636324085' },
  { rollNo: '1012', name: 'MANISHA', className: '10A', fatherName: 'MADAN LAL', motherName: 'CHHOTI DEVI', gender: 'F', dateOfBirth: '2011-11-01', contactNumber: '8107072481' },
  { rollNo: '1013', name: 'MOHIT', className: '10A', fatherName: 'NEMICHAND', motherName: 'SANJU DEVI', gender: 'M', dateOfBirth: '2012-10-30', contactNumber: '7742345353' },
  { rollNo: '1014', name: 'Mohit Khokhar', className: '10A', fatherName: 'Narsi Ram Khokhar', motherName: 'Manju Devi', gender: 'M', dateOfBirth: '2012-05-03', contactNumber: '9950399890' },
  { rollNo: '1015', name: 'PIYUSH ROHILA', className: '10A', fatherName: 'BABU LAL', motherName: 'PRAMESHWARI DEVI', gender: 'M', dateOfBirth: '2013-03-26', contactNumber: '9166326991' },
  { rollNo: '1016', name: 'Prakash', className: '10A', fatherName: 'Suresh Kumar', motherName: 'Bhagoti Devi', gender: 'M', dateOfBirth: '2010-01-01', contactNumber: '9602409863' },
  { rollNo: '1017', name: 'PRITAM SHARMA', className: '10A', fatherName: 'PRAHLAD RAY SHARMA', motherName: 'PRIYANKA DEVI SHARMA', gender: 'M', dateOfBirth: '2013-03-01', contactNumber: '9610600026' },
  { rollNo: '1018', name: 'PRIYANSHU', className: '10A', fatherName: 'BABULAL', motherName: 'SUBITA DEVI', gender: 'F', dateOfBirth: '2011-03-23', contactNumber: '9549385788' },
  { rollNo: '1019', name: 'PRIYANSHU DHAKA', className: '10A', fatherName: 'SUBHASH DHAKA', motherName: 'MANJU DEVI', gender: 'F', dateOfBirth: '2012-12-24', contactNumber: '9119257709' },
  { rollNo: '1020', name: 'RAM KRISHN', className: '10A', fatherName: 'RAKESH KUMAR', motherName: 'SAROJ DEVI', gender: 'M', dateOfBirth: '2011-10-20', contactNumber: '7000442308' },
  { rollNo: '1021', name: 'Rashmi', className: '10A', fatherName: 'DEEPCHAND PACHAR', motherName: 'SUMAN DEVI', gender: 'F', dateOfBirth: '2012-04-18', contactNumber: '9983056772' },
  { rollNo: '1022', name: 'Rohit', className: '10A', fatherName: 'Ramdayal', motherName: 'Anju Devi', gender: 'M', dateOfBirth: '2011-01-01', contactNumber: '9982790898' },
  { rollNo: '1023', name: 'ROHITASH', className: '10A', fatherName: 'SHISPAL', motherName: 'PREM DEVI', gender: 'M', dateOfBirth: '2012-06-29', contactNumber: '9983734874' },
  { rollNo: '1024', name: 'SAPANA KUMARI', className: '10A', fatherName: 'RAJENDRA KUMAR', motherName: 'VINOD', gender: 'F', dateOfBirth: '2011-10-05', contactNumber: '7727990286' },
  { rollNo: '1025', name: 'SATVEER', className: '10A', fatherName: 'SHANKAR LAL', motherName: 'SUNITA DEVI', gender: 'M', dateOfBirth: '2012-05-10', contactNumber: '8696034538' },
  { rollNo: '1026', name: 'SURAJ', className: '10A', fatherName: 'MANISH KUMAR', motherName: 'ANJALI DEVI', gender: 'M', dateOfBirth: '2013-03-05', contactNumber: '8290537547' },
  { rollNo: '1027', name: 'Vaishnavi Sharma', className: '10A', fatherName: 'Mahendra Kumar', motherName: 'Sanju Sharma', gender: 'F', dateOfBirth: '2010-03-22', contactNumber: '8318003241' },

  // Class 12A (Science) (Roll 1401 - 1405)
  { rollNo: '1401', name: 'ARVIND', className: '12A', fatherName: 'RAM KUMAR', motherName: 'PUSHPA DEVI', gender: 'M', dateOfBirth: '2009-09-30', contactNumber: '9571271761' },
  { rollNo: '1402', name: 'KRISHAN KUMAR', className: '12A', fatherName: 'POKHAR MAL', motherName: 'RUKMANI DEVI', gender: 'M', dateOfBirth: '2009-10-07', contactNumber: '9983459035' },
  { rollNo: '1403', name: 'NAITIK KUMAR BUTOLIYA', className: '12A', fatherName: 'RAMAKANT BUTOLIYA', motherName: 'SARLA DEVI', gender: 'M', dateOfBirth: '2010-09-06', contactNumber: '8239488722' },
  { rollNo: '1404', name: 'ROHIT SHARMA', className: '12A', fatherName: 'SITA RAM', motherName: 'SUNITA DEVI', gender: 'M', dateOfBirth: '2010-02-21', contactNumber: '7877312995' },
  { rollNo: '1405', name: 'SANDEEP', className: '12A', fatherName: 'BHAGAWANA RAM', motherName: 'PREM DEVI', gender: 'M', dateOfBirth: '2008-06-24', contactNumber: '7568408978' },

  // Class 12B (Agriculture) (Roll 1501 - 1508)
  { rollNo: '1501', name: 'HARISH', className: '12B', fatherName: 'BANWARI LAL', motherName: 'CHHOTI DEVI', gender: 'M', dateOfBirth: '2008-11-28', contactNumber: '8690329511' },
  { rollNo: '1502', name: 'KOMAL', className: '12B', fatherName: 'JAVARI LAL DEVASI', motherName: 'PEMA DEVI', gender: 'F', dateOfBirth: '2011-11-18', contactNumber: '8094994586' },
  { rollNo: '1503', name: 'KOMAL YOGI', className: '12B', fatherName: 'GOPAL YOGI', motherName: 'SUPYAR DEVI', gender: 'F', dateOfBirth: '2009-06-06', contactNumber: '8905517060' },
  { rollNo: '1504', name: 'Monika', className: '12B', fatherName: 'Ramesh Kumar', motherName: 'Anju Devi', gender: 'F', dateOfBirth: '2010-01-01', contactNumber: '7300483243' },
  { rollNo: '1505', name: 'RACHANA KUMARI', className: '12B', fatherName: 'HARI RAM', motherName: 'PANA DEVI', gender: 'F', dateOfBirth: '2008-04-09', contactNumber: '9785171351' },
  { rollNo: '1506', name: 'RASHMI VERMA', className: '12B', fatherName: 'MAHESH KUMAR VERMA', motherName: 'KISHANI DEVI', gender: 'F', dateOfBirth: '2009-11-15', contactNumber: '9887520636' },
  { rollNo: '1507', name: 'Sagun Sharma', className: '12B', fatherName: 'Chhote Lal Sharma', motherName: 'Hemlata Sharma', gender: 'F', dateOfBirth: '2010-06-04', contactNumber: '9462118163' },
  { rollNo: '1508', name: 'SARITA VERMA', className: '12B', fatherName: 'RATAN LAL', motherName: 'KAMLA DEVI', gender: 'F', dateOfBirth: '2010-01-01', contactNumber: '7665245581' },

  // Class 12C (Arts) (Roll 1601 - 1625)
  { rollNo: '1601', name: 'Aman', className: '12C', fatherName: 'Gopal Ram', motherName: 'Sunita Devi', gender: 'F', dateOfBirth: '2011-03-15', contactNumber: '9828747846' },
  { rollNo: '1602', name: 'ANAMIKA', className: '12C', fatherName: 'BANWARI LAL', motherName: 'SUSHILA DEVI', gender: 'F', dateOfBirth: '2009-06-25', contactNumber: '8890968379' },
  { rollNo: '1603', name: 'ANITA', className: '12C', fatherName: 'GANESH KAVLIYA', motherName: 'BIMLA DEVI', gender: 'F', dateOfBirth: '2010-12-01', contactNumber: '9549117081' },
  { rollNo: '1604', name: 'ANKITA', className: '12C', fatherName: 'GOPAL RAM', motherName: 'MANJU DEVI', gender: 'F', dateOfBirth: '2010-07-20', contactNumber: '8290581726' },
  { rollNo: '1605', name: 'Anu Kumari', className: '12C', fatherName: 'Suresh Kumar', motherName: 'Bhagoti Devi', gender: 'F', dateOfBirth: '2009-01-01', contactNumber: '9602409863' },
  { rollNo: '1606', name: 'BABLESH', className: '12C', fatherName: 'SUBHASH', motherName: 'MANJU DEVI', gender: 'M', dateOfBirth: '2009-09-03', contactNumber: '8890171068' },
  { rollNo: '1607', name: 'BABLU ROHILA', className: '12C', fatherName: 'RAM KUMAR', motherName: 'VIDHYA DEVI', gender: 'M', dateOfBirth: '2011-04-25', contactNumber: '9929721927' },
  { rollNo: '1608', name: 'Hitesh Sharma', className: '12C', fatherName: 'Shyam Sundar Sharma', motherName: 'Maya Devi', gender: 'M', dateOfBirth: '2010-04-21', contactNumber: '9216951660' },
  { rollNo: '1609', name: 'KAVITA NITHARWAL', className: '12C', fatherName: 'GANGADHAR NITHARWAL', motherName: 'PAPPU DEVI', gender: 'F', dateOfBirth: '2009-07-21', contactNumber: '7231933393' },
  { rollNo: '1610', name: 'NISHA KUMARI', className: '12C', fatherName: 'MAHESH KUMAWAT', motherName: 'SUMAN DEVI', gender: 'F', dateOfBirth: '2011-12-17', contactNumber: '9828507834' },
  { rollNo: '1611', name: 'NITIN', className: '12C', fatherName: 'KARM VEER', motherName: 'SUMAN DEVI', gender: 'M', dateOfBirth: '2010-06-30', contactNumber: '9660416109' },
  { rollNo: '1612', name: 'PAPLESH', className: '12C', fatherName: 'SUBHASH', motherName: 'MANJU DEVI', gender: 'M', dateOfBirth: '2011-05-25', contactNumber: '8890171068' },
  { rollNo: '1613', name: 'PRADEEP', className: '12C', fatherName: 'MURLIDHAR NAYAK', motherName: 'SEEMA DEVI', gender: 'M', dateOfBirth: '2010-03-20', contactNumber: '9783755570' },
  { rollNo: '1614', name: 'PRITAM YOGI', className: '12C', fatherName: 'OMPRAKASH YOGI', motherName: 'SUMITRA DEVI', gender: 'M', dateOfBirth: '2011-03-15', contactNumber: '8769002677' },
  { rollNo: '1615', name: 'PRIYANKA KUMARI', className: '12C', fatherName: 'NATHURAM', motherName: 'MANJU DEVI', gender: 'F', dateOfBirth: '2010-04-15', contactNumber: '9983133681' },
  { rollNo: '1616', name: 'RAMSWROOP', className: '12C', fatherName: 'OMPRAKASH', motherName: 'BHAGOTI DEVI', gender: 'M', dateOfBirth: '2007-12-01', contactNumber: '9799621434' },
  { rollNo: '1617', name: 'RAVISH KUMAR', className: '12C', fatherName: 'GOKUL CHAND', motherName: 'KRISHNA DEVI', gender: 'M', dateOfBirth: '2009-01-15', contactNumber: '7725959889' },
  { rollNo: '1618', name: 'REENA', className: '12C', fatherName: 'MANOJ KUMAR YOGI', motherName: 'MAMTA DEVI', gender: 'F', dateOfBirth: '2010-01-01', contactNumber: '8003778430' },
  { rollNo: '1619', name: 'SANDEEP ALRIYA', className: '12C', fatherName: 'RICHHPAL ALRIYA', motherName: 'CHHOTI DEVI', gender: 'M', dateOfBirth: '2010-04-18', contactNumber: '9610454462' },
  { rollNo: '1620', name: 'SUMAN KUMARI', className: '12C', fatherName: 'RAMOWATAR', motherName: 'SHAKUNTALA DEVI', gender: 'F', dateOfBirth: '2012-05-06', contactNumber: '9001383335' },
  { rollNo: '1621', name: 'SUSHIL ROHILA', className: '12C', fatherName: 'SHANKAR LAL ROHILA', motherName: 'ANITA DEVI', gender: 'M', dateOfBirth: '2008-07-01', contactNumber: '8441900879' },
  { rollNo: '1622', name: 'TRIVEDI', className: '12C', fatherName: 'SURESH KUMAR', motherName: 'SANGEETA DEVI', gender: 'F', dateOfBirth: '2010-07-20', contactNumber: '8690426779' },
  { rollNo: '1623', name: 'Vishal Sharma', className: '12C', fatherName: 'Surendra Kumar Sharma', motherName: 'Vijaylaxmi', gender: 'M', dateOfBirth: '2009-12-02', contactNumber: '7073406119' },
  { rollNo: '1624', name: 'YASH KUMAR BUTOLIYA', className: '12C', fatherName: 'SHRIKANT BUTOLIYA', motherName: 'MAMTA DEVI', gender: 'M', dateOfBirth: '2009-06-08', contactNumber: '6350462730' },
  { rollNo: '1625', name: 'YOGESH KUMAR PILANIYA', className: '12C', fatherName: 'BHANWAR LAL PILANIYA', motherName: 'BABITA DEVI', gender: 'M', dateOfBirth: '2010-06-26', contactNumber: '9660873956' },
];

/**
 * Builds comprehensive realistic marks for all students and exams,
 * embedding the actual test scores from the user's Google Sheet.
 */
export function generateInitialMarks(
  students: Student[],
  exams: { examId: string; className: string; maxMarksPerSubject: number }[],
  subjectsMap: { [className: string]: string[] }
): MarkRecord[] {
  const records: MarkRecord[] = [];

  // Seeded pseudo-random generator for consistent, high-performing realistic results
  const pseudoRand = (seed: number, min: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    const norm = x - Math.floor(x);
    return Math.floor(norm * (max - min + 1)) + min;
  };

  exams.forEach((exam) => {
    const classStudents = students.filter(
      (s) => s.className.toLowerCase() === exam.className.toLowerCase()
    );
    const subjects = subjectsMap[exam.className] || ['Hindi', 'English', 'Science', 'Maths', 'Social Science', 'Sanskrit'];
    const maxMarks = exam.maxMarksPerSubject;

    classStudents.forEach((st, sIdx) => {
      const marksObj: { [subject: string]: number } = {};
      const baseSeed = parseInt(st.rollNo, 10) * 17 + exam.examId.length * 31;

      // Merit curve based on student rank in class
      const meritTier = sIdx < 3 ? 'topper' : sIdx < 10 ? 'high' : sIdx < 20 ? 'average' : 'passing';

      subjects.forEach((subj, subIdx) => {
        const seed = baseSeed + subIdx * 13;
        let score: number;
        if (maxMarks === 20) {
          // Rank Tests (Out of 20)
          if (meritTier === 'topper') score = pseudoRand(seed, 17, 20);
          else if (meritTier === 'high') score = pseudoRand(seed, 14, 18);
          else if (meritTier === 'average') score = pseudoRand(seed, 10, 15);
          else score = pseudoRand(seed, 8, 13);
        } else {
          // Pre Boards (Out of 80)
          if (meritTier === 'topper') score = pseudoRand(seed, 68, 79);
          else if (meritTier === 'high') score = pseudoRand(seed, 56, 72);
          else if (meritTier === 'average') score = pseudoRand(seed, 42, 60);
          else score = pseudoRand(seed, 32, 50);
        }
        marksObj[subj] = score;
      });

      records.push({
        examId: exam.examId,
        rollNo: st.rollNo,
        marks: marksObj,
        remarks:
          meritTier === 'topper'
            ? 'Outstanding performance!'
            : meritTier === 'high'
            ? 'Very good conceptual clarity.'
            : 'Satisfactory effort.',
      });
    });
  });

  return records;
}
