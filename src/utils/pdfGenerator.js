import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generatePayslipPDF = async (payslip, user, orgName = 'Payroll System') => {
  const doc = new jsPDF();
  
  // Set up colors
  const primaryColor = [37, 99, 235]; // primary-600
  const textColor = [31, 41, 55]; // gray-800
  const lightGray = [243, 244, 246]; // gray-100
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(orgName.toUpperCase(), 105, 15, { align: 'center' });
  
  doc.setFontSize(24);
  doc.text('PAYSLIP', 105, 28, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Pay Period: ${payslip.month}`, 105, 38, { align: 'center' });
  
  // Employee Details
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.text('Employee Details', 20, 65);
  
  doc.setFontSize(10);
  doc.text(`Name: ${user?.displayName || user?.email || 'N/A'}`, 20, 75);
  doc.text(`Email: ${payslip.email}`, 20, 82);
  doc.text(`Employee ID: ${payslip.employeeId || 'N/A'}`, 20, 89);
  
  // Earnings Table
  doc.setFontSize(14);
  doc.text('Earnings', 20, 105);
  
  const earningsData = [];
  if (payslip.earnings) {
    Object.entries(payslip.earnings).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      earningsData.push([
        label.charAt(0).toUpperCase() + label.slice(1),
        `$${value.toLocaleString()}`
      ]);
    });
  }
  
  doc.autoTable({
    startY: 110,
    head: [['Component', 'Amount']],
    body: earningsData,
    foot: [['Gross Salary', `$${payslip.grossSalary?.toLocaleString() || 0}`]],
    theme: 'striped',
    headStyles: { fillColor: primaryColor },
    footStyles: { fillColor: lightGray, textColor: textColor, fontStyle: 'bold' },
    margin: { left: 20, right: 20 },
  });
  
  // Deductions Table
  const deductionsStartY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text('Deductions', 20, deductionsStartY);
  
  const deductionsData = [];
  if (payslip.deductions) {
    Object.entries(payslip.deductions).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      deductionsData.push([
        label.charAt(0).toUpperCase() + label.slice(1),
        `$${value.toLocaleString()}`
      ]);
    });
  }
  
  doc.autoTable({
    startY: deductionsStartY + 5,
    head: [['Component', 'Amount']],
    body: deductionsData,
    foot: [['Total Deductions', `$${payslip.totalDeductions?.toLocaleString() || 0}`]],
    theme: 'striped',
    headStyles: { fillColor: primaryColor },
    footStyles: { fillColor: lightGray, textColor: textColor, fontStyle: 'bold' },
    margin: { left: 20, right: 20 },
  });
  
  // Net Salary
  const netSalaryY = doc.lastAutoTable.finalY + 15;
  doc.setFillColor(220, 252, 231); // green-100
  doc.rect(20, netSalaryY, 170, 20, 'F');
  
  doc.setFontSize(16);
  doc.setTextColor(22, 163, 74); // green-600
  doc.text('NET SALARY', 30, netSalaryY + 13);
  doc.setFontSize(18);
  doc.text(`$${payslip.netSalary?.toLocaleString() || 0}`, 180, netSalaryY + 13, { align: 'right' });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128); // gray-500
  const footerY = 280;
  doc.text('This is a computer-generated document. No signature required.', 105, footerY, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, footerY + 5, { align: 'center' });
  
  // Save PDF
  const fileName = `Payslip_${payslip.month}_${payslip.employeeId || 'employee'}.pdf`;
  doc.save(fileName);
};

