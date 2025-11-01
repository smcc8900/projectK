# Custom Domains Setup Guide

## Overview

Each client can have their own custom domain pointing to your application:
- **edu.tech.com** → Tech Education Institute
- **abccorp.com** → ABC Corporation  
- **xyzschool.edu** → XYZ School

All using the **same codebase** and **same Firebase deployment**!

---

## How It Works

```
                    Single Firebase App
                    (projectk-618c3)
                           ↓
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                   ↓
   edu.tech.com      abccorp.com        xyzschool.edu
        ↓                  ↓                   ↓
   Org: edu.tech     Org: abccorp       Org: xyzschool
   Type: education   Type: corporate    Type: education
   Data: isolated    Data: isolated     Data: isolated
```

The app detects the domain and loads the correct organization's data automatically.

---

## Setup Methods

### Option 1: Firebase Hosting Custom Domains (Easiest)

**Best for**: Most clients, professional setup

#### Step 1: Add Domain in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `projectk-618c3`
3. Go to **Hosting** → **Add custom domain**
4. Enter domain: `edu.tech.com`
5. Firebase will provide verification instructions

#### Step 2: Client Updates DNS

Client needs to add these DNS records at their domain registrar:

**For Root Domain (edu.tech.com):**
```
Type: A
Name: @
Value: 151.101.1.195  (Firebase provides exact IPs)
Value: 151.101.65.195
```

**For www Subdomain:**
```
Type: CNAME
Name: www
Value: projectk-618c3.web.app
```

#### Step 3: Wait for SSL Certificate

Firebase automatically provisions SSL certificate (takes 5-30 minutes)

#### Step 4: Test

Visit `https://edu.tech.com` - should load your app!

---

### Option 2: CNAME to Firebase (Subdomain Only)

**Best for**: Subdomains like `payroll.edu.tech.com`

Client adds:
```
Type: CNAME
Name: payroll
Value: projectk-618c3.web.app
```

---

### Option 3: Reverse Proxy (Advanced)

**Best for**: Clients who want full control

Client sets up nginx/Apache to proxy to your Firebase app.

---

## Update Your Organization Documents

For each organization, ensure the `domain` field matches their custom domain:

```javascript
// In Firestore: organizations/{orgId}
{
  "orgName": "Tech Education Institute",
  "domain": "edu.tech.com",  // ← Must match custom domain
  "type": "education"
}
```

---

## Code Changes (Already Implemented)

### 1. Domain Detection Utility

Created: `/src/utils/domainDetection.js`

```javascript
import { getCurrentDomain, getOrganizationByCurrentDomain } from './utils/domainDetection';

// Get current domain
const domain = getCurrentDomain(); // 'edu.tech.com' or null

// Get organization for current domain
const org = await getOrganizationByCurrentDomain();
```

### 2. Organization Service

Already has: `getOrganizationByDomain(domain)` function

### 3. Login Page

Already detects organization by email domain

---

## Step-by-Step: Adding edu.tech.com

### 1. Verify Organization Exists

```bash
# Check Firestore
Collections → organizations → find org with domain: "edu.tech.com"
```

Should see:
```json
{
  "id": "ubIHCJ0JaU3r7sQQ28Fc",
  "orgName": "Tech Education Institute",
  "domain": "edu.tech.com",
  "type": "education"
}
```

### 2. Add Domain in Firebase

```bash
# Via Firebase Console
Hosting → Add custom domain → edu.tech.com

# Or via CLI
firebase hosting:channel:deploy production
```

### 3. Get DNS Instructions

Firebase will show:
```
Add these DNS records at your domain registrar:

A Records:
  @ → 151.101.1.195
  @ → 151.101.65.195

CNAME Record:
  www → projectk-618c3.web.app
```

### 4. Client Updates DNS

Client logs into their domain registrar (GoDaddy, Namecheap, etc.) and adds the records.

### 5. Verify DNS Propagation

```bash
# Check if DNS is updated
dig edu.tech.com
nslookup edu.tech.com
```

### 6. Wait for SSL

