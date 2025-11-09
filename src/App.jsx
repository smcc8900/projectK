import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
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

// Employee Components (also used by admins for their own payslips)
import { Dashboard as EmployeeDashboard } from './components/employee/Dashboard';
import { MyPayslips } from './components/employee/MyPayslips';
import { Profile } from './components/employee/Profile';
import { Timetable } from './components/employee/Timetable';
import { LeaveManagement as EmployeeLeaveManagement } from './components/employee/LeaveManagement';
import { Colleagues } from './components/employee/Colleagues';
import { MyAttendance } from './components/employee/MyAttendance';

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-14 sm:pt-16">
        <Sidebar />
        <main className="flex-1 w-full min-w-0 flex flex-col">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-12 pb-16">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
          {/* Watermark Footer */}
          <div className="bg-white border-t border-gray-200 py-3 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
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

