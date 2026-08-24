# Multi-User Day-Wise Checklist & Time Tracking Web Application

A full-featured, scalable, multi-user day-wise checklist and task time-tracking web application built with **React**, **Vite**, **Tailwind CSS**, and **Supabase** (Auth, Postgres, Row Level Security).

---

## 🌟 Key Features

1. **Authentication & User Management**:
   - Secure Sign Up & Login powered by **Supabase Auth**.
   - Preserved session handling across browser refreshes without unexpected logouts.
   - User Profile management (Update Full Name).

2. **Strict User Data Isolation**:
   - PostgreSQL **Row Level Security (RLS)** policies enforced on all tables via `auth.uid()`.
   - Complete privacy guarantee: User A can never read, modify, or export User B's data.

3. **Day & Task System**:
   - Sequential Day Containers (Day 1, Day 2, Day 3, etc.) with custom title and overview descriptions.
   - Task lists per day with task title, detailed description, and ordering position.
   - Accessible native HTML `<input type="checkbox">` inputs.

4. **Instant Optimistic UI & Time Tracking**:
   - Checkbox clicks update UI state instantly.
   - Database-authoritative completion timestamp recorded on checking a task (`completed_at`).
   - Graceful state rollback + user notification if database connection fails.

5. **Complete Activity Audit History**:
   - Immutable log recorded in `task_activity` table for every `completed` and `uncompleted` event.
   - Detailed modal timeline displaying chronological actions with local timezone formatting (`21 Aug 2026 • 10:42 PM`).

6. **Progress Metrics & Visual Indicators**:
   - Day progress bar and count (`3 / 5 completed - 60%`).
   - Automatic status badges: **Not Started** (0 completed), **In Progress** (partially completed), **Completed** (all completed).
   - Global dashboard overview stats: Total Tasks, Completed Tasks, Pending Tasks, and Overall Progress percentage.

7. **RFC-4180 Compliant CSV Export**:
   - **Export Checklist CSV**: Downloads all user's days, tasks, completion status, and timestamps.
   - **Export Activity CSV**: Downloads the complete timestamp history audit log of all completed/uncompleted actions.
   - Includes UTF-8 BOM (`\uFEFF`) for seamless compatibility with Microsoft Excel, Google Sheets, and standard spreadsheet software.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, JavaScript (ES2023), Vite 8
- **Styling**: Tailwind CSS v4, PostCSS, Lucide React Icons
- **Backend & Database**: Supabase (PostgreSQL, Supabase Auth, Row Level Security)
- **Routing**: React Router DOM v7

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/daily-checklist.git
cd daily-checklist
npm install
```

### 2. Configure Supabase Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Initialize Supabase Database Schema

1. Log into your [Supabase Dashboard](https://app.supabase.com).
2. Create a new project or select an existing project.
3. Open the **SQL Editor** from the left navigation menu.
4. Open the file [`supabase/schema.sql`](file:///c:/Users/Admin/Desktop/time%20checker/supabase/schema.sql) from this repository.
5. Copy the entire contents of `supabase/schema.sql` and paste them into the Supabase SQL Editor.
6. Click **Run** to execute the script.

> **What this SQL script sets up:**
> - Tables: `profiles`, `days`, `tasks`, `task_activity`
> - Indexes for high-performance user queries
> - Strict RLS Security Policies for `auth.uid() = user_id`
> - Atomic RPC function `toggle_task_status(p_task_id, p_completed)`
> - Automatic trigger `on_auth_user_created` to create user profiles and seed initial Day 1–3 starter tasks upon signup.

### 4. Start Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 🔒 Security & Data Isolation Verification Scenario

To test data isolation between different accounts:

1. **User A Signup**:
   - Register `test-user-a@example.com` with password `password123`.
   - Complete Task 1 on Day 1. Observe completion timestamp.
   - Click **Export Checklist CSV** and verify only User A's tasks are downloaded.
   - Log out.

2. **User B Signup**:
   - Register `test-user-b@example.com` with password `password456`.
   - Observe that User B sees their own clean Day 1 checklist data.
   - User B cannot see, modify, or export any of User A's data.

---

## 📦 Production Build & Deployment

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Deploying to Vercel or Netlify

1. Push your repository to GitHub.
2. Connect your GitHub repository to Vercel or Netlify.
3. In Project Settings -> Environment Variables, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Set Build Command to `npm run build` and Output Directory to `dist`.
5. Click **Deploy**.

---

## 📁 Repository Structure

```text
daily-checklist/
├── src/
│   ├── components/
│   │   ├── Header.jsx             # Top bar navigation & export triggers
│   │   ├── Sidebar.jsx            # Desktop day list navigation
│   │   ├── DaySelector.jsx        # Mobile day navigation tabs
│   │   ├── DayCard.jsx            # Selected day summary card
│   │   ├── TaskItem.jsx           # Task row with checkbox & timestamps
│   │   ├── TaskDetailModal.jsx    # Modal popup with activity timeline
│   │   ├── ActivityHistory.jsx    # Timeline component for audit log
│   │   ├── ProgressBar.jsx        # Animated gradient progress bar
│   │   ├── DashboardStats.jsx     # Overview statistics cards
│   │   ├── ExportButtons.jsx      # CSV export trigger buttons
│   │   ├── TaskFormModal.jsx      # Create/edit task form modal
│   │   ├── DayFormModal.jsx       # Create/edit day form modal
│   │   ├── ProfileModal.jsx       # Profile settings form modal
│   │   ├── LoadingState.jsx       # Loading skeletons and spinners
│   │   ├── EmptyState.jsx         # Friendly empty state cards
│   │   └── ErrorMessage.jsx       # Alert banner notification
│   ├── pages/
│   │   ├── Login.jsx              # Sign-in page
│   │   ├── Signup.jsx             # Sign-up page
│   │   ├── Dashboard.jsx          # Protected main application dashboard
│   │   └── Profile.jsx            # User profile page
│   ├── hooks/
│   │   ├── useAuth.jsx            # AuthContext provider & auth hook
│   │   ├── useDays.js             # Days state & selection hook
│   │   └── useTasks.js            # Tasks state & optimistic toggle hook
│   ├── services/
│   │   ├── authService.js         # Supabase Auth SDK service
│   │   ├── dayService.js          # Days query service
│   │   ├── taskService.js         # Tasks & RPC service
│   │   └── exportService.js       # RLS-backed CSV generation service
│   ├── lib/
│   │   └── supabase.js            # Supabase client singleton setup
│   ├── utils/
│   │   ├── csv.js                 # RFC-4180 CSV serializer with BOM
│   │   ├── date.js                # Localized date/time formatters
│   │   └── progress.js            # Progress & badge calculation utilities
│   ├── App.jsx                    # Routing & protected route guards
│   ├── main.jsx                   # React entry point
│   └── index.css                  # Tailwind directives & base styles
├── supabase/
│   └── schema.sql                 # Complete SQL schema & trigger definitions
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```
