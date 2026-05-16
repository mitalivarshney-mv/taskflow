const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ── DB Connect ───────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ DB Error:", err));

// ══ SCHEMAS ══════════════════════════════════════════════════════════════════

const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ["admin", "member"], default: "member" },
}, { timestamps: true });

const ProjectSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: "" },
  color:       { type: String, default: "#6366f1" },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members:     [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
  projectId:   { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  title:       { type: String, required: true },
  description: { type: String, default: "" },
  status:      { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
  priority:    { type: String, enum: ["low", "medium", "high"], default: "medium" },
  assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  due:         { type: String, default: "" },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

const User    = mongoose.model("User",    UserSchema);
const Project = mongoose.model("Project", ProjectSchema);
const Task    = mongoose.model("Task",    TaskSchema);

// ══ MIDDLEWARE ════════════════════════════════════════════════════════════════

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ error: "User not found" });
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admins only" });
  next();
};

// ══ AUTH ROUTES ═══════════════════════════════════════════════════════════════

// POST /api/auth/signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });
    if (await User.findOne({ email }))
      return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role || "member" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
app.get("/api/auth/me", auth, (req, res) => {
  res.json(req.user);
});

// ══ USER ROUTES ═══════════════════════════════════════════════════════════════

// GET /api/users  (admin only)
app.get("/api/users", auth, adminOnly, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

// ══ PROJECT ROUTES ════════════════════════════════════════════════════════════

// GET /api/projects
app.get("/api/projects", auth, async (req, res) => {
  const filter = req.user.role === "admin"
    ? {}
    : { members: req.user._id };
  const projects = await Project.find(filter).populate("members", "name email role").populate("createdBy", "name");
  res.json(projects);
});

// POST /api/projects  (admin only)
app.post("/api/projects", auth, adminOnly, async (req, res) => {
  try {
    const { name, description, color, members } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const project = await Project.create({
      name, description, color: color || "#6366f1",
      createdBy: req.user._id,
      members: [req.user._id, ...(members || [])],
    });
    await project.populate("members", "name email role");
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:id  (admin only)
app.put("/api/projects/:id", auth, adminOnly, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("members", "name email role");
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id  (admin only)
app.delete("/api/projects/:id", auth, adminOnly, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ projectId: req.params.id });
    res.json({ message: "Project and its tasks deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══ TASK ROUTES ═══════════════════════════════════════════════════════════════

// GET /api/tasks?projectId=xxx
app.get("/api/tasks", auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.user.role !== "admin") filter.assignedTo = req.user._id;
    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email")
      .populate("createdBy",  "name")
      .populate("projectId",  "name color")
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks  (admin only)
app.post("/api/tasks", auth, adminOnly, async (req, res) => {
  try {
    const { projectId, title, description, status, priority, assignedTo, due } = req.body;
    if (!projectId || !title) return res.status(400).json({ error: "projectId and title required" });
    const task = await Task.create({ projectId, title, description, status, priority, assignedTo, due, createdBy: req.user._id });
    await task.populate(["assignedTo", "createdBy", "projectId"]);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id
app.put("/api/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Members can only update status of tasks assigned to them
    if (req.user.role !== "admin") {
      if (task.assignedTo?.toString() !== req.user._id.toString())
        return res.status(403).json({ error: "Not authorized" });
      const { status } = req.body;
      task.status = status || task.status;
    } else {
      Object.assign(task, req.body);
    }
    await task.save();
    await task.populate(["assignedTo", "createdBy", "projectId"]);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id  (admin only)
app.delete("/api/tasks/:id", auth, adminOnly, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "TaskFlow API running 🚀" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));