import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc,
  addDoc,
  updateDoc,
  query, 
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { getUserByEmail } from './user.service';

export const createPayslip = async (payslipData) => {
  try {
    const payslipsRef = collection(db, 'payslips');
    const docRef = await addDoc(payslipsRef, {
      ...payslipData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating payslip:', error);
    throw error;
  }
};

export const batchCreatePayslips = async (payslipsData, batchId, fileName, orgId, adminUserId) => {
  try {
    const results = {
      totalRows: payslipsData.length,
      successCount: 0,
      failedCount: 0,
      errors: [],
    };

    // Process in batches of 500 (Firestore limit)
    const batchSize = 500;
    
    for (let i = 0; i < payslipsData.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = payslipsData.slice(i, i + batchSize);

      for (const payslipData of chunk) {
        try {
          // Get user by email
          const user = await getUserByEmail(payslipData.email, orgId);
          
          if (!user) {
            results.failedCount++;
            results.errors.push({
              email: payslipData.email,
              error: 'User not found',
            });
            continue;
          }

          // Check for duplicate payslip for same month
          const existingPayslip = await getPayslipByUserAndMonth(
            user.id,
            payslipData.month,
            orgId
          );

          const payslipRef = existingPayslip 
            ? doc(db, 'payslips', existingPayslip.id)
            : doc(collection(db, 'payslips'));

          const payslipDoc = {
            ...payslipData,
            userId: user.id,
            orgId,
            uploadBatchId: batchId,
            excelFileName: fileName,
            generatedBy: adminUserId,
            generatedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          if (!existingPayslip) {
            payslipDoc.createdAt = serverTimestamp();
          }

          batch.set(payslipRef, payslipDoc, { merge: true });
          results.successCount++;
        } catch (error) {
          results.failedCount++;
          results.errors.push({
            email: payslipData.email,
            error: error.message,
          });
        }
      }

      await batch.commit();
    }

    // Create upload history record
    await addDoc(collection(db, 'uploadHistory'), {
      batchId,
      orgId,
      uploadedBy: adminUserId,
      fileName,
      month: payslipsData[0]?.month || '',
      stats: results,
      status: 'completed',
      processedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    return results;
  } catch (error) {
    console.error('Error batch creating payslips:', error);
    throw error;
  }
};

export const getPayslips = async (orgId, filters = {}) => {
  try {
    const payslipsRef = collection(db, 'payslips');
    let q = query(payslipsRef, where('orgId', '==', orgId));

    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }

    if (filters.month) {
      q = query(q, where('month', '==', filters.month));
    }

    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    q = query(q, orderBy('month', 'desc'));

    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting payslips:', error);
    throw error;
  }
};

export const getPayslipById = async (payslipId) => {
  try {
    const payslipDoc = await getDoc(doc(db, 'payslips', payslipId));
    if (payslipDoc.exists()) {
      return { id: payslipDoc.id, ...payslipDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting payslip:', error);
    throw error;
  }
};

export const getPayslipByUserAndMonth = async (userId, month, orgId) => {
  try {
    const payslipsRef = collection(db, 'payslips');
    const q = query(
      payslipsRef,
      where('orgId', '==', orgId),
      where('userId', '==', userId),
      where('month', '==', month)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting payslip by user and month:', error);
    throw error;
  }
};

export const updatePayslipStatus = async (payslipId, status) => {
  try {
    const payslipRef = doc(db, 'payslips', payslipId);
    await updateDoc(payslipRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating payslip status:', error);
    throw error;
  }
};

export const uploadExcelFile = async (file, orgId) => {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `organizations/${orgId}/uploads/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return {
      fileName,
      url: downloadURL,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Provide more helpful error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('Unauthorized: You do not have permission to upload files.');
    }
    
    if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled. Please try again.');
    }
    
    if (error.code === 'storage/quota-exceeded') {
      throw new Error('Storage quota exceeded. Please contact support.');
    }
    
    if (error.message?.includes('CORS') || error.code === 'storage/unauthenticated') {
      throw new Error('CORS Error: Storage may not be configured correctly. Please check storage rules and CORS configuration.');
    }
    
    throw new Error(error.message || 'Failed to upload file. Please try again.');
  }
};

export const getUploadHistory = async (orgId) => {
  try {
    const historyRef = collection(db, 'uploadHistory');
    const q = query(
      historyRef,
      where('orgId', '==', orgId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting upload history:', error);
    throw error;
  }
};

