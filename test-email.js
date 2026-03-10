const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🔍 Starting Email Diagnostic Test...');
console.log('-----------------------------------');
console.log('Configured MAIL_USER:', process.env.MAIL_USER || 'Not found');
console.log('Configured ADMIN_MAIL:', process.env.ADMIN_MAIL || 'Not found');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USER || process.env.EMAIL_USER,
        pass: process.env.MAIL_PASS || process.env.EMAIL_PASS
    },
    connectionTimeout: 10000
});

async function runDiagnostics() {
    try {
        console.log('⏳ Verifying connection to SMTP server...');
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');

        console.log('⏳ Attempting to send a test email to Admin...');
        const info = await transporter.sendMail({
            from: `"LearnSpace Diagnostic" <${process.env.MAIL_USER || process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_MAIL || process.env.ADMIN_EMAIL,
            subject: 'LearnSpace Email Test 🚀',
            text: 'If you are reading this, your email configuration is working perfectly!',
            html: '<h3>Success!</h3><p>Your LearnSpace email configuration is working perfectly.</p>'
        });

        console.log('✅ Test Email Sent! Message ID:', info.messageId);
        console.log('-----------------------------------');
        console.log('🎉 DIAGNOSTIC COMPLETED SUCCESSFULLY');
    } catch (error) {
        console.error('❌ DIAGNOSTIC FAILED');
        console.error('Error Details:', error.message);
        console.log('-----------------------------------');
        console.log('💡 TROUBLESHOOTING TIPS:');
        if (error.message.includes('PLAIN')) {
            console.log('- Check if MAIL_USER and MAIL_PASS are correctly set in .env');
        } else if (error.message.includes('ECONN') || error.message.includes('ETIMEDOUT')) {
            console.log('- Network issue: Port 465 might be blocked by your firewall or ISP.');
            console.log('- Try changing port to 587 and secure: false in emailService.js');
        } else if (error.message.includes('Invalid login')) {
            console.log('- Ensure you are using a Google "App Password" (16 characters) and NOT your regular password.');
            console.log('- Ensure 2-Step Verification is enabled on your Gmail account.');
        }
    }
}

runDiagnostics();
