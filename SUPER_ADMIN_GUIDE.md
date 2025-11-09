# Super Admin Dashboard Guide

## Overview

The Super Admin Dashboard is exclusively for **OFD Labs** (`ofdlabs.store`) to manage all customer organizations from a single, powerful interface.

## Features

### ✅ What You Can Do

1. **View All Customers**
   - See total customer count
   - View active vs inactive customers
   - Organization type breakdown (Education, Corporate, Full)
   - User count per organization

2. **Onboard New Customers**
   - Create new organizations with admin users
   - Set organization type and features
   - Generate login credentials automatically
   - No command-line needed!

3. **Manage Customer Features**
   - Enable/disable features per customer
   - Real-time feature toggling
   - No redeployment required
   - Customers see changes after refresh

4. **Customer Statistics**
   - Growth metrics
   - User distribution
   - Organization insights

## Setup Instructions

### Step 1: Create Super Admin Account

Run the setup script to create your OFD Labs super admin account:

```bash
cd /Users/badreddy/projectK
node scripts/createSuperAdmin.js
```

**Follow the prompts:**
```
Super Admin Email (default: admin@ofdlabs.store): admin@ofdlabs.store
Super Admin Password (min 6 chars): YourSecurePassword123!
First Name (default: OFD): OFD
Last Name (default: Labs): Labs
```

**Output:**
```
✅ OFD Labs organization created
✅ Super admin user created
✅ Super admin claims set
✅ User document created

📧 Login Credentials:
═══════════════════════════════════════════════════════
Login URL: https://projectk-618c3.web.app/login
Email: admin@ofdlabs.store
Password: YourSecurePassword123!
Role: Super Admin
═══════════════════════════════════════════════════════
```

### Step 2: Deploy the Application

Deploy the updated client with super admin features:

```bash
# Build the client
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

### Step 3: Login as Super Admin

1. Go to: `https://projectk-618c3.web.app/login`
2. Enter your super admin credentials
3. You'll be automatically redirected to `/superadmin/dashboard`

## Using the Dashboard

### Overview Tab

**Statistics Cards:**
- **Total Customers**: All organizations in the system
- **Active Customers**: Organizations with active subscriptions
- **Total Users**: Sum of all users across all organizations
- **Growth Rate**: Customer growth percentage

**Organization Type Breakdown:**
- Education (with Timetable)
- Corporate (without Timetable)
- Full (all features)

**Customer List Table:**
- Organization name and ID
- Domain
- Type
- User count
- Status (Active/Inactive)
- Quick access to manage features

### Onboard Customer Tab

**Create a new customer organization:**

1. Click **"New Customer"** or go to **"Onboard Customer"** tab

2. Fill in **Organization Details:**
   - Organization Name (e.g., "ABC Corporation")
   - Domain (e.g., "abccorp.com")
   - Organization Type:
     - **Education**: Includes Timetable feature
     - **Corporate**: No Timetable (for offices)
     - **Full**: All features enabled

3. Fill in **Admin User Details:**
   - First Name
   - Last Name
   - Admin Email
   - Temporary Password (min 6 characters)

4. Click **"Create Customer"**

5. **Success!** You'll see:
   - Login URL for the customer
   - Admin credentials
   - Organization ID
   - Admin UID

6. **Send to Customer:**
   - Copy the login credentials
   - Email them to your customer
   - Remind them to change password after first login

### Manage Features Tab

**Enable/disable features for specific customers:**

1. Select a customer from the dropdown

2. View their current configuration:
   - Organization name and domain
   - Type
   - User count

3. Toggle features on/off:
   - **Timetable**: Class/shift scheduling
   - **Leave Management**: Leave requests
   - **Colleagues Directory**: Employee search
   - **Payslips**: Salary slips
   - **Profile Management**: User profiles
   - **Attendance Tracking**: Basic attendance
   - **Geofencing**: Location-based check-in
   - **Advanced Reports**: Detailed analytics
   - **Analytics Dashboard**: Business intelligence

4. Click **"Save Changes"**

5. **Important**: Customer must refresh browser or re-login to see changes

## Real-World Scenarios

### Scenario 1: Onboard a New Customer

**Customer Request**: "We need payroll system for our school"

**Steps:**
1. Login to Super Admin Dashboard
2. Click **"New Customer"**
3. Fill in:
   - Org Name: "Springfield High School"
   - Domain: "springfield.edu"
   - Type: **Education** (includes Timetable)
   - Admin: principal@springfield.edu
4. Click **"Create Customer"**
5. Send credentials to customer
6. Done! They can login immediately

### Scenario 2: Enable Geofencing for a Customer

