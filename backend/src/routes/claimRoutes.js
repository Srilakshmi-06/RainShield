const express = require('express');
const router = express.Router();
const ClaimService = require('../services/claimService');

// Fetch claims for a user
router.get('/:phone', async (req, res) => {
    try {
        const claims = await ClaimService.getUserClaims(req.params.phone);
        res.json({ success: true, claims });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch claims' });
    }
});

// Submit a one-click claim (pre-processed suggestions)
router.post('/one-click', async (req, res) => {
    const { userId, policyId, prefilled } = req.body;
    try {
        const claim = await ClaimService.submitOneClickClaim({ userId, policyId, prefilled });
        res.json({ success: true, claim, message: claim.isAutoApproved ? 'Claim Auto-Approved!' : 'Claim under AI review.' });
    } catch (err) {
        res.status(500).json({ error: 'Submission failed' });
    }
});

// Admin update status (for historical/manual flows)
router.put('/status/:claimId', async (req, res) => {
    const { status, comment } = req.body;
    try {
        const claim = await ClaimService.updateStatus(req.params.claimId, status, comment);
        res.json({ success: true, claim });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

module.exports = router;
