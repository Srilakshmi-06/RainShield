const express = require('express');
const router = express.Router();

// Mock OTP storage
const otpStore = {};

router.post('/send-otp', (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phone] = otp;

    // Log to console for demo
    console.log(`\n-----------------------------------------`);
    console.log(`[AUTH SERVICE] VERIFICATION OTP: ${otp}`);
    console.log(`[AUTH SERVICE] FOR PHONE: ${phone}`);
    console.log(`-----------------------------------------\n`);

    res.json({ 
        message: 'Demo Mode: OTP sent! Check the backend terminal/console.', 
        debugOtp: otp,
        status: 'mock'
    });
});

router.post('/verify-otp', (req, res) => {
    const { phone, otp } = req.body;
    
    // Master Bypass for Demo (000000)
    if (otp === '000000') {
        return res.json({ success: true, message: 'OTP verified (Master Bypass)' });
    }

    if (otpStore[phone] && otpStore[phone] === otp) {
        delete otpStore[phone]; // Clear after use
        return res.json({ success: true, message: 'OTP verified' });
    }
    
    res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
});

const { User } = require('../models');

router.post('/signup', async (req, res) => {
    try {
        const { phone, name, city, platform, avgDailyEarnings, tier } = req.body;
        
        if(!phone || !name) {
            return res.status(400).json({ error: 'Phone and Name are required' });
        }

        // Check if user already exists
        let user = await User.findOne({ phone });
        if (user) {
            return res.status(400).json({ error: 'User already registered. Please login.' });
        }

        user = new User({
            phone,
            name,
            city,
            platform,
            avgDailyEarnings,
            tier: tier || 'standard',
            role: phone === '999' ? 'admin' : 'worker' // Demo override
        });

        await user.save();
        console.log(`[DB] NEW USER REGISTERED: ${name} (${phone})`);

        res.status(201).json({ 
            message: 'Worker registered successfully in MongoDB',
            user: user
        });
    } catch (err) {
        res.status(500).json({ error: 'Database Error: ' + err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        
        // Demo Master Password or Phone match
        let user = await User.findOne({ phone });
        
        if (!user && phone === '999' && password === 'admin') {
            // Auto-create admin if missing
            user = new User({ phone: '999', name: 'System Admin', role: 'admin' });
            await user.save();
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found. Please sign up.' });
        }

        res.json({ 
            message: 'Login successful',
            user: user
        });
    } catch (err) {
        res.status(500).json({ error: 'Login Error' });
    }
});

module.exports = router;
