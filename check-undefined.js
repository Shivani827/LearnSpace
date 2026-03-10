const mongoose = require('mongoose');
const { Timetable } = require('./db/register');
require('dotenv').config();

const checkUndefined = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://madhavdhavala0_db_user:mDGpnbjWOF9Pmlr2@cluster0.dvj6trf.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const records = await Timetable.find({ year: { $exists: false } }).limit(5).lean();
        if (records.length === 0) {
            const records2 = await Timetable.find({ year: null }).limit(5).lean();
            console.log('📋 Records with year null:', JSON.stringify(records2, null, 2));
        } else {
            console.log('📋 Records with year missing:', JSON.stringify(records, null, 2));
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

checkUndefined();
