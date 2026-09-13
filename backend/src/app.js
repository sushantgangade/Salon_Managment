const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const planRoutes = require('./routes/plan.routes');
const salonRoutes = require('./routes/salon.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const clientRoutes = require('./routes/client.routes');
const serviceRoutes = require('./routes/service.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const staffRoutes = require('./routes/staff.routes');

function createApp() {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use(morgan('dev'));

    app.get('/health', (_req, res) => res.json({ ok: true }));

    app.use('/auth', authRoutes);
    app.use('/plans', planRoutes);
    app.use('/salons', salonRoutes);
    app.use('/appointments', appointmentRoutes);
    app.use('/clients', clientRoutes);
    app.use('/services', serviceRoutes);
    app.use('/attendance', attendanceRoutes);
    app.use('/staff', staffRoutes);

    // 404
    app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }));

    // error handler
    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => {
        console.error('[error]', err);
        res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    });

    return app;
}

module.exports = { createApp };