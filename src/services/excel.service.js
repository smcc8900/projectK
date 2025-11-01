import { parseExcelFile, normalizeColumnNames, validateExcelData, transformPayslipData } from '../utils/excelParser';
import { batchCreatePayslips } from './payslip.service';

export const processExcelUpload = async (file, orgId, adminUserId) => {
  try {
    // 1. Parse Excel file
    const rawData = await parseExcelFile(file);
    
    if (rawData.length === 0) {
      throw new Error('Excel file is empty');
    }

    // 2. Normalize column names
    const normalizedData = normalizeColumnNames(rawData);

    // 3. Validate data
    const validationResults = validateExcelData(normalizedData);

    if (validationResults.valid.length === 0) {
      throw new Error('No valid records found in Excel file');
    }

    // 4. Transform to payslip format
    const payslipsData = validationResults.valid.map(row => 
      transformPayslipData(row, orgId, adminUserId)
    );

    // 5. Generate batch ID
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 6. Batch create payslips
    const results = await batchCreatePayslips(
      payslipsData,
      batchId,
      file.name,
      orgId,
      adminUserId
    );

    // Combine validation errors with creation errors
    const allErrors = [
      ...validationResults.invalid.map(item => ({
        row: item.rowNumber,
        email: item.data.email,
        error: item.errors.join(', '),
      })),
      ...results.errors,
    ];

    return {
      success: true,
      batchId,
      totalRows: rawData.length,
      validRows: validationResults.valid.length,
      invalidRows: validationResults.invalid.length,
      successCount: results.successCount,
      failedCount: results.failedCount + validationResults.invalid.length,
      errors: allErrors,
    };
  } catch (error) {
    console.error('Error processing Excel upload:', error);
    throw error;
  }
};

export const validateExcelBeforeUpload = async (file) => {
  try {
    const rawData = await parseExcelFile(file);
    const normalizedData = normalizeColumnNames(rawData);
    const validationResults = validateExcelData(normalizedData);

    return {
      totalRows: rawData.length,
      validRows: validationResults.valid.length,
      invalidRows: validationResults.invalid.length,
      errors: validationResults.invalid,
      preview: normalizedData.slice(0, 5), // First 5 rows for preview
    };
  } catch (error) {
    console.error('Error validating Excel:', error);
    throw error;
  }
};

