const Task = require("../models/task");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const createTask = asyncHandler(async (req, res, next) => {
  const { title, description, dueDate, priority } = req.body;

  if (!title || !description || !dueDate || !priority) {
    return next(
      new AppError("Title, Description and Due date are required", 400)
    );
  }

  if (dueDate) {
    // Validate the dueDate format
    const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(dueDate);
    if (!isValidFormat) {
      return next(new AppError("Invalid dueDate format. Use YYYY-MM-DD format.", 400));
    }
  }

  const task = new Task({ title, description, dueDate, priority });
  await task.save();

  res.status(201).json({
    success: true,
    message: "Task created successfully",
  });
});

const getTasks = asyncHandler(async (req, res, next) => {

  const tasks = await Task.findById(id)
  .select("title description dueDate priority status")
  .sort({ createdAt: -1 });

  if (!tasks || tasks.length === 0) {
    return next(new AppError("No tasks found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Tasks fetched successfully",
    tasks,
  });

});

const getTaskById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const task = await Task.findById(id).select(
    "title description dueDate priority status"
  );

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Task fetched successfully",
    task,
  });
});

const updateTask = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { title, description, dueDate, priority } = req.body;

  const obj = {};

  if (title) obj.title = title;
  if (description) obj.description = description;
  if (dueDate) {
    // Validate the dueDate format
    const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(dueDate);
    if (!isValidFormat) {
      return next(new AppError("Invalid dueDate format. Use YYYY-MM-DD format.", 400));
    }

    obj.dueDate = dueDate;
  }
  if (priority) obj.priority = priority;

  const task = await Task.findByIdAndUpdate(id, obj, {
    new: true,
    runValidators: false,
  });

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Task updated successfully",
    task,
  });
});

const deleteTask = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const task = await Task.findByIdAndDelete(id);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Task deleted successfully",
  });
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
