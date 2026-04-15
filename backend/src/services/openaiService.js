const OpenAI = require("openai");
const policyKnowledge = require('../config/policyKnowledge.json');

class OpenAIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async generateResponse(userMessage, userContext = {}) {
        try {
            console.log(`[OPENAI] Processing: "${userMessage}"`);

            const systemPrompt = `
You are the RainShield AI Assistant. RainShield is a parametric insurance platform for gig workers.
Your goal is to help workers understand their policies, claims, and weather-related payouts.

CONTEXT:
${JSON.stringify(policyKnowledge, null, 2)}

USER INFO:
- Name: ${userContext.name || 'Worker'}
- Current Tier: ${userContext.tier || 'Basic'}
- City: ${userContext.city || 'Unknown'}

RULES:
1. Be professional, empathetic, and concise.
2. ALWAYS respond in the same language as the user's message (e.g., if they ask in Hindi, respond in Hindi).
3. If they ask about payout eligibility, explain the parametric triggers (10mm rain / 42C heat).
4. If you don't know the answer, ask them to check the dashboard or contact support.
5. Do not make up info not in the context.
`;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo", // Highly compatible model
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.7,
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('[OPENAI ERROR]', error);
            const errorMsg = error.response?.data?.error?.message || error.message;
            return `I'm having a bit of trouble connecting to my brain right now (Error: ${errorMsg}). Please try again later.`;
        }
    }
}

module.exports = new OpenAIService();
