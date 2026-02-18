# How to Push Vox Scholar to Production

## What stack this is

- **Backend:** Node.js with Express (runs in one process)
- **Database:** SQLite (a single file, no separate database server)
- **Frontend:** Plain HTML, CSS, and JavaScript — served by the same Node app
- **Summary:** One Node.js app that serves both the website and the API. No separate frontend or backend hosts.

---

## Easiest host for this stack

**Railway** is the standard, easy option for a Node.js app like this. You put your code on GitHub, connect Railway to the repo, and it builds and runs your app. Frontend and backend stay on one platform. They have a paid tier (your school can pay).

---

## Step-by-step: Push to production (no domain yet)

You’ll do three things: (1) put your code on GitHub, (2) sign up at Railway and connect the repo, (3) deploy. Connecting your GoDaddy domain comes later.

---

### Step 1: Put your code on GitHub

1. Go to [github.com](https://github.com) and sign in (or create an account).
2. Click the **+** (top right) → **New repository**.
3. Name it (e.g. `vox-scholar` or `oral-exam-tutor`). Leave “Add a README” **unchecked**. Click **Create repository**.
4. On your Mac, open **Terminal**.
5. Go to your project folder:
   ```bash
   cd /Users/anneliseclaireparker/oral-exam-tutor
   ```
6. If this repo doesn’t have a GitHub remote yet, add it (use your real GitHub username and repo name):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   ```
7. Push your code:
   ```bash
   git add -A
   git commit -m "Prepare for deployment"   # only if you have uncommitted changes
   git push -u origin main
   ```
   If it asks for a password, use a **Personal Access Token** from GitHub (Settings → Developer settings → Personal access tokens), not your normal password.

Your code is now on GitHub.

---

### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign up (or log in). Use **Sign in with GitHub** so Railway can see your repos.
2. Click **New Project**.
3. Choose **Deploy from GitHub repo**. If asked, authorize Railway to access your GitHub account.
4. Select the repository you just pushed (e.g. `oral-exam-tutor` or `vox-scholar`).
5. Railway will detect it’s a Node.js app. It will use:
   - **Build:** install dependencies (e.g. `npm install`)
   - **Start:** `npm start` (which runs `node server.js`)
   You usually don’t need to change anything. If you see a “Root Directory” or “Watch Paths”, leave them blank/default.
6. Click **Deploy** (or wait for the first automatic deploy to finish).

Wait one or two minutes. When the deploy is done, Railway will show a URL like:

`https://your-app-name.up.railway.app`

(You can change the name in **Settings** → **Networking** → **Public Networking** → **Generate domain** or **Custom domain**.)

7. Open that URL in your browser. You should see Vox Scholar. Try using the app (e.g. start a session, add a subject) to confirm the API and database work.

You’re in production. You can add your GoDaddy domain later in Railway’s **Settings** → **Networking** → **Custom domain**.

---

### Step 3 (recommended): Keep your database across deploys

Right now the SQLite file lives inside the app. On Railway, each new deploy can start from a clean filesystem, so the database could be reset. To keep data between deploys, use a **persistent volume** and point the app at it.

1. In your Railway project, open your **service** (the one that runs your app).
2. Go to the **Variables** tab and add:
   - **Variable:** `DB_PATH`  
   - **Value:** `/data/voxscholar.db`
3. Go to the **Volumes** tab (or **Settings** → **Volumes**). Click **Add Volume** (or **New Volume**).
   - **Mount path:** `/data`
   - Create the volume.
4. Redeploy the app (e.g. **Deploy** → **Redeploy** or push a new commit to GitHub).

After this, the database file will be stored on the volume and will survive redeploys.

---

## Updating the site later

When you change the code and want the live site to update:

1. In Terminal, in your project folder:
   ```bash
   cd /Users/anneliseclaireparker/oral-exam-tutor
   git add -A
   git commit -m "Describe your change"
   git push
   ```
2. Railway will automatically build and deploy. In a minute or two, the live URL will show the new version.

---

## Summary

| Question              | Answer                                              |
|-----------------------|-----------------------------------------------------|
| What stack?           | Node.js + Express + SQLite; one app, one host       |
| Easiest host?         | Railway (one platform for frontend + backend)       |
| How to deploy?        | Push code to GitHub → connect repo in Railway       |
| Custom domain?        | Add later in Railway (Settings → Custom domain)     |
| Keep DB across deploys? | Add a Volume at `/data` and set `DB_PATH=/data/voxscholar.db` |

You only need to push to production as above; connecting your GoDaddy domain can be done later in Railway’s domain settings.
