import React from "react";
import { useState, useEffect, useCallback } from "react";

const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => new Date().toISOString();
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const isOverdue = (due) => due && new Date(due) < new Date();

const SEED_USERS = [
  { id: "u1", name: "Mitali Varshney", email: "mitali.varshney@ethara.ai", password: "admin123", role: "admin", avatar: "PS" },
  { id: "u2", name: "Arjun Mehta", email: "member@demo.com", password: "member123", role: "member", avatar: "AM" },
  { id: "u3", name: "Neha Kapoor", email: "neha@demo.com", password: "neha123", role: "member", avatar: "NK" },
];

const SEED_PROJECTS = [
  { id: "p1", name: "Website Redesign", description: "Redesign company website", createdBy: "u1", members: ["u1","u2","u3"], createdAt: now(), color: "#6366f1" },
  { id: "p2", name: "Mobile App MVP", description: "Build mobile app", createdBy: "u1", members: ["u1","u3"], createdAt: now(), color: "#f59e0b" },
];

const SEED_TASKS = [
  { id: "t1", projectId: "p1", title: "Design homepage mockups", description: "Figma mockups", status: "done", priority: "high", assignedTo: "u2", due: "2026-05-10", createdBy: "u1", createdAt: now() },
  { id: "t2", projectId: "p1", title: "Setup CI/CD pipeline", description: "GitHub Actions", status: "in-progress", priority: "high", assignedTo: "u3", due: "2026-05-20", createdBy: "u1", createdAt: now() },
  { id: "t3", projectId: "p1", title: "Write unit tests", description: "80% coverage", status: "todo", priority: "medium", assignedTo: "u2", due: "2026-06-01", createdBy: "u1", createdAt: now() },
  { id: "t4", projectId: "p2", title: "Define API endpoints", description: "REST API docs", status: "done", priority: "high", assignedTo: "u3", due: "2026-05-08", createdBy: "u1", createdAt: now() },
  { id: "t5", projectId: "p2", title: "Build auth screens", description: "Login, signup", status: "in-progress", priority: "medium", assignedTo: "u1", due: "2026-05-25", createdBy: "u1", createdAt: now() },
  { id: "t6", projectId: "p1", title: "SEO Optimization", description: "Meta tags", status: "todo", priority: "low", assignedTo: "u2", due: "2026-04-01", createdBy: "u1", createdAt: now() },
];

const STATUS = {
  "todo": { label: "To Do", color: "#94a3b8", bg: "#f1f5f9" },
  "in-progress": { label: "In Progress", color: "#f59e0b", bg: "#fffbeb" },
  "done": { label: "Done", color: "#10b981", bg: "#f0fdf4" },
};

const PRIORITY = {
  "low": { label: "Low", color: "#64748b" },
  "medium": { label: "Medium", color: "#f59e0b" },
  "high": { label: "High", color: "#ef4444" },
};

const store = {
  get: (k, def) => { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : def; } catch(e) { return def; } },
  set: (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch(e) {} },
};

