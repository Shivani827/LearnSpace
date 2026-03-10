const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: process.env.MAIL_USER || process.env.EMAIL_USER,
        pass: process.env.MAIL_PASS || process.env.EMAIL_PASS
    },
    connectionTimeout: 10000 // 10 seconds
});

// Verify connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Mail Service Error:', error.message);
        console.log('💡 TIP: If using Gmail, ensure you use an "App Password" and not your regular password.');
    } else {
        console.log('📧 Mail Service Ready (Receiver:', process.env.ADMIN_MAIL || process.env.ADMIN_EMAIL, ')');
    }
});

// Reusable email wrapper for non-blocking execution
const sendMail = async (options) => {
    try {
        console.log(`📤 Attempting to send email to ${options.to}...`);
        const info = await transporter.sendMail(options);
        console.log('📧 Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Email delivery failed:', error);
        return null;
    }
};

/**
 * Send notification to Admin when a new request is created
 */
const sendAdminNotification = async (data) => {
    const { name, id, email, room, block, date, timeSlot, purpose } = data;

    const mailOptions = {
        from: `"LearnSpace Notifications" <${process.env.MAIL_USER || process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_MAIL || process.env.ADMIN_EMAIL,
        subject: 'New Booking Request Received',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
                <div style="background-color: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Booking Request</h1>
                </div>
                <div style="padding: 20px; background-color: #ffffff; color: #333333;">
                    <p style="font-size: 16px;">A new booking request has been submitted and is awaiting your review.</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;"><strong>Requester:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;">${name}</td></tr>
                        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;"><strong>ID:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;">${id}</td></tr>
                        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;">${email}</td></tr>
                        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;"><strong>Room/Hall:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;">${room}</td></tr>
                        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;"><strong>Block:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;">${block}</td></tr>
                        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;"><strong>Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;">${new Date(date).toLocaleDateString()}</td></tr>
                        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;"><strong>Time Slot:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;">${timeSlot}</td></tr>
                        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;"><strong>Purpose:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;">${purpose}</td></tr>
                    </table>
                    <div style="margin-top: 30px; text-align: center;">
                        <a href="${process.env.APP_URL || 'http://localhost:3008'}/admin/requests/${id}" style="background-color: #1a1a1a; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Review Requests</a>
                    </div>
                </div>
                <div style="padding: 15px; text-align: center; font-size: 12px; color: #777777;">
                    &copy; ${new Date().getFullYear()} LearnSpace. All rights reserved.
                </div>
            </div>
        `
    };

    return sendMail(mailOptions);
};

/**
 * Send status update notification to the user
 */
const sendUserStatusUpdate = async (data) => {
    const { name, email, room, date, timeSlot, status, reason } = data;
    const isApproved = status === 'approved';
    const accentColor = isApproved ? '#28a745' : '#dc3545';
    const statusIcon = isApproved ? '✅' : '❌';
    const subject = isApproved ? 'Booking Request Approved ✅' : 'Update on Your Booking Request ❌';

    const mailOptions = {
        from: `"LearnSpace Notifications" <${process.env.MAIL_USER || process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <div style="background-color: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Booking Update</h1>
                </div>
                <div style="padding: 30px; background-color: #ffffff; color: #333333;">
                    <p style="font-size: 18px;">Hello <strong>${name}</strong>,</p>
                    <p style="font-size: 16px;">Your booking request for <strong>${room}</strong> on <strong>${new Date(date).toLocaleDateString()}</strong> at <strong>${timeSlot}</strong> has been updated.</p>
                    
                    <div style="margin: 25px 0; padding: 20px; border-left: 5px solid ${accentColor}; background-color: #f8f9fa;">
                        <span style="font-size: 20px; font-weight: bold; color: ${accentColor};">${statusIcon} Status: ${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                        ${!isApproved && reason ? `<p style="margin-top: 10px; color: #333;"><strong>Reason:</strong> ${reason}</p>` : ''}
                    </div>

                    <p style="font-size: 14px; color: #666; line-height: 1.5;">
                        ${isApproved ? 'Please ensure you arrive on time. For any changes, please contact the administration.' : 'If you have any questions regarding this decision, please reach out to the admin panel.'}
                    </p>
                </div>
                <div style="padding: 15px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee;">
                    &copy; ${new Date().getFullYear()} LearnSpace. All rights reserved.
                </div>
            </div>
        `
    };

    return sendMail(mailOptions);
};

module.exports = {
    sendAdminNotification,
    sendUserStatusUpdate
};
