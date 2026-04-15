const express = require('express');
const router = express.Router();
const openaiService = require('../services/openaiService');

/**
 * @route POST /api/chat/message
 * @desc Get response from Gemini AI chatbot
 */
router.post('/message', async (req, res) => {
    console.log('[DEBUG] Chat message received:', req.body.message);
    const { sender, message, userContext } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        const aiResponse = await openaiService.generateResponse(message, userContext || {});
        // Return in a format similar to what we planned for compatibility
        res.json({ responses: [{ text: aiResponse }] });
    } catch (error) {
        console.error('Chat Route Error:', error);
        res.status(500).json({ error: "Chat processing failed" });
    }
});

module.exports = router;
