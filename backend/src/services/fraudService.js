const UAParser = require('ua-parser-js');
const { WeatherPrediction, Claim, User } = require('../models');

class FraudService {
    /**
     * Generate a device fingerprint from the request headers
     */
    getFingerprint(req) {
        const parser = new UAParser(req.headers['user-agent']);
        const result = parser.getResult();
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // Simple string fingerprint for simulation
        return `${result.browser.name}-${result.os.name}-${result.device.vendor || 'PC'}-${ip}`;
    }

    /**
     * Extensive Trust Check (MTS+)
     */
    async calculateFraudScore(userId, claimData, req) {
        let score = 0;
        const flags = [];
        const fingerprint = this.getFingerprint(req);
        
        const user = await User.findById(userId);
        if (!user) return { score: 100, flags: ['User not found'] };

        // 1. Device Fingerprinting Check
        if (user.lastFingerprint && user.lastFingerprint !== fingerprint) {
            score += 25;
            flags.push('Device/Browser change detected');
        }

        // 2. Multi-Account Detection
        const sameDeviceUsers = await User.countDocuments({ 
            lastFingerprint: fingerprint, 
            _id: { $ne: userId } 
        });
        if (sameDeviceUsers > 0) {
            score += 40;
            flags.push(`${sameDeviceUsers} other accounts linked to this device`);
        }

        // 3. Velocity Check (Claims per hour)
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentClaims = await Claim.countDocuments({ 
            userId, 
            submittedAt: { $gte: hourAgo } 
        });
        if (recentClaims > 2) {
            score += 30;
            flags.push('High frequency of claim attempts (Velocity Alert)');
        }

        // 4. Historical Pattern Detection
        const allClaims = await Claim.find({ userId }).sort({ submittedAt: -1 }).limit(10);
        const rejectedClaims = allClaims.filter(c => c.status === 'Rejected').length;
        if (rejectedClaims > 3) {
            score += 20;
            flags.push('Persistent rejection history');
        }

        // 5. Simulated ML Cross-Check (Would call Python service here)
        // For hackathon completeness, we simulate a 10% random noise
        const randomAnomaly = Math.random() < 0.1;
        if (randomAnomaly) {
            score += 15;
            flags.push('Anomalous movement signature detected by MTS');
        }

        // Update user state
        user.lastFingerprint = fingerprint;
        await user.save();

        return {
            score: Math.min(score, 100),
            flags,
            fingerprint
        };
    }
}

module.exports = new FraudService();
