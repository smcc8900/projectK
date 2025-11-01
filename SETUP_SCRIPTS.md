# Setting Up Admin Scripts

## Quick Fix for Missing Dependencies

The scripts need `firebase-admin`. Install it:

```bash
# Install firebase-admin in root (already done)
npm install firebase-admin --save-dev

# OR install in functions folder (already done)
cd functions
npm install
cd ..
```

## Running the Scripts

All scripts should be run from the **root directory** (`/Users/badreddy/projectK`):

```bash
# From project root
node scripts/createTestUserSimple.js

# Not from functions folder
# ❌ cd functions && node ../scripts/createTestUserSimple.js
```

## Required Setup Before Running Scripts

1. **Service Account Key** (Required):
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as: `functions/serviceAccountKey.json`

2. **Dependencies** (Already installed):
   ```bash
   npm install firebase-admin --save-dev
   cd functions && npm install && cd ..
   ```

## Available Scripts

### 1. Create Test User (Simplest)
```bash
node scripts/createTestUserSimple.js
```
- Creates organization
- Creates admin user
- Sets custom claims
- Creates user document

### 2. Fix Login Issues
```bash
node scripts/fixLoginIssue.js --email "your-email@example.com"
```
- Diagnoses login problems
- Fixes missing claims
- Updates user documents

### 3. Set Custom Claims (For existing users)
```bash
node scripts/setCustomClaims.js --uid "USER_UID" --orgId "ORG_ID"
```

### 4. Full Admin Creation
```bash
node scripts/createAdmin.js
```
- More options and validation
- Use for production setup

## Troubleshooting

### Error: "Cannot find module 'firebase-admin'"
**Fix**: 
```bash
npm install firebase-admin --save-dev
```

### Error: "Cannot find module '../functions/serviceAccountKey.json'"
**Fix**: Download service account key from Firebase Console and save it as:
```
functions/serviceAccountKey.json
```

### Error: "Permission denied"
**Fix**: Make sure your service account has proper permissions in Firebase Console

## Next Steps

After running `createTestUserSimple.js`:

1. ✅ You'll get credentials (email/password)
2. ✅ Start dev server: `npm run dev`
3. ✅ Login at: `http://localhost:3000/login`
4. ✅ Use the credentials from the script output

