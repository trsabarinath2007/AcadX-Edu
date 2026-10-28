const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },

    role: {
      type: String,
      enum: ["admin", "faculty", "student"],
      required: true
    },

    registerNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department"
    },

    semester: {
      type: Number,
      min: 1,
      max: 10
    },

    section: {
      type: String,
      trim: true
    },

    facultyCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
      }
    ],

    // Preserves the faculty Excel teaching load even when a course
    // has not yet been created in the course catalogue.
    teachingAssignments: [
      {
        courseCode: { type: String, trim: true, uppercase: true },
        courseName: { type: String, trim: true },
        semester: { type: Number, min: 1, max: 10 },
        sections: [{ type: String, trim: true, uppercase: true }]
      }
    ],

    /*
     * True when the account is created/imported
     * with the default initial password.
     *
     * Student  -> student123
     * Faculty  -> faculty123
     */
    mustChangePassword: {
      type: Boolean,
      default: false
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.index({ role: 1, active: 1 });
userSchema.index({ department: 1, semester: 1, section: 1 });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ registerNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", userSchema);