const mongoose = require('mongoose');

const subHistorySchema = new mongoose.Schema(
    {
        salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
        planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        price: { type: Number, required: true },
        action: { type: String, enum: ['ASSIGN', 'RENEW', 'UPGRADE'], required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('SubscriptionHistory', subHistorySchema);