# ✦ TaskFlow — Team Task Manager

A full-stack web application for managing team projects and tasks with **role-based access control** (Admin / Member).

![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20Express%20%7C%20MongoDB-6366f1?style=flat-square)
![Deployment](https://img.shields.io/badge/Deployed%20on-Railway-0B0D0E?style=flat-square&logo=railway)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🚀 Live Demo

**[👉 View Live App](https://your-app-url.railway.app)**

> **Demo Credentials:**
> | Role | Email | Password |
> |------|-------|----------|
> | Admin | admin@demo.com | admin123 |
> | Member | member@demo.com | member123 |

---

## 📸 Features

### 🔐 Authentication
- Signup / Login with JWT-based auth
- Passwords hashed with bcrypt
- Role-based access: **Admin** and **Member**

### 📁 Project Management
- Create, view, and delete projects (Admin only)
- Assign team members to projects
- Color-coded project tracking
- Progress bar per project

### ✅ Task Management
- Create tasks with title, description, priority, due date
- Assign tasks to team members
- Kanban board view: **To Do → In Progress → Done**
- Overdue task detection & highlighting

### 📊 Dashboard
- Stats: Total, In Progress, Completed, Overdue
- My recent tasks at a glance
- Projects overview with completion %

### 🔒 Role-based Access Control
| Feature | Admin | Member |
|---------|-------|--------|
| Create/Delete projects | ✅ | ❌ |
| Add/Delete tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks) |
| View all projects | ✅ | ❌ (assigned only) |
| Manage users | ✅ | ❌ |

---

## 🛠️ Tech Stack

### Frontend
- **React.js** — UI library
- **React Hooks** — State management
- **CSS-in-JS** — Styling (no external CSS framework)

### Backend
- **Node.js** — Runtime
- **Express.js** — REST API framework
- **MongoDB** — NoSQL database
- **Mongoose** — ODM for MongoDB
- **JWT** — Authentication tokens
- **bcryptjs** — Password hashing

### Deployment
- **Railway** — Cloud deployment (frontend + backend)
- **MongoDB Atlas** — Cloud database

---

## 📁 Project Structure

```
taskflow/
├── frontend/
│   ├── src/
│   │   └── App.jsx          # Main React app (single-file)
│   ├── package.json
│   └── README.md
│
└── backend/
    ├── server.js            # Express server + all routes
    ├── package.json
    ├── .env.example
    └── .gitignore
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)

### 1. Clone the repo
```bash
git clone https://taskflow-production-0f84.up.railway.app/taskflow.git
cd taskflow
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

App runs on `http://localhost:3000`, API on `http://localhost:5000`

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login & get JWT token |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/projects` | All users |
| POST | `/api/projects` | Admin only |
| PUT | `/api/projects/:id` | Admin only |
| DELETE | `/api/projects/:id` | Admin only |

### Tasks
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/tasks` | All users |
| POST | `/api/tasks` | Admin only |
| PUT | `/api/tasks/:id` | Admin + assigned member |
| DELETE | `/api/tasks/:id` | Admin only |

### Users
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/users` | Admin only |

---

## 🚂 Railway Deployment

### Backend
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo's `backend` folder
3. Add environment variables:
   - `MONGO_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — any long random string
   - `PORT` — 5000
4. Deploy!

### Frontend
1. New Service → GitHub → select `frontend` folder
2. Add env variable: `REACT_APP_API_URL` = your backend Railway URL
3. Deploy!

---

## 📹 Demo Video

[Watch 3-min demo →](https://your-video-link-here)

---

## 👤 Author

**Your Name**
- GitHub: [mitalivarshney-mv](https://github.com/mitalivarshney-mv/taskflow)
- Email: mitali.varshney@ethara.ai

---

## 📄 License

MIT License — feel free to use this project!
