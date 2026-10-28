const express = require("express");

const User = require("../models/User");
const Course = require("../models/Course");
const Attendance = require("../models/Attendance");
const AcademicRecord = require("../models/AcademicRecord");
const Submission = require("../models/Submission");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");

const { protect } = require("../middleware/auth");
const { askOllama } = require("../services/ai");

const router = express.Router();

router.use(protect);

/* =========================================================
   HELPERS
========================================================= */

function average(values) {
  const numbers = values
    .map(Number)
    .filter((value) => Number.isFinite(value));

  if (!numbers.length) return 0;

  return (
    numbers.reduce((sum, value) => sum + value, 0) /
    numbers.length
  );
}

function round(value, decimals = 1) {
  return Number(Number(value || 0).toFixed(decimals));
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

/* =========================================================
   STUDENT ANALYTICS
========================================================= */

router.get("/student", async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Students only",
      });
    }

    const [
      attendance,
      records,
      attempts,
      courses,
      submissions,
    ] = await Promise.all([
      Attendance.find({
        student: req.user._id,
      }).populate("course", "code name"),

      AcademicRecord.find({
        student: req.user._id,
      }).populate("course", "code name"),

      QuizAttempt.find({
        student: req.user._id,
      }),

      Course.find({
        department:
          req.user.department?._id ||
          req.user.department,

        semester: req.user.semester,

        ...(req.user.section
          ? { sections: req.user.section }
          : {}),
      }),

      Submission.countDocuments({
        student: req.user._id,
        status: "submitted",
      }),
    ]);

    const totalAttendance = attendance.length;

    const present = attendance.filter(
      (item) => item.status === "present"
    ).length;

    const attendancePercentage =
      totalAttendance > 0
        ? (present / totalAttendance) * 100
        : 0;

    const gpa = average(
      records.map((record) => record.gpa)
    );

    const quizAverage = average(
      attempts.map((attempt) => attempt.percentage)
    );

    const engagement = Math.min(
      100,
      Math.round(
        attendancePercentage * 0.4 +
          quizAverage * 0.35 +
          (Math.min(submissions, 10) / 10) * 25
      )
    );

    const riskScore = Math.max(
      0,
      Math.round(
        (100 - attendancePercentage) * 0.45 +
          (100 - quizAverage) * 0.35 +
          (100 - engagement) * 0.2
      )
    );

    const riskLevel =
      riskScore >= 65
        ? "High"
        : riskScore >= 35
        ? "Moderate"
        : "Low";

    res.json({
      analytics: {
        attendance: {
          attendancePercentage: round(
            attendancePercentage
          ),
        },

        academics: {
          gpa: round(gpa, 2),
          quizAverage: round(quizAverage),
        },

        courses,

        engagement,

        riskScore,

        riskLevel,

        weakAreas: [
          attendancePercentage < 75
            ? "Attendance"
            : null,

          quizAverage < 60
            ? "Quiz performance"
            : null,
        ].filter(Boolean),

        recommendations: [
          attendancePercentage < 75
            ? "Attend upcoming classes consistently."
            : "Maintain your current attendance.",

          quizAverage < 60
            ? "Review quiz topics and attempt practice questions."
            : "Continue regular quiz practice.",
        ],
      },
    });
  } catch (error) {
    console.error(
      "Student analytics error:",
      error
    );

    res.status(500).json({
      message: "Failed to load student analytics.",
    });
  }
});

/* =========================================================
   FACULTY ANALYTICS
========================================================= */

