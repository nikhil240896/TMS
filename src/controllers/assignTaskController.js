const User = require("../models/user");
const Task = require("../models/task");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");



const updateOrAssignTaskToUser = asyncHandler(async (req, res, next) => {
  const { taskIds, userId } = req.body;

  const adminOrManager = req.user;

  if (!userId) {
    return next(new AppError("User ID is required", 400));
  }

  // Normalize `taskIds` to an array
  const normalizedTaskIds = Array.isArray(taskIds) ? taskIds : [taskIds];

  if (normalizedTaskIds.length === 0) {
    return next(new AppError("Enter task(s)", 400));
  }

  // Validate user existence and role
  const user = await User.findById(userId);
  if (!user || user.role !== "user") {
    return next(
      new AppError("User not found or is not eligible for task assignment", 404)
    );
  }

  // Managers can only assign tasks to their team members
  if (
    adminOrManager.role === "manager" &&
    !adminOrManager._id.equals(user.manager)
  ) {
    return next(
      new AppError("You can only assign tasks to your own team members.", 400)
    );
  }

  await Task.updateMany(
    { _id: { $in: normalizedTaskIds } },
    {
      $set: {
        user: userId,
        assignedBy: adminOrManager._id,
        assigneeRole: adminOrManager.role,
      },
    }
  );

  res.status(200).json({
    success: true,
    message: "Task(s) assigned successfully",
  });
});

// const viewAssignedTasks = asyncHandler(async (req, res, next) => {
//   const { role, _id: assignedBy } = req.user;
//   const obj = {};

//   if (role === "admin" || role === "manager") {
//     obj.assignedBy = assignedBy;
//     obj.assigneeRole = role;
//   } else {
//     obj.user = assignedBy;
//   }

//   // Fetch assigned tasks
//   const assignedTasks = await Task.find(obj)
//     .populate("user", "userName email")
//     .populate("assignedBy", "userName email")
//     .sort({ dueDate: 1 });

//   if (!assignedTasks.length) {
//     return next(new AppError("No assigned tasks found", 404));
//   }

//   res.status(200).json({
//     success: true,
//     message: "Assigned tasks fetched successfully",
//     count: assignedTasks.length,
//     data: assignedTasks,
//   });
// });



const getAssignedTasks = asyncHandler(async (req, res, next) => {
  const redisClient = req.app.locals.redis; // Access Redis client from app.locals
  const { role, _id: assignedBy } = req.user;
  const obj = {};

  if (role === "admin" || role === "manager") {
    obj.assignedBy = assignedBy;
    obj.assigneeRole = role;
  } else {
    obj.user = assignedBy;
  }

  // Generate a unique key for caching based on the query object
  const cacheKey = `assignedTasks:${JSON.stringify(obj)}`;

  // Check Redis cache for the data
  const cachedData = await redisClient.get(cacheKey);

  if (cachedData) {
    console.log("Using Redis")
    // If data is found in cache, return it
    return res.status(200).json({
      success: true,
      message: "Assigned tasks fetched successfully (from cache)",
      count: JSON.parse(cachedData).length,
      data: JSON.parse(cachedData),
    });
  }

  // Fetch assigned tasks from the database
  const assignedTasks = await Task.find(obj)
    .populate("user", "userName email")
    .populate("assignedBy", "userName email")
    .sort({ dueDate: 1 });

  if (!assignedTasks.length) {
    return next(new AppError("No assigned tasks found", 404));
  }

  console.log("Using DB")

  // Store the data in Redis cache (set an expiration time of 10 mins)
  await redisClient.setEx(cacheKey, 600, JSON.stringify(assignedTasks));

  res.status(200).json({
    success: true,
    message: "Assigned tasks fetched successfully",
    count: assignedTasks.length,
    data: assignedTasks,
  });
});



const updateTaskStatus = asyncHandler(async (req, res, next) => {
  const { taskId, status, userId } = req.body;

  const userData = req.user;

  if (!taskId || !status) {
    return next(new AppError("Task ID and Task Status are required", 400));
  }

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  const findUser = await User.findById(userId);
  if (!findUser) {
    return next(new AppError("User not found", 404));
  }

  if (userData.role === "manager" && !userData._id.equals(findUser.manager)) {
    return next(
      new AppError(
        "You can only modify tasks assigned to your own team members.",
        400
      )
    );
  }

  await Task.findByIdAndUpdate(
    taskId,
    { status },
    { new: true, runValidators: false }
  );

  res.status(201).json({
    success: true,
    message: "Task updated successfully",
  });
});

module.exports = {
  updateOrAssignTaskToUser,
  getAssignedTasks,
  updateTaskStatus,
};
