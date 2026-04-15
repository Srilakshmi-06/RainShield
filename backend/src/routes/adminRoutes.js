const express = require('express');
const router = express.Router();
const { User, Claim, Policy, Payout } = require('../models');

/**
 * Get Global Platform Stats for Admin Dashboard
 */
router.get('/stats', async (req, res) => {
    try {
        const totalWorkers = await User.countDocuments({ role: 'worker' });
        const totalClaims = await Claim.countDocuments();
        const activePolicies = await Policy.countDocuments({ status: 'active' });
        const totalPayouts = await Payout.countDocuments();
        
        // Sum total payout amount
        const payouts = await Payout.find();
        const totalPayoutAmount = payouts.reduce((sum, p) => sum + p.amount, 0);

        // Get recent activity (last 5 claims)
        const recentClaims = await Claim.find()
            .populate('userId', 'name phone')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get city distribution
        const users = await User.find({ role: 'worker' });
        const cityStats = users.reduce((acc, u) => {
            acc[u.city] = (acc[u.city] || 0) + 1;
            return acc;
        }, {});

        res.json({
            success: true,
            stats: {
                totalWorkers,
                totalClaims,
                activePolicies,
                totalPayouts,
                totalPayoutAmount,
                cityStats
            },
            recentActivity: recentClaims
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
