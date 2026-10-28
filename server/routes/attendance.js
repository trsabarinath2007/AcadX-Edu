const express = require("express");

const Attendance = require("../models/Attendance");
const Course = require("../models/Course");
const User = require("../models/User");

const { protect, roles } = require("../middleware/auth");

const router = express.Router();


/* ============================================================
   HELPERS
============================================================ */

function normalizeDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const value = String(dateValue).trim();

  /*
   * We expect YYYY-MM-DD from the frontend.
   * Store it at UTC midnight so the same day
   * always maps to the same Attendance record.
   */
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}


function formatDateForQuery(date) {
  return {
    $gte: date,
    $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
  };
}


/* ============================================================
   ALL ATTENDANCE ROUTES REQUIRE LOGIN
============================================================ */

router.use(protect);


/* ============================================================
   FACULTY
   GET ASSIGNED COURSES
============================================================ */

router.get(
  "/faculty/courses",
  roles("faculty"),
  async (req, res) => {
    try {
      const courses = await Course.find({
        faculty: req.user._id
      })
        .populate("department", "name code")
        .sort({
          semester: 1,
          code: 1
        });

      res.json({
        courses
      });
    } catch (error) {
      console.error(
        "Faculty courses error:",
        error
      );

      res.status(500).json({
        message: "Failed to load faculty courses"
      });
    }
  }
);


/* ============================================================
   FACULTY
   GET STUDENTS FOR A COURSE + SECTION + DATE
============================================================ */

router.get(
  "/faculty/students",
  roles("faculty"),
  async (req, res) => {
    try {
      const {
        courseId,
        section,
        date
      } = req.query;

      if (!courseId || !section || !date) {
        return res.status(400).json({
          message:
            "Course, section and date are required"
        });
      }

      const attendanceDate =
        normalizeDate(date);

      if (!attendanceDate) {
        return res.status(400).json({
          message:
            "Date must be in YYYY-MM-DD format"
        });
      }

      /*
       * Make sure this course belongs
       * to the logged-in faculty.
       */
      const course = await Course.findOne({
        _id: courseId,
        faculty: req.user._id
      }).populate(
        "department",
        "name code"
      );

      if (!course) {
        return res.status(403).json({
          message:
            "You are not assigned to this course"
        });
      }

      const normalizedSection =
        String(section)
          .trim()
          .toUpperCase();

      /*
       * Make sure the requested section
       * actually belongs to this course.
       */
      if (
        !course.sections
          .map((item) =>
            String(item)
              .trim()
              .toUpperCase()
          )
          .includes(normalizedSection)
      ) {
        return res.status(400).json({
          message:
            "This section is not assigned to the course"
        });
      }

      /*
       * Students must belong to:
       *
       * - role = student
       * - same department
       * - same semester
       * - same section
       */
      const students =
        await User.find({
          role: "student",

          department:
            course.department._id,

          semester:
            course.semester,

          section:
            normalizedSection,

          active: true
        })
          .select(
            "name email registerNumber semester section"
          )
          .sort({
            registerNumber: 1
          });

      /*
       * Get existing attendance records
       * for this exact course/section/date.
       */
      const attendance =
        await Attendance.find({
          course: course._id,

          section:
            normalizedSection,

          date:
            formatDateForQuery(
              attendanceDate
            )
        }).select(
          "student status markedBy"
        );

      const attendanceMap =
        new Map(
          attendance.map((record) => [
            String(record.student),
            record
          ])
        );

      const result =
        students.map((student) => {
          const record =
            attendanceMap.get(
              String(student._id)
            );

          return {
            _id: student._id,
            name: student.name,
            email: student.email,
            registerNumber:
              student.registerNumber,
            semester:
              student.semester,
            section:
              student.section,

            status:
              record?.status || null,

            markedBy:
              record?.markedBy || null
          };
        });

      res.json({
        course: {
          _id: course._id,
          code: course.code,
          name: course.name,
          semester: course.semester,
          sections: course.sections,
          department:
            course.department
        },

        date,

        section:
          normalizedSection,

        students:
          result
      });
    } catch (error) {
      console.error(
        "Faculty attendance students error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load attendance students",
        error: error.message
      });
    }
  }
);


/* ============================================================
   FACULTY
   MARK / UPDATE ATTENDANCE
============================================================ */

