const express = require("express");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
  res.json({ notifications });
});

router.patch("/:id/read", async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true },
    { new: true }
  );
  res.json({ notification });
});

router.patch("/read-all", async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id }, { read: true });
  res.json({ message: "Notifications marked as read" });
});

router.delete("/:id", async (req, res) => {
  await Notification.deleteOne({ _id: req.params.id, recipient: req.user._id });
  res.json({ message: "Deleted" });
});

module.exports = router;