router.get("/faculty", async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res.status(403).json({
        message: "Faculty only",
      });
    }

    /* -----------------------------------------------------
       1. Faculty's courses
    ----------------------------------------------------- */

    const courses = await Course.find({
      faculty: req.user._id,
    }).populate("department", "name code");

    const courseIds = courses.map(
      (course) => course._id
    );

    if (!courseIds.length) {
      return res.json({
        analytics: {
          students: 0,
          courses: 0,
          averageAttendance: 0,
          averageGpa: 0,
          averageQuiz: 0,
          engagement: 0,
          atRiskStudents: [],
          coursePerformance: [],
          attendanceTrend: [],
          gradeDistribution: [],
        },
      });
    }

    /* -----------------------------------------------------
       2. Find students belonging to faculty courses
    ----------------------------------------------------- */

    const allStudents = await User.find({
      role: "student",
      active: true,
    }).select(
      "name email registerNumber semester section department"
    );

    const facultyStudents = allStudents.filter(
      (student) =>
        courses.some(
          (course) =>
            String(course.department?._id || course.department) ===
              String(
                student.department?._id ||
                  student.department
              ) &&
            Number(course.semester) ===
              Number(student.semester) &&
            Array.isArray(course.sections) &&
            course.sections.some(
              (section) =>
                normalize(section) ===
                normalize(student.section)
            )
        )
    );

    const studentIds = facultyStudents.map(
      (student) => student._id
    );

    /* -----------------------------------------------------
       3. Get all relevant data
    ----------------------------------------------------- */

    const [
      attendance,
      records,
      quizzes,
      submissions,
    ] = await Promise.all([
      Attendance.find({
        course: { $in: courseIds },
      }),

      AcademicRecord.find({
        course: { $in: courseIds },
      }),

      Quiz.find({
        course: { $in: courseIds },
        createdBy: req.user._id,
      }).select(
        "_id title course createdBy"
      ),

      Submission.find({
        student: { $in: studentIds },
      }).populate(
        "assignment",
        "title course createdBy totalMarks maxMarks"
      ),
    ]);

    const quizIds = quizzes.map(
      (quiz) => quiz._id
    );

    const quizAttempts = quizIds.length
      ? await QuizAttempt.find({
          quiz: { $in: quizIds },
        }).select(
          "quiz student percentage"
        )
      : [];

    /* =====================================================
       OVERALL ATTENDANCE
    ===================================================== */

    const totalAttendance = attendance.length;

    const totalPresent = attendance.filter(
      (item) => item.status === "present"
    ).length;

    const averageAttendance =
      totalAttendance > 0
        ? (totalPresent / totalAttendance) * 100
        : 0;

    /* =====================================================
       OVERALL GPA
    ===================================================== */

    const averageGpa = average(
      records.map((record) => record.gpa)
    );

    /* =====================================================
       OVERALL QUIZ
    ===================================================== */

    const averageQuiz = average(
      quizAttempts.map(
        (attempt) => attempt.percentage
      )
    );

    /* =====================================================
       COURSE PERFORMANCE
    ===================================================== */

    const coursePerformance = courses.map(
      (course) => {
        const courseAttendance =
          attendance.filter(
            (item) =>
              String(item.course) ===
              String(course._id)
          );

        const coursePresent =
          courseAttendance.filter(
            (item) =>
              item.status === "present"
          ).length;

        const attendancePercentage =
          courseAttendance.length
            ? (coursePresent /
                courseAttendance.length) *
              100
            : 0;

        const courseRecords =
          records.filter(
            (record) =>
              String(record.course) ===
              String(course._id)
          );

        const courseGpa = average(
          courseRecords.map(
            (record) => record.gpa
          )
        );

        const courseQuizIds =
          quizzes
            .filter(
              (quiz) =>
                String(quiz.course) ===
                String(course._id)
            )
            .map((quiz) =>
              String(quiz._id)
            );

        const courseAttempts =
          quizAttempts.filter(
            (attempt) =>
              courseQuizIds.includes(
                String(attempt.quiz)
              )
          );

        const courseQuizAverage =
          average(
            courseAttempts.map(
              (attempt) =>
                attempt.percentage
            )
          );

        const courseStudents =
          facultyStudents.filter(
            (student) =>
              String(
                student.department?._id ||
                  student.department
              ) ===
                String(
                  course.department?._id ||
                    course.department
                ) &&
              Number(student.semester) ===
                Number(course.semester) &&
              course.sections?.some(
                (section) =>
                  normalize(section) ===
                  normalize(student.section)
              )
          );

        return {
          _id: course._id,
          code: course.code,
          name: course.name,
          semester: course.semester,

          students: courseStudents.length,

          attendance: round(
            attendancePercentage
          ),

          gpa: round(courseGpa, 2),

          quizAverage: round(
            courseQuizAverage
          ),
        };
      }
    );

    /* =====================================================
       AT-RISK STUDENTS
    ===================================================== */

    const atRiskStudents = facultyStudents
      .map((student) => {
        const studentAttendance =
          attendance.filter(
            (item) =>
              String(item.student) ===
              String(student._id)
          );

        const studentPresent =
          studentAttendance.filter(
            (item) =>
              item.status === "present"
          ).length;

        const attendancePercentage =
          studentAttendance.length
            ? (studentPresent /
                studentAttendance.length) *
              100
            : 0;

        const studentRecords =
          records.filter(
            (record) =>
              String(record.student) ===
              String(student._id)
          );

        const studentGpa = average(
          studentRecords.map(
            (record) => record.gpa
          )
        );

        const studentAttempts =
          quizAttempts.filter(
            (attempt) =>
              String(attempt.student) ===
              String(student._id)
          );

        const studentQuizAverage =
          average(
            studentAttempts.map(
              (attempt) =>
                attempt.percentage
            )
          );

        const reasons = [];

        if (attendancePercentage < 75) {
          reasons.push("Low attendance");
        }

        if (
          studentGpa > 0 &&
          studentGpa < 6
        ) {
          reasons.push("Low GPA");
        }

        if (
          studentQuizAverage > 0 &&
          studentQuizAverage < 60
        ) {
          reasons.push("Low quiz performance");
        }

        const riskScore = Math.round(
          (100 - attendancePercentage) *
            0.45 +
            (100 -
              (studentQuizAverage || 100)) *
              0.35 +
            (studentGpa > 0
              ? (10 - studentGpa) * 10 * 0.2
              : 0)
        );

        return {
          _id: student._id,

          name: student.name,

          registerNumber:
            student.registerNumber,

          section: student.section,

          semester: student.semester,

          attendance: round(
            attendancePercentage
          ),

          gpa: round(studentGpa, 2),

          quizAverage: round(
            studentQuizAverage
          ),

          riskScore,

          reasons,
        };
      })
      .filter(
        (student) =>
          student.reasons.length > 0
      )
      .sort(
        (a, b) =>
          b.riskScore - a.riskScore
      )
      .slice(0, 10);

    /* =====================================================
       ENGAGEMENT
    ===================================================== */

    const engagement = Math.round(
      average([
        averageAttendance,
        averageQuiz,
        Math.min(
          100,
          (submissions.length /
            Math.max(
              facultyStudents.length,
              1
            )) *
            100
        ),
      ])
    );

    /* =====================================================
       ATTENDANCE TREND
    ===================================================== */

    const monthMap = {};

    attendance.forEach((item) => {
      if (!item.date) return;

      const date = new Date(item.date);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const month = date.toLocaleString(
        "en-US",
        {
          month: "short",
        }
      );

      if (!monthMap[month]) {
        monthMap[month] = {
          month,
          present: 0,
          total: 0,
        };
      }

      monthMap[month].total += 1;

      if (item.status === "present") {
        monthMap[month].present += 1;
      }
    });

    const attendanceTrend = Object.values(
      monthMap
    ).map((item) => ({
      month: item.month,
      attendance: round(
        item.total
          ? (item.present /
              item.total) *
              100
          : 0
      ),
    }));

    /* =====================================================
       GRADE DISTRIBUTION
    ===================================================== */

    const gradeMap = {
      O: 0,
      "A+": 0,
      A: 0,
      "B+": 0,
      B: 0,
      C: 0,
      F: 0,
    };

    records.forEach((record) => {
      const grade = String(
        record.grade || ""
      ).trim();

      if (
        Object.prototype.hasOwnProperty.call(
          gradeMap,
          grade
        )
      ) {
        gradeMap[grade]++;
      }
    });

    const gradeDistribution =
      Object.entries(gradeMap).map(
        ([grade, count]) => ({
          grade,
          count,
        })
      );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.json({
      analytics: {
        students: facultyStudents.length,

        courses: courses.length,

        averageAttendance: round(
          averageAttendance
        ),

        averageGpa: round(
          averageGpa,
          2
        ),

        averageQuiz: round(
          averageQuiz
        ),

        engagement,

        atRiskStudents,

        coursePerformance,

        attendanceTrend,

        gradeDistribution,

        quizCount: quizzes.length,

        submissionCount:
          submissions.length,
      },
    });
  } catch (error) {
    console.error(
      "Faculty analytics error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to load faculty analytics.",
      error: error.message,
    });
  }
});

