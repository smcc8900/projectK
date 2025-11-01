/**
 * Cloud Function for DBA to create initial admin users
 * This function requires special permissions and should be secured with IAM
 * 
 * The DBA/System Admin should have a service account with this function's invoker role
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.createOrganizationAdmin = functions.region('us-central1').https.onCall(async (data, context) => {
  // IMPORTANT: This should be protected with IAM or API key
  // For production, add additional authentication checks here
  
  const {
    orgName,
    domain,
    adminEmail,
    adminPassword,
    firstName,
    lastName,
    currency = 'USD',
    timezone = 'America/New_York',
    orgType = 'full', // 'education', 'corporate', or 'full'
  } = data;

  // Validate input
  if (!orgName || !domain || !adminEmail || !adminPassword || !firstName || !lastName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields'
    );
  }

  if (adminPassword.length < 6) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Password must be at least 6 characters'
    );
  }

  try {
    const db = admin.firestore();
    const auth = admin.auth();

    // Check if organization already exists
    const orgsSnapshot = await db.collection('organizations')
      .where('domain', '==', domain)
      .get();

    if (!orgsSnapshot.empty) {
      throw new functions.https.HttpsError(
        'already-exists',
        `Organization with domain ${domain} already exists`
      );
    }

    // Check if user already exists
    try {
      await auth.getUserByEmail(adminEmail);
      throw new functions.https.HttpsError(
        'already-exists',
        `User with email ${adminEmail} already exists`
      );
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, proceed
      } else {
        throw error;
      }
    }

    // Create organization
    const orgRef = db.collection('organizations').doc();
    await orgRef.set({
      orgName,
      domain,
      type: orgType, // Organization type for feature flags
      subscription: {
        plan: 'enterprise',
        status: 'active',
        startDate: admin.firestore.FieldValue.serverTimestamp(),
        endDate: null,
      },
      settings: {
        currency,
        timezone,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create admin user
    const userRecord = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false,
    });

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      orgId: orgRef.id,
      role: 'admin',
    });

    // Create user document
    await db.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: adminEmail,
      orgId: orgRef.id,
      role: 'admin',
      profile: {
        firstName,
        lastName,
        employeeId: 'ADMIN001',
        department: 'Administration',
        designation: 'Administrator',
        joiningDate: admin.firestore.FieldValue.serverTimestamp(),
      },
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      orgId: orgRef.id,
      orgName,
      adminEmail,
      adminUid: userRecord.uid,
      message: 'Organization and admin user created successfully',
    };
  } catch (error) {
    console.error('Error creating organization admin:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

