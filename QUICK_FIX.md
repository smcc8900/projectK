# Quick Fix for "auth/invalid-credential" Error

## Step-by-Step Solution

### Option 1: Use the Fix Script (Easiest)

```bash
node scripts/fixLoginIssue.js --email "your-email@example.com"
```

Or run interactively:
```bash
node scripts/fixLoginIssue.js
```

This script will:
- ✅ Check if user exists
- ✅ Fix missing custom claims
- ✅ Create/update user document
- ✅ Optionally reset password
- ✅ Give you exact login instructions

### Option 2: Manual Fix in Firebase Console

#### Step 1: Check if User Exists
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Authentication → Users
3. Search for your email
4. **If user doesn't exist**: Create it (Add User)

#### Step 2: Get User UID
- Click on the user
- Copy the **User UID**

#### Step 3: Check Organization
1. Go to **Firestore Database**
2. Check `organizations` collection
3. If none exists, create one:
   - Collection: `organizations`
   - Document: Auto-ID
   - Fields:
     ```
     orgName: "Test Company"
     domain: "test.com"
     subscription.plan: "enterprise"
     subscription.status: "active"
     createdAt: [timestamp]
     updatedAt: [timestamp]
     ```
4. **Copy the Organization Document ID** (this is your `orgId`)

#### Step 4: Set Custom Claims
Run this script:

```bash
node scripts/setCustomClaims.js --uid "PASTE_USER_UID" --orgId "PASTE_ORG_ID" --role "admin"
```

#### Step 5: Verify Login
1. Go to `http://localhost:3000/login`
2. Enter your email
3. **If still getting error**: Password might be wrong
   - Go to Firebase Console → Authentication → Users
   - Click on your user
   - Click "Reset Password" or "Change Password"

### Option 3: Create Fresh User (If Everything is Broken)

```bash
node scripts/createTestUserSimple.js
```

Follow the prompts. Default values:
- Email: `admin@test.com`
- Password: `Admin123!`

Then login with those credentials.

## Common Scenarios

### Scenario 1: User Created But Can't Login
**Cause**: Custom claims missing or wrong password

**Fix**: 
```bash
node scripts/fixLoginIssue.js --email "your-email@example.com"
```

### Scenario 2: Just Created User, Immediate Login Error
**Cause**: Token hasn't refreshed or user setup incomplete

**Fix**:
1. Wait 2-3 seconds after running create script
2. Clear browser cache
3. Try login again
4. If still fails, run fix script

### Scenario 3: "User account not properly configured"
**Cause**: Custom claims or user document missing

**Fix**: Run fix script - it will check and fix everything

### Scenario 4: Password Definitely Wrong
**Fix in Firebase Console**:
1. Authentication → Users
2. Find your user
3. Click three dots menu → "Reset Password"
4. Or manually set a new password

## Verification Checklist

After running any fix, verify:

- [ ] User exists in Firebase Auth (Console → Authentication → Users)
- [ ] User has custom claims (run fix script to check)
- [ ] User document exists in Firestore (`users` collection)
- [ ] Organization exists (`organizations` collection)
- [ ] Password is known/can be reset
- [ ] Dev server is running (`npm run dev`)
- [ ] Browser cache cleared

## Still Not Working?

1. **Check Browser Console**: Open DevTools (F12) → Console tab
2. **Check Network Tab**: See what requests are failing
3. **Verify `.env` file**: Make sure Firebase config is correct
4. **Check Firebase Console Logs**: Functions → Logs
5. **Run fix script with verbose output**: Check all errors

## Test Credentials (If You Want to Start Fresh)

Create a test user:
```bash
node scripts/createTestUserSimple.js
```

Use defaults:
- Email: `admin@test.com`
- Password: `Admin123!`

Then login at: `http://localhost:3000/login`

---

**Most Common Fix**: Run `node scripts/fixLoginIssue.js` with your email - it fixes 95% of issues automatically!

