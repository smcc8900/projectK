/**
 * Script to Verify Super Admin Setup
 * 
 * Usage:
 *   node scripts/verifySuperAdmin.js
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

async function verifySuperAdmin() {
  try {
    const email = 'admin@ofdlabs.store';
    
    console.log('🔍 Checking super admin account...\n');
    
    // Check if user exists in Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('✅ User exists in Firebase Auth');
      console.log('   UID:', userRecord.uid);
      console.log('   Email:', userRecord.email);
      console.log('   Email Verified:', userRecord.emailVerified);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('❌ User NOT found in Firebase Auth');
        console.log('\n🔧 Creating auth account...');
        
        // Create the auth user
        userRecord = await auth.createUser({
          email: email,
          password: 'Admin@1234',
          displayName: 'OFD Labs',
          emailVerified: true,
        });
        
        console.log('✅ Auth account created!');
        console.log('   UID:', userRecord.uid);
        console.log('   Email:', userRecord.email);
        console.log('   Password: Admin@1234');
      } else {
        throw error;
      }
    }
    
    // Check custom claims
    console.log('\n🔐 Checking custom claims...');
    const user = await auth.getUser(userRecord.uid);
    const claims = user.customClaims || {};
    
    console.log('   Current claims:', JSON.stringify(claims, null, 2));
    
    if (claims.role === 'superadmin' && claims.orgId === 'ofdlabs') {
      console.log('✅ Custom claims are correct!');
    } else {
      console.log('❌ Custom claims are INCORRECT or missing');
      console.log('\n🔧 Fixing custom claims...');
      
      await auth.setCustomUserClaims(userRecord.uid, {
        role: 'superadmin',
        orgId: 'ofdlabs',
      });
      
      console.log('✅ Custom claims updated!');
      console.log('   New claims: {"role":"superadmin","orgId":"ofdlabs"}');
    }
    
    // Check Firestore user document
    console.log('\n📄 Checking Firestore user document...');
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('✅ User document exists');
      console.log('   Role:', userData.role);
      console.log('   OrgId:', userData.orgId);
      
      if (userData.role !== 'superadmin' || userData.orgId !== 'ofdlabs') {
        console.log('\n🔧 Fixing user document...');
        await db.collection('users').doc(userRecord.uid).update({
          role: 'superadmin',
          orgId: 'ofdlabs',
        });
        console.log('✅ User document updated!');
      }
    } else {
      console.log('❌ User document NOT found in Firestore');
      console.log('\n🔧 Creating user document...');
      
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
      });
      
      console.log('✅ User document created!');
    }
    
    // Check OFD Labs organization
    console.log('\n🏢 Checking OFD Labs organization...');
    const orgDoc = await db.collection('organizations').doc('ofdlabs').get();
    
    if (orgDoc.exists) {
      console.log('✅ OFD Labs organization exists');
    } else {
      console.log('❌ OFD Labs organization NOT found');
      console.log('\n🔧 Creating OFD Labs organization...');
      
      await db.collection('organizations').doc('ofdlabs').set({
        orgName: 'OFD Labs',
        domain: 'ofdlabs.store',
        type: 'full',
        subscription: {
          plan: 'enterprise',
          status: 'active',
          startDate: admin.firestore.FieldValue.serverTimestamp(),
        },
        settings: {
          currency: 'USD',
          timezone: 'America/New_York',
        },
        features: {
          timetable: true,
          leaves: true,
          colleagues: true,
          payslips: true,
          profile: true,
          attendance: true,
          geofencing: true,
          reports: true,
          analytics: true,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log('✅ OFD Labs organization created!');
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎉 Super Admin Setup Complete!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📧 Login Credentials:');
    console.log('   URL: https://ofdlabs.store/login');
    console.log('   Email: admin@ofdlabs.store');
    console.log('   Password: Admin@1234');
    console.log('\n⚠️  IMPORTANT: Sign out and sign back in for changes to take effect!');
    console.log('\n💡 If login still fails:');
    console.log('   1. Clear browser cache');
    console.log('   2. Try incognito/private window');
    console.log('   3. Check browser console for errors (F12)');
    console.log('   4. Verify functions are deployed: firebase deploy --only functions\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

verifySuperAdmin();