Firebase automatically provisions SSL certificate (5-30 minutes)

### 7. Test

Visit: `https://edu.tech.com/login`

Should show:
- Organization name in navbar: "Tech Education Institute"
- Login works with `admin@edu.tech.com`
- Shows education features (including timetable)

---

## Multiple Domains for Same App

You can add unlimited domains:

```bash
# Firebase Console → Hosting → Add custom domain

Domain 1: edu.tech.com
Domain 2: abccorp.com
Domain 3: xyzschool.edu
Domain 4: company123.com
...
```

Each domain automatically loads its organization's data!

---

## Branding Per Domain (Optional Enhancement)

You can customize branding per organization:

```javascript
// In organization document
{
  "orgName": "Tech Education Institute",
  "domain": "edu.tech.com",
  "branding": {
    "logo": "https://storage.../logo.png",
    "primaryColor": "#1e40af",
    "favicon": "https://storage.../favicon.ico"
  }
}
```

Then in your app:
```javascript
import { getDomainBranding } from './utils/domainDetection';

const branding = await getDomainBranding();
// Use branding.name, branding.logo, branding.primaryColor
```

---

## Pricing & Limits

### Firebase Hosting:
- **Free tier**: 10 GB storage, 360 MB/day bandwidth
- **Paid (Blaze)**: $0.026/GB storage, $0.15/GB bandwidth
- **Custom domains**: Unlimited (free)
- **SSL certificates**: Free (auto-provisioned)

### Typical Usage:
- Small org (50 users): ~100 MB/month
- Medium org (500 users): ~1 GB/month
- Large org (5000 users): ~10 GB/month

---

## Troubleshooting

### Domain not working after DNS update

**Wait**: DNS propagation takes 24-48 hours (usually faster)

**Check DNS**:
```bash
dig edu.tech.com
```

**Clear cache**:
```bash
# Mac/Linux
sudo dscacheutil -flushcache

# Windows
ipconfig /flushdns
```

### SSL certificate pending

**Wait**: Takes 5-30 minutes after DNS is verified

**Check status**: Firebase Console → Hosting → Custom domains

### Wrong organization loading

**Check**: Organization document has correct `domain` field

**Verify**: `getOrganizationByDomain('edu.tech.com')` returns correct org

### Login not working on custom domain

**Check**: Authorized domains in Firebase Console
- Authentication → Settings → Authorized domains
- Add: `edu.tech.com`

---

## Security Considerations

1. **SSL/TLS**: Firebase provides free SSL for all custom domains
2. **Domain verification**: Only domain owner can add it
3. **Data isolation**: Each org's data is separated by `orgId`
4. **Authentication**: Firebase Auth works across all domains

---

## Client Instructions Template

Send this to your clients:

```
═══════════════════════════════════════════════════════════
Custom Domain Setup for [Organization Name]
═══════════════════════════════════════════════════════════

Your payroll system will be available at: https://[domain]

DNS RECORDS TO ADD:
───────────────────────────────────────────────────────────

At your domain registrar (GoDaddy, Namecheap, etc.), add:

A Records (for root domain):
  Type: A
  Name: @
  Value: 151.101.1.195
  
  Type: A
  Name: @
  Value: 151.101.65.195

CNAME Record (for www):
  Type: CNAME
  Name: www
  Value: projectk-618c3.web.app

───────────────────────────────────────────────────────────

TIMELINE:
  • DNS propagation: 24-48 hours (usually faster)
  • SSL certificate: 5-30 minutes after DNS verified
  • Your site will be live at: https://[domain]

SUPPORT:
  Contact us if you need help with DNS setup

═══════════════════════════════════════════════════════════
```

---

## Summary

✅ **Single codebase** serves all clients
✅ **Each client** gets their own domain
✅ **Automatic detection** of organization by domain
✅ **Free SSL** certificates for all domains
✅ **Unlimited domains** can be added
✅ **Data isolation** maintained per organization
✅ **Professional branding** for each client

Your clients get a fully branded experience on their own domain! 🎉
