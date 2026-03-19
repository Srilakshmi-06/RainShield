const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phone: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    city: { type: String },
    platform: { type: String },
    avgDailyEarnings: { type: Number, default: 800 },
    tier: { type: String, enum: ['basic', 'standard', 'premium'], default: 'standard' },
    role: { type: String, enum: ['worker', 'admin'], default: 'worker' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const payoutSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true },
    city: { type: String },
    reason: { type: String },
    timestamp: { type: Date, default: Date.now }
});

const Payout = mongoose.model('Payout', payoutSchema);

module.exports = { User, Payout };
