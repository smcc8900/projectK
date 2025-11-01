import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getPayslips } from '../../services/payslip.service';
import { Modal } from '../shared/Modal';
import { format } from 'date-fns';
import { Download, Eye, Filter, X } from 'lucide-react';
import { generatePayslipPDF } from '../../utils/pdfGenerator';

export const MyPayslips = () => {
  const { currentUser, userClaims, organization } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [filteredPayslips, setFilteredPayslips] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    status: '',
  });

  useEffect(() => {
    loadPayslips();
  }, [currentUser, userClaims]);

  useEffect(() => {
    applyFilters();
  }, [payslips, filters]);

  const loadPayslips = async () => {
    try {
      if (!userClaims?.orgId || !currentUser) return;
      
      // Always filter by current user's ID - admins see only their own payslips
      const data = await getPayslips(userClaims.orgId, {
        userId: currentUser.uid,
      });
      setPayslips(data);
    } catch (error) {
      console.error('Failed to load payslips:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payslips];

    if (filters.month) {
      filtered = filtered.filter(p => p.month === filters.month);
    }

    if (filters.year) {
      filtered = filtered.filter(p => {
        const payslipYear = p.year || (p.month ? p.month.split('-')[0] : '');
        return payslipYear === filters.year;
      });
    }

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    setFilteredPayslips(filtered);
  };

  const clearFilters = () => {
    setFilters({
      month: '',
      year: '',
      status: '',
    });
    setShowFilters(false);
  };

  const hasActiveFilters = filters.month || filters.year || filters.status;

  // Get unique years and months from payslips
  const availableYears = [...new Set(payslips.map(p => p.year || (p.month ? p.month.split('-')[0] : '')).filter(Boolean))].sort().reverse();
  const availableMonths = [...new Set(payslips.map(p => p.month).filter(Boolean))].sort().reverse();

  const handleViewPayslip = (payslip) => {
    setSelectedPayslip(payslip);
    setIsModalOpen(true);
  };

  const handleDownloadPDF = async (payslip) => {
    try {
      const orgName = organization?.orgName || 'Payroll System';
      await generatePayslipPDF(payslip, currentUser, orgName);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payslips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Payslips</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Filter className="w-4 h-4 mr-2" />
          {showFilters ? 'Hide Filters' : 'Filters'}
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
              {[filters.month, filters.year, filters.status].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-gray-500" />
              Filter Payslips
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <input
                type="month"
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="generated">Generated</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {payslips.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No payslips available</p>
        </div>
      ) : (
        <>
          {hasActiveFilters && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-blue-800">
                  Showing {filteredPayslips.length} of {payslips.length} payslips
                </span>
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Clear filters
              </button>
            </div>
          )}
          
          {filteredPayslips.length === 0 && hasActiveFilters ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">No payslips match the selected filters</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-primary-600 hover:text-primary-700 text-sm"
              >
                Clear filters to see all payslips
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(filteredPayslips.length > 0 && hasActiveFilters ? filteredPayslips : payslips).map((payslip) => (
                <div key={payslip.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{payslip.month}</h3>
                        <p className="text-sm text-gray-500">
                          {payslip.generatedAt?.toDate
                            ? format(payslip.generatedAt.toDate(), 'MMM dd, yyyy')
                            : 'N/A'}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          payslip.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : payslip.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {payslip.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Gross Salary</span>
                        <span className="text-sm font-medium">${payslip.grossSalary?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Deductions</span>
                        <span className="text-sm font-medium text-red-600">
                          -${payslip.totalDeductions?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-sm font-semibold text-gray-900">Net Salary</span>
                        <span className="text-lg font-bold text-green-600">
                          ${payslip.netSalary?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewPayslip(payslip)}
                        className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(payslip)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Payslip Detail Modal */}
      {selectedPayslip && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Payslip - ${selectedPayslip.month}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-600">Employee</p>
                <p className="font-medium">{currentUser?.displayName || currentUser?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pay Period</p>
                <p className="font-medium">{selectedPayslip.month}</p>
              </div>
            </div>

            {/* Earnings */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Earnings</h3>
              <div className="space-y-2">
                {Object.entries(selectedPayslip.earnings || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm font-medium">${value?.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Gross Salary</span>
                  <span className="font-semibold">${selectedPayslip.grossSalary?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Deductions</h3>
              <div className="space-y-2">
                {Object.entries(selectedPayslip.deductions || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm font-medium text-red-600">-${value?.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total Deductions</span>
                  <span className="font-semibold text-red-600">
                    -${selectedPayslip.totalDeductions?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Net Salary</span>
                <span className="text-2xl font-bold text-green-600">
                  ${selectedPayslip.netSalary?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadPDF(selectedPayslip)}
                className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
              >
                Download PDF
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

