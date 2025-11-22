import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, DollarSign, TrendingUp, Clock, Megaphone } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
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
    if (!userClaims?.orgId || !currentUser) return;

    setLoading(true);
    const unsubscribes = [];

    // Users listener
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, where('orgId', '==', userClaims.orgId));
    unsubscribes.push(
      onSnapshot(usersQuery, (snapshot) => {
        const users = snapshot.docs.map(doc => doc.data());
        const activeUsers = users.filter(user => user.isActive);
        setStats(prev => ({
          ...prev,
          totalEmployees: users.length,
          activeEmployees: activeUsers.length,
        }));
      })
    );

    // Payslips listener for current month payroll
    const currentMonth = format(new Date(), 'yyyy-MM');
    const payslipsRef = collection(db, 'payslips');
    const payslipsQuery = query(
      payslipsRef,
      where('orgId', '==', userClaims.orgId),
      where('month', '==', currentMonth)
    );
    unsubscribes.push(
      onSnapshot(payslipsQuery, (snapshot) => {
        const monthlyPayroll = snapshot.docs.reduce(
          (sum, doc) => sum + (doc.data().netSalary || 0),
          0
        );
        setStats(prev => ({
          ...prev,
          monthlyPayroll,
        }));
      })
    );

    // Pending leave requests
    const leavesRef = collection(db, 'leaveRequests');
    const leaveQuery = query(
      leavesRef,
      where('organizationId', '==', userClaims.orgId),
      where('status', '==', 'pending')
    );
    unsubscribes.push(
      onSnapshot(leaveQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          pendingLeaveRequests: snapshot.size,
        }));
      })
    );

    // Recent uploads
    const uploadsRef = collection(db, 'uploadHistory');
    const uploadsQuery = query(
      uploadsRef,
      where('orgId', '==', userClaims.orgId),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    unsubscribes.push(
      onSnapshot(uploadsQuery, (snapshot) => {
        setRecentUploads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      })
    );

    // Announcements (latest 3)
    const announcementsRef = collection(db, `organizations/${userClaims.orgId}/announcements`);
    const announcementsQuery = query(
      announcementsRef,
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    unsubscribes.push(
      onSnapshot(announcementsQuery, (snapshot) => {
        setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      })
    );

    setLoading(false);

    return () => {
      unsubscribes.forEach(unsub => unsub && unsub());
    };
  }, [userClaims?.orgId, currentUser]);

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6">
      <div className="flex items-center">
        <div className={`p-2 sm:p-2.5 md:p-3 rounded-full ${color} bg-opacity-10 flex-shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="ml-3 sm:ml-4 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 break-words mt-0.5">{value}</p>
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
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Attendance Widget - Admins can also check in/out */}
      <AttendanceWidget />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Announcements */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
              <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-600" />
              Recent Announcements
            </h2>
            <button
              onClick={() => navigate('/admin/announcements')}
              className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 active:text-primary-800 p-1 -mr-1"
            >
              View All
            </button>
          </div>
          <div className="p-4 sm:p-6">
            {announcements.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm sm:text-base text-gray-500 mb-4">No announcements yet</p>
                <button
                  onClick={() => navigate('/admin/announcements')}
                  className="px-4 py-2.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 text-sm min-h-[44px] sm:min-h-0"
                >
                  Create Announcement
                </button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">{announcement.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-700 line-clamp-2 break-words">{announcement.message}</p>
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full capitalize w-fit">
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
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">Recent Uploads</h2>
          </div>
          <div className="p-4 sm:p-6">
            {recentUploads.length === 0 ? (
              <p className="text-sm sm:text-base text-gray-500 text-center py-4">No recent uploads</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentUploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 sm:p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{upload.fileName}</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                        {upload.stats.successCount} successful, {upload.stats.failedCount} failed
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start gap-2 sm:gap-1">
                      <p className="text-xs sm:text-sm text-gray-600">
                        {upload.createdAt?.toDate 
                          ? format(upload.createdAt.toDate(), 'MMM dd, yyyy')
                          : 'N/A'}
                      </p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
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