**Customer Request**: "We need location-based attendance"

**Steps:**
1. Go to **"Manage Features"** tab
2. Select the customer
3. Toggle **"Geofencing"** to ON
4. Click **"Save Changes"**
5. Notify customer to refresh their browser
6. Done! Feature is now available

### Scenario 3: Disable Timetable for Corporate Client

**Customer Request**: "We don't need timetable, we're an office"

**Steps:**
1. Go to **"Manage Features"** tab
2. Select the customer
3. Toggle **"Timetable"** to OFF
4. Click **"Save Changes"**
5. Done! Timetable hidden from their interface

## Feature Flags Explained

### Available Features

| Feature | Description | Best For |
|---------|-------------|----------|
| **Timetable** | Class/shift scheduling | Schools, colleges |
| **Leaves** | Leave management | All organizations |
| **Colleagues** | Employee directory | All organizations |
| **Payslips** | Salary slip viewing | All organizations |
| **Profile** | User profile management | All organizations |
| **Attendance** | Basic attendance tracking | All organizations |
| **Geofencing** | Location-based check-in | Field workers, remote teams |
| **Reports** | Advanced reporting | Enterprise customers |
| **Analytics** | Business intelligence | Premium tier |

### Default Features by Type

**Education:**
```javascript
{
  timetable: true,      // ✅ Enabled
  leaves: true,
  colleagues: true,
  payslips: true,
  profile: true,
  attendance: true,
  geofencing: false,    // ❌ Disabled
  reports: false,
  analytics: false
}
```

**Corporate:**
```javascript
{
  timetable: false,     // ❌ Disabled
  leaves: true,
  colleagues: true,
  payslips: true,
  profile: true,
  attendance: true,
  geofencing: true,     // ✅ Enabled
  reports: false,
  analytics: false
}
```

**Full:**
```javascript
{
  // All features enabled ✅
}
```

## Security

### Access Control

- **Only** users with `role: 'superadmin'` can access the dashboard
- Regular admins and employees are redirected to their respective dashboards
- Super admin routes are protected by `SuperAdminRoute` component

### Best Practices

1. **Keep credentials secure**: Never share super admin password
2. **Use strong passwords**: Minimum 12 characters recommended
3. **Regular audits**: Review customer list periodically
4. **Monitor activity**: Check Firebase logs for unusual activity

## Deployment Workflow

### When Adding New Features

```bash
# 1. Develop feature locally
npm run dev

# 2. Test with different feature flag states
# Enable/disable in Super Admin Dashboard

# 3. Build for production
npm run build

# 4. Deploy
firebase deploy --only hosting

# 5. Enable for specific customers
# Use Super Admin Dashboard > Manage Features
```

### When Onboarding Customers

```bash
# No deployment needed!
# Just use the Super Admin Dashboard UI
```

## Troubleshooting

### Can't Access Super Admin Dashboard

**Problem**: Redirected to admin or employee dashboard

**Solution**:
1. Verify your account has `role: 'superadmin'` in Firestore
2. Check custom claims: Firebase Console > Authentication > Users > Custom Claims
3. Sign out and sign back in to refresh token
4. Run `node scripts/createSuperAdmin.js` to update claims

### Customer Not Seeing New Features

**Problem**: Enabled feature but customer doesn't see it

**Solution**:
1. Customer must **refresh browser** (Cmd+Shift+R or Ctrl+Shift+R)
2. Or **sign out and sign back in**
3. Check Firestore: `organizations/{orgId}/features`
4. Verify feature name spelling matches exactly

### Organization Creation Fails

**Problem**: Error when creating new customer

**Solution**:
1. Check if domain already exists
2. Verify email is unique
3. Ensure Cloud Functions are deployed: `firebase deploy --only functions`
4. Check Firebase Console > Functions for errors

## Quick Reference

### Super Admin Login
```
URL: https://projectk-618c3.web.app/login
Email: admin@ofdlabs.store
Password: [Your secure password]
```

### Create Super Admin
```bash
node scripts/createSuperAdmin.js
```

### Deploy Application
```bash
npm run build
firebase deploy --only hosting
```

### Deploy Functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## Support

For issues or questions:
1. Check Firebase Console > Functions for errors
2. Check browser console for client-side errors
3. Review Firestore security rules
4. Check this documentation

---

## Summary

✅ **Single dashboard for all customer management**
✅ **No command-line needed for daily operations**
✅ **Real-time feature toggling**
✅ **Secure access control**
✅ **Easy customer onboarding**
✅ **Professional UI**

The Super Admin Dashboard gives OFD Labs complete control over all customer organizations from one beautiful, easy-to-use interface.
