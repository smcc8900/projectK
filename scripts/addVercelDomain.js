/**
 * Add Vercel domain (ofdlabs.store) to edu.tech.com organization
 * 
 * Usage:
 *   node scripts/addVercelDomain.js
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

const db = admin.firestore();

async function addVercelDomain() {
  try {
    console.log('🔧 Adding ofdlabs.store to edu.tech.com organization...\n');

    // Update edu.tech.com organization
    // Replace with your actual organization ID
    const orgId = 'ubIHCJ0JaU3r7sQQ28Fc';
    
    await db.collection('organizations').doc(orgId).update({
      domain: 'ofdlabs.store',  // Update primary domain
      domains: [                 // Add domains array for multiple domains
        'edu.tech.com',
        'ofdlabs.store',
        'localhost'
      ]
    });
    
    console.log('✅ Successfully added ofdlabs.store to edu.tech.com organization');
    console.log('\n📋 Updated configuration:');
    console.log('  Primary domain: ofdlabs.store');
    console.log('  All domains: edu.tech.com, ofdlabs.store, localhost');
    console.log('\n🎯 Result:');
    console.log('  ✅ https://ofdlabs.store → ONLY edu.tech.com users can login');
    console.log('  ❌ abccorp.com users → Blocked');
    console.log('\n⚠️  Note: Deploy your changes to Vercel for this to take effect\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

addVercelDomain();
