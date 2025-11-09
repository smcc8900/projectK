const sgMail = require('@sendgrid/mail');
const functions = require('firebase-functions');

// Initialize SendGrid with API key from environment config
const sendgridKey = functions.config().sendgrid?.key;
if (sendgridKey) {
  sgMail.setApiKey(sendgridKey);
}

// Default sender email
const fromEmail = functions.config().email?.from || 'noreply@yourcompany.com';

/**
 * Email Templates
 */

const getEmailTemplate = (type, data) => {
  const templates = {
    leaveRequestToAdmin: {
      subject: `New Leave Request from ${data.employeeName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .info-row { margin: 15px 0; padding: 10px; background-color: white; border-radius: 4px; }
            .label { font-weight: bold; color: #4F46E5; }
            .value { margin-top: 5px; }
            .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .badge-pending { background-color: #fef3c7; color: #92400e; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 New Leave Request</h1>
            </div>
            <div class="content">
              <p>Hello Admin,</p>
              <p>A new leave request has been submitted and requires your attention.</p>
              
              <div class="info-row">
                <div class="label">👤 Employee</div>
                <div class="value">${data.employeeName}</div>
              </div>
              
              <div class="info-row">
                <div class="label">📧 Email</div>
                <div class="value">${data.employeeEmail}</div>
              </div>
              
              <div class="info-row">
                <div class="label">📅 Leave Type</div>
                <div class="value">${data.leaveType}</div>
              </div>
              
              <div class="info-row">
                <div class="label">🗓️ Duration</div>
                <div class="value">${data.startDate} to ${data.endDate} (${data.days} days)</div>
              </div>
              
              <div class="info-row">
                <div class="label">📝 Reason</div>
                <div class="value">${data.reason}</div>
              </div>
              
              <div class="info-row">
                <div class="label">🔖 Status</div>
                <div class="value"><span class="badge badge-pending">${data.status.toUpperCase()}</span></div>
              </div>
              
              ${data.emergencyContact ? `
              <div class="info-row">
                <div class="label">📞 Emergency Contact</div>
                <div class="value">${data.emergencyContact}</div>
              </div>
              ` : ''}
              
              <div style="text-align: center; margin-top: 30px;">
                <p>Please review and take action on this leave request.</p>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated notification from your HR Management System.</p>
              <p>Request ID: ${data.requestId}</p>
            </div>
          </div>
        </body>
        </html>
      `
    },

    leaveApprovedToEmployee: {
      subject: `✅ Leave Request Approved`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .info-row { margin: 15px 0; padding: 10px; background-color: white; border-radius: 4px; }
            .label { font-weight: bold; color: #10b981; }
            .value { margin-top: 5px; }
            .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Leave Request Approved</h1>
            </div>
            <div class="content">
              <div class="success-icon">🎉</div>
              <p>Dear ${data.employeeName},</p>
              <p>Great news! Your leave request has been <strong style="color: #10b981;">APPROVED</strong>.</p>
              
              <div class="info-row">
                <div class="label">📅 Leave Type</div>
                <div class="value">${data.leaveType}</div>
              </div>
              
              <div class="info-row">
                <div class="label">🗓️ Duration</div>
                <div class="value">${data.startDate} to ${data.endDate} (${data.days} days)</div>
              </div>
              
              ${data.adminComment ? `
              <div class="info-row">
                <div class="label">💬 Admin Comment</div>
                <div class="value">${data.adminComment}</div>
              </div>
              ` : ''}
              
              <div style="margin-top: 30px; padding: 15px; background-color: #d1fae5; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0;"><strong>Note:</strong> Please ensure all pending work is completed or delegated before your leave begins.</p>
              </div>
            </div>
            <div class="footer">
              <p>Have a great time off!</p>
              <p>Request ID: ${data.requestId}</p>
            </div>
          </div>
        </body>
        </html>
      `
    },

    leaveRejectedToEmployee: {
      subject: `❌ Leave Request Update`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .info-row { margin: 15px 0; padding: 10px; background-color: white; border-radius: 4px; }
            .label { font-weight: bold; color: #ef4444; }
            .value { margin-top: 5px; }
            .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Leave Request Update</h1>
            </div>
            <div class="content">
              <p>Dear ${data.employeeName},</p>
              <p>We regret to inform you that your leave request has been <strong style="color: #ef4444;">NOT APPROVED</strong>.</p>
              
              <div class="info-row">
                <div class="label">📅 Leave Type</div>
                <div class="value">${data.leaveType}</div>
              </div>
              
              <div class="info-row">
                <div class="label">🗓️ Duration</div>
                <div class="value">${data.startDate} to ${data.endDate} (${data.days} days)</div>
              </div>
              
              ${data.adminComment ? `
              <div class="info-row">
                <div class="label">💬 Reason for Rejection</div>
                <div class="value">${data.adminComment}</div>
              </div>
              ` : ''}
              
              <div style="margin-top: 30px; padding: 15px; background-color: #fee2e2; border-left: 4px solid #ef4444; border-radius: 4px;">
                <p style="margin: 0;"><strong>Next Steps:</strong> Please contact your supervisor or HR for more details or to discuss alternative dates.</p>
              </div>
            </div>
            <div class="footer">
              <p>If you have any questions, please reach out to your HR department.</p>
              <p>Request ID: ${data.requestId}</p>
            </div>
          </div>
        </body>
        </html>
      `
    },

    welcomeEmail: {
      subject: `Welcome to ${data.organizationName || 'the Team'}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .info-row { margin: 15px 0; padding: 10px; background-color: white; border-radius: 4px; }
            .label { font-weight: bold; color: #4F46E5; }
            .value { margin-top: 5px; }
            .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .welcome-icon { font-size: 48px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome Aboard! 🎉</h1>
            </div>
            <div class="content">
              <div class="welcome-icon">👋</div>
              <p>Dear ${data.employeeName},</p>
              <p>Welcome to ${data.organizationName || 'our organization'}! We're excited to have you join our team.</p>
              
              <div class="info-row">
                <div class="label">📧 Your Email</div>
                <div class="value">${data.email}</div>
              </div>
              
              <div class="info-row">
                <div class="label">👤 Role</div>
                <div class="value">${data.role}</div>
              </div>
              
              <div style="margin-top: 30px; padding: 15px; background-color: #dbeafe; border-left: 4px solid #4F46E5; border-radius: 4px;">
                <p style="margin: 0;"><strong>Getting Started:</strong></p>
                <ul style="margin: 10px 0;">
                  <li>Log in to the HR portal with your credentials</li>
                  <li>Complete your profile information</li>
                  <li>Review company policies and leave guidelines</li>
                  <li>Set up your payroll information</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>If you have any questions, please don't hesitate to reach out to HR.</p>
              <p>We're here to help!</p>
            </div>
          </div>
        </body>
        </html>
      `
    },

    payslipNotification: {
      subject: `💰 Your Payslip is Ready`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .info-row { margin: 15px 0; padding: 10px; background-color: white; border-radius: 4px; }
            .label { font-weight: bold; color: #10b981; }
            .value { margin-top: 5px; }
            .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Payslip Available</h1>
            </div>
            <div class="content">
              <p>Dear ${data.employeeName},</p>
              <p>Your payslip for <strong>${data.month}</strong> is now available in the HR portal.</p>
              
              <div class="info-row">
                <div class="label">📅 Period</div>
                <div class="value">${data.month}</div>
              </div>
              
              <div class="info-row">
                <div class="label">💵 Net Salary</div>
                <div class="value">₹${data.netSalary ? data.netSalary.toLocaleString() : 'N/A'}</div>
              </div>
              
              <div style="margin-top: 30px; padding: 15px; background-color: #d1fae5; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0;"><strong>Action Required:</strong> Please log in to the HR portal to view and download your detailed payslip.</p>
              </div>
            </div>
            <div class="footer">
              <p>For any queries regarding your payslip, please contact the HR department.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  };

  return templates[type] || null;
};

/**
 * Send email using SendGrid
 * @param {string|string[]} to - Recipient email(s)
 * @param {string} templateType - Type of email template
 * @param {object} data - Data to populate the template
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (to, templateType, data) => {
  // If SendGrid is not configured, log the email instead
  if (!sendgridKey) {
    console.log('=== EMAIL NOTIFICATION (SendGrid not configured) ===');
    console.log(`To: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`Template: ${templateType}`);
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('====================================================');
    return false;
  }

  try {
    const template = getEmailTemplate(templateType, data);
    
    if (!template) {
      console.error(`Email template '${templateType}' not found`);
      return false;
    }

    const msg = {
      to: Array.isArray(to) ? to : [to],
      from: fromEmail,
      subject: template.subject,
      html: template.html,
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${Array.isArray(to) ? to.join(', ') : to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }
    return false;
  }
};

/**
 * Send multiple emails in batch
 * @param {Array} emails - Array of email objects {to, templateType, data}
 * @returns {Promise<void>}
 */
const sendBatchEmails = async (emails) => {
  const promises = emails.map(email => 
    sendEmail(email.to, email.templateType, email.data)
  );
  
  await Promise.allSettled(promises);
};

module.exports = {
  sendEmail,
  sendBatchEmails,
  getEmailTemplate
};
