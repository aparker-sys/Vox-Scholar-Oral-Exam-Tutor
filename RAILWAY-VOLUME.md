# Make the database persist on Railway (do this once)

Your app is already set up to use a persistent database when you add a volume and one variable in Railway. Do these steps in the Railway dashboard.

---

## Step 1: Add the variable

1. In Railway, open your project and click your **service** (the “Vox-Scholar-Oral-Exam…” card).
2. Go to the **Variables** tab.
3. Click **+ New variable** (or **Add variable**).
4. Set:
   - **Variable:** `DB_PATH`
   - **Value:** `/data/voxscholar.db`
5. Save (Railway usually saves automatically).

---

## Step 2: Add the volume

Railway doesn’t have a “Volumes” tab. Use one of these:

**Option A — Command palette (easiest)**  
1. Make sure you’re in your **project** (you see the Architecture view with your service card).  
2. Press **⌘K** (Mac) or **Ctrl+K** (Windows) to open the command palette.  
3. Type **volume** and choose the option to create/add a volume.  
4. When asked, select your **service** (Vox-Scholar-Oral-Exam…).  
5. Set **Mount path** to: `/data`  
6. Create/save the volume.

**Option B — Right‑click**  
1. In the Architecture view, **right‑click** your **service card** (Vox-Scholar-Oral-Exam…).  
2. In the menu, choose **Attach Volume** or **Create volume** (wording may vary).  
3. Set **Mount path** to: `/data`  
4. Create/save the volume.

---

## Step 3: Redeploy

1. Go to the **Deployments** tab.
2. Click the **⋮** (three dots) on the latest deployment → **Redeploy** (or push any new commit to GitHub so Railway redeploys).

After this, the SQLite database will live on the volume and will **persist** across future deploys.
