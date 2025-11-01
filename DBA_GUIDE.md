# DBA Guide: Creating Initial Admin Users

## Overview

When a new organization signs a contract for the Enterprise Payroll System, a DBA (Database Administrator) must create the initial organization and admin user. This document explains how to do this.

## Prerequisites

1. Firebase Admin SDK access (service account key)
2. Node.js installed
3. Access to Firebase project

## Method 1: Using Node.js Script (Recommended)

### Setup

1. **Get Service Account Key**
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `functions/serviceAccountKey.json`
   - **IMPORTANT**: Keep this file secure! Never commit it to version control.

2. **Install Dependencies** (if not already installed)
   ```bash
   cd functions
   npm install
   ```

3. **Run the Script**
   ```bash
   cd ..
   node scripts/createAdmin.js
   ```

### Interactive Mode

The script will prompt you for:
- Organization Name
- Organization Domain
- Admin Email
- Admin Password (minimum 6 characters)
- Admin First Name
- Admin Last Name

### Command Line Arguments

```bash
node scripts/createAdmin.js \
  --orgName "Company ABC Ltd" \
  --domain "companyabc.com" \
  --adminEmail "admin@companyabc.com" \
  --adminPassword "SecurePass123!" \
  --firstName "John" \
  --lastName "Doe"
```

### Environment Variables

```bash
export ORG_NAME="Company ABC Ltd"
export ORG_DOMAIN="companyabc.com"
export ADMIN_EMAIL="admin@companyabc.com"
export ADMIN_PASSWORD="SecurePass123!"
export ADMIN_FIRST_NAME="John"
export ADMIN_LAST_NAME="Doe"
export CURRENCY="USD"
export TIMEZONE="America/New_York"

node scripts/createAdmin.js
```

## Method 2: Using Firebase Cloud Function

### Setup

1. **Deploy the Function**
   ```bash
   cd functions
   npm install
   firebase deploy --only functions:createOrganizationAdmin
   ```

2. **Call the Function**

   Using Firebase Console:
   - Go to Functions
   - Click on `createOrganizationAdmin`
   - Use "Test" tab with this payload:
   ```json
   {
     "orgName": "Company ABC Ltd",
     "domain": "companyabc.com",
     "adminEmail": "admin@companyabc.com",
     "adminPassword": "SecurePass123!",
     "firstName": "John",
     "lastName": "Doe",
     "currency": "USD",
     "timezone": "America/New_York"
   }
   ```

   Using gcloud CLI:
   ```bash
   gcloud functions call createOrganizationAdmin \
     --data '{"orgName":"Company ABC","domain":"company.com","adminEmail":"admin@company.com","adminPassword":"Pass123!","firstName":"John","lastName":"Doe"}'
   ```

   **Note**: For production, secure this function with IAM roles and API keys.

## Method 3: Direct Firebase Console (Manual)

### Step 1: Create Organization Document

1. Go to Firestore Database
2. Create a new document in `organizations` collection
3. Use auto-generated ID or create a specific one
4. Add fields:
   ```json
   {
     "orgName": "Company ABC Ltd",
     "domain": "companyabc.com",
     "subscription": {
       "plan": "enterprise",
       "status": "active",
       "startDate": [timestamp]
     },
     "settings": {
       "currency": "USD",
       "timezone": "America/New_York"
     },
     "createdAt": [timestamp],
     "updatedAt": [timestamp]
   }
   ```
5. Save the document ID (this is the `orgId`)

### Step 2: Create Admin User in Authentication

1. Go to Authentication > Users
2. Click "Add User"
3. Enter:
   - Email: `admin@companyabc.com`
   - Password: `SecurePass123!`
   - Email verification: Can be disabled initially
4. Click "Add User"
5. Save the User UID

### Step 3: Set Custom Claims

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Run:
   ```bash
   firebase auth:export users.json
   # Edit users.json to add custom claims (not recommended)
   
   # Better: Use Admin SDK
   ```
   
   Or use this Node.js script:
   ```javascript
   const admin = require('firebase-admin');
   admin.initializeApp();
   
   admin.auth().setCustomUserClaims('USER_UID', {
     orgId: 'ORG_ID',
     role: 'admin'
   });
   ```

### Step 4: Create User Document

1. Go to Firestore Database
2. Create a new document in `users` collection
3. Use the User UID as the document ID
4. Add fields:
   ```json
   {
     "userId": "[USER_UID]",
     "email": "admin@companyabc.com",
     "orgId": "[ORG_ID]",
     "role": "admin",
     "profile": {
       "firstName": "John",
       "lastName": "Doe",
       "employeeId": "ADMIN001",
       "department": "Administration",
       "designation": "Administrator",
       "joiningDate": [timestamp]
     },
     "isActive": true,
     "createdAt": [timestamp],
     "updatedAt": [timestamp]
   }
   ```

## Verification

After creation, verify:

1. **Organization exists** in Firestore `organizations` collection
2. **User exists** in Firebase Authentication
3. **Custom claims set**: User's token should contain `orgId` and `role: 'admin'`
4. **User document exists** in Firestore `users` collection
5. **User can login** at the application URL

## Security Best Practices

1. **Never share service account keys**
2. **Use strong, unique passwords** for admin accounts
3. **Enable 2FA** for Firebase Console access
4. **Rotate service account keys** periodically
5. **Log all admin creations** for audit trail
6. **Restrict Cloud Function access** with IAM roles
7. **Use environment variables** instead of hardcoding credentials

## Troubleshooting

### Error: "Organization already exists"
- Check if domain is already in use
- Use a different domain or contact support

### Error: "User already exists"
- Check if email is already registered
- Use a different email or reset password

### Custom Claims Not Working
- Wait a few seconds and try again
- Have user sign out and sign back in
- Verify claims using Admin SDK: `admin.auth().getUser(uid)`

### User Can't Login
- Verify custom claims are set correctly
- Check if user is active: `isActive: true`
- Verify email/password are correct
- Check Firestore security rules allow access

## Post-Creation Checklist

- [ ] Organization document created with correct data
- [ ] Admin user created in Firebase Auth
- [ ] Custom claims set (orgId, role: admin)
- [ ] User document created in Firestore
- [ ] User can successfully login
- [ ] User has admin permissions (can see admin dashboard)
- [ ] User can create other users
- [ ] Credentials securely shared with organization admin

## Support

For issues or questions:
- Check Firebase Console logs
- Review Firestore security rules
- Verify network connectivity
- Contact system administrator

