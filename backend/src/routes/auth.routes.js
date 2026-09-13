const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function sign(user) {
    return jwt.sign(
        { sub: String(user._id), role: user.role, salonId: user.salonId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'BAD_REQUEST', message: 'email and password required' });
        }
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid credentials' });

        const ok = await user.comparePassword(password);
        if (!ok) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid credentials' });

        const token = sign(user);
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                salonId: user.salonId,
                staffId: user.staffId,
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
});

router.get('/me', requireAuth, async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        salonId: user.salonId,
        staffId: user.staffId,
    });
});

module.exports = router;