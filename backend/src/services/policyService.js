const { Policy, User, Payout, PremiumHistory } = require('../models');

/**
 * Service to manage intelligent insurance policies in MongoDB
 */
const PolicyService = {
  // 1. Create initial policy upon signup or manual trigger
  async createInitialPolicy(phone, tier = 'standard') {
    try {
      const user = await User.findOne({ phone });
      if (!user) return null;
      
      const basePremium = tier === 'premium' ? 500 : (tier === 'standard' ? 300 : 150);
      const payoutLimit = tier === 'premium' ? 10000 : (tier === 'standard' ? 5000 : 2000);
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const riskInsights = {
        breakdown: { base: basePremium, environmental_load: 0, final: basePremium },
        factors: ['Initial enrollment', 'Baseline risk set'],
        payoutScenarios: { flood: payoutLimit * 0.8, health: payoutLimit * 0.5, accident: payoutLimit },
        explanation: "Baseline policy set for initial protection."
      };

      const newPolicy = new Policy({
        userId: user._id,
        coverageTier: tier,
        startDate,
        endDate,
        premiumAmount: basePremium,
        currentPremium: basePremium,
        payoutLimit,
        status: 'active',
        autoRenew: true,
        riskLevel: 'Low',
        riskInsights
      });
      
      await newPolicy.save();
      return { ...newPolicy.toObject(), id: newPolicy._id };
    } catch (err) {
      console.error('[MongoDB Policy Service] Create Policy Error:', err.message);
      return null;
    }
  },

  // 2. Fetch all policies for a user
  async getUserPolicies(phone) {
    try {
      const user = await User.findOne({ phone });
      if (!user) return [];

      const policies = await Policy.find({ userId: user._id }).sort({ startDate: -1 });
      
      const processed = policies.map(p => {
        const now = new Date();
        const end = new Date(p.endDate);
        const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
        
        let statusDisplay = p.status;
        if (p.status === 'active' && daysRemaining <= 7 && daysRemaining > 0) statusDisplay = 'Expiring Soon';
        if (p.status === 'active' && daysRemaining <= 0) statusDisplay = 'Expired';
        
        return { ...p.toObject(), id: p._id, statusDisplay, daysRemaining };
      });

      return processed;
    } catch (err) {
      console.error('[MongoDB Policy Service] Fetch Policies Error:', err.message);
      return [];
    }
  },

  // 3. Upgrade or Downgrade Policy Tier
  async updateTier(policyId, newTier) {
    try {
      const basePremium = newTier === 'premium' ? 500 : (newTier === 'standard' ? 300 : 150);
      const payoutLimit = newTier === 'premium' ? 10000 : (newTier === 'standard' ? 5000 : 2000);
      
      const updated = await Policy.findByIdAndUpdate(policyId, {
        coverageTier: newTier,
        premiumAmount: basePremium,
        currentPremium: basePremium,
        payoutLimit,
        updatedAt: Date.now()
      }, { new: true });
      
      if (updated) {
        // Synchronize the User document's tier for the dashboard and profile
        await User.findByIdAndUpdate(updated.userId, { tier: newTier });
      }
      
      return updated ? { ...updated.toObject(), id: updated._id } : null;
    } catch (err) {
      console.error('[MongoDB Policy Service] Update Tier Error:', err.message);
      return null;
    }
  },

  // 4. AI-Driven Adjustment based on risk level
  async adjustWithRiskInsights(phone, weatherData, prediction) {
    const { calculateDynamicPremium } = require('./mlService');
    try {
      const user = await User.findOne({ phone });
      if (!user) return null;

      const policy = await Policy.findOne({ userId: user._id, status: 'active' });
      if (!policy) return null;

      const calculation = calculateDynamicPremium(policy.premiumAmount, weatherData, user, prediction);

      // Log to Historical Audit Layer if premium changed
      if (parseFloat(policy.currentPremium) !== calculation.final) {
        const history = new PremiumHistory({
          policyId: policy._id,
          userId: user._id,
          previousPremium: policy.currentPremium,
          newPremium: calculation.final,
          changeReason: calculation.explanation,
          breakdown: calculation.breakdown
        });
        await history.save();
      }

      policy.currentPremium = calculation.final;
      policy.riskLevel = prediction ? prediction.risk_level : 'Low';
      policy.riskInsights = {
        breakdown: calculation.breakdown,
        factors: calculation.explanation.split(' because of ')[1]?.split(', ') || ['Stable conditions'],
        payoutScenarios: {
          flood: policy.payoutLimit * (weatherData.rainfall > 10 ? 0.9 : 0.8),
          health: policy.payoutLimit * (weatherData.temp > 35 ? 0.7 : 0.5),
          accident: policy.payoutLimit
        },
        explanation: calculation.explanation
      };
      policy.updatedAt = Date.now();
      
      await policy.save();
      return { ...policy.toObject(), id: policy._id };
    } catch (err) {
      console.error('[MongoDB Policy Service] Risk Adjustment Error:', err.message);
      return null;
    }
  },

  // 5. Toggle Auto-Renew
  async toggleAutoRenew(policyId, autoRenew) {
    try {
      const updated = await Policy.findByIdAndUpdate(policyId, { autoRenew, updatedAt: Date.now() }, { new: true });
      return updated ? { ...updated.toObject(), id: updated._id } : null;
    } catch (err) {
        return null;
    }
  },

  // 6. Analytics: Total premiums/claims for user dashboard
  async getUserAnalytics(phone) {
    try {
      const user = await User.findOne({ phone });
      if (!user) return { total_premiums_paid: 0, policies_count: 0, total_payouts_received: 0 };

      const policies = await Policy.find({ userId: user._id });
      const payouts = await Payout.find({ userId: user._id });

      const totalPremiums = policies.reduce((sum, p) => sum + (parseFloat(p.currentPremium) || 0), 0);
      const totalPayouts = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        total_premiums_paid: totalPremiums,
        policies_count: policies.length,
        total_payouts_received: totalPayouts
      };
    } catch (err) {
      return { total_premiums_paid: 0, policies_count: 0, total_payouts_received: 0 };
    }
  }
};

module.exports = PolicyService;
