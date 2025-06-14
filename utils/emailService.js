const nodemailer = require('nodemailer');

// Debug logging
console.log('Email Configuration:', {
  user: process.env.EMAIL_USER ? 'Set' : 'Not Set',
  pass: process.env.EMAIL_APP_PASSWORD ? 'Set' : 'Not Set'
});

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

// Email templates
const emailTemplates = {
  gatepassApproved: (studentName, gatepassDetails) => ({
    subject: 'Gatepass Request Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Gatepass Request Approved</h2>
        <p>Dear ${studentName},</p>
        <p>Your gatepass request has been approved.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Gatepass Details:</h3>
          <p><strong>Purpose:</strong> ${gatepassDetails.purpose}</p>
          <p><strong>From:</strong> ${new Date(gatepassDetails.fromDate).toLocaleString()}</p>
          <p><strong>To:</strong> ${new Date(gatepassDetails.toDate).toLocaleString()}</p>
          <p><strong>Status:</strong> Approved</p>
        </div>
        <p>Please carry your student ID card when leaving the campus.</p>
        <p>Best regards,<br>Gatepass Management System</p>
      </div>
    `
  }),

  gatepassRejected: (studentName, gatepassDetails, reason) => ({
    subject: 'Gatepass Request Rejected',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f44336;">Gatepass Request Rejected</h2>
        <p>Dear ${studentName},</p>
        <p>Your gatepass request has been rejected.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Gatepass Details:</h3>
          <p><strong>Purpose:</strong> ${gatepassDetails.purpose}</p>
          <p><strong>From:</strong> ${new Date(gatepassDetails.fromDate).toLocaleString()}</p>
          <p><strong>To:</strong> ${new Date(gatepassDetails.toDate).toLocaleString()}</p>
          <p><strong>Status:</strong> Rejected</p>
          <p><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>You can submit a new request with the necessary corrections.</p>
        <p>Best regards,<br>Gatepass Management System</p>
      </div>
    `
  })
};

// Function to send email
const sendEmail = async (to, template, data) => {
  try {
    const { subject, html } = emailTemplates[template](data.studentName, data.gatepassDetails, data.reason);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email notification');
  }
};

module.exports = {
  sendEmail,
  emailTemplates
}; 