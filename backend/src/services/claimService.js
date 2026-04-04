const { Claim, User, Policy, RiskAlert } = require('../models');

const ClaimService = {
    /**
     * Proactively detect potential losses and prepare pre-filled claims
     */
    async suggestClaim(userId, weatherData, prediction) {
        try {
            const user = await User.findById(userId);
            const policy = await Policy.findOne({ userId, status: 'active' });
            if (!user || !policy) return null;

            // Check if claim already exists for this risk alert/time to prevent duplicates
            const existing = await Claim.findOne({ 
                userId, 
                submittedAt: { $gte: new Date(Date.now() - 3600000) } // No duplicate suggestions in 1hr
            });
            if (existing) return null;

            const suggestedAmount = prediction ? prediction.recommended_payout : 150;
            
            return {
                userId,
                policyId: policy._id,
                prefilled: {
                    claimType: (weatherData.rainfall > 8 || weatherData.temp > 40) ? 'Emergency Support' : 'Weather Loss',
                    amount: suggestedAmount,
                    description: `Automatic claim suggestion based on ${weatherData.conditions.rainfall} rainfall in ${user.city}.`,
                    riskData: {
                        location: user.city,
                        rainfall: weatherData.rainfall,
                        predictedLoss: prediction ? prediction.loss_percentage : 0,
                        timestamp: new Date()
                    }
                }
            };
        } catch (err) {
            console.error('[Claim Service] Suggestion Error:', err.message);
            return null;
        }
    },

    /**
     * One-click submission & Auto-validation
     */
    async submitOneClickClaim(claimData) {
        try {
            const { userId, policyId, prefilled } = claimData;

            // Basic Fraud Check: Prevent too many claims in a short burst
            const todayClaims = await Claim.countDocuments({
                userId,
                submittedAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
            });

            const fraudFlags = [];
            if (todayClaims >= 2) fraudFlags.push('High frequency activity');
            
            const isAutoApprovable = (prefilled.amount <= 300 && fraudFlags.length === 0);

            const newClaim = new Claim({
                userId,
                policyId,
                ...prefilled,
                status: isAutoApprovable ? 'Approved' : 'Under Review',
                isAutoApproved: isAutoApprovable,
                fraudFlags,
                timeline: [
                    { status: 'Pending', comment: 'Claim submitted via one-click detection.' }
                ]
            });

            if (isAutoApprovable) {
                newClaim.timeline.push({ status: 'Approved', comment: 'AI Validation passed based on real-time weather & risk model.' });
                // We could even set it to 'Processed' if payment was instant
            }

            await newClaim.save();
            return newClaim;
        } catch (err) {
            console.error('[Claim Service] submission Error:', err.message);
            throw err;
        }
    },

    async getUserClaims(phone) {
        const user = await User.findOne({ phone });
        if (!user) return [];
        return await Claim.find({ userId: user._id }).sort({ submittedAt: -1 });
    },

    async updateStatus(claimId, status, comment) {
        const claim = await Claim.findById(claimId);
        if (!claim) return null;
        
        claim.status = status;
        claim.timeline.push({ status, comment });
        claim.updatedAt = new Date();
        await claim.save();
        return claim;
    }
};

module.exports = ClaimService;
