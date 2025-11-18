import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getOrganization } from '../../services/organization.service';
import { HelpCircle, Mail, Phone, MessageSquare, MapPin, Clock } from 'lucide-react';

export const HelpSupport = () => {
  const { userClaims } = useAuth();
  const [helpInfo, setHelpInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHelpInfo();
  }, [userClaims?.orgId]);

  const loadHelpInfo = async () => {
    if (!userClaims?.orgId) {
      setLoading(false);
      return;
    }

    try {
      const org = await getOrganization(userClaims.orgId);
      setHelpInfo(org.helpSupport || getDefaultHelpInfo());
    } catch (error) {
      console.error('Error loading help info:', error);
      setHelpInfo(getDefaultHelpInfo());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultHelpInfo = () => ({
    contactEmail: '',
    contactPhone: '',
    officeAddress: '',
    businessHours: '',
    supportMessage: 'For assistance, please contact your administrator.',
    faq: [],
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading help information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <HelpCircle className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
      </div>

      {/* Support Message */}
      {helpInfo?.supportMessage && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700 whitespace-pre-line">{helpInfo.supportMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {helpInfo?.contactEmail && (
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <a
                  href={`mailto:${helpInfo.contactEmail}`}
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  {helpInfo.contactEmail}
                </a>
              </div>
            </div>
          )}

          {helpInfo?.contactPhone && (
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Phone</p>
                <a
                  href={`tel:${helpInfo.contactPhone}`}
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  {helpInfo.contactPhone}
                </a>
              </div>
            </div>
          )}

          {helpInfo?.officeAddress && (
            <div className="flex items-start space-x-3 md:col-span-2">
              <MapPin className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Office Address</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">{helpInfo.officeAddress}</p>
              </div>
            </div>
          )}

          {helpInfo?.businessHours && (
            <div className="flex items-start space-x-3 md:col-span-2">
              <Clock className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Business Hours</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">{helpInfo.businessHours}</p>
              </div>
            </div>
          )}
        </div>

        {!helpInfo?.contactEmail && !helpInfo?.contactPhone && !helpInfo?.officeAddress && !helpInfo?.businessHours && (
          <p className="text-sm text-gray-500 text-center py-4">
            Contact information will be displayed here once configured by your administrator.
          </p>
        )}
      </div>

      {/* FAQ Section */}
      {helpInfo?.faq && helpInfo.faq.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {helpInfo.faq.map((item, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{item.question}</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

