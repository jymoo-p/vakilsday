# Firebase Setup for VakilsDay (New Project)

## Step 1: Create Firebase Project

1. Go to: https://console.firebase.google.com/
2. Click **"Add project"** or **"Create a project"**
3. Project name: **VakilsDay**
4. Click Continue
5. Disable Google Analytics (we don't need it)
6. Click **"Create project"**
7. Wait for it to finish, then click **"Continue"**

## Step 2: Enable Google Authentication

1. In Firebase Console, click **"Authentication"** in left sidebar
2. Click **"Get started"**
3. Click **"Sign-in method"** tab
4. Click **"Google"** from the list
5. Toggle **"Enable"**
6. Support email: Select your email (jymoo.p@gmail.com)
7. Click **"Save"**

## Step 3: Register Web App

1. In Firebase Console, go to Project Overview (top left)
2. Click the **Web icon** (`</>`) to add a web app
3. App nickname: **VakilsDay Web**
4. Check **"Also set up Firebase Hosting"** (optional)
5. Click **"Register app"**

## Step 4: Copy Firebase Configuration

You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "vakilsday-xxxxx.firebaseapp.com",
  projectId: "vakilsday-xxxxx",
  storageBucket: "vakilsday-xxxxx.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

**Keep this window open - we'll use these values in the next step!**

## Step 5: Add to VakilsDay .env.local

Once you have the config, I'll help you add it to the project.

---

**DO THIS NOW, then let me know when you have the Firebase config values ready!**
