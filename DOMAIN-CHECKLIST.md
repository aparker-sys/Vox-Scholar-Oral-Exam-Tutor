# Domain checklist – get www.oralexamtutor.com working

## What’s going on

- **Railway** is serving your app and you added **www.oralexamtutor.com** as a custom domain.
- **GoDaddy** holds the DNS for oralexamtutor.com. For the domain to “work,” GoDaddy’s DNS must point **www** to Railway.

The app code is already fine for the custom domain. The only things that can block it are DNS or how you open the site.

---

## 1. Check GoDaddy DNS (exact values)

In GoDaddy → **Domain** → **oralexamtutor.com** → **DNS** (or **Manage DNS**):

| Type  | Name                | Value                          | TTL   |
|-------|---------------------|---------------------------------|-------|
| CNAME | `www`               | `umvlf0ja.up.railway.app`       | 1 hr  |
| TXT   | `_railway-verify.www` | (value from Railway)          | ½ hr  |

- Use the **number 0** in `umvlf0ja`, not the letter O.
- No trailing dot in the CNAME value in GoDaddy is fine (they often add it).
- Remove any other **www** CNAME or A records, and any “parking” / “forwarding” that might override www.

---

## 2. Open the right URL

Use:

**https://www.oralexamtutor.com**

- Use **https** (not http).
- Use **www** (you only have the custom domain for www on Railway right now).

---

## 3. Root domain (oralexamtutor.com without www)

You can’t add a second custom domain on Railway on your current plan. So:

- In GoDaddy use **Forwarding** (or “Redirect”):  
  **oralexamtutor.com** → **https://www.oralexamtutor.com**  
  Then people who type `oralexamtutor.com` will be sent to the working site.

---

## 4. If it still doesn’t work

- Wait 15–30 minutes after changing DNS, then try again (or try in an **incognito** window).
- Confirm the app loads at:  
  **https://vox-scholar-oral-exam-tutor-production.up.railway.app**
- In Railway, open the custom domain **www.oralexamtutor.com** and check that the CNAME and TXT still show as verified (green checkmarks).

Once DNS is correct and you use **https://www.oralexamtutor.com**, the domain will show your app.
