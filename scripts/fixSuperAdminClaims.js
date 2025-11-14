/**
 * Quick Fix: Set Super Admin Claims
 * 
 * Usage:
 *   node scripts/fixSuperAdminClaims.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('../functions/serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function fixClaims() {
  try {
    const email = 'admin@ofdlabs.store';
    
    console.log('🔧 Fixing super admin claims for:', email);
    
    // Get user
    const userRecord = await auth.getUserByEmail(email);
    console.log('✅ User found, UID:', userRecord.uid);
    
    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'superadmin',
      orgId: 'ofdlabs',
    });
    console.log('✅ Custom claims set: {"role":"superadmin","orgId":"ofdlabs"}');
    
    // Update Firestore document
    await db.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: email,
      orgId: 'ofdlabs',
      role: 'superadmin',
      profile: {
        firstName: 'OFD',
        lastName: 'Labs',
        employeeId: 'SUPERADMIN001',
        department: 'Management',
        designation: 'Super Administrator',
        joiningDate: admin.firestore.FieldValue.serverTimestamp(),
      },
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log('✅ Firestore document updated');
    
    // Create OFD Labs org if needed
    const orgRef = db.collection('organizations').doc('ofdlabs');
    const orgDoc = await orgRef.get();
    
    if (!orgDoc.exists) {
      await orgRef.set({
        orgName: 'OFD Labs',
        domain: 'ofdlabs.store',
        type: 'full',
        subscription: {
          plan: 'enterprise',
          status: 'active',
          startDate: admin.firestore.FieldValue.serverTimestamp(),
        },
        settings: {
          currency: 'USD',
          timezone: 'America/New_York',
        },
        features: {
          timetable: true,
          leaves: true,
          colleagues: true,
          payslips: true,
          profile: true,
          attendance: true,
          geofencing: true,
          reports: true,
          analytics: true,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ OFD Labs organization created');
    } else {
      console.log('✅ OFD Labs organization exists');
    }
    
    console.log('\n🎉 DONE! Now do this:');
    console.log('1. SIGN OUT completely from the app');
    console.log('2. Close all browser tabs');
    console.log('3. Open new incognito/private window');
    console.log('4. Go to: https://ofdlabs.store/login');
    console.log('5. Login with: admin@ofdlabs.store / Admin@1234');
    console.log('\n✅ Should work now!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  process.exit(0);
}

fixClaims();
