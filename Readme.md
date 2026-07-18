# Project Management Tool

A full-stack **Project Management Tool** inspired by applications like **Trello** and **Asana**, built to help teams collaborate efficiently by organizing projects, managing tasks, and communicating within task discussions.

> **Assignment Submission Deadline:** 20 July 2026

## 📌 Project Overview

This application enables users to create collaborative workspaces where teams can manage projects, assign tasks, track progress, and communicate through task comments.

The application includes secure authentication, project boards, task management, and a backend API for handling users, projects, tasks, and comments.

---

## ✨ Features

### Authentication
- User Registration
- User Login
- Secure Authentication
- Protected Routes

### Project Management
- Create Projects
- View Project List
- Manage Project Details
- Collaborate with Team Members

### Task Management
- Create Tasks
- Assign Tasks to Users
- Update Task Status
- Edit/Delete Tasks
- Organize Tasks within Projects

### Comments & Communication
- Add Comments to Tasks
- View Task Discussions
- Collaborate with Team Members

### Backend APIs
- User Management
- Project CRUD Operations
- Task CRUD Operations
- Comment Management
- Authentication APIs

---

## 🛠 Tech Stack

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Axios
- React Router

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt

---

## 📂 Project Structure

```
project-management-tool/
│
├── client/             # Frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/             # Backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB

---

### Clone Repository

```bash
git clone https://github.com/pratikdevelop/project-management-system.git
```

```bash
cd project-management-system
```

---

## Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the server directory.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Run the backend:

```bash
npm start
```

or

```bash
npm run dev
```

---

## Frontend Setup

```bash
cd client
npm install
```

Run frontend:

```bash
npm start
```

---

## API Modules

### Authentication

- Register User
- Login User

### Projects

- Create Project
- Get Projects
- Update Project
- Delete Project

### Tasks

- Create Task
- Update Task
- Assign Task
- Delete Task
- Get Tasks

### Comments

- Add Comment
- Get Comments

---

## Application Workflow

1. Register/Login
2. Create a Project
3. Add Tasks
4. Assign Tasks
5. Update Task Status
6. Add Comments
7. Collaborate with Team Members

---

## Future Enhancements (Bonus)

- Real-time Notifications
- WebSocket Integration
- Email Notifications
- File Attachments
- Drag-and-Drop Task Board
- Activity Logs
- Dashboard Analytics

---

## Screenshots

You can add screenshots here.

Example:

```
screenshots/
    login.png
    dashboard.png
    project-board.png
    task-details.png
```

---

## Learning Outcomes

This project demonstrates understanding of:

- Full Stack Development
- REST API Design
- JWT Authentication
- MongoDB Data Modeling
- React State Management
- CRUD Operations
- Team Collaboration Features

---

## Author

**Pratik Raut**

GitHub:
https://github.com/pratikdevelop

---

## Assignment

**Project Management Tool**

Build a collaborative tool similar to Trello or Asana.

### Requirements

- Create Group Projects
- Assign Tasks
- Comment and Communicate within Tasks
- Full Stack Application
- Authentication System
- Project Boards
- Task Cards
- Backend for Users, Projects, Tasks and Comments

### Bonus

- Notifications
- Real-Time Updates using WebSockets

---

## License

This project was developed as part of an academic assignment and is intended for educational purposes.