# OFD Labs - Dual Role Setup

## Overview

OFD Labs serves **two roles**:

1. **Parent Company (Super Admin)** - Manages all customer organizations
2. **Customer (Regular Admin)** - Uses the payroll system for its own employees

## Why Two Accounts?

### Separation of Concerns

**Super Admin Account** (`admin@ofdlabs.store`):
- ✅ Manages all customers
- ✅ Onboards new organizations
- ✅ Controls feature flags
- ✅ Views system-wide statistics
- ❌ Cannot manage OFD Labs employees (by design)
- ❌ Cannot upload payroll for OFD Labs

**Regular Admin Account** (`payroll@ofdlabs.store`):
- ✅ Manages OFD Labs employees
- ✅ Uploads payroll for OFD Labs
- ✅ Handles leave requests
- ✅ Manages attendance
- ❌ Cannot see other customers
- ❌ Cannot manage system features

## Account Structure

```
OFD Labs Organization (orgId: 'ofdlabs')
│
├── Super Admin Account
│   ├── Email: admin@ofdlabs.store
│   ├── Role: superadmin
│   ├── Access: /superadmin/dashboard
│   └── Purpose: Manage all customers
│
└── Regular Admin Account
    ├── Email: payroll@ofdlabs.store
    ├── Role: admin
    ├── Access: /admin/dashboard
    └── Purpose: Manage OFD Labs employees
```

## Setup Process

### Step 1: Run the Setup Script

```bash
node scripts/createSuperAdmin.js
```

### Step 2: Create Super Admin

```
Super Admin Email: admin@ofdlabs.store
Super Admin Password: [Strong Password]
First Name: OFD
Last Name: Labs
```

### Step 3: Create Regular Admin

When prompted:
```
Create regular admin for OFD Labs payroll? yes

Regular Admin Email: payroll@ofdlabs.store
Regular Admin Password: [Strong Password]
First Name: Payroll
Last Name: Manager
```

### Step 4: Result

You'll get **two sets of credentials**:

**Super Admin:**
```
Email: admin@ofdlabs.store
Password: [Your password]
Role: Super Admin
Purpose: Manage customers
```

**Regular Admin:**
```
Email: payroll@ofdlabs.store
Password: [Your password]
Role: Admin
Purpose: Manage OFD Labs employees
```

## Usage Scenarios

### Scenario 1: Onboard a New Customer

**Use**: Super Admin Account (`admin@ofdlabs.store`)

1. Login with super admin credentials
2. Go to `/superadmin/dashboard`
3. Click "New Customer"
4. Create customer organization
5. Send credentials to customer

### Scenario 2: Add OFD Labs Employee

**Use**: Regular Admin Account (`payroll@ofdlabs.store`)

1. Login with regular admin credentials
2. Go to `/admin/dashboard`
3. Click "User Management"
4. Add new employee for OFD Labs
5. Employee can login and view their data

### Scenario 3: Upload OFD Labs Payroll

**Use**: Regular Admin Account (`payroll@ofdlabs.store`)

1. Login with regular admin credentials
2. Go to "Payroll Upload"
3. Upload Excel file with OFD Labs employee salaries
4. Employees can view their payslips

### Scenario 4: Manage Customer Features

**Use**: Super Admin Account (`admin@ofdlabs.store`)

1. Login with super admin credentials
2. Go to "Manage Features"
3. Select customer
4. Toggle features
5. Save changes

## Real-World Example

### Morning: Manage Customers (Super Admin)

```
Login: admin@ofdlabs.store
Dashboard: /superadmin/dashboard

Tasks:
- Onboard new customer "ABC Corp"
- Enable geofencing for "XYZ School"
- Review customer statistics
- Check growth metrics
```

### Afternoon: Manage OFD Labs (Regular Admin)

```
Login: payroll@ofdlabs.store
Dashboard: /admin/dashboard

Tasks:
- Add 5 new OFD Labs employees
- Upload monthly payroll
- Approve leave requests
- Review attendance
```

## Benefits

### Security
✅ **Separation of duties**: Super admin can't accidentally modify OFD Labs data
✅ **Access control**: Each account has appropriate permissions
✅ **Audit trail**: Clear distinction between customer management and internal operations

### Organization
✅ **Clear roles**: Know which account to use for which task
✅ **No confusion**: Super admin dashboard vs regular admin dashboard
✅ **Professional**: Proper separation like enterprise systems

### Flexibility
✅ **Multiple admins**: Can have multiple people managing OFD Labs
✅ **Different passwords**: More secure than single account
✅ **Independent**: OFD Labs operations don't affect customer management

## Quick Reference

### Super Admin Tasks
| Task | Account | Dashboard |
|------|---------|-----------|
| Onboard customers | `admin@ofdlabs.store` | `/superadmin/dashboard` |
| Manage features | `admin@ofdlabs.store` | `/superadmin/dashboard` |
| View all customers | `admin@ofdlabs.store` | `/superadmin/dashboard` |
| System statistics | `admin@ofdlabs.store` | `/superadmin/dashboard` |

### Regular Admin Tasks
| Task | Account | Dashboard |
|------|---------|-----------|
| Add OFD Labs employees | `payroll@ofdlabs.store` | `/admin/dashboard` |
| Upload OFD Labs payroll | `payroll@ofdlabs.store` | `/admin/dashboard` |
| Manage OFD Labs leaves | `payroll@ofdlabs.store` | `/admin/dashboard` |
| View OFD Labs reports | `payroll@ofdlabs.store` | `/admin/dashboard` |

## Additional Admins

You can create more admin accounts for OFD Labs:

```bash
# Use the super admin dashboard to create more admins
# Or use the existing createUser function in admin dashboard
```

**Example additional accounts:**
- `hr@ofdlabs.store` - HR Manager
- `finance@ofdlabs.store` - Finance Manager
- `operations@ofdlabs.store` - Operations Manager

All with `role: 'admin'` and `orgId: 'ofdlabs'`

## Employee Accounts

OFD Labs employees get regular employee accounts:

```
Email: john.doe@ofdlabs.store
Role: employee
orgId: ofdlabs
Access: /employee/dashboard
```

They can:
- View their own payslips
- Request leaves
- View timetable (if enabled)
- Update profile
- Mark attendance

## Summary

```
┌─────────────────────────────────────────────────────────┐
│                    OFD Labs Structure                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Super Admin (admin@ofdlabs.store)                     │
│  └─> Manages: All customer organizations               │
│                                                         │
│  Regular Admin (payroll@ofdlabs.store)                 │
│  └─> Manages: OFD Labs employees & payroll             │
│                                                         │
│  Employees (employee@ofdlabs.store)                    │
│  └─> View: Own payslips, leaves, profile               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Best Practices

1. **Use super admin only for customer management**
2. **Use regular admin for day-to-day OFD Labs operations**
3. **Create separate accounts for different departments**
4. **Keep credentials secure and separate**
5. **Document who has which account**

---

This dual-role setup gives you the **best of both worlds**: manage customers professionally while using your own system for OFD Labs operations!
