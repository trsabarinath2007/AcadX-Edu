const express = require("express");

const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const Course = require("../models/Course");

const { protect } = require("../middleware/auth");
const { askOllama } = require("../services/ai");

const router = express.Router();

router.use(protect);

/*
|--------------------------------------------------------------------------
| GET QUIZZES
|--------------------------------------------------------------------------
|
| ADMIN:
|   Monitoring only.
|   Do NOT send questions/correct answers.
|
| FACULTY:
|   Gets quizzes created by that faculty.
|
| STUDENT:
|   Gets only published quizzes belonging to
|   the student's academic structure.
|
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | ADMIN
    |--------------------------------------------------------------------------
    */

    if (req.user.role === "admin") {
      const quizzes = await Quiz.find()
        .populate(
          "course",
          "code name semester sections"
        )
        .populate(
          "createdBy",
          "name email role"
        )
        .select(
          "title course createdBy duration published questions marks totalMarks createdAt updatedAt"
        )
        .sort({
          createdAt: -1
        });

      /*
      |--------------------------------------------------------------------------
      | Remove questions completely.
      |
      | Admin should know:
      | - quiz
      | - course
      | - creator
      | - duration
      | - marks
      | - published status
      | - question count
      |
      | Admin should NOT receive:
      | - question text
      | - options
      | - correct answers
      |--------------------------------------------------------------------------
      */

      const safeQuizzes = quizzes.map((quiz) => {
        const data = quiz.toObject();

        const questions = Array.isArray(data.questions)
          ? data.questions
          : [];

        return {
          _id: data._id,
          title: data.title,
          course: data.course,
          createdBy: data.createdBy,
          duration: data.duration,
          published: data.published,

          totalMarks:
            data.totalMarks ??
            data.marks ??
            questions.reduce(
              (sum, question) =>
                sum + Number(question.marks || 1),
              0
            ),

          questionCount: questions.length,

          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      });

      return res.json({
        quizzes: safeQuizzes
      });
    }

    /*
    |--------------------------------------------------------------------------
    | FACULTY
    |--------------------------------------------------------------------------
    */

    if (req.user.role === "faculty") {
      const quizzes = await Quiz.find({
        createdBy: req.user._id
      })
        .populate(
          "course",
          "code name semester sections faculty"
        )
        .populate(
          "createdBy",
          "name email role"
        )
        .sort({
          createdAt: -1
        });

      return res.json({
        quizzes
      });
    }

    /*
    |--------------------------------------------------------------------------
    | STUDENT
    |--------------------------------------------------------------------------
    */

    if (req.user.role === "student") {
      const courses = await Course.find({
        department:
          req.user.department?._id ||
          req.user.department,

        semester: req.user.semester,

        ...(req.user.section
          ? {
              sections: req.user.section
            }
          : {})
      }).select("_id");

      const quizzes = await Quiz.find({
        course: {
          $in: courses.map(
            (course) => course._id
          )
        },

        published: true
      })
        .populate(
          "course",
          "code name"
        )
        .sort({
          createdAt: -1
        });

      return res.json({
        quizzes
      });
    }

    return res.status(403).json({
      message: "Access denied"
    });
  } catch (error) {
    console.error(
      "Get quizzes error:",
      error
    );

    res.status(500).json({
      message: "Failed to load quizzes",
      error: error.message
    });
  }
});

/*
|--------------------------------------------------------------------------
| CREATE QUIZ
|--------------------------------------------------------------------------
|
| ONLY FACULTY.
|
| Admin cannot create quizzes.
|
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res.status(403).json({
        message:
          "Only faculty can create quizzes"
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
    | Faculty can create quizzes only
    | for assigned courses.
    |--------------------------------------------------------------------------
    */

    if (
      String(course.faculty) !==
      String(req.user._id)
    ) {
      return res.status(403).json({
        message:
          "You can only create quizzes for courses assigned to you"
      });
    }

    const quiz = await Quiz.create({
      ...req.body,
      createdBy: req.user._id
    });

    const populatedQuiz =
      await Quiz.findById(quiz._id)
        .populate(
          "course",
          "code name semester sections faculty"
        )
        .populate(
          "createdBy",
          "name email role"
        );

    res.status(201).json({
      quiz: populatedQuiz
    });
  } catch (error) {
    console.error(
      "Create quiz error:",
      error
    );

    res.status(500).json({
      message: "Failed to create quiz",
      error: error.message
    });
  }
});

