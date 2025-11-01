/**
 * Utility function to handle Firebase Functions errors with helpful messages
 * @param {Error} error - The error object from Firebase Functions
 * @param {string} operation - Description of the operation being performed
 * @returns {Error} - User-friendly error message
 */
export const handleFunctionsError = (error, operation = 'operation') => {
  console.error(`Error during ${operation}:`, error);
  
  // Firebase Functions error codes
  if (error.code === 'functions/not-found') {
    return new Error(`Cloud Functions not found. Please ensure functions are deployed. Run: firebase deploy --only functions`);
  }
  
  if (error.code === 'functions/unavailable') {
    return new Error(`Cloud Functions are unavailable. Please check your internet connection and try again.`);
  }
  
  if (error.code === 'functions/unauthenticated') {
    return new Error(`Authentication required. Please log in and try again.`);
  }
  
  if (error.code === 'functions/permission-denied') {
    return new Error(`Permission denied. You do not have permission to perform this ${operation}.`);
  }
  
  if (error.code === 'functions/invalid-argument') {
    return new Error(`Invalid input: ${error.message || 'Please check your input and try again.'}`);
  }
  
  // CORS-related errors
  if (error.message?.includes('CORS') || 
      error.message?.includes('Access-Control-Allow-Origin') ||
      error.message?.includes('No \'Access-Control-Allow-Origin\' header')) {
    return new Error(`CORS Error: Functions may not be deployed or configured correctly. Please deploy functions: firebase deploy --only functions`);
  }
  
  // Network errors
  if (error.code === 'auth/network-request-failed' || 
      error.message?.includes('network') ||
      error.message?.includes('fetch')) {
    return new Error(`Network error. Please check your internet connection and try again.`);
  }
  
  // Return the original error message if we have one
  return new Error(error.message || `Failed to complete ${operation}. Please try again.`);
};

/**
 * Utility function to handle Firebase Storage errors
 * @param {Error} error - The error object from Firebase Storage
 * @param {string} operation - Description of the storage operation
 * @returns {Error} - User-friendly error message
 */
export const handleStorageError = (error, operation = 'storage operation') => {
  console.error(`Error during ${operation}:`, error);
  
  if (error.code === 'storage/unauthorized') {
    return new Error(`Unauthorized: You do not have permission to perform this ${operation}.`);
  }
  
  if (error.code === 'storage/canceled') {
    return new Error(`${operation} was canceled. Please try again.`);
  }
  
  if (error.code === 'storage/quota-exceeded') {
    return new Error(`Storage quota exceeded. Please contact support.`);
  }
  
  if (error.code === 'storage/unauthenticated') {
    return new Error(`Authentication required. Please log in and try again.`);
  }
  
  if (error.message?.includes('CORS')) {
    return new Error(`CORS Error: Storage may not be configured correctly. Please check storage rules and CORS configuration.`);
  }
  
  return new Error(error.message || `Failed to complete ${operation}. Please try again.`);
};

