Team Task Manager (Full-Stack)

A full-stack task management web app built for placement assignment requirements.
Users can sign up/login, create projects, manage team members, assign tasks, and track task progress with role-based access control.

Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)
- Auth: JWT + bcrypt
- Deployment target: Railway

Features Covered
- Authentication: signup/login with JWT
- Project management:
  - create project
  - creator is project admin
  - add/remove members endpoints
- Task management:
  - create tasks (title, description, due date, priority)
  - assign tasks to project users
  - update status (todo, in-progress, done)
- Dashboard:
  - total tasks
  - tasks by status
  - overdue tasks
  - tasks per user map
- Role-based access:
  - Admin: can add members, create tasks, manage all tasks in project
  - Member: can view only assigned tasks and update own task status

Project Structure
- backend - Express API + MongoDB models/routes
- frontend - React app UI

Local Setup
Quick install both apps:
npm run install:all

1) Backend
cd backend
copy .env.example to .env
update MONGODB_URI and JWT_SECRET in .env
npm install
npm run dev

Backend runs at http://localhost:5000

2) Frontend
cd frontend
copy .env.example to .env
npm install
npm run dev

Frontend runs at http://localhost:5173

Environment Variables
Backend (backend/.env)
- PORT=5000
- MONGODB_URI=<your_mongodb_connection_string>
- JWT_SECRET=<your_secret>

Frontend (frontend/.env)
- VITE_API_URL=http://localhost:5000/api

Railway Deployment
Deploy as two Railway services from same repo:
1. Backend Service
   - Root directory: backend
   - Start command: npm start
   - Env vars: MONGODB_URI, JWT_SECRET, PORT
2. Frontend Service
   - Root directory: frontend
   - Build command: npm run build
   - Start command: npm run start
   - Env var: VITE_API_URL=<your_backend_public_url>/api

Submission Checklist
- Live URL
- GitHub repository
- README
- 2-5 minute demo video

