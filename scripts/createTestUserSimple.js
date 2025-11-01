/**
 * Simple Script to Create a Test User (Quick Start)
 * 
 * This script creates everything you need for testing:
 * - Organization
 * - Admin user
 * - Custom claims
 * - User document
 * 
 * Usage:
 *   node scripts/createTestUserSimple.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../functions/serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('❌ Error: Could not load serviceAccountKey.json');
    console.error('\nTo fix this:');
    console.error('1. Go to Firebase Console > Project Settings > Service Accounts');
    console.error('2. Click "Generate New Private Key"');
    console.error('3. Save the file as: functions/serviceAccountKey.json\n');
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();

async function createTestUser() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    console.log('\n=== Create Test Admin User ===\n');
    console.log('This will create a test organization and admin user for you.\n');

    // Get inputs
    const orgName = await question('Organization Name (default: Test Company): ') || 'Test Company';
    const email = await question('Admin Email (default: admin@test.com): ') || 'admin@test.com';
    const password = await question('Admin Password (default: Admin123!): ') || 'Admin123!';
    const firstName = await question('First Name (default: Admin): ') || 'Admin';
    const lastName = await question('Last Name (default: User): ') || 'User';

    rl.close();

    console.log('\nCreating organization...');

    // Create organization
    const orgRef = db.collection('organizations').doc();
    const orgId = orgRef.id;

    await orgRef.set({
      orgName: orgName,
      domain: email.split('@')[1] || 'test.com',
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

    console.log(`✅ Organization created: ${orgId}`);

    // Create user in Auth
    console.log('Creating user in Firebase Auth...');

    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: `${firstName} ${lastName}`,
        emailVerified: false,
      });
      console.log(`✅ User created in Auth: ${userRecord.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  User already exists, getting existing user...');
        userRecord = await auth.getUserByEmail(email);
      } else {
        throw error;
      }
    }

    // Set custom claims
    console.log('Setting custom claims...');
    await auth.setCustomUserClaims(userRecord.uid, {
      orgId: orgId,
      role: 'admin',
    });
    console.log('✅ Custom claims set');

    // Create user document
    console.log('Creating user document...');
    await db.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: email,
      orgId: orgId,
      role: 'admin',
      profile: {
        firstName: firstName,
        lastName: lastName,
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

    // Success!
    console.log('\n' + '='.repeat(50));
    console.log('✅ SUCCESS! Test user created!');
    console.log('='.repeat(50));
    console.log('\nLogin Credentials:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  URL: http://localhost:3000/login`);
    console.log('\nOrganization Details:');
    console.log(`  Name: ${orgName}`);
    console.log(`  ID: ${orgId}`);
    console.log(`  User UID: ${userRecord.uid}`);
    console.log('\n⚠️  IMPORTANT:');
    console.log('  1. Make sure your dev server is running: npm run dev');
    console.log('  2. Login with the credentials above');
    console.log('  3. If you still see errors, clear browser cache and try again');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    rl.close();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  createTestUser();
}

module.exports = { createTestUser };

