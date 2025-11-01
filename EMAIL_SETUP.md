# Email Notification Setup Guide

This guide explains how to set up email notifications for leave requests in your application.

## Current Implementation

The Cloud Functions are already set up to trigger email notifications:
- **When a leave is requested**: Admins receive an email notification
- **When a leave is approved/rejected**: The employee receives an email notification

Currently, the functions **log the email content to the console** instead of sending actual emails. This is useful for development and testing.

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

## Setting Up Real Email Delivery (Production)

To send actual emails, you need to integrate an email service. Here are the most popular options:

### Option 1: SendGrid (Recommended)

1. **Sign up for SendGrid**:
   - Go to https://sendgrid.com/
   - Create a free account (100 emails/day free)
   - Verify your sender email address

2. **Get API Key**:
   - Go to Settings > API Keys
   - Create a new API key with "Mail Send" permissions
   - Copy the API key

3. **Install SendGrid in Functions**:
   ```bash
   cd functions
   npm install @sendgrid/mail
   ```

4. **Set Environment Variable**:
   ```bash
   firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
   firebase functions:config:set email.from="noreply@yourdomain.com"
   ```

5. **Update functions/src/index.js**:
   
   Add at the top of the file:
   ```javascript
   const sgMail = require('@sendgrid/mail');
   const sendgridKey = functions.config().sendgrid?.key;
   if (sendgridKey) {
     sgMail.setApiKey(sendgridKey);
   }
   const fromEmail = functions.config().email?.from || 'noreply@example.com';
   ```

   Then uncomment the SendGrid code blocks in:
   - `onLeaveRequestCreated` function (lines 264-280)
   - `onLeaveRequestUpdated` function (lines 345-360)

6. **Deploy**:
   ```bash
   firebase deploy --only functions
   ```

### Option 2: Nodemailer with Gmail

1. **Install Nodemailer**:
   ```bash
   cd functions
   npm install nodemailer
   ```

2. **Set up Gmail App Password**:
   - Go to your Google Account settings
   - Enable 2-factor authentication
   - Generate an App Password for "Mail"

3. **Set Environment Variables**:
   ```bash
   firebase functions:config:set gmail.email="your-email@gmail.com"
   firebase functions:config:set gmail.password="your-app-password"
   ```

4. **Update functions/src/index.js**:
   
   Add at the top:
   ```javascript
   const nodemailer = require('nodemailer');
   
   const transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: {
       user: functions.config().gmail?.email,
       pass: functions.config().gmail?.password
     }
   });
   ```

   Replace the SendGrid code with Nodemailer:
   ```javascript
   const mailOptions = {
     from: functions.config().gmail?.email,
     to: adminEmails.join(','),
     subject: `New Leave Request from ${employeeName}`,
     html: `...` // Use the HTML from the SendGrid example
   };
   
   await transporter.sendMail(mailOptions);
   ```

### Option 3: Mailgun

1. **Sign up for Mailgun**:
   - Go to https://www.mailgun.com/
   - Create account and verify domain

2. **Install Mailgun**:
   ```bash
   cd functions
   npm install mailgun-js
   ```

3. **Set Environment Variables**:
   ```bash
   firebase functions:config:set mailgun.key="YOUR_MAILGUN_API_KEY"
   firebase functions:config:set mailgun.domain="YOUR_MAILGUN_DOMAIN"
   ```

4. **Update functions/src/index.js** with Mailgun implementation

## Testing Email Notifications

1. **Deploy the updated functions**:
   ```bash
   firebase deploy --only functions
   ```

2. **Test leave request**:
   - Log in as an employee
   - Submit a leave request
   - Check admin email inbox

3. **Test approval notification**:
   - Log in as admin
   - Approve/reject a leave request
   - Check employee email inbox

## Troubleshooting

### Emails not sending
- Check Firebase Functions logs: `firebase functions:log`
- Verify API keys are set correctly: `firebase functions:config:get`
- Check email service quotas (SendGrid free tier: 100/day)

### Permission errors
- Ensure Firestore rules are deployed: `firebase deploy --only firestore:rules`
- Check that users have proper authentication tokens

### Email in spam
- Set up SPF, DKIM, and DMARC records for your domain
- Use a verified sender email address
- Avoid spam trigger words in subject lines

## Email Templates

You can customize the email templates in the Cloud Functions. The current templates include:

**Leave Request Notification (to Admin)**:
- Employee name and email
- Leave type
- Duration and number of days
- Reason for leave
- Request ID

**Leave Status Notification (to Employee)**:
- Approval/rejection status
- Leave details
- Admin comments (if any)

## Cost Considerations

- **SendGrid**: Free tier (100 emails/day), then $14.95/month for 40,000 emails
- **Gmail**: Free but limited to ~500 emails/day
- **Mailgun**: Free tier (5,000 emails/month), then pay-as-you-go

For most small to medium organizations, the free tiers should be sufficient.
