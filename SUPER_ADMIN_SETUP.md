# Super Admin Setup Checklist

## Quick Setup (5 minutes)

### ✅ Step 1: Create Super Admin Account

```bash
cd /Users/badreddy/projectK
node scripts/createSuperAdmin.js
```

**Enter when prompted:**

**Super Admin (for managing customers):**
- Email: `admin@ofdlabs.store` (or your preferred email)
- Password: Strong password (min 6 chars, recommend 12+)
- First Name: `OFD`
- Last Name: `Labs`

**Regular Admin (for OFD Labs payroll) - RECOMMENDED:**
- Create regular admin? `yes`
- Email: `payroll@ofdlabs.store`
- Password: Strong password
- First Name: `Payroll`
- Last Name: `Manager`

**Expected output:**
```
✅ OFD Labs organization created
✅ Super admin user created with UID: xxx
✅ Super admin claims set
✅ User document created
✅ Regular admin user created with UID: yyy
✅ Admin claims set
✅ Regular admin document created
```

**You'll get TWO accounts:**
1. **Super Admin** - Manage all customers
2. **Regular Admin** - Manage OFD Labs employees & payroll

### ✅ Step 2: Deploy Application

```bash
# Build the client
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

**Wait for:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/projectk-618c3/overview
Hosting URL: https://projectk-618c3.web.app
```

### ✅ Step 3: Verify Functions are Deployed

```bash
firebase deploy --only functions
```

**Verify these functions exist:**
- ✅ `createOrganizationAdmin`
- ✅ `setUserClaims`
- ✅ `createUser`

### ✅ Step 4: Test Both Accounts

#### Test Super Admin
1. Open: `https://projectk-618c3.web.app/login`
2. Login with: `admin@ofdlabs.store`
3. Should redirect to: `/superadmin/dashboard`

**You should see:**
- Overview tab with statistics
- Onboard Customer tab
- Manage Features tab
- "OFD Labs - Customer Management" header

#### Test Regular Admin
1. Sign out
2. Login with: `payroll@ofdlabs.store`
3. Should redirect to: `/admin/dashboard`

**You should see:**
- Regular admin dashboard
- User Management
- Payroll Upload
- OFD Labs organization name in header

**Both accounts work with the same organization (OFD Labs) but have different roles!**

---

## Verification Checklist

### Firebase Console Checks

#### 1. Authentication
- [ ] Go to Firebase Console > Authentication
- [ ] Should see TWO users:
  - [ ] Super admin: `admin@ofdlabs.store` with claims `{"role":"superadmin","orgId":"ofdlabs"}`
  - [ ] Regular admin: `payroll@ofdlabs.store` with claims `{"role":"admin","orgId":"ofdlabs"}`

#### 2. Firestore
- [ ] Go to Firebase Console > Firestore Database
- [ ] Check `organizations` collection
- [ ] Should have document with ID: `ofdlabs`
- [ ] Check `users` collection
- [ ] Should have TWO user documents (super admin + regular admin)

#### 3. Functions
- [ ] Go to Firebase Console > Functions
- [ ] Should see:
  - `createOrganizationAdmin`
  - `setUserClaims`
  - `createUser`
- [ ] All should show "Healthy" status

### Application Checks

#### 1. Super Admin Dashboard
- [ ] Can access `/superadmin/dashboard`
- [ ] Overview tab shows statistics
- [ ] Can see "New Customer" button
- [ ] Tabs are clickable

#### 2. Onboard Customer
- [ ] Click "Onboard Customer" tab
- [ ] Form loads correctly
- [ ] All fields are present
- [ ] Can select organization type

#### 3. Manage Features
- [ ] Click "Manage Features" tab
- [ ] Dropdown shows organizations (at least OFD Labs)
- [ ] Feature toggles are visible
- [ ] Can toggle features on/off

---

## Test: Create a Test Customer

### Create Test Organization

