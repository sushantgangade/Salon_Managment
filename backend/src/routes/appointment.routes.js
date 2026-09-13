const express = require('express');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Client = require('../models/Client');
const Staff = require('../models/Staff');
const Service = require('../models/Service');
const Salon = require('../models/Salon');
const { requireAuth } = require('../middleware/auth');
const { requireRole, requireSalonScope } = require('../middleware/rbac');
const { requireActiveSubscription } = require('../middleware/subscription');
const { toMinutes, isValidHHMM, overlaps, todayStr } = require('../utils/time');

const router = express.Router();

function isValidObjectId(v) {
    return typeof v === 'string' && mongoose.Types.ObjectId.isValid(v);
}

// All appointment endpoints:
// auth -> salon scope -> role gate -> subscription gate
router.use(
    requireAuth,
    requireSalonScope,
    requireRole('SALON_OWNER', 'RECEPTIONIST'),
    requireActiveSubscription
);

// List (optionally by date)
router.get('/', async (req, res) => {
    const { date } = req.query;
    const filter = { salonId: req.user.salonId };

    if (date) {
        filter.date = date;
    }

    const rows = await Appointment.find(filter)
        .populate('clientId', 'name phone')
        .populate('staffId', 'name')
        .populate('serviceId', 'name durationMinutes')
        .sort({ date: -1, startTime: 1 });

    res.json(rows);
});

// Today's appointments count (for dashboard)
router.get('/today/count', async (req, res) => {
    const count = await Appointment.countDocuments({
        salonId: req.user.salonId,
        date: todayStr(),
        status: { $ne: 'CANCELLED' },
    });

    res.json({
        date: todayStr(),
        count,
    });
});

// Create
router.post('/', async (req, res) => {
    try {
        const {
            clientId,
            staffId,
            serviceId,
            date,
            startTime,
            status,
        } = req.body || {};

        // 1. Check required fields
        if (!clientId || !staffId || !serviceId || !date || !startTime) {
            return res.status(400).json({
                error: 'BAD_REQUEST',
                message: 'clientId, staffId, serviceId, date, startTime required',
            });
        }

        // 2. Validate MongoDB ObjectIds before querying MongoDB
        for (const [key, value] of [
            ['clientId', clientId],
            ['staffId', staffId],
            ['serviceId', serviceId],
        ]) {
            if (!isValidObjectId(value)) {
                return res.status(400).json({
                    error: 'BAD_REQUEST',
                    message: `${key} is not a valid ObjectId (got "${value}")`,
                });
            }
        }

        // 3. Validate time format
        if (!isValidHHMM(startTime)) {
            return res.status(400).json({
                error: 'BAD_REQUEST',
                message: 'startTime must be HH:mm',
            });
        }

        const salonId = req.user.salonId;

        // Tenant-isolated lookups:
        // every referenced document must belong to this salon.
        const [client, staff, service, salon] = await Promise.all([
            Client.findOne({
                _id: clientId,
                salonId,
            }),

            Staff.findOne({
                _id: staffId,
                salonId,
            }),

            Service.findOne({
                _id: serviceId,
                salonId,
            }),

            Salon.findById(salonId),
        ]);

        if (!client) {
            return res.status(400).json({
                error: 'BAD_REQUEST',
                message: 'Invalid client',
            });
        }

        if (!staff) {
            return res.status(400).json({
                error: 'BAD_REQUEST',
                message: 'Invalid staff',
            });
        }

        if (!service) {
            return res.status(400).json({
                error: 'BAD_REQUEST',
                message: 'Invalid service',
            });
        }

        if (!salon) {
            return res.status(400).json({
                error: 'BAD_REQUEST',
                message: 'Salon missing',
            });
        }

        const startMin = toMinutes(startTime);
        const endMin = startMin + service.durationMinutes;

        // 1. Working hours:
        // Appointment must be fully inside [opening, closing]
        const openMin = toMinutes(salon.openingTime || '09:00');
        const closeMin = toMinutes(salon.closingTime || '20:00');

        if (startMin < openMin || endMin > closeMin) {
            return res.status(400).json({
                error: 'OUTSIDE_WORKING_HOURS',
                message: `Appointment must fall within ${salon.openingTime}–${salon.closingTime}`,
            });
        }

        // 2. Staff conflict:
        // Only check active/non-cancelled same-day appointments
        const existing = await Appointment.find({
            salonId,
            staffId,
            date,
            status: { $ne: 'CANCELLED' },
        });

        for (const appt of existing) {
            const exStart = toMinutes(appt.startTime);
            const exEnd = toMinutes(appt.endTime);

            if (overlaps(startMin, endMin, exStart, exEnd)) {
                return res.status(409).json({
                    error: 'STAFF_CONFLICT',
                    message: `Staff already booked ${appt.startTime}–${appt.endTime}`,
                });
            }
        }

        const endTime = require('../utils/time').toHHMM(endMin);

        const appt = await Appointment.create({
            salonId,
            clientId,
            staffId,
            serviceId,
            date,
            startTime,
            endTime,
            status:
                status && Appointment.STATUS.includes(status)
                    ? status
                    : 'PENDING',
        });

        const populated = await Appointment.findById(appt._id)
            .populate('clientId', 'name phone')
            .populate('staffId', 'name')
            .populate('serviceId', 'name durationMinutes');

        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({
            error: 'SERVER_ERROR',
            message: err.message,
        });
    }
});

// Update status
// Owner + Receptionist may change status; not delete
router.patch('/:id/status', async (req, res) => {
    const { status } = req.body || {};

    if (!Appointment.STATUS.includes(status)) {
        return res.status(400).json({
            error: 'BAD_REQUEST',
            message: 'Invalid status',
        });
    }

    const appt = await Appointment.findOneAndUpdate(
        {
            _id: req.params.id,
            salonId: req.user.salonId,
        },
        { status },
        { new: true }
    );

    if (!appt) {
        return res.status(404).json({
            error: 'NOT_FOUND',
        });
    }

    res.json(appt);
});

module.exports = router;