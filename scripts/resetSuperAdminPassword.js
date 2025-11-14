/**
 * Script to Reset Super Admin Password
 * 
 * Usage:
 *   node scripts/resetSuperAdminPassword.js
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

async function resetPassword() {
  try {
    const email = 'admin@ofdlabs.store';
    const newPassword = 'Admin@1234';
    
    console.log('🔍 Looking for user:', email);
    
    // Try to get the user
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('✅ User found!');
      console.log('   UID:', userRecord.uid);
      
      // Update password
      console.log('\n🔧 Updating password...');
      await auth.updateUser(userRecord.uid, {
        password: newPassword,
        emailVerified: true,
      });
      
      console.log('✅ Password updated successfully!');
      
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('❌ User not found in Firebase Auth');
        console.log('\n🔧 Creating new user...');
        
        userRecord = await auth.createUser({
          email: email,
          password: newPassword,
          displayName: 'OFD Labs',
          emailVerified: true,
        });
        
        console.log('✅ User created successfully!');
        console.log('   UID:', userRecord.uid);
        
        // Set custom claims
        console.log('\n🔐 Setting super admin claims...');
        await auth.setCustomUserClaims(userRecord.uid, {
          role: 'superadmin',
          orgId: 'ofdlabs',
        });
        console.log('✅ Claims set!');
        
      } else {
        throw error;
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎉 Success!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📧 Login Credentials:');
    console.log('   URL: https://ofdlabs.store/login');
    console.log('   Email:', email);
    console.log('   Password:', newPassword);
    console.log('\n✅ You can now login!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

resetPassword();
