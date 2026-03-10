const mongoose = require('mongoose');
const { Timetable } = require('./db/register');
require('dotenv').config();

const checkData = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://madhavdhavala0_db_user:mDGpnbjWOF9Pmlr2@cluster0.dvj6trf.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const timetables = await Timetable.find().limit(5).lean();
        console.log('📋 Sample Timetable Records:');
        timetables.forEach(t => {
            console.log(`ID: ${t._id}, Year: "${t.year}", Branch: "${t.branch}", Section: "${t.section}", Subject: "${t.subject}"`);
        });

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
        console.log('\n📊 Grouped Data:');
        groups.forEach(g => {
            console.log(`Year: "${g._id.year}", Branch: "${g._id.branch}", Section: "${g._id.section}", Count: ${g.count}`);
        });

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

checkData();
