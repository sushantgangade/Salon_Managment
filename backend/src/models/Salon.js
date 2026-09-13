const mongoose = require('mongoose');

const salonSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        // Geo-fence stored directly on salon (justified: single-branch MVP, avoids extra collection)
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        allowedRadius: { type: Number, required: true, min: 10 }, // meters
        openingTime: { type: String, default: '09:00' },
        closingTime: { type: String, default: '20:00' },

        // Subscription state
        currentPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
        subscriptionStartDate: { type: Date, default: null },
        subscriptionEndDate: { type: Date, default: null },
        subscriptionStatus: {
            type: String,
            enum: ['ACTIVE', 'EXPIRED', 'NONE'],
            default: 'NONE',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Salon', salonSchema);