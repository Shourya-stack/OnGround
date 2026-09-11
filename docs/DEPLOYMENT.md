# OnGround IPIS — Cloud & Local Deployment Guide

This guide covers deploying OnGround for the **Smart India Hackathon 2026** (Problem Statement 26122: Infrastructure Data Capture & Schedule-Linking).

---

## 1. Architecture & Hosting Topology

```
┌─────────────────────────┐          ┌──────────────────────────┐
│   Frontend (React/Vite) │ ───────> │  Backend (FastAPI Monolith)
│   Hosted on Vercel      │ <─────── │  Hosted on Render / Docker
└────────────┬────────────┘          └─────────────┬────────────┘
             │                                     │
             └──────────────────┬──────────────────┘
                                │
                     ┌──────────▼──────────┐
                     │  Supabase Cloud     │
                     │  • Auth & RLS       │
                     │  • PostgreSQL DB    │
                     │  • Storage (reports)│
                     │  • Realtime Engine  │
                     └─────────────────────┘
```

---

## 2. Supabase Setup (Database & Storage)

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com) and create a new project (e.g., `onground-ipis`).
2. **Execute Schema SQL:**
   - In Supabase SQL Editor, paste and run the contents of [`backend/db/schema.sql`](file:///c:/Users/SHOURYA/OneDrive/Desktop/SIH26122/backend/db/schema.sql).
3. **Storage Bucket:**
   - Go to **Storage** $\rightarrow$ Create a private bucket named `reports`.
4. **Enable Realtime:**
   - Go to **Database** $\rightarrow$ **Replication** $\rightarrow$ Enable replication on tables:
     - `schedule_matches`
     - `extractions`
     - `extracted_activities`
     - `audit_trail`
     - `unmatched_activities`
5. **Seed Baseline Schedule:**
   - Run `python scripts/seed_database.py` with `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` configured.

---

## 3. Backend Deployment (Render / Railway / Docker)

### Option A: Render Blueprint (Recommended Free-Tier)
1. Link your GitHub repository in [render.com](https://render.com).
2. Create a new **Web Service** from Blueprint using `render.yaml`.
3. Set environment variables:
   - `SUPABASE_URL`: Your Supabase Project URL (`https://xyz.supabase.co`)
   - `SUPABASE_SERVICE_KEY`: Your Supabase service_role key
   - `OPENROUTER_API_KEY`: Your OpenRouter API key
   - `LLM_MODEL`: `meta-llama/llama-3.3-70b-instruct:free`
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g., `https://onground.vercel.app`)

### Option B: Docker Container
* Build and run the container:
  ```bash
  docker build -t onground-backend .
  docker run -p 8000:8000 --env-file backend/.env onground-backend
  ```

---

## 4. Frontend Deployment (Vercel)

1. Import your GitHub repository into [vercel.com](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Configure Environment Variables in Vercel Dashboard:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase `anon` public key
   - `VITE_API_BASE_URL`: Your deployed Render backend URL (e.g., `https://onground-backend.onrender.com`)
4. Deploy! Vercel will automatically build the React SPA using `vercel.json` rewrite rules.

---

## 5. Local Fallback Mode (Zero-Cloud Resilience)

If internet connectivity fails at the hackathon venue:
1. **Backend:**
   ```bash
   cd backend
   uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```
2. **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:5173`. OnGround automatically activates offline fallback extraction and mock datasets with zero external dependencies.
