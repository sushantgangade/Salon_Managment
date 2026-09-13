const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT, attach req.user = { id, role, salonId, staffId }
async function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : null;
        if (!token) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing token' });

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.sub);
        if (!user) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid token' });

        req.user = {
            id: String(user._id),
            role: user.role,
            salonId: user.salonId ? String(user.salonId) : null,
            staffId: user.staffId ? String(user.staffId) : null,
        };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' });
    }
}

module.exports = { requireAuth };