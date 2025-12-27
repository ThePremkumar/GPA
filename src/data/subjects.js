const REG_2021_SUBJECTS = {
    1: [
      {sem: 1, code: "BS3171", name: "Physics and Chemistry Laboratory", credits: 2},
      { sem: 1, code: "CY3151", name: "Engineering Chemistry", credits: 3 },
      {sem: 1, code: "GE3151",name: "Problem Solving and Python Programming", credits: 3},
      { sem: 1, code: "GE3152", name: "Heritage of Tamils", credits: 1 },
      {sem: 1, code: "GE3171", name: "Problem Solving and Python Programming Laboratory",credits: 2},
      { sem: 1, code: "GE3172", name: "English Laboratory", credits: 1 },
      { sem: 1, code: "HS3152", name: "Professional English - I", credits: 3 },
      { sem: 1, code: "MA3151", name: "Matrices and Calculus", credits: 4 },
      { sem: 1, code: "PH3151", name: "Engineering Physics", credits: 3 },
    ],
    2: [
      { sem: 2, code: "AD3251", name: "Data Structures Design", credits: 3 },
      {sem: 2,code: "AD3271",name: "Data Structures Design Laboratory",credits: 2},
      {sem: 2,code: "BE3251",name: "Basic Electrical and Electronics Engineering",credits: 3},
      {sem: 2, code: "GE3251", name: "Engineering Graphics", credits: 4 },
      {sem: 2, code: "GE3252", name: "தமிழரும் தொழில்நுட்பமும்", credits: 1 },
      {sem: 2,code: "GE3271",name: "Engineering Practices Laboratory",credits: 2},
      { sem: 2, code: "GE3272", name: "Communication Lab", credits: 2 },
      { sem: 2, code: "HS3252", name: "Professional English - II", credits: 2 },
      {sem: 2,code: "MA3251",name: "Statistics and Numerical Methods",credits: 4},
      {sem: 2,code: "PH3256",name: "Physics for Information Science",credits: 3},
    ],
    3: [
      {sem: 3,code: "AD3351",name: "Design and Analysis of Algorithms",credits: 4},
      {sem: 3,code: "AD3491",name: "Fundamentals of Data Science and Analytics",credits: 3},
      {sem: 3,code: "CS3351",name: "Digital Principles and Computer Organization",credits: 4},
      {sem: 3,code: "CS3381",name: "Object-Oriented Programming Laboratory",credits: 1.5},
      {sem: 3,code: "CS3391",name: "Object-Oriented Programming",credits: 3},
      { sem: 3, code: "CW3301", name: "Fundamentals of Economics", credits: 3 },
      {sem: 3,code: "CW3311",name: "Business Communication Laboratory I",credits: 1.5},
      { sem: 3, code: "GE3361", name: "Professional Development", credits: 1 },
      { sem: 3, code: "MA3354", name: "Discrete Mathematics", credits: 4 },
    ],
    4: [
      {sem: 4,code: "AD3461",name: "Machine Learning Laboratory",credits: 2},
      { sem: 4, code: "AL3451", name: "Machine Learning", credits: 3 },
      { sem: 4, code: "AL3452", name: "Operating Systems", credits: 4 },
      {sem: 4,code: "CS3481",name: "Database Management Systems Laboratory",credits: 1.5},
      {sem: 4,code: "CS3492",name: "Database Management Systems",credits: 3},
      {sem: 4,code: "CW3401",name: "Introduction to Business Systems",credits: 3},
      {sem: 4,code: "CW3411",name: "Business Communication Laboratory II",credits: 1.5},
      {sem: 4,code: "GE3451",name: "Environmental Sciences and Sustainability",credits: 2},
      {sem: 4,code: "MA3391",name: "Probability and Statistics",credits: 4},
    ],
    5: [
      { sem: 5, code: "CCS336", name: "Cloud Service Management", credits: 3 },
      { sem: 5, code: "CCS346", name: "Exploratory Data Analysis", credits: 3 },
      { sem: 5, code: "CS3691", name: "Embedded Systems and IoT", credits: 4 },
      {sem: 5,code: "CW3501",name: "Fundamentals of Management",credits: 3},
      { sem: 5, code: "CW3511", name: "Summer Internship", credits: 2 },
      {sem: 5,code: "CW3551",name: "Data and Information Security",credits: 3},
      {sem: 5,code: "MX3084",name: "Disaster Risk Reduction and Management (Non-credit)",credits: 0},
    ],
    6: [
      {sem: 6, code: "CW3601", name: "Business Analytics", credits: 3 },
      {sem: 6, code: "CCB331", name: "Marketing Research and Marketing Management", credits: 3 },
      {sem: 6,code: "CW3007",name: "IT Project Management",credits: 3},
      {sem: 6, code: "CCS356", name: "Object Oriented Software Engineering", credits: 3 },
      {sem: 6, code: "CCS337", name: "Cognitive Science", credits: 3 },
      {sem: 6,code: "OIE351",name: "Introduction to Industrial Engineering",credits: 3},
      {sem: 6,code: "MX3086",name: "History of Science and Technology in India (Non-credit)",credits: 0},
      {sem: 6, code: "CW3611", name: "Business Analytics Laboratory", credits: 2 }
    ],
};

