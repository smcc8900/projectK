import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const SuperAdminRoute = ({ children }) => {
  const { currentUser, userClaims, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (userClaims?.role !== 'superadmin') {
    // Redirect based on their actual role
    if (userClaims?.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    }
    return <Navigate to="/employee/dashboard" />;
  }

  return children;
};
