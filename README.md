# 🇮🇳 Smart Bharat AI — Intelligent Digital Citizen-Assistance Platform

> **Production-Style Full-Stack Citizen Service Platform**  
> *Built with React 18, Vite, Tailwind CSS, Node.js, Express.js, MongoDB (with local JSON fallback), bCrypt + JWT Authentication, Google Gemini 1.5 Flash AI, Google Maps Platform / Leaflet, and PWA capabilities.*

---

## 📋 Table of Contents

1. [Product Vision & Core Features](#-product-vision--core-features)
2. [Monorepo Folder Architecture](#-monorepo-folder-architecture)
3. [Technology Stack](#-technology-stack)
4. [Master Phase Implementations (Phases 1 – 10)](#-master-phase-implementations-phases-1--10)
5. [Environment Setup (.env)](#-environment-setup-env)
6. [API REST Contracts](#-api-rest-contracts)
7. [AI Tool Calling & Navigation Actions](#-ai-tool-calling--navigation-actions)
8. [Installation & Quickstart Guide](#-installation--quickstart-guide)

---

## 🌟 Product Vision & Core Features

**Smart Bharat AI** is an intelligent digital citizen assistance platform designed to connect citizens with essential government services, scheme eligibility matcher, civic complaint tracking, DigiLocker document management, nearby emergency facility locator, and an AI companion capable of natural language interaction and tool execution.

### Key Capabilities
- 💬 **AI Assistant with Controlled Tool Calling**: Gemini 1.5 Flash AI connected to application tools (`REPORT_ISSUE`, `TRACK_COMPLAINT`, `GOVERNMENT_SCHEMES`, `DIGI_LOCKER`, `NEARBY_OFFICES`, `EMERGENCY_SERVICES`, `PROFILE`, `SETTINGS`) with contextual action buttons, STT voice dictation, and TTS voice synthesis.
- 🛣️ **Step-by-Step Issue Reporting Wizard**: 5-step wizard (Category -> Location Geolocation -> Photo Evidence -> Description -> Review) generating Complaint IDs (`SB-2026-XXXXX`), auto-assigning priority, and awarding **+20 Civic Points**.
- 📊 **Complaint Tracker**: Real-time status workflow timeline (`Submitted` -> `Registered` -> `Assigned` -> `In Progress` -> `Resolved` -> `Closed`) with user privacy isolation.
- 🔒 **DigiLocker Document Vault**: Encrypted document store with category filtering (`Identity`, `Education`, `Certificates`, `Government`, `Other`), PDF OCR parsing, AI legal circular simplifier, and JWT authorization ownership guards.
- 📍 **Nearby Civic Offices & Google Maps / Leaflet**: Locates Hospitals, Police Stations, Fire Departments, Post Offices, Municipality Offices, Schools, and Banks with verified telephone dialers (`tel:`) and driving direction routes.
- 📜 **Government Schemes Eligibility Matcher**: Demographic scheme matching engine linked to official government portals (`myScheme`, `India.gov.in`) with detail modals and eligibility disclaimers.
- 🏆 **Civic Points & Rewards System**: Level progression bar (`Level = Math.floor(pts / 100) + 1`), badges cabinet (`Civic Starter`, `Active Reporter`, `Civic Guardian`, `Community Legend`), and automatic point credits upon issue resolution.
- 🛡️ **Admin Dashboard**: Comprehensive auditing control panel for managing complaints, assigning departments, updating status workflows, publishing targeted broadcast notices, and inspecting SLA analytics.

---

## 📂 Monorepo Folder Architecture

```
d:/antigravity/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB Mongoose & Local JSON fallback adapter
│   │   └── cloudinary.js      # Cloudinary image upload stream adapter
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT token verification & admin guards
│   ├── models/
│   │   ├── User.js            # User Schema with bCrypt password hashing & methods
│   │   ├── Complaint.js       # Complaint Schema with timeline logs & SLA dates
│   │   ├── Scheme.js          # Scheme Schema with eligibility criteria
│   │   └── ChatHistory.js     # Conversation history logs
│   ├── routes/
│   │   ├── ai.js              # AI Chat endpoint with Gemini & Tool Calling
│   │   ├── auth.js            # JWT Register, Login, Me, Update routes
│   │   ├── complaints.js      # Report, Track, User & Admin update endpoints
│   │   ├── documents.js       # DigiLocker Upload, View, Delete & Legal Simplifier
│   │   ├── notifications.js   # Personalized Feed & Mark-as-Read endpoints
│   │   └── schemes.js         # Eligibility recommendation engine
│   ├── db_fallback.json       # Local JSON database for offline/no-MongoDB dev
│   ├── seed.js                # Database seeder script
│   ├── server.js              # Main Express server entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   │   ├── manifest.json      # Progressive Web App manifest
│   │   └── sw.js              # Service Worker for offline asset caching
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # Reusable SaaS Component Library
│   │   │   │   ├── Alert.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── ConfirmationDialog.jsx
│   │   │   │   ├── EmptyState.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── PageHeader.jsx
│   │   │   │   ├── SearchBar.jsx
│   │   │   │   ├── Select.jsx
│   │   │   │   ├── Skeleton.jsx
│   │   │   │   ├── StatusBadge.jsx
│   │   │   │   └── Timeline.jsx
│   │   │   ├── Navbar.jsx     # Header navigation bar
│   │   │   ├── Sidebar.jsx    # SaaS drawer navigation
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # JWT token management & Bearer headers
│   │   │   ├── LanguageContext.jsx   # Multilingual translation dictionary
│   │   │   ├── ThemeContext.jsx      # Light/Dark mode switcher
│   │   │   └── ToastContext.jsx      # Toast popup notification provider
│   │   ├── pages/
│   │   │   ├── Admin.jsx             # Admin audit panel & SLA analytics
│   │   │   ├── AiAssistant.jsx       # AI Assistant with tool navigation buttons
│   │   │   ├── ComplaintTracker.jsx  # Status timeline tracker
│   │   │   ├── Dashboard.jsx         # Citizen overview dashboard
│   │   │   ├── DocumentAssistant.jsx # DigiLocker & Legal text simplifier
│   │   │   ├── Emergency.jsx         # Direct dial emergency contacts
│   │   │   ├── Landing.jsx           # Public landing showcase page
│   │   │   ├── Login.jsx             # Sign-in & Sign-up page with admin bypass
│   │   │   ├── NearbyOffices.jsx     # Google Maps / Leaflet office locator
│   │   │   ├── Profile.jsx           # Civic points cabinet & badges
│   │   │   ├── ReportIssue.jsx       # 5-Step issue reporting wizard
│   │   │   ├── Schemes.jsx           # Government schemes & eligibility matcher
│   │   │   └── Settings.jsx          # Profile & theme preferences
│   │   ├── App.jsx                   # Main routing matrix
│   │   ├── index.css                 # Tailwind CSS tokens & custom styling
│   │   └── main.jsx                  # Application entry point
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── package.json                      # Root workspace package.json (Concurrently runner)
└── README.md                         # Complete Master Documentation File
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend Framework** | React 18, Vite, React Router DOM v6 |
| **Styling & Aesthetics** | Tailwind CSS v3, Vanilla CSS, Lucide Icons, Glassmorphism, Tricolor Theme |
| **State & Context** | React Context (Auth, Language, Theme, Toast) |
| **Backend Framework** | Node.js, Express.js, Multer |
| **Database & Fallback** | MongoDB (Mongoose) + Local JSON Storage Adapter (`db_fallback.json`) |
| **Authentication** | bCrypt Password Hashing + JSON Web Tokens (JWT) |
| **AI Integration** | Google Gemini API (`@google/generative-ai`) + Fallback Keyword/Intent Engine |
| **Maps & Location** | Google Maps Platform JS API / Places API + Leaflet Fallback + Geolocation API |
| **Document Processing** | PDF-Parse + Gemini OCR |

---

## ⚙️ Environment Setup (.env)

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart_bharat
JWT_SECRET=smart_bharat_secret_key_2026_change_in_production
GEMINI_API_KEY=your_google_gemini_api_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

---

## 🔌 API REST Contracts

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Registers user with password hashing and returns JWT token.
- `POST /api/auth/login` — Authenticates email and password, returning JWT token.
- `GET /api/auth/me` — Returns logged-in user profile (`Authorization: Bearer <token>`).
- `POST /api/auth/update` — Updates state, interests, and profile details.

### Complaints (`/api/complaints`)
- `POST /api/complaints/report` — Lodges complaint, auto-generates Complaint ID (`SB-2026-XXXXX`), awards +20 points.
- `GET /api/complaints/track/:id` — Fetches single complaint details & timeline.
- `GET /api/complaints/user/:email` — Fetches user's own complaints (isolated ownership).
- `GET /api/complaints/admin/all` — Admin fetch all complaints (`adminOnly`).
- `POST /api/complaints/admin/update/:id` — Admin updates status, department, and awards points on `Resolved`.

### DigiLocker (`/api/documents`)
- `POST /api/documents/upload` — Uploads document, runs Gemini OCR verification, and stores record.
- `GET /api/documents/user/:email` — Fetches user's locker files (`ownership checked`).
- `DELETE /api/documents/:id` — Deletes document from locker (`ownership checked`).
- `POST /api/documents/simplify` — Simplifies legal circulars into plain language.

### Government Schemes (`/api/schemes`)
- `POST /api/schemes/recommend` — Matches user demographics against structured scheme database.

### Notifications (`/api/notifications`)
- `GET /api/notifications/:email` — Retrieves personalized notification feed based on user state/interests.
- `PATCH /api/notifications/:id/read` — Marks single notification as read.
- `POST /api/notifications/read-all` — Marks all user notifications as read.

### AI Companion (`/api/ai`)
- `POST /api/ai/chat` — Processes user prompt, executes context tools, and returns response with controlled action buttons.
- `GET /api/ai/history/:email` — Retrieves user conversation history.

---

## 🤖 AI Tool Calling & Navigation Actions

The AI Assistant evaluates conversation intent and returns structured action objects:

```json
{
  "response": "I understand you want to report a pothole. You can lodge a formal report with photo evidence.",
  "actions": [
    {
      "action": "REPORT_ISSUE",
      "label": "Report Issue Now",
      "path": "/dashboard/report"
    }
  ]
}
```

### Controlled Action Mappings
- `REPORT_ISSUE` → `/dashboard/report`
- `TRACK_COMPLAINT` → `/dashboard/track`
- `NEARBY_OFFICES` → `/dashboard/offices`
- `DIGI_LOCKER` → `/dashboard/locker`
- `GOVERNMENT_SCHEMES` → `/dashboard/schemes`
- `EMERGENCY_SERVICES` → `/dashboard/emergency`
- `PROFILE` → `/dashboard/profile`
- `SETTINGS` → `/dashboard/settings`

---

## 🚀 Installation & Quickstart Guide

### 1. Install Dependencies
Run the install command from the workspace root:
```bash
npm run install:all
```

### 2. Seed Mock Database
Populate schemes and default notification feeds:
```bash
cd backend
npm run seed
```

### 3. Run Development Servers
Start both backend (Express) and frontend (Vite) concurrently:
```bash
npm run dev
```

The application will be accessible at:
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

### 4. Admin Credentials Sandbox Bypass
For testing administrative functions, sign in with:
- **Admin Email**: `admin@smartbharat.gov.in`
- **Password**: `admin123` (or any valid password)

### 5. Production Build
To verify and compile the static bundle:
```bash
cd frontend
npm run build
```

---

*Smart Bharat AI — Built with excellence for Indian citizens.* 🇮🇳
