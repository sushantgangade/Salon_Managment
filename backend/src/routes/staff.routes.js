const express = require('express');
const Staff = require('../models/Staff');
const { requireAuth } = require('../middleware/auth');
const { requireRole, requireSalonScope } = require('../middleware/rbac');

const router = express.Router();

// List staff for the current salon
router.get(
    '/',
    requireAuth,
    requireSalonScope,
    requireRole('SALON_OWNER', 'RECEPTIONIST'),
    async (req, res) => {
        const rows = await Staff.find({ salonId: req.user.salonId, active: true }).sort({ name: 1 });
        res.json(rows);
    }
);

module.exports = router;