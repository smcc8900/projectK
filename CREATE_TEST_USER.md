# Quick Guide: Create a Test Admin User

## Prerequisites

1. **Get Firebase Service Account Key**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the downloaded JSON file as: `functions/serviceAccountKey.json`

2. **Install Dependencies** (if not done):
   ```bash
   cd functions
   npm install firebase-admin
   cd ..
   ```

## Create User - Method 1: Command Line Arguments

```bash
node scripts/createAdmin.js \
  --orgName "Test Company" \
  --domain "testcompany.com" \
  --adminEmail "admin@testcompany.com" \
  --adminPassword "Test123!" \
  --firstName "Test" \
  --lastName "Admin"
```

## Create User - Method 2: Interactive Mode

```bash
node scripts/createAdmin.js
```

The script will prompt you for each field.

## Create User - Method 3: Environment Variables

```bash
export ORG_NAME="Test Company"
export ORG_DOMAIN="testcompany.com"
export ADMIN_EMAIL="admin@testcompany.com"
export ADMIN_PASSWORD="Test123!"
export ADMIN_FIRST_NAME="Test"
export ADMIN_LAST_NAME="Admin"

node scripts/createAdmin.js
```

## Expected Output

```
=== Create Organization & Admin User ===

Organization Name: Test Company
Organization Domain: testcompany.com
Admin Email: admin@testcompany.com
Admin Password (min 6 chars): Test123!
Admin First Name: Test
Admin Last Name: Admin

Creating organization...
Organization created with ID: xyz123
Creating admin user...
Custom claims set
User document created

✅ SUCCESS!
================================
Organization ID: xyz123
Organization Name: Test Company
Admin Email: admin@testcompany.com
Admin UID: abc456
================================

Admin user can now login at: https://your-app-url.com/login
Email: admin@testcompany.com
Password: Test123!

⚠️  IMPORTANT: Share these credentials securely with the admin!
```

## Login Credentials

After running the script, use these credentials:

- **Email**: `admin@testcompany.com` (or whatever you specified)
- **Password**: `Test123!` (or whatever you specified)
- **URL**: `http://localhost:3000/login` (if running locally)

## Troubleshooting

### Error: Cannot find module '../functions/serviceAccountKey.json'
- Make sure you downloaded the service account key and placed it in `functions/serviceAccountKey.json`

### Error: Permission denied
- Make sure your service account has proper permissions in Firebase Console

### Error: Organization already exists
- Use a different domain name
- Or manually delete the organization from Firestore

### Error: User already exists
- The email is already registered
- Use a different email or delete the user from Firebase Authentication

## Next Steps

After creating the admin:
1. Login at `http://localhost:3000/login`
2. You should see the Admin Dashboard
3. Go to User Management to create employees
4. Upload your first payroll Excel file

