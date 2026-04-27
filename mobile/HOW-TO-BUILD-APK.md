# How to Get the APK File

## ✅ EASIEST METHOD — Expo Cloud Build (Recommended)
No Android Studio. No Java. Builds in the cloud. FREE.

---

### Step 1 — Create a FREE Expo account
Go to: https://expo.dev/signup
(Takes 30 seconds)

---

### Step 2 — Open Command Prompt in this folder
Right-click the `mobile` folder → "Open in Terminal" or CMD

---

### Step 3 — Run these commands one by one

```
npm install
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

- `eas login` → enter your Expo email + password
- `eas build` → it uploads your code and builds in the cloud
- Takes about **5–10 minutes**

---

### Step 4 — Download your APK
When the build finishes, you'll see a link like:
```
✅ Build finished
🤖 Android APK: https://expo.dev/artifacts/eas/xxxx.apk
```

Click that link → download the `.apk` file

---

### Step 5 — Install on your Android phone
1. Copy the `.apk` to your phone (WhatsApp, email, USB, Google Drive)
2. Open it on your phone
3. If asked "Allow from unknown sources" → tap **Allow**
4. Install → Done ✅

---

## ⚠️ IMPORTANT — Before building, update your IP

Open `src/api/axios.js` and make sure the IP matches your computer:
```js
export const BASE_URL = 'http://192.168.0.232:5000';
```

Your current IP is already set to: **192.168.0.232**

> If your IP changes (e.g. you reconnect to WiFi), update this and rebuild.

---

## Alternative — Run directly on phone without building (instant)

1. Install **Expo Go** from Play Store on your phone
2. Run: `npm start`
3. Scan the QR code with Expo Go
4. App opens instantly — no APK needed!

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "eas: command not found" | Run `npm install -g eas-cli` again |
| Build fails | Check https://expo.dev for error logs |
| App can't connect to backend | Make sure backend is running + phone on same WiFi |
| "Install blocked" on phone | Enable "Unknown sources" in phone Settings → Security |
