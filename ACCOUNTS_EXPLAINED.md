# OFD Labs Account Structure - Simple Explanation

## Two Accounts, Two Purposes

### 🔐 Account 1: Super Admin
**Email**: `admin@ofdlabs.store`  
**Role**: `superadmin`  
**Dashboard**: `/superadmin/dashboard`

**What you do with this account:**
- ✅ Onboard new customers (ABC Corp, XYZ School, etc.)
- ✅ Manage customer features (enable/disable features per customer)
- ✅ View all customers and statistics
- ✅ System-wide management

**What you CANNOT do:**
- ❌ Add OFD Labs employees
- ❌ Upload OFD Labs payroll
- ❌ Manage OFD Labs day-to-day operations

---

### 👔 Account 2: Regular Admin
**Email**: `payroll@ofdlabs.store`  
**Role**: `admin`  
**Dashboard**: `/admin/dashboard`

**What you do with this account:**
- ✅ Add OFD Labs employees
- ✅ Upload OFD Labs payroll
- ✅ Manage OFD Labs leaves
- ✅ View OFD Labs attendance
- ✅ All normal admin features for OFD Labs

**What you CANNOT do:**
- ❌ See other customers
- ❌ Onboard new customers
- ❌ Manage system features

---

## Why Two Accounts?

### Think of it like this:

**Super Admin** = CEO managing multiple companies
- You oversee all your customer companies
- You decide what features each company gets
- You don't handle day-to-day operations

**Regular Admin** = HR Manager of OFD Labs
- You manage OFD Labs employees
- You handle OFD Labs payroll
- You do the daily HR work

---

## Real-World Usage

### Monday Morning - Managing Customers
```
Login: admin@ofdlabs.store (Super Admin)
Task: Onboard new customer "Springfield School"

Steps:
1. Login to super admin dashboard
2. Click "New Customer"
3. Create Springfield School
4. Send credentials to them
5. Done! ✅
```

### Monday Afternoon - OFD Labs Payroll
```
Login: payroll@ofdlabs.store (Regular Admin)
Task: Upload monthly payroll for OFD Labs employees

Steps:
1. Login to regular admin dashboard
2. Go to "Payroll Upload"
3. Upload OFD Labs salary Excel
4. Employees can see their payslips
5. Done! ✅
```

---

## Visual Structure

```
┌──────────────────────────────────────────────────┐
│              OFD Labs Organization               │
│                 (orgId: ofdlabs)                 │
└──────────────────┬───────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌───────────────┐    ┌────────────────┐
│  Super Admin  │    │ Regular Admin  │
│               │    │                │
│ admin@        │    │ payroll@       │
│ ofdlabs.store │    │ ofdlabs.store  │
│               │    │                │
│ Manages:      │    │ Manages:       │
│ - Customers   │    │ - OFD Labs     │
│ - Features    │    │   Employees    │
│ - System      │    │ - Payroll      │
└───────────────┘    └────────────────┘
```

---

## Quick Comparison

| Task | Super Admin | Regular Admin |
|------|-------------|---------------|
| Onboard new customer | ✅ Yes | ❌ No |
| Manage customer features | ✅ Yes | ❌ No |
| View all customers | ✅ Yes | ❌ No |
| Add OFD Labs employees | ❌ No | ✅ Yes |
| Upload OFD Labs payroll | ❌ No | ✅ Yes |
| Manage OFD Labs leaves | ❌ No | ✅ Yes |
| View OFD Labs reports | ❌ No | ✅ Yes |

---

## When to Use Which Account?

### Use Super Admin When:
- 🆕 Creating a new customer organization
- 🎛️ Enabling/disabling features for customers
- 📊 Viewing system-wide statistics
- 🔍 Checking all customer organizations

### Use Regular Admin When:
- 👥 Adding OFD Labs employees
- 💰 Uploading OFD Labs payroll
- 📝 Approving OFD Labs leave requests
- 📈 Viewing OFD Labs reports
- ⏰ Managing OFD Labs attendance

---

## Setup Command

```bash
node scripts/createSuperAdmin.js
```

**The script will create BOTH accounts for you!**

Just answer the prompts:
1. Super admin details → Creates `admin@ofdlabs.store`
2. Regular admin? → Answer "yes" → Creates `payroll@ofdlabs.store`

---

## Summary

✅ **Two accounts, same organization (OFD Labs)**  
✅ **Different roles, different purposes**  
✅ **Super Admin = Manage customers**  
✅ **Regular Admin = Manage OFD Labs**  
✅ **Both needed for complete functionality**

This is the **professional way** to separate system management from day-to-day operations!
