import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Get all announcements for an organization
 * @param {string} orgId - Organization ID
 * @param {string} audience - Optional filter by audience ('all', 'admins', 'employees')
 * @returns {Promise<Array>} Array of announcements
 */
export const getAnnouncements = async (orgId, audience = null) => {
  try {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    const announcementsRef = collection(db, 'organizations', orgId, 'announcements');
    let q = query(announcementsRef, orderBy('createdAt', 'desc'));

    if (audience) {
      q = query(announcementsRef, where('audience', '==', audience), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt,
    }));
  } catch (error) {
    console.error('Error fetching announcements:', error);
    throw error;
  }
};

/**
 * Create a new announcement
 * @param {string} orgId - Organization ID
 * @param {Object} announcementData - Announcement data
 * @param {string} announcementData.title - Announcement title
 * @param {string} announcementData.message - Announcement message
 * @param {string} announcementData.audience - Target audience ('all', 'admins', 'employees')
 * @param {string} createdByUserId - User ID of the creator
 * @param {string} createdByName - Name of the creator
 * @returns {Promise<Object>} Created announcement
 */
export const createAnnouncement = async (orgId, announcementData, createdByUserId, createdByName) => {
  try {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    if (!announcementData.title || !announcementData.message) {
      throw new Error('Title and message are required');
    }

    if (!['all', 'admins', 'employees'].includes(announcementData.audience)) {
      throw new Error('Invalid audience. Must be "all", "admins", or "employees"');
    }

    const announcementsRef = collection(db, 'organizations', orgId, 'announcements');
    const newAnnouncement = {
      title: announcementData.title.trim(),
      message: announcementData.message.trim(),
      audience: announcementData.audience,
      createdBy: createdByUserId,
      createdByName: createdByName || 'Admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(announcementsRef, newAnnouncement);
    
    // Fetch the created document to return it with the ID
    const docSnap = await getDoc(docRef);
    return {
      id: docSnap.id,
      ...docSnap.data(),
    };
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
};

