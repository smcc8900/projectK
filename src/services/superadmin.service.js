import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
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
