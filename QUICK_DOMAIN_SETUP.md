# Quick Domain Setup - edu.tech.com

## For You (System Admin)

### Step 1: Verify Organization
```bash
# Already created ✅
Organization ID: ubIHCJ0JaU3r7sQQ28Fc
Domain: edu.tech.com
```

### Step 2: Add Domain in Firebase

**Option A: Firebase Console**
1. Go to: https://console.firebase.google.com/project/projectk-618c3/hosting
2. Click "Add custom domain"
3. Enter: `edu.tech.com`
4. Copy DNS instructions

**Option B: Firebase CLI**
```bash
firebase hosting:channel:deploy production
```

### Step 3: Get DNS Records

Firebase will show something like:
```
A Records:
  @ → 151.101.1.195
  @ → 151.101.65.195

CNAME:
  www → projectk-618c3.web.app
```

---

## For Your Client (Domain Owner)

### Step 1: Login to Domain Registrar

Examples:
- GoDaddy: https://dcc.godaddy.com/
- Namecheap: https://ap.www.namecheap.com/
- Google Domains: https://domains.google.com/

### Step 2: Add DNS Records

**Add A Records:**
```
Type: A
Name: @ (or leave blank for root)
Value: 151.101.1.195
TTL: 3600

Type: A
Name: @ (or leave blank for root)
Value: 151.101.65.195
TTL: 3600
```

**Add CNAME Record:**
```
Type: CNAME
Name: www
Value: projectk-618c3.web.app
TTL: 3600
```

### Step 3: Wait

- DNS propagation: 5 minutes to 48 hours (usually ~1 hour)
- SSL certificate: 5-30 minutes after DNS verified

### Step 4: Test

Visit: `https://edu.tech.com`

Should see: "Tech Education Institute" in the navbar

---

## Quick Test Commands

```bash
# Check if DNS is updated
dig edu.tech.com

# Check CNAME
dig www.edu.tech.com

# Check from different DNS server
nslookup edu.tech.com 8.8.8.8
```

---

## Authorize Domain in Firebase Auth

1. Go to: https://console.firebase.google.com/project/projectk-618c3/authentication/settings
2. Scroll to "Authorized domains"
3. Click "Add domain"
4. Enter: `edu.tech.com`
5. Save

---

## What Happens After Setup

✅ `https://edu.tech.com` → Shows Tech Education Institute
✅ `https://edu.tech.com/login` → Login page with org branding
✅ `admin@edu.tech.com` → Can login
✅ Shows education features (including timetable)
✅ Data isolated to this organization only

---

## Cost

- Custom domain: **FREE**
- SSL certificate: **FREE** (auto-provisioned)
- Hosting: **FREE** (up to 10GB storage, 360MB/day)

---

## Timeline

| Step | Time |
|------|------|
| Add domain in Firebase | 2 minutes |
| Client updates DNS | 5 minutes |
| DNS propagation | 1-48 hours |
| SSL certificate | 5-30 minutes |
| **Total** | **~2-48 hours** |

---

## Support

If client needs help:
1. Share DNS records from Firebase Console
2. Guide them to their domain registrar
3. Help them add A and CNAME records
4. Wait for DNS propagation
5. Verify SSL certificate is issued

---

## Next Client

For next client (e.g., abccorp.com):

1. Run: `node scripts/createOrganization.js`
2. Enter domain: `abccorp.com`
3. Add domain in Firebase Console
4. Send DNS instructions to client
5. Done! ✅

---

**Each client gets their own branded domain with zero code changes!** 🚀