export default function App() {
  const [users] = useState(() => store.get("ttm_users", SEED_USERS));
  const [projects, setProjects] = useState(() => store.get("ttm_projects", SEED_PROJECTS));
  const [tasks, setTasks] = useState(() => store.get("ttm_tasks", SEED_TASKS));
  const [session, setSession] = useState(() => store.get("ttm_session", null));
  const [view, setView] = useState("dashboard");
  const [selProject, setSelProject] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { store.set("ttm_projects", projects); }, [projects]);
  useEffect(() => { store.set("ttm_tasks", tasks); }, [tasks]);
  useEffect(() => { store.set("ttm_session", session); }, [session]);

  const showToast = useCallback((msg, type) => {
    setToast({ msg, type: type || "success" });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const login = (email, password) => {
    const u = users.find(function(u) { return u.email === email && u.password === password; });
    if (!u) return false;
    setSession(u);
    setView("dashboard");
    return true;
  };

  const logout = () => { setSession(null); setView("dashboard"); setSelProject(null); };

  if (!session) return React.createElement(LoginPage, { onLogin: login });

  const myProjects = projects.filter(function(p) { return p.members.includes(session.id); });
  const myTasks = tasks.filter(function(t) { return t.assignedTo === session.id; });
  const allTasks = session.role === "admin" ? tasks : tasks.filter(function(t) { return myProjects.some(function(p) { return p.id === t.projectId; }); });

  const addProject = (data) => {
    const p = Object.assign({ id: uid() }, data, { createdBy: session.id, members: [session.id].concat(data.members || []), createdAt: now(), color: data.color || "#6366f1" });
    setProjects(function(prev) { return [p].concat(prev); });
    showToast("Project created!");
    setModal(null);
  };

  const deleteProject = (id) => {
    setProjects(function(prev) { return prev.filter(function(p) { return p.id !== id; }); });
    setTasks(function(prev) { return prev.filter(function(t) { return t.projectId !== id; }); });
    if (selProject === id) { setSelProject(null); setView("projects"); }
    showToast("Project deleted", "error");
  };

  const addTask = (data) => {
    const t = Object.assign({ id: uid() }, data, { createdBy: session.id, createdAt: now() });
    setTasks(function(prev) { return [t].concat(prev); });
    showToast("Task added!");
    setModal(null);
  };

  const updateTask = (id, patch) => {
    setTasks(function(prev) { return prev.map(function(t) { return t.id === id ? Object.assign({}, t, patch) : t; }); });
  };

  const deleteTask = (id) => {
    setTasks(function(prev) { return prev.filter(function(t) { return t.id !== id; }); });
    showToast("Task deleted", "error");
  };

  const currentProject = selProject ? projects.find(function(p) { return p.id === selProject; }) : null;

  return (
    <div style={s.app}>
      <Sidebar
        session={session} view={view} setView={setView} onLogout={logout}
        projects={myProjects} selProject={selProject}
        setSelProject={function(id) { setSelProject(id); setView("project"); }}
        isAdmin={session.role === "admin"}
        onNewProject={function() { setModal({ type: "newProject" }); }}
      />
      <main style={s.main}>
        <Topbar session={session} view={view} selProject={currentProject} />
        {view === "dashboard" && (
          <Dashboard
            session={session} tasks={allTasks} projects={myProjects} users={users}
            onStatusChange={updateTask}
            onOpenProject={function(id) { setSelProject(id); setView("project"); }}
          />
        )}
        {view === "projects" && (
          <ProjectsPage
            projects={myProjects} tasks={tasks} isAdmin={session.role === "admin"}
            onOpen={function(id) { setSelProject(id); setView("project"); }}
            onNew={function() { setModal({ type: "newProject" }); }}
            onDelete={deleteProject}
          />
        )}
        {view === "project" && selProject && (
          <ProjectDetail
            project={projects.find(function(p) { return p.id === selProject; })}
            tasks={tasks.filter(function(t) { return t.projectId === selProject; })}
            users={users} session={session}
            onAddTask={function() { setModal({ type: "newTask", projectId: selProject }); }}
            onStatusChange={updateTask} onDeleteTask={deleteTask}
            onEditTask={function(t) { setModal({ type: "editTask", task: t }); }}
          />
        )}
        {view === "mytasks" && (
          <MyTasks tasks={myTasks} projects={projects} users={users} onStatusChange={updateTask} onDelete={deleteTask} />
        )}
      </main>

      {modal && modal.type === "newProject" && (
        <Modal title="New Project" onClose={function() { setModal(null); }}>
          <ProjectForm users={users} session={session} onSubmit={addProject} onCancel={function() { setModal(null); }} />
        </Modal>
      )}
      {modal && (modal.type === "newTask" || modal.type === "editTask") && (
        <Modal title={modal.type === "editTask" ? "Edit Task" : "New Task"} onClose={function() { setModal(null); }}>
          <TaskForm
            projectId={modal.projectId} task={modal.task} users={users}
            projects={projects} session={session}
            onSubmit={modal.type === "editTask"
              ? function(d) { updateTask(modal.task.id, d); showToast("Task updated!"); setModal(null); }
              : addTask}
            onCancel={function() { setModal(null); }}
          />
        </Modal>
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

function LoginPage(props) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const submit = function() {
    if (!props.onLogin(email, pass)) setErr("Invalid credentials. Try admin@demo.com / admin123");
  };

  return (
    <div style={s.loginWrap}>
      <div style={s.loginBox}>
        <div style={s.loginLogo}>
          <span style={s.logoIcon}>✦</span>
          <span style={s.logoText}>TaskFlow</span>
        </div>
        <p style={s.loginSub}>Team Task Manager — Sign in to continue</p>
        <div style={s.field}>
          <label style={s.label}>Email</label>
          <input style={s.input} value={email} onChange={function(e) { setEmail(e.target.value); }} placeholder="you@company.com" onKeyDown={function(e) { if(e.key==="Enter") submit(); }} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" value={pass} onChange={function(e) { setPass(e.target.value); }} onKeyDown={function(e) { if(e.key==="Enter") submit(); }} />
        </div>
        {err && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>{err}</p>}
        <button style={s.btnPrimary} onClick={submit}>Sign In</button>
          <p style={{ color: "#64748b", fontSize: 12, textAlign: "center", marginTop: 12 }}>
  New user? Use demo account to explore!
</p>
        <div style={s.demoHint}>
          <b>Demo accounts:</b><br />
          admin@demo.com / admin123<br />
          member@demo.com / member123
        </div>
      </div>
    </div>
  );
}

function Sidebar(props) {
  var session = props.session, view = props.view, setView = props.setView, onLogout = props.onLogout;
  var projects = props.projects, selProject = props.selProject, setSelProject = props.setSelProject;
  var isAdmin = props.isAdmin, onNewProject = props.onNewProject;

  function navItem(label, icon, key) {
    return (
      <div key={key} style={Object.assign({}, s.navItem, view === key ? s.navActive : {})} onClick={function() { setView(key); }}>
        <span>{icon}</span><span>{label}</span>
      </div>
    );
  }

  return (
    <aside style={s.sidebar}>
      <div style={s.sideTop}>
        <div style={s.sideLogoWrap}>
          <span style={s.logoIcon}>✦</span>
          <span style={Object.assign({}, s.logoText, { fontSize: 18 })}>TaskFlow</span>
        </div>
        <div style={s.navSection}>
          {navItem("Dashboard", "◈", "dashboard")}
          {navItem("My Tasks", "◉", "mytasks")}
          {navItem("Projects", "◧", "projects")}
        </div>
        <div style={s.navSection}>
          <div style={s.sectionLabel}>
            PROJECTS
            {isAdmin && <button style={s.addBtn} onClick={onNewProject}>＋</button>}
          </div>
          {projects.map(function(p) {
            var isActive = selProject === p.id && view === "project";
            return (
              <div key={p.id}
                style={Object.assign({}, s.projectChip, isActive ? { background: p.color + "22", borderLeft: "3px solid " + p.color } : {})}
                onClick={function() { setSelProject(p.id); }}>
                <span style={Object.assign({}, s.dot, { background: p.color })}></span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={s.sideBottom}>
        <div style={s.avatar}>{session.avatar}</div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session.name}</div>
          <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>{session.role}</div>
        </div>
        <button style={s.logoutBtn} onClick={onLogout} title="Logout">⏻</button>
      </div>
    </aside>
  );
}

function Topbar(props) {
  var titles = { dashboard: "Dashboard", projects: "All Projects", mytasks: "My Tasks", project: props.selProject ? props.selProject.name : "Project" };
  return (
    <div style={s.topbar}>
      <div>
        <h1 style={s.pageTitle}>{titles[props.view] || "—"}</h1>
        <p style={s.pageSubtitle}>
          {props.view === "dashboard" && "Welcome back, " + props.session.name.split(" ")[0] + " 👋"}
          {props.view === "projects" && "All your projects at a glance"}
          {props.view === "mytasks" && "Tasks assigned to you"}
          {props.view === "project" && props.selProject && props.selProject.description}
        </p>
      </div>
      <div style={{ fontSize: 12, color: "#64748b" }}>{new Date().toDateString()}</div>
    </div>
  );
}

function Dashboard(props) {
  var session = props.session, tasks = props.tasks, projects = props.projects, users = props.users;
  var total = tasks.length;
  var done = tasks.filter(function(t) { return t.status === "done"; }).length;
  var inProg = tasks.filter(function(t) { return t.status === "in-progress"; }).length;
  var overdue = tasks.filter(function(t) { return isOverdue(t.due) && t.status !== "done"; }).length;
  var myTasks = tasks.filter(function(t) { return t.assignedTo === session.id; }).slice(0, 6);

  var stats = [
    { label: "Total Tasks", value: total, color: "#6366f1" },
    { label: "In Progress", value: inProg, color: "#f59e0b" },
    { label: "Completed", value: done, color: "#10b981" },
    { label: "Overdue", value: overdue, color: "#ef4444" },
  ];

  return (
    <div style={s.content}>
      <div style={s.statsRow}>
        {stats.map(function(stat) {
          return (
            <div key={stat.label} style={Object.assign({}, s.statCard, { borderTop: "3px solid " + stat.color })}>
              <div style={{ fontSize: 28, color: stat.color, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{stat.label}</div>
            </div>
          );
        })}
      </div>
      <div style={s.twoCol}>
        <div style={s.card}>
          <h3 style={s.cardTitle}>My Recent Tasks</h3>
          {myTasks.length === 0 && <p style={s.empty}>No tasks assigned to you.</p>}
          {myTasks.map(function(t) {
            var proj = projects.find(function(p) { return p.id === t.projectId; });
            return (
              <div key={t.id} style={s.taskRow}>
                <StatusBadge status={t.status} onChange={function(v) { props.onStatusChange(t.id, { status: v }); }} />
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontWeight: 500, fontSize: 13, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: t.status === "done" ? "line-through" : "none", opacity: t.status === "done" ? 0.5 : 1 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{proj ? proj.name : ""}{t.due ? " · Due " + fmtDate(t.due) : ""}</div>
                </div>
                <PriorityBadge priority={t.priority} />
              </div>
            );
          })}
        </div>
        <div style={s.card}>
          <h3 style={s.cardTitle}>Projects Overview</h3>
          {projects.map(function(p) {
            var ptasks = tasks.filter(function(t) { return t.projectId === p.id; });
            var pdone = ptasks.filter(function(t) { return t.status === "done"; }).length;
            var pct = ptasks.length ? Math.round((pdone / ptasks.length) * 100) : 0;
            return (
              <div key={p.id} style={Object.assign({}, s.projectRow, { cursor: "pointer" })} onClick={function() { props.onOpenProject(p.id); }}>
                <div style={Object.assign({}, s.dot, { background: p.color, width: 10, height: 10 })}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", marginBottom: 6 }}>{p.name}</div>
                  <div style={s.progressBar}>
                    <div style={Object.assign({}, s.progressFill, { width: pct + "%", background: p.color })}></div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProjectsPage(props) {
  return (
    <div style={s.content}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        {props.isAdmin && <button style={s.btnPrimary} onClick={props.onNew}>＋ New Project</button>}
      </div>
      <div style={s.projectGrid}>
        {props.projects.map(function(p) {
          var ptasks = props.tasks.filter(function(t) { return t.projectId === p.id; });
          var done = ptasks.filter(function(t) { return t.status === "done"; }).length;
          var pct = ptasks.length ? Math.round((done / ptasks.length) * 100) : 0;
          return (
            <div key={p.id} style={s.projectCard}>
              <div style={Object.assign({}, s.projectCardHeader, { background: p.color + "22", borderBottom: "1px solid " + p.color + "33" })}>
                <div style={Object.assign({}, s.dot, { background: p.color, width: 12, height: 12 })}></div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#e2e8f0", flex: 1 }}>{p.name}</h3>
                {props.isAdmin && <button style={s.iconBtn} onClick={function(e) { e.stopPropagation(); props.onDelete(p.id); }}>🗑</button>}
              </div>
              <div style={{ padding: "14px 16px" }}>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 12px 0", minHeight: 32 }}>{p.description}</p>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{ptasks.length} tasks · {done} done</div>
                <div style={s.progressBar}>
                  <div style={Object.assign({}, s.progressFill, { width: pct + "%", background: p.color })}></div>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, textAlign: "right" }}>{pct}% complete</div>
                <button style={Object.assign({}, s.btnOutline, { marginTop: 12, width: "100%" })} onClick={function() { props.onOpen(p.id); }}>Open Project →</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectDetail(props) {
  var [filter, setFilter] = useState("all");
  if (!props.project) return <div style={s.content}><p style={s.empty}>Select a project.</p></div>;
  var isAdmin = props.session.role === "admin";
  var shown = filter === "all" ? props.tasks : props.tasks.filter(function(t) { return t.status === filter; });

  return (
    <div style={s.content}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {["all", "todo", "in-progress", "done"].map(function(f) {
          return (
            <button key={f} style={Object.assign({}, s.filterBtn, filter === f ? s.filterActive : {})} onClick={function() { setFilter(f); }}>
              {f === "all" ? "All" : STATUS[f].label}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        {isAdmin && <button style={s.btnPrimary} onClick={props.onAddTask}>＋ Add Task</button>}
      </div>
      <div style={s.kanban}>
        {["todo", "in-progress", "done"].map(function(col) {
          var colTasks = props.tasks.filter(function(t) { return t.status === col && (filter === "all" || filter === col); });
          return (
            <div key={col} style={s.kanbanCol}>
              <div style={Object.assign({}, s.kanbanHead, { borderBottom: "2px solid " + STATUS[col].color })}>
                <span style={{ color: STATUS[col].color, fontWeight: 600, fontSize: 13 }}>{STATUS[col].label}</span>
                <span style={Object.assign({}, s.badge, { background: STATUS[col].bg, color: STATUS[col].color })}>{colTasks.length}</span>
              </div>
              {colTasks.map(function(t) {
                var assignee = props.users.find(function(u) { return u.id === t.assignedTo; });
                var over = isOverdue(t.due) && t.status !== "done";
                return (
                  <div key={t.id} style={Object.assign({}, s.kanbanCard, over ? { borderLeft: "3px solid #ef4444" } : {})}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#e2e8f0", lineHeight: 1.4, flex: 1 }}>{t.title}</p>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    {t.description && <p style={{ margin: "6px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>{t.description}</p>}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                      {assignee && <span style={s.avatarSm}>{assignee.avatar}</span>}
                      {t.due && <span style={{ fontSize: 10, color: over ? "#ef4444" : "#64748b" }}>📅 {fmtDate(t.due)}{over ? " Overdue!" : ""}</span>}
                      <div style={{ flex: 1 }} />
                      {(isAdmin || t.createdBy === props.session.id) && (
                        <span>
                          <button style={s.iconBtn} onClick={function() { props.onEditTask(t); }}>✏️</button>
                          <button style={s.iconBtn} onClick={function() { props.onDeleteTask(t.id); }}>🗑</button>
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {Object.keys(STATUS).filter(function(k) { return k !== col; }).map(function(k) {
                        return (
                          <button key={k} style={s.movBtn} onClick={function() { props.onStatusChange(t.id, { status: k }); }}>
                            {"→ " + STATUS[k].label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {colTasks.length === 0 && <p style={Object.assign({}, s.empty, { fontSize: 12 })}>No tasks here.</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MyTasks(props) {
  return (
    <div style={s.content}>
      {props.tasks.length === 0 && <p style={s.empty}>No tasks assigned to you!</p>}
      <div style={s.taskList}>
        {props.tasks.map(function(t) {
          var proj = props.projects.find(function(p) { return p.id === t.projectId; });
          var over = isOverdue(t.due) && t.status !== "done";
          return (
            <div key={t.id} style={Object.assign({}, s.taskCard, over ? { borderLeft: "3px solid #ef4444" } : {})}>
              <StatusBadge status={t.status} onChange={function(v) { props.onStatusChange(t.id, { status: v }); }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: "#e2e8f0", textDecoration: t.status === "done" ? "line-through" : "none", opacity: t.status === "done" ? 0.5 : 1 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                  {proj && <span style={Object.assign({}, s.dot, { background: proj.color, display: "inline-block", width: 8, height: 8, marginRight: 4, verticalAlign: "middle" })}></span>}
                  {proj ? proj.name : ""}{t.due ? " · Due " + fmtDate(t.due) : ""}{over ? <span style={{ color: "#ef4444" }}> · Overdue!</span> : ""}
                </div>
              </div>
              <PriorityBadge priority={t.priority} />
              <button style={s.iconBtn} onClick={function() { props.onDelete(t.id); }}>🗑</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectForm(props) {
  var [name, setName] = useState("");
  var [desc, setDesc] = useState("");
  var [color, setColor] = useState("#6366f1");
  var [members, setMembers] = useState([]);

  var toggleMember = function(id) {
    setMembers(function(prev) { return prev.includes(id) ? prev.filter(function(x) { return x !== id; }) : prev.concat([id]); });
  };

  var handleSubmit = function() {
    if (!name.trim()) return;
    props.onSubmit({ name: name.trim(), description: desc.trim(), color: color, members: members });
  };

  return (
    <div>
      <div style={s.field}><label style={s.label}>Project Name *</label><input style={s.input} value={name} onChange={function(e) { setName(e.target.value); }} placeholder="e.g. Website Redesign" /></div>
      <div style={s.field}><label style={s.label}>Description</label><textarea style={Object.assign({}, s.input, { height: 70, resize: "vertical" })} value={desc} onChange={function(e) { setDesc(e.target.value); }} /></div>
      <div style={s.field}>
        <label style={s.label}>Color</label>
        <div style={{ display: "flex", gap: 8 }}>
          {["#6366f1","#f59e0b","#10b981","#ef4444","#06b6d4","#ec4899"].map(function(c) {
            return <div key={c} onClick={function() { setColor(c); }} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: color === c ? "3px solid #fff" : "3px solid transparent" }} />;
          })}
        </div>
      </div>
      <div style={s.field}>
        <label style={s.label}>Add Members</label>
        {props.users.filter(function(u) { return u.id !== props.session.id; }).map(function(u) {
          return (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
              <input type="checkbox" checked={members.includes(u.id)} onChange={function() { toggleMember(u.id); }} style={{ accentColor: "#6366f1" }} />
              <span style={{ fontSize: 13, color: "#cbd5e1" }}>{u.name} <span style={{ color: "#64748b" }}>({u.role})</span></span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={s.btnOutline} onClick={props.onCancel}>Cancel</button>
        <button style={s.btnPrimary} onClick={handleSubmit}>Create Project</button>
      </div>
    </div>
  );
}

function TaskForm(props) {
  var [title, setTitle] = useState(props.task ? props.task.title : "");
  var [desc, setDesc] = useState(props.task ? props.task.description : "");
  var [status, setStatus] = useState(props.task ? props.task.status : "todo");
  var [priority, setPriority] = useState(props.task ? props.task.priority : "medium");
  var [due, setDue] = useState(props.task ? props.task.due : "");
  var [assigned, setAssigned] = useState(props.task ? props.task.assignedTo : props.session.id);
  var [pid, setPid] = useState(props.task ? props.task.projectId : (props.projectId || (props.projects[0] ? props.projects[0].id : "")));

  var handleSubmit = function() {
    if (!title.trim()) return;
    props.onSubmit({ projectId: pid, title: title.trim(), description: desc.trim(), status: status, priority: priority, due: due, assignedTo: assigned });
  };

  var projMembers = pid ? ((props.projects.find(function(p) { return p.id === pid; }) || {}).members || []) : [];
  var availUsers = props.users.filter(function(u) { return projMembers.includes(u.id); });

  return (
    <div>
      {!props.projectId && (
        <div style={s.field}>
          <label style={s.label}>Project</label>
          <select style={s.input} value={pid} onChange={function(e) { setPid(e.target.value); setAssigned(""); }}>
            {props.projects.map(function(p) { return <option key={p.id} value={p.id}>{p.name}</option>; })}
          </select>
        </div>
      )}
      <div style={s.field}><label style={s.label}>Task Title *</label><input style={s.input} value={title} onChange={function(e) { setTitle(e.target.value); }} placeholder="What needs to be done?" /></div>
      <div style={s.field}><label style={s.label}>Description</label><textarea style={Object.assign({}, s.input, { height: 60, resize: "vertical" })} value={desc} onChange={function(e) { setDesc(e.target.value); }} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={s.field}>
          <label style={s.label}>Status</label>
          <select style={s.input} value={status} onChange={function(e) { setStatus(e.target.value); }}>
            {Object.keys(STATUS).map(function(k) { return <option key={k} value={k}>{STATUS[k].label}</option>; })}
          </select>
        </div>
        <div style={s.field}>
          <label style={s.label}>Priority</label>
          <select style={s.input} value={priority} onChange={function(e) { setPriority(e.target.value); }}>
            {Object.keys(PRIORITY).map(function(k) { return <option key={k} value={k}>{PRIORITY[k].label}</option>; })}
          </select>
        </div>
        <div style={s.field}>
          <label style={s.label}>Due Date</label>
          <input style={s.input} type="date" value={due} onChange={function(e) { setDue(e.target.value); }} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Assign To</label>
          <select style={s.input} value={assigned} onChange={function(e) { setAssigned(e.target.value); }}>
            {(availUsers.length ? availUsers : props.users).map(function(u) { return <option key={u.id} value={u.id}>{u.name}</option>; })}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <button style={s.btnOutline} onClick={props.onCancel}>Cancel</button>
        <button style={s.btnPrimary} onClick={handleSubmit}>{props.task ? "Update Task" : "Add Task"}</button>
      </div>
    </div>
  );
}

function StatusBadge(props) {
  var [open, setOpen] = useState(false);
  var cfg = STATUS[props.status];
  return (
    <div style={{ position: "relative" }}>
      <div style={Object.assign({}, s.statusBadge, { background: cfg.bg, color: cfg.color, cursor: "pointer" })} onClick={function() { setOpen(function(o) { return !o; }); }}>
        {cfg.label + " ▾"}
      </div>
      {open && (
        <div style={s.dropdown}>
          {Object.keys(STATUS).map(function(k) {
            return <div key={k} style={Object.assign({}, s.dropItem, { color: STATUS[k].color })} onClick={function() { props.onChange(k); setOpen(false); }}>{STATUS[k].label}</div>;
          })}
        </div>
      )}
    </div>
  );
}

function PriorityBadge(props) {
  var cfg = PRIORITY[props.priority];
  return <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: cfg.color + "22", color: cfg.color, fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>{cfg.label}</span>;
}

function Modal(props) {
  return (
    <div style={s.modalOverlay} onClick={props.onClose}>
      <div style={s.modalBox} onClick={function(e) { e.stopPropagation(); }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: "#e2e8f0" }}>{props.title}</h2>
          <button style={s.closeBtn} onClick={props.onClose}>✕</button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

function Toast(props) {
  return <div style={Object.assign({}, s.toast, { background: props.type === "error" ? "#ef4444" : "#10b981" })}>{props.msg}</div>;
}

var s = {
  app: { display: "flex", minHeight: "100vh", background: "#0f172a", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#e2e8f0" },
  sidebar: { width: 240, background: "#0a0f1e", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" },
  sideTop: { flex: 1, padding: "20px 0 0" },
  sideLogoWrap: { display: "flex", alignItems: "center", gap: 10, padding: "0 20px 20px", borderBottom: "1px solid #1e293b" },
  logoIcon: { fontSize: 22, color: "#6366f1" },
  logoText: { fontWeight: 700, fontSize: 22, color: "#e2e8f0", letterSpacing: "-0.5px" },
  navSection: { padding: "16px 12px 0" },
  sectionLabel: { fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: 1.5, padding: "0 8px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#94a3b8", marginBottom: 2, userSelect: "none" },
  navActive: { background: "#1e293b", color: "#e2e8f0", fontWeight: 600 },
  projectChip: { display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#94a3b8", marginBottom: 2, borderLeft: "3px solid transparent", userSelect: "none" },
  dot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  addBtn: { background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 },
  sideBottom: { display: "flex", alignItems: "center", gap: 10, padding: "16px", borderTop: "1px solid #1e293b" },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  avatarSm: { width: 22, height: 22, borderRadius: "50%", background: "#334155", color: "#cbd5e1", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 },
  logoutBtn: { background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "auto" },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px 0", gap: 16 },
  pageTitle: { margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#f1f5f9" },
  pageSubtitle: { margin: 0, fontSize: 13, color: "#64748b" },
  content: { padding: "20px 28px 40px", flex: 1 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 },
  statCard: { background: "#1e293b", borderRadius: 12, padding: "18px 20px", position: "relative", overflow: "hidden" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  card: { background: "#1e293b", borderRadius: 12, padding: 20 },
  cardTitle: { margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 },
  taskRow: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #0f172a" },
  taskCard: { display: "flex", alignItems: "center", gap: 12, background: "#1e293b", borderRadius: 10, padding: "12px 16px", marginBottom: 8, borderLeft: "3px solid transparent" },
  projectRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #0f172a" },
  progressBar: { height: 5, background: "#0f172a", borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99 },
  badge: { fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 700 },
  statusBadge: { fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 600, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" },
  dropdown: { position: "absolute", top: "100%", left: 0, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, zIndex: 100, minWidth: 110, marginTop: 2, boxShadow: "0 8px 24px #00000055" },
  dropItem: { padding: "8px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  projectGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 },
  projectCard: { background: "#1e293b", borderRadius: 12, overflow: "hidden", border: "1px solid #334155" },
  projectCardHeader: { display: "flex", alignItems: "center", gap: 8, padding: "14px 16px" },
  kanban: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 },
  kanbanCol: { background: "#1e293b", borderRadius: 12, padding: 16, minHeight: 200 },
  kanbanHead: { display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, marginBottom: 12 },
  kanbanCard: { background: "#0f172a", borderRadius: 10, padding: "12px 14px", marginBottom: 10, borderLeft: "3px solid transparent" },
  taskList: { display: "flex", flexDirection: "column", gap: 8 },
  filterBtn: { padding: "6px 14px", borderRadius: 20, border: "1px solid #334155", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 12 },
  filterActive: { background: "#6366f1", border: "1px solid #6366f1", color: "#fff" },
  movBtn: { fontSize: 10, padding: "2px 6px", borderRadius: 4, border: "1px solid #334155", background: "transparent", color: "#64748b", cursor: "pointer" },
  iconBtn: { background: "transparent", border: "none", cursor: "pointer", fontSize: 14, padding: "2px 4px", opacity: 0.6 },
  empty: { color: "#475569", fontSize: 13, textAlign: "center", padding: "20px 0" },
  modalOverlay: { position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(2px)" },
  modalBox: { background: "#1e293b", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", border: "1px solid #334155" },
  closeBtn: { background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18 },
  field: { marginBottom: 14 },
  label: { display: "block", fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 },
  input: { width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "9px 12px", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" },
  btnPrimary: { background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  btnOutline: { background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 13 },
  loginWrap: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0f172a", width: "100%" },
  loginBox: { background: "#1e293b", borderRadius: 16, padding: 36, width: "100%", maxWidth: 400, border: "1px solid #334155" },
  loginLogo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  loginSub: { color: "#64748b", fontSize: 13, marginBottom: 24 },
  demoHint: { marginTop: 16, background: "#0f172a", borderRadius: 8, padding: 12, fontSize: 11, color: "#64748b", lineHeight: 1.8 },
  toast: { position: "fixed", bottom: 24, right: 24, color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: 13, zIndex: 999, boxShadow: "0 4px 20px #00000055" },
};
