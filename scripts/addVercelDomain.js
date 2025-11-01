/**
 * Add domain to organization
 * 
 * Usage:
 *   node scripts/addVercelDomain.js
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
    console.log('✅ Firebase Admin initialized\n');
  } catch (error) {
    console.error('❌ Error: Could not load serviceAccountKey.json');
    process.exit(1);
  }
}

const db = admin.firestore();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function addDomainToOrg() {
  try {
    console.log('🔧 Add Domain to Organization\n');

    // Get organization by domain
    const orgDomain = await question('Enter organization domain (e.g., ofdlabs.store): ');
    
    const orgsSnapshot = await db.collection('organizations')
      .where('domain', '==', orgDomain)
      .get();

    if (orgsSnapshot.empty) {
      console.error('\n❌ No organization found with domain:', orgDomain);
      console.log('\nAvailable organizations:');
      const allOrgs = await db.collection('organizations').get();
      allOrgs.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.orgName}: ${data.domain} (ID: ${doc.id})`);
      });
      process.exit(1);
    }

    const orgDoc = orgsSnapshot.docs[0];
    const orgData = orgDoc.data();
    
    console.log('\n✅ Found organization:', orgData.orgName);
    console.log('   Current domain:', orgData.domain);
    
    const newDomain = await question('\nEnter new domain to add (e.g., ofdlabs.store): ');
    
    // Update organization
    const domains = orgData.domains || [orgData.domain];
    if (!domains.includes(newDomain)) {
      domains.push(newDomain);
    }
    if (!domains.includes('localhost')) {
      domains.push('localhost');
    }
    
    await db.collection('organizations').doc(orgDoc.id).update({
      domain: newDomain,  // Update primary domain
      domains: domains    // Add to domains array
    });
    
    console.log('\n✅ Successfully updated organization!');
    console.log('\n📋 Updated configuration:');
    console.log('  Organization:', orgData.orgName);
    console.log('  Primary domain:', newDomain);
    console.log('  All domains:', domains.join(', '));
    console.log('\n🎯 Result:');
    console.log(`  ✅ https://${newDomain}/login → ONLY ${orgData.orgName} users can login`);
    console.log('  ❌ Other organization users → Blocked');
    console.log('\n⚠️  Note: Changes are live immediately!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

addDomainToOrg();
