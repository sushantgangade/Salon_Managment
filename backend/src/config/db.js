const mongoose = require('mongoose');

async function connectDB(uri) {
    await mongoose.connect(uri, { autoIndex: true });
    console.log('[db] connected');
}

module.exports = { connectDB };
