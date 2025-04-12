// const nodemailer = require('nodemailer');

// // Configure your email service (using Gmail example)
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD
//   }
// });

// exports.sendNewSubmissionEmail = async (adminEmails, propertyDetails) => {
//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: adminEmails.join(', '),
//     subject: 'New Property Submission',
//     html: `
//       <h2>New Property Submitted for Approval</h2>
//       <p><strong>Title:</strong> ${propertyDetails.title}</p>
//       <p><strong>Location:</strong> ${propertyDetails.location}</p>
//       <p><strong>Submitted By:</strong> ${propertyDetails.userId.displayName}</p>
//       <p>Please review it in the admin dashboard.</p>
//       <a href="${process.env.ADMIN_DASHBOARD_URL}">Go to Dashboard</a>
//     `
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log('Notification emails sent to admins');
//   } catch (error) {
//     console.error('Error sending email:', error);
//   }
// };