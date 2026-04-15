const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const PolicyService = require('../services/policyService');

const JWT_SECRET = process.env.JWT_SECRET || 'rainshield_secret_key';

// Mock OTP storage
const otpStore = {};

// Helper: Risk Logic (Simplified ML Simulation)
const calculateInitialRisk = (hours, wetWork) => {
    let score = 20; // Baseline
    if (hours > 8) score += 30; // High exposure
    if (wetWork) score += 40; // Rain exposure
    return Math.min(score, 100);
};

const suggestTier = (riskScore) => {
    if (riskScore >= 70) return 'premium';
    if (riskScore >= 40) return 'standard';
    return 'basic';
};

// 1. Send OTP (Simulated - for the initial phone verification step)
router.post('/send-otp', (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phone] = otp;

    console.log(`\n[AUTH SERVICE] VERIFICATION OTP for ${phone}: ${otp}\n`);

    res.json({ 
        message: 'OTP sent! Use this to verify your phone number.', 
        debugOtp: otp,
        status: 'mock_sent'
    });
});

// 2. Verify OTP
router.post('/verify-otp', (req, res) => {
    const { phone, otp } = req.body;
    
    // Bypass for demo (000000)
    if (otp === '000000' || (otpStore[phone] && otpStore[phone] === otp)) {
        delete otpStore[phone];
        const tempToken = jwt.sign({ phone, authenticated: true }, JWT_SECRET, { expiresIn: '15m' });
        return res.json({ success: true, tempToken, message: 'OTP verified' });
    }
    
    res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
});

// 3. Signup / Advanced Onboarding (With Password)
router.post('/signup', async (req, res) => {
    const { 
        phone, password, name, age, city, platform, vehicleType, 
        workingHours, preferredZones, wetWork, tier 
    } = req.body;

    try {
        // Validate if user already exists
        let user = await User.findOne({ phone });
        if (user) {
            return res.status(400).json({ error: 'User already registered. Please login.' });
        }

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        // --- Logic-based AI features for initial profile ---
        const riskScore = calculateInitialRisk(parseInt(workingHours), wetWork);
        const autoSuggestedTier = suggestTier(riskScore);
        const finalTier = tier || autoSuggestedTier;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save to MongoDB
        user = new User({
            phone,
            password: hashedPassword,
            name,
            age: parseInt(age),
            city,
            platform,
            vehicleType,
            workingHours: parseInt(workingHours),
            preferredZones,
            riskScore,
            tier: finalTier,
            verificationStatus: 'verified', // Auto-verify for demo
            documentsLinked: false,
            role: phone === '999' ? 'admin' : 'worker'
        });

        await user.save();
        console.log(`[DB] NEW USER REGISTERED: ${name} (${phone})`);
        
        // Activate initial policy in MongoDB
        await PolicyService.createInitialPolicy(phone, finalTier);

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Worker Onboarding Completed!',
            user: { ...user._doc, password: '' }, // Don't return password
            token,
            riskSummary: {
                score: riskScore,
                recommendedTier: autoSuggestedTier
            }
        });
    } catch (err) {
        console.error('Signup Error:', err.message);
        
        // --- 🚀 FAILOVER: Mock Signup if DB is down ---
        if (err.message.includes('buffering') || err.message.includes('timeout') || err.message.includes('connection')) {
            console.warn('[AUTH] MongoDB disconnected. Falling back to Mock Signup for demo.');
            const mockUser = {
                phone, name, city, tier: tier || 'standard', role: phone === '999' ? 'admin' : 'worker',
                _id: 'mock_id_' + Date.now()
            };
            const token = jwt.sign({ userId: mockUser._id, role: mockUser.role }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(201).json({
                message: 'Demo Mode: Signup Successful (No DB)',
                user: mockUser,
                token,
                isMock: true
            });
        }
        res.status(500).json({ error: 'Database Error: ' + err.message });
    }
});

// 4. Secure Login (Password-based)
router.post('/login', async (req, res) => {
    const { phone, password } = req.body;
    
    try {
        const user = await User.findOne({ phone });

        if (!user) {
            // --- 🚀 FAILOVER: Mock Login if DB is down ---
            console.warn('[AUTH] User not found or DB disconnected. checking mock bypass...');
            if (password === 'admin' || password === '1234') {
                const mockUser = { phone, name: 'Demo Worker', city: 'Mumbai', tier: 'premium', role: 'worker', _id: 'mock_123' };
                const token = jwt.sign({ userId: mockUser._id, role: 'worker' }, JWT_SECRET, { expiresIn: '7d' });
                return res.json({ message: 'Demo Mode: Login successful', user: mockUser, token, isMock: true });
            }
            return res.status(404).json({ error: 'Worker not found. Please sign up.' });
        }

        // Admin Master Bypass for Demo
        if (phone === '999' && password === 'admin') {
            const token = jwt.sign({ userId: user._id, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({ message: 'Admin Login successful', user, token });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'Login successful', user: { ...user._doc, password: '' }, token });

    } catch (err) {
        console.error('Login Error:', err.message);
        
        // --- 🚀 FAILOVER: Mock Login if DB is down ---
        if (err.message.includes('buffering') || err.message.includes('timeout') || err.message.includes('connection')) {
             const mockUser = { phone, name: 'Demo Worker', city: 'Mumbai', tier: 'premium', role: 'worker', _id: 'mock_123' };
             const token = jwt.sign({ userId: mockUser._id, role: 'worker' }, JWT_SECRET, { expiresIn: '7d' });
             return res.json({ message: 'Demo Mode: Login successful (No DB)', user: mockUser, token, isMock: true });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
