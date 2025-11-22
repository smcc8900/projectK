import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { processExcelUpload, validateExcelBeforeUpload } from '../../services/excel.service';
import { FileUploader } from '../shared/FileUploader';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, Upload } from 'lucide-react';

export const PayrollUpload = () => {
  const { userClaims, currentUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [uploadResults, setUploadResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setValidationResults(null);
    setUploadResults(null);

    if (file) {
      try {
        setLoading(true);
        const results = await validateExcelBeforeUpload(file);
        setValidationResults(results);
        
        if (results.invalidRows > 0) {
          toast.error(`Found ${results.invalidRows} invalid rows. Please review before uploading.`);
        } else {
          toast.success(`File validated successfully! ${results.validRows} valid rows found.`);
        }
      } catch (error) {
        toast.error(error.message || 'Failed to validate file');
        setSelectedFile(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !userClaims?.orgId) return;

    try {
      setLoading(true);
      const results = await processExcelUpload(
        selectedFile,
        userClaims.orgId,
        currentUser.uid
      );
      
      setUploadResults(results);
      
      if (results.successCount > 0) {
        toast.success(`Successfully created ${results.successCount} payslips!`);
      }
      
      if (results.failedCount > 0) {
        toast.error(`${results.failedCount} records failed. Check the error details below.`);
      }

      // Reset file selection after successful upload
      if (results.failedCount === 0) {
        setSelectedFile(null);
        setValidationResults(null);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to process upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Upload Payroll Data</h1>

      {/* File Upload Section */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Select Excel File</h2>
        <FileUploader onFileSelect={handleFileSelect} />
        
        <div className="mt-4">
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Expected Excel Format:</h3>
          <div className="bg-gray-50 p-2 sm:p-4 rounded text-xs overflow-x-auto -mx-2 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">Email</th>
                  <th className="px-2 py-1 text-left">Employee ID</th>
                  <th className="px-2 py-1 text-left">Basic Salary</th>
                  <th className="px-2 py-1 text-left">HRA</th>
                  <th className="px-2 py-1 text-left">Allowances</th>
                  <th className="px-2 py-1 text-left">Bonus</th>
                  <th className="px-2 py-1 text-left">Tax</th>
                  <th className="px-2 py-1 text-left">PF</th>
                  <th className="px-2 py-1 text-left">Insurance</th>
                  <th className="px-2 py-1 text-left">Month</th>
                  <th className="px-2 py-1 text-left">Year</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-2 py-1">john@company.com</td>
                  <td className="px-2 py-1">EMP001</td>
                  <td className="px-2 py-1">5000</td>
                  <td className="px-2 py-1">2000</td>
                  <td className="px-2 py-1">1000</td>
                  <td className="px-2 py-1">500</td>
                  <td className="px-2 py-1">800</td>
                  <td className="px-2 py-1">600</td>
                  <td className="px-2 py-1">200</td>
                  <td className="px-2 py-1">10</td>
                  <td className="px-2 py-1">2025</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            * Required fields: Email, Month, Year. At least one salary component is required.
          </p>
        </div>
      </div>

      {/* Validation Results */}
      {validationResults && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Validation Results</h2>
          
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Rows</p>
              <p className="text-2xl font-bold text-blue-900">{validationResults.totalRows}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Valid Rows</p>
              <p className="text-2xl font-bold text-green-900">{validationResults.validRows}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Invalid Rows</p>
              <p className="text-2xl font-bold text-red-900">{validationResults.invalidRows}</p>
            </div>
          </div>

          {validationResults.errors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                Validation Errors
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {validationResults.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-800">
                      <span className="font-medium">Row {error.rowNumber}:</span>{' '}
                      {error.errors.join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {validationResults.validRows > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] sm:min-h-0"
              >
                <Upload className="w-5 h-5 mr-2" />
                {loading ? 'Processing...' : `Process ${validationResults.validRows} Records`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload Results */}
      {uploadResults && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Upload Results</h2>
          
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-green-50 p-4 rounded-lg flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-green-600 font-medium">Successful</p>
                <p className="text-2xl font-bold text-green-900">{uploadResults.successCount}</p>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg flex items-center">
              <XCircle className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-red-600 font-medium">Failed</p>
                <p className="text-2xl font-bold text-red-900">{uploadResults.failedCount}</p>
              </div>
            </div>
          </div>

          {uploadResults.errors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                Processing Errors
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {uploadResults.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-800">
                      <span className="font-medium">{error.email || `Row ${error.row}`}:</span>{' '}
                      {error.error}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Batch ID:</span> {uploadResults.batchId}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              You can reference this ID in the upload history
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

