# How to Put Vox Scholar Online (Production)

## What this app is

- **Stack:** Static site — HTML, CSS, and JavaScript only. No server or database on the internet.
- **Data:** Everything is stored in the user’s browser (localStorage + IndexedDB). No backend to deploy.
- **Host:** One platform is enough. Use **Netlify** — it’s built for this and is easy to set up.

---

## Step 1: Put your code on GitHub

1. Go to [github.com](https://github.com) and sign in (or create an account).
2. Click the **+** (top right) → **New repository**.
3. Name it something like `vox-scholar` (or `oral-exam-tutor`).
4. Leave “Add a README” unchecked. Click **Create repository**.
5. On your computer, open **Terminal** (Mac) or **Command Prompt** (Windows).
6. Go to your project folder:
   ```bash
   cd /Users/anneliseclaireparker/oral-exam-tutor
   ```
7. If you haven’t already, add GitHub as “origin” and push (replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```
   If it asks for a password, use a **Personal Access Token** from GitHub (Settings → Developer settings → Personal access tokens) instead of your normal password.

Your code is now on GitHub.

---

## Step 2: Deploy on Netlify

1. Go to [netlify.com](https://www.netlify.com) and sign up (or log in). Use **Sign up with GitHub** so Netlify can see your repos.
2. Click **Add new site** → **Import an existing project**.
3. Choose **GitHub**. If asked, authorize Netlify to access your GitHub account.
4. Pick the repository you just pushed (e.g. `vox-scholar` or `oral-exam-tutor`).
5. **Build settings** (Netlify will guess; set these to be sure):
   - **Branch to deploy:** `main`
   - **Build command:** leave **empty**
   - **Publish directory:** `.` (a single dot = project root)
6. Click **Deploy site**.

Wait a minute or two. When it’s done, Netlify will show a link like:

`https://something-random-123.netlify.app`

That’s your live site. Open it in a browser to test.

---

## Step 3: Use a paid plan (optional but recommended)

1. In Netlify: **Site configuration** (or **Site settings**) → **Billing**.
2. Choose a paid plan (e.g. **Pro**). Your school can pay; you’ll get more bandwidth and support.
3. You can add your GoDaddy domain later from **Domain management** → **Add custom domain** (we’re not doing that in this guide).

---

## Updating the site later

Whenever you change the code and want the live site to update:

1. Save your files, then in Terminal (in your project folder):
   ```bash
   git add -A
   git commit -m "Update app"
   git push
   ```
2. Netlify will automatically rebuild and update the site in about a minute.

---

## Summary

| What              | Answer                    |
|-------------------|---------------------------|
| Stack             | Static (HTML/CSS/JS only) |
| Backend           | None (browser storage)    |
| Easiest host      | Netlify                   |
| Deploy how        | Connect GitHub → Deploy   |
| Custom domain     | Add later in Netlify      |

You only need to push to production; connecting your GoDaddy domain can be done later in Netlify’s **Domain management**.
