require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Salon = require('../models/Salon');
const Plan = require('../models/Plan');
const Client = require('../models/Client');
const Staff = require('../models/Staff');
const Service = require('../models/Service');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const Appointment = require('../models/Appointment');
const Attendance = require('../models/Attendance');

async function seed() {
    await connectDB(process.env.MONGO_URI);

    // Wipe
    await Promise.all([
        User.deleteMany({}),
        Salon.deleteMany({}),
        Plan.deleteMany({}),
        Client.deleteMany({}),
        Staff.deleteMany({}),
        Service.deleteMany({}),
        SubscriptionHistory.deleteMany({}),
        Appointment.deleteMany({}),
        Attendance.deleteMany({}),
    ]);

    // Super Admin
    await User.create({
        name: 'Super Admin',
        email: 'admin@salon.test',
        password: 'admin123',
        role: 'SUPER_ADMIN',
    });

    // Plan
    const proPlan = await Plan.create({
        name: 'Pro',
        price: 49,
        durationInDays: 30,
        maxStaff: 10,
        maxAppointments: 500,
    });

    // Salon (geo: central office sample, radius 150m)
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const salon = await Salon.create({
        name: 'Glow Studio',
        latitude: 28.6139,
        longitude: 77.209,
        allowedRadius: 150,
        openingTime: '09:00',
        closingTime: '20:00',
        currentPlan: proPlan._id,
        subscriptionStartDate: now,
        subscriptionEndDate: end,
        subscriptionStatus: 'ACTIVE',
    });

    await SubscriptionHistory.create({
        salonId: salon._id,
        planId: proPlan._id,
        startDate: now,
        endDate: end,
        price: proPlan.price,
        action: 'ASSIGN',
    });

    // Staff
    const staff1 = await Staff.create({ salonId: salon._id, name: 'Rita Stylist', email: 'rita@salon.test' });

    // Users
    await User.create({
        name: 'Owner One',
        email: 'owner@salon.test',
        password: 'owner123',
        role: 'SALON_OWNER',
        salonId: salon._id,
    });
    await User.create({
        name: 'Receptionist',
        email: 'reception@salon.test',
        password: 'recep123',
        role: 'RECEPTIONIST',
        salonId: salon._id,
        staffId: staff1._id,
    });

    // Clients
    await Client.create([
        { salonId: salon._id, name: 'Alice', phone: '111' },
        { salonId: salon._id, name: 'Bob', phone: '222' },
    ]);

    // Services
    await Service.create([
        { salonId: salon._id, name: 'Haircut', durationMinutes: 30 },
        { salonId: salon._id, name: 'Facial', durationMinutes: 60 },
        { salonId: salon._id, name: 'Hair Color', durationMinutes: 120 },
    ]);

    console.log('✅ Seed complete');
    console.log('Logins:');
    console.log('  admin@salon.test / admin123 (SUPER_ADMIN)');
    console.log('  owner@salon.test / owner123 (SALON_OWNER)');
    console.log('  reception@salon.test / recep123 (RECEPTIONIST)');
    await mongoose.disconnect();
}

seed().catch((e) => {
    console.error(e);
    process.exit(1);
});