import { Project } from "../models/Project.js";

export const getProjectAndRole = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    return { project: null, role: null };
  }

  const membership = project.members.find((member) => member.user.toString() === userId.toString());
  const role = membership?.role ?? null;

  return { project, role };
};
