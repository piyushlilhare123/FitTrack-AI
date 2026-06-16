const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');

// @route   POST /api/newsletter/subscribe
// @desc    Subscribe an email address to the newsletter
// @access  Public
router.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide an email address.' });
  }

  try {
    // Check if already exists
    const existing = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This email is already subscribed.' });
    }

    // Save new subscriber
    const subscriber = new Subscriber({ email });
    await subscriber.save();

    return res.status(201).json({ success: true, message: 'Successfully subscribed!' });
  } catch (err) {
    console.error('Newsletter Error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

module.exports = router;
