/**
 * Debug domain configuration
 * 
 * Usage:
 *   node scripts/debugDomain.js
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

async function debugDomain() {
  try {
    console.log('🔍 Checking all organizations and their domains...\n');

    const orgsSnapshot = await db.collection('organizations').get();

    if (orgsSnapshot.empty) {
      console.log('❌ No organizations found in database!');
      process.exit(1);
    }

    console.log('📋 Organizations in database:\n');
    console.log('═'.repeat(80));

    orgsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\nOrganization: ${data.orgName}`);
      console.log(`ID: ${doc.id}`);
      console.log(`Domain: "${data.domain}"`);
      console.log(`Type: ${data.type}`);
      if (data.domains) {
        console.log(`Domains array: [${data.domains.map(d => `"${d}"`).join(', ')}]`);
      }
      console.log('─'.repeat(80));
    });

    console.log('\n\n🔍 Testing domain lookup for: ofdlabs.store\n');

    const testDomain = 'ofdlabs.store';
    const q = db.collection('organizations').where('domain', '==', testDomain);
    const snapshot = await q.get();

    if (snapshot.empty) {
      console.log('❌ No organization found with domain: "ofdlabs.store"');
      console.log('\n💡 Possible issues:');
      console.log('   1. Domain field has extra spaces');
      console.log('   2. Domain has "www." prefix');
      console.log('   3. Domain has "https://" prefix');
      console.log('   4. Domain has trailing slash');
      console.log('\n🔧 Fix: Run node scripts/addVercelDomain.js\n');
    } else {
      console.log('✅ Found organization with domain "ofdlabs.store":');
      const orgDoc = snapshot.docs[0];
      const orgData = orgDoc.data();
      console.log(`   Organization: ${orgData.orgName}`);
      console.log(`   ID: ${orgDoc.id}`);
      console.log(`   Domain: "${orgData.domain}"`);
      console.log('\n✅ Domain configuration is correct!\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

debugDomain();
