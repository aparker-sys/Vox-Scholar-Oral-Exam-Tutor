# GoDaddy: Redirect oralexamtutor.com → https://www.oralexamtutor.com

Do these steps **in your GoDaddy account** (you must be logged in at godaddy.com). No one else can do this for you.

---

## Step 1: Open your domain in GoDaddy

1. Go to **https://www.godaddy.com** and sign in.
2. Click your **profile/account** (top right) → **My Products** (or **Domain Portfolio**).
3. Find **oralexamtutor.com** and click it (or click **DNS** / **Manage** next to it).

---

## Step 2: Set up domain forwarding (redirect)

1. On the domain’s management page, look for **Forwarding** or **Domain Forwarding** (sometimes under “Additional Settings” or a **Forwarding** tab).
2. Click **Add** or **Set up forwarding** / **Manage**.
3. Configure:
   - **Forward to:** `https://www.oralexamtutor.com`
   - **Forward type:** **Permanent (301)** (recommended).
   - **Settings:** Usually “Forward only” (don’t show the URL in the address bar) or “Forward with masking” — either is fine; **Forward only** is simpler.
4. **Save** or **Add**.

After this, anyone who goes to **oralexamtutor.com** will be redirected to **https://www.oralexamtutor.com**.

---

## Step 3: Make sure www points to Railway (DNS)

If **www.oralexamtutor.com** still shows “Launching Soon,” then **www** is not pointing to Railway yet. You need to fix DNS first:

1. In GoDaddy, go to **DNS** (or **Manage DNS**) for **oralexamtutor.com**.
2. Under **Records**, find the row where **Name** is **www** and **Type** is **CNAME**.
   - If it points to something like GoDaddy parking or “value from GoDaddy,” **edit** it.
   - Set the CNAME **Value** to the hostname Railway gave you (e.g. `umvlf0ja.up.railway.app` or whatever your Railway custom domain shows). Get this from **Railway → your service → Settings → Domains**.
3. Remove any other **www** A or CNAME records that point to GoDaddy or “parking.”
4. **Save** DNS.

Wait **10–30 minutes** (sometimes up to an hour), then open **https://www.oralexamtutor.com** in a new incognito window. You should see the Vox Scholar app, not “Launching Soon.”

---

## Summary

| Goal | Where in GoDaddy | Action |
|------|------------------|--------|
| Redirect root to www | **Forwarding** (domain management) | Add: oralexamtutor.com → https://www.oralexamtutor.com (301) |
| Make www show your app | **DNS** | Set **www** CNAME to your Railway hostname (e.g. `xxx.up.railway.app`) |

If you can’t find **Forwarding**, search GoDaddy’s help for “forward domain” or “redirect domain” and use the steps for your product (domain-only vs website/hosting).
