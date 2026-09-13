const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
    {
        salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
        name: { type: String, required: true, trim: true },
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, trim: true },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Staff', staffSchema);