export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validatePayslipData = (data) => {
  const errors = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Invalid email address');
  }

  if (!data.month || data.month < 1 || data.month > 12) {
    errors.push('Invalid month (must be 1-12)');
  }

  if (!data.year || data.year < 2000 || data.year > 2100) {
    errors.push('Invalid year');
  }

  // Check if at least one salary component exists
  const hasEarnings = ['basicSalary', 'hra', 'allowances', 'bonus'].some(
    field => data[field] && !isNaN(parseFloat(data[field]))
  );

  if (!hasEarnings) {
    errors.push('At least one salary component is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const sanitizeNumber = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : Math.max(0, num);
};

