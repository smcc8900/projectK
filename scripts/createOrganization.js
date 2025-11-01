/**
 * Script to Create New Organization and Admin User
 * 
 * Usage:
 *   node scripts/createOrganization.js
 * 
 * This script will prompt you for organization details
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
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Error: Could not load serviceAccountKey.json');
    console.error('Please download it from Firebase Console > Project Settings > Service Accounts');
    process.exit(1);
  }
}

const auth = admin.auth();
const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createOrganization() {
  try {
    console.log('\n🚀 Create New Organization & Admin User');
    console.log('═══════════════════════════════════════\n');

    // Get organization details
    const orgName = await question('Organization Name: ');
    const domain = await question('Domain (e.g., edu.tech.com): ');
    
    console.log('\nOrganization Type:');
    console.log('  1. Education (includes Timetable)');
    console.log('  2. Corporate (no Timetable)');
    console.log('  3. Full (all features)');
    const typeChoice = await question('Choose type (1/2/3): ');
    
    const orgTypeMap = {
      '1': 'education',
      '2': 'corporate',
      '3': 'full'
    };
    const orgType = orgTypeMap[typeChoice] || 'full';

    // Get admin details
    console.log('\n👤 Admin User Details:');
    const adminEmail = await question('Admin Email: ');
    const adminPassword = await question('Admin Password (min 6 chars): ');
    const firstName = await question('First Name: ');
    const lastName = await question('Last Name: ');

    console.log('\n📋 Summary:');
    console.log('─────────────────────────────────────');
    console.log('Organization:', orgName);
    console.log('Domain:', domain);
    console.log('Type:', orgType);
    console.log('Admin Email:', adminEmail);
    console.log('─────────────────────────────────────');

    const confirm = await question('\nProceed? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Cancelled');
      process.exit(0);
    }

    console.log('\n⏳ Creating organization...');

    // Check if organization already exists
    const orgsSnapshot = await db.collection('organizations')
      .where('domain', '==', domain)
      .get();

    if (!orgsSnapshot.empty) {
      throw new Error(`Organization with domain ${domain} already exists`);
    }

    // Check if user already exists
    try {
      await auth.getUserByEmail(adminEmail);
      throw new Error(`User with email ${adminEmail} already exists`);
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create organization
    console.log('📝 Creating organization document...');
    const orgRef = db.collection('organizations').doc();
    await orgRef.set({
      orgName,
      domain,
      type: orgType,
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
    console.log('✅ Organization created with ID:', orgRef.id);

    // Create admin user
    console.log('�� Creating admin user in Firebase Auth...');
    const userRecord = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false,
    });
    console.log('✅ Admin user created with UID:', userRecord.uid);

    // Set custom claims
    console.log('🔐 Setting custom claims...');
    await auth.setCustomUserClaims(userRecord.uid, {
      orgId: orgRef.id,
      role: 'admin',
    });
    console.log('✅ Custom claims set');

    // Create user document
    console.log('📄 Creating user document in Firestore...');
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
    console.log('✅ User document created');

    console.log('\n🎉 SUCCESS! Organization and admin created successfully!');
    console.log('\n📧 Send these credentials to your client:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Login URL: https://' + domain + '/login');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Organization:', orgName);
    console.log('Type:', orgType);
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT NEXT STEPS:');
    console.log('1. Add custom domain in Vercel/Firebase Hosting');
    console.log('2. Customer must add DNS records');
    console.log('3. After DNS propagation, login will work at: https://' + domain);
    console.log('4. Admin should change password after first login');
    console.log('\n⚠️  Until DNS is configured, they can temporarily test at:');
    console.log('   https://projectk-618c3.web.app/login (for testing only)\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

createOrganization();
