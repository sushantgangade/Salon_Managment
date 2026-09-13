const Salon = require('../models/Salon');

const EXPIRED_BODY = {
    error: 'SUBSCRIPTION_EXPIRED',
    message:
        'Your subscription has expired. Please contact the administrator to renew your plan.',
};

// Applies to salon-scoped roles only. Super Admin bypasses.
async function requireActiveSubscription(req, res, next) {
    try {
        if (req.user.role === 'SUPER_ADMIN') return next();

        const salon = await Salon.findById(req.user.salonId);
        if (!salon) {
            return res.status(403).json({ error: 'FORBIDDEN', message: 'Salon not found' });
        }

        const now = new Date();
        const isActive =
            salon.subscriptionStatus === 'ACTIVE' &&
            salon.subscriptionEndDate &&
            salon.subscriptionEndDate > now;

        // Self-heal: if end date passed, mark as expired.
        if (!isActive && salon.subscriptionStatus !== 'EXPIRED') {
            salon.subscriptionStatus = 'EXPIRED';
            await salon.save();
        }

        if (!isActive) return res.status(403).json(EXPIRED_BODY);

        req.salon = salon; // downstream handlers can reuse
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = { requireActiveSubscription, EXPIRED_BODY };