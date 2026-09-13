# 🚀 24/7 Cloud Deployment Guide — Bhasa-Daksh

This guide walks you through deploying **Project Bhasa-Daksh** to the cloud so reviewers can access the app 24/7 without needing your laptop to remain online.

- **GitHub Repository**: [https://github.com/batshamit/Project-Bhasa-Daksh](https://github.com/batshamit/Project-Bhasa-Daksh)

---

## 1. Deploy Backend (FastAPI + SQLite 24/7) on Render

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository: `batshamit/Project-Bhasa-Daksh`.
3. Configure the following service settings:
   - **Name**: `bhasa-daksh-api`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Click **Create Web Service**.
5. Once deployed, copy your live API URL (e.g., `https://bhasa-daksh-api.onrender.com`).

---

## 2. Deploy Frontend (Next.js 24/7) on Cloudflare Pages or Vercel

### Option A: Vercel (Recommended 1-Click Setup)
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Import repository `batshamit/Project-Bhasa-Daksh`.
3. Select **Root Directory**: `frontend`.
4. Framework Preset: **Next.js**.
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` = `https://bhasa-daksh-api.onrender.com/api` (replace with your Render backend URL).
6. Click **Deploy**.

---

### Option B: Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Workers & Pages** -> **Create Application** -> **Pages** -> **Connect to Git**.
2. Select repository `batshamit/Project-Bhasa-Daksh`.
3. Configure build settings:
   - **Framework preset**: `Next.js`
   - **Root directory**: `frontend`
   - **Build command**: `npx @cloudflare/next-on-pages@1` (or `npm run build`)
   - **Environment variable**: `NEXT_PUBLIC_API_URL` = `https://bhasa-daksh-api.onrender.com/api`
4. Click **Save and Deploy**.

---

## 3. Verification

Once deployed:
1. Open your live frontend URL (e.g. `https://project-bhasa-daksh.vercel.app` or `https://bhasa-daksh.pages.dev`).
2. Log in using demo accounts:
   - **Admin Demo**: `username: admin`, `password: admin123`
   - **Student Demo**: `username: student1`, `password: pass123`
3. Verify course language selection, PLS phase translation, evaluations, and admin management tabs!
