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

// New Models for Premium Features
const policySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    premiumAmount: { type: Number, default: 200 },
    currentPremium: { type: Number, default: 200 },
    status: { type: String, default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

const Policy = mongoose.model('Policy', policySchema);

const riskAlertSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    city: { type: String },
    riskType: { type: String }, // Flood, Health, Accident
    riskLevel: { type: String },
    message: { type: String },
    suggestedClaim: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

const RiskAlert = mongoose.model('RiskAlert', riskAlertSchema);

const claimSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    policyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy' },
    riskAlertId: { type: mongoose.Schema.Types.ObjectId, ref: 'RiskAlert' },
    claimType: { type: String },
    description: { type: String },
    amount: { type: Number },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    submittedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Claim = mongoose.model('Claim', claimSchema);

const predictionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rainfall: { type: Number },
    temperature: { type: Number },
    predictedEarnings: { type: Number },
    riskLevel: { type: String },
    payoutAmount: { type: Number },
    timestamp: { type: Date, default: Date.now }
});

const WeatherPrediction = mongoose.model('WeatherPrediction', predictionSchema);

module.exports = { User, Payout, Policy, RiskAlert, Claim, WeatherPrediction };
