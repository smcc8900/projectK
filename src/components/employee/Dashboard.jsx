import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAnnouncements } from '../../services/announcement.service';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Megaphone, Calendar, CalendarCheck, ChevronDown, ChevronUp, Clock, MapPin, User } from 'lucide-react';
import { format, isToday, startOfDay, isAfter } from 'date-fns';
import { AttendanceWidget } from './AttendanceWidget';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { currentUser, userClaims, hasFeature } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [expandedClasses, setExpandedClasses] = useState(false);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState({});
  const [loading, setLoading] = useState(true);
  const timetableEnabled = hasFeature('timetable');

  useEffect(() => {
    loadDashboardData();
  }, [currentUser, userClaims, timetableEnabled]);

  const loadDashboardData = async () => {
    try {
      if (!userClaims?.orgId || !currentUser) return;

      // Get announcements (for all employees or all users)
      const allAnnouncements = await getAnnouncements(userClaims.orgId);
      const employeeAnnouncements = allAnnouncements.filter(
        ann => ann.audience === 'all' || ann.audience === 'employees'
      );
      setAnnouncements(employeeAnnouncements.slice(0, 5)); // Show latest 5

      // Get upcoming approved leaves
      const leavesRef = collection(db, 'leaveRequests');
      const leavesQuery = query(
        leavesRef,
        where('organizationId', '==', userClaims.orgId),
        where('userId', '==', currentUser.uid),
        where('status', '==', 'approved')
      );
      const leavesSnapshot = await getDocs(leavesQuery);
      const allLeaves = leavesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter upcoming leaves (start date is in the future or today)
      const today = startOfDay(new Date());
      const upcoming = allLeaves
        .filter(leave => {
          const startDate = leave.startDate?.toDate 
            ? startOfDay(leave.startDate.toDate())
            : startOfDay(new Date(leave.startDate));
          return isAfter(startDate, today) || isToday(startDate);
        })
        .sort((a, b) => {
          const dateA = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate);
          const dateB = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate);
          return dateA - dateB;
        })
        .slice(0, 5); // Show next 5
      setUpcomingLeaves(upcoming);

      if (timetableEnabled) {
        // Get today's classes from timetable
        const timetableRef = collection(db, 'timetables');
        const timetableQuery = query(
          timetableRef,
          where('organizationId', '==', userClaims.orgId),
          where('teacherId', '==', currentUser.uid)
        );
        const timetableSnapshot = await getDocs(timetableQuery);
        const allTimetableEntries = timetableSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Get today's day name
        const todayDayName = format(new Date(), 'EEEE'); // e.g., "Monday"
        const todayClassesList = allTimetableEntries
          .filter(entry => entry.day === todayDayName)
          .sort((a, b) => {
            // Sort by time
            const timeA = a.time || '';
            const timeB = b.time || '';
            return timeA.localeCompare(timeB);
          });
        setTodayClasses(todayClassesList);
      } else {
        setTodayClasses([]);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };


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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Welcome back, {currentUser?.displayName || currentUser?.email}!</p>
      </div>

      {/* Attendance Widget */}
      <AttendanceWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Announcements Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
              <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-600" />
              Announcements
            </h2>
            <button
              onClick={() => navigate('/employee/announcements')}
              className="text-xs sm:text-sm text-primary-600 hover:text-primary-700"
            >
              View All
            </button>
          </div>
          <div className="p-4 sm:p-6">
            {announcements.length === 0 ? (
              <p className="text-sm sm:text-base text-gray-500 text-center py-4">No announcements</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {announcements.map((announcement) => {
                  const isExpanded = expandedAnnouncements[announcement.id];
                  const isLongMessage = (announcement.message || '').length > 220;
                  return (
                  <div
                    key={announcement.id}
                    className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">{announcement.title}</h3>
                    <p
                      className={`text-xs sm:text-sm text-gray-700 break-words ${
                        isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-3'
                      }`}
                    >
                      {announcement.message}
                    </p>
                    {isLongMessage && (
                      <button
                        onClick={() =>
                          setExpandedAnnouncements(prev => ({
                            ...prev,
                            [announcement.id]: !isExpanded,
                          }))
                        }
                        className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
                        type="button"
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs text-gray-500">
                      <span>By {announcement.createdByName || 'Admin'}</span>
                      <span>
                        {announcement.createdAt?.toDate
                          ? format(announcement.createdAt.toDate(), 'MMM dd, yyyy')
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Leaves Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
              <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
              Upcoming Leaves
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            {upcomingLeaves.length === 0 ? (
              <p className="text-sm sm:text-base text-gray-500 text-center py-4">No upcoming leaves</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {upcomingLeaves.map((leave) => {
                  const startDate = leave.startDate?.toDate 
                    ? leave.startDate.toDate()
                    : new Date(leave.startDate);
                  const endDate = leave.endDate?.toDate 
                    ? leave.endDate.toDate()
                    : new Date(leave.endDate);
                  const isTodayLeave = isToday(startDate);
                  
                  return (
                    <div
                      key={leave.id}
                      className={`p-3 sm:p-4 rounded-lg border ${
                        isTodayLeave 
                          ? 'bg-yellow-50 border-yellow-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-gray-900 capitalize">{leave.leaveType || 'Leave'}</p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            {format(startDate, 'MMM dd, yyyy')} 
                            {format(startDate, 'yyyy-MM-dd') !== format(endDate, 'yyyy-MM-dd') 
                              ? ` - ${format(endDate, 'MMM dd, yyyy')}`
                              : ''}
                          </p>
                          {leave.reason && (
                            <p className="text-xs text-gray-500 mt-1 break-words">{leave.reason}</p>
                          )}
                        </div>
                        {isTodayLeave && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 flex-shrink-0">
                            Today
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Classes Section */}
      {timetableEnabled && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
              <span className="hidden sm:inline">Today's Classes ({format(new Date(), 'EEEE')})</span>
              <span className="sm:hidden">Today's Classes</span>
            </h2>
            {todayClasses.length > 0 && (
              <button
                onClick={() => setExpandedClasses(!expandedClasses)}
                className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 active:text-primary-800 flex items-center p-1 -mr-1"
                aria-label={expandedClasses ? "Collapse classes" : "Expand classes"}
              >
                {expandedClasses ? (
                  <>
                    <span className="mr-1 hidden sm:inline">Collapse</span>
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span className="mr-1 hidden sm:inline">Expand</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
          <div className="p-4 sm:p-6">
            {todayClasses.length === 0 ? (
              <p className="text-sm sm:text-base text-gray-500 text-center py-4">No classes scheduled for today</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {todayClasses.map((classItem, index) => (
                  <div
                    key={classItem.id || index}
                    className={`p-3 sm:p-4 rounded-lg border border-gray-200 ${
                      expandedClasses ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm sm:text-base font-medium text-gray-900">{classItem.time || 'N/A'}</span>
                        </div>
                        {expandedClasses && (
                          <div className="mt-3 space-y-2 pl-6 sm:pl-7">
                            <div className="flex items-start space-x-2">
                              <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              <span className="text-xs sm:text-sm text-gray-700">
                                <span className="font-medium">Subject:</span> {classItem.subject || 'N/A'}
                              </span>
                            </div>
                            {classItem.room && (
                              <div className="flex items-start space-x-2">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                <span className="text-xs sm:text-sm text-gray-700">
                                  <span className="font-medium">Room:</span> {classItem.room}
                                </span>
                              </div>
                            )}
                            {classItem.class && (
                              <div className="flex items-start space-x-2">
                                <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                <span className="text-xs sm:text-sm text-gray-700">
                                  <span className="font-medium">Class:</span> {classItem.class}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {!expandedClasses && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-1 pl-6 sm:pl-7 break-words">
                            {classItem.subject || 'N/A'}
                            {classItem.room && ` • Room: ${classItem.room}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

