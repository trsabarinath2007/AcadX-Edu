const express = require("express");

const router = express.Router();

const { protect, roles } = require("../middleware/auth");

const Course = require("../models/Course");
const User = require("../models/User");
const AcademicRecord = require("../models/AcademicRecord");

/* =========================================================
   HELPERS
========================================================= */

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function calculateGrade(total) {
  if (total >= 90) return { grade: "O", gpa: 10 };
  if (total >= 80) return { grade: "A+", gpa: 9 };
  if (total >= 70) return { grade: "A", gpa: 8 };
  if (total >= 60) return { grade: "B+", gpa: 7 };
  if (total >= 50) return { grade: "B", gpa: 6 };
  if (total >= 40) return { grade: "C", gpa: 5 };

  return { grade: "F", gpa: 0 };
}

/* =========================================================
   GET FACULTY MARKS
   GET /api/academic/faculty/marks
========================================================= */

router.get(
  "/faculty/marks",
  protect,
  roles("faculty"),
  async (req, res) => {
    try {
      const { courseId, section } = req.query;

      if (!courseId) {
        return res.status(400).json({
          message: "Course is required.",
        });
      }

      if (!section) {
        return res.status(400).json({
          message: "Section is required.",
        });
      }

      const course = await Course.findOne({
        _id: courseId,
        faculty: req.user._id,
      }).populate("department", "name code");

      if (!course) {
        return res.status(403).json({
          message:
            "You are not authorized to manage marks for this course.",
        });
      }

      const requestedSection = normalize(section);

      const courseSections = Array.isArray(course.sections)
        ? course.sections
        : [];

      const validSection = courseSections.find(
        (item) => normalize(item) === requestedSection
      );

      if (!validSection) {
        return res.status(400).json({
          message: `Section ${section} is not assigned to this course.`,
        });
      }

      const studentQuery = {
        role: "student",
        active: true,
        semester: course.semester,
        section: validSection,
      };

      if (course.department?._id) {
        studentQuery.department = course.department._id;
      } else if (course.department) {
        studentQuery.department = course.department;
      }

      const students = await User.find(studentQuery)
        .select(
          "name email registerNumber semester section department active"
        )
        .sort({ registerNumber: 1, name: 1 });

      const studentIds = students.map(
        (student) => student._id
      );

      const records = await AcademicRecord.find({
        course: course._id,
        student: { $in: studentIds },
      });

      const recordMap = new Map();

      records.forEach((record) => {
        recordMap.set(String(record.student), record);
      });

      const result = students.map((student) => {
        const record = recordMap.get(String(student._id));

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          registerNumber: student.registerNumber,
          semester: student.semester,
          section: student.section,

          internalMarks: record?.internalMarks ?? "",
          externalMarks: record?.externalMarks ?? "",
          totalMarks: record?.totalMarks ?? "",
          grade: record?.grade ?? "",
          gpa: record?.gpa ?? "",

          recordId: record?._id || null,
        };
      });

      return res.json({
        course: {
          _id: course._id,
          code: course.code,
          name: course.name,
          semester: course.semester,
          sections: course.sections,
          department: course.department,
        },
        section: validSection,
        students: result,
      });
    } catch (error) {
      console.error("Faculty marks GET error:", error);

      return res.status(500).json({
        message: "Failed to load faculty marks.",
        error: error.message,
      });
    }
  }
);

/* =========================================================
   SAVE FACULTY MARKS
   POST /api/academic/faculty/marks
========================================================= */

router.post(
  "/faculty/marks",
  protect,
  roles("faculty"),
  async (req, res) => {
    try {
      const {
        courseId,
        section,
        records,
      } = req.body;

      if (!courseId) {
        return res.status(400).json({
          message: "Course is required.",
        });
      }

      if (!section) {
        return res.status(400).json({
          message: "Section is required.",
        });
      }

      if (!Array.isArray(records)) {
        return res.status(400).json({
          message: "Records must be an array.",
        });
      }

      if (records.length === 0) {
        return res.status(400).json({
          message: "No marks were provided.",
        });
      }

      const course = await Course.findOne({
        _id: courseId,
        faculty: req.user._id,
      });

      if (!course) {
        return res.status(403).json({
          message:
            "You are not authorized to manage marks for this course.",
        });
      }

      const requestedSection = normalize(section);

      const courseSections = Array.isArray(course.sections)
        ? course.sections
        : [];

      const validSection = courseSections.find(
        (item) => normalize(item) === requestedSection
      );

      if (!validSection) {
        return res.status(400).json({
          message: `Section ${section} is not assigned to this course.`,
        });
      }

      const studentQuery = {
        role: "student",
        active: true,
        semester: course.semester,
        section: validSection,
      };

      if (course.department) {
        studentQuery.department = course.department;
      }

      const students = await User.find(studentQuery).select(
        "_id name registerNumber"
      );

      const validStudentIds = new Set(
        students.map((student) =>
          String(student._id)
        )
      );

      const savedRecords = [];

      for (const item of records) {
        const studentId = item.studentId;

        if (!studentId) {
          continue;
        }

        if (!validStudentIds.has(String(studentId))) {
          return res.status(400).json({
            message:
              "One or more students do not belong to this course/section.",
          });
        }

        let internalMarks =
          item.internalMarks === "" ||
          item.internalMarks === null ||
          item.internalMarks === undefined
            ? null
            : Number(item.internalMarks);

        let externalMarks =
          item.externalMarks === "" ||
          item.externalMarks === null ||
          item.externalMarks === undefined
            ? null
            : Number(item.externalMarks);

        if (
          internalMarks !== null &&
          (!Number.isFinite(internalMarks) ||
            internalMarks < 0 ||
            internalMarks > 50)
        ) {
          return res.status(400).json({
            message:
              "Internal marks must be between 0 and 50.",
          });
        }

        if (
          externalMarks !== null &&
          (!Number.isFinite(externalMarks) ||
            externalMarks < 0 ||
            externalMarks > 50)
        ) {
          return res.status(400).json({
            message:
              "External marks must be between 0 and 50.",
          });
        }

        let totalMarks = null;

        if (
          internalMarks !== null &&
          externalMarks !== null
        ) {
          totalMarks =
            internalMarks + externalMarks;
        } else if (internalMarks !== null) {
          totalMarks = internalMarks;
        } else if (externalMarks !== null) {
          totalMarks = externalMarks;
        }

        let grade = "";
        let gpa = null;

        if (totalMarks !== null) {
          const calculated =
            calculateGrade(totalMarks);

          grade = calculated.grade;
          gpa = calculated.gpa;
        }

        const academicRecord =
          await AcademicRecord.findOneAndUpdate(
            {
              student: studentId,
              course: course._id,
            },
            {
              student: studentId,
              course: course._id,
              semester: course.semester,
              internalMarks,
              externalMarks,
              totalMarks,
              grade,
              gpa,
            },
            {
              new: true,
              upsert: true,
              runValidators: true,
              setDefaultsOnInsert: true,
            }
          );

        savedRecords.push(academicRecord);
      }

      return res.json({
        message: "Marks saved successfully.",
        records: savedRecords,
      });
    } catch (error) {
      console.error("Faculty marks POST error:", error);

      return res.status(500).json({
        message: "Failed to save faculty marks.",
        error: error.message,
      });
    }
  }
);

module.exports = router;