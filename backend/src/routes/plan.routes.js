const express = require('express');
const Plan = require('../models/Plan');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

// Only Super Admin manages plans
router.post('/', requireAuth, requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const { name, price, durationInDays, maxStaff, maxAppointments } = req.body || {};
        if (!name || price == null || !durationInDays || !maxStaff || !maxAppointments) {
            return res.status(400).json({ error: 'BAD_REQUEST', message: 'All plan fields required' });
        }
        const plan = await Plan.create({ name, price, durationInDays, maxStaff, maxAppointments });
        res.status(201).json(plan);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'CONFLICT', message: 'Plan name already exists' });
        }
        res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
});

router.get('/', requireAuth, requireRole('SUPER_ADMIN'), async (_req, res) => {
    const plans = await Plan.find().sort({ createdAt: -1 });
    res.json(plans);
});

module.exports = router;