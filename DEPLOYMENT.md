# Deployment Guide

This guide walks you through deploying the Enterprise Payroll Management System to production.

## Pre-Deployment Checklist

- [ ] Firebase project created
- [ ] Environment variables configured
- [ ] Firebase CLI installed and logged in
- [ ] All dependencies installed
- [ ] Code tested locally

## Step-by-Step Deployment

### 1. Firebase Project Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not done)
firebase init

# Select your project
firebase use <project-id>
```

### 2. Configure Firebase Services

#### Enable Services in Firebase Console

1. **Authentication**
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider

2. **Firestore Database**
   - Go to Firestore Database
   - Create database (start in production mode)
   - Location: Choose closest to your users

3. **Storage**
   - Go to Storage
   - Get started with default rules (we'll update them)

4. **Functions**
   - Go to Functions
   - Upgrade to Blaze plan (required for Cloud Functions)

### 3. Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### 4. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..

firebase deploy --only functions
```

**Note**: First deployment may take 5-10 minutes.

### 5. Build and Deploy Frontend

```bash
# Build the React app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 6. Post-Deployment Configuration

#### Set Up Custom Domain (Optional)

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow the instructions to verify domain ownership
4. Update DNS records as instructed

#### Configure CORS for Storage

Create `cors.json`:

```json
[
  {
    "origin": ["https://your-domain.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

Apply CORS configuration:

```bash
gsutil cors set cors.json gs://your-project-id.appspot.com
```

### 7. Verify Deployment

1. Visit your hosted URL
2. Test user registration
3. Create a test employee
4. Upload a sample Excel file
5. Verify payslip generation
6. Test PDF download

## Environment-Specific Configuration

### Development

```bash
# Use development project
firebase use development

# Deploy to development
firebase deploy
```

### Staging

```bash
# Use staging project
firebase use staging

# Deploy to staging
firebase deploy
```

### Production

```bash
# Use production project
firebase use production

# Deploy to production
firebase deploy
```

## Monitoring and Maintenance

### View Logs

```bash
# View function logs
firebase functions:log

# View specific function
firebase functions:log --only setUserClaims
```

### Monitor Performance

1. Go to Firebase Console
2. Check Performance tab
3. Monitor:
   - Function execution times
   - Database reads/writes
   - Storage bandwidth

### Backup Strategy

#### Firestore Backup

Set up scheduled exports:

```bash
# Using gcloud (requires Google Cloud SDK)
gcloud firestore export gs://your-backup-bucket/[DATE]
```

Or use Firebase Console > Firestore > Import/Export

#### Storage Backup

Use gsutil to sync storage:

```bash
gsutil -m rsync -r gs://your-project.appspot.com gs://your-backup-bucket
```

### Cost Optimization

1. **Firestore**
   - Use indexes efficiently
   - Implement pagination
   - Cache frequently accessed data

2. **Functions**
   - Set appropriate memory limits
   - Use minimum required timeout
   - Clean up old functions

3. **Storage**
   - Delete old Excel files (handled by scheduled function)
   - Compress files before upload
   - Set lifecycle rules

### Security Hardening

1. **Enable App Check** (recommended for production)
   ```bash
   firebase appcheck:enable
   ```

2. **Review Security Rules**
   - Regularly audit Firestore rules
   - Test with Firebase Emulator
   - Use rule unit tests

3. **Set Up Alerts**
   - Go to Cloud Console > Monitoring
   - Create alerts for:
     - High error rates
     - Unusual traffic patterns
     - Budget thresholds

## Rollback Procedure

If deployment fails or issues occur:

```bash
# Rollback hosting
firebase hosting:rollback

# Rollback specific function
firebase deploy --only functions:functionName

# Restore Firestore from backup
gcloud firestore import gs://your-backup-bucket/[DATE]
```

## CI/CD Setup (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        npm install
        cd functions && npm install && cd ..
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Firebase
      uses: w9jds/firebase-action@master
      with:
        args: deploy
      env:
        FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

Generate Firebase token:
```bash
firebase login:ci
```

Add token to GitHub Secrets.

## Troubleshooting

### Functions Not Deploying

- Check Node.js version (must be 18)
- Ensure Blaze plan is enabled
- Check function logs for errors

### Security Rules Errors

- Test rules with Firebase Emulator
- Check for syntax errors
- Verify custom claims are set

### Build Failures

- Clear node_modules and reinstall
- Check for environment variable issues
- Verify all imports are correct

## Support Contacts

- Firebase Support: [firebase.google.com/support](https://firebase.google.com/support)
- Technical Issues: Create GitHub issue
- Emergency: Contact system administrator

## Regular Maintenance Tasks

### Weekly
- [ ] Review error logs
- [ ] Check function performance
- [ ] Monitor costs

### Monthly
- [ ] Update dependencies
- [ ] Review security rules
- [ ] Test backup restoration
- [ ] Audit user access

### Quarterly
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Cost optimization review
- [ ] Update documentation

