import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../../services/announcement.service';
import { Modal } from '../shared/Modal';
import { Megaphone, Plus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const Announcements = () => {
  const { userClaims, currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    audience: 'employees',
  });

  useEffect(() => {
    loadAnnouncements();
  }, [userClaims]);

  const loadAnnouncements = async () => {
    try {
      if (!userClaims?.orgId) return;
      setLoading(true);
      const data = await getAnnouncements(userClaims.orgId);
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    try {
      setSubmitting(true);
      const createdByName = currentUser?.displayName || currentUser?.email || 'Admin';
      await createAnnouncement(
        userClaims.orgId,
        formData,
        currentUser.uid,
        createdByName
      );
      toast.success('Announcement created successfully');
      closeModal();
      loadAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error(error.message || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = () => {
    setFormData({
      title: '',
      message: '',
      audience: 'employees',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      title: '',
      message: '',
      audience: 'employees',
    });
  };

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
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">Publish announcements to your employees</p>
        </div>
        <button
          onClick={openModal}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm hover:shadow-md text-sm sm:text-base min-h-[44px] sm:min-h-0"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span className="whitespace-nowrap">New Announcement</span>
        </button>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
          <Megaphone className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-sm sm:text-base text-gray-500 mb-4">No announcements yet</p>
          <button
            onClick={openModal}
            className="px-4 py-2.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 text-sm sm:text-base min-h-[44px] sm:min-h-0"
          >
            Create First Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white rounded-lg shadow p-4 sm:p-6"
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words">
                    {announcement.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                      {announcement.audience}
                    </span>
                    <span>By {announcement.createdByName || 'Admin'}</span>
                    <span className="whitespace-nowrap">
                      {announcement.createdAt?.toDate
                        ? format(announcement.createdAt.toDate(), 'MMM dd, yyyy • h:mm a')
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">{announcement.message}</p>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm('Delete this announcement? This action cannot be undone.')) {
                      return;
                    }
                    try {
                      await deleteAnnouncement(userClaims.orgId, announcement.id);
                      toast.success('Announcement deleted');
                      loadAnnouncements();
                    } catch (error) {
                      toast.error(error.message || 'Failed to delete announcement');
                    }
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Announcement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Create New Announcement"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px] sm:min-h-0"
              placeholder="Enter announcement title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message *
            </label>
            <textarea
              required
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
              placeholder="Enter announcement message"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Target Audience *
            </label>
            <select
              value={formData.audience}
              onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
              className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px] sm:min-h-0"
            >
              <option value="employees">Employees Only</option>
              <option value="admins">Admins Only</option>
              <option value="all">All Users</option>
            </select>
            <p className="mt-1.5 text-xs text-gray-500">
              Select who should see this announcement
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={closeModal}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[44px] sm:min-h-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
            >
              {submitting ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

