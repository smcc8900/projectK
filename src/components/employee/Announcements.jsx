import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAnnouncements } from '../../services/announcement.service';
import { Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const EmployeeAnnouncements = () => {
  const { userClaims } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        if (!userClaims?.orgId) return;
        setLoading(true);
        const data = await getAnnouncements(userClaims.orgId);
        const filtered = data.filter(
          ann => ann.audience === 'all' || ann.audience === 'employees'
        );
        setAnnouncements(filtered);
      } catch (error) {
        console.error('Error loading announcements:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userClaims?.orgId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="mt-1 text-sm text-gray-500">
            Latest updates shared by your organization
          </p>
        </div>
        <button
          onClick={() => navigate('/employee/dashboard')}
          className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Back to Dashboard
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Megaphone className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(announcement => {
            const isExpanded = expanded[announcement.id];
            const isLong = (announcement.message || '').length > 260;

            return (
              <div key={announcement.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500">
                      {announcement.createdAt?.toDate
                        ? format(announcement.createdAt.toDate(), 'MMM dd, yyyy • h:mm a')
                        : 'N/A'}
                    </p>
                    <h2 className="text-lg font-semibold text-gray-900 mt-1">
                      {announcement.title}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      By {announcement.createdByName || 'Admin'}
                    </p>
                  </div>
                </div>
                <p
                  className={`text-sm text-gray-700 mt-4 ${
                    isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-5'
                  }`}
                >
                  {announcement.message}
                </p>
                {isLong && (
                  <button
                    onClick={() =>
                      setExpanded(prev => ({
                        ...prev,
                        [announcement.id]: !isExpanded,
                      }))
                    }
                    className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

