const User = require("../models/user");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const validator = require("validator");
const sendMail = require("../utils/sendEmail");

const registerUser = asyncHandler(async (req, res, next) => {
  const { userName, email, password, confirmPassword } = req.body;

  if (!validator.isEmail(email))
    return next(new AppError("Invalid email format", 400));

  if (password.length < 6)
    return next(
      new AppError("Password must be at least 6 characters long", 400)
    );

  if (!/[a-z]/.test(password))
    return next(
      new AppError("Password must contain at least one lowercase letter", 400)
    );

  if (!/[A-Z]/.test(password))
    return next(
      new AppError("Password must contain at least one uppercase letter", 400)
    );

  if (!/[0-9]/.test(password))
    return next(new AppError("Password must contain at least one number", 400));

  if (!/[^a-zA-Z0-9]/.test(password))
    return next(
      new AppError("Password must contain at least one special character", 400)
    );

  const existingUser = await User.findOne({ email });

  if (existingUser) return next(new AppError("Email already in use", 400));

  if (password !== confirmPassword)
    return next(new AppError("Passwords do not match", 400));

  const user = new User({
    userName,
    email,
    password,
    confirmPassword,
  });

  const saveUser =  user.save();
  const sendRegistrationEmail =  sendMail(email);

  await Promise.all([saveUser, sendRegistrationEmail]);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
  });
});

const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!validator.isEmail(email)) {
    return next(new AppError("Invalid email format", 400));
  }

  if (!password) {
    return next(new AppError("Password is required", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("Invalid email or password", 401));
  }

  const isPasswordValid = await user.verifyPassword(password);

  if (!isPasswordValid) {
    return next(new AppError("Invalid email or password", 401));
  }

  const token = user.generateAuthToken();

  res.status(200).json({
    success: true,
    message: "Login successful",
    user: {
      id: user._id,
      userName: user.userName,
      email: user.email,
      role: user.role,
      token,
    },
  });
});

const getUserProfile = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (!user) return next(new AppError("User not found", 404));

  res.status(200).json({
    success: true,
    message: "User profile fetched successfully",
    data: user,
  });
});

const logoutUser = asyncHandler(async (req, res, next) => {
  const user = req.user;
  user.tokenVersion = 1;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
};
