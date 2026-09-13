const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
    {
        salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
        name: { type: String, required: true },
        durationMinutes: { type: Number, required: true, min: 5 },
    },
    { timestamps: true }
);

serviceSchema.index({ salonId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Service', serviceSchema);