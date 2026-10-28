const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    registerNumber: user.registerNumber,
    department: user.department,
    semester: user.semester,
    section: user.section
  };
}

module.exports = { signToken, publicUser };
