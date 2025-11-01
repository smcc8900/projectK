# Upgrade to Blaze Plan - Required for Cloud Functions

## Why Blaze Plan is Required

Firebase Cloud Functions require the **Blaze (pay-as-you-go) plan** because:
- Cloud Functions run on Google Cloud Platform infrastructure
- They need access to GCP APIs and services
- The Spark (free) plan doesn't support Cloud Functions deployment

## Important Notes About Blaze Plan

✅ **You still get free tier quotas:**
- 2 million function invocations/month (free)
- 400,000 GB-seconds of compute time/month (free)
- 200,000 CPU-seconds of compute time/month (free)

💰 **You only pay for usage beyond the free tier**

For most small-to-medium applications, usage stays within the free tier.

## Step-by-Step Upgrade Instructions

### Option 1: Upgrade via Terminal (Recommended)

The deployment command will provide a URL. Visit it to upgrade:

1. Look at the error message in your terminal
2. You'll see a URL like: `https://console.firebase.google.com/project/projectk-618c3/settings/upgrade`
3. Copy and open that URL in your browser
4. Follow the upgrade steps

### Option 2: Upgrade via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **projectk-618c3**
3. Click the **gear icon** ⚙️ (top left)
4. Click **Usage and billing**
5. Click **Upgrade project** or **Modify plan**
6. Select **Blaze plan**
7. Follow the prompts to complete the upgrade
8. You'll need to:
   - Add a billing account (Google Cloud billing)
   - Link it to your Firebase project
   - Accept the terms

### Option 3: Direct URL

Visit this URL directly (replace with your project if different):
```
https://console.firebase.google.com/project/projectk-618c3/settings/upgrade
```

## After Upgrading

Once you've upgraded to Blaze plan:

1. **Wait 1-2 minutes** for the upgrade to complete
2. **Verify upgrade** - Check Firebase Console → Settings → Plan
3. **Try deployment again:**
   ```bash
   firebase deploy --only functions
   ```

## What Happens After Upgrade

1. ✅ Required APIs will be automatically enabled:
   - `cloudfunctions.googleapis.com`
   - `cloudbuild.googleapis.com`
   - `artifactregistry.googleapis.com`

2. ✅ Deployment will proceed automatically

3. ✅ Functions will be deployed to `us-central1` region

## Understanding Blaze Plan Pricing

### Free Tier (Monthly):
- **Cloud Functions Invocations:** 2,000,000 free
- **Compute Time:** 400,000 GB-seconds free
- **CPU Time:** 200,000 CPU-seconds free
- **Network Egress:** 5 GB free

### What You Pay For (If you exceed free tier):
- **Invocations:** $0.40 per million (after free tier)
- **Compute Time:** $0.0000025 per GB-second (after free tier)
- **CPU Time:** $0.0000100 per CPU-second (after free tier)

### Example Costs:
- **Small app** (10,000 users, 50,000 function calls/month): **$0/month** (within free tier)
- **Medium app** (100,000 users, 1M function calls/month): **$0/month** (within free tier)
- **Large app** (5M function calls/month): **~$1.20/month** (3M calls × $0.40/M = $1.20)

## Budget Alerts (Recommended)

Set up budget alerts to monitor usage:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Billing** → **Budgets & alerts**
3. Create a budget for your Firebase project
4. Set alerts (e.g., alert at $10, $50, $100)

## Common Concerns

### "Will I be charged immediately?"
No. You only pay for usage beyond the free tier.

### "Can I downgrade later?"
Yes, but you'll need to delete all Cloud Functions first.

### "What if I accidentally go over?"
Set budget alerts to get notified before significant charges.

## Next Steps

1. ✅ Upgrade to Blaze plan using one of the methods above
2. ✅ Wait 1-2 minutes for upgrade to complete
3. ✅ Run `firebase deploy --only functions` again
4. ✅ Your functions will deploy successfully!

---

**Ready to upgrade?** Visit the Firebase Console or use the URL provided in the terminal error message.

