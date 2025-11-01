# Enterprise Payroll Management System

A multi-tenant SaaS payroll management system built with React and Firebase, where organizations can manage employees and process monthly payroll via Excel uploads.

## Key Features

- **Multi-Tenancy**: Support for multiple organizations with complete data isolation
- **Role-Based Access Control**: Admin and Employee roles with different permissions
- **DBA-Controlled Access**: Initial admins created by DBA when organizations sign contracts
- **Admin User Creation**: Admins can create both employees and additional admins
- **Excel Upload**: Monthly payroll processing via Excel file upload
- **Payslip Management**: Generate, view, and download payslips as PDF
- **Real-time Dashboard**: Analytics and insights for admins and employees
- **Mobile-First Design**: Responsive UI optimized for mobile devices
- **Audit Trail**: Complete history of all payroll uploads
- **Secure**: Firebase Authentication with custom claims and Firestore security rules

## Tech Stack

- **Frontend**: React.js with Tailwind CSS (Mobile-First)
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **File Processing**: xlsx library for Excel parsing
- **PDF Generation**: jsPDF for payslip PDF generation
- **Build Tool**: Vite

## Access Model

### Initial Setup (DBA Process)

**Only DBAs can create the first admin user** when an organization signs a contract:

1. DBA runs the admin creation script (see `DBA_GUIDE.md`)
2. Organization and first admin user are created
3. Admin credentials are securely shared with the organization
4. Admin logs in and creates additional users for their organization

### User Creation

- **Admins** can create:
  - Employees
  - Other admins (for their organization)
- **No public registration** - All users are created by admins

## Project Structure

```
projectK/
├── src/
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   ├── admin/         # Admin dashboard components
│   │   ├── employee/      # Employee portal components
│   │   ├── common/        # Shared layout components (mobile-responsive)
│   │   └── shared/        # Reusable UI components
│   ├── contexts/          # React contexts (Auth)
│   ├── services/          # Firebase service layer
│   ├── utils/             # Utility functions
│   ├── App.jsx            # Main application component
│   └── index.jsx          # Application entry point
├── functions/             # Firebase Cloud Functions
│   └── src/
│       ├── index.js       # Main functions
│       └── createAdmin.js # DBA admin creation function
├── scripts/
│   └── createAdmin.js     # DBA script for creating admins
├── firestore.rules        # Firestore security rules
├── storage.rules          # Firebase Storage security rules
└── firebase.json          # Firebase configuration
```

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project

### 1. Clone and Install

```bash
cd projectK
npm install
cd functions && npm install && cd ..
```

### Organization Types & Feature Flags

This application supports multiple organization types with different feature sets to accommodate both educational institutes and corporate companies.

### Multi-Tenancy Architecture

