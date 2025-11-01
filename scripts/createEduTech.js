/**
 * Quick Script to Create edu.tech.com Organization
 * 
 * Usage:
 *   node scripts/createEduTech.js
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
    console.error('Please download it from Firebase Console > Project Settings > Service Accounts');
    process.exit(1);
  }
}

const auth = admin.auth();
const db = admin.firestore();

async function createEduTech() {
  try {
    console.log('🚀 Creating edu.tech.com Organization...\n');

    const orgData = {
      orgName: 'Tech Education Institute',
      domain: 'edu.tech.com',
      type: 'education',  // Shows all features including timetable
      adminEmail: 'admin@edu.tech.com',
      adminPassword: 'TempPassword123!',
      firstName: 'Admin',
      lastName: 'User',
    };

    console.log('📋 Organization Details:');
    console.log('  Name:', orgData.orgName);
    console.log('  Domain:', orgData.domain);
    console.log('  Type:', orgData.type);
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
    console.log('🎉 SUCCESS! edu.tech.com is ready!');
    console.log('═'.repeat(60));
    console.log('\n📧 Client Login Credentials:');
    console.log('─'.repeat(60));
    console.log('  Login URL: https://projectk-618c3.web.app/login');
    console.log('  Email:', orgData.adminEmail);
    console.log('  Password:', orgData.adminPassword);
    console.log('─'.repeat(60));
    console.log('\n✨ Features Available:');
    console.log('  ✅ Dashboard');
    console.log('  ✅ User Management');
    console.log('  ✅ Payroll Upload');
    console.log('  ✅ Timetable Management (Education Feature)');
    console.log('  ✅ Leave Management');
    console.log('  ✅ Payslips');
    console.log('  ✅ Profile');
    console.log('\n⚠️  Important: Admin should change password after first login\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

createEduTech();
