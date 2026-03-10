const mongoose = require('mongoose');
require('dotenv').config();

const listEverything = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://madhavdhavala0_db_user:mDGpnbjWOF9Pmlr2@cluster0.dvj6trf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        console.log('📦 Current Database Name:', mongoose.connection.name);

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('📚 Databases in Cluster:');
        for (let db of dbs.databases) {
            console.log(`- ${db.name}`);
        }

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n🗂️ Collections in current DB:');
        for (let col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`- ${col.name} (${count} documents)`);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

listEverything();
