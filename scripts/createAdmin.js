/**
 * DBA Script: Create Initial Admin User for an Organization
 * 
 * This script should be run by a DBA/System Administrator when a new organization
 * signs a contract. It creates the organization and the first admin user.
 * 
 * Usage:
 *   node scripts/createAdmin.js --orgName "Company ABC" --domain "companyabc.com" \
 *     --adminEmail "admin@companyabc.com" --adminPassword "SecurePass123!" \
 *     --firstName "John" --lastName "Doe"
 * 
 * Or use environment variables:
 *   ORG_NAME="Company ABC" \
 *   ORG_DOMAIN="companyabc.com" \
 *   ADMIN_EMAIL="admin@companyabc.com" \
 *   ADMIN_PASSWORD="SecurePass123!" \
 *   ADMIN_FIRST_NAME="John" \
 *   ADMIN_LAST_NAME="Doe" \
 *   node scripts/createAdmin.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin (must have service account key)
if (!admin.apps.length) {
  const serviceAccount = require('../functions/serviceAccountKey.json'); // Add this file from Firebase Console
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function createAdminUser() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    console.log('\n=== Create Organization & Admin User ===\n');

    // Get input from command line args or prompt
    const orgName = process.env.ORG_NAME || process.argv.find(arg => arg.startsWith('--orgName='))?.split('=')[1] || await question('Organization Name: ');
    const domain = process.env.ORG_DOMAIN || process.argv.find(arg => arg.startsWith('--domain='))?.split('=')[1] || await question('Organization Domain: ');
    const adminEmail = process.env.ADMIN_EMAIL || process.argv.find(arg => arg.startsWith('--adminEmail='))?.split('=')[1] || await question('Admin Email: ');
    const adminPassword = process.env.ADMIN_PASSWORD || process.argv.find(arg => arg.startsWith('--adminPassword='))?.split('=')[1] || await question('Admin Password (min 6 chars): ');
    const firstName = process.env.ADMIN_FIRST_NAME || process.argv.find(arg => arg.startsWith('--firstName='))?.split('=')[1] || await question('Admin First Name: ');
    const lastName = process.env.ADMIN_LAST_NAME || process.argv.find(arg => arg.startsWith('--lastName='))?.split('=')[1] || await question('Admin Last Name: ');
    const currency = process.env.CURRENCY || 'USD';
    const timezone = process.env.TIMEZONE || 'America/New_York';

    rl.close();

    if (!orgName || !domain || !adminEmail || !adminPassword || !firstName || !lastName) {
      throw new Error('All fields are required');
    }

    if (adminPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

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
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, proceed
      } else {
        throw error;
      }
    }

    console.log('\nCreating organization...');

    // Create organization
    const orgRef = db.collection('organizations').doc();
    await orgRef.set({
      orgName,
      domain,
      subscription: {
        plan: 'enterprise',
        status: 'active',
        startDate: admin.firestore.FieldValue.serverTimestamp(),
        endDate: null, // No expiration for enterprise
      },
      settings: {
        currency,
        timezone,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Organization created with ID: ${orgRef.id}`);

    // Create admin user in Firebase Auth
    console.log('Creating admin user...');

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

    console.log('Custom claims set');

    // Create user document in Firestore
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

    console.log('User document created');

    console.log('\n✅ SUCCESS!');
    console.log('================================');
    console.log(`Organization ID: ${orgRef.id}`);
    console.log(`Organization Name: ${orgName}`);
    console.log(`Admin Email: ${adminEmail}`);
    console.log(`Admin UID: ${userRecord.uid}`);
    console.log('================================');
    console.log('\nAdmin user can now login at: https://your-app-url.com/login');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Share these credentials securely with the admin!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };

