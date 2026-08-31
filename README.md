# Notebook

A real-time chat app with group rooms and direct messages, built for you and your people.

**Stack:** React (Vite) · Firebase Auth (Google/GitHub OAuth) · Firebase Realtime Database · Firebase Storage · Express (production server)

## Features

- Google + GitHub sign-in
- Group chat rooms (create your own) and 1:1 direct messages
- Typing indicators
- Online presence + read receipts ("Seen")
- Image/file uploads in messages
- Admin dashboard with user moderation, role management, room management, message moderation, search, and live statistics
- Firebase rules enforce admin actions server-side instead of trusting client-side environment variables

---

## 1. Firebase project setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. **Authentication** → Sign-in method → enable **Google** and **GitHub**.
   - For GitHub, you'll need a GitHub OAuth App (create one at github.com/settings/developers) and paste its Client ID/Secret into Firebase's GitHub provider settings. Use the callback URL Firebase gives you.
3. **Realtime Database** → Create database → start in **locked mode** → then paste the contents of `database.rules.json` (in this repo) into the Rules tab and publish.
4. **Storage** → Get started (used for file/image uploads). Default rules are fine for MVP but restrict to authenticated users:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
5. **Project settings** → Your apps → Add a **Web app** → copy the config values.

## 2. Environment variables

Copy `.env.example` to `.env` and fill in the values from step 1.5:

```bash
cp .env.example .env
```

`VITE_ADMIN_EMAILS` is no longer used for authorization. Admin privileges are stored in the Realtime Database and enforced by Firebase Rules so a browser cannot grant itself admin access.

### Grant the first admin

For the first administrator, sign in normally, then in **Firebase Console → Realtime Database → Data**, find that user's UID under `users` and set:

```json
"isAdmin": true
```

After that, the admin can grant/revoke admin access from the Admin Panel. Do not allow users to edit `isAdmin` or `banned` themselves; the included rules enforce this.

## 3. Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`. Open it in two browser profiles (or one normal + one incognito) to test DMs, typing indicators, presence, and moderation.

## 4. Production build

```bash
npm run build      # outputs to dist/
npm run server     # serves dist/ via Express on PORT (default 8080)
```

## 5. Deploying to a Cloud VM

These steps work the same on an AWS EC2, GCP Compute Engine, or Azure VM instance (Ubuntu).

1. **Provision a VM** with a public IP, open port 80 (or 443 if using TLS) and 22 (SSH).
2. **Install Node.js** (v18+) on the VM:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
3. **Copy the project to the VM** (git clone, or `scp` the folder).
4. On the VM:
   ```bash
   cd notebook-chat
   cp .env.example .env   # fill in your Firebase config
   npm install
   npm run build
   ```
5. **Run it persistently** with `pm2` (recommended) so it survives reboots/SSH disconnects:
   ```bash
   npm install -g pm2
   PORT=80 pm2 start server/index.js --name notebook
   pm2 save
   pm2 startup   # follow the printed instructions to enable on boot
   ```
6. **(Optional) Put Nginx in front** for TLS via Let's Encrypt/Certbot if you want `https://`.
7. Add your VM's domain/IP to **Firebase Auth → Settings → Authorized domains**, or OAuth sign-in will fail.

## That's it

Visiting the VM's IP or domain should show the Notebook login screen.

## Project structure

```
src/
  components/   UI pieces (MessageList, MessageInput, Sidebar, UserAvatar, TypingIndicator)
  contexts/     AuthContext (OAuth + presence wiring)
  hooks/        useMessages, useTyping, usePresence, useFileUpload
  pages/        Login, Chat, Admin, Banned
  firebase.js   Firebase app initialization (reads from .env)
server/
  index.js      Express server serving the production build
database.rules.json   Firebase Realtime Database security rules
```
