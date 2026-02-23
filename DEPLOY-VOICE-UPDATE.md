# Getting the voice listening update live on oralexamtutor.com

If you still see **"Your notes / outline (optional)"** and **"Jot key points as you speak..."** on the Answer screen, the live site is serving an **old version** of the app. The new version shows **"Charlotte is listening…"** and a mic indicator instead.

## What to do

### 1. Commit and push your latest code

Make sure all recent changes (listening indicator, speech recognition, cache-busting) are committed and pushed to the branch your host deploys from (e.g. `main`):

```bash
git add -A
git status   # confirm index.html, app.js, styles.css, client/src/ are included
git commit -m "Voice listening: Answer screen listens and shows indicator; cache-bust assets"
git push origin main
```

### 2. Redeploy so the server uses the new files

- **Railway / Render / Heroku:** Push usually triggers a new deploy. In the dashboard, confirm the latest deploy finished and used the commit above.
- **Manual (VPS / your server):** Pull the latest code, then either:
  - **If you use the React app:** run `npm run build` so `client/dist` is updated, then restart the server (`npm start` or `node server.js`).
  - **If you use the legacy app only:** ensure the server serves the repo root (so it uses the updated `index.html`, `app.js`, `styles.css`), then restart the server.

### 3. How this app decides what to serve

- If the folder **`client/dist`** exists when the server starts, it serves the **React** app (built from `client/`). Rebuilding with `npm run build` updates that.
- If **`client/dist`** does not exist, it serves the **legacy** app (root `index.html`, `app.js`, `styles.css`). Pushing the latest repo updates those files.

So: **rebuild and redeploy** if you use the React app; **redeploy** (with the latest code) if you use only the legacy app.

### 4. After deploy: hard refresh

Once the new version is deployed, do a **hard refresh** so the browser doesn’t use cached JS/CSS:

- **Mac:** `Cmd + Shift + R` (Chrome/Safari) or `Cmd + Option + R` (Safari).
- **Windows:** `Ctrl + Shift + R` or `Ctrl + F5`.

Cache-busting query strings (`?v=2`) were added to the legacy app’s script/style links so updated deploys load new assets.

---

After this, the Answer screen should show **"Charlotte is listening…"** and the pulsing mic when you’ve clicked **Start answering** on the previous screen, and the app will record your answer and show it on **Session complete** under **"What you said"**.
