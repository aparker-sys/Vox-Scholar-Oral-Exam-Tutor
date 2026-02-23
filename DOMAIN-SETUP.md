# Connect oralexamtutor.com (Fix "Launching Soon" Page)

If you see a **"Launching Soon"** page when you visit oralexamtutor.com, the domain is still pointing at your **registrar’s placeholder** (the company where you bought the domain). The URL is correct; the domain just isn’t pointed at your live app yet.

Follow these steps to show your real app at oralexamtutor.com.

---

## 1. Your app must be live first

- Your Oral Exam Tutor app must already be **deployed** (e.g. on **Railway**) and working at a URL like:
  - `https://your-app-name.up.railway.app`
- If you haven’t deployed yet, follow **DEPLOY.md** (“Step-by-step: Push to production”) first. Then come back here.

---

## 2. Add the custom domain in Railway

1. Go to [railway.app](https://railway.app) and open your project.
2. Open the **service** that runs your app.
3. Go to **Settings** → **Networking** (or **Domains**).
4. Under **Custom domain**, click **Add custom domain** (or similar).
5. Add both:
   - `oralexamtutor.com`
   - `www.oralexamtutor.com`
6. Railway will show the **DNS records** you need (e.g. a **CNAME** for `www` and an **A** or **CNAME** for the root). **Keep this page open** — you’ll need these values in the next step.

---

## 3. Point the domain at Railway (at your registrar)

Where you **bought** oralexamtutor.com (GoDaddy, Namecheap, Google Domains, Cloudflare, etc.):

1. Log in to that site and open **DNS** or **DNS Management** for **oralexamtutor.com**.
2. **Remove** any default “parking,” “coming soon,” or “forwarding” records that might be there.
3. **Add** the records Railway gave you. Typically:
   - **www** → **CNAME** → `your-app-name.up.railway.app` (use the exact hostname Railway shows).
   - **@** (root/apex) → use the **exact** record Railway shows (often an **A** record to an IP, or a CNAME to a Railway hostname).
4. **Save** your DNS changes.

DNS can take **5–30 minutes** (sometimes up to 24–48 hours) to update.

---

## 4. Check that it works

- After DNS has updated, open:
  - `https://www.oralexamtutor.com`
  - `https://oralexamtutor.com`
- You should see your **Oral Exam Tutor app**, not “Launching Soon.”
- Railway will usually provision **HTTPS** automatically once DNS is correct.

---

## If it still shows "Launching Soon"

- Confirm the app works at the **Railway URL** (e.g. `https://your-app-name.up.railway.app`).
- In your registrar’s DNS, make sure there are **no** leftover “parking” or “coming soon” A/CNAME records, and that the records **exactly** match what Railway shows.
- Wait a bit longer (up to 24–48 hours), then try again in an **incognito/private** window or another device.

---

## Summary

| Step | Where | What to do |
|------|--------|------------|
| 1 | Your code / DEPLOY.md | Deploy app to Railway and get the `.up.railway.app` URL |
| 2 | Railway dashboard | Add custom domains `oralexamtutor.com` and `www.oralexamtutor.com`, copy the DNS records |
| 3 | Domain registrar (GoDaddy, etc.) | Remove parking/coming-soon records; add the DNS records from Railway |
| 4 | Browser | Wait for DNS, then visit oralexamtutor.com — you should see your app |

The “Launching Soon” page is controlled by your **domain registrar**, not by your code. Once DNS points to Railway, visitors will see your real app.
