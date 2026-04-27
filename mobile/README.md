# Hospital Management — Mobile App

React Native (Expo) app for Android & iOS.

## Setup in 3 steps

### Step 1 — Install Expo CLI
```bash
npm install -g expo-cli
```

### Step 2 — Install dependencies
```bash
cd hospital-management/mobile
npm install
```

### Step 3 — Set your backend IP
Open `src/api/axios.js` and change the IP to your computer's local IP:
```js
export const BASE_URL = 'http://YOUR_COMPUTER_IP:5000';
```

To find your IP:
- Windows: run `ipconfig` → look for IPv4 Address (e.g. 192.168.1.5)
- Mac/Linux: run `ifconfig` → look for inet

> Your phone and computer must be on the same WiFi network.

### Step 4 — Start the app
```bash
npm start
```

This opens Expo DevTools in your browser. Then:

**On your phone:**
1. Install the **Expo Go** app from Play Store / App Store
2. Scan the QR code shown in the terminal or browser

**On Android emulator:** Press `a`
**On iOS simulator:** Press `i`

## Build APK for Android (no Play Store needed)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

This gives you a `.apk` file you can install directly on any Android phone.

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Main Doctor | admin@hospital.com | password123 |
| Doctor | sarah@hospital.com | password123 |
| Patient | john@patient.com | password123 |

## Features by Role

### Main Doctor
- Dashboard stats (revenue, patients, doctors)
- Approve/reject referrals
- Approve/reject chat & video requests
- Post social feed announcements
- View LaunchPad ideas (filter by Doctor/Patient)

### Doctor
- View & add patients
- Request referrals (via Main Doctor)
- Submit LaunchPad ideas
- View social feed

### Patient
- View health profile
- Request chat or video call with doctor (Main Doctor approves)
- Real-time chat via Socket.io
- Submit LaunchPad ideas
- View social feed
