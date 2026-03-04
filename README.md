# 🏫 LearnSpace — College Classroom Management System

A full-stack web application for managing classroom bookings, timetables, and room allocations across a college campus. Built for **Vignan's Institute of Information Technology, Visakhapatnam**.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [User Roles](#user-roles)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## 🎯 Overview

LearnSpace is a real-time classroom booking and management system designed for college campuses. It allows teachers and organizers to request rooms, admins to manage approvals, and students to view room availability and timetables — all in one place.

---

## ✨ Features

### 🔐 Authentication
- Role-based login system (Admin, Teacher, Organiser, Student)
- Secure session management
- Protected routes per role

### 📅 Room Booking
- Teachers can book classrooms and labs
- Organisers can book seminar halls and auditoriums
- Real-time room availability checking by date and time
- Auto-fill booking forms from room status page
- Conflict detection — blocks booking if room already approved

### ✅ Admin Approval Workflow
- Admin reviews all pending booking requests
- Approve or reject with reason
- **Auto-rejection** — when one booking is approved, all conflicting pending requests are automatically rejected with email notification
- Admin can cancel already approved bookings with reason
- Rejection reason shown in user's request history

### 🔴 Real-Time Room Status
- Live room status: 🟢 Free / 🟡 Reserved / 🔴 Occupied
- **Socket.io** powered instant updates across all open browsers
- Auto page refresh every 30 seconds as fallback
- Warning shown on booking form if room gets taken while filling

### 🏫 Daily Room Allocation
- Admin uploads daily class allocation Excel file
- Rooms blocked automatically for regular classes
- Room card shows class name and period when blocked
- Admin can edit or delete individual allocation entries for class shifts
- Instant update when class shifts to different room

### 📊 Student Timetable
- Students view their class timetable by Year, Branch, Section
- Admin uploads timetable via Excel
- Break and Lunch periods shown
- Timetable grid with all 7 periods

### 👥 User Management
- Admin can manage all users
- Add, edit, delete users
- Assign roles

### 🏢 Room Management
- Admin can add, edit, delete rooms
- Toggle room active/inactive status
- Rooms organized by block (Dharithri, Main, Medha)
- Room types: Classroom, Lab, Seminar Hall, Auditorium

### 📧 Email Notifications
- Booking submitted confirmation
- Booking approved notification
- Booking rejected notification with reason
- Auto-rejection notification with reason
- Admin cancellation notification

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js |
| **Frontend** | EJS Templates, HTML, CSS, JavaScript |
| **Database** | MongoDB with Mongoose |
| **Real-time** | Socket.io |
| **Email** | Nodemailer |
| **File Upload** | Multer |
| **Excel Processing** | XLSX |
| **Authentication** | Express Session |
| **Deployment** | Render |
| **Database Hosting** | MongoDB Atlas |

---

## 👤 User Roles

### 🔴 Admin
- Manage all bookings (approve/reject/cancel)
- Manage rooms (add/edit/delete/toggle)
- Manage users
- Upload timetables per branch/section
- Upload daily room allocations
- Edit individual allocation entries for class shifts
- View all pending, approved, rejected requests

### 🟡 Teacher
- View real-time room availability
- Book classrooms and labs
- View own booking requests and status
- Receive email notifications

### 🟠 Organiser
- View real-time hall availability (labs, seminar halls, auditoriums)
- Book seminar halls and auditoriums
- View own booking requests and status
- Receive email notifications

### 🟢 Student
- View real-time room availability (view only)
- View class timetable by Year/Branch/Section

---

## 📁 Project Structure

