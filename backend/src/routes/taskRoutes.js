import express from "express";
import mongoose from "mongoose";
import { auth } from "../middleware/auth.js";
import { Task } from "../models/Task.js";
import { getProjectAndRole } from "../utils/projectAccess.js";

const router = express.Router();

router.use(auth);

router.post("/", async (req, res) => {
  try {
    const { title, description, dueDate, priority, assignedTo, projectId } = req.body;
    if (!title || !dueDate || !assignedTo || !projectId) {
      return res.status(400).json({ message: "title, dueDate, assignedTo and projectId are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    const { project, role } = await getProjectAndRole(projectId, req.user._id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (role !== "admin") return res.status(403).json({ message: "Only project admin can create tasks" });

    const isAssigneeMember = project.members.some((member) => member.user.toString() === assignedTo);
    if (!isAssigneeMember) {
      return res.status(400).json({ message: "Assignee must be a project member" });
    }

    const task = await Task.create({
      title,
      description: description || "",
      dueDate,
      priority: priority || "medium",
      project: projectId,
      assignedTo,
      createdBy: req.user._id
    });

    await task.populate("assignedTo", "name email");
    return res.status(201).json(task);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create task" });
  }
});

router.get("/project/:projectId", async (req, res) => {
  const { projectId } = req.params;
  const { project, role } = await getProjectAndRole(projectId, req.user._id);
  if (!project) return res.status(404).json({ message: "Project not found" });
  if (!role) return res.status(403).json({ message: "Not allowed" });

  const query = { project: projectId };
  if (role === "member") query.assignedTo = req.user._id;

  const tasks = await Task.find(query).populate("assignedTo", "name email").sort({ dueDate: 1 });
  res.json(tasks);
});

router.patch("/:taskId/status", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    if (!["todo", "in-progress", "done"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const { role } = await getProjectAndRole(task.project, req.user._id);
    if (!role) return res.status(403).json({ message: "Not allowed" });

    const isAssignee = task.assignedTo.toString() === req.user._id.toString();
    if (role === "member" && !isAssignee) {
      return res.status(403).json({ message: "Members can update only their own tasks" });
    }

    task.status = status;
    await task.save();
    await task.populate("assignedTo", "name email");

    return res.json(task);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update task status" });
  }
});

router.get("/dashboard/summary", async (req, res) => {
  const memberProjects = await getProjectIds(req.user._id);
  const tasks = await Task.find({ project: { $in: memberProjects } });
  const ownTasks = tasks.filter((t) => t.assignedTo.toString() === req.user._id.toString());

  const now = new Date();
  const overdue = ownTasks.filter((t) => t.status !== "done" && new Date(t.dueDate) < now).length;

  const byStatus = ownTasks.reduce(
    (acc, task) => {
      acc[task.status] += 1;
      return acc;
    },
    { todo: 0, "in-progress": 0, done: 0 }
  );

  const tasksPerUser = tasks.reduce((acc, task) => {
    const key = task.assignedTo.toString();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalTasks: ownTasks.length,
    byStatus,
    overdue,
    tasksPerUser
  });
});

const getProjectIds = async (userId) => {
  const { Project } = await import("../models/Project.js");
  const projects = await Project.find({ "members.user": userId }).select("_id");
  return projects.map((p) => p._id);
};

export default router;
