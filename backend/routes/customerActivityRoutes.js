//routes/customerActivityRoutes.js
import express from 'express';
import mongoose from 'mongoose';
const router = express.Router();

import protectCustomer from '../middleware/protectCustomer.js';
import Customer from '../models/Customer.js';
// import Property from '../models/Property.js'; 

router.get('/my-activity', protectCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id)
      .populate({
        path: 'heartProperties',
        select: 'title price coverImage locality city propertyType bhk', // only what PropertyCard needs
      })
      .lean(); // IMPORTANT

      // .populate('comparedProperties')
      // .populate('shortlistedProperties');

    res.json({
      success: true,
      heartProperties: customer.heartProperties,
      // comparedProperties: customer.comparedProperties,
      // shortlistedProperties: customer.shortlistedProperties,
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle save property
router.post('/toggle-save/:propertyId', protectCustomer, async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    // Check if already hearted using the ID from middleware
    const existing = await Customer.findOne({
      _id: req.customer._id,
      heartProperties: propertyId,
    });

    const update = existing
      ? { $pull: { heartProperties: propertyId } }
      : { $addToSet: { heartProperties: propertyId } };  // $addToSet prevents duplicates

    const updated = await Customer.findByIdAndUpdate(
      req.customer._id,
      update,
      { new: true }
    ).populate('heartProperties');

    res.json({
      success: true,
      isHearted: !existing,
      heartProperties: updated.heartProperties,
    });

  } catch (err) {
    console.error('Toggle heart error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



export default router;
