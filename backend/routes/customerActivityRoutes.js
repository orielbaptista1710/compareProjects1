const express = require('express');
const protectCustomer = require('../middleware/protectCustomer');
const Customer = require('../models/Customer');
const Property = require('../models/Property');

const router = express.Router();

// Toggle save property
router.post('/toggle-save/:propertyId', protectCustomer, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const customer = req.customer;

    const isHeart = customer.heartProperties.includes(propertyId);
    if (isHeart) customer.heartProperties.pull(propertyId);
    else customer.heartProperties.push(propertyId);

    await customer.save();
    res.json({ success: true, heartProperties: customer.heartProperties });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});




// Get all customer’s properties
router.get('/my-properties', protectCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id)
      .populate('heartProperties')
      .populate('comparedProperties')
      .populate('shortlistedProperties');

    res.json({
      success: true,
      heartProperties: customer.heartProperties,
      comparedProperties: customer.comparedProperties,
      shortlistedProperties: customer.shortlistedProperties,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
