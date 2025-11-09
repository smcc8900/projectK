# Geofencing Attendance System Implementation

## Overview
This document outlines the implementation of the geofencing-based attendance system and password visibility toggle feature.

## Features Implemented

### 1. Login Page Password Show/Hide Toggle ✅
**Location:** `/src/components/auth/Login.jsx`

- Added Eye/EyeOff icons from lucide-react
- Implemented toggle button to show/hide password
- Password field type switches between "text" and "password"
- Smooth transition with hover effects

### 2. Geofencing Location Settings ✅
**Location:** `/src/components/admin/OrganizationSettings.jsx`

**Features:**
- New "Geofencing" tab in Organization Settings
- Admin can set office location with:
  - Latitude and Longitude (required)
  - Office Address (optional)
  - Geofence Radius (10-1000 meters, default 50m)
- "Detect Current Location" button to auto-fill coordinates
- Validation for coordinate ranges and radius limits
- Settings saved to organization document in Firestore

**Data Structure:**
```javascript
{
  geofenceLocation: {
    latitude: number,
    longitude: number,
    radius: number,
    address: string
  }
}
```

### 3. Attendance Service ✅
**Location:** `/src/services/attendance.service.js`

**Functions:**
- `calculateDistance()` - Haversine formula to calculate distance between coordinates
- `isWithinGeofence()` - Check if user is within allowed radius
- `checkIn()` - Record employee check-in with location
- `checkOut()` - Record employee check-out with location
- `getTodayAttendance()` - Get current day's attendance record
- `getUserAttendance()` - Get attendance history for a user
- `getOrganizationAttendance()` - Get all attendance records (admin)

**Firestore Collection:** `attendance`
```javascript
{
  userId: string,
  orgId: string,
  checkIn: timestamp,
  checkOut: timestamp | null,
  date: timestamp,
  checkInLocation: { latitude, longitude },
  checkOutLocation: { latitude, longitude } | null,
  status: 'checked-in' | 'checked-out',
  createdAt: timestamp
}
```

### 4. Employee Attendance Widget ✅
**Location:** `/src/components/employee/AttendanceWidget.jsx`

**Features:**
- Real-time location detection using browser geolocation API
- Shows "In Range" or "Out of Range" status
- Check-in button (only when in range and not checked in)
- Check-out button (only when checked in and in range)
- Displays today's check-in/check-out times
- Shows office address if configured
- Automatic geofence validation (50m radius)
- Error handling for location permissions

**User Experience:**
- Widget only appears if geofencing is configured
- Disabled buttons when out of range
- Clear status indicators with color coding
- Real-time feedback on location status

### 5. Admin Attendance Dashboard ✅
**Location:** `/src/components/admin/AttendanceManagement.jsx`

**Features:**
- Date selector to view attendance for any date
- Statistics cards showing:
  - Checked In count
  - Checked Out count
  - On Leave count
  - Absent count
- Employee list table with:
  - Employee name and email
  - Status (Checked In, Checked Out, On Leave, Absent)
  - Check-in time
  - Check-out time
- Separate section showing employees on leave with:
  - Leave type
  - Leave dates
  - Reason

**Integration:**
- Pulls leave data from `leaveRequests` collection
- Filters approved leaves for selected date
- Calculates absent employees (total - checked in - on leave)

### 6. Navigation Updates ✅
**Locations:**
- `/src/App.jsx` - Added attendance route
- `/src/components/common/Sidebar.jsx` - Added attendance link to admin sidebar

## How to Use

### For Admins:

1. **Configure Geofencing:**
   - Go to Organization Settings → Geofencing tab
   - Either click "Detect Current Location" or manually enter coordinates
   - Set the radius (recommended: 50-100 meters)
   - Optionally add office address
   - Click "Save Geofencing Settings"

2. **Monitor Attendance:**
   - Go to Attendance page from sidebar
   - Select date to view attendance
   - See who is checked in, checked out, on leave, or absent
   - View detailed check-in/check-out times

### For Employees:

1. **Check In:**
   - Go to Employee Dashboard
   - Ensure location services are enabled
   - Wait for "In Range" status
   - Click "Check In" button

2. **Check Out:**
   - Return to Employee Dashboard
   - Ensure you're within range
   - Click "Check Out" button

## Technical Details

### Geofencing Algorithm:
- Uses Haversine formula for accurate distance calculation
- Accounts for Earth's curvature
- Distance calculated in meters
- Validates user location against office coordinates

### Security:
- Location data stored with each check-in/check-out
- Prevents duplicate check-ins on same day
- Requires check-in before check-out
- Admin-only access to geofencing settings

### Browser Compatibility:
- Requires browser with Geolocation API support
- Graceful degradation if location unavailable
- Clear error messages for permission issues

## Database Schema

### Organizations Collection Update:
```javascript
{
  // ... existing fields
  geofenceLocation: {
    latitude: number,
    longitude: number,
    radius: number,
    address: string
  }
}
```

### New Attendance Collection:
```javascript
{
  userId: string,
  orgId: string,
  checkIn: timestamp,
  checkOut: timestamp | null,
  date: timestamp (start of day),
  checkInLocation: {
    latitude: number,
    longitude: number
  },
  checkOutLocation: {
    latitude: number,
    longitude: number
  } | null,
  status: 'checked-in' | 'checked-out',
  createdAt: timestamp
}
```

## Future Enhancements (Optional)

1. **Attendance Reports:**
   - Monthly attendance summary
   - Export to Excel/PDF
   - Attendance percentage calculations

2. **Notifications:**
   - Remind employees to check in/out
   - Alert admin for absent employees

3. **Multiple Locations:**
   - Support for multiple office locations
   - Location-based check-in

4. **Attendance History:**
   - Employee view of their attendance history
   - Calendar view of attendance

5. **Late Check-in Tracking:**
   - Define office hours
   - Track late arrivals
   - Early departures

## Testing Checklist

- [ ] Admin can set geofencing location
- [ ] Admin can detect current location
- [ ] Employee sees attendance widget when geofencing is configured
- [ ] Employee can check in when in range
- [ ] Employee cannot check in when out of range
- [ ] Employee can check out after checking in
- [ ] Admin can view today's attendance
- [ ] Admin can view historical attendance
- [ ] Leave status shows correctly in attendance dashboard
- [ ] Absent count calculated correctly
- [ ] Password show/hide toggle works on login page

## Notes

- Geofencing requires HTTPS in production for browser geolocation
- Location accuracy depends on device GPS capabilities
- Recommend testing with actual devices at office location
- Consider privacy implications and inform employees about location tracking
