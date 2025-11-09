# Email Notification Setup Guide

This guide explains how to set up email notifications for your HR Management System.

## Current Implementation

The Cloud Functions are fully integrated with an email service and will trigger notifications for:
- ✅ **Leave Requests**: Admins receive notifications when employees apply for leave
- ✅ **Leave Approvals/Rejections**: Employees receive notifications when their leave is approved or rejected
- ✅ **New User Creation**: Welcome emails are sent to new employees
- ✅ **Payslip Generation**: Employees receive notifications when payslips are available

**Default Behavior**: Without SendGrid configuration, emails are logged to the console for development/testing.

## Viewing Email Notifications (Development)

To see the email notifications in development:

1. Deploy the Cloud Functions:
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

2. View the logs:
   ```bash
   firebase functions:log
   ```

3. When a leave request is created or updated, you'll see the email content in the logs.

## Email Templates Included

The system includes professionally designed HTML email templates:

1. **Leave Request Notification** (to Admins)
   - Employee details and contact information
   - Leave type, duration, and number of days
   - Reason for leave
   - Emergency contact (if provided)
   - Request ID for tracking

2. **Leave Approved Notification** (to Employee)
   - Confirmation of approval
   - Leave details summary
   - Admin comments (if any)
   - Reminder to complete pending work

3. **Leave Rejected Notification** (to Employee)
   - Rejection notice
   - Leave details
   - Reason for rejection
   - Next steps guidance

4. **Welcome Email** (to New Employees)
   - Welcome message with organization name
   - User credentials and role
   - Getting started checklist
   - HR contact information

5. **Payslip Notification** (to Employees)
   - Payslip availability notice
   - Period and net salary
   - Link to portal (implied)

## Setting Up Real Email Delivery (Production)

To send actual emails, you need to configure SendGrid. The system is already integrated and ready to use.

### SendGrid Setup (Recommended)

1. **Sign up for SendGrid**:
   - Go to https://sendgrid.com/
   - Create a free account (100 emails/day free)
   - Verify your sender email address

2. **Get API Key**:
   - Go to Settings > API Keys
   - Create a new API key with "Mail Send" permissions
   - Copy the API key

3. **Install Dependencies** (if not already installed):
   ```bash
   cd functions
   npm install
   ```

4. **Set Environment Variables**:
   ```bash
   firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
   firebase functions:config:set email.from="noreply@yourdomain.com"
   ```
   
   Replace:
   - `YOUR_SENDGRID_API_KEY` with your actual SendGrid API key
   - `noreply@yourdomain.com` with your verified sender email

5. **Deploy the Functions**:
   ```bash
   firebase deploy --only functions
   ```

6. **Test the Email System**:
   - Create a test leave request
   - Check that emails are sent (not just logged)
   - Verify emails arrive in inbox (check spam folder initially)

**That's it!** The email service is already integrated. Once you configure SendGrid, emails will be sent automatically.

### Alternative: Nodemailer with Gmail (Not Recommended for Production)

If you prefer to use Gmail instead of SendGrid:

1. **Install Nodemailer**:
   ```bash
   cd functions
   npm install nodemailer
   ```

2. **Modify `functions/src/emailService.js`**:
   Replace the SendGrid implementation with Nodemailer (see Nodemailer documentation)

**Note**: Gmail has daily sending limits (~500 emails/day) and is not recommended for production use.

## Testing Email Notifications

### Without SendGrid (Development Mode)
1. **Deploy the functions**:
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

2. **Trigger an event** (e.g., create a leave request)

3. **View logs**:
   ```bash
   firebase functions:log
   ```
   You'll see formatted email content in the console

### With SendGrid (Production Mode)
1. **Configure SendGrid** (see setup steps above)

2. **Test Leave Request Flow**:
   - Log in as an employee
   - Submit a leave request
   - Check admin email inbox for notification

3. **Test Approval/Rejection Flow**:
   - Log in as admin
   - Approve or reject a leave request
   - Check employee email inbox for notification

4. **Test Welcome Email**:
   - Create a new employee account
   - Check the new employee's email inbox

5. **Test Payslip Notification**:
   - Generate a payslip for an employee
   - Check employee email inbox

## Troubleshooting

### Emails not sending
- **Check logs**: `firebase functions:log`
- **Verify config**: `firebase functions:config:get`
- **Check SendGrid dashboard** for delivery status
- **Verify sender email** is verified in SendGrid
- **Check quotas**: SendGrid free tier allows 100 emails/day

### Permission errors
- Ensure Firestore rules are deployed: `firebase deploy --only firestore:rules`
- Check that Cloud Functions have proper permissions
- Verify user authentication tokens

### Emails going to spam
- **Verify sender domain** in SendGrid
- **Set up SPF, DKIM, and DMARC** records for your domain
- **Use professional sender email** (not gmail.com)
- **Avoid spam trigger words** in subject lines
- **Test with different email providers** (Gmail, Outlook, etc.)

### Function deployment errors
- Ensure Node.js version 20 is specified in `functions/package.json`
- Run `npm install` in the functions directory
- Check for syntax errors in the code
- Verify Firebase project is properly initialized

## Customizing Email Templates

Email templates are located in `functions/src/emailService.js`. To customize:

1. **Edit the template HTML** in the `getEmailTemplate` function
2. **Modify styling** in the `<style>` section
3. **Add new templates** by adding new cases to the templates object
4. **Test changes** by deploying and triggering events

**Available Templates**:
- `leaveRequestToAdmin` - Sent when employee applies for leave
- `leaveApprovedToEmployee` - Sent when leave is approved
- `leaveRejectedToEmployee` - Sent when leave is rejected
- `welcomeEmail` - Sent to new employees
- `payslipNotification` - Sent when payslip is generated

## Cost Considerations

- **SendGrid**: Free tier (100 emails/day), then $14.95/month for 40,000 emails
- **Gmail**: Free but limited to ~500 emails/day
- **Mailgun**: Free tier (5,000 emails/month), then pay-as-you-go

For most small to medium organizations, the free tiers should be sufficient.
