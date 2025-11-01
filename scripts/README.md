# Admin Scripts Guide

These scripts help you manage organizations and users in your multi-tenant payroll system.

## Prerequisites

1. **Service Account Key**: Download from Firebase Console
   - Go to: Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save as `functions/serviceAccountKey.json`

2. **Install Dependencies**:
   ```bash
   cd /Users/badreddy/projectK
   npm install
   ```

## Available Scripts

### 1. Create edu.tech.com Organization (Quick)

**Purpose**: Creates the edu.tech.com organization with predefined settings

**Usage**:
```bash
node scripts/createEduTech.js
```

**What it creates**:
- Organization: "Tech Education Institute"
- Domain: edu.tech.com
- Type: education (includes timetable)
- Admin: admin@edu.tech.com
- Password: TempPassword123!

**Output**: Login credentials for the client

---

### 2. Create Any Organization (Interactive)

**Purpose**: Prompts you for details to create any organization

**Usage**:
```bash
node scripts/createOrganization.js
```

**Prompts for**:
- Organization name
- Domain
- Organization type (education/corporate/full)
- Admin email & password
- Admin first & last name

**Example Session**:
```
Organization Name: ABC Corporation
Domain (e.g., edu.tech.com): abccorp.com
Choose type (1/2/3): 2
Admin Email: admin@abccorp.com
Admin Password: SecurePass123!
First Name: John
Last Name: Doe
```

---

### 3. Set Custom Claims (Existing Users)

**Purpose**: Add claims to users created manually in Firebase Console

**Usage**:
```bash
node scripts/setCustomClaims.js --uid=USER_UID --orgId=ORG_ID --role=admin
```

**Or interactive**:
```bash
node scripts/setCustomClaims.js
```

---

## Quick Start for edu.tech.com

### Step 1: Run the Script

```bash
cd /Users/badreddy/projectK
node scripts/createEduTech.js
```

### Step 2: Expected Output

```
✅ Firebase Admin initialized

🚀 Creating edu.tech.com Organization...

📋 Organization Details:
  Name: Tech Education Institute
  Domain: edu.tech.com
  Type: education
  Admin Email: admin@edu.tech.com

📝 Creating organization...
✅ Organization created
   ID: abc123xyz

👤 Creating admin user...
✅ Admin user created
   UID: def456uvw

🔐 Setting custom claims...
✅ Custom claims set

📄 Creating user document...
✅ User document created

════════════════════════════════════════════════════════════
🎉 SUCCESS! edu.tech.com is ready!
════════════════════════════════════════════════════════════

📧 Client Login Credentials:
────────────────────────────────────────────────────────────
  Login URL: https://projectk-618c3.web.app/login
  Email: admin@edu.tech.com
  Password: TempPassword123!
────────────────────────────────────────────────────────────

✨ Features Available:
  ✅ Dashboard
  ✅ User Management
  ✅ Payroll Upload
  ✅ Timetable Management (Education Feature)
  ✅ Leave Management
  ✅ Payslips
  ✅ Profile

⚠️  Important: Admin should change password after first login
```

### Step 3: Share with Client

Send them:
- Login URL: https://projectk-618c3.web.app/login
- Email: admin@edu.tech.com
- Password: TempPassword123!

---

## Creating More Clients

### Corporate Client Example

Edit `scripts/createEduTech.js` or use `scripts/createOrganization.js`:

```javascript
const orgData = {
  orgName: 'ABC Corporation',
  domain: 'abccorp.com',
  type: 'corporate',  // No timetable feature
  adminEmail: 'admin@abccorp.com',
  adminPassword: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
};
```

Then run:
```bash
node scripts/createOrganization.js
```

---

## Troubleshooting

### Error: Cannot find module 'serviceAccountKey.json'

**Solution**: Download service account key from Firebase Console
```bash
# Place it at:
/Users/badreddy/projectK/functions/serviceAccountKey.json
```

### Error: Organization already exists

**Solution**: The domain is already registered. Check Firestore:
```
Collections > organizations > search for domain
```

### Error: User already exists

**Solution**: Use a different email or delete the existing user from Firebase Auth

---

## Organization Types

| Type | Timetable | Leaves | Colleagues | Payslips | Profile |
|------|-----------|--------|------------|----------|---------|
| **education** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **corporate** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **full** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Security Notes

1. **Never commit serviceAccountKey.json** to git
2. **Change default passwords** immediately after first login
3. **Use strong passwords** for production
4. **Verify email addresses** before creating accounts

---

## Next Steps

After creating an organization:

1. ✅ Test login with provided credentials
2. ✅ Admin changes password
3. ✅ Admin adds employees via User Management
4. ✅ Admin uploads payroll data
5. ✅ Employees can login and view their data

---

For questions or issues, check the main README.md
