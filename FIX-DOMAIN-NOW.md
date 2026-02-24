# Fix oralexamtutor.com – Stop "Launching Soon," Show Your App

The **"Launching Soon"** page is **not** from your app. It’s a placeholder from wherever you bought the domain (e.g. GoDaddy). The domain is still pointing at that placeholder instead of your app on **Railway**. Fix it by pointing DNS at Railway.

---

## Step 1: Confirm your app works on Railway

1. Open **[railway.app](https://railway.app)** and open your Oral Exam Tutor project.
2. Get your app URL (e.g. `https://vox-scholar-oral-exam-tutor-production.up.railway.app` or `https://something.up.railway.app`).
3. Open that URL in your browser. You should see your **real app** (Vox Scholar), not "Launching Soon."

If you don’t see your app there, fix your Railway deployment first (see DEPLOY.md), then come back to this.

---

## Step 2: Add your domain in Railway

1. In Railway, open the **service** that runs your app.
2. Go to **Settings** → **Networking** (or **Domains**).
3. Click **Add custom domain** (or similar).
4. Add: **www.oralexamtutor.com**
5. If Railway allows a second domain, also add: **oralexamtutor.com**
6. Railway will show **DNS records** (e.g. CNAME for `www`, maybe A or CNAME for root). **Leave this tab open** – you need these in the next step.

---

## Step 3: Point your domain at Railway (at GoDaddy or your registrar)

Where you **bought** oralexamtutor.com (GoDaddy, Namecheap, Google Domains, Cloudflare, etc.):

### 3a. Open DNS

- Log in → find **oralexamtutor.com** → open **DNS** / **Manage DNS**.

### 3b. Remove the placeholder

- **Delete** any record that’s clearly for “parking,” “coming soon,” or “website builder” (especially A or CNAME for `@` or `www` that point to the registrar).
- That’s what’s causing the "Launching Soon" page.

### 3c. Add the records Railway gave you

- **www** → add a **CNAME** with **Value** = the hostname Railway shows (e.g. `umvlf0ja.up.railway.app` – use the **exact** value from Railway).
- If Railway gave you a **TXT** for verification (e.g. `_railway-verify.www`), add that too.
- For the **root** (oralexamtutor.com with no www): use **exactly** what Railway shows (often an **A** record to an IP, or a CNAME). If your plan only supports one custom domain, skip root for now and use forwarding (Step 4).

### 3d. Save DNS

- Wait **10–30 minutes** (sometimes up to an hour). DNS can take time to update.

---

## Step 4: Redirect root to www (optional but recommended)

So that **oralexamtutor.com** (no www) also works:

- In your registrar (e.g. GoDaddy), find **Forwarding** / **Domain Forwarding**.
- Add: **oralexamtutor.com** → **https://www.oralexamtutor.com** (301 permanent).

Then anyone who types `oralexamtutor.com` will be sent to your app at `https://www.oralexamtutor.com`.

---

## Step 5: Test

1. Wait at least 10–15 minutes after changing DNS.
2. Open **https://www.oralexamtutor.com** in a **new incognito/private** window.
3. You should see your **Vox Scholar app**, not "Launching Soon."
4. If you set up forwarding, try **https://oralexamtutor.com** – it should redirect to www and show your app.

---

## If it still shows "Launching Soon"

- **www.oralexamtutor.com** still shows it → the **www** CNAME (and TXT if required) at your registrar are wrong or not saved; or there’s still a parking/coming-soon record. Double-check against Railway’s instructions.
- **oralexamtutor.com** (no www) shows it → either add the root record Railway gave you, or set up **Forwarding** from root to `https://www.oralexamtutor.com`.
- Try again in **incognito** and wait up to **24–48 hours** for DNS in rare cases.

---

## Summary

| Step | Where | Action |
|------|--------|--------|
| 1 | Railway | Confirm app loads at your `.up.railway.app` URL |
| 2 | Railway | Add custom domain(s): www.oralexamtutor.com (and oralexamtutor.com if allowed), copy DNS records |
| 3 | Registrar (GoDaddy, etc.) | Remove parking/coming-soon records; add CNAME for www (and TXT/root if Railway says so) |
| 4 | Registrar | Optional: Forward oralexamtutor.com → https://www.oralexamtutor.com |
| 5 | Browser | Wait 10–30 min, then open https://www.oralexamtutor.com in incognito |

The "Launching Soon" page is controlled by your **domain registrar’s DNS**, not by your code. Once DNS points to Railway, visitors will see your real app.
