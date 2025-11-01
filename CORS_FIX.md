# CORS Error Fix Guide - Complete Solution

## Problem
Getting CORS errors when trying to add/create users or perform other operations via Firebase Cloud Functions.

## Root Causes

The most common causes of CORS errors with Firebase Cloud Functions are:

1. **Functions Not Deployed** - The Cloud Functions haven't been deployed to Firebase yet
2. **Region Mismatch** - Frontend and backend are using different regions
3. **Functions Not Found** - The function doesn't exist in the deployed functions
4. **Incorrect Configuration** - Firebase configuration issues

## Complete Fix Applied

All CORS issues have been fixed across the entire application:

✅ **All Firebase Functions configured with `us-central1` region:**
- `createUser`
- `setUserClaims`
- `deleteUser`
- `createOrganizationAdmin`

✅ **Frontend configured with `us-central1` region:**
- `src/services/firebase.js` uses `getFunctions(app, 'us-central1')`

✅ **Comprehensive error handling added:**
- `src/services/user.service.js` - createUser, deleteUser
- `src/services/auth.service.js` - setCustomClaims
- `src/services/payslip.service.js` - uploadExcelFile
- `src/utils/errorHandler.js` - Utility functions for consistent error handling

✅ **CORS package added to functions:**
- `cors` package added to `functions/package.json`

## Solution

### Step 1: Ensure Functions Are Deployed

The most common issue is that functions haven't been deployed. Deploy your functions:

```bash
cd functions
npm install
cd ..

firebase deploy --only functions
```

**Note**: First deployment may take 5-10 minutes. Make sure you're on the Blaze (pay-as-you-go) plan as it's required for Cloud Functions.

### Step 2: Verify Region Configuration

Both frontend and backend are now configured to use `us-central1` region. Verify:

**Frontend** (`src/services/firebase.js`):
```javascript
export const functions = getFunctions(app, 'us-central1');
```

**Backend** (`functions/src/index.js`):
```javascript
exports.createUser = functions.region('us-central1').https.onCall(async (data, context) => {
  // ...
});
```

### Step 3: Check Function Deployment

Verify your functions are deployed:

```bash
firebase functions:list
```

You should see:
- `createUser` (us-central1)
- `setUserClaims` (us-central1)
- `deleteUser` (us-central1)
- `createOrganizationAdmin` (us-central1)

### Step 4: Test Function Locally (Optional)

For local development, you can use the Firebase Emulator:

```bash
firebase emulators:start
```

Then in your frontend code, connect to the emulator:
```javascript
// Add this in src/services/firebase.js (for local development only)
import { connectFunctionsEmulator } from 'firebase/functions';

if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

## Verification

After deploying, test the function:

1. Open your app in the browser
2. Try to create a user
3. Check browser console for any errors
4. Check Firebase Console → Functions → Logs for backend errors

## Common Error Messages

### "CORS policy: No 'Access-Control-Allow-Origin' header"
**Fix**: Functions are not deployed. Deploy with `firebase deploy --only functions`

### "Function not found"
**Fix**: Function name mismatch or not deployed. Verify function name matches exactly.

### "Permission denied"
**Fix**: This is not a CORS error - it's an authentication error. Make sure:
- User is logged in
- User has admin role
- Custom claims are set correctly

### "Unavailable"
**Fix**: Functions might be in a different region or not accessible. Check region configuration.

## Still Having Issues?

1. **Clear Browser Cache**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+F5)
2. **Check Network Tab**: Look at the actual request/response in browser DevTools
3. **Check Firebase Console**: Go to Functions → Logs to see backend errors
4. **Verify Deployment**: Run `firebase functions:list` to confirm functions are deployed
5. **Check Region**: Make sure frontend and backend use the same region

## Quick Deployment Checklist

- [ ] Functions installed: `cd functions && npm install`
- [ ] Functions deployed: `firebase deploy --only functions`
- [ ] Region matches: `us-central1` in both frontend and backend
- [ ] User is authenticated and has admin role
- [ ] Firebase project is on Blaze plan

## Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Functions CORS](https://firebase.google.com/docs/functions/http-events#cors)
- [Deployment Guide](./DEPLOYMENT.md)
