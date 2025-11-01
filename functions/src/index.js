const functions = require('firebase-functions');
const { createOrganizationAdmin } = require('./createAdmin');
const admin = require('firebase-admin');

// Initialize Firebase Admin only if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export the createOrganizationAdmin function
exports.createOrganizationAdmin = createOrganizationAdmin;

const db = admin.firestore();
const auth = admin.auth();

/**
 * Cloud Function to set custom claims for a user
 * This is called during registration and user creation
 * Note: Region is set to us-central1 to match frontend configuration
 */
exports.setUserClaims = functions.region('us-central1').https.onCall(async (data, context) => {
  // Verify the request is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to set claims.'
    );
  }

  const { userId, orgId, role } = data;

  // Validate input
  if (!userId || !orgId || !role) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: userId, orgId, role'
    );
  }

  try {
    // Set custom claims
    await auth.setCustomUserClaims(userId, {
      orgId,
      role,
    });

    return { success: true, message: 'Custom claims set successfully' };
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function to create a new user with auth and custom claims
 * Called by admins to create new employees
 * Note: Region is set to us-central1 to match frontend configuration
 */
exports.createUser = functions.region('us-central1').https.onCall(async (data, context) => {
  // Verify the request is authenticated and from an admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated.'
    );
  }

  // Check if the caller is an admin
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can create users.'
    );
  }

  const { email, password, orgId, role, profile } = data;

  // Validate input
  if (!email || !password || !orgId || !role) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: email, password, orgId, role'
    );
  }

  // Verify the caller belongs to the same organization
  if (context.auth.token.orgId !== orgId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Cannot create users for other organizations.'
    );
  }

  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: profile ? `${profile.firstName} ${profile.lastName}` : null,
    });

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      orgId,
      role,
    });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email,
      orgId,
      role,
      profile: profile || {},
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      userId: userRecord.uid,
      message: 'User created successfully',
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function to delete a user from Auth and Firestore
 * Called by admins to delete employees
 * Note: Region is set to us-central1 to match frontend configuration
 */
exports.deleteUser = functions.region('us-central1').https.onCall(async (data, context) => {
  // Verify the request is authenticated and from an admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated.'
    );
  }

  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can delete users.'
    );
  }

  const { userId } = data;

  if (!userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required field: userId'
    );
  }

  try {
    // Get user document to verify organization
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();

    // Verify the caller belongs to the same organization
    if (context.auth.token.orgId !== userData.orgId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot delete users from other organizations.'
      );
    }

    // Delete user from Firebase Auth
    await auth.deleteUser(userId);

    // Delete user document from Firestore
    await db.collection('users').doc(userId).delete();

    return {
      success: true,
      message: 'User deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Trigger: When a new user is created in Firestore, send welcome email
 * (Optional - can be expanded with SendGrid or similar)
 */
exports.onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    
    // TODO: Send welcome email using SendGrid, Mailgun, etc.
    console.log(`New user created: ${userData.email}`);
    
    return null;
  });

/**
 * Trigger: When payslips are created, notify employees
 * (Optional - can be expanded with email notifications)
 */
exports.onPayslipCreated = functions.firestore
  .document('payslips/{payslipId}')
  .onCreate(async (snap, context) => {
    const payslipData = snap.data();
    
    // TODO: Send payslip notification email
    console.log(`New payslip created for user: ${payslipData.userId}`);
    
    return null;
  });

/**
 * Trigger: When a leave request is created, notify admins
 */
exports.onLeaveRequestCreated = functions.firestore
  .document('leaveRequests/{requestId}')
  .onCreate(async (snap, context) => {
    const leaveRequest = snap.data();
    const requestId = context.params.requestId;
    
    try {
      // Get employee details
      const employeeDoc = await db.collection('users').doc(leaveRequest.userId).get();
      const employeeData = employeeDoc.data();
      const employeeName = employeeData?.profile 
        ? `${employeeData.profile.firstName} ${employeeData.profile.lastName}`
        : leaveRequest.userEmail;
      
      // Get all admins in the organization
      const adminsSnapshot = await db.collection('users')
        .where('orgId', '==', leaveRequest.organizationId)
        .where('role', '==', 'admin')
        .get();
      
      const adminEmails = adminsSnapshot.docs.map(doc => doc.data().email);
      
      // Format dates
      const startDate = new Date(leaveRequest.startDate).toLocaleDateString();
      const endDate = new Date(leaveRequest.endDate).toLocaleDateString();
      
      // Log notification (In production, send actual emails using SendGrid, Mailgun, etc.)
      console.log('=== LEAVE REQUEST NOTIFICATION ===');
      console.log(`To: ${adminEmails.join(', ')}`);
      console.log(`Subject: New Leave Request from ${employeeName}`);
      console.log(`Body:`);
      console.log(`Employee: ${employeeName} (${leaveRequest.userEmail})`);
      console.log(`Leave Type: ${leaveRequest.leaveType}`);
      console.log(`Duration: ${startDate} to ${endDate} (${leaveRequest.days} days)`);
      console.log(`Reason: ${leaveRequest.reason}`);
      console.log(`Status: ${leaveRequest.status}`);
      console.log(`Request ID: ${requestId}`);
      console.log('===================================');
      
      // TODO: Integrate with email service
      // Example with SendGrid:
      // const msg = {
      //   to: adminEmails,
      //   from: 'noreply@yourcompany.com',
      //   subject: `New Leave Request from ${employeeName}`,
      //   html: `
      //     <h2>New Leave Request</h2>
      //     <p><strong>Employee:</strong> ${employeeName}</p>
      //     <p><strong>Email:</strong> ${leaveRequest.userEmail}</p>
      //     <p><strong>Leave Type:</strong> ${leaveRequest.leaveType}</p>
      //     <p><strong>Duration:</strong> ${startDate} to ${endDate} (${leaveRequest.days} days)</p>
      //     <p><strong>Reason:</strong> ${leaveRequest.reason}</p>
      //     <p><strong>Status:</strong> ${leaveRequest.status}</p>
      //   `
      // };
      // await sgMail.send(msg);
      
    } catch (error) {
      console.error('Error sending leave request notification:', error);
    }
    
    return null;
  });

