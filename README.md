# EcoTrack India — Smart Waste Management & AI Vision Platform

A production-grade, full-stack waste management and recycling platform built specifically for Indian municipal & residential waste workflows (aligned with Swachh Bharat Mission guidelines).

Powered by:
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Backend**: Node.js & Express (`server.ts`)
- **AI Computer Vision**: Google Gemini 3.8 Flash Vision via official `@google/genai` SDK
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) & Auth
- **Hardware Integration**: Live HTML5 Camera API (`navigator.mediaDevices.getUserMedia`) & Geolocation (`navigator.geolocation`)

---

## 🚀 Quick Start & Local Setup (Windows / VS Code / Linux / macOS)

### Prerequisites
- Node.js (v18 or v20+)
- npm (v9+)
- Free Supabase account ([supabase.com](https://supabase.com))
- Google AI Studio API Key ([aistudio.google.com](https://aistudio.google.com))

---

### Step 1: Install Dependencies
Open your terminal in VS Code (`Ctrl + ~`) in the project directory:
```bash
npm install
```

---

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` in VS Code and fill in your credentials:
```env
# AI Vision Analysis (Provided automatically in AI Studio Build)
GEMINI_API_KEY="your-gemini-api-key"

# Supabase Project Credentials
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-public-key"

# Optional Privileged Key (Backend server only, never exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=""
PORT=3000
```

> **Where to find Supabase keys:**
> 1. Log in to [database.new](https://database.new) or your Supabase Project.
> 2. Go to **Project Settings** > **API**.
> 3. Copy `Project URL` to `VITE_SUPABASE_URL`.
> 4. Copy `anon public` key to `VITE_SUPABASE_PUBLISHABLE_KEY`.

---

### Step 3: Run the Supabase Database Migration
1. Go to your **Supabase Dashboard** > **SQL Editor** (left sidebar).
2. Click **New Query**.
3. Open `supabase/migrations/001_ecotrack_schema.sql` from this project.
4. Copy and paste the entire SQL content into the Supabase SQL editor.
5. Click **Run** (or `Ctrl+Enter`).
6. All 6 tables (`profiles`, `resident_addresses`, `collector_attendance`, `pickups`, `waste_scans`, `notifications`), triggers, indexes, and RLS policies are created instantly.

---

### Step 4: Run the Application

#### Option A: Single Full-Stack Command (Express + Vite combined)
```bash
npm run dev
```
The Express server starts on `http://localhost:3000` with the Vite dev middleware and real AI classification API mounted!

#### Option B: Separate Terminals (Frontend & Backend)
**Terminal 1 (Backend Express API Server):**
```bash
npx tsx server.ts
```
**Terminal 2 (Frontend Vite Client):**
```bash
npx vite --port 5173
```

---

## 🤖 Real AI Vision Classification Details

- **Model Used**: `gemini-3.8-flash` via official `@google/genai` TypeScript SDK.
- **Endpoint**: `POST /api/scan/classify`
- **Supported Waste Categories**:
  1. `Plastic` (bottles, containers, bags, packaging)
  2. `Metal` (beverage cans, scrap metal, tins, foils)
  3. `Paper and cardboard` (cartons, newspapers, office paper)
  4. `Glass` (bottles, jars, glassware)
  5. `Organic/wet waste` (food scraps, peels, compostable green waste)
  6. `Electronic waste` (batteries, cables, circuit boards, electronics)
  7. `General/mixed waste` (multilaminate wrappers, composite trash)
  8. `Unknown or uncertain` (returned when the item is unclear, obstructed, or low-light)
- **Special Detection Handling**:
  - **Human Detected**: If a human face or person is photographed instead of waste, the API identifies it, sets label to `"Human detected"`, flags `isUncertain: true`, and prompts to point the camera at garbage.
  - **No Garbage Detected**: If an empty scene, background, animal, or non-waste area is photographed, the API sets label to `"No garbage detected"`, flags `isUncertain: true`, and asks for a clear photo of waste.
- **Zero Fabrication**: Real computer vision analysis parses visual features, returning genuine confidence scores, specific sub-labels, and Swachh Bharat disposal guidance (Blue/Green/Red bins).

---

## ⚡ Production Deployment on Vercel

EcoTrack India includes first-class support for Vercel Serverless Functions and SPA routing.

### Required Environment Variables on Vercel:
Go to your **Vercel Project Dashboard** > **Settings** > **Environment Variables** and add:

| Environment Variable | Description | Where to get it |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Required** for AI computer vision classification | [Google AI Studio](https://aistudio.google.com/apikey) |
| `VITE_SUPABASE_URL` | **Required** for Supabase DB & Auth | Supabase Dashboard > Project Settings > API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Required** Supabase anon public key | Supabase Dashboard > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | *Optional* privileged server-side key | Supabase Dashboard > Project Settings > API |

> **IMPORTANT:**
> - `GEMINI_API_KEY` is a server-side secret and is only accessed by the serverless function `/api/scan/classify.ts`. It is **never** bundled or exposed to client browsers.
> - Client environment variables must be prefixed with `VITE_` (e.g., `VITE_SUPABASE_URL`).

### Vercel Deployment Steps:
1. Push this repository to GitHub/GitLab.
2. In Vercel, click **"Add New Project"** and import the repository.
3. Keep the default settings:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Expand **Environment Variables** and add:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Click **Deploy**.
6. The serverless API functions located in `/api/scan/classify.ts` and `/api/health.ts` and `vercel.json` rewrites will route all requests cleanly without 404 HTML errors.

---

## 🛡️ User Roles & Security

| Role | Capabilities |
| :--- | :--- |
| **Resident** | Request pickups, view collection history, view assigned collector, update address & house ID, receive status notifications. |
| **Collector** | Check-in/check-out attendance with GPS, launch live camera scanner, capture waste photo, run AI vision analysis, verify/override classification, log pickup with coordinates. |
| **Admin** | View all pickups, inspect AI classification results & uncertainty flags, view GPS map of pickups and collectors, monitor collector attendance, manage user roles. |

---

## 📂 Project Structure
```
├── api/                            # Vercel Serverless Functions
│   ├── scan/
│   │   └── classify.ts             # Serverless waste classification API (Gemini Vision)
│   └── health.ts                   # Serverless health & env validation endpoint
├── server.ts                       # Express full-stack backend (Google AI Studio & Local Node)
├── vercel.json                     # Vercel routing configuration & API rewrites
├── src/
│   ├── components/                 # Reusable UI components
│   │   ├── Navigation.tsx          # Top navbar & role switcher
│   │   ├── CameraScanner.tsx       # Live camera stream, capture, AI classify & verify
│   │   ├── SupabaseSetupModal.tsx  # Interactive helper for Supabase keys & migration
│   │   ├── MapView.tsx             # Interactive pickup and collector map
│   │   └── AuthModal.tsx           # Authentication modal & role switching
│   ├── dashboards/
│   │   ├── ResidentDashboard.tsx   # Pickup requests, address manager, history
│   │   ├── CollectorDashboard.tsx  # Attendance check-in, camera scanner, active pickups
│   │   └── AdminDashboard.tsx      # Analytics, audits, scan inspections, user management
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client & fallback persistence engine
│   │   └── types.ts                # TypeScript interfaces for database & AI models
│   ├── App.tsx                     # Main layout and role-based navigation
│   └── main.tsx                    # React DOM entry point
├── supabase/
│   └── migrations/
│       └── 001_ecotrack_schema.sql # Complete PostgreSQL schema, tables, & RLS policies
├── .env.example                    # Environment variables documentation
└── package.json                    # Project metadata & scripts
```
