const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['SUPER_ADMIN', 'SALON_OWNER', 'RECEPTIONIST'];

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
        password: { type: String, required: true, select: false },
        role: { type: String, enum: ROLES, required: true },
        // Salon-scoped roles MUST have salonId. SUPER_ADMIN has none.
        salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', default: null, index: true },
        // For staff check-in: link user -> staff record (receptionist may also be a staff member)
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = function (plain) {
    return bcrypt.compare(plain, this.password);
};

userSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('User', userSchema);