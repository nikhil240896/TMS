const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Schema } = mongoose;
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

const userSchema = new Schema({
  userName: { type: String, required: true, trim: true },
  email: { type: String, unique: true, lowercase: true, trim: true },
  role: {
    type: String,
    default: "user",
    enum: ["user", "manager", "admin"],
  },
  password: { type: String, required: true, trim: true },
  confirmPassword: { type: String, required: true, trim: true },
  manager: { type : Schema.Types.ObjectId, ref : "User" },
  tokenVersion: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.confirmPassword = undefined;
  next();
});


userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { id: this._id, tokenVersion: this.tokenVersion },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN || "15d" }
  );
  return token;
};


userSchema.methods.verifyPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
