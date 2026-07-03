const express = require('express');
const router = express.Router();
const emailService = require('../services/email.service');

// Test email endpoint
router.post('/test-email', async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({ success: false, error: 'Email address required' });
    }

    const result = await emailService.sendEmail({
      to,
      subject: '🎾 Test Email from StepOut2Play',
      html: `
        <h1>Test Email</h1>
        <p>If you received this, email is working!</p>
        <p>From: StepOut2Play</p>
      `,
      text: 'Test email from StepOut2Play. If you received this, email is working!'
    });

    res.json({
      success: true,
      message: 'Email sent successfully',
      result
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
});

module.exports = router;