This application supports **multiple organizations** with a **single codebase**. Each organization can have:
- Their own subdomain (e.g., `abccorp.yourapp.com`, `xyzschool.yourapp.com`)
- Custom features based on organization type
- Isolated data (users can only see their organization's data)

### Organization Types

1. **Education** (`type: 'education'`) - For schools, colleges
   - ✅ All features including Timetable Management
   
2. **Corporate** (`type: 'corporate'`) - For companies
   - ✅ Payslips, Leaves, Colleagues, Profile
   - ❌ Timetable Management (hidden)
   
3. **Full** (`type: 'full'` or default) - All features enabled

### Onboarding New Clients

Use the Cloud Function to create a new organization:

```javascript
// Call the createOrganizationAdmin function
const result = await functions.httpsCallable('createOrganizationAdmin')({
  orgName: 'ABC Corporation',
  domain: 'abccorp.com',           // Their subdomain or email domain
  adminEmail: 'admin@abccorp.com',
  adminPassword: 'SecurePassword123',
  firstName: 'John',
  lastName: 'Doe',
  orgType: 'corporate',            // 'education', 'corporate', or 'full'
  currency: 'USD',
  timezone: 'America/New_York'
});
```

This creates:
- Organization document with `type` field
- Admin user with proper claims
- User document linked to organization

### Subdomain Setup (Optional)

#### Option 1: Single Domain (Current Setup)
All organizations use: `yourapp.com`
- Users identified by email domain
- Login detects organization automatically

#### Option 2: Subdomain Per Organization
Each organization gets: `{subdomain}.yourapp.com`

**DNS Setup:**
1. Add wildcard DNS record: `*.yourapp.com` → Your hosting IP
2. Configure Firebase Hosting for custom domains
3. Update organization document with subdomain:
```json
{
  "domain": "abccorp",  // becomes abccorp.yourapp.com
  "type": "corporate"
}
```

**Detect Subdomain in App:**
```javascript
// In Login.jsx or App.jsx
const subdomain = window.location.hostname.split('.')[0];
const org = await getOrganizationByDomain(subdomain);
```

### Feature Flags

| Feature | Education | Corporate | Full |
|---------|-----------|-----------|------|
| Timetable | ✅ | ❌ | ✅ |
| Leaves | ✅ | ✅ | ✅ |
| Colleagues | ✅ | ✅ | ✅ |
| Payslips | ✅ | ✅ | ✅ |
| Profile | ✅ | ✅ | ✅ |

### 2. Firebase Configuration

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Create a Storage bucket
5. Copy your Firebase config

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Firebase Initialization

```bash
firebase login
firebase init
```

Select:
- Firestore
- Storage
- Functions
- Hosting

### 5. Deploy Security Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 6. Create Firestore Indexes

The indexes are defined in `firestore.indexes.json`. Deploy them:

```bash
firebase deploy --only firestore:indexes
```

### 7. Deploy Cloud Functions

```bash
firebase deploy --only functions
```

### 8. Create First Admin (DBA Only)

See `DBA_GUIDE.md` for detailed instructions on creating the initial admin user.

### 9. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

### DBA Workflow (Initial Setup)

1. **Create Admin**: Use `scripts/createAdmin.js` or Cloud Function
2. **Share Credentials**: Securely provide admin credentials to organization
3. **Verify Access**: Ensure admin can login and access dashboard

### Admin Workflow

1. **Login**: Sign in with DBA-provided credentials
2. **Add Users**: Create employees and additional admins via User Management
3. **Upload Payroll**: Navigate to Upload Payroll and upload Excel file
4. **Monitor**: View upload history and all generated payslips

### Employee Workflow

1. **Login**: Sign in with credentials provided by admin
2. **View Dashboard**: See latest payslip and year-to-date earnings
3. **Access Payslips**: View all payslips and download as PDF

### Excel File Format

The Excel file should contain the following columns:

| Column | Required | Description |
|--------|----------|-------------|
| Email | Yes | Employee email address |
| Employee ID | No | Employee identification number |
| Basic Salary | Yes* | Base salary amount |
| HRA | No | House Rent Allowance |
| Allowances | No | Other allowances |
| Bonus | No | Bonus amount |
| Tax | No | Tax deductions |
| PF | No | Provident Fund |
| Insurance | No | Insurance deductions |
| Month | Yes | Month (1-12) |
| Year | Yes | Year (e.g., 2025) |

*At least one salary component is required

Example:
```
Email,Employee ID,Basic Salary,HRA,Allowances,Bonus,Tax,PF,Insurance,Month,Year
john@company.com,EMP001,5000,2000,1000,500,800,600,200,10,2025
```

## Mobile-First Design

The application is designed mobile-first with:
- Responsive navigation with hamburger menu on mobile
- Touch-friendly buttons and forms
- Optimized layouts for small screens
- Progressive enhancement for larger screens

## Database Schema

### Collections

1. **organizations**: Organization details and settings
2. **users**: User profiles and authentication info
3. **payslips**: Employee payslip records
4. **uploadHistory**: Audit trail of payroll uploads

See the design document for detailed schema information.

## Security

- **Authentication**: Firebase Auth with email/password
- **Authorization**: Custom claims for role-based access
- **Data Isolation**: All queries filtered by `orgId`
- **Security Rules**: Firestore and Storage rules enforce multi-tenancy
- **Input Validation**: Client and server-side validation
- **No Public Registration**: All users created by admins or DBA

## Cloud Functions

- `setUserClaims`: Sets custom claims for authentication
- `createUser`: Creates users with auth and Firestore records (called by admins)
- `createOrganizationAdmin`: Creates organization and first admin (DBA only)
- `deleteUser`: Removes users from both Auth and Firestore
- `cleanupOldUploads`: Scheduled cleanup of old Excel files

## Build for Production

```bash
npm run build
firebase deploy
```

## Troubleshooting

### Custom Claims Not Working

After user creation, users need to sign out and sign back in to get updated claims.

### Firestore Indexes

If you encounter index errors, Firestore will provide a link to create the required index automatically.

### DBA Script Errors

- Ensure service account key is in `functions/serviceAccountKey.json`
- Verify Firebase Admin SDK is initialized correctly
- Check organization domain is unique

## Future Enhancements

- Email notifications for payslip generation
- Bulk user import via Excel
- Advanced reporting and analytics
- Mobile app (React Native)
- Integration with accounting software
- Multiple currency support
- Tax calculation automation
- Password reset flow for employees

## License

This project is proprietary software. All rights reserved.

## Support

For support, please contact your system administrator.
# projectK