/* =========================================================
   FACULTY STUDENTS
========================================================= */

router.get(
  "/faculty/students",
  async (req, res) => {
    try {
      if (req.user.role !== "faculty") {
        return res.status(403).json({
          message: "Faculty only",
        });
      }

      const courses = await Course.find({
        faculty: req.user._id,
      }).populate(
        "department",
        "name code"
      );

      const students = await User.find({
        role: "student",
        active: true,
      })
        .select(
          "name email registerNumber semester section department"
        )
        .populate(
          "department",
          "name code"
        )
        .sort({
          registerNumber: 1,
          name: 1,
        });

      const visibleStudents =
        students
          .map((student) => {
            const matchedCourses =
              courses.filter(
                (course) =>
                  String(
                    course.department?._id ||
                      course.department
                  ) ===
                    String(
                      student.department?._id ||
                        student.department
                    ) &&
                  Number(course.semester) ===
                    Number(student.semester) &&
                  course.sections?.some(
                    (section) =>
                      normalize(section) ===
                      normalize(
                        student.section
                      )
                  )
              );

            return {
              ...student.toObject(),

              courses: matchedCourses.map(
                (course) => ({
                  _id: course._id,
                  code: course.code,
                  name: course.name,
                })
              ),
            };
          })
          .filter(
            (student) =>
              student.courses.length > 0
          );

      res.json({
        students: visibleStudents,

        courses: courses.map(
          (course) => ({
            _id: course._id,
            code: course.code,
            name: course.name,
            semester: course.semester,
            sections:
              course.sections || [],
            department:
              course.department,
          })
        ),
      });
    } catch (error) {
      console.error(
        "Faculty students analytics error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load faculty students.",
      });
    }
  }
);

