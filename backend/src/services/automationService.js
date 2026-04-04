const { Policy, User } = require('../models');
const PolicyService = require('./policyService');

/**
 * Automation Service (MongoDB version)
 */
const simulateWeeklyCycle = () => {
    console.log('[AUTOMATION] Starting weekly cycle processing...');
    const workerCount = 4520;
    const premiumAmount = 99; 
    const totalDeducted = workerCount * premiumAmount;

    console.log(`[AUTOMATION] Deducted premium from ${workerCount} workers. Total: ₹${totalDeducted}`);
    console.log('[AUTOMATION] Updating risk models with historical data...');
};

const checkPolicyExpiries = async () => {
    console.log('[AUTOMATION] Checking policy expiries in MongoDB...');
    try {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Smart Reminders (< 24h)
        const expiringSoon = await Policy.find({
            status: 'active',
            endDate: { $lte: tomorrow, $gt: now }
        }).populate('userId');

        expiringSoon.forEach(p => {
            if (p.userId) {
                console.log(`[SMART REMINDER] Alerting ${p.userId.name} (${p.userId.phone}): Your ${p.coverageTier} policy expires soon!`);
            }
        });

        // 2. Auto-Renewals
        const toRenew = await Policy.find({
            status: 'active',
            endDate: { $lte: now },
            autoRenew: true
        }).populate('userId');

        for (const p of toRenew) {
            if (p.userId) {
                console.log(`[AUTO-RENEW] Renewing policy for ${p.userId.phone}...`);
                p.status = 'expired';
                p.updatedAt = Date.now();
                await p.save();
                
                await PolicyService.createInitialPolicy(p.userId.phone, p.coverageTier);
            }
        }

        // 3. Simple Expiry (without auto-renew)
        await Policy.updateMany(
            { status: 'active', endDate: { $lte: now }, autoRenew: false },
            { $set: { status: 'expired', updatedAt: Date.now() } }
        );

    } catch (err) {
        console.error('[AUTOMATION ERROR] MongoDB Expiry Check Failed:', err.message);
    }
};

const initAutomation = () => {
    simulateWeeklyCycle();
    setInterval(simulateWeeklyCycle, 5 * 60 * 1000);
    
    checkPolicyExpiries();
    setInterval(checkPolicyExpiries, 60 * 1000);
};

module.exports = { initAutomation };
