const mongoose = require('mongoose');
const { Timetable } = require('./db/register');
require('dotenv').config();

const inspectRecord = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://madhavdhavala0_db_user:mDGpnbjWOF9Pmlr2@cluster0.dvj6trf.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const t = await Timetable.findOne().lean();
        if (t) {
            console.log('📋 Full Record Keys and Types:');
            Object.keys(t).forEach(key => {
                console.log(`${key}: ${JSON.stringify(t[key])} (${typeof t[key]})`);
            });
        } else {
            console.log('❌ No records found');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

inspectRecord();
