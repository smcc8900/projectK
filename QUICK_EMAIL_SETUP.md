# Quick Email Setup Guide

Get email notifications running in 5 minutes!

## 🚀 Quick Start (SendGrid)

### Step 1: Get SendGrid API Key
1. Sign up at [SendGrid.com](https://sendgrid.com/) (free account)
2. Verify your sender email address
3. Create API Key: Settings → API Keys → Create API Key
4. Copy the API key (you'll only see it once!)

### Step 2: Configure Firebase
```bash
# Set your SendGrid API key
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY_HERE"

# Set your sender email (must be verified in SendGrid)
firebase functions:config:set email.from="noreply@yourdomain.com"
```

### Step 3: Install & Deploy
```bash
# Install dependencies
cd functions
npm install

# Deploy to Firebase
firebase deploy --only functions
```

### Step 4: Test It!
1. Create a leave request in your app
2. Check admin email inbox
3. Approve/reject the leave
4. Check employee email inbox

**Done!** 🎉

---

## 📧 What Emails Are Sent?

| Event | Recipient | Email Type |
|-------|-----------|------------|
| Employee applies for leave | All Admins | Leave Request Notification |
| Admin approves leave | Employee | Leave Approved |
| Admin rejects leave | Employee | Leave Rejected |
| New employee created | Employee | Welcome Email |
| Payslip generated | Employee | Payslip Available |

---

## 🔧 Development Mode (No SendGrid)

Without configuring SendGrid, emails are logged to the console:

```bash
# View email logs
firebase functions:log
```

This is perfect for development and testing!

---

## ⚡ Common Issues

### Emails not arriving?
- Check spam folder
- Verify sender email in SendGrid
- Check SendGrid dashboard for delivery status
- Run: `firebase functions:log` to see errors

### Configuration not working?
```bash
# Check current config
firebase functions:config:get

# Should show:
# {
#   "sendgrid": { "key": "SG.xxx..." },
#   "email": { "from": "noreply@..." }
# }
```

### Need to update config?
```bash
# Update SendGrid key
firebase functions:config:set sendgrid.key="NEW_KEY"

# Update sender email
firebase functions:config:set email.from="new-email@domain.com"

# Redeploy
firebase deploy --only functions
```

---

## 📝 Email Template Customization

Templates are in `functions/src/emailService.js`

Each template includes:
- Professional HTML design
- Responsive layout
- Color-coded status badges
- All relevant information

To customize:
1. Edit `functions/src/emailService.js`
2. Modify the HTML in `getEmailTemplate` function
3. Deploy: `firebase deploy --only functions`

---

## 💰 SendGrid Pricing

- **Free Tier**: 100 emails/day (3,000/month) - Perfect for small teams
- **Essentials**: $14.95/month for 40,000 emails
- **Pro**: $89.95/month for 100,000 emails

For most HR systems with <50 employees, the free tier is sufficient.

---

## 🆘 Need Help?

1. Check `EMAIL_SETUP.md` for detailed documentation
2. View logs: `firebase functions:log`
3. Check SendGrid dashboard for delivery status
4. Verify Firestore rules are deployed

---

## ✅ Checklist

- [ ] SendGrid account created
- [ ] Sender email verified in SendGrid
- [ ] API key generated
- [ ] Firebase config set (`sendgrid.key` and `email.from`)
- [ ] Dependencies installed (`npm install`)
- [ ] Functions deployed
- [ ] Test email sent successfully

**All done? You're ready to go!** 🚀
