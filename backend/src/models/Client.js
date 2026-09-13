const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
    {
        salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
        name: { type: String, required: true, trim: true },
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, trim: true },
    },
    { timestamps: true }
);

clientSchema.index({ salonId: 1, email: 1 });

module.exports = mongoose.model('Client', clientSchema);