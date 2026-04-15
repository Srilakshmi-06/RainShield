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
     * Trigger a Payout (Parametric Settlement via UPI)
     */
    async processPayout(claimId) {
        console.log(`[PAYMENT] Starting UPI payout processing for claim: ${claimId}`);
        
        try {
            const claim = await Claim.findById(claimId).populate('userId');
            if (!claim) throw new Error('Claim not found');

            const user = claim.userId;
            const upiHandle = user.phone + '@okaxis'; // Simulated UPI ID
            
            // 1. Mark as Pending & Validate UPI
            claim.payoutStatus = 'Pending';
            claim.timeline.push({ 
                status: 'Processing UPI', 
                comment: `Validating VPA: ${upiHandle} via NPCI sandbox...` 
            });
            await claim.save();

            // 2. Simulate Delay for Gateway response
            await new Promise(r => setTimeout(r, 1500)); // Realism

            // 3. Simulate Razorpay/UPI Gateway API Call
            const isSimulationSuccess = Math.random() < 0.95; // High success rate for UPI
            
            if (isSimulationSuccess) {
                const payoutId = 'upi_txn_' + Math.random().toString(36).substr(2, 12).toUpperCase();
                
                // 4. Update Domain Models
                claim.payoutStatus = 'Success';
                claim.payoutId = payoutId;
                claim.status = 'Processed';
                claim.timeline.push({ 
                    status: 'UPI Payout Success', 
                    comment: `Sent ₹${claim.amount} to UPI ID: ${upiHandle}. Txn ID: ${payoutId}` 
                });
                
                // Update Wallet Balance (for local tracking)
                user.walletBalance += claim.amount;
                await user.save();
                
                // Log Historical Payout
                await new Payout({
                    userId: user._id,
                    amount: claim.amount,
                    city: user.city,
                    reason: `UPI Parametric Pay: ${claim.description}`,
                    payoutId: payoutId
                }).save();

                await claim.save();

                console.log(`✅ [UPI SUCCESS] Worker ${user.phone} received ₹${claim.amount} via UPI`);
                return { success: true, payoutId, upi: upiHandle };
            } else {
                // 5. Handle Failure (Simulate NPCI reject)
                claim.payoutStatus = 'Failed';
                claim.timeline.push({ 
                    status: 'UPI Failed', 
                    comment: 'NPCI: Insufficient Balance in Escrow or VPA Not Reachable.' 
                });
                await claim.save();
                
                console.error(`❌ [UPI FAILED] Payout for claim ${claimId} failed simulation.`);
                return { success: false, error: 'UPI Sandbox Failure' };
            }
        } catch (err) {
            console.error('[PAYMENT ERROR]', err.message);
            throw err;
        }
    }
}

module.exports = new PaymentService();
