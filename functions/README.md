# Cloud Functions - Email Notifications

This directory contains Firebase Cloud Functions that handle automated email notifications for the HR Management System.

## Features

✅ **Automated Email Notifications**
- Leave request notifications to admins
- Leave approval/rejection notifications to employees
- Welcome emails for new employees
- Payslip availability notifications

✅ **Professional Email Templates**
- Responsive HTML design
- Color-coded status indicators
- Complete information display
- Mobile-friendly layout

✅ **Flexible Configuration**
- Works without email service (logs to console)
- Easy SendGrid integration
- Environment-based configuration

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Email Service (Optional)
```bash
# Set SendGrid API key
firebase functions:config:set sendgrid.key="YOUR_API_KEY"

# Set sender email
firebase functions:config:set email.from="noreply@yourdomain.com"
```

### 3. Deploy
```bash
firebase deploy --only functions
```

## File Structure

```
functions/
├── src/
│   ├── index.js           # Main Cloud Functions
│   ├── emailService.js    # Email service & templates
│   └── createAdmin.js     # Admin creation function
├── package.json           # Dependencies
└── README.md             # This file
```

## Available Functions

### Firestore Triggers

1. **onUserCreated** - Sends welcome email when new user is created
   - Trigger: `users/{userId}` onCreate
   - Recipient: New employee
   - Template: `welcomeEmail`

2. **onPayslipCreated** - Notifies employee when payslip is generated
   - Trigger: `payslips/{payslipId}` onCreate
   - Recipient: Employee
   - Template: `payslipNotification`

3. **onLeaveRequestCreated** - Notifies admins of new leave requests
   - Trigger: `leaveRequests/{requestId}` onCreate
   - Recipients: All organization admins
   - Template: `leaveRequestToAdmin`

4. **onLeaveRequestUpdated** - Notifies employee of leave status change
   - Trigger: `leaveRequests/{requestId}` onUpdate
   - Recipient: Employee who requested leave
   - Templates: `leaveApprovedToEmployee` or `leaveRejectedToEmployee`

### Callable Functions

1. **setUserClaims** - Sets custom claims for user authentication
2. **createUser** - Creates new user with auth and Firestore entry
3. **deleteUser** - Removes user from Auth and Firestore
4. **createOrganizationAdmin** - Creates organization and admin user

### Scheduled Functions

1. **cleanupOldUploads** - Removes old files from storage (runs daily)

## Email Templates

All templates are defined in `src/emailService.js`:

- **leaveRequestToAdmin**: Professional notification with all leave details
- **leaveApprovedToEmployee**: Celebratory approval notification
- **leaveRejectedToEmployee**: Polite rejection with next steps
- **welcomeEmail**: Welcoming onboarding email
- **payslipNotification**: Payslip availability alert

### Customizing Templates

Edit `src/emailService.js` → `getEmailTemplate` function:

```javascript
const templates = {
  yourNewTemplate: {
    subject: 'Your Subject',
    html: `
      <!DOCTYPE html>
      <html>
        <!-- Your HTML here -->
      </html>
    `
  }
};
```

## Development Mode

Without SendGrid configuration, emails are logged to console:

```bash
# View logs
firebase functions:log

# Or watch in real-time
firebase functions:log --only onLeaveRequestCreated
```

## Environment Configuration

### View Current Config
```bash
firebase functions:config:get
```

### Set Config Values
```bash
firebase functions:config:set key.subkey="value"
```

### Required Config (for production emails)
- `sendgrid.key` - SendGrid API key
- `email.from` - Verified sender email address

## Testing

### Local Testing
```bash
# Start emulator
firebase emulators:start --only functions

# In another terminal, trigger functions via your app
```

### Production Testing
1. Deploy functions: `firebase deploy --only functions`
2. Trigger events in your app
3. Check logs: `firebase functions:log`
4. Verify emails in inbox

## Troubleshooting

### Functions not deploying?
- Check Node.js version (should be 20)
- Run `npm install` first
- Verify Firebase project is initialized

### Emails not sending?
- Check `firebase functions:log` for errors
- Verify SendGrid config: `firebase functions:config:get`
- Check SendGrid dashboard for delivery status
- Ensure sender email is verified in SendGrid

### Permission errors?
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Check user authentication
- Verify custom claims are set

## Dependencies

- `firebase-admin`: ^12.0.0 - Firebase Admin SDK
- `firebase-functions`: ^4.5.0 - Cloud Functions SDK
- `@sendgrid/mail`: ^8.1.0 - SendGrid email service
- `cors`: ^2.8.5 - CORS middleware

## Performance

- **Cold start**: ~2-3 seconds
- **Warm execution**: <500ms
- **Email delivery**: 1-5 seconds (via SendGrid)

## Cost Optimization

- Functions run only on events (no idle costs)
- SendGrid free tier: 100 emails/day
- Scheduled cleanup reduces storage costs

## Security

- Environment variables for sensitive data
- Custom claims for role-based access
- Organization-scoped operations
- Input validation on all functions

## Support

For detailed setup instructions, see:
- `../QUICK_EMAIL_SETUP.md` - Quick start guide
- `../EMAIL_SETUP.md` - Comprehensive documentation

## License

Part of the HR Management System project.
