const mongoose = require("mongoose");
const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["pending", "overdue", "completed"], default: "pending" },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
    assigneeRole: { type: String, enum: ["manager", "admin"], default: "manager"},
  },
  {
    timestamps: true, 
  }
);

taskSchema.index({ assignedBy: 1, user: 1, assigneeRole: 1 });

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
