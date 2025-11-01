# Deployment Instructions for Leave Management Updates

## Changes Made

### 1. Fixed Permission Issues
- **Updated Firestore Rules** to allow employees to create leave requests
- Added rules for `leaveRequests` and `leavePolicies` collections

### 2. Added Email Notifications
- **Leave Request Created**: Admins receive notification when employee submits leave
- **Leave Status Updated**: Employee receives notification when leave is approved/rejected
- Email content is currently logged to console (ready for email service integration)

### 3. Leave Policy Management
- Admins can now update leave policies in Organization Settings
- Batch update feature to apply leave changes to all employees at once

## Deployment Steps

### Step 1: Deploy Firestore Rules

This is **CRITICAL** - without this, leave requests will fail with permission errors.

```bash
# From project root
firebase deploy --only firestore:rules
```

**Verify deployment**:
```bash
firebase firestore:rules:get
```

### Step 2: Deploy Cloud Functions

```bash
# Navigate to functions directory
cd functions

# Install dependencies (if not already done)
npm install

# Deploy functions
firebase deploy --only functions
```

**Expected output**: You should see these new functions deployed:
- `onLeaveRequestCreated`
- `onLeaveRequestUpdated`

### Step 3: Test the Changes

#### Test 1: Leave Request Creation
1. Log in as an **employee**
2. Navigate to "Leave Management"
3. Submit a new leave request
4. **Expected**: Request should be created successfully (no permission error)

#### Test 2: View Notifications in Logs
```bash
# Watch function logs in real-time
firebase functions:log --only onLeaveRequestCreated,onLeaveRequestUpdated
```

When a leave is created or updated, you'll see the email notification content in the logs.

#### Test 3: Leave Approval
1. Log in as an **admin**
2. Navigate to "Leave Management"
3. Approve or reject a leave request
4. Check the function logs to see the notification sent to the employee

#### Test 4: Leave Policy Update
1. Log in as an **admin**
2. Navigate to "Organization Settings" → "Leave Policy" tab
3. Update leave entitlements (e.g., Annual: 25 days)
4. Click "Save Leave Policy"
5. Click "Apply to All Employees"
6. **Expected**: All active employees' leave balances updated

## Troubleshooting

### Issue: "Permission denied" error when creating leave

**Solution**: Ensure Firestore rules are deployed
```bash
firebase deploy --only firestore:rules
```

### Issue: Functions not triggering

**Solution**: Check function deployment status
```bash
firebase functions:list
```

If functions are not listed, redeploy:
```bash
cd functions
firebase deploy --only functions
```

### Issue: Can't see function logs

**Solution**: Ensure you're looking at the correct project
```bash
firebase use --list
firebase use <your-project-id>
firebase functions:log
```

## Setting Up Email Delivery (Optional)

Currently, email notifications are logged to the console. To send actual emails:

1. **Read the EMAIL_SETUP.md guide** for detailed instructions
2. Choose an email service (SendGrid, Gmail, or Mailgun)
3. Follow the setup steps in EMAIL_SETUP.md
4. Redeploy functions after configuration

## Verification Checklist

- [ ] Firestore rules deployed successfully
- [ ] Cloud Functions deployed successfully
- [ ] Employee can create leave requests without permission errors
- [ ] Admin receives notification when leave is requested (check logs)
- [ ] Employee receives notification when leave is approved/rejected (check logs)
- [ ] Admin can update leave policy in Organization Settings
- [ ] Admin can apply leave policy to all employees

## Quick Deploy Command

To deploy everything at once:

```bash
# From project root
firebase deploy --only firestore:rules,functions
```

## Rollback (If Needed)

If something goes wrong, you can rollback:

```bash
# Rollback functions
firebase functions:delete onLeaveRequestCreated
firebase functions:delete onLeaveRequestUpdated

# Restore previous Firestore rules (if you have a backup)
firebase deploy --only firestore:rules
```

## Support

If you encounter any issues:

1. Check Firebase Console → Functions → Logs
2. Check Firebase Console → Firestore → Rules
3. Verify user authentication tokens have correct claims (orgId, role)
4. Check browser console for client-side errors

## Next Steps

1. Deploy the changes using the steps above
2. Test thoroughly in development/staging
3. Set up email service for production (see EMAIL_SETUP.md)
4. Monitor function logs for any errors
5. Collect user feedback on the new features