const REG_2023_SUBJECTS = {
    1: [
      { sem: 1,code: "PUCC1HM01",name: "Professional English - I",credits: 2},
      { sem: 1, code: "PUCC1BS01", name: "Matrices and Calculus", credits: 4 },
      { sem: 1, code: "PUCC1BS02", name: "Engineering Physics", credits: 3 },
      { sem: 1, code: "PUCC1BS03", name: "Engineering Chemistry", credits: 3 },
      { sem: 1, code: "PUCC1BE01", name: "Engineering Graphics", credits: 4 },
      { sem: 1, code: "PUCC1HM02", name: "Heritage of Tamil", credits: 1 },
      { sem: 1,code: "PUCC1PL01",name: "Professional English - I(Lab)",credits: 2},
      { sem: 1,code: "PUCC1PL02",name: "Physics and Chemistry Laboratory",credits: 2},
    ],
    2: [
      {sem: 2,code: "PUCC2HMO4",name: "Professional English - II",credits: 2},
      {sem: 2,code: "PUCC2BS04",name: "Statistics and Numerical Methods",credits: 4},
      {sem: 2,code: "PUCS2BS05",name: "Physics for Information Sciences",credits: 3},
      {sem: 2,code: "PUCC2BE02",name: "Basic Electrical and Electronics Engineering",credits: 3},
      {sem: 2,code: "PUCC2BE03",name: "Introduction to Computer Science & Business Systems",credits: 3},
      {sem: 2,code: "PUCC2BE04",name: "Problem Solving using Python Programming",credits: 2},
      {sem: 2,code: "PUCC2HM05",name: "தமிழரும் தொழில்நுட்பமும்",credits: 1},
      {sem: 2,code: "PUCC2PL03",name: "Professional English - II(Lab)",credits: 2},
      {sem: 2,code: "PUCC2PL04",name: "Problem Solving using Python Programming Laboratory",credits: 2},
      {sem: 2,code: "PUCC2PL05",name: "Civil and Mechanical Engineering Practices",credits: 1},
      {sem: 2,code: "PUCC2PL06",name: "Electrical and Electronics Engineering Preactices",credits: 1},
    ],
    3: [
      {sem: 3,code: "PUAD2BE03",name: "Fundamentals of Data Science and Analytics",credits: 3},
      {sem: 3,code: "PUAD3PL02",name: "Fundamentals of Data Science and Analytics Laboratory",credits: 2},
      {sem: 3,code: "PUCB3BS09",name: "Discrete Mathematics", credits: 4 },
      {sem: 3,code: "PUCB3PL01",name: "Business Communication Laboratory",credits: 1,},
      {sem: 3,code: "PUCC3HM07",name: "Extension Activities", credits: 0 },
      {sem: 3,code: "PUCC3MC04",name: "Mandatory(Non-credit)",credits: 0},
      {sem: 3,code: "PUCS3PC01",name: "Computer Organization & Architecture",credits: 4},
      {sem: 3,code: "PUCS3PC03",name: "Data Structures and Algorithms",credits: 4},
      {sem: 3,code: "PUCS3PC04",name: "Object-Oriented Programming",credits: 3},
      {sem: 3,code: "PUCS3PL02",name: "Object-Oriented Programmin Laboratory",credits: 2},
    ] ,
    4: [
        { sem:4, code: "PUCC4BS06", name: "Environmental Sciences & Sustainability", credits: 3 },
        { sem:4, code: "PUCB4PC01", name: "Intoduction to Innovation, IPR and Product Development", credits: 3 },
        { sem:4, code: "PUCB4PC02", name: "Embedded Systems and IOT", credits: 4 },
        { sem:4, code: "PUIT4PC03", name: "Database Management Systems", credits: 4 },
        { sem:4, code: "PUIT4PC04", name: "Operating Systems", credits: 4 },
        { sem:4, code: "PUCC4MCXX", name: "Mandatory Course-II(Non-credit)", credits: 0 },
        { sem:4, code: "PUIT4PL01", name: "Operating Systems Laboratory", credits: 2 },
        { sem:4, code: "PUIT4PL02", name: "Database Management Systems Laboratory", credits: 2 },
        { sem:4, code: "PUCC4HM08", name: "Extension Activities", credits: 0 },
        { sem:4, code: "PUCB4IP01", name: "In-Plant Training/Internship", credits: 0 }
    ],
};

export const subjectsData = {
  // Regulation 2017 Batches
  "2017-2021": REG_2021_SUBJECTS, 
  "2018-2022": REG_2021_SUBJECTS,
  "2019-2023": REG_2021_SUBJECTS,
  "2020-2024": REG_2021_SUBJECTS,

  // Regulation 2021 Batches
  "2021-2025": REG_2021_SUBJECTS,
  "2022-2026": REG_2021_SUBJECTS,

  // Regulation 2023 Batches
  "2023-2027": REG_2023_SUBJECTS,
  "2024-2028": REG_2023_SUBJECTS,
  "2025-2029": REG_2023_SUBJECTS,

  // Regulation 2026 Batches
  "2026-2030": REG_2023_SUBJECTS,
  "2027-2031": REG_2023_SUBJECTS,
  "2028-2032": REG_2023_SUBJECTS,
};
