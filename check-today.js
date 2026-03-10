const mongoose = require('mongoose');
const { Timetable } = require('./db/register');
require('dotenv').config();

const checkToday = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://madhavdhavala0_db_user:mDGpnbjWOF9Pmlr2@cluster0.dvj6trf.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const count = await Timetable.countDocuments({ createdAt: { $gte: today } });
        console.log(`📊 Records created today: ${count}`);

        if (count > 0) {
            const records = await Timetable.find({ createdAt: { $gte: today } }).limit(5).lean();
            console.log('📋 Sample Today Records:', JSON.stringify(records, null, 2));
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

checkToday();
