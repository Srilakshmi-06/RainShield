const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phone: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: Number },
    city: { type: String },
    platform: { type: String },
    vehicleType: { type: String, default: 'Two-Wheeler' },
    workingHours: { type: Number },
    preferredZones: { type: String },
    riskScore: { type: Number, default: 20 },
    tier: { type: String, enum: ['basic', 'standard', 'premium'], default: 'standard' },
    avgDailyEarnings: { type: Number, default: 800 },
    verificationStatus: { type: String, default: 'unverified' },
    documentsLinked: { type: Boolean, default: false },
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
    coverageTier: { type: String, enum: ['basic', 'standard', 'premium'], default: 'standard' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    premiumAmount: { type: Number, default: 150 },
    currentPremium: { type: Number, default: 150 }, // Dynamic premium scaling
    payoutLimit: { type: Number, default: 5000 },
    status: { type: String, enum: ['active', 'expiring_soon', 'expired', 'pending_renewal'], default: 'active' },
    autoRenew: { type: Boolean, default: true },
    gracePeriodEnd: { type: Date },
    riskLevel: { type: String, default: 'Low' },
    riskInsights: {
        explanation: String,
        factors: [String],
        breakdown: {
            base: Number,
            environmental_load: Number,
            final: Number
        },
        payoutScenarios: mongoose.Schema.Types.Mixed
    },
    lastPayoutDate: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
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
    claimType: { type: String, default: 'Weather Loss' }, // Rain, Storm, Heat, Flood
    description: { type: String },
    amount: { type: Number },
    status: { 
        type: String, 
        enum: ['Pending', 'Under Review', 'Approved', 'Processed', 'Rejected'], 
        default: 'Pending' 
    },
    riskData: {
        location: String,
        rainfall: Number,
        predictedLoss: Number,
        timestamp: Date
    },
    timeline: [
        {
            status: String,
            timestamp: { type: Date, default: Date.now },
            comment: String
        }
    ],
    isAutoApproved: { type: Boolean, default: false },
    fraudFlags: [String],
    submittedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Claim = mongoose.model('Claim', claimSchema);

const premiumHistorySchema = new mongoose.Schema({
    policyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    previousPremium: { type: Number },
    newPremium: { type: Number },
    changeReason: { type: String },
    breakdown: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
});

const PremiumHistory = mongoose.model('PremiumHistory', premiumHistorySchema);

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

module.exports = { User, Payout, Policy, RiskAlert, Claim, WeatherPrediction, PremiumHistory };