1. Go to Super Admin Dashboard
2. Click **"New Customer"**
3. Fill in:
   ```
   Organization Name: Test Company
   Domain: test.company.com
   Type: Corporate
   First Name: Test
   Last Name: Admin
   Email: admin@test.company.com
   Password: TestPass123!
   ```
4. Click **"Create Customer"**

### Expected Result

```
✅ Customer onboarded successfully!

Send to Customer:
Login URL: https://projectk-618c3.web.app/login
Email: admin@test.company.com
Password: TestPass123!
Organization: Test Company

Organization ID: [auto-generated]
Admin UID: [auto-generated]
```

### Verify in Firebase

1. **Firestore** > `organizations` > Should have new document
2. **Firestore** > `users` > Should have new admin user
3. **Authentication** > Should have new user with email

### Test Customer Login

1. **Sign out** from super admin
2. **Login** as `admin@test.company.com`
3. Should redirect to `/admin/dashboard`
4. Should see "Test Company" in navbar

---

## Test: Manage Features

### Enable a Feature

1. Login as super admin
2. Go to **"Manage Features"** tab
3. Select **"Test Company"**
4. Toggle **"Geofencing"** to ON
5. Click **"Save Changes"**

### Verify Feature

1. Check Firestore: `organizations/[test-company-id]/features`
2. Should show: `geofencing: true`

### Test as Customer

1. Sign out
2. Login as test company admin
3. Refresh browser
4. Feature should be visible (if implemented in UI)

---

## Common Issues & Fixes

### Issue: Can't create super admin

**Error**: `User already exists`

**Fix**:
```bash
# Script will ask if you want to update existing user
# Choose "yes" to update to super admin role
```

### Issue: Redirected to admin dashboard instead of super admin

**Error**: Not seeing super admin dashboard

**Fix**:
1. Sign out completely
2. Clear browser cache
3. Sign in again
4. Or run: `node scripts/createSuperAdmin.js` and update existing user

### Issue: Functions not found

**Error**: `functions/not-found` when creating customer

**Fix**:
```bash
# Deploy functions
firebase deploy --only functions

# Wait for deployment to complete
# Try again
```

### Issue: Permission denied in Firestore

**Error**: `permission-denied` when accessing data

**Fix**:
Check `firestore.rules` - Super admin should have access to all collections:
```javascript
// Allow super admins to read all organizations
match /organizations/{orgId} {
  allow read: if request.auth != null && 
    (request.auth.token.role == 'superadmin' || 
     request.auth.token.orgId == orgId);
  allow write: if request.auth != null && 
    request.auth.token.role == 'superadmin';
}
```

---

## Next Steps

### 1. Secure Your Super Admin Account
- [ ] Use a strong, unique password
- [ ] Enable 2FA in Firebase Console (if available)
- [ ] Don't share credentials

### 2. Onboard Your First Real Customer
- [ ] Get customer details
- [ ] Use Super Admin Dashboard
- [ ] Send them credentials
- [ ] Verify they can login

### 3. Configure Features
- [ ] Review default features per type
- [ ] Adjust based on customer needs
- [ ] Test feature toggles

### 4. Monitor Usage
- [ ] Check Firebase Console regularly
- [ ] Review customer count
- [ ] Monitor function executions

---

## Quick Commands Reference

```bash
# Create super admin
node scripts/createSuperAdmin.js

# Build and deploy
npm run build && firebase deploy --only hosting

# Deploy functions
firebase deploy --only functions

# View logs
firebase functions:log

# Test locally
npm run dev
```

---

## Support Contacts

- **Firebase Console**: https://console.firebase.google.com/project/projectk-618c3
- **Application URL**: https://projectk-618c3.web.app
- **Super Admin Login**: https://projectk-618c3.web.app/login

---

## Summary

✅ **Setup Time**: ~5 minutes
✅ **No Code Changes Needed**: Just run scripts and deploy
✅ **Easy to Use**: Beautiful UI for all operations
✅ **Secure**: Role-based access control
✅ **Scalable**: Manage unlimited customers

You're all set! 🎉
