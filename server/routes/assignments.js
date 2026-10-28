const express = require("express");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Course = require("../models/Course");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

/*
|--------------------------------------------------------------------------
| GET ASSIGNMENTS
|--------------------------------------------------------------------------
|
| ADMIN:
|   Read-only institutional monitoring.
|   Admin receives assignment metadata + creator.
|
| FACULTY:
|   Sees assignments created by that faculty member.
|
| STUDENT:
|   Use /student endpoint for student-specific assignments.
|
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    let assignments;

    /*
    |--------------------------------------------------------------------------
    | ADMIN
    |--------------------------------------------------------------------------
    |
    | Admin can ONLY monitor assignments.
    | Do not expose student submissions or grading controls here.
    |
    */

    if (req.user.role === "admin") {
      assignments = await Assignment.find()
        .populate("course", "code name semester sections")
        .populate("createdBy", "name email role")
        .select(
          "title description course dueDate totalMarks maxMarks createdBy createdAt updatedAt"
        )
        .sort({ createdAt: -1 });

      return res.json({
        assignments
      });
    }

    /*
    |--------------------------------------------------------------------------
    | FACULTY
    |--------------------------------------------------------------------------
    */

    if (req.user.role === "faculty") {
      assignments = await Assignment.find({
        createdBy: req.user._id
      })
        .populate("course", "code name semester sections faculty")
        .populate("createdBy", "name email role")
        .sort({ dueDate: 1 });

      return res.json({
        assignments
      });
    }

    /*
    |--------------------------------------------------------------------------
    | STUDENT
    |--------------------------------------------------------------------------
    |
    | Student should use /student.
    |
    */

    return res.status(403).json({
      message: "Use the student assignment endpoint"
    });
  } catch (error) {
    console.error("Get assignments error:", error);

    res.status(500).json({
      message: "Failed to load assignments",
      error: error.message
    });
  }
});

/*
|--------------------------------------------------------------------------
| STUDENT ASSIGNMENTS
|--------------------------------------------------------------------------
|
| Students can access assignments belonging to their:
| department + semester + section.
|
|--------------------------------------------------------------------------
*/

router.get("/student", async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Students only"
      });
    }

    const courses = await Course.find({
      department:
        req.user.department?._id || req.user.department,

      semester: req.user.semester,

      ...(req.user.section
        ? { sections: req.user.section }
        : {})
    }).select("_id");

    const assignments = await Assignment.find({
      course: {
        $in: courses.map((course) => course._id)
      }
    })
      .populate("course", "code name")
      .sort({ dueDate: 1 });

    const submissions = await Submission.find({
      student: req.user._id
    });

    const submissionMap = new Map(
      submissions.map((submission) => [
        String(submission.assignment),
        submission
      ])
    );

    res.json({
      assignments: assignments.map((assignment) => ({
        ...assignment.toObject(),

        submission:
          submissionMap.get(String(assignment._id)) ||
          null
      }))
    });
  } catch (error) {
    console.error(
      "Get student assignments error:",
      error
    );

    res.status(500).json({
      message: "Failed to load student assignments",
      error: error.message
    });
  }
});

/*
|--------------------------------------------------------------------------
| CREATE ASSIGNMENT
|--------------------------------------------------------------------------
|
| ONLY FACULTY.
|
| Admin CANNOT create assignments.
| Student CANNOT create assignments.
|
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res.status(403).json({
        message:
          "Only faculty can create assignments"
      });
    }

    const course = await Course.findById(
      req.body.course
    );

    if (!course) {
      return res.status(404).json({
        message: "Course not found"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Faculty can create assignments only for
    | courses assigned to that faculty.
    |--------------------------------------------------------------------------
    */

    if (
      String(course.faculty) !==
      String(req.user._id)
    ) {
      return res.status(403).json({
        message:
          "You can only create assignments for courses assigned to you"
      });
    }

    const assignment = await Assignment.create({
      ...req.body,
      createdBy: req.user._id
    });

    const populatedAssignment =
      await Assignment.findById(assignment._id)
        .populate(
          "course",
          "code name semester sections faculty"
        )
        .populate(
          "createdBy",
          "name email role"
        );

    res.status(201).json({
      assignment: populatedAssignment
    });
  } catch (error) {
    console.error(
      "Create assignment error:",
      error
    );

    res.status(500).json({
      message: "Failed to create assignment",
      error: error.message
    });
  }
});

