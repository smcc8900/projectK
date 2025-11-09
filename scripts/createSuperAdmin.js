/**
 * Script to Create Super Admin for OFD Labs
 * 
 * Usage:
 *   node scripts/createSuperAdmin.js
 * 
 * This creates the ofdlabs.store super admin account
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

async function createSuperAdmin() {
  try {
    console.log('\n🚀 Create OFD Labs Super Admin');
    console.log('═══════════════════════════════════════\n');

    // Get super admin details
    const email = await question('Super Admin Email (default: admin@ofdlabs.store): ') || 'admin@ofdlabs.store';
    const password = await question('Super Admin Password (min 6 chars): ');
    const firstName = await question('First Name (default: OFD): ') || 'OFD';
    const lastName = await question('Last Name (default: Labs): ') || 'Labs';

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    console.log('\n📋 Summary:');
    console.log('─────────────────────────────────────');
    console.log('Email:', email);
    console.log('Name:', `${firstName} ${lastName}`);
    console.log('Role: Super Admin');
    console.log('Organization: OFD Labs (Parent Company)');
    console.log('─────────────────────────────────────');

    const confirm = await question('\nProceed? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Cancelled');
      process.exit(0);
    }

    console.log('\n⏳ Creating super admin...');

    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      console.log('⚠️  User already exists with UID:', existingUser.uid);
      
      const updateExisting = await question('Update existing user to super admin? (yes/no): ');
      if (updateExisting.toLowerCase() !== 'yes') {
        console.log('❌ Cancelled');
        process.exit(0);
      }

      // Update existing user
      console.log('🔐 Setting super admin claims...');
      await auth.setCustomUserClaims(existingUser.uid, {
        role: 'superadmin',
        orgId: 'ofdlabs',
      });
      console.log('✅ Super admin claims set');

      // Update/create user document
      console.log('📄 Updating user document...');
      await db.collection('users').doc(existingUser.uid).set({
        userId: existingUser.uid,
        email: email,
        orgId: 'ofdlabs',
        role: 'superadmin',
        profile: {
          firstName,
          lastName,
          employeeId: 'SUPERADMIN001',
          department: 'Management',
          designation: 'Super Administrator',
          joiningDate: admin.firestore.FieldValue.serverTimestamp(),
        },
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      console.log('✅ User document updated');

      console.log('\n🎉 SUCCESS! Super admin updated successfully!');
      console.log('\n📧 Login Credentials:');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Login URL: https://projectk-618c3.web.app/login');
      console.log('Email:', email);
      console.log('Password: (use existing password)');
      console.log('Role: Super Admin');
      console.log('═══════════════════════════════════════════════════════');
      console.log('\n⚠️  User must sign out and sign back in for changes to take effect\n');

    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }

      // Create OFD Labs organization if it doesn't exist
      console.log('📝 Creating OFD Labs organization...');
      const orgRef = db.collection('organizations').doc('ofdlabs');
      const orgDoc = await orgRef.get();
      
      if (!orgDoc.exists) {
        await orgRef.set({
          orgName: 'OFD Labs',
          domain: 'ofdlabs.store',
          type: 'full',
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
        console.log('✅ OFD Labs organization created');
      } else {
        console.log('✅ OFD Labs organization already exists');
      }

      // Create super admin user
      console.log('👤 Creating super admin user in Firebase Auth...');
      const userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: `${firstName} ${lastName}`,
        emailVerified: true,
      });
      console.log('✅ Super admin user created with UID:', userRecord.uid);

      // Set custom claims
      console.log('🔐 Setting super admin claims...');
      await auth.setCustomUserClaims(userRecord.uid, {
        role: 'superadmin',
        orgId: 'ofdlabs',
      });
      console.log('✅ Super admin claims set');

      // Create user document
      console.log('📄 Creating user document in Firestore...');
      await db.collection('users').doc(userRecord.uid).set({
        userId: userRecord.uid,
        email: email,
        orgId: 'ofdlabs',
        role: 'superadmin',
        profile: {
          firstName,
          lastName,
          employeeId: 'SUPERADMIN001',
          department: 'Management',
          designation: 'Super Administrator',
          joiningDate: admin.firestore.FieldValue.serverTimestamp(),
        },
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ User document created');

      console.log('\n🎉 SUCCESS! Super admin created successfully!');
      console.log('\n📧 Super Admin Credentials:');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Login URL: https://projectk-618c3.web.app/login');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Role: Super Admin');
      console.log('═══════════════════════════════════════════════════════');
      console.log('\n✨ Super Admin Features:');
      console.log('  ✅ View all customers');
      console.log('  ✅ Onboard new customers');
      console.log('  ✅ Manage customer features');
      console.log('  ✅ View customer statistics');
      console.log('  ✅ Enable/disable features per customer');
      
      // Ask if they want to create a regular admin for OFD Labs
      console.log('\n─────────────────────────────────────────────────────');
      console.log('💡 RECOMMENDATION: Create a separate regular admin account');
      console.log('   for managing OFD Labs employees and payroll.');
      console.log('─────────────────────────────────────────────────────');
      
      const createRegularAdmin = await question('\nCreate regular admin for OFD Labs payroll? (yes/no): ');
      
      if (createRegularAdmin.toLowerCase() === 'yes') {
        const adminEmail = await question('Regular Admin Email (e.g., payroll@ofdlabs.store): ');
        const adminPassword = await question('Regular Admin Password: ');
        const adminFirstName = await question('First Name: ');
        const adminLastName = await question('Last Name: ');
        
        console.log('\n⏳ Creating regular admin for OFD Labs...');
        
        const regularAdminRecord = await auth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: `${adminFirstName} ${adminLastName}`,
          emailVerified: true,
        });
        console.log('✅ Regular admin user created with UID:', regularAdminRecord.uid);
        
        await auth.setCustomUserClaims(regularAdminRecord.uid, {
          role: 'admin',
          orgId: 'ofdlabs',
        });
        console.log('✅ Admin claims set');
        
        await db.collection('users').doc(regularAdminRecord.uid).set({
          userId: regularAdminRecord.uid,
          email: adminEmail,
          orgId: 'ofdlabs',
          role: 'admin',
          profile: {
            firstName: adminFirstName,
            lastName: adminLastName,
            employeeId: 'ADMIN001',
            department: 'Administration',
            designation: 'Administrator',
            joiningDate: admin.firestore.FieldValue.serverTimestamp(),
          },
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log('✅ Regular admin document created');
        
        console.log('\n📧 Regular Admin Credentials (for OFD Labs payroll):');
        console.log('═══════════════════════════════════════════════════════');
        console.log('Login URL: https://projectk-618c3.web.app/login');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
        console.log('Role: Admin (can manage OFD Labs employees & payroll)');
        console.log('═══════════════════════════════════════════════════════');
      }
      
      console.log('\n⚠️  Keep these credentials secure!\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

createSuperAdmin();
