import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUploadHistory } from '../../services/payslip.service';
import { Table } from '../shared/Table';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const UploadHistory = () => {
  const { userClaims } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [userClaims]);

  const loadHistory = async () => {
    try {
      if (!userClaims?.orgId) return;
      const data = await getUploadHistory(userClaims.orgId);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load upload history:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'File Name',
      accessor: 'fileName',
    },
    {
      header: 'Month',
      accessor: 'month',
    },
    {
      header: 'Total Rows',
      render: (row) => row.stats?.totalRows || 0,
    },
    {
      header: 'Successful',
      render: (row) => (
        <span className="flex items-center text-green-600">
          <CheckCircle className="w-4 h-4 mr-1" />
          {row.stats?.successCount || 0}
        </span>
      ),
    },
    {
      header: 'Failed',
      render: (row) => (
        <span className="flex items-center text-red-600">
          <XCircle className="w-4 h-4 mr-1" />
          {row.stats?.failedCount || 0}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
            row.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : row.status === 'failed'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {row.status === 'processing' && <Clock className="w-3 h-3 mr-1" />}
          {row.status}
        </span>
      ),
    },
    {
      header: 'Upload Date',
      render: (row) =>
        row.createdAt?.toDate
          ? format(row.createdAt.toDate(), 'MMM dd, yyyy HH:mm')
          : 'N/A',
    },
    {
      header: 'Batch ID',
      render: (row) => (
        <span className="text-xs text-gray-500 font-mono">{row.batchId}</span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Upload History</h1>

      {history.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No upload history found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <Table columns={columns} data={history} />
        </div>
      )}
    </div>
  );
};

