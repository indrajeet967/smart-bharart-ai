# 🇮🇳 Smart Bharat AI — Intelligent Digital Citizen-Assistance Platform

> **Citizen-service companion prototype**
> *React 18, Vite, Express, MongoDB (with a local JSON development fallback), JWT authentication, optional Gemini assistance, and OpenStreetMap-based nearby search.*

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

**Smart Bharat AI** helps citizens discover government-service information, prepare civic complaints, and search nearby facilities. It does not submit grievances to government portals and is not an official DigiLocker integration. Catalog content may be incomplete or outdated; users must confirm current requirements with the linked authority.

### Key Capabilities
- 💬 **AI Assistant**: Optional Gemini responses with local catalog lookup and official-source links. Answers and catalog details require confirmation on the source portal.
- 🛣️ **Issue preparation and internal tracking**: The wizard can save a complaint to the Smart Bharat backend. That record is not a government grievance. Evidence upload requires configured private Cloudinary storage.
- 📊 **Complaint Tracker**: Authenticated internal records are distinguished from external reference numbers supplied by the user; external government status is not retrieved automatically.
- 🔒 **Private Smart Bharat document vault**: Authenticated uploads require Cloudinary credentials. This is separate from the official [DigiLocker](https://www.digilocker.gov.in/) service; documents are not authenticity-verified.
- 📍 **Nearby facilities**: Search uses OpenStreetMap Overpass and Photon services with the selected location. Facility completeness and data freshness depend on those sources; opening status is not inferred.
- 📜 **Scheme discovery**: A searchable catalog and rule-based potential-match comparison. Catalog completeness and eligibility are not guaranteed.
- 🏆 **Civic points**: Backend-defined points are attached to internal complaint actions; they are application rewards, not government benefits.
- 🛡️ **Admin Dashboard**: Comprehensive auditing control panel for managing complaints, assigning departments, updating status workflows, publishing targeted broadcast notices, and inspecting SLA analytics.

---

## 📂 Monorepo Folder Architecture

```
d:/antigravity/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB Mongoose & Local JSON fallback adapter
│   │   └── cloudinary.js      # Private Cloudinary file storage helpers
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
│   │   ├── documents.js       # Private Smart Bharat vault and legal simplifier
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
│   │   │   ├── DocumentAssistant.jsx # Smart Bharat vault and shared document catalog
│   │   │   ├── Emergency.jsx         # Direct dial emergency contacts
│   │   │   ├── Landing.jsx           # Public landing showcase page
│   │   │   ├── Login.jsx             # Sign-in and development-gated sign-up
│   │   │   ├── NearbyOffices.jsx     # OpenStreetMap facility search
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
| **AI Integration** | Optional Google Gemini API (`@google/generative-ai`) with local catalog context |
| **Maps & Location** | OpenStreetMap Overpass + Photon geocoding + browser Geolocation API |
| **Document Processing** | Private file storage (Cloudinary when configured) + optional Gemini legal-text simplification |

---

## ⚙️ Environment Setup (.env)

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart_bharat
JWT_SECRET=replace_with_a_long_random_secret
ENABLE_DEMO_OTP=false
CORS_ORIGINS=http://localhost:3000
GEMINI_API_KEY=your_google_gemini_api_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=
```

---

## 🔌 API REST Contracts

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Creates an unverified account when production email delivery is configured, or in development when demo OTP is explicitly enabled; no token is issued until verification.
- `POST /api/auth/login` — Authenticates email and password, returning JWT token.
- `POST /api/auth/send-otp` — Sends an email verification code through Resend, or returns a code only in explicitly enabled non-production demo mode.
- `POST /api/auth/verify-otp` — Verifies the email code and issues a JWT session.
- `GET /api/auth/me` — Returns logged-in user profile (`Authorization: Bearer <token>`).
- `POST /api/auth/update` — Updates state, interests, and profile details.

### Complaints (`/api/complaints`)
- `POST /api/complaints/report` — Creates an internal Smart Bharat record and reference; it does not file a government grievance.
- `GET /api/complaints/track/:id` — Fetches single complaint details & timeline.
- `GET /api/complaints/user/:email` — Fetches user's own complaints (isolated ownership).
- `GET /api/complaints/admin/all` — Admin fetch all complaints (`adminOnly`).
- `POST /api/complaints/admin/update/:id` — Admin updates status, department, and awards points on `Resolved`.

### DigiLocker (`/api/documents`)
- `POST /api/documents/upload` — Stores a private Smart Bharat vault document when Cloudinary is configured; no OCR or authenticity verification is performed.
- `GET /api/documents/user/:email` — Fetches user's locker files (`ownership checked`).
- `DELETE /api/documents/:id` — Deletes document from locker (`ownership checked`).
- `POST /api/documents/simplify` — Simplifies legal circulars into plain language.

### Government Schemes (`/api/schemes`)
- `POST /api/schemes/recommend` — Returns potential matches only for entries explicitly marked with verified eligibility rules; no current entries are certified by this project.

### Notifications (`/api/notifications`)
- `GET /api/notifications/:email` — Retrieves personalized notification feed based on user state/interests.
- `PATCH /api/notifications/:id/read` — Marks single notification as read.
- `POST /api/notifications/read-all` — Marks all user notifications as read.

### AI Companion (`/api/ai`)
- `POST /api/ai/chat` — Authenticated Gemini chat using caller-provided catalog context; returns an explicit error when the AI service is unavailable.

---

## 🤖 AI Assistant

The assistant uses the local catalog for matching document and scheme questions and may call Gemini when `GEMINI_API_KEY` is configured. It does not submit forms or perform government transactions. Links and catalog information must be confirmed with the responsible official authority.

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

### 4. Production Build
To verify and compile the static bundle:
```bash
cd frontend
npm run build
```

## Configuration and deployment limitations

- Copy `backend/.env.example` to `backend/.env`. Set a unique random `JWT_SECRET`, `MONGODB_URI`, and the allowed frontend origins in `CORS_ORIGINS`.
- Gemini responses require `GEMINI_API_KEY`. Private document and complaint-evidence uploads require Cloudinary credentials. Without them, uploads fail explicitly; files are not written to a public local directory.
- Production email verification sends codes through Resend when `RESEND_API_KEY` and `EMAIL_FROM` are configured. Development-only demo OTP is available only when `ENABLE_DEMO_OTP=true`; never enable it in production.
- The frontend can be deployed to GitHub Pages, but the backend must be hosted separately. Set `VITE_API_BASE_URL` to the backend origin when building the frontend and allow the GitHub Pages origin in backend `CORS_ORIGINS`. Never put backend secrets in `VITE_` variables.
- `render.yaml` provides a Render web-service blueprint. Provision MongoDB Atlas and configure `MONGODB_URI`, `RESEND_API_KEY`, and `EMAIL_FROM` in Render; use a sender address verified with Resend. The blueprint generates `JWT_SECRET`.
- After Render deploys, add the API origin as the GitHub repository Actions variable `VITE_API_BASE_URL` (Settings → Secrets and variables → Actions → Variables), then rerun the `Deploy Smart Bharat AI to GitHub Pages` workflow. Existing user accounts are not migrated from local JSON; create a new account through the email verification flow after setup.
- Setup sequence: create a MongoDB Atlas database and allow the Render service's outbound IPs; in Render, create a Blueprint from this repository and provide the MongoDB URI plus Resend API key and verified sender; wait for `/api/health` to report `MongoDB Connected`; add the resulting `https://...onrender.com` service origin as the GitHub Actions variable and rerun the Pages workflow.
- Nearby search uses public Photon and Overpass services. It needs no Google Maps key, but depends on those services' availability, data coverage, rate limits, and terms.
- The JSON fallback database is for local development only and is not durable or suitable for production. Use a configured MongoDB deployment for persistent user records.
- The scheme/document catalog has no live verification feed or trustworthy per-entry verification date. Confirm current eligibility, fees, dates, and submission requirements with the linked official authority. Emergency guidance displays 112; additional service-specific numbers are withheld until their current official coverage is verified.
- No admin sandbox credentials or password bypass are provided. Admin access must be assigned through a trusted, operator-controlled provisioning process.

---

*Smart Bharat AI — Built with excellence for Indian citizens.* 🇮🇳
