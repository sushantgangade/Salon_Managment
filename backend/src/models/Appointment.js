const mongoose = require('mongoose');

const STATUS = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

const appointmentSchema = new mongoose.Schema(
    {
        salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
        clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
        date: { type: String, required: true }, // YYYY-MM-DD (local salon day)
        startTime: { type: String, required: true }, // HH:mm
        endTime: { type: String, required: true },   // HH:mm
        status: { type: String, enum: STATUS, default: 'PENDING' },
    },
    { timestamps: true }
);

// fast overlap lookups
appointmentSchema.index({ salonId: 1, staffId: 1, date: 1, status: 1 });

appointmentSchema.statics.STATUS = STATUS;

module.exports = mongoose.model('Appointment', appointmentSchema);