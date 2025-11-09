import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check if user is within geofence radius
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} officeLat - Office latitude
 * @param {number} officeLon - Office longitude
 * @param {number} radius - Geofence radius in meters
 * @returns {boolean} True if within radius
 */
export const isWithinGeofence = (userLat, userLon, officeLat, officeLon, radius) => {
  const distance = calculateDistance(userLat, userLon, officeLat, officeLon);
  return distance <= radius;
};

/**
 * Check in employee
 * @param {string} userId - User ID
 * @param {string} orgId - Organization ID
 * @param {object} location - User's location {latitude, longitude}
 * @returns {Promise<object>} Check-in record
 */
export const checkIn = async (userId, orgId, location) => {
  try {
    const attendanceRef = collection(db, 'attendance');
    
    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);
    
    const q = query(
      attendanceRef,
      where('userId', '==', userId),
      where('orgId', '==', orgId),
      where('date', '>=', todayTimestamp),
      where('checkOut', '==', null)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      throw new Error('You are already checked in. Please check out first.');
    }
    
    const checkInData = {
      userId,
      orgId,
      checkIn: serverTimestamp(),
      checkOut: null,
      date: todayTimestamp,
      checkInLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      checkOutLocation: null,
      status: 'checked-in',
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(attendanceRef, checkInData);
    
    return {
      id: docRef.id,
      ...checkInData,
    };
  } catch (error) {
    console.error('Error checking in:', error);
    throw error;
  }
};

/**
 * Check out employee
 * @param {string} userId - User ID
 * @param {string} orgId - Organization ID
 * @param {object} location - User's location {latitude, longitude}
 * @returns {Promise<object>} Updated attendance record
 */
export const checkOut = async (userId, orgId, location) => {
  try {
    const attendanceRef = collection(db, 'attendance');
    
    // Find today's check-in record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);
    
    const q = query(
      attendanceRef,
      where('userId', '==', userId),
      where('orgId', '==', orgId),
      where('date', '>=', todayTimestamp),
      where('checkOut', '==', null)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('No active check-in found. Please check in first.');
    }
    
    const attendanceDoc = snapshot.docs[0];
    const attendanceDocRef = doc(db, 'attendance', attendanceDoc.id);
    
    await updateDoc(attendanceDocRef, {
      checkOut: serverTimestamp(),
      checkOutLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      status: 'checked-out',
    });
    
    return {
      id: attendanceDoc.id,
      ...attendanceDoc.data(),
      checkOut: new Date(),
      checkOutLocation: location,
      status: 'checked-out',
    };
  } catch (error) {
    console.error('Error checking out:', error);
    throw error;
  }
};

/**
 * Get today's attendance status for a user
 * @param {string} userId - User ID
 * @param {string} orgId - Organization ID
 * @returns {Promise<object|null>} Today's attendance record or null
 */
export const getTodayAttendance = async (userId, orgId) => {
  try {
    const attendanceRef = collection(db, 'attendance');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);
    
    const q = query(
      attendanceRef,
      where('userId', '==', userId),
      where('orgId', '==', orgId),
      where('date', '>=', todayTimestamp),
      orderBy('date', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error('Error getting today attendance:', error);
    throw error;
  }
};

/**
 * Get attendance records for a user
 * @param {string} userId - User ID
 * @param {string} orgId - Organization ID
 * @param {object} options - Query options {startDate, endDate, limit}
 * @returns {Promise<Array>} Attendance records
 */
export const getUserAttendance = async (userId, orgId, options = {}) => {
  try {
    const attendanceRef = collection(db, 'attendance');
    
    let q = query(
      attendanceRef,
      where('userId', '==', userId),
      where('orgId', '==', orgId),
      orderBy('date', 'desc')
    );
    
    if (options.startDate) {
      q = query(q, where('date', '>=', Timestamp.fromDate(options.startDate)));
    }
    
    if (options.endDate) {
      q = query(q, where('date', '<=', Timestamp.fromDate(options.endDate)));
    }
    
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting user attendance:', error);
    throw error;
  }
};

/**
 * Get all attendance records for an organization (admin view)
 * @param {string} orgId - Organization ID
 * @param {object} options - Query options {date, startDate, endDate}
 * @returns {Promise<Array>} Attendance records
 */
export const getOrganizationAttendance = async (orgId, options = {}) => {
  try {
    const attendanceRef = collection(db, 'attendance');
    
    let q = query(
      attendanceRef,
      where('orgId', '==', orgId),
      orderBy('date', 'desc')
    );
    
    if (options.date) {
      const date = new Date(options.date);
      date.setHours(0, 0, 0, 0);
      const dateTimestamp = Timestamp.fromDate(date);
      q = query(
        attendanceRef,
        where('orgId', '==', orgId),
        where('date', '>=', dateTimestamp),
        orderBy('date', 'desc')
      );
    } else if (options.startDate) {
      q = query(q, where('date', '>=', Timestamp.fromDate(options.startDate)));
    }
    
    if (options.endDate) {
      q = query(q, where('date', '<=', Timestamp.fromDate(options.endDate)));
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting organization attendance:', error);
    throw error;
  }
};
