const mongoose = require('mongoose');
const { Timetable } = require('./db/register');
require('dotenv').config();

const verify = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://madhavdhavala0_db_user:mDGpnbjWOF9Pmlr2@cluster0.dvj6trf.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check for any invalid records (should be 0)
        const invalidQuery = {
            $or: [
                { year: { $in: [null, "undefined", "null", ""] } },
                { branch: { $in: [null, "undefined", "null", ""] } },
                { section: { $in: [null, "undefined", "null", ""] } },
                { year: { $exists: false } },
                { branch: { $exists: false } },
                { section: { $exists: false } }
            ]
        };
        const invalidCount = await Timetable.countDocuments(invalidQuery);
        console.log(`📊 Invalid records in database: ${invalidCount}`);

        // Check for unique groups
        const groups = await Timetable.aggregate([
            {
                $group: {
                    _id: {
                        year: "$year",
                        branch: "$branch",
                        section: "$section"
                    },
                    count: { $sum: 1 }
                }
            }
        ]);
        console.log('📊 Current Timetable Groups:');
        groups.forEach(g => {
            console.log(`- ${g._id.year} Year, Branch: ${g._id.branch}, Section: ${g._id.section} (${g.count} entries)`);
        });

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    }
};

verify();
