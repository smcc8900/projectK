/**
 * Set Custom Claims for Existing User
 * 
 * Usage:
 *   node scripts/setClaimsForUser.js <email>
 * 
 * Example:
 *   node scripts/setClaimsForUser.js snehith@ofdlabs.store
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../functions/serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized\n');
  } catch (error) {
    console.error('❌ Error: Could not load serviceAccountKey.json');
    process.exit(1);
  }
}

const auth = admin.auth();
const db = admin.firestore();

async function setClaimsForUser() {
  try {
    const email = process.argv[2] || 'snehith@ofdlabs.store';
    
    console.log('🔍 Looking for user:', email);
    
    // Get user from Firebase Auth
    const userRecord = await auth.getUserByEmail(email);
    console.log('✅ User found in Firebase Auth');
    console.log('   UID:', userRecord.uid);
    console.log('   Email:', userRecord.email);
    
    // Set custom claims
    console.log('\n🔐 Setting custom claims...');
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'superadmin',
      orgId: 'ofdlabs',
    });
    console.log('✅ Custom claims set!');
    
    // Update/Create Firestore document
    console.log('\n📄 Updating Firestore document...');
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
    console.log('✅ Firestore document updated!');
    
    // Verify claims
    console.log('\n🔍 Verifying claims...');
    const updatedUser = await auth.getUser(userRecord.uid);
    console.log('   Claims:', JSON.stringify(updatedUser.customClaims, null, 2));
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎉 SUCCESS!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📧 Login Credentials:');
    console.log('   URL: https://ofdlabs.store/login');
    console.log('   Email:', email);
    console.log('   Password: Snehith@1949');
    console.log('\n⚠️  IMPORTANT:');
    console.log('   1. Sign out if already logged in');
    console.log('   2. Use incognito/private window');
    console.log('   3. Login with above credentials');
    console.log('   4. Should redirect to /superadmin/dashboard\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('\n💡 Solution:');
      console.log('   1. Go to Firebase Console > Authentication');
      console.log('   2. Click "Add user"');
      console.log('   3. Email: snehith@ofdlabs.store');
      console.log('   4. Password: Snehith@1949');
      console.log('   5. Run this script again\n');
    }
    
    process.exit(1);
  }
  process.exit(0);
}

setClaimsForUser();
