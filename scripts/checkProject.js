/**
 * Check which Firebase project we're connected to
 */

const admin = require('firebase-admin');
const serviceAccount = require('../functions/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('📋 Service Account Info:');
console.log('   Project ID:', serviceAccount.project_id);
console.log('   Client Email:', serviceAccount.client_email);
console.log('\n✅ Expected Project ID: projectk-618c3');
console.log('✅ Firebase Console: https://console.firebase.google.com/project/' + serviceAccount.project_id);

if (serviceAccount.project_id !== 'projectk-618c3') {
  console.log('\n⚠️  WARNING: Service account is for a DIFFERENT project!');
  console.log('   Download the correct service account key from:');
  console.log('   https://console.firebase.google.com/project/projectk-618c3/settings/serviceaccounts/adminsdk');
} else {
  console.log('\n✅ Service account is correct!');
}

process.exit(0);
