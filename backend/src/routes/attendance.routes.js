const express = require('express');
const Attendance = require('../models/Attendance');
const Salon = require('../models/Salon');
const { requireAuth } = require('../middleware/auth');
const { requireRole, requireSalonScope } = require('../middleware/rbac');
const { requireActiveSubscription } = require('../middleware/subscription');
const { haversineMeters, isValidCoord } = require('../utils/geo');
const { todayStr } = require('../utils/time');

const router = express.Router();

router.use(
    requireAuth,
    requireSalonScope,
    requireRole('SALON_OWNER', 'RECEPTIONIST'),
    requireActiveSubscription
);

// GET /attendance/today — for dashboard "checked-in / not yet"
router.get('/today', async (req, res) => {
    const filter = { salonId: req.user.salonId, day: todayStr() };
    if (req.user.staffId) filter.staffId = req.user.staffId;
    else filter.userId = req.user.id;

    const row = await Attendance.findOne(filter).sort({ checkedInAt: -1 });
    res.json({ checkedIn: !!row, record: row || null });
});

// POST /attendance/check-in
// Body: { latitude, longitude }
router.post('/check-in', async (req, res) => {
    try {
        const { latitude, longitude } = req.body || {};

        // Graceful handling of missing / invalid GPS
        if (latitude == null || longitude == null) {
            return res.status(400).json({
                error: 'LOCATION_REQUIRED',
                message: 'latitude and longitude are required (enable GPS / grant permission)',
            });
        }
        if (!isValidCoord(latitude, longitude)) {
            return res.status(400).json({
                error: 'INVALID_COORDINATES',
                message: 'latitude/longitude out of range or not numeric',
            });
        }

        const salon = await Salon.findById(req.user.salonId);
        if (!salon) return res.status(404).json({ error: 'NOT_FOUND', message: 'Salon not found' });

        const distance = haversineMeters(
            latitude,
            longitude,
            salon.latitude,
            salon.longitude
        );

        if (distance > salon.allowedRadius) {
            return res.status(403).json({
                error: 'OUT_OF_RANGE',
                message: `You are ${Math.round(distance)}m away (allowed ${salon.allowedRadius}m)`,
                distanceMeters: Math.round(distance),
                allowedRadius: salon.allowedRadius,
            });
        }

        // staffId — prefer linked staff record; fallback to userId for scoping
        const staffId = req.user.staffId || req.user.id;

        const record = await Attendance.create({
            salonId: salon._id,
            staffId,
            userId: req.user.id,
            latitude,
            longitude,
            distanceMeters: distance,
            day: todayStr(),
        });

        res.status(201).json({
            ok: true,
            distanceMeters: Math.round(distance),
            checkedInAt: record.checkedInAt,
        });
    } catch (err) {
        res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
});

module.exports = router;