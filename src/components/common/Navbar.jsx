import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LogOut, 
  User, 
  X, 
  Settings, 
  HelpCircle,
  LayoutDashboard,
  Users,
  Upload,
  History,
  FileText,
  Wallet,
  UserCircle,
  Calendar,
  ClipboardList,
  UserCheck,
  CalendarCheck
} from 'lucide-react';

export const Navbar = () => {
  const { currentUser, signOut, isAdmin, isSuperAdmin, organization, hasFeature } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setShowUserMenu(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = isSuperAdmin() 
    ? 'OFD Labs - Super Admin' 
    : (organization?.orgName || 'Payroll System');

  // Define navigation links with features
  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', feature: null },
    { to: '/admin/users', icon: Users, label: 'User Management', feature: null },
    { to: '/admin/upload', icon: Upload, label: 'Upload Payroll', feature: 'payslips' },
    { to: '/admin/history', icon: History, label: 'Upload History', feature: 'payslips' },
    { to: '/admin/timetable', icon: Calendar, label: 'Manage Timetable', feature: 'timetable' },
    { to: '/admin/leave-management', icon: ClipboardList, label: 'Leave Management', feature: 'leaves' },
    { to: '/employee/payslips', icon: FileText, label: 'My Payslips', feature: 'payslips' },
    { to: '/admin/settings', icon: Settings, label: 'Organization Settings', feature: null },
  ];

  const employeeLinks = [
    { to: '/employee/dashboard', icon: LayoutDashboard, label: 'Dashboard', feature: null },
    { to: '/employee/payslips', icon: Wallet, label: 'My Payslips', feature: 'payslips' },
    { to: '/employee/timetable', icon: Calendar, label: 'Timetable', feature: 'timetable' },
    { to: '/employee/leaves', icon: CalendarCheck, label: 'Leave Management', feature: 'leaves' },
    { to: '/employee/colleagues', icon: UserCheck, label: 'Colleagues', feature: 'colleagues' },
    { to: '/employee/profile', icon: UserCircle, label: 'Profile', feature: 'profile' },
  ];

  const allLinks = isSuperAdmin() ? [] : (isAdmin() ? adminLinks : employeeLinks);
  const navigationLinks = isSuperAdmin() ? [] : allLinks.filter(link => !link.feature || hasFeature(link.feature));

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
      <div className="px-3 sm:px-4 lg:px-6 mx-auto w-full">
        <div className="flex justify-between items-center h-14">
          {/* Left side - Logo/Title */}
          <div className="flex items-center min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold text-primary-600 truncate">
              {displayName}
            </h1>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Desktop User Info */}
            {currentUser && (
              <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate max-w-[150px] text-xs text-gray-500">{currentUser?.email}</span>
                  <span className="text-xs font-medium text-gray-700">
                    {isSuperAdmin() ? 'Super Admin' : (isAdmin() ? 'Admin' : 'Employee')}
                  </span>
                </div>
              </div>
            )}

            {/* Mobile/Tablet User Menu with Navigation */}
            <div className="relative lg:hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                }}
                className="flex items-center justify-center w-9 h-9 -mr-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="User menu"
              >
                <User className="w-5 h-5 text-gray-700" />
              </button>
              
              {showUserMenu && (
                <div className="fixed inset-0 z-40 flex flex-col">
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-50"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="relative flex-1 flex flex-col bg-white w-72 sm:w-80 h-full ml-auto shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Menu</h3>
                          <p className="text-sm text-gray-500 mt-1">Navigation & Account</p>
                        </div>
                        <button
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                    
                    {/* User Info */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.email}</p>
                          <p className="text-xs text-gray-500">
                            {isSuperAdmin() ? 'Super Administrator' : (isAdmin() ? 'Administrator' : 'Employee')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Navigation Links */}
                    <div className="flex-1 overflow-y-auto p-3">
                      <div className="space-y-1">
                        {isSuperAdmin() ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            <p>Super Admin Dashboard</p>
                            <p className="mt-2 text-xs">Manage all organizations from the dashboard</p>
                          </div>
                        ) : (
                          <>
                            {navigationLinks.map((link) => {
                              const Icon = link.icon;
                              return (
                                <NavLink
                                  key={link.to}
                                  to={link.to}
                                  onClick={() => setShowUserMenu(false)}
                                  className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-3 text-sm rounded-lg transition-colors ${
                                      isActive
                                        ? 'bg-primary-50 text-primary-700 font-semibold'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`
                                  }
                                >
                                  <Icon className="w-5 h-5" />
                                  <span>{link.label}</span>
                                </NavLink>
                              );
                            })}
                            
                            <div className="pt-2 mt-2 border-t border-gray-200">
                              <NavLink
                                to="/employee/help-support"
                                onClick={() => setShowUserMenu(false)}
                                className={({ isActive }) =>
                                  `flex items-center space-x-3 px-4 py-3 text-sm rounded-lg transition-colors ${
                                    isActive
                                      ? 'bg-primary-50 text-primary-700 font-semibold'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`
                                }
                              >
                                <HelpCircle className="w-5 h-5" />
                                <span>Help & Support</span>
                              </NavLink>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Footer with Sign Out */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleSignOut();
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Sign Out - Always visible for all users */}
            {currentUser && (
              <button
                onClick={handleSignOut}
                className="hidden lg:flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
            
            {/* Mobile Sign Out Button - Always visible on small screens */}
            {currentUser && (
              <button
                onClick={handleSignOut}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors text-gray-700"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

