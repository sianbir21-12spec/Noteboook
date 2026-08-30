# Notebook

A real-time chat app with group rooms and direct messages, built for you and your people.

**Stack:** React (Vite) · Firebase Auth (Email/Password + Google OAuth) · Firebase Realtime Database · Firebase Storage · Express (production server)

## Features

- Email/password + Google sign-in
- Group chat rooms (create your own) and 1:1 direct messages
- Typing indicators
- Online presence + read receipts ("Seen")
- Image/file uploads in messages

---

## 1. Firebase project setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. **Authentication** → Sign-in method → enable **Email/Password** and **Google**.
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

## 3. Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`. Open it in two browser profiles (or one normal + one incognito) to test DMs, typing indicators, and presence between two accounts.

## 4. Production build

```bash
npm run build      # outputs to dist/
npm run server     # serves dist/ via Express on PORT (default 8080)
```

## 5. Docker

Vite reads `VITE_*` values at build time, so pass Firebase config as build args:

```bash
docker build -t notebook-chat \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_DATABASE_URL="$VITE_FIREBASE_DATABASE_URL" \
  --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
  .
```

Run the container:

```bash
docker run --rm -p 8080:8080 notebook-chat
```

Visit `http://localhost:8080`.

## 6. Deploying to a Cloud VM

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

That's it — visiting the VM's IP or domain should show the Notebook login screen.

## Project structure

```
src/
  components/   UI pieces (MessageList, MessageInput, Sidebar, UserAvatar, TypingIndicator)
  contexts/     AuthContext (OAuth + presence wiring)
  hooks/        useMessages, useTyping, usePresence, useFileUpload
  pages/        Login, Chat
  firebase.js   Firebase app initialization (reads from .env)
server/
  index.js      Express server serving the production build
database.rules.json   Firebase Realtime Database security rules
```
