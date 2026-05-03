import express from "express";
import mongoose from "mongoose";
import { auth } from "../middleware/auth.js";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { getProjectAndRole } from "../utils/projectAccess.js";

const router = express.Router();

router.use(auth);

router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const project = await Project.create({
      name,
      description: description || "",
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: "admin" }]
    });

    return res.status(201).json(project);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create project" });
  }
});

router.get("/", async (req, res) => {
  const projects = await Project.find({ "members.user": req.user._id })
    .populate("members.user", "name email")
    .sort({ createdAt: -1 });
  res.json(projects);
});

router.post("/:projectId/members", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, email, role = "member" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    const { project, role: userRole } = await getProjectAndRole(projectId, req.user._id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (userRole !== "admin") return res.status(403).json({ message: "Only admin can add members" });

    let targetUser = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      targetUser = await User.findById(userId);
    } else if (email) {
      targetUser = await User.findOne({ email });
    }

    if (!targetUser) return res.status(404).json({ message: "User not found" });

    const alreadyMember = project.members.some((m) => m.user.toString() === targetUser._id.toString());
    if (alreadyMember) return res.status(400).json({ message: "User already a member" });

    project.members.push({ user: targetUser._id, role });
    await project.save();
    await project.populate("members.user", "name email");

    return res.json(project);
  } catch (error) {
    return res.status(500).json({ message: "Failed to add member" });
  }
});

router.delete("/:projectId/members/:userId", async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const { project, role } = await getProjectAndRole(projectId, req.user._id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (role !== "admin") return res.status(403).json({ message: "Only admin can remove members" });

    project.members = project.members.filter((member) => member.user.toString() !== userId);
    await project.save();
    await project.populate("members.user", "name email");

    return res.json(project);
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove member" });
  }
});

export default router;