/*
|--------------------------------------------------------------------------
| STUDENT SUBMIT ASSIGNMENT
|--------------------------------------------------------------------------
*/

router.post("/:id/submit", async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Students only"
      });
    }

    const assignment =
      await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Verify that the student belongs to the
    | course's academic structure.
    |--------------------------------------------------------------------------
    */

    const course = await Course.findById(
      assignment.course
    );

    if (!course) {
      return res.status(404).json({
        message: "Course not found"
      });
    }

    const sameDepartment =
      String(course.department) ===
      String(
        req.user.department?._id ||
        req.user.department
      );

    const sameSemester =
      Number(course.semester) ===
      Number(req.user.semester);

    const sameSection =
      !course.sections?.length ||
      course.sections.some(
        (section) =>
          String(section).toUpperCase() ===
          String(req.user.section).toUpperCase()
      );

    if (
      !sameDepartment ||
      !sameSemester ||
      !sameSection
    ) {
      return res.status(403).json({
        message:
          "This assignment is not available for your class"
      });
    }

    const submission =
      await Submission.findOneAndUpdate(
        {
          assignment: assignment._id,
          student: req.user._id
        },
        {
          text: req.body.text,
          fileUrl: req.body.fileUrl,
          submittedAt: new Date(),
          status: "submitted"
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

    res.json({
      submission
    });
  } catch (error) {
    console.error(
      "Submit assignment error:",
      error
    );

    res.status(500).json({
      message: "Failed to submit assignment",
      error: error.message
    });
  }
});

/*
|--------------------------------------------------------------------------
| VIEW SUBMISSIONS
|--------------------------------------------------------------------------
|
| ONLY THE FACULTY WHO CREATED THE ASSIGNMENT
| CAN VIEW its submissions.
|
| Admin CANNOT grade or access submissions
| through this endpoint.
|
|--------------------------------------------------------------------------
*/

router.get("/:id/submissions", async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res.status(403).json({
        message:
          "Only faculty can view assignment submissions"
      });
    }

    const assignment =
      await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found"
      });
    }

    if (
      String(assignment.createdBy) !==
      String(req.user._id)
    ) {
      return res.status(403).json({
        message:
          "You can only view submissions for assignments you created"
      });
    }

    const submissions =
      await Submission.find({
        assignment: assignment._id
      })
        .populate(
          "student",
          "name email registerNumber semester section"
        )
        .sort({
          submittedAt: -1
        });

    res.json({
      submissions
    });
  } catch (error) {
    console.error(
      "Get submissions error:",
      error
    );

    res.status(500).json({
      message: "Failed to load submissions",
      error: error.message
    });
  }
});

/*
|--------------------------------------------------------------------------
| GRADE SUBMISSION
|--------------------------------------------------------------------------
|
| ONLY FACULTY.
|
| ONLY the faculty who created the assignment
| can assign marks and feedback.
|
|--------------------------------------------------------------------------
*/

router.patch(
  "/submissions/:submissionId/grade",
  async (req, res) => {
    try {
      if (req.user.role !== "faculty") {
        return res.status(403).json({
          message:
            "Only faculty can grade assignments"
        });
      }

      const submission =
        await Submission.findById(
          req.params.submissionId
        ).populate("assignment");

      if (!submission) {
        return res.status(404).json({
          message: "Submission not found"
        });
      }

      if (
        String(
          submission.assignment.createdBy
        ) !== String(req.user._id)
      ) {
        return res.status(403).json({
          message:
            "You can only grade assignments you created"
        });
      }

      const marks = Number(
        req.body.marks
      );

      if (
        Number.isNaN(marks) ||
        marks < 0
      ) {
        return res.status(400).json({
          message:
            "Marks must be a valid non-negative number"
        });
      }

      const maximumMarks = Number(
        submission.assignment.totalMarks ??
        submission.assignment.maxMarks ??
        0
      );

      if (
        maximumMarks > 0 &&
        marks > maximumMarks
      ) {
        return res.status(400).json({
          message:
            `Marks cannot exceed ${maximumMarks}`
        });
      }

      submission.marks = marks;
      submission.feedback =
        req.body.feedback || "";
      submission.status = "graded";

      await submission.save();

      res.json({
        submission
      });
    } catch (error) {
      console.error(
        "Grade submission error:",
        error
      );

      res.status(500).json({
        message: "Failed to grade submission",
        error: error.message
      });
    }
  }
);

module.exports = router;