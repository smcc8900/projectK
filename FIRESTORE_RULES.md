# Firestore Security Rules

This document contains the recommended Firestore security rules for the Payroll System application.

## How to Apply These Rules

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy and paste the rules below
5. Click **Publish**

## Recommended Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user belongs to the organization
    function belongsToOrg(orgId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationId == orgId;
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own document
      allow read: if isAuthenticated() && request.auth.uid == userId;
      
      // Admins can read all users in their organization
      allow read: if isAdmin() && belongsToOrg(resource.data.organizationId);
      
      // Only admins can create/update/delete users
      allow create, update, delete: if isAdmin();
    }
    
    // Organizations collection
    match /organizations/{orgId} {
      // Users can read their own organization
      allow read: if isAuthenticated() && belongsToOrg(orgId);
      
      // Only admins can update organization settings
      allow update: if isAdmin() && belongsToOrg(orgId);
      
      // Only system admins can create/delete organizations (handled via Cloud Functions)
      allow create, delete: if false;
    }
    
    // Payslips collection
    match /payslips/{payslipId} {
      // Users can read their own payslips
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      
      // Admins can read all payslips in their organization
      allow read: if isAdmin() && belongsToOrg(resource.data.organizationId);
      
      // Only admins can create/update/delete payslips
      allow create, update, delete: if isAdmin() && 
                                       belongsToOrg(request.resource.data.organizationId);
    }
    
    // Upload history collection
    match /uploadHistory/{historyId} {
      // Only admins can read/write upload history
      allow read, write: if isAdmin() && belongsToOrg(resource.data.organizationId);
    }
    
    // Timetables collection
    match /timetables/{timetableId} {
      // Teachers can read their own timetable
      allow read: if isAuthenticated() && 
                     resource.data.teacherId == request.auth.uid;
      
      // Admins can read all timetables in their organization
      allow read: if isAdmin() && belongsToOrg(resource.data.organizationId);
      
      // Only admins can create/update/delete timetables
      allow create, update, delete: if isAdmin() && 
                                       belongsToOrg(request.resource.data.organizationId);
    }
    
    // Leave requests collection
    match /leaveRequests/{requestId} {
      // Users can read their own leave requests
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      
      // Admins can read all leave requests in their organization
      allow read: if isAdmin() && belongsToOrg(resource.data.organizationId);
      
      // Users can create their own leave requests
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid &&
                       belongsToOrg(request.resource.data.organizationId);
      
      // Only admins can update/delete leave requests (for approval/rejection)
      allow update, delete: if isAdmin() && belongsToOrg(resource.data.organizationId);
    }
    
    // Leave policies collection
    match /leavePolicies/{policyId} {
      // All authenticated users can read leave policies for their organization
      allow read: if isAuthenticated() && belongsToOrg(policyId);
      
      // Only admins can create/update leave policies
      allow create, update: if isAdmin() && belongsToOrg(policyId);
      
      // Prevent deletion of leave policies
      allow delete: if false;
    }
  }
}
```

## Testing the Rules

After applying the rules, test them by:

1. **As Employee:**
   - Try accessing your timetable
   - Try submitting a leave request
   - Try viewing colleagues
   - Verify you can only see your own data

2. **As Admin:**
   - Try creating timetable entries
   - Try approving/rejecting leave requests
   - Try viewing all users
   - Verify you can manage all data in your organization

## Common Issues

### Permission Denied Errors

If you see "permission-denied" errors:

1. **Check user role:** Ensure the user document has the correct `role` field (`admin` or `employee`)
2. **Check organizationId:** Ensure all documents have the correct `organizationId` field
3. **Check authentication:** Ensure the user is properly logged in

### Creating Initial Admin User

To create your first admin user:

1. Create the user via Firebase Authentication
2. Manually add a document in the `users` collection with:
   ```json
   {
     "email": "admin@example.com",
     "role": "admin",
     "organizationId": "your-org-id",
     "createdAt": "2025-01-01T00:00:00.000Z"
   }
   ```

## Development Mode (Temporary)

For development/testing only, you can use more permissive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **WARNING:** Never use development rules in production!

## Need Help?

If you continue to experience permission issues:

1. Check the Firebase Console → Firestore → Rules tab
2. Use the Rules Playground to test specific operations
3. Check browser console for detailed error messages
4. Verify user authentication state and role
