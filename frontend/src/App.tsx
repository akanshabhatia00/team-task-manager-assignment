import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api, setAuthToken } from "./api";

type User = { id?: string; _id?: string; name: string; email: string };
type Member = { user: User; role: "admin" | "member" };
type Project = { _id: string; name: string; description: string; members: Member[] };
type Task = {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in-progress" | "done";
  assignedTo: User;
  project: string;
};

const initialAuth = { name: "", email: "", password: "" };

export default function App() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authForm, setAuthForm] = useState(initialAuth);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(JSON.parse(localStorage.getItem("user") || "null"));
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [memberEmail, setMemberEmail] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    assignedTo: ""
  });

  useEffect(() => {
    setAuthToken(token);
    if (token) {
      loadProjects();
      loadSummary();
    }
  }, [token]);

  useEffect(() => {
    if (selectedProject) {
      loadTasks(selectedProject);
    }
  }, [selectedProject]);

  const selectedProjectData = useMemo(
    () => projects.find((p) => p._id === selectedProject),
    [projects, selectedProject]
  );

  const currentUserId = user?.id || user?._id;
  const role = selectedProjectData?.members.find((m) => m.user._id === currentUserId)?.role;

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/signup";
      const payload =
        authMode === "login"
          ? { email: authForm.email, password: authForm.password }
          : authForm;
      const { data } = await api.post(endpoint, payload);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setMessage(`${authMode} successful`);
      setAuthForm(initialAuth);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Authentication failed");
    }
  };

  const loadProjects = async () => {
    const { data } = await api.get("/projects");
    setProjects(data);
    if (!selectedProject && data.length) setSelectedProject(data[0]._id);
  };

  const loadTasks = async (projectId: string) => {
    const { data } = await api.get(`/tasks/project/${projectId}`);
    setTasks(data);
  };

  const loadSummary = async () => {
    const { data } = await api.get("/tasks/dashboard/summary");
    setSummary(data);
  };

  const createProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!projectForm.name) return;
    await api.post("/projects", projectForm);
    setProjectForm({ name: "", description: "" });
    await loadProjects();
  };

  const createTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    await api.post("/tasks", { ...taskForm, projectId: selectedProject });
    setTaskForm({ title: "", description: "", dueDate: "", priority: "medium", assignedTo: "" });
    await loadTasks(selectedProject);
    await loadSummary();
  };

  const addMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !memberEmail) return;
    try {
      await api.post(`/projects/${selectedProject}/members`, { email: memberEmail });
      setMemberEmail("");
      await loadProjects();
      setMessage("Member added");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Failed to add member");
    }
  };

  const updateStatus = async (taskId: string, status: Task["status"]) => {
    await api.patch(`/tasks/${taskId}/status`, { status });
    if (selectedProject) await loadTasks(selectedProject);
    await loadSummary();
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setProjects([]);
    setTasks([]);
    setSummary(null);
  };

  if (!token || !user) {
    return (
      <div className="auth-wrap">
        <h1>Team Task Manager</h1>
        <form onSubmit={handleAuthSubmit} className="card">
          <h2>{authMode === "login" ? "Login" : "Signup"}</h2>
          {authMode === "signup" && (
            <input
              placeholder="Name"
              value={authForm.name}
              onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
              required
            />
          )}
          <input
            placeholder="Email"
            type="email"
            value={authForm.email}
            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            required
          />
          <input
            placeholder="Password"
            type="password"
            value={authForm.password}
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            required
          />
          <button type="submit">{authMode === "login" ? "Login" : "Create account"}</button>
          <button
            className="secondary"
            type="button"
            onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
          >
            Switch to {authMode === "login" ? "Signup" : "Login"}
          </button>
        </form>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <h1>Team Task Manager</h1>
        <div>
          <span>{user.name}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <section className="grid">
        <div className="card">
          <h3>Projects</h3>
          <form onSubmit={createProject}>
            <input
              placeholder="Project name"
              value={projectForm.name}
              onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
            />
            <input
              placeholder="Description"
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
            />
            <button type="submit">Create Project</button>
          </form>
          <ul>
            {projects.map((project) => (
              <li key={project._id}>
                <button className="link" onClick={() => setSelectedProject(project._id)}>
                  {project.name}
                </button>
              </li>
            ))}
          </ul>
          {role === "admin" && (
            <form onSubmit={addMember}>
              <input
                placeholder="Member email"
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
              />
              <button type="submit">Add Member</button>
            </form>
          )}
          {!!selectedProjectData && (
            <ul>
              {selectedProjectData.members.map((m) => (
                <li key={m.user._id || m.user.id}>
                  {m.user.name} - {m.role}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3>Dashboard</h3>
          <p>Total: {summary?.totalTasks || 0}</p>
          <p>To Do: {summary?.byStatus?.todo || 0}</p>
          <p>In Progress: {summary?.byStatus?.["in-progress"] || 0}</p>
          <p>Done: {summary?.byStatus?.done || 0}</p>
          <p>Overdue: {summary?.overdue || 0}</p>
        </div>

        <div className="card">
          <h3>Create Task</h3>
          {role !== "admin" ? (
            <p>Only project admin can create tasks.</p>
          ) : (
            <form onSubmit={createTask}>
              <input
                placeholder="Title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                required
              />
              <input
                placeholder="Description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                required
              />
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Task["priority"] })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <select
                value={taskForm.assignedTo}
                onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                required
              >
                <option value="">Assign to</option>
                {selectedProjectData?.members.map((m) => (
                  <option key={m.user._id || m.user.id} value={m.user._id || m.user.id}>
                    {m.user.name} ({m.role})
                  </option>
                ))}
              </select>
              <button type="submit">Create Task</button>
            </form>
          )}
        </div>
      </section>

      <section className="card">
        <h3>Tasks</h3>
        <div className="tasks">
          {tasks.map((task) => (
            <div key={task._id} className="task">
              <h4>{task.title}</h4>
              <p>{task.description}</p>
              <p>Assignee: {task.assignedTo?.name || "Unknown"}</p>
              <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
              <p>Priority: {task.priority}</p>
              <select value={task.status} onChange={(e) => updateStatus(task._id, e.target.value as Task["status"])}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      {message && <p>{message}</p>}
    </div>
  );
}
