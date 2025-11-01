/**
 * Fix Login Issues - Comprehensive Diagnostic and Fix Script
 * 
 * This script will:
 * 1. Check if user exists
 * 2. Verify/Set custom claims
 * 3. Check/Update user document
 * 4. Provide login instructions
 * 
 * Usage:
 *   node scripts/fixLoginIssue.js --email "admin@test.com"
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

const auth = admin.auth();
const db = admin.firestore();

async function fixLoginIssue() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    console.log('\n=== Fix Login Issues - Diagnostic Tool ===\n');

    // Get email
    let email = process.argv.find(arg => arg.startsWith('--email='))?.split('=')[1];
    
    if (!email) {
      email = await question('Enter the email address you\'re trying to login with: ');
    }

    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    console.log(`\nChecking user: ${email}\n`);

    // Step 1: Check if user exists in Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('✅ User exists in Firebase Auth');
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Email Verified: ${userRecord.emailVerified}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('❌ User NOT found in Firebase Auth');
        console.log('\nTo create a new user, run:');
        console.log('   node scripts/createTestUserSimple.js\n');
        rl.close();
        process.exit(1);
      } else {
        throw error;
      }
    }

    // Step 2: Check custom claims
    console.log('\nChecking custom claims...');
    const currentClaims = userRecord.customClaims || {};
    
    if (currentClaims.orgId && currentClaims.role) {
      console.log('✅ Custom claims found:');
      console.log(`   orgId: ${currentClaims.orgId}`);
      console.log(`   role: ${currentClaims.role}`);
    } else {
      console.log('⚠️  Custom claims MISSING or incomplete');
      
      // Find or create organization
      let orgId = currentClaims.orgId;
      
      if (!orgId) {
        console.log('\nFinding organization...');
        const orgsSnapshot = await db.collection('organizations').limit(10).get();
        
        if (!orgsSnapshot.empty) {
          console.log('Available organizations:');
          orgsSnapshot.forEach((doc, index) => {
            console.log(`  ${index + 1}. ${doc.data().orgName} (ID: ${doc.id})`);
          });
          
          const orgIndex = await question('\nSelect organization number (or enter custom orgId): ');
          const orgNum = parseInt(orgIndex);
          
          if (!isNaN(orgNum) && orgNum > 0 && orgNum <= orgsSnapshot.size) {
            orgId = orgsSnapshot.docs[orgNum - 1].id;
          } else {
            orgId = orgIndex;
          }
        } else {
          console.log('No organizations found. Creating new organization...');
          const orgName = await question('Organization Name (default: Test Company): ') || 'Test Company';
          const orgRef = db.collection('organizations').doc();
          orgId = orgRef.id;
          
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
        }
      }

      // Set custom claims
      const role = await question('Role (admin/employee, default: admin): ') || 'admin';
      
      console.log('\nSetting custom claims...');
      await auth.setCustomUserClaims(userRecord.uid, {
        orgId: orgId,
        role: role,
      });
      console.log('✅ Custom claims set successfully');
    }

    // Step 3: Check user document in Firestore
    console.log('\nChecking user document in Firestore...');
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (userDoc.exists) {
      console.log('✅ User document exists');
      const userData = userDoc.data();
      console.log(`   orgId: ${userData.orgId}`);
      console.log(`   role: ${userData.role}`);
      console.log(`   isActive: ${userData.isActive}`);
      
      // Update if needed
      const updatedClaims = await auth.getUser(userRecord.uid);
      if (updatedClaims.customClaims) {
        const needsUpdate = 
          userData.orgId !== updatedClaims.customClaims.orgId ||
          userData.role !== updatedClaims.customClaims.role;
        
        if (needsUpdate) {
          console.log('⚠️  User document out of sync. Updating...');
          await db.collection('users').doc(userRecord.uid).update({
            orgId: updatedClaims.customClaims.orgId,
            role: updatedClaims.customClaims.role,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log('✅ User document updated');
        }
      }
    } else {
      console.log('⚠️  User document MISSING. Creating...');
      const updatedUser = await auth.getUser(userRecord.uid);
      const claims = updatedUser.customClaims || {};
      
      await db.collection('users').doc(userRecord.uid).set({
        userId: userRecord.uid,
        email: email,
        orgId: claims.orgId || 'NO_ORG',
        role: claims.role || 'employee',
        profile: {
          firstName: userRecord.displayName?.split(' ')[0] || 'User',
          lastName: userRecord.displayName?.split(' ')[1] || 'Name',
          employeeId: claims.role === 'admin' ? 'ADMIN001' : 'EMP001',
          department: 'Administration',
          designation: claims.role === 'admin' ? 'Administrator' : 'Employee',
          joiningDate: admin.firestore.FieldValue.serverTimestamp(),
        },
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ User document created');
    }

    // Step 4: Check password reset if needed
    const needsPasswordReset = await question('\nDo you want to reset the password? (y/n, default: n): ');
    
    if (needsPasswordReset.toLowerCase() === 'y') {
      const newPassword = await question('Enter new password (min 6 chars): ');
      if (newPassword.length < 6) {
        console.log('⚠️  Password too short, skipping reset');
      } else {
        await auth.updateUser(userRecord.uid, {
          password: newPassword,
        });
        console.log('✅ Password reset successfully');
        console.log(`   New password: ${newPassword}`);
      }
    }

    rl.close();

    // Final summary
    const finalUser = await auth.getUser(userRecord.uid);
    const finalClaims = finalUser.customClaims || {};
    const finalDoc = await db.collection('users').doc(userRecord.uid).get();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ DIAGNOSTIC COMPLETE - All Issues Fixed!');
    console.log('='.repeat(60));
    console.log('\nUser Status:');
    console.log(`  Email: ${email}`);
    console.log(`  UID: ${userRecord.uid}`);
    console.log(`  Organization ID: ${finalClaims.orgId || 'NOT SET'}`);
    console.log(`  Role: ${finalClaims.role || 'NOT SET'}`);
    console.log(`  Active: ${finalDoc.data()?.isActive || 'Unknown'}`);
    console.log('\nLogin Instructions:');
    console.log('  1. Make sure dev server is running: npm run dev');
    console.log('  2. Go to: http://localhost:3000/login');
    console.log(`  3. Email: ${email}`);
    console.log('  4. Password: [Your password - use Firebase Console to reset if needed]');
    console.log('\n⚠️  IMPORTANT:');
    console.log('  - If you still see "invalid-credential", the password is wrong');
    console.log('  - Reset password in Firebase Console > Authentication > Users');
    console.log('  - Or run this script again with password reset option');
    console.log('  - Clear browser cache after fixing issues\n');

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
  fixLoginIssue();
}

module.exports = { fixLoginIssue };

