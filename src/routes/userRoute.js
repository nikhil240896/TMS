const express = require("express");
const router = express.Router();
const { verifyJWT, authorizeRoles } = require("../middlewares/verifyJWT");
const { registerUser, loginUser, getUserProfile, logoutUser } = require("../controllers/userController");
const { createTask, getTasks, getTaskById, updateTask, deleteTask } = require("../controllers/taskController");
const { getAllUsers, getAllManagers, searchManager, assignUsersToManagerRole, assignUsersToManager } = require("../controllers/assignManager");
const { updateOrAssignTaskToUser, getAssignedTasks, updateTaskStatus } = require("../controllers/assignTaskController");
const { getTaskStats, searchTasks } = require("../controllers/advancedTask");


router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/profile").get(verifyJWT, getUserProfile);
router.route("/logout").get(verifyJWT, logoutUser);


// Tasks
router.route("/create_task").post(verifyJWT, authorizeRoles("admin"), createTask);
router.route("/get_all_tasks").get(authorizeRoles("admin", "manager"),getTasks);
router.route("/get_single_task/:id").get(verifyJWT, authorizeRoles("admin", "manager"), getTaskById);
router.route("/update_task/:id").patch(verifyJWT, authorizeRoles("admin"), updateTask);
router.route("/delete_task/:id").delete(verifyJWT, authorizeRoles("admin"), deleteTask);

// Admin
router.route("/all_users").get(verifyJWT, authorizeRoles("admin"), getAllUsers);
router.route("/all_managers").get(verifyJWT, authorizeRoles("admin"), getAllManagers);
router.route("/search_manager").get(verifyJWT, authorizeRoles("admin"), searchManager);

// Assign Manager
router.route("/assign_manager_role").post(verifyJWT, authorizeRoles("admin"), assignUsersToManagerRole);

// Assign User to Manager
router.route("/assign_users_to_manager").post(verifyJWT, authorizeRoles("admin"), assignUsersToManager);

// Assign Task to User
router.route("/assign_task").post(verifyJWT, authorizeRoles("admin", "manager"), updateOrAssignTaskToUser);
router.route("/get_assigned_tasks").get(verifyJWT, authorizeRoles("admin", "manager", "user"), getAssignedTasks);
router.route("/update_task_status").patch(verifyJWT, authorizeRoles("admin", "manager", "user"), updateTaskStatus);


// Advanced Features
router.route("/task_stats").get(verifyJWT, authorizeRoles("admin", "manager", "user"), getTaskStats);
router.route("/search_tasks").post(verifyJWT, authorizeRoles("admin", "manager", "user"), searchTasks);

module.exports = router;