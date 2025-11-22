import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  checkIn, 
  checkOut, 
  getTodayAttendance, 
  isWithinGeofence 
} from '../../services/attendance.service';
import toast from 'react-hot-toast';
import { MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export const AttendanceWidget = () => {
  const { currentUser, userClaims, organization } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [withinGeofence, setWithinGeofence] = useState(false);

  useEffect(() => {
    loadTodayAttendance();
  }, [currentUser, userClaims]);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation && organization?.geofenceLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(location);
          
          // Check if within geofence
          const within = isWithinGeofence(
            location.latitude,
            location.longitude,
            organization.geofenceLocation.latitude,
            organization.geofenceLocation.longitude,
            organization.geofenceLocation.radius
          );
          setWithinGeofence(within);
          setLocationError(null);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to access your location. Please enable location services.');
        }
      );
    }
  }, [organization]);

  const loadTodayAttendance = async () => {
    try {
      if (!currentUser || !userClaims?.orgId) return;
      
      const todayRecord = await getTodayAttendance(currentUser.uid, userClaims.orgId);
      setAttendance(todayRecord);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!userLocation) {
      toast.error('Unable to get your location. Please enable location services.');
      return;
    }

    if (!withinGeofence) {
      toast.error(`You must be within ${organization.geofenceLocation.radius}m of the office to check in.`);
      return;
    }

    setActionLoading(true);
    try {
      const record = await checkIn(currentUser.uid, userClaims.orgId, userLocation);
      setAttendance(record);
      toast.success('Checked in successfully!');
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error(error.message || 'Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!userLocation) {
      toast.error('Unable to get your location. Please enable location services.');
      return;
    }

    if (!withinGeofence) {
      toast.error(`You must be within ${organization.geofenceLocation.radius}m of the office to check out.`);
      return;
    }

    setActionLoading(true);
    try {
      const record = await checkOut(currentUser.uid, userClaims.orgId, userLocation);
      setAttendance(record);
      toast.success('Checked out successfully!');
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error(error.message || 'Failed to check out');
    } finally {
      setActionLoading(false);
    }
  };

  // If geofencing is not configured, don't show the widget
  if (!organization?.geofenceLocation?.latitude || !organization?.geofenceLocation?.longitude) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-10 sm:h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const isCheckedIn = attendance && attendance.status === 'checked-in';
  const isCheckedOut = attendance && attendance.status === 'checked-out';

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-600" />
          Attendance
        </h3>
        {withinGeofence ? (
          <span className="flex items-center text-xs sm:text-sm text-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            In Range
          </span>
        ) : (
          <span className="flex items-center text-xs sm:text-sm text-red-600">
            <XCircle className="w-4 h-4 mr-1" />
            Out of Range
          </span>
        )}
      </div>

      {locationError && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-yellow-800">{locationError}</p>
          </div>
        </div>
      )}

      {/* Status Display */}
      {attendance && (
        <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-md">
          <div className="space-y-2">
            {attendance.checkIn && (
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Check In:</span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {attendance.checkIn.toDate ? format(attendance.checkIn.toDate(), 'hh:mm a') : 'Just now'}
                </span>
              </div>
            )}
            {attendance.checkOut && (
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Check Out:</span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {attendance.checkOut.toDate ? format(attendance.checkOut.toDate(), 'hh:mm a') : 'Just now'}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-xs sm:text-sm text-gray-600">Status:</span>
              <span className={`text-xs sm:text-sm font-semibold ${
                isCheckedIn ? 'text-green-600' : isCheckedOut ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {isCheckedIn ? 'Checked In' : isCheckedOut ? 'Checked Out' : 'Not Checked In'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 sm:space-y-3">
        {!isCheckedIn && !isCheckedOut && (
          <button
            onClick={handleCheckIn}
            disabled={actionLoading || !withinGeofence || !!locationError}
            className="w-full flex items-center justify-center px-4 py-3 sm:py-2.5 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] sm:min-h-0"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {actionLoading ? 'Checking In...' : 'Check In'}
          </button>
        )}

        {isCheckedIn && (
          <button
            onClick={handleCheckOut}
            disabled={actionLoading || !withinGeofence || !!locationError}
            className="w-full flex items-center justify-center px-4 py-3 sm:py-2.5 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] sm:min-h-0"
          >
            <XCircle className="w-5 h-5 mr-2" />
            {actionLoading ? 'Checking Out...' : 'Check Out'}
          </button>
        )}

        {isCheckedOut && (
          <div className="text-center py-2">
            <p className="text-xs sm:text-sm text-gray-600">You have completed your attendance for today.</p>
          </div>
        )}
      </div>

      {/* Location Info */}
      {organization.geofenceLocation.address && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-start text-xs sm:text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <span className="break-words">{organization.geofenceLocation.address}</span>
          </div>
        </div>
      )}

      {!withinGeofence && !locationError && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
          <p className="text-xs text-orange-800">
            You must be within {organization.geofenceLocation.radius} meters of the office location to check in/out.
          </p>
        </div>
      )}
    </div>
  );
};
