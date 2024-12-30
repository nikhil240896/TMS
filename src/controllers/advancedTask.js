const Task = require("../models/task");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

// 2
const getTaskStats = asyncHandler(async (req, res) => {
  const { role, _id } = req.user; // Assume role is part of the authenticated user's data
  let matchCriteria = {};

  // Set match criteria based on the user's role
  if (role === "admin") {
    // Admin can view all tasks
    matchCriteria = {};
  } else if (role === "manager") {
    // Manager can view only tasks they assigned
    matchCriteria = { assignedBy: _id, assigneeRole: "manager" };
  } else {
    // Regular user can view only tasks assigned to them
    matchCriteria = { user: _id };
  }

  // Aggregate to calculate task counts
  const taskStats = await Task.aggregate([
    { $match: matchCriteria },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Transform the aggregation result into a more readable format
  const stats = {
    pending: 0,
    overdue: 0,
    completed: 0,
  };

  taskStats.forEach((stat) => {
    stats[stat._id] = stat.count;
  });

  res.status(200).json({
    success: true,
    message: "Stats fetched successfully",
    role,
    stats,
  });
});

// 5
const searchTasks = asyncHandler(async (req, res) => {
  const { status, priority, dueDate, search, assigned } = req.body;

  const { _id, role } = req.user;

  // Build the query object
  const query = {};

  if (role === "user") {
    query.user = _id;
  } else if (role === "manager") {
    query.assignedBy = _id;
    query.assigneeRole = "manager";
  } else {
    query.assignedBy = _id;
    query.assigneeRole = "admin";
  }

  if (status) {
    query.status = status;
  }

  if (priority) {
    query.priority = priority;
  }

  if (assigned) {
    query.assigned = assigned;
  }

  if (dueDate) {
    // Validate the dueDate format
    const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(dueDate);
    if (!isValidFormat) {
      return next(
        new AppError("Invalid dueDate format. Use YYYY-MM-DD format.", 400)
      );
    }

    // Parse the start and end of the requested date
    const startDate = new Date(dueDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    // Match tasks within the requested date range
    query.dueDate = {
      $gte: startDate,
      $lt: endDate,
    };
  }

  if (search) {
    query.$or = [
      { status: { $regex: search, $options: "i" } },
      { priority: { $regex: search, $options: "i" } },
    ];
  }

  // Fetch tasks based on the query
  const tasks = await Task.find(query)
    .populate("user", "userName email")
    .populate("assignedBy", "userName email")
    .sort({ dueDate: 1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks,
  });
});

module.exports = {
  getTaskStats,
  searchTasks,
};
