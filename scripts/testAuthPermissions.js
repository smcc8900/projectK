/**
 * Test if service account has Firebase Auth permissions
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = require('../functions/serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();

async function testPermissions() {
  console.log('🔍 Testing Firebase Auth permissions...\n');
  
  try {
    // Try to list users (read permission)
    console.log('1️⃣ Testing READ permission (list users)...');
    const listResult = await auth.listUsers(1);
    console.log('✅ READ permission: OK');
    console.log('   Found', listResult.users.length, 'user(s)');
    
    // Try to create a test user (write permission)
    console.log('\n2️⃣ Testing WRITE permission (create user)...');
    const testEmail = `test-${Date.now()}@ofdlabs.store`;
    
    try {
      const testUser = await auth.createUser({
        email: testEmail,
        password: 'TestPassword123!',
        emailVerified: false,
      });
      
      console.log('✅ WRITE permission: OK');
      console.log('   Created test user:', testUser.uid);
      
      // Clean up - delete test user
      await auth.deleteUser(testUser.uid);
      console.log('✅ Cleaned up test user');
      
    } catch (createError) {
      console.error('❌ WRITE permission: FAILED');
      console.error('   Error:', createError.message);
      console.error('   Code:', createError.code);
      
      if (createError.code === 'auth/insufficient-permission') {
        console.log('\n⚠️  SERVICE ACCOUNT LACKS PERMISSIONS!');
        console.log('\n📋 To fix:');
        console.log('1. Go to: https://console.firebase.google.com/project/projectk-618c3/settings/serviceaccounts/adminsdk');
        console.log('2. Click "Generate new private key"');
        console.log('3. Download the JSON file');
        console.log('4. Replace functions/serviceAccountKey.json with the new file');
        console.log('5. Run this test again\n');
      }
      
      return;
    }
    
    console.log('\n🎉 All permissions OK! Service account is properly configured.');
    
  } catch (error) {
    console.error('\n❌ Error testing permissions:', error.message);
    console.error('Code:', error.code);
  }
  
  process.exit(0);
}

testPermissions();
