import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyCUNXn18D1hSVDrszmt7vBwh8R40bKhogY",
    authDomain: "projectk-618c3.firebaseapp.com",
    projectId: "projectk-618c3",
    storageBucket: "projectk-618c3.firebasestorage.app",
    messagingSenderId: "256149449781",
    appId: "1:256149449781:web:22d33ed08905a93d97557c",
    measurementId: "G-XFB6472W3M"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app,'us-central1');

export default app;

