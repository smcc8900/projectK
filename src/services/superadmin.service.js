import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';

/**
 * Get all organizations (Super Admin only)
 */
export const getAllOrganizations = async () => {
  try {
    const orgsRef = collection(db, 'organizations');
    const q = query(orgsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting organizations:', error);
    throw error;
  }
};

/**
 * Get organization statistics
 */
export const getOrganizationStats = async () => {
  try {
    const orgs = await getAllOrganizations();
    
    const stats = {
      total: orgs.length,
      active: orgs.filter(o => o.subscription?.status === 'active').length,
      inactive: orgs.filter(o => o.subscription?.status !== 'active').length,
      byType: {
        education: orgs.filter(o => o.type === 'education').length,
        corporate: orgs.filter(o => o.type === 'corporate').length,
        full: orgs.filter(o => o.type === 'full').length,
      },
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting organization stats:', error);
    throw error;
  }
};

/**
 * Create new organization with admin user
 */
export const createOrganization = async (orgData, adminData) => {
  try {
    // Call Cloud Function to create organization and admin
    const createOrgFunction = httpsCallable(functions, 'createOrganization');
    const result = await createOrgFunction({
      orgData: {
        orgName: orgData.orgName,
        domain: orgData.domain,
        type: orgData.type || 'full',
        subscription: {
          plan: orgData.plan || 'enterprise',
          status: 'active',
        },
        settings: {
          currency: orgData.currency || 'USD',
          timezone: orgData.timezone || 'America/New_York',
        },
        features: orgData.features || null,
      },
      adminData: {
        email: adminData.email,
        password: adminData.password,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        employeeId: adminData.employeeId || 'ADMIN001',
      },
    });

    return result.data;
  } catch (error) {
    console.error('Error creating organization:', error);
    
    if (error.code === 'functions/not-found') {
      throw new Error('Cloud Functions not found. Please ensure functions are deployed.');
    }
    
    if (error.message?.includes('already exists')) {
      throw new Error(error.message);
    }
    
    throw new Error(error.message || 'Failed to create organization. Please try again.');
  }
};

/**
 * Update organization features
 */
export const updateOrganizationFeatures = async (orgId, features) => {
  try {
    const orgRef = doc(db, 'organizations', orgId);
    await updateDoc(orgRef, {
      features,
      updatedAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating organization features:', error);
    throw error;
  }
};

/**
 * Get all users count by organization
 */
export const getUserCountByOrg = async (orgId) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('orgId', '==', orgId));
    const snapshot = await getDocs(q);
    
    return snapshot.size;
  } catch (error) {
    console.error('Error getting user count:', error);
    return 0;
  }
};

/**
 * Toggle organization status
 */
export const toggleOrganizationStatus = async (orgId, isActive) => {
  try {
    const orgRef = doc(db, 'organizations', orgId);
    await updateDoc(orgRef, {
      'subscription.status': isActive ? 'active' : 'inactive',
      updatedAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error toggling organization status:', error);
    throw error;
  }
};

/**
 * Delete organization and all associated data
 * WARNING: This is a destructive operation!
 */
export const deleteOrganization = async (orgId) => {
  try {
    // 1. Get all users in this organization
    const usersQuery = query(
      collection(db, 'users'),
      where('orgId', '==', orgId)
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    const userIds = [];
    const deletePromises = [];
    
    // Collect user IDs and delete user documents
    usersSnapshot.forEach((doc) => {
      userIds.push(doc.id);
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    console.log(`Deleting ${userIds.length} users from organization ${orgId}`);
    
    // 2. Delete all payslips for this organization
    const payslipsQuery = query(
      collection(db, 'payslips'),
      where('orgId', '==', orgId)
    );
    const payslipsSnapshot = await getDocs(payslipsQuery);
    payslipsSnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    console.log(`Deleting ${payslipsSnapshot.size} payslips`);
    
    // 3. Delete all upload history for this organization
    const uploadsQuery = query(
      collection(db, 'uploadHistory'),
      where('orgId', '==', orgId)
    );
    const uploadsSnapshot = await getDocs(uploadsQuery);
    uploadsSnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    console.log(`Deleting ${uploadsSnapshot.size} upload history records`);
    
    // 4. Delete all timetables for this organization
    const timetablesQuery = query(
      collection(db, 'timetables'),
      where('orgId', '==', orgId)
    );
    const timetablesSnapshot = await getDocs(timetablesQuery);
    timetablesSnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    console.log(`Deleting ${timetablesSnapshot.size} timetables`);
    
    // 5. Delete all leaves for this organization
    const leavesQuery = query(
      collection(db, 'leaves'),
      where('orgId', '==', orgId)
    );
    const leavesSnapshot = await getDocs(leavesQuery);
    leavesSnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    console.log(`Deleting ${leavesSnapshot.size} leave records`);
    
    // 6. Delete all attendance records for this organization
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('orgId', '==', orgId)
    );
    const attendanceSnapshot = await getDocs(attendanceQuery);
    attendanceSnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    console.log(`Deleting ${attendanceSnapshot.size} attendance records`);
    
    // 7. Delete the organization document itself
    const orgRef = doc(db, 'organizations', orgId);
    deletePromises.push(deleteDoc(orgRef));
    
    // Execute all deletions
    await Promise.all(deletePromises);
    
    console.log(`✅ Successfully deleted organization ${orgId} and all associated data`);
    
    return {
      success: true,
      deletedUsers: userIds.length,
      deletedPayslips: payslipsSnapshot.size,
      deletedUploads: uploadsSnapshot.size,
      deletedTimetables: timetablesSnapshot.size,
      deletedLeaves: leavesSnapshot.size,
      deletedAttendance: attendanceSnapshot.size,
      userIds: userIds, // Return user IDs for potential Auth cleanup
    };
  } catch (error) {
    console.error('Error deleting organization:', error);
    throw error;
  }
};
