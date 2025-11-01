import * as XLSX from 'xlsx';
import { validatePayslipData, sanitizeNumber } from './validators';

export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
          raw: false,
          defval: '' 
        });

        resolve(jsonData);
      } catch (error) {
        reject(new Error('Failed to parse Excel file: ' + error.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

export const normalizeColumnNames = (data) => {
  // Map common variations of column names to standard names
  const columnMap = {
    'email': ['email', 'Email', 'EMAIL', 'e-mail', 'E-mail'],
    'employeeId': ['employeeId', 'EmployeeId', 'Employee ID', 'EmpId', 'Emp ID'],
    'basicSalary': ['basicSalary', 'BasicSalary', 'Basic Salary', 'Basic', 'basic'],
    'hra': ['hra', 'HRA', 'House Rent Allowance', 'houseRent'],
    'allowances': ['allowances', 'Allowances', 'Other Allowances', 'otherAllowances'],
    'bonus': ['bonus', 'Bonus', 'BONUS'],
    'tax': ['tax', 'Tax', 'TAX', 'Income Tax', 'incomeTax'],
    'providentFund': ['providentFund', 'PF', 'pf', 'Provident Fund', 'ProvidentFund'],
    'insurance': ['insurance', 'Insurance', 'INSURANCE'],
    'month': ['month', 'Month', 'MONTH'],
    'year': ['year', 'Year', 'YEAR'],
  };

  return data.map(row => {
    const normalizedRow = {};
    
    Object.keys(columnMap).forEach(standardName => {
      const variations = columnMap[standardName];
      const matchingKey = Object.keys(row).find(key => 
        variations.includes(key)
      );
      
      if (matchingKey) {
        normalizedRow[standardName] = row[matchingKey];
      }
    });

    return normalizedRow;
  });
};

export const validateExcelData = (data) => {
  const results = {
    valid: [],
    invalid: [],
    totalRows: data.length,
  };

  data.forEach((row, index) => {
    const validation = validatePayslipData(row);
    
    if (validation.isValid) {
      results.valid.push({
        ...row,
        rowNumber: index + 2, // +2 because Excel starts at 1 and has header
      });
    } else {
      results.invalid.push({
        rowNumber: index + 2,
        data: row,
        errors: validation.errors,
      });
    }
  });

  return results;
};

export const transformPayslipData = (row, orgId, adminUserId) => {
  const earnings = {
    basicSalary: sanitizeNumber(row.basicSalary),
    hra: sanitizeNumber(row.hra),
    allowances: sanitizeNumber(row.allowances),
    bonus: sanitizeNumber(row.bonus),
  };

  const deductions = {
    tax: sanitizeNumber(row.tax),
    providentFund: sanitizeNumber(row.providentFund),
    insurance: sanitizeNumber(row.insurance),
  };

  const grossSalary = Object.values(earnings).reduce((sum, val) => sum + val, 0);
  const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
  const netSalary = grossSalary - totalDeductions;

  const month = parseInt(row.month);
  const year = parseInt(row.year);
  const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

  return {
    email: row.email.toLowerCase().trim(),
    employeeId: row.employeeId || '',
    month: monthStr,
    year: year,
    earnings,
    deductions,
    grossSalary,
    totalDeductions,
    netSalary,
    status: 'generated',
    generatedBy: adminUserId,
    generatedAt: new Date(),
    orgId,
  };
};

