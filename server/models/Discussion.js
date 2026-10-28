const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    body: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const discussionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    body: {
      type: String,
      required: true,
      trim: true
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course"
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    replies: [replySchema]
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.model(
    "Discussion",
    discussionSchema
  );