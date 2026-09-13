require('dotenv').config();
const { connectDB } = require('./config/db');
const { createApp } = require('./app');

async function main() {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI missing');
    await connectDB(uri);

    const app = createApp();
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`[server] listening on :${port}`));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});