```
project/
├── db/
│   └── register.js          # Mongoose schemas and models
├── middleware/
│   └── auth.js              # Authentication middleware
├── public/
│   ├── images/              # Logo and hero images
│   └── uploads/             # Temporary Excel upload storage
├── routes/
│   ├── admin.js             # Admin routes
│   ├── teacher.js           # Teacher routes
│   ├── organiser.js         # Organiser routes
│   └── student.js           # Student routes
├── views/
│   ├── login.ejs
│   ├── admin-dashboard.ejs
│   ├── admin-pending.ejs
│   ├── admin-approved.ejs
│   ├── admin-rejected.ejs
│   ├── admin-users.ejs
│   ├── admin-rooms.ejs
│   ├── admin-room-edit.ejs
│   ├── admin-timetable.ejs
│   ├── admin-daily-allocation.ejs
│   ├── admin-daily-allocation-edit.ejs
│   ├── teacher-dashboard.ejs
│   ├── teacher-quick-booking.ejs
│   ├── teacher-requests.ejs
│   ├── teacher-rooms.ejs
│   ├── organiser-dashboard.ejs
│   ├── organiser-create-booking.ejs
│   ├── organiser-events.ejs
│   ├── organiser-halls.ejs
│   ├── student-dashboard.ejs
│   ├── student-rooms.ejs
│   └── student-timetable.ejs
├── .env                     # Environment variables (never commit!)
├── .gitignore
├── package.json
└── server.js                # Main entry point
```

---

## ⚙️ Installation

### Prerequisites
- Node.js v18 or higher
- MongoDB Atlas account
- Gmail account with App Password enabled

### Steps

**1. Clone the repository:**
```bash
git clone https://github.com/yourusername/college-classroom-management.git
cd college-classroom-management
```

**2. Install dependencies:**
```bash
npm install
```

**3. Create `.env` file in root directory:**
```env
PORT=3008
MONGODB_URI=your_mongodb_atlas_connection_string
SESSION_SECRET=your_session_secret_key
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_gmail_app_password
NODE_ENV=development
```

**4. Start the server:**
```bash
npm start
```

**5. Open browser:**
```
http://localhost:3008
```

---

## 🔐 Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `3008` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `SESSION_SECRET` | Secret key for sessions | `any_long_random_string` |
| `EMAIL_USER` | Gmail address for notifications | `college@gmail.com` |
| `EMAIL_PASS` | Gmail App Password | `xxxx xxxx xxxx xxxx` |
| `NODE_ENV` | Environment | `production` or `development` |

> ⚠️ Never commit `.env` to GitHub. It is already in `.gitignore`.

---

## 🚀 Deployment on Render

### Step 1 — Push to GitHub
```bash
git init
git add .
git status        # verify .env is NOT listed
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/repo.git
git branch -M main
git push -u origin main
```

### Step 2 — Create Render Web Service
1. Go to [render.com](https://render.com)
2. Click **New → Web Service**
3. Connect your GitHub repository
4. Configure:

| Setting | Value |
|---|---|
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Node Version | `18` |
| Region | Singapore |

### Step 3 — Add Environment Variables on Render
Add all variables from your `.env` file in the Render dashboard under **Environment Variables**.

### Step 4 — MongoDB Atlas Network Access
1. Go to MongoDB Atlas → Network Access
2. Add IP Address → Allow from Anywhere (`0.0.0.0/0`)

### Step 5 — Deploy!
Render will automatically build and deploy. Your app will be live at:
```
https://your-app-name.onrender.com
```

> ⚠️ Free plan sleeps after 15 min inactivity. First request may take 30-50 seconds. Upgrade to Starter plan ($7/month) for always-on service with 100+ users.

---

## 📊 Database Collections

| Collection | Description |
|---|---|
| `users` | All users with roles |
| `rooms` | All rooms/labs/halls |
| `bookings` | All booking requests |
| `timetables` | Class timetables per branch/section |
| `dailyallocations` | Daily room allocation per period |

---

## 📱 Excel Upload Formats

### Timetable Upload
| day | slot | subject | start_time | end_time |
|---|---|---|---|---|
| MON | 1 | CN | 08:45 | 09:35 |

### Daily Allocation Upload
| date | period | class | room |
|---|---|---|---|
| 2026-03-04 | 1 | III CSE-B | MARK |

---

## 🔄 Booking Workflow

```
User submits booking request
        ↓
Admin reviews pending requests
        ↓
Admin approves one request
        ↓
All conflicting pending requests → Auto rejected
Rejection emails sent to affected users
        ↓
Room shows as OCCUPIED in real-time
All open browser pages update via Socket.io
```

---

## 👨‍💻 Developer

Built with ❤️ for **Vignan's Institute of Information Technology (A), Visakhapatnam**

---

## 📄 License

This project is private and intended for internal college use only.