router.post(
  "/faculty/mark",
  roles("faculty"),
  async (req, res) => {
    try {
      const {
        courseId,
        section,
        date,
        records
      } = req.body;

      if (
        !courseId ||
        !section ||
        !date ||
        !Array.isArray(records)
      ) {
        return res.status(400).json({
          message:
            "Course, section, date and attendance records are required"
        });
      }

      if (records.length === 0) {
        return res.status(400).json({
          message:
            "At least one attendance record is required"
        });
      }

      const attendanceDate =
        normalizeDate(date);

      if (!attendanceDate) {
        return res.status(400).json({
          message:
            "Date must be in YYYY-MM-DD format"
        });
      }

      const normalizedSection =
        String(section)
          .trim()
          .toUpperCase();

      /*
       * Verify that the logged-in faculty
       * owns this course.
       */
      const course = await Course.findOne({
        _id: courseId,
        faculty: req.user._id
      }).populate(
        "department",
        "name code"
      );

      if (!course) {
        return res.status(403).json({
          message:
            "You are not assigned to this course"
        });
      }

      /*
       * Verify that the section belongs
       * to the course.
       */
      if (
        !course.sections
          .map((item) =>
            String(item)
              .trim()
              .toUpperCase()
          )
          .includes(normalizedSection)
      ) {
        return res.status(400).json({
          message:
            "This section is not assigned to the course"
        });
      }

      /*
       * Only allow:
       *
       * present
       * absent
       */
      const invalidStatus =
        records.find(
          (record) =>
            !["present", "absent"].includes(
              record.status
            )
        );

      if (invalidStatus) {
        return res.status(400).json({
          message:
            "Attendance status must be present or absent"
        });
      }

      const studentIds =
        records.map(
          (record) =>
            record.studentId
        );

      /*
       * Load only valid students from
       * this course's department,
       * semester and section.
       */
      const students =
        await User.find({
          _id: {
            $in: studentIds
          },

          role: "student",

          department:
            course.department._id,

          semester:
            course.semester,

          section:
            normalizedSection
        }).select("_id");

      const validStudentIds =
        new Set(
          students.map(
            (student) =>
              String(student._id)
          )
        );

      /*
       * Reject any student that doesn't
       * belong to this faculty's class.
       */
      const invalidStudent =
        studentIds.find(
          (studentId) =>
            !validStudentIds.has(
              String(studentId)
            )
        );

      if (invalidStudent) {
        return res.status(403).json({
          message:
            "One or more students do not belong to this course section"
        });
      }

      /*
       * Upsert each attendance record.
       *
       * If today's attendance already
       * exists, it is updated.
       *
       * Otherwise, it is created.
       */
      const operations =
        records.map((record) => ({
          updateOne: {
            filter: {
              course: course._id,

              student:
                record.studentId,

              section:
                normalizedSection,

              date:
                attendanceDate
            },

            update: {
              $set: {
                status:
                  record.status,

                markedBy:
                  req.user._id
              }
            },

            upsert: true
          }
        }));

      await Attendance.bulkWrite(
        operations
      );

      res.json({
        message:
          "Attendance saved successfully",

        courseId:
          course._id,

        section:
          normalizedSection,

        date,

        updatedCount:
          records.length
      });
    } catch (error) {
      console.error(
        "Mark attendance error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to save attendance",
        error: error.message
      });
    }
  }
);


/* ============================================================
   STUDENT
   VIEW OWN ATTENDANCE
============================================================ */

router.get(
  "/student",
  roles("student"),
  async (req, res) => {
    try {
      const attendance =
        await Attendance.find({
          student:
            req.user._id
        })
          .populate(
            "course",
            "code name semester sections"
          )
          .populate(
            "markedBy",
            "name email"
          )
          .sort({
            date: -1
          });

      res.json({
        attendance
      });
    } catch (error) {
      console.error(
        "Student attendance error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load attendance"
      });
    }
  }
);


/* ============================================================
   STUDENT
   ATTENDANCE SUMMARY
============================================================ */

router.get(
  "/student/summary",
  roles("student"),
  async (req, res) => {
    try {
      const records =
        await Attendance.find({
          student:
            req.user._id
        }).populate(
          "course",
          "code name semester"
        );

      const courseMap =
        new Map();

      for (const record of records) {
        if (!record.course) {
          continue;
        }

        const courseId =
          String(record.course._id);

        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, {
            course:
              record.course,

            total: 0,

            present: 0,

            absent: 0
          });
        }

        const item =
          courseMap.get(courseId);

        item.total++;

        if (
          record.status ===
          "present"
        ) {
          item.present++;
        } else {
          item.absent++;
        }
      }

      const summary =
        [...courseMap.values()].map(
          (item) => ({
            ...item,

            percentage:
              item.total > 0
                ? Number(
                    (
                      (item.present /
                        item.total) *
                      100
                    ).toFixed(2)
                  )
                : 0
          })
        );

      const total =
        records.length;

      const present =
        records.filter(
          (record) =>
            record.status ===
            "present"
        ).length;

      const absent =
        records.filter(
          (record) =>
            record.status ===
            "absent"
        ).length;

      res.json({
        overall: {
          total,
          present,
          absent,

          percentage:
            total > 0
              ? Number(
                  (
                    (present /
                      total) *
                    100
                  ).toFixed(2)
                )
              : 0
        },

        courses:
          summary
      });
    } catch (error) {
      console.error(
        "Student attendance summary error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to calculate attendance summary"
      });
    }
  }
);


