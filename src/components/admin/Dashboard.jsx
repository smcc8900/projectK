import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUsers } from '../../services/user.service';
import { getPayslips, getUploadHistory } from '../../services/payslip.service';
import { getAnnouncements } from '../../services/announcement.service';
import { Users, DollarSign, FileText, TrendingUp, Clock, Megaphone } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AttendanceWidget } from '../employee/AttendanceWidget';

export const Dashboard = () => {
  const { userClaims, currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    monthlyPayroll: 0,
    pendingLeaveRequests: 0,
  });
  const [recentUploads, setRecentUploads] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [userClaims, currentUser]);

  const loadDashboardData = async () => {
    try {
      if (!userClaims?.orgId || !currentUser) return;

      // Get users
      const users = await getUsers(userClaims.orgId);
      const activeUsers = users.filter(u => u.isActive);

      // Get current month payslips for ALL employees to calculate total payroll
      const currentMonth = format(new Date(), 'yyyy-MM');
      const payslips = await getPayslips(userClaims.orgId, { 
        month: currentMonth
      });
      
      const monthlyPayroll = payslips.reduce((sum, p) => sum + (p.netSalary || 0), 0);

      // Get pending leave requests
      const leavesRef = collection(db, 'leaveRequests');
      const leaveQuery = query(
        leavesRef, 
        where('organizationId', '==', userClaims.orgId),
        where('status', '==', 'pending')
      );
      const leaveSnapshot = await getDocs(leaveQuery);
      const pendingLeaves = leaveSnapshot.size;

      // Get recent uploads
      const uploads = await getUploadHistory(userClaims.orgId);

      // Get recent announcements
      const allAnnouncements = await getAnnouncements(userClaims.orgId);
      const recentAnnouncements = allAnnouncements.slice(0, 3); // Show latest 3

      setStats({
        totalEmployees: users.length,
        activeEmployees: activeUsers.length,
        monthlyPayroll,
        pendingLeaveRequests: pendingLeaves,
      });

      setRecentUploads(uploads.slice(0, 5));
      setAnnouncements(recentAnnouncements);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center">
        <div className={`p-2 sm:p-3 rounded-full ${color} bg-opacity-10 flex-shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="ml-3 sm:ml-4 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 break-words">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Attendance Widget - Admins can also check in/out */}
      <AttendanceWidget />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          title="Total Employees"
          value={stats.totalEmployees}
          color="bg-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          title="Active Employees"
          value={stats.activeEmployees}
          color="bg-green-500"
        />
        <StatCard
          icon={DollarSign}
          title="Monthly Payroll"
          value={`$${stats.monthlyPayroll.toLocaleString()}`}
          color="bg-purple-500"
        />
        <StatCard
          icon={Clock}
          title="Pending Leave Requests"
          value={stats.pendingLeaveRequests}
          color="bg-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Announcements */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Megaphone className="w-5 h-5 mr-2 text-primary-600" />
              Recent Announcements
            </h2>
            <button
              onClick={() => navigate('/admin/announcements')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All
            </button>
          </div>
          <div className="p-6">
            {announcements.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">No announcements yet</p>
                <button
                  onClick={() => navigate('/admin/announcements')}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                >
                  Create Announcement
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{announcement.title}</h3>
                    <p className="text-sm text-gray-700 line-clamp-2">{announcement.message}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full capitalize">
                        {announcement.audience}
                      </span>
                      <span>
                        {announcement.createdAt?.toDate
                          ? format(announcement.createdAt.toDate(), 'MMM dd, yyyy')
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Uploads */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Uploads</h2>
          </div>
          <div className="p-6">
            {recentUploads.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent uploads</p>
            ) : (
              <div className="space-y-4">
                {recentUploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{upload.fileName}</p>
                      <p className="text-sm text-gray-600">
                        {upload.stats.successCount} successful, {upload.stats.failedCount} failed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {upload.createdAt?.toDate 
                          ? format(upload.createdAt.toDate(), 'MMM dd, yyyy')
                          : 'N/A'}
                      </p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          upload.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : upload.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {upload.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

