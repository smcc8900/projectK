const XLSX = require('xlsx');

// Sample payroll data
const sampleData = [
  {
    'Email': 'john.doe@example.com',
    'Employee ID': 'EMP001',
    'Basic Salary': 50000,
    'HRA': 20000,
    'Allowances': 5000,
    'Bonus': 10000,
    'Tax': 5000,
    'PF': 2500,
    'Insurance': 1500,
    'Month': 11,
    'Year': 2024
  },
  {
    'Email': 'jane.smith@example.com',
    'Employee ID': 'EMP002',
    'Basic Salary': 60000,
    'HRA': 24000,
    'Allowances': 6000,
    'Bonus': 12000,
    'Tax': 7000,
    'PF': 3000,
    'Insurance': 2000,
    'Month': 11,
    'Year': 2024
  },
  {
    'Email': 'bob.johnson@example.com',
    'Employee ID': 'EMP003',
    'Basic Salary': 45000,
    'HRA': 18000,
    'Allowances': 4000,
    'Bonus': 8000,
    'Tax': 4000,
    'PF': 2250,
    'Insurance': 1200,
    'Month': 11,
    'Year': 2024
  },
  {
    'Email': 'alice.williams@example.com',
    'Employee ID': 'EMP004',
    'Basic Salary': 55000,
    'HRA': 22000,
    'Allowances': 5500,
    'Bonus': 11000,
    'Tax': 6000,
    'PF': 2750,
    'Insurance': 1800,
    'Month': 11,
    'Year': 2024
  },
  {
    'Email': 'charlie.brown@example.com',
    'Employee ID': 'EMP005',
    'Basic Salary': 48000,
    'HRA': 19200,
    'Allowances': 4500,
    'Bonus': 9000,
    'Tax': 4500,
    'PF': 2400,
    'Insurance': 1400,
    'Month': 11,
    'Year': 2024
  }
];

// Create a new workbook
const workbook = XLSX.utils.book_new();

// Create a worksheet from the data
const worksheet = XLSX.utils.json_to_sheet(sampleData);

// Add the worksheet to the workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Data');

// Write the file
const outputPath = './sample-payroll-data.xlsx';
XLSX.writeFile(workbook, outputPath);

console.log(`✅ Sample Excel file created successfully at: ${outputPath}`);
console.log('\n📋 File contains the following columns:');
console.log('   - Email (required)');
console.log('   - Employee ID (optional)');
console.log('   - Basic Salary');
console.log('   - HRA (House Rent Allowance)');
console.log('   - Allowances');
console.log('   - Bonus');
console.log('   - Tax');
console.log('   - PF (Provident Fund)');
console.log('   - Insurance');
console.log('   - Month (required, e.g., 11 for November)');
console.log('   - Year (required, e.g., 2024)');
console.log('\n💡 Note: The parser accepts various column name formats (e.g., "Email", "email", "E-mail")');

