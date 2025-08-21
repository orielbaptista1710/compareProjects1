const express = require('express');
const router = express.Router();

// Contact form submission
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, propertyType, budget, state, city, locality, message } = req.body;

    // Simple validation
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, Email, and Phone are required' });
    }

    console.log('Form Data Received:', req.body);

    // You can add database saving logic here if needed.
    res.status(200).json({ message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error in contact form submission:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
