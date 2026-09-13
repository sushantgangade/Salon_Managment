// requireRole('SALON_OWNER', 'RECEPTIONIST') etc.
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' });
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'FORBIDDEN',
                message: `Role ${req.user.role} is not allowed to perform this action`,
            });
        }
        next();
    };
}

// Ensures salon-scoped roles always have a salonId. Blocks cross-tenant access at the source.
function requireSalonScope(req, res, next) {
    if (req.user.role === 'SUPER_ADMIN') return next();
    if (!req.user.salonId) {
        return res.status(403).json({ error: 'FORBIDDEN', message: 'No salon assigned to this user' });
    }
    next();
}

module.exports = { requireRole, requireSalonScope };