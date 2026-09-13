const express = require('express');
const Service = require('../models/Service');
const { requireAuth } = require('../middleware/auth');
const { requireRole, requireSalonScope } = require('../middleware/rbac');

const router = express.Router();

router.get(
    '/',
    requireAuth,
    requireSalonScope,
    requireRole('SALON_OWNER', 'RECEPTIONIST'),
    async (req, res) => {
        const rows = await Service.find({ salonId: req.user.salonId }).sort({ name: 1 });
        res.json(rows);
    }
);

module.exports = router;