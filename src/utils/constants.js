export const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
};

export const PAYSLIP_STATUS = {
  GENERATED: 'generated',
  APPROVED: 'approved',
  PAID: 'paid',
};

export const UPLOAD_STATUS = {
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const EXCEL_COLUMNS = {
  REQUIRED: ['email', 'month', 'year'],
  EARNINGS: ['basicSalary', 'hra', 'allowances', 'bonus'],
  DEDUCTIONS: ['tax', 'providentFund', 'insurance'],
};