/*
|--------------------------------------------------------------------------
| AI QUIZ GENERATOR
|--------------------------------------------------------------------------
|
| ONLY FACULTY.
|
| AI-generated questions are returned to faculty
| for review. They are NOT automatically published.
|
|--------------------------------------------------------------------------
*/

router.post(
  "/generate",
  async (req, res) => {
    try {
      if (req.user.role !== "faculty") {
        return res.status(403).json({
          message:
            "Only faculty can generate quizzes"
        });
      }

      const {
        subject,
        topic,
        difficulty = "Medium",
        count = 5
      } = req.body;

      if (!subject?.trim()) {
        return res.status(400).json({
          message: "Subject is required"
        });
      }

      if (!topic?.trim()) {
        return res.status(400).json({
          message: "Topic is required"
        });
      }

      const questionCount = Math.min(
        Math.max(
          Number(count) || 5,
          1
        ),
        50
      );

      const prompt = `
Create ${questionCount} multiple-choice questions.

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

Return JSON only in this format:

{
  "questions": [
    {
      "question": "...",
      "options": [
        "A",
        "B",
        "C",
        "D"
      ],
      "correctAnswer": "A",
      "marks": 1
    }
  ]
}

Do not include markdown.
`;

      const raw = await askOllama(prompt);

      try {
        const parsed = JSON.parse(
          raw
            .replace(
              /```json|```/g,
              ""
            )
            .trim()
        );

        return res.json(parsed);
      } catch {
        return res.json({
          questions: [
            {
              question:
                `Which concept is most directly related to ${topic}?`,

              options: [
                "Core concept",
                "Unrelated concept",
                "Hardware only",
                "None"
              ],

              correctAnswer:
                "Core concept",

              marks: 1
            }
          ],

          aiMessage: raw
        });
      }
    } catch (error) {
      console.error(
        "Generate quiz error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to generate quiz",

        error: error.message
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| STUDENT ATTEMPT QUIZ
|--------------------------------------------------------------------------
*/

router.post(
  "/:id/attempt",
  async (req, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({
          message:
            "Students only"
        });
      }

      const quiz =
        await Quiz.findById(
          req.params.id
        );

      if (!quiz) {
        return res.status(404).json({
          message:
            "Quiz not found"
        });
      }

      if (!quiz.published) {
        return res.status(403).json({
          message:
            "This quiz is not published"
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Verify student's course access.
      |--------------------------------------------------------------------------
      */

      const course =
        await Course.findById(
          quiz.course
        );

      if (!course) {
        return res.status(404).json({
          message:
            "Course not found"
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
            String(section)
              .toUpperCase() ===
            String(
              req.user.section
            ).toUpperCase()
        );

      if (
        !sameDepartment ||
        !sameSemester ||
        !sameSection
      ) {
        return res.status(403).json({
          message:
            "This quiz is not available for your class"
        });
      }

      const answers =
        req.body.answers || [];

      let score = 0;

      const max =
        quiz.questions.reduce(
          (sum, question) =>
            sum +
            Number(
              question.marks || 1
            ),
          0
        );

      for (const item of answers) {
        const question =
          quiz.questions.id(
            item.questionId
          );

        if (
          question &&
          String(
            question.correctAnswer
          ).trim() ===
            String(
              item.answer
            ).trim()
        ) {
          score += Number(
            question.marks || 1
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Calculate percentage
      |--------------------------------------------------------------------------
      */

      const percentage =
        max
          ? (score / max) * 100
          : 0;

      const attempt =
        await QuizAttempt.create({
          quiz: quiz._id,

          student:
            req.user._id,

          answers,

          score,

          percentage,

          submittedAt:
            new Date()
        });

      res.json({
        attempt
      });
    } catch (error) {
      console.error(
        "Quiz attempt error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to submit quiz",

        error: error.message
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| STUDENT'S OWN QUIZ ATTEMPTS
|--------------------------------------------------------------------------
*/

router.get(
  "/my-attempts",
  async (req, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({
          message:
            "Students only"
        });
      }

      const attempts =
        await QuizAttempt.find({
          student:
            req.user._id
        })
          .populate(
            "quiz",
            "title course"
          )
          .sort({
            createdAt: -1
          });

      res.json({
        attempts
      });
    } catch (error) {
      console.error(
        "Get quiz attempts error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load quiz attempts",

        error: error.message
      });
    }
  }
);

module.exports = router;