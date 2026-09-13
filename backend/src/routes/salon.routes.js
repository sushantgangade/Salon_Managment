const express = require('express');
const Salon = require('../models/Salon');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const Plan = require('../models/Plan');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

// ---------- Super Admin only ----------

// List salons
router.get('/', requireAuth, requireRole('SUPER_ADMIN'), async (_req, res) => {
    const salons = await Salon.find().populate('currentPlan').sort({ createdAt: -1 });
    res.json(salons);
});

// Assign / Renew / Upgrade a plan
// Body: { planId, action: 'ASSIGN' | 'RENEW' | 'UPGRADE' }
router.post('/:salonId/subscription', requireAuth, requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const { planId, action } = req.body || {};
        if (!planId || !['ASSIGN', 'RENEW', 'UPGRADE'].includes(action)) {
            return res.status(400).json({ error: 'BAD_REQUEST', message: 'planId and valid action required' });
        }

        const salon = await Salon.findById(req.params.salonId);
        if (!salon) return res.status(404).json({ error: 'NOT_FOUND', message: 'Salon not found' });

        const plan = await Plan.findById(planId);
        if (!plan) return res.status(404).json({ error: 'NOT_FOUND', message: 'Plan not found' });

        const now = new Date();

        // RENEW: extend from current end date if still active, else start now
        let startDate = now;
        if (action === 'RENEW' && salon.subscriptionEndDate && salon.subscriptionEndDate > now) {
            startDate = salon.subscriptionEndDate;
        }
        const endDate = new Date(startDate.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000);

        salon.currentPlan = plan._id;
        salon.subscriptionStartDate = startDate;
        salon.subscriptionEndDate = endDate;
        salon.subscriptionStatus = 'ACTIVE';
        await salon.save();

        const history = await SubscriptionHistory.create({
            salonId: salon._id,
            planId: plan._id,
            startDate,
            endDate,
            price: plan.price,
            action,
        });

        res.status(201).json({ salon, history });
    } catch (err) {
        res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
});

// Subscription history (all salons) — Super Admin only
router.get('/subscription-history', requireAuth, requireRole('SUPER_ADMIN'), async (_req, res) => {
    const rows = await SubscriptionHistory.find()
        .populate('salonId', 'name')
        .populate('planId', 'name price')
        .sort({ createdAt: -1 });
    res.json(rows);
});

// ---------- Owner: view own subscription ----------
router.get(
    '/me/subscription',
    requireAuth,
    requireRole('SALON_OWNER'),
    async (req, res) => {
        const salon = await Salon.findById(req.user.salonId).populate('currentPlan');
        if (!salon) return res.status(404).json({ error: 'NOT_FOUND' });
        const history = await SubscriptionHistory.find({ salonId: salon._id })
            .populate('planId', 'name price')
            .sort({ createdAt: -1 });
        res.json({ salon, history });
    }
);

module.exports = router;