/**
 * Trigger: When a leave request is updated (approved/rejected), notify employee
 */
exports.onLeaveRequestUpdated = functions.firestore
  .document('leaveRequests/{requestId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const requestId = context.params.requestId;
    
    // Only send notification if status changed
    if (beforeData.status === afterData.status) {
      return null;
    }
    
    try {
      // Get employee details
      const employeeDoc = await db.collection('users').doc(afterData.userId).get();
      const employeeData = employeeDoc.data();
      const employeeName = employeeData?.profile 
        ? `${employeeData.profile.firstName} ${employeeData.profile.lastName}`
        : afterData.userEmail;
      
      // Format dates
      const startDate = new Date(afterData.startDate).toLocaleDateString();
      const endDate = new Date(afterData.endDate).toLocaleDateString();
      
      // Determine status message
      let statusMessage = '';
      let statusColor = '';
      if (afterData.status === 'approved') {
        statusMessage = 'APPROVED';
        statusColor = 'green';
      } else if (afterData.status === 'rejected') {
        statusMessage = 'REJECTED';
        statusColor = 'red';
      } else {
        statusMessage = afterData.status.toUpperCase();
        statusColor = 'gray';
      }
      
      // Log notification (In production, send actual emails)
      console.log('=== LEAVE REQUEST STATUS UPDATE ===');
      console.log(`To: ${afterData.userEmail}`);
      console.log(`Subject: Leave Request ${statusMessage}`);
      console.log(`Body:`);
      console.log(`Dear ${employeeName},`);
      console.log(`Your leave request has been ${statusMessage}.`);
      console.log(`Leave Type: ${afterData.leaveType}`);
      console.log(`Duration: ${startDate} to ${endDate} (${afterData.days} days)`);
      if (afterData.adminComment) {
        console.log(`Admin Comment: ${afterData.adminComment}`);
      }
      console.log(`Request ID: ${requestId}`);
      console.log('====================================');
      
      // TODO: Integrate with email service
      // Example with SendGrid:
      // const msg = {
      //   to: afterData.userEmail,
      //   from: 'noreply@yourcompany.com',
      //   subject: `Leave Request ${statusMessage}`,
      //   html: `
      //     <h2>Leave Request ${statusMessage}</h2>
      //     <p>Dear ${employeeName},</p>
      //     <p>Your leave request has been <strong style="color: ${statusColor}">${statusMessage}</strong>.</p>
      //     <p><strong>Leave Type:</strong> ${afterData.leaveType}</p>
      //     <p><strong>Duration:</strong> ${startDate} to ${endDate} (${afterData.days} days)</p>
      //     ${afterData.adminComment ? `<p><strong>Admin Comment:</strong> ${afterData.adminComment}</p>` : ''}
      //   `
      // };
      // await sgMail.send(msg);
      
    } catch (error) {
      console.error('Error sending leave status notification:', error);
    }
    
    return null;
  });

/**
 * Scheduled function to clean up old upload files
 * Runs daily at midnight
 */
exports.cleanupOldUploads = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const bucket = admin.storage().bucket();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      // List all files in uploads directory
      const [files] = await bucket.getFiles({ prefix: 'organizations/' });
      
      const deletePromises = [];
      
      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const createdDate = new Date(metadata.timeCreated);
        
        // Delete files older than 30 days
        if (createdDate < thirtyDaysAgo) {
          deletePromises.push(file.delete());
        }
      }
      
      await Promise.all(deletePromises);
      console.log(`Deleted ${deletePromises.length} old upload files`);
    } catch (error) {
      console.error('Error cleaning up old uploads:', error);
    }
    
    return null;
  });