/* =========================================================
   ADMIN ANALYTICS
========================================================= */

router.get("/admin", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin only",
      });
    }

    const Department =
      require("../models/Department");

    const [
      students,
      faculty,
      departments,
      courses,
      attendance,
      records,
      attempts,
    ] = await Promise.all([
      User.countDocuments({
        role: "student",
      }),

      User.countDocuments({
        role: "faculty",
      }),

      Department.countDocuments(),

      Course.countDocuments(),

      Attendance.find().select(
        "status"
      ),

      AcademicRecord.find().select(
        "gpa"
      ),

      QuizAttempt.find().select(
        "percentage"
      ),
    ]);

    const avgAttendance =
      attendance.length
        ? (attendance.filter(
            (item) =>
              item.status ===
              "present"
          ).length /
            attendance.length) *
          100
        : 0;

    res.json({
      analytics: {
        students,

        faculty,

        departments,

        courses,

        averageGpa: round(
          average(
            records.map(
              (item) => item.gpa
            )
          ),
          2
        ),

        averageAttendance:
          round(avgAttendance),

        averageQuiz: round(
          average(
            attempts.map(
              (item) =>
                item.percentage
            )
          )
        ),
      },
    });
  } catch (error) {
    console.error(
      "Admin analytics error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load admin analytics.",
    });
  }
});

/* =========================================================
   STUDENT AI
========================================================= */

router.post(
  "/student-ai",
  async (req, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({
          message: "Students only",
        });
      }

      const { analytics } =
        req.body;

      const prompt = `
You are AcadX Academic Intelligence Assistant.

Analyze this student data and return a concise academic analysis.

Use these headings:
Summary
Strengths
Concerns
Weak Areas
Recommendations
Priority Actions

Student data:
${JSON.stringify(analytics)}
`;

      const response =
        await askOllama(prompt);

      res.json({
        response,
      });
    } catch (error) {
      console.error(
        "Student AI error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to generate AI analysis.",
      });
    }
  }
);

/* =========================================================
   FACULTY AI
========================================================= */

router.post(
  "/faculty-ai",
  async (req, res) => {
    try {
      if (
        !["faculty", "admin"].includes(
          req.user.role
        )
      ) {
        return res.status(403).json({
          message:
            "Faculty/Admin only",
        });
      }

      const prompt = `
You are AcadX Faculty Class Insights Assistant.

Analyze the following class data.

Return the following headings:

Class Summary
Key Concerns
Weak Areas
Suggested Actions
Teaching Improvement Recommendations

Data:
${JSON.stringify(req.body)}
`;

      const response =
        await askOllama(prompt);

      res.json({
        response,
      });
    } catch (error) {
      console.error(
        "Faculty AI error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to generate faculty AI insights.",
      });
    }
  }
);

module.exports = router;