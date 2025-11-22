import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Upload, 
  FileText, 
  History,
  Wallet,
  UserCircle,
  Settings,
  Calendar,
  ClipboardList,
  UserCheck,
  CalendarCheck,
  Clock,
  HelpCircle,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar = () => {
  const { isAdmin, hasFeature } = useAuth();
  const location = useLocation();

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', feature: null },
    { to: '/admin/users', icon: Users, label: 'User Management', feature: null },
    { to: '/admin/announcements', icon: Megaphone, label: 'Announcements', feature: null },
    { to: '/admin/upload', icon: Upload, label: 'Upload Payroll', feature: 'payslips' },
    { to: '/admin/history', icon: History, label: 'Upload History', feature: 'payslips' },
    { to: '/admin/timetable', icon: Calendar, label: 'Manage Timetable', feature: 'timetable' },
    { to: '/admin/leave-management', icon: ClipboardList, label: 'Leave Management', feature: 'leaves' },
    { to: '/admin/attendance', icon: Clock, label: 'Attendance', feature: null },
    { to: '/employee/payslips', icon: FileText, label: 'My Payslips', feature: 'payslips' },
    { to: '/admin/settings', icon: Settings, label: 'Organization Settings', feature: null },
  ];

  const employeeLinks = [
    { to: '/employee/dashboard', icon: LayoutDashboard, label: 'Dashboard', feature: null },
    { to: '/employee/announcements', icon: Megaphone, label: 'Announcements', feature: null },
    { to: '/employee/payslips', icon: Wallet, label: 'My Payslips', feature: 'payslips' },
    { to: '/employee/attendance', icon: Clock, label: 'My Attendance', feature: null },
    { to: '/employee/timetable', icon: Calendar, label: 'Timetable', feature: 'timetable' },
    { to: '/employee/leaves', icon: CalendarCheck, label: 'Leave Management', feature: 'leaves' },
    { to: '/employee/colleagues', icon: UserCheck, label: 'Colleagues', feature: 'colleagues' },
    { to: '/employee/profile', icon: UserCircle, label: 'Profile', feature: 'profile' },
  ];

  const allLinks = isAdmin() ? adminLinks : employeeLinks;
  // Filter links based on features
  const links = allLinks.filter(link => !link.feature || hasFeature(link.feature));

  return (
    <>
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <aside
        className="hidden lg:block lg:static w-72 bg-white border-r border-gray-200 h-screen"
      >
        {/* Sidebar Header - Desktop only */}
        <div className="hidden lg:block px-6 py-5 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Navigation</h2>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 lg:p-4 space-y-1 lg:space-y-2 pt-4 lg:pt-4">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${location.pathname === link.to ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                <span className="text-sm lg:text-base">{link.label}</span>
                {location.pathname === link.to && (
                  <div className="ml-auto w-1.5 h-1.5 bg-primary-600 rounded-full" />
                )}
              </NavLink>
            );
          })}
          
          {/* Help & Support - Available to all users */}
          <div className="pt-2 mt-2 border-t border-gray-200">
            <NavLink
              to="/employee/help-support"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <HelpCircle className={`w-5 h-5 flex-shrink-0 ${location.pathname === '/employee/help-support' ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
              <span className="text-sm lg:text-base">Help & Support</span>
              {location.pathname === '/employee/help-support' && (
                <div className="ml-auto w-1.5 h-1.5 bg-primary-600 rounded-full" />
              )}
            </NavLink>
          </div>
        </nav>

      </aside>
    </>
  );
};

