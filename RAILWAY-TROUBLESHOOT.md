# Railway: site not loading

## 1. Check runtime logs

In Railway: **Deployments** → your active deployment → **View logs**.

Look for:

- **`Vox Scholar server at http://localhost:XXXX`** – server started.
- **`client/dist exists: true`** – React app will be served. If **`false`**, the app will fall back to the legacy HTML; if the path is wrong, we need to fix the build.
- **`Database init failed:`** – DB isn’t available; app should still serve pages, but some API will return 503.
- Any **red errors** or stack traces – note them for debugging.

## 2. Check health endpoint

In your browser, open:

**https://www.oralexamtutor.com/api/health**

- If you see **`{"ok":true}`** – the server is running and reachable. The problem is likely with the main page or static files.
- If it doesn’t load or you get an error – the service may not be running, the domain may not be pointing to Railway, or the health check is failing.

## 3. Ensure the build runs (so `client/dist` exists)

If logs show **`client/dist exists: false`**, the React app wasn’t built before start.

In Railway **Settings** (or your service settings), set:

- **Build command:** `npm run build`
- **Start command:** `npm start` (or leave default)

Redeploy so the build runs; then check logs again for **`client/dist exists: true`**.

## 4. Try in a private/incognito window

Try **https://www.oralexamtutor.com** in a new private/incognito window to rule out cache or extensions.
