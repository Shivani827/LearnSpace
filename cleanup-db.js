const mongoose = require('mongoose');
const { Timetable } = require('./db/register');
require('dotenv').config();

const cleanup = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://madhavdhavala0_db_user:mDGpnbjWOF9Pmlr2@cluster0.dvj6trf.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Records with year, branch, or section missing/null/undefined
        const query = {
            $or: [
                { year: { $in: [null, "undefined", "null", ""] } },
                { branch: { $in: [null, "undefined", "null", ""] } },
                { section: { $in: [null, "undefined", "null", ""] } },
                { year: { $exists: false } },
                { branch: { $exists: false } },
                { section: { $exists: false } }
            ]
        };

        const count = await Timetable.countDocuments(query);
        console.log(`📊 Found ${count} invalid records to delete`);

        if (count > 0) {
            const result = await Timetable.deleteMany(query);
            console.log(`🧹 Deleted ${result.deletedCount} invalid records`);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during cleanup:', err);
        process.exit(1);
    }
};

cleanup();
