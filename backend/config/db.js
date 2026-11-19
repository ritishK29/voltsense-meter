const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('Atlas Connection Error:', err.message);
    console.log('Starting VoltSense Local DB Engine...');
    const dbFolder = path.join(__dirname, '..', 'voltsense-db-data');
    if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder, { recursive: true });
    const lockFile = path.join(dbFolder, 'mongod.lock');
    if (fs.existsSync(lockFile)) {
      try { fs.unlinkSync(lockFile); } catch {}
    }

    const mongod = await MongoMemoryServer.create({
      instance: {
        dbPath: dbFolder,
        storageEngine: 'wiredTiger',
      },
    });
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`Persistent Local MongoDB Ready at ${dbFolder}`);
  }
};

module.exports = connectDB;