# Deploy Firebase Functions - Step by Step Guide

## Quick Start

### Step 1: Login to Firebase (One-time setup)

Run this command and follow the browser prompts:

```bash
firebase login
```

This will:
1. Open your browser
2. Ask you to authenticate with your Google account
3. Grant permissions to Firebase CLI

### Step 2: Set Firebase Project

Your project is already configured as `projectk-618c3`. Verify:

```bash
firebase use projectk-618c3
```

### Step 3: Install Function Dependencies

```bash
cd functions
npm install
cd ..
```

### Step 4: Deploy Functions

```bash
firebase deploy --only functions
```

**Note:** First deployment takes 5-10 minutes. Make sure you're on the Blaze (pay-as-you-go) plan.

## Verify Deployment

After deployment completes:

```bash
firebase functions:list
```

You should see:
- `createUser` (us-central1)
- `setUserClaims` (us-central1)
- `deleteUser` (us-central1)
- `createOrganizationAdmin` (us-central1)

## Test the Functions

1. Open your application
2. Try creating a user
3. Check browser console for any errors
4. Check Firebase Console → Functions → Logs for backend logs

## Troubleshooting

### "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### "Not logged in"
```bash
firebase login
```

### "Permission denied"
- Check you're using the correct Google account
- Verify project ownership in Firebase Console

### "Functions deployment failed"
- Check you're on Blaze plan
- Verify all dependencies are installed: `cd functions && npm install`
- Check function logs: `firebase functions:log`

### "Region mismatch"
- All functions now use `us-central1` region
- Frontend is configured with `us-central1` in `src/services/firebase.js`
- This should match automatically

## Quick Commands Reference

```bash
# Login
firebase login

# Check project
firebase use projectk-618c3

# Deploy functions
firebase deploy --only functions

# List deployed functions
firebase functions:list

# View logs
firebase functions:log

# Deploy specific function
firebase deploy --only functions:createUser
```

## After Deployment

Once functions are deployed:
1. ✅ All CORS errors should be resolved
2. ✅ User creation should work
3. ✅ User deletion should work
4. ✅ File uploads should work
5. ✅ Organization registration should work

---

**Ready to deploy?** Run `firebase login` first, then follow the steps above!

