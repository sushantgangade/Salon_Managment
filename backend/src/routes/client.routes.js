const express = require('express');
const Client = require('../models/Client');
const { requireAuth } = require('../middleware/auth');
const { requireRole, requireSalonScope } = require('../middleware/rbac');
const { requireActiveSubscription } = require('../middleware/subscription');

const router = express.Router();

router.use(
    requireAuth,
    requireSalonScope,
    requireRole('SALON_OWNER', 'RECEPTIONIST'),
    requireActiveSubscription
);

router.get('/', async (req, res) => {
    const rows = await Client.find({ salonId: req.user.salonId }).sort({ createdAt: -1 });
    res.json(rows);
});

router.post('/', async (req, res) => {
    const { name, email, phone } = req.body || {};
    if (!name) return res.status(400).json({ error: 'BAD_REQUEST', message: 'name required' });
    const c = await Client.create({ salonId: req.user.salonId, name, email, phone });
    res.status(201).json(c);
});

module.exports = router;