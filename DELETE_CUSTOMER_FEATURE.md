# Delete Customer Feature - Super Admin

## Overview

Super admins can now delete customer organizations and all associated data with a single click. This is a powerful cleanup tool for removing test customers or deactivated organizations.

## What Gets Deleted

When you delete an organization, the system performs a **cascade delete** of all related data:

### ✅ Firestore Collections Cleaned

1. **Users** - All user documents for that organization
2. **Payslips** - All salary slips and payroll data
3. **Upload History** - All payroll upload records
4. **Timetables** - All class/shift schedules
5. **Leaves** - All leave requests and approvals
6. **Attendance** - All attendance records
7. **Organization** - The organization document itself

### ⚠️ What Doesn't Get Deleted

**Firebase Authentication users** are NOT deleted automatically. This is intentional for security reasons.

If you need to delete Auth users:
1. Go to: https://console.firebase.google.com/project/projectk-618c3/authentication/users
2. Manually delete the users for that organization

## How to Use

### Step 1: Access Super Admin Dashboard

1. Login as super admin at: https://ofdlabs.store/login
2. Go to **Overview** tab
3. Find the customer in the list

### Step 2: Delete Customer

1. Click the **trash icon** (🗑️) next to "Manage Features"
2. Review the confirmation modal
3. Check what will be deleted:
   - Number of users
   - All associated data
4. Click **"Delete Permanently"**

### Step 3: Confirmation

You'll see a success message showing:
- Number of users deleted
- Number of payslips deleted
- Number of uploads deleted
- Number of timetables deleted
- Number of leaves deleted
- Number of attendance records deleted

## Safety Features

### 🔒 Protection for OFD Labs

- **OFD Labs organization CANNOT be deleted**
- The delete button is hidden for OFD Labs
- If someone tries to delete it programmatically, it's blocked

### ⚠️ Confirmation Modal

Before deletion, you'll see:
- Organization name
- Number of users that will be deleted
- Complete list of what will be removed
- Warning that this cannot be undone
- Note about Firebase Auth users

### 🚫 No Accidental Deletions

- Two-step process (click trash, then confirm)
- Clear warning messages
- Detailed breakdown of what will be deleted

## Use Cases

### 1. Remove Test Organizations

After testing customer onboarding:
```
1. Create test org "Test Company"
2. Add test users and data
3. Test features
4. Delete "Test Company" when done
5. All test data is cleaned up
```

### 2. Deactivate Customer

When a customer stops using the service:
```
1. Customer cancels subscription
2. Delete their organization
3. All their data is removed
4. Clean database
```

### 3. Cleanup After Demo

After showing the system to prospects:
```
1. Create demo organization
2. Show features with sample data
3. Delete demo org after presentation
4. No leftover demo data
```

## Technical Details

### Cascade Delete Implementation

```javascript
deleteOrganization(orgId) {
  1. Query all users where orgId = orgId
  2. Query all payslips where orgId = orgId
  3. Query all uploads where orgId = orgId
  4. Query all timetables where orgId = orgId
  5. Query all leaves where orgId = orgId
  6. Query all attendance where orgId = orgId
  7. Delete all documents in parallel
  8. Delete organization document
  9. Return summary of deletions
}
```

### Performance

- Uses `Promise.all()` for parallel deletions
- Efficient batch operations
- Typically completes in 1-3 seconds
- Shows loading spinner during deletion

### Error Handling

- If any deletion fails, error is caught and displayed
- Partial deletions are possible (some data may remain)
- Check Firebase Console if errors occur

## Firestore Security Rules

Make sure your `firestore.rules` allows super admins to delete:

```javascript
// Super admins can delete any organization
match /organizations/{orgId} {
  allow delete: if request.auth != null && 
    request.auth.token.role == 'superadmin';
}

// Super admins can delete any user
match /users/{userId} {
  allow delete: if request.auth != null && 
    request.auth.token.role == 'superadmin';
}

// Similar rules for other collections...
```

## Best Practices

### ✅ Do

- Review the organization details before deleting
- Check the user count to ensure it's correct
- Export important data before deletion if needed
- Delete test organizations regularly to keep database clean

### ❌ Don't

- Delete organizations with active subscriptions without customer confirmation
- Delete OFD Labs (it's protected anyway)
- Delete without reviewing the confirmation modal
- Assume Firebase Auth users are deleted (they're not)

## Example Workflow

### Scenario: Remove Test Customer

```
1. Super admin creates test org "ABC Test Corp"
2. Adds 5 test users
3. Uploads test payroll data
4. Tests features for 2 days
5. Ready to clean up:
   
   a. Go to Super Admin Dashboard
   b. Find "ABC Test Corp" in list
   c. Click trash icon
   d. Modal shows:
      - 5 users will be deleted
      - 10 payslips will be deleted
      - 2 uploads will be deleted
      - etc.
   e. Click "Delete Permanently"
   f. Success! All data removed
   
6. Optionally: Go to Firebase Console > Auth
7. Delete the 5 test user accounts manually
```

## Monitoring

After deletion, verify in Firebase Console:

### Firestore
- Check `organizations` collection - org should be gone
- Check `users` collection - users should be gone
- Check `payslips` collection - payslips should be gone

### Authentication
- Users will still be there (manual deletion needed)

## Future Enhancements

Potential improvements:

1. **Auth User Cleanup** - Add Cloud Function to delete Auth users
2. **Soft Delete** - Mark as deleted instead of permanent deletion
3. **Audit Log** - Track who deleted what and when
4. **Bulk Delete** - Delete multiple organizations at once
5. **Export Before Delete** - Auto-export data before deletion

## Summary

✅ **Powerful cleanup tool**  
✅ **Cascade deletes all related data**  
✅ **Protected against accidental deletions**  
✅ **Clear confirmation and feedback**  
✅ **OFD Labs is protected**  
⚠️ **Firebase Auth users need manual cleanup**

This feature makes it easy to maintain a clean database by removing test customers and deactivated organizations!
