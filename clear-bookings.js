const mongoose = require('mongoose');
require('dotenv').config();
const { Booking, EventBooking } = require('./db/register');

async function clearBookingData() {
    try {
        console.log('🔄 Connecting to database for cleanup...');
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://madhavdhavala0_db_user:mDGpnbjWOF9Pmlr2@cluster0.dvj6trf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('⏳ Clearing Teacher Booking Requests...');
        const teacherResult = await Booking.deleteMany({});
        console.log(`✅ Deleted ${teacherResult.deletedCount} teacher bookings`);

        console.log('⏳ Clearing Organiser Event Booking Requests...');
        const eventResult = await EventBooking.deleteMany({});
        console.log(`✅ Deleted ${eventResult.deletedCount} event bookings`);

        console.log('-----------------------------------');
        console.log('🎉 DATA RESET COMPLETED SUCCESSFULLY');
        console.log('Total Records Removed:', teacherResult.deletedCount + eventResult.deletedCount);
        console.log('-----------------------------------');
        console.log('💡 You can now refresh your Admin Dashboard to see 0 requests.');

    } catch (error) {
        console.error('❌ Data Reset Failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

clearBookingData();
