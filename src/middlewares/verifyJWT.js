const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { JWT_SECRET } = process.env;
const User = require("../models/user");

const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return next(new AppError("Unauthorised Request", 400));

    const decodedToken = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decodedToken?.id).select("-password");

    if (!user || decodedToken.tokenVersion !== user.tokenVersion)
      return next(new AppError("Invalid or Expired Token", 400));
    req.user = user;
    next();
  } catch (error) {
    return next(new AppError(`error in User Token : ${error.message}`, 400));
  }
});

const authorizeRoles = (...roles) => {
  return (req, _, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `${req.user.role} is not allowed to access this resouce `,
          403
        )
      );
    }

    next();
  };
};

module.exports = {
  verifyJWT,
  authorizeRoles
};
