import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Get organization data by orgId
 */
export const getOrganization = async (orgId) => {
  try {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    const orgRef = doc(db, 'organizations', orgId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      throw new Error('Organization not found');
    }

    return {
      id: orgSnap.id,
      ...orgSnap.data(),
    };
  } catch (error) {
    console.error('Error getting organization:', error);
    throw error;
  }
};

/**
 * Update organization data (only admins can do this)
 */
export const updateOrganization = async (orgId, updates) => {
  try {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    const orgRef = doc(db, 'organizations', orgId);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(orgRef, updateData);

    return { success: true };
  } catch (error) {
    console.error('Error updating organization:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to update organization settings');
    }
    
    throw error;
  }
};

/**
 * Update organization name
 */
export const updateOrganizationName = async (orgId, orgName) => {
  if (!orgName || orgName.trim().length === 0) {
    throw new Error('Organization name is required');
  }

  return updateOrganization(orgId, { orgName: orgName.trim() });
};

/**
 * Get organization by domain (for subdomain-based multi-tenancy)
 */
export const getOrganizationByDomain = async (domain) => {
  try {
    if (!domain) {
      throw new Error('Domain is required');
    }

    const orgsRef = collection(db, 'organizations');
    const q = query(orgsRef, where('domain', '==', domain));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('Organization not found for this domain');
    }

    const orgDoc = snapshot.docs[0];
    return {
      id: orgDoc.id,
      ...orgDoc.data(),
    };
  } catch (error) {
    console.error('Error getting organization by domain:', error);
    throw error;
  }
};

