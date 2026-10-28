const express = require("express");

const Discussion = require("../models/Discussion");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

/*
|--------------------------------------------------------------------------
| Discussion Access
|--------------------------------------------------------------------------
| Only students and faculty can use the Discussion Forum.
*/
function discussionAccess(req, res, next) {
  if (!["student", "faculty"].includes(req.user.role)) {
    return res.status(403).json({
      message: "Only students and faculty can access the Discussion Forum"
    });
  }

  next();
}

router.use(discussionAccess);

/*
|--------------------------------------------------------------------------
| GET ALL DISCUSSIONS
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .populate("author", "name role")
      .populate("course", "code name")
      .populate("replies.author", "name role")
      .sort({ createdAt: -1 });

    res.json({ discussions });
  } catch (error) {
    console.error("Get discussions error:", error);

    res.status(500).json({
      message: "Failed to load discussions",
      error: error.message
    });
  }
});

/*
|--------------------------------------------------------------------------
| CREATE DISCUSSION
|--------------------------------------------------------------------------
*/
router.post("/", async (req, res) => {
  try {
    const { title, body, course } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Discussion title is required"
      });
    }

    if (!body?.trim()) {
      return res.status(400).json({
        message: "Discussion content is required"
      });
    }

    const discussion = await Discussion.create({
      title: title.trim(),
      body: body.trim(),
      course: course || undefined,
      author: req.user._id
    });

    const populatedDiscussion =
      await Discussion.findById(discussion._id)
        .populate("author", "name role")
        .populate("course", "code name")
        .populate("replies.author", "name role");

    res.status(201).json({
      discussion: populatedDiscussion
    });
  } catch (error) {
    console.error("Create discussion error:", error);

    res.status(500).json({
      message: "Failed to create discussion",
      error: error.message
    });
  }
});

/*
|--------------------------------------------------------------------------
| REPLY TO DISCUSSION
|--------------------------------------------------------------------------
*/
router.post("/:id/reply", async (req, res) => {
  try {
    const { body } = req.body;

    if (!body?.trim()) {
      return res.status(400).json({
        message: "Reply cannot be empty"
      });
    }

    const discussion = await Discussion.findById(
      req.params.id
    );

    if (!discussion) {
      return res.status(404).json({
        message: "Discussion not found"
      });
    }

    discussion.replies.push({
      author: req.user._id,
      body: body.trim()
    });

    await discussion.save();

    const populatedDiscussion =
      await Discussion.findById(discussion._id)
        .populate("author", "name role")
        .populate("course", "code name")
        .populate("replies.author", "name role");

    res.json({
      discussion: populatedDiscussion
    });
  } catch (error) {
    console.error("Reply error:", error);

    res.status(500).json({
      message: "Failed to add reply",
      error: error.message
    });
  }
});

/*
|--------------------------------------------------------------------------
| LIKE / UNLIKE DISCUSSION
|--------------------------------------------------------------------------
*/
router.post("/:id/like", async (req, res) => {
  try {
    const discussion = await Discussion.findById(
      req.params.id
    );

    if (!discussion) {
      return res.status(404).json({
        message: "Discussion not found"
      });
    }

    const exists = discussion.likes.some(
      (id) =>
        String(id) === String(req.user._id)
    );

    if (exists) {
      discussion.likes =
        discussion.likes.filter(
          (id) =>
            String(id) !== String(req.user._id)
        );
    } else {
      discussion.likes.push(req.user._id);
    }

    await discussion.save();

    res.json({
      likes: discussion.likes.length,
      liked: !exists
    });
  } catch (error) {
    console.error("Like error:", error);

    res.status(500).json({
      message: "Failed to update like",
      error: error.message
    });
  }
});

module.exports = router;