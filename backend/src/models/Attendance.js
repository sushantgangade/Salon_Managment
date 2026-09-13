const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
    {
        salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        distanceMeters: { type: Number, required: true },
        checkedInAt: { type: Date, default: Date.now },
        day: { type: String, required: true, index: true }, // YYYY-MM-DD
    },
    { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);