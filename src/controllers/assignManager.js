const User = require("../models/user");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const getAllUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const skip = (page - 1) * limit;

  const users = await User.find({ role: "user" })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalUsers = await User.countDocuments({ role: "user" });
  const totalPages = Math.ceil(totalUsers / limit);

  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    data: {
      users,
      totalUsers,
      totalPages,
      currentPage: page,
    },
  });
});

const getAllManagers = asyncHandler(async (req, res, next) => {
  const managers = await User.find({ role: "manager" }, "userName _id").sort({
    createdAt: 1,
  });

  if (!managers || managers.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No managers found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Manager fetched successfully",
    data: managers,
  });
});

const searchManager = asyncHandler(async (req, res, next) => {
  const { email, userName } = req.query;

  if (!email && !userName) {
    return next(
      new AppError(
        "Please provide either an email or a username to search",
        400
      )
    );
  }

  const searchCriteria = { role: "manager" };
  if (email) searchCriteria.email = { $regex: email, $options: "i" };
  if (userName) searchCriteria.userName = { $regex: userName, $options: "i" };

  const managers = await User.find(searchCriteria, "userName email _id").sort({
    createdAt: 1,
  });

  if (managers.length === 0) {
    return next(new AppError("No managers found matching the criteria", 404));
  }

  res.status(200).json({
    success: true,
    message: "Manager fetched successfully",
    data: managers,
  });
});

const assignUsersToManagerRole = asyncHandler(async (req, res, next) => {
  const { userIds } = req.body;

  if (!userIds || userIds.length === 0) {
    return next(new AppError("Enter User data to update", 400));
  }

  const updatedUsers = await User.updateMany(
    { _id: { $in: userIds?.length > 1 ? userIds : [userIds] }, role: "user" },
    { $set: { role: "manager" } }
  );

  if (updatedUsers.matchedCount === 0) {
    return next(
      new AppError(
        "No users with the role 'user' found for the provided IDs",
        404
      )
    );
  }

  res.status(200).json({
    success: true,
    message: `${updatedUsers.modifiedCount} user(s) successfully assigned the role of 'manager'`,
  });
});

const assignUsersToManager = asyncHandler(async (req, res, next) => {
  const { userIds, managerId } = req.body;

  if (!userIds || userIds.length === 0) {
    return next(new AppError("Enter User data to update", 400));
  }

  if (!managerId) {
    return next(new AppError("Invalid input: managerId is required", 400));
  }

  const manager = await User.findOne({ _id: managerId, role: "manager" });
  if (!manager) {
    return next(
      new AppError("Manager not found or does not have the role 'manager'", 404)
    );
  }

  const updatedUsers = await User.updateMany(
    { _id: { $in: userIds.length > 0 ? userIds : [userIds] }, role: "user" },
    { $set: { manager: managerId } }
  );

  if (updatedUsers.matchedCount === 0) {
    return next(
      new AppError(
        "No users with the role 'user' found for the provided IDs",
        404
      )
    );
  }

  res.status(200).json({
    success: true,
    message: `${updatedUsers.modifiedCount} user(s) successfully assigned to the manager`,
  });
});

module.exports = {
  getAllUsers,
  getAllManagers,
  searchManager,
  assignUsersToManagerRole,
  assignUsersToManager,
};
