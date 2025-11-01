/**
 * Create abccorp.com Organization
 * 
 * Usage:
 *   node scripts/createAbcorp.js
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

async function createAbcorp() {
  try {
    console.log('🚀 Creating abccorp.com Organization...\n');

    const orgData = {
      orgName: 'ABC Corporation',
      domain: 'abccorp.com',
      type: 'corporate',  // Corporate type - NO timetable feature
      adminEmail: 'admin@abccorp.com',
      adminPassword: 'TempPassword123!',
      firstName: 'Admin',
      lastName: 'User',
    };

    console.log('📋 Organization Details:');
    console.log('  Name:', orgData.orgName);
    console.log('  Domain:', orgData.domain);
    console.log('  Type:', orgData.type, '(no timetable)');
    console.log('  Admin Email:', orgData.adminEmail);
    console.log('');

    // Check if organization already exists
    const orgsSnapshot = await db.collection('organizations')
      .where('domain', '==', orgData.domain)
      .get();

    if (!orgsSnapshot.empty) {
      console.log('⚠️  Organization already exists!');
      const existingOrg = orgsSnapshot.docs[0];
      console.log('   Org ID:', existingOrg.id);
      console.log('   Name:', existingOrg.data().orgName);
      process.exit(0);
    }

    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(orgData.adminEmail);
      console.log('⚠️  User already exists!');
      console.log('   UID:', existingUser.uid);
      console.log('   Email:', existingUser.email);
      process.exit(0);
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create organization
    console.log('📝 Creating organization...');
    const orgRef = db.collection('organizations').doc();
    await orgRef.set({
      orgName: orgData.orgName,
      domain: orgData.domain,
      type: orgData.type,
      subscription: {
        plan: 'enterprise',
        status: 'active',
        startDate: admin.firestore.FieldValue.serverTimestamp(),
        endDate: null,
      },
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Organization created');
    console.log('   ID:', orgRef.id);

    // Create admin user
    console.log('\n👤 Creating admin user...');
    const userRecord = await auth.createUser({
      email: orgData.adminEmail,
      password: orgData.adminPassword,
      displayName: `${orgData.firstName} ${orgData.lastName}`,
      emailVerified: false,
    });
    console.log('✅ Admin user created');
    console.log('   UID:', userRecord.uid);

    // Set custom claims
    console.log('\n🔐 Setting custom claims...');
    await auth.setCustomUserClaims(userRecord.uid, {
      orgId: orgRef.id,
      role: 'admin',
    });
    console.log('✅ Custom claims set');

    // Create user document
    console.log('\n📄 Creating user document...');
    await db.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: orgData.adminEmail,
      orgId: orgRef.id,
      role: 'admin',
      profile: {
        firstName: orgData.firstName,
        lastName: orgData.lastName,
        employeeId: 'ADMIN001',
        department: 'Administration',
        designation: 'Administrator',
        joiningDate: admin.firestore.FieldValue.serverTimestamp(),
      },
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ User document created');

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 SUCCESS! abccorp.com is ready!');
    console.log('═'.repeat(60));
    console.log('\n📧 Client Login Credentials:');
    console.log('─'.repeat(60));
    console.log('  Login URL: https://projectk-618c3.web.app/login');
    console.log('  Email:', orgData.adminEmail);
    console.log('  Password:', orgData.adminPassword);
    console.log('─'.repeat(60));
    console.log('\n✨ Features Available (Corporate):');
    console.log('  ✅ Dashboard');
    console.log('  ✅ User Management');
    console.log('  ✅ Payroll Upload');
    console.log('  ❌ Timetable Management (Hidden for Corporate)');
    console.log('  ✅ Leave Management');
    console.log('  ✅ Payslips');
    console.log('  ✅ Colleagues');
    console.log('  ✅ Profile');
    console.log('\n⚠️  Important: Admin should change password after first login');
    console.log('\n📝 Next Steps:');
    console.log('  1. Test login at the URL above');
    console.log('  2. Add custom domain in Firebase Console:');
    console.log('     https://console.firebase.google.com/project/projectk-618c3/hosting');
    console.log('  3. Client updates DNS at their registrar');
    console.log('  4. abccorp.com will show their branded app\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

createAbcorp();
