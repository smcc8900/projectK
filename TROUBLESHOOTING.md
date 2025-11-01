# Troubleshooting Guide

## Firebase Authentication Errors

### Error: "auth/invalid-credential"

This error means Firebase couldn't authenticate the user. Common causes:

#### 1. User Doesn't Exist Yet
**Problem**: You're trying to login before creating an admin user.

**Solution**: 
1. Create an admin user first using the DBA script:
   ```bash
   node scripts/createAdmin.js
   ```
2. Or use Firebase Console to manually create a user

#### 2. Wrong Email/Password
**Problem**: Typo in email or password.

**Solution**:
- Double-check the email spelling
- Verify the password (case-sensitive)
- Try resetting password in Firebase Console

#### 3. User Exists But No Custom Claims Set
**Problem**: User exists in Firebase Auth but doesn't have `orgId` and `role` claims.

**Solution**: Run this to set custom claims:
```javascript
// Using Firebase Admin SDK
const admin = require('firebase-admin');
admin.initializeApp();

// Get the user's UID from Firebase Console > Authentication
const uid = 'USER_UID_HERE';
await admin.auth().setCustomUserClaims(uid, {
  orgId: 'YOUR_ORG_ID',
  role: 'admin'
});
```

#### 4. Firebase Configuration Missing
**Problem**: `.env` file not set up or Firebase config invalid.

**Solution**:
1. Check `.env` file exists in root directory
2. Verify all Firebase config values:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
3. Restart dev server after updating `.env`

## Quick Fix: Create Test User via Firebase Console

### Step 1: Create User in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** → **Users**
4. Click **"Add User"**
5. Enter:
   - Email: `admin@test.com`
   - Password: `Admin123!`
   - Disable "Send email verification" (for testing)
6. Click **"Add User"**
7. **Copy the User UID** (you'll need it)

### Step 2: Create Organization Document

1. Go to **Firestore Database**
2. Click **"Start collection"** (or use existing `organizations` collection)
3. Collection ID: `organizations`
4. Document ID: Click "Auto-ID" or use custom ID
5. Add fields:

```
orgName (string): "Test Company"
domain (string): "test.com"
subscription.plan (string): "enterprise"
subscription.status (string): "active"
subscription.startDate (timestamp): [Now]
settings.currency (string): "USD"
settings.timezone (string): "America/New_York"
createdAt (timestamp): [Now]
updatedAt (timestamp): [Now]
```

6. **Copy the Document ID** (this is your `orgId`)

### Step 3: Set Custom Claims

You need to set custom claims using Firebase Admin SDK:

**Option A: Using Node.js Script**

Create `setClaims.js`:
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./functions/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setClaims() {
  const uid = 'PASTE_USER_UID_HERE'; // From Step 1
  const orgId = 'PASTE_ORG_ID_HERE'; // From Step 2
  
  await admin.auth().setCustomUserClaims(uid, {
    orgId: orgId,
    role: 'admin'
  });
  
  console.log('Custom claims set successfully!');
  console.log('User UID:', uid);
  console.log('Org ID:', orgId);
  
  process.exit(0);
}

setClaims().catch(console.error);
```

Run:
```bash
node setClaims.js
```

**Option B: Using Firebase Console Functions**

1. Go to Firebase Console → Functions
2. Use the function editor or create a temporary HTTP function
3. Call: `admin.auth().setCustomUserClaims(uid, { orgId, role: 'admin' })`

### Step 4: Create User Document in Firestore

1. Go to **Firestore Database**
2. Collection: `users`
3. Document ID: Use the **User UID from Step 1**
4. Add fields:

```
userId (string): [USER_UID]
email (string): admin@test.com
orgId (string): [ORG_ID]
role (string): admin
profile.firstName (string): Admin
profile.lastName (string): User
profile.employeeId (string): ADMIN001
profile.department (string): Administration
profile.designation (string): Administrator
profile.joiningDate (timestamp): [Now]
isActive (boolean): true
createdAt (timestamp): [Now]
updatedAt (timestamp): [Now]
```

### Step 5: Login

Now you can login with:
- Email: `admin@test.com`
- Password: `Admin123!`

## Common Issues

### Issue: "User account not properly configured"
**Cause**: Custom claims not set or user document missing

**Fix**: Complete Steps 2-4 above

### Issue: Can't see admin dashboard
**Cause**: Custom claims not refreshed

**Fix**: 
1. Sign out completely
2. Clear browser cache/cookies
3. Sign in again
4. The token will be refreshed with new claims

### Issue: Firestore permission denied
**Cause**: Security rules blocking access

**Fix**: 
1. Check `firestore.rules` is deployed
2. Verify user has `orgId` and `role` in custom claims
3. Check Firestore rules match your structure

## Test Credentials Summary

After completing all steps above:
- **Email**: `admin@test.com`
- **Password**: `Admin123!`
- **URL**: `http://localhost:3000/login`

## Still Having Issues?

1. **Check Browser Console**: Look for detailed error messages
2. **Check Firebase Console Logs**: Functions → Logs
3. **Verify Environment Variables**: Make sure `.env` is loaded
4. **Restart Dev Server**: `npm run dev`
5. **Clear Firebase Cache**: Sign out, clear cookies, sign in again

## Automated Test User Creation Script

I can create a simple script that does all of the above automatically. Would you like me to create that?

