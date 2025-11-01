/**
 * Quick Script to Set Custom Claims for Existing Users
 * 
 * Use this if you've created a user manually in Firebase Console
 * and need to set custom claims to allow login.
 * 
 * Usage:
 *   node scripts/setCustomClaims.js --uid "USER_UID" --orgId "ORG_ID" --role "admin"
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
    console.error('Please download it from Firebase Console > Project Settings > Service Accounts');
    process.exit(1);
  }
}

const auth = admin.auth();
const db = admin.firestore();

async function setCustomClaims() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    console.log('\n=== Set Custom Claims for User ===\n');

    // Get input from command line args or prompt
    let uid = process.env.USER_UID || 
              process.argv.find(arg => arg.startsWith('--uid='))?.split('=')[1];
    
    let orgId = process.env.ORG_ID || 
                 process.argv.find(arg => arg.startsWith('--orgId='))?.split('=')[1];
    
    let role = process.env.ROLE || 
               process.argv.find(arg => arg.startsWith('--role='))?.split('=')[1] || 'admin';

    if (!uid) {
      uid = await question('User UID (from Firebase Auth): ');
    }

    if (!orgId) {
      // Try to find orgId from organizations collection
      const orgsSnapshot = await db.collection('organizations').limit(10).get();
      
      if (!orgsSnapshot.empty) {
        console.log('\nFound organizations:');
        orgsSnapshot.forEach((doc, index) => {
          console.log(`${index + 1}. ${doc.data().orgName} (ID: ${doc.id})`);
        });
        
        const orgIndex = await question('\nSelect organization number (or enter custom orgId): ');
        const orgNum = parseInt(orgIndex);
        
        if (!isNaN(orgNum) && orgNum > 0 && orgNum <= orgsSnapshot.size) {
          const selectedDoc = orgsSnapshot.docs[orgNum - 1];
          orgId = selectedDoc.id;
          console.log(`Selected: ${selectedDoc.data().orgName} (${orgId})`);
        } else {
          orgId = orgIndex;
        }
      } else {
        orgId = await question('Organization ID (orgId): ');
      }
    }

    rl.close();

    if (!uid || !orgId) {
      throw new Error('User UID and Organization ID are required');
    }

    // Verify user exists
    console.log('\nVerifying user exists...');
    let userRecord;
    try {
      userRecord = await auth.getUser(uid);
      console.log(`✅ User found: ${userRecord.email}`);
    } catch (error) {
      throw new Error(`User not found: ${error.message}`);
    }

    // Verify organization exists
    console.log('Verifying organization exists...');
    const orgDoc = await db.collection('organizations').doc(orgId).get();
    if (!orgDoc.exists) {
      throw new Error(`Organization ${orgId} not found`);
    }
    console.log(`✅ Organization found: ${orgDoc.data().orgName}`);

    // Set custom claims
    console.log('\nSetting custom claims...');
    await auth.setCustomUserClaims(uid, {
      orgId: orgId,
      role: role,
    });
    console.log('✅ Custom claims set successfully');

    // Check if user document exists, create if not
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      console.log('Creating user document in Firestore...');
      await db.collection('users').doc(uid).set({
        userId: uid,
        email: userRecord.email,
        orgId: orgId,
        role: role,
        profile: {
          firstName: userRecord.displayName?.split(' ')[0] || 'Admin',
          lastName: userRecord.displayName?.split(' ')[1] || 'User',
          employeeId: role === 'admin' ? 'ADMIN001' : 'EMP001',
          department: 'Administration',
          designation: role === 'admin' ? 'Administrator' : 'Employee',
          joiningDate: admin.firestore.FieldValue.serverTimestamp(),
        },
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ User document created');
    } else {
      // Update existing document
      console.log('Updating existing user document...');
      await db.collection('users').doc(uid).update({
        orgId: orgId,
        role: role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ User document updated');
    }

    console.log('\n✅ SUCCESS!');
    console.log('================================');
    console.log(`User UID: ${uid}`);
    console.log(`Email: ${userRecord.email}`);
    console.log(`Organization ID: ${orgId}`);
    console.log(`Role: ${role}`);
    console.log('================================');
    console.log('\nUser can now login with their email and password.');
    console.log('⚠️  User must sign out and sign back in to refresh token!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  setCustomClaims();
}

module.exports = { setCustomClaims };

