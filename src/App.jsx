import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SuperAdminRoute } from './components/auth/SuperAdminRoute';
import { RoleBasedRedirect } from './components/auth/RoleBasedRedirect';
import { Login } from './components/auth/Login';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';

// Admin Components
import { Dashboard as AdminDashboard } from './components/admin/Dashboard';
import { UserManagement } from './components/admin/UserManagement';
import { PayrollUpload } from './components/admin/PayrollUpload';
import { UploadHistory } from './components/admin/UploadHistory';
import { OrganizationSettings } from './components/admin/OrganizationSettings';
import { TimetableManagement } from './components/admin/TimetableManagement';
import { LeaveManagement } from './components/admin/LeaveManagement';
import { AttendanceManagement } from './components/admin/AttendanceManagement';
import { Announcements } from './components/admin/Announcements';
import { EmployeeAnnouncements } from './components/employee/Announcements';

// Employee Components (also used by admins for their own payslips)
import { Dashboard as EmployeeDashboard } from './components/employee/Dashboard';
import { MyPayslips } from './components/employee/MyPayslips';
import { Profile } from './components/employee/Profile';
import { Timetable } from './components/employee/Timetable';
import { LeaveManagement as EmployeeLeaveManagement } from './components/employee/LeaveManagement';
import { Colleagues } from './components/employee/Colleagues';
import { MyAttendance } from './components/employee/MyAttendance';
import { HelpSupport } from './components/employee/HelpSupport';

// Super Admin Components
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-14 sm:pt-16">
        <Sidebar />
        <main className="flex-1 w-full min-w-0 flex flex-col">
          <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-20 sm:pb-16">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </div>
          {/* Watermark Footer */}
          <div className="bg-white border-t border-gray-200 py-2 sm:py-3 px-3 sm:px-4 lg:px-8">
            <p className="text-center text-xs sm:text-sm text-gray-500">
              Made by <span className="font-semibold text-primary-600">OFDLabs</span> with <span className="text-red-500">❤</span>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SidebarProvider>
          <Toaster position="top-right" />
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Super Admin Routes */}
          <Route
            path="/superadmin/dashboard"
            element={
              <SuperAdminRoute>
                <SuperAdminDashboard />
              </SuperAdminRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requireAdmin>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <AppLayout>
                  <UserManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/upload"
            element={
              <ProtectedRoute requireAdmin>
                <AppLayout>
                  <PayrollUpload />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/history"
            element={
              <ProtectedRoute requireAdmin>
                <AppLayout>
                  <UploadHistory />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/timetable"
            element={
              <ProtectedRoute requireAdmin>
                <AppLayout>
                  <TimetableManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leave-management"
            element={
              <ProtectedRoute requireAdmin>
                <AppLayout>
                  <LeaveManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute requireAdmin>
                <AppLayout>
                  <OrganizationSettings />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attendance"
            element={
              <ProtectedRoute requireAdmin>
                <AppLayout>
                  <AttendanceManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute requireAdmin>
                <AppLayout>
                  <Announcements />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Employee Routes */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <EmployeeDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/payslips"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MyPayslips />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/timetable"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Timetable />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/leaves"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <EmployeeLeaveManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/colleagues"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Colleagues />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/attendance"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MyAttendance />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/help-support"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <HelpSupport />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/announcements"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <EmployeeAnnouncements />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<RoleBasedRedirect />} />
          <Route path="*" element={<RoleBasedRedirect />} />
          </Routes>
        </SidebarProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

