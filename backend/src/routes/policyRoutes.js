const express = require('express');
const router = express.Router();
const PolicyService = require('../services/policyService');

// 1. Fetch all policies for current user
router.get('/:phone', async (req, res) => {
    const { phone } = req.params;
    try {
        const policies = await PolicyService.getUserPolicies(phone);
        const analytics = await PolicyService.getUserAnalytics(phone);
        res.json({ success: true, policies, analytics });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch policy history' });
    }
});

// 2. Upgrade/Downgrade Policy Tier
router.put('/tier/:policyId', async (req, res) => {
    const { policyId } = req.params;
    const { tier } = req.body;
    try {
        const policy = await PolicyService.updateTier(policyId, tier);
        res.json({ success: true, policy, message: `Successfully changed to ${tier} tier!` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update policy tier' });
    }
});

// 3. Toggle Auto-Renew
router.put('/auto-renew/:policyId', async (req, res) => {
    const { policyId } = req.params;
    const { autoRenew } = req.body;
    try {
        const policy = await PolicyService.toggleAutoRenew(policyId, autoRenew);
        res.json({ success: true, policy, message: `Auto-renewal: ${autoRenew ? 'ON' : 'OFF'}` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update auto-renewal' });
    }
});

// 4. Activation
router.post('/activate', async (req, res) => {
    const { phone, tier } = req.body;
    try {
        const policy = await PolicyService.createInitialPolicy(phone, tier);
        res.json({ success: true, policy, message: 'Policy activated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Activation failed: ' + err.message });
    }
});

// 5. Pay Weekly Premium
router.post('/pay-premium/:policyId', async (req, res) => {
    const { policyId } = req.params;
    try {
        const policy = await PolicyService.payWeeklyPremium(policyId);
        if (!policy) return res.status(404).json({ error: 'Policy not found' });
        res.json({ success: true, policy, message: 'Weekly premium paid! Protection is active.' });
    } catch (err) {
        res.status(500).json({ error: 'Payment failed: ' + err.message });
    }
});

module.exports = router;
