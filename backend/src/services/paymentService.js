const Razorpay = require('razorpay');
const { User, Claim, Payout } = require('../models');

class PaymentService {
    constructor() {
        // Initialize with test keys if available, otherwise use placeholders for simulation
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
        });
    }

    /**
     * Trigger a Payout (Parametric Settlement)
     */
    async processPayout(claimId) {
        console.log(`[PAYMENT] Starting payout processing for claim: ${claimId}`);
        
        try {
            const claim = await Claim.findById(claimId).populate('userId');
            if (!claim) throw new Error('Claim not found');

            const user = claim.userId;
            
            // 1. Mark as Pending
            claim.payoutStatus = 'Pending';
            claim.timeline.push({ status: 'Processing Payout', comment: 'Initiating transfer via Razorpay Sandbox' });
            await claim.save();

            // 2. Simulate Razorpay/Stripe API Call
            // For hackathon/demo purposes, we simulate a successful transaction 90% of the time
            const isSimulationSuccess = Math.random() < 0.9;
            
            if (isSimulationSuccess) {
                const payoutId = 'pay_' + Math.random().toString(36).substr(2, 9);
                
                // 3. Update Domain Models
                claim.payoutStatus = 'Success';
                claim.payoutId = payoutId;
                claim.status = 'Processed';
                claim.timeline.push({ status: 'Payout Success', comment: `Transferred ₹${claim.amount} to worker's wallet.` });
                
                // Update Wallet Balance
                user.walletBalance += claim.amount;
                await user.save();
                
                // Log Historical Payout
                await new Payout({
                    userId: user._id,
                    amount: claim.amount,
                    city: user.city,
                    reason: `Weather Loss Payout: ${claim.description}`,
                    payoutId: payoutId
                }).save();

                await claim.save();

                console.log(`✅ [PAYMENT SUCCESS] Worker ${user.phone} received ₹${claim.amount}`);
                return { success: true, payoutId };
            } else {
                // 4. Handle Failure & Retries
                claim.payoutStatus = 'Failed';
                claim.timeline.push({ status: 'Payout Failed', comment: 'Bank gateway timeout. Will retry in 10 minutes.' });
                await claim.save();
                
                console.error(`❌ [PAYMENT FAILED] Payout for claim ${claimId} failed simulation.`);
                return { success: false, error: 'Simulation Failure' };
            }
        } catch (err) {
            console.error('[PAYMENT ERROR]', err.message);
            throw err;
        }
    }
}

module.exports = new PaymentService();
