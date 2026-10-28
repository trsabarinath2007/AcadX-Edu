require("dotenv").config();

const connectDB = require("./config/db");

const User = require("./models/User");
const Department = require("./models/Department");
const Course = require("./models/Course");
const Assignment = require("./models/Assignment");
const Quiz = require("./models/Quiz");
const Announcement = require("./models/Announcement");
const Attendance = require("./models/Attendance");
const AcademicRecord = require("./models/AcademicRecord");

async function seed() {
  await connectDB();

  /*
   * ============================================================
   * CLEAR EXISTING DEMO DATA
   * ============================================================
   */

  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Course.deleteMany({}),
    Assignment.deleteMany({}),
    Quiz.deleteMany({}),
    Announcement.deleteMany({}),
    Attendance.deleteMany({}),
    AcademicRecord.deleteMany({})
  ]);

  /*
   * ============================================================
   * DEPARTMENTS
   * ============================================================
   */

  const cs = await Department.create({
    name: "Computer Science & Engineering",
    code: "CSE"
  });

  const it = await Department.create({
    name: "Information Technology",
    code: "IT"
  });

  /*
   * ============================================================
   * ADMIN
   * ============================================================
   */

  const admin = await User.create({
    name: "AcadX Administrator",
    email: "admin@acadx.edu",
    password: "Admin@123",
    role: "admin"
  });

  /*
   * ============================================================
   * FACULTY
   * ============================================================
   */

  const faculty = await User.create({
    name: "Prof. Marcus Brody",
    email: "faculty@acadx.edu",
    password: "faculty123",
    role: "faculty",
    department: cs._id,
    mustChangePassword: true
  });

  /*
   * ============================================================
   * STUDENT
   * ============================================================
   */

  const student = await User.create({
    name: "Alex Chen",
    email: "student@acadx.edu",
    password: "student123",
    role: "student",
    registerNumber: "CS-2024-042",
    department: cs._id,
    semester: 5,
    section: "A",
    mustChangePassword: true
  });

  /*
   * ============================================================
   * COURSES
   * ============================================================
   */

  const courses = await Course.insertMany([
    {
      code: "CS501",
      name: "Data Structures and Algorithms",
      department: cs._id,
      semester: 5,
      sections: ["A", "B"],
      credits: 4,
      faculty: faculty._id,
      content: {
        description: "Design and analysis of algorithms and fundamental data structures used to build efficient software.",
        objectives: ["Master linear and non-linear data structures", "Analyze time and space complexity", "Apply searching, sorting, hashing and graph algorithms"],
        prerequisites: ["Basic programming", "Object-oriented programming"],
        units: [
          { unitNumber: 1, title: "Arrays, Strings and Linked Lists", topics: ["arrays", "strings", "linked lists", "two pointers", "sliding window"], content: "Representation, operations, traversal, searching and common interview patterns." },
          { unitNumber: 2, title: "Stacks, Queues and Hashing", topics: ["stack", "queue", "deque", "hash table"], content: "Applications, implementation and complexity analysis." },
          { unitNumber: 3, title: "Trees and Heaps", topics: ["binary trees", "BST", "heap", "priority queue"], content: "Traversals, insertion, deletion, balancing concepts and heap-based algorithms." },
          { unitNumber: 4, title: "Graphs", topics: ["BFS", "DFS", "topological sort", "Dijkstra", "DSU"], content: "Graph representations, traversal, shortest paths, connectivity and spanning structures." },
          { unitNumber: 5, title: "Algorithm Design", topics: ["sorting", "greedy", "dynamic programming", "backtracking"], content: "Problem solving strategies and complexity trade-offs." }
        ],
        referenceBooks: ["Thomas H. Cormen et al. - Introduction to Algorithms", "Mark Allen Weiss - Data Structures and Algorithm Analysis"],
        outcomes: ["Choose appropriate data structures", "Analyze algorithm complexity", "Implement efficient solutions"]
      }
    },
    {
      code: "CS502",
      name: "Database Management Systems",
      department: cs._id,
      semester: 5,
      sections: ["A", "B"],
      credits: 4,
      faculty: faculty._id,
      content: {
        description: "Relational database design, SQL, transactions, indexing and modern database concepts.",
        objectives: ["Design normalized relational schemas", "Write advanced SQL queries", "Understand transactions, concurrency and recovery"],
        prerequisites: ["Basic programming", "Discrete mathematics"],
        units: [
          { unitNumber: 1, title: "Database Fundamentals", topics: ["DBMS architecture", "ER model", "relational model"], content: "Data models, schemas, keys, constraints and ER-to-relational mapping." },
          { unitNumber: 2, title: "SQL", topics: ["DDL", "DML", "joins", "subqueries", "views"], content: "Querying and manipulating relational data with SQL." },
          { unitNumber: 3, title: "Normalization", topics: ["functional dependencies", "1NF", "2NF", "3NF", "BCNF"], content: "Dependency analysis and decomposition." },
          { unitNumber: 4, title: "Transactions", topics: ["ACID", "serializability", "locking", "deadlocks"], content: "Concurrency control and transaction processing." },
          { unitNumber: 5, title: "Storage and Recovery", topics: ["indexing", "B-trees", "hashing", "logging", "recovery"], content: "Physical storage, indexes and crash recovery." }
        ],
        referenceBooks: ["Abraham Silberschatz et al. - Database System Concepts", "Raghu Ramakrishnan - Database Management Systems"],
        outcomes: ["Design robust databases", "Write complex SQL", "Explain transaction and recovery mechanisms"]
      }
    },
    {
      code: "CS503",
      name: "Operating Systems",
      department: cs._id,
      semester: 5,
      sections: ["A", "B"],
      credits: 4,
      content: {
        description: "Operating system organization, processes, threads, memory, storage and file systems.",
        objectives: ["Understand OS architecture", "Analyze process and memory management", "Explain synchronization and deadlocks"],
        units: [
          { unitNumber: 1, title: "OS Fundamentals and Processes", topics: ["system calls", "processes", "threads", "IPC"], content: "OS services, process lifecycle, scheduling basics and inter-process communication." },
          { unitNumber: 2, title: "CPU Scheduling", topics: ["FCFS", "SJF", "priority", "round robin"], content: "Scheduling algorithms, metrics and multi-level queues." },
          { unitNumber: 3, title: "Synchronization and Deadlocks", topics: ["mutex", "semaphore", "critical section", "deadlock"], content: "Synchronization primitives, classical problems and deadlock handling." },
          { unitNumber: 4, title: "Memory Management", topics: ["paging", "segmentation", "virtual memory", "page replacement"], content: "Address translation, demand paging and replacement algorithms." },
          { unitNumber: 5, title: "File and Storage Systems", topics: ["file systems", "disk scheduling", "I/O"], content: "File allocation, directories, disks and storage management." }
        ],
        referenceBooks: ["Abraham Silberschatz et al. - Operating System Concepts"],
        outcomes: ["Explain process management", "Evaluate scheduling algorithms", "Analyze memory and storage techniques"]
      }
    },
    {
      code: "CS504",
      name: "Computer Networks",
      department: cs._id,
      semester: 5,
      sections: ["A", "B"],
      credits: 3,
      content: {
        description: "Computer communication networks, protocols, addressing, routing, transport and application services.",
        objectives: ["Understand layered network architecture", "Configure addressing and routing concepts", "Explain reliable transport and application protocols"],
        units: [
          { unitNumber: 1, title: "Network Fundamentals", topics: ["OSI", "TCP/IP", "topologies", "transmission"], content: "Layered architectures, media, switching and network performance." },
          { unitNumber: 2, title: "Data Link Layer", topics: ["framing", "error detection", "Ethernet", "MAC"], content: "Reliable link communication and LAN technologies." },
          { unitNumber: 3, title: "Network Layer", topics: ["IPv4", "IPv6", "subnetting", "routing"], content: "Logical addressing and routing algorithms." },
          { unitNumber: 4, title: "Transport Layer", topics: ["TCP", "UDP", "flow control", "congestion control"], content: "End-to-end delivery, reliability and congestion handling." },
          { unitNumber: 5, title: "Application Layer", topics: ["HTTP", "DNS", "SMTP", "DHCP"], content: "Common internet application protocols and services." }
        ],
        referenceBooks: ["James Kurose and Keith Ross - Computer Networking: A Top-Down Approach"],
        outcomes: ["Explain network protocols", "Solve subnetting problems", "Compare transport and routing mechanisms"]
      }
    },
    {
      code: "CS505",
      name: "Advanced Software Engineering",
      department: cs._id,
      semester: 5,
      sections: ["A", "B"],
      credits: 3,
      content: {
        description: "Modern software engineering practices covering requirements, architecture, design, testing, DevOps and maintenance.",
        objectives: ["Model software requirements", "Design maintainable systems", "Apply testing and delivery practices"],
        units: [
          { unitNumber: 1, title: "Requirements Engineering", topics: ["functional requirements", "non-functional requirements", "use cases"], content: "Elicitation, analysis, specification and validation." },
          { unitNumber: 2, title: "Architecture and Design", topics: ["architecture styles", "SOLID", "design patterns"], content: "System decomposition, interfaces and reusable design." },
          { unitNumber: 3, title: "Testing", topics: ["unit testing", "integration testing", "system testing"], content: "Test strategy, automation, coverage and defect management." },
          { unitNumber: 4, title: "Agile and Project Management", topics: ["Scrum", "Kanban", "estimation", "risk"], content: "Iterative development and team coordination." },
          { unitNumber: 5, title: "DevOps and Maintenance", topics: ["CI/CD", "version control", "deployment", "monitoring"], content: "Automated delivery, observability and software evolution." }
        ],
        referenceBooks: ["Ian Sommerville - Software Engineering", "Robert C. Martin - Clean Code"],
        outcomes: ["Create software specifications", "Select suitable architecture and design patterns", "Plan testing and deployment"]
      }
    },
    {
      code: "IT501",
      name: "Web Technologies",
      department: it._id,
      semester: 5,
      sections: ["A"],
      credits: 3,
      content: {
        description: "Client-side and server-side web development, REST APIs, databases, authentication and deployment.",
        objectives: ["Build responsive web interfaces", "Develop RESTful backends", "Integrate databases and authentication"],
        units: [
          { unitNumber: 1, title: "HTML and CSS", topics: ["semantic HTML", "CSS", "responsive design"], content: "Accessible page structure, layout and responsive styling." },
          { unitNumber: 2, title: "JavaScript", topics: ["ES6", "DOM", "events", "async"], content: "Modern JavaScript and browser programming." },
          { unitNumber: 3, title: "React", topics: ["components", "state", "hooks", "routing"], content: "Component-based single page application development." },
          { unitNumber: 4, title: "Backend and APIs", topics: ["Node.js", "Express", "REST", "middleware"], content: "Server-side APIs, validation and authentication." },
          { unitNumber: 5, title: "Databases and Deployment", topics: ["MongoDB", "SQL basics", "security", "cloud deployment"], content: "Data persistence, secure configuration and production deployment." }
        ],
        referenceBooks: ["Jon Duckett - HTML and CSS", "Marijn Haverbeke - Eloquent JavaScript"],
        outcomes: ["Build responsive web applications", "Create REST APIs", "Deploy a full-stack web application"]
      }
    }
  ]);

  /*
   * ============================================================
   * ASSIGN COURSES TO FACULTY
   * ============================================================
   */

  faculty.facultyCourses = [
    courses[0]._id,
    courses[1]._id
  ];

  await faculty.save();

  /*
   * ============================================================
   * ASSIGNMENTS
   * ============================================================
   */

  await Assignment.create([
    {
      title: "Binary Search Tree Implementation",
      description:
        "Implement insertion, search and traversal for a binary search tree.",
      course: courses[0]._id,
      dueDate: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ),
      totalMarks: 20,
      instructions:
        "Submit your Java source code and explanation.",
      createdBy: faculty._id
    },
    {
      title: "SQL Subqueries Practice",
      description:
        "Solve the supplied SQL subquery exercises.",
      course: courses[1]._id,
      dueDate: new Date(
        Date.now() + 4 * 24 * 60 * 60 * 1000
      ),
      totalMarks: 25,
      createdBy: faculty._id
    }
  ]);

  /*
   * ============================================================
   * QUIZ
   * ============================================================
   */

  await Quiz.create({
    title: "Database Systems Quiz 1",
    course: courses[1]._id,
    topic: "Relational Algebra and SQL",
    difficulty: "Medium",
    durationMinutes: 20,
    createdBy: faculty._id,

    questions: [
      {
        question:
          "Which operation combines rows from two relations based on a condition?",
        options: [
          "Selection",
          "Join",
          "Projection",
          "Rename"
        ],
        correctAnswer: "Join",
        marks: 1
      },
      {
        question:
          "Which SQL clause filters groups after aggregation?",
        options: [
          "WHERE",
          "ORDER BY",
          "HAVING",
          "FROM"
        ],
        correctAnswer: "HAVING",
        marks: 1
      }
    ]
  });

  /*
   * ============================================================
   * ACADEMIC RECORDS
   * ============================================================
   */

  await AcademicRecord.insertMany([
    {
      student: student._id,
      course: courses[0]._id,
      semester: 5,
      internalMarks: 45,
      externalMarks: 42,
      totalMarks: 87,
      grade: "A+",
      gpa: 9
    },
    {
      student: student._id,
      course: courses[1]._id,
      semester: 5,
      internalMarks: 44,
      externalMarks: 41,
      totalMarks: 85,
      grade: "A+",
      gpa: 9
    },
    {
      student: student._id,
      course: courses[2]._id,
      semester: 5,
      internalMarks: 40,
      externalMarks: 37,
      totalMarks: 77,
      grade: "B+",
      gpa: 8
    },
    {
      student: student._id,
      course: courses[3]._id,
      semester: 5,
      internalMarks: 43,
      externalMarks: 40,
      totalMarks: 83,
      grade: "A",
      gpa: 8.5
    }
  ]);

  /*
   * ============================================================
   * ATTENDANCE
   *
   * IMPORTANT:
   * Attendance now requires `section`.
   * ============================================================
   */

  const attendanceDocs = [];

  for (const course of courses.slice(0, 4)) {
    for (let i = 0; i < 10; i++) {
      attendanceDocs.push({
        course: course._id,
        student: student._id,

        // FIX:
        // Attendance schema now requires section.
        section: student.section,

        date: new Date(
          Date.now() - i * 86400000
        ),

        status:
          i === 4 && course.code === "CS503"
            ? "absent"
            : "present",

        markedBy: faculty._id
      });
    }
  }

  await Attendance.insertMany(attendanceDocs);

  /*
   * ============================================================
   * ANNOUNCEMENTS
   * ============================================================
   */

  await Announcement.create([
    {
      title: "Unit 4 Graph Algorithms Lecture Slides",
      body: "Updated lecture material is now available.",
      audience: "students",
      createdBy: faculty._id
    },
    {
      title: "Internal Assessment Schedule",
      body:
        "The latest internal assessment schedule has been published.",
      audience: "all",
      createdBy: admin._id
    }
  ]);

  /*
   * ============================================================
   * SUCCESS
   * ============================================================
   */

  console.log("\n==========================================");
  console.log("      AcadX demo data created");
  console.log("==========================================");

  console.log("\nAdmin:");
  console.log("Email    : admin@acadx.edu");
  console.log("Password : Admin@123");

  console.log("\nFaculty:");
  console.log("Email    : faculty@acadx.edu");
  console.log("Password : Faculty@123");

  console.log("\nStudent:");
  console.log("Email    : student@acadx.edu");
  console.log("Password : Student@123");

  console.log("\n==========================================\n");

  process.exit(0);
}

seed().catch((error) => {
  console.error("\nSeed failed:");
  console.error(error);
  process.exit(1);
});