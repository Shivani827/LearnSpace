const mongoose = require('mongoose');
const { Timetable } = require('./db/register');

const seedData = async () => {
    try {
        const MONGODB_URI = 'mongodb+srv://madhavdhavala0_db_user:mDGpnbjWOF9Pmlr2@cluster0.dvj6trf.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data for 3rd Year CSE A
        const deleteResult = await Timetable.deleteMany({ year: '3', branch: 'CSE', section: 'A' });
        console.log(`🧹 Cleared ${deleteResult.deletedCount} existing records for 3rd Year CSE A`);

        const timetableData = [
            { year: '3', branch: 'CSE', section: 'A', day: 'MON', slot: 1, subject: 'CN', start_time: '08:45', end_time: '09:35' },
            { year: '3', branch: 'CSE', section: 'A', day: 'MON', slot: 2, subject: ' ', start_time: '09:35', end_time: '10:25' },
            { year: '3', branch: 'CSE', section: 'A', day: 'MON', slot: 3, subject: 'CNS', start_time: '10:50', end_time: '11:40' },
            { year: '3', branch: 'CSE', section: 'A', day: 'MON', slot: 4, subject: 'CNS', start_time: '11:40', end_time: '12:30' },
            { year: '3', branch: 'CSE', section: 'A', day: 'MON', slot: 5, subject: ' ', start_time: '12:30', end_time: '13:30' },
            { year: '3', branch: 'CSE', section: 'A', day: 'MON', slot: 6, subject: 'MFAR', start_time: '14:20', end_time: '15:10' },
            { year: '3', branch: 'CSE', section: 'A', day: 'MON', slot: 7, subject: ' ', start_time: '15:10', end_time: '16:00' },
            // TUESDAY
            { year: '3', branch: 'CSE', section: 'A', day: 'TUE', slot: 1, subject: 'AI', start_time: '08:45', end_time: '09:35' },
            { year: '3', branch: 'CSE', section: 'A', day: 'TUE', slot: 2, subject: ' ', start_time: '09:35', end_time: '10:25' },
            { year: '3', branch: 'CSE', section: 'A', day: 'TUE', slot: 3, subject: 'CC', start_time: '10:50', end_time: '11:40' },
            { year: '3', branch: 'CSE', section: 'A', day: 'TUE', slot: 4, subject: 'CC', start_time: '11:40', end_time: '12:30' },
            { year: '3', branch: 'CSE', section: 'A', day: 'TUE', slot: 5, subject: 'CN LAB', start_time: '12:30', end_time: '13:30' },
            { year: '3', branch: 'CSE', section: 'A', day: 'TUE', slot: 6, subject: 'CN LAB', start_time: '14:20', end_time: '15:10' },
            { year: '3', branch: 'CSE', section: 'A', day: 'TUE', slot: 7, subject: ' ', start_time: '15:10', end_time: '16:00' },
            // WEDNESDAY
            { year: '3', branch: 'CSE', section: 'A', day: 'WED', slot: 1, subject: 'CNS', start_time: '08:45', end_time: '09:35' },
            { year: '3', branch: 'CSE', section: 'A', day: 'WED', slot: 2, subject: ' ', start_time: '09:35', end_time: '10:25' },
            { year: '3', branch: 'CSE', section: 'A', day: 'WED', slot: 3, subject: 'CN', start_time: '10:50', end_time: '11:40' },
            { year: '3', branch: 'CSE', section: 'A', day: 'WED', slot: 4, subject: 'CN', start_time: '11:40', end_time: '12:30' },
            { year: '3', branch: 'CSE', section: 'A', day: 'WED', slot: 5, subject: ' ', start_time: '12:30', end_time: '13:30' },
            { year: '3', branch: 'CSE', section: 'A', day: 'WED', slot: 6, subject: 'AI', start_time: '14:20', end_time: '15:10' },
            { year: '3', branch: 'CSE', section: 'A', day: 'WED', slot: 7, subject: ' ', start_time: '15:10', end_time: '16:00' },
            // THURSDAY
            { year: '3', branch: 'CSE', section: 'A', day: 'THU', slot: 1, subject: 'SPM', start_time: '08:45', end_time: '09:35' },
            { year: '3', branch: 'CSE', section: 'A', day: 'THU', slot: 2, subject: ' ', start_time: '09:35', end_time: '10:25' },
            { year: '3', branch: 'CSE', section: 'A', day: 'THU', slot: 3, subject: 'AI', start_time: '10:50', end_time: '11:40' },
            { year: '3', branch: 'CSE', section: 'A', day: 'THU', slot: 4, subject: 'AI', start_time: '11:40', end_time: '12:30' },
            { year: '3', branch: 'CSE', section: 'A', day: 'THU', slot: 5, subject: ' ', start_time: '12:30', end_time: '13:30' },
            { year: '3', branch: 'CSE', section: 'A', day: 'THU', slot: 6, subject: 'CC', start_time: '14:20', end_time: '15:10' },
            { year: '3', branch: 'CSE', section: 'A', day: 'THU', slot: 7, subject: ' ', start_time: '15:10', end_time: '16:00' },
            // FRIDAY
            { year: '3', branch: 'CSE', section: 'A', day: 'FRI', slot: 1, subject: 'CC', start_time: '08:45', end_time: '09:35' },
            { year: '3', branch: 'CSE', section: 'A', day: 'FRI', slot: 2, subject: ' ', start_time: '09:35', end_time: '10:25' },
            { year: '3', branch: 'CSE', section: 'A', day: 'FRI', slot: 3, subject: 'MFAR', start_time: '10:50', end_time: '11:40' },
            { year: '3', branch: 'CSE', section: 'A', day: 'FRI', slot: 4, subject: 'MFAR', start_time: '11:40', end_time: '12:30' },
            { year: '3', branch: 'CSE', section: 'A', day: 'FRI', slot: 5, subject: ' ', start_time: '12:30', end_time: '13:30' },
            { year: '3', branch: 'CSE', section: 'A', day: 'FRI', slot: 6, subject: 'CN', start_time: '14:20', end_time: '15:10' },
            { year: '3', branch: 'CSE', section: 'A', day: 'FRI', slot: 7, subject: ' ', start_time: '15:10', end_time: '16:00' },
            // SATURDAY
            { year: '3', branch: 'CSE', section: 'A', day: 'SAT', slot: 1, subject: 'AI LAB', start_time: '08:45', end_time: '09:35' },
            { year: '3', branch: 'CSE', section: 'A', day: 'SAT', slot: 2, subject: ' ', start_time: '09:35', end_time: '10:25' },
            { year: '3', branch: 'CSE', section: 'A', day: 'SAT', slot: 3, subject: 'AI LAB', start_time: '10:50', end_time: '11:40' },
            { year: '3', branch: 'CSE', section: 'A', day: 'SAT', slot: 4, subject: 'SPM', start_time: '11:40', end_time: '12:30' },
            { year: '3', branch: 'CSE', section: 'A', day: 'SAT', slot: 5, subject: 'SPM', start_time: '12:30', end_time: '13:30' },
            { year: '3', branch: 'CSE', section: 'A', day: 'SAT', slot: 6, subject: 'CNS', start_time: '14:20', end_time: '15:10' },
            { year: '3', branch: 'CSE', section: 'A', day: 'SAT', slot: 7, subject: ' ', start_time: '15:10', end_time: '16:00' },
        ];

        const insertResult = await Timetable.insertMany(timetableData);
        console.log(`🚀 Successfully seeded ${insertResult.length} records for 3rd Year CSE A`);

        // Verification query
        const count = await Timetable.countDocuments({ year: '3', branch: 'CSE', section: 'A' });
        console.log(`📊 Verification Count: ${count}`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error during seeding:', err);
        process.exit(1);
    }
};

seedData();
