const { Claim, User, Policy, RiskAlert } = require('../models');
const FraudService = require('./fraudService');
const PaymentService = require('./paymentService');

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

            // CHECK WEEKLY PREMIUM STATUS
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
            const isPremiumPastDue = (Date.now() - new Date(policy.lastPremiumPaidDate).getTime()) > sevenDaysInMs;
            
            if (isPremiumPastDue) {
                console.log(`[Claim Service] Suggestion blocked for ${userId} - Premium Overdue.`);
                return null;
            }

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
    async submitOneClickClaim(claimData, req) {
        try {
            const { userId, policyId, prefilled } = claimData;

            const policy = await Policy.findById(policyId);
            if (!policy) throw new Error("Active policy not found.");

            // CHECK WEEKLY PREMIUM STATUS
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
            const isPremiumPastDue = (Date.now() - new Date(policy.lastPremiumPaidDate).getTime()) > sevenDaysInMs;
            
            if (isPremiumPastDue) {
                throw new Error("Payout blocked: Weekly premium is overdue. Please pay to re-activate protection.");
            }

            // 1. ADVANCED FRAUD DETECTION (MTS+)
            const fraudResult = await FraudService.calculateFraudScore(userId, prefilled, req);
            
            const isAutoApprovable = (prefilled.amount <= 1000 && fraudResult.score < 60);

            const newClaim = new Claim({
                userId,
                policyId,
                ...prefilled,
                status: isAutoApprovable ? 'Approved' : 'Under Review',
                isAutoApproved: isAutoApprovable,
                fraudFlags: fraudResult.flags,
                fraudScore: fraudResult.score,
                deviceFingerprint: fraudResult.fingerprint,
                timeline: [
                    { status: 'Pending', comment: 'Claim submitted via one-click detection.' }
                ]
            });

            if (isAutoApprovable) {
                newClaim.timeline.push({ status: 'Approved', comment: 'AI Validation passed based on real-time weather & risk model.' });
                
                // 2. INSTANT PAYOUT SYSTEM
                // We fire and forget or await depending on flow. For demo, we await.
                await newClaim.save(); // Save first to get ID
                await PaymentService.processPayout(newClaim._id);
                
                // Reload claim to get updated status/payoutId
                return await Claim.findById(newClaim._id);
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

        // Trigger payout if manually approved by Admin
        if (status === 'Approved' && claim.payoutStatus === 'None') {
            await PaymentService.processPayout(claimId);
            return await Claim.findById(claimId);
        }

        return claim;
    }
};

module.exports = ClaimService;