/* ============================================================
   ADMIN
   ATTENDANCE OVERVIEW
============================================================ */

router.get(
  "/admin/overview",
  roles("admin"),
  async (req, res) => {
    try {
      const {
        department,
        semester,
        section,
        courseId,
        date
      } = req.query;

      const studentFilter = {
        role: "student"
      };

      if (department) {
        studentFilter.department =
          department;
      }

      if (semester) {
        studentFilter.semester =
          Number(semester);
      }

      if (section) {
        studentFilter.section =
          String(section)
            .trim()
            .toUpperCase();
      }

      const students =
        await User.find(
          studentFilter
        )
          .populate(
            "department",
            "name code"
          )
          .select(
            "name email registerNumber department semester section active"
          )
          .sort({
            registerNumber: 1
          });

      const attendanceFilter = {};

      if (courseId) {
        attendanceFilter.course =
          courseId;
      }

      if (date) {
        const attendanceDate =
          normalizeDate(date);

        if (!attendanceDate) {
          return res.status(400).json({
            message:
              "Date must be in YYYY-MM-DD format"
          });
        }

        attendanceFilter.date =
          formatDateForQuery(
            attendanceDate
          );
      }

      const attendance =
        await Attendance.find(
          attendanceFilter
        )
          .populate(
            "course",
            "code name semester sections department faculty"
          )
          .populate(
            "student",
            "name email registerNumber department semester section"
          )
          .populate(
            "markedBy",
            "name email"
          )
          .sort({
            date: -1
          });

      /*
       * If department / semester /
       * section filters were provided,
       * filter attendance after population.
       */
      const filteredAttendance =
        attendance.filter(
          (record) => {
            const student =
              record.student;

            if (!student) {
              return false;
            }

            if (
              department &&
              String(
                student.department
              ) !==
                String(department)
            ) {
              return false;
            }

            if (
              semester &&
              Number(
                student.semester
              ) !==
                Number(semester)
            ) {
              return false;
            }

            if (
              section &&
              String(
                student.section
              ).toUpperCase() !==
                String(section)
                  .toUpperCase()
            ) {
              return false;
            }

            return true;
          }
        );

      const totalRecords =
        filteredAttendance.length;

      const presentRecords =
        filteredAttendance.filter(
          (record) =>
            record.status ===
            "present"
        ).length;

      const absentRecords =
        filteredAttendance.filter(
          (record) =>
            record.status ===
            "absent"
        ).length;

      const overallPercentage =
        totalRecords > 0
          ? Number(
              (
                (presentRecords /
                  totalRecords) *
                100
              ).toFixed(2)
            )
          : 0;

      /*
       * Student-level summary.
       */
      const studentMap =
        new Map();

      for (const record of filteredAttendance) {
        if (!record.student) {
          continue;
        }

        const studentId =
          String(
            record.student._id
          );

        if (
          !studentMap.has(studentId)
        ) {
          studentMap.set(
            studentId,
            {
              student:
                record.student,

              total: 0,

              present: 0,

              absent: 0
            }
          );
        }

        const item =
          studentMap.get(
            studentId
          );

        item.total++;

        if (
          record.status ===
          "present"
        ) {
          item.present++;
        } else {
          item.absent++;
        }
      }

      const studentSummary =
        [...studentMap.values()]
          .map((item) => ({
            ...item,

            percentage:
              item.total > 0
                ? Number(
                    (
                      (item.present /
                        item.total) *
                      100
                    ).toFixed(2)
                  )
                : 0
          }))
          .sort(
            (a, b) =>
              a.percentage -
              b.percentage
          );

      res.json({
        statistics: {
          totalStudents:
            students.length,

          totalRecords,

          presentRecords,

          absentRecords,

          overallPercentage
        },

        students:
          studentSummary,

        attendance:
          filteredAttendance
      });
    } catch (error) {
      console.error(
        "Admin attendance overview error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load attendance overview",
        error: error.message
      });
    }
  }
);


module.exports = router;