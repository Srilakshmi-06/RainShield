const express = require('express');
const router = express.Router();

// Payout = Avg Daily Earnings × Affected Days × Coverage %
router.post('/calculate', (req, res) => {
    const { avgDailyEarnings, affectedDays, coveragePercent } = req.body;

    if (!avgDailyEarnings || !affectedDays || !coveragePercent) {
        return res.status(400).json({ error: 'Missing calculation parameters' });
    }

    const payoutAmount = avgDailyEarnings * affectedDays * (coveragePercent / 100);

    res.json({
        calculation: {
            avgDailyEarnings,
            affectedDays,
            coveragePercent,
            totalPayout: payoutAmount
        },
        status: 'Calculated',
        nextStep: 'Fraud Validation'
    });
});

router.post('/trigger-payout', (req, res) => {
    const { workerId, payoutAmount, reason } = req.body;

    // In a real app, this would integrate with Razorpay/UPI
    console.log(`[PAYOUT] Triggered ₹${payoutAmount} for Worker ${workerId}. Reason: ${reason}`);

    res.json({
        payoutId: 'PAY_' + Math.floor(Math.random() * 1000000),
        status: 'Processing',
        estimatedArrival: '2 hours'
    });
});

module.exports = router;
