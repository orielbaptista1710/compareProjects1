//routes/customerActivityRoutes.js
import express from 'express';
import mongoose from 'mongoose';
const router = express.Router();

import protectCustomer from '../middleware/protectCustomer.js';
import Customer from '../models/Customer.js';
import Property from '../models/Property.js';
import { customerActionLimiter } from '../middleware/rateLimiters.js';

router.use(customerActionLimiter);

const PROPERTY_CARD_FIELDS = 'title price coverImage locality city propertyType bhk';
const DEFAULT_HEART_PAGE_SIZE = 20;
const MAX_HEART_PAGE_SIZE = 50; // don't trust the client's ?heartLimit either

// Re-orders a $in query's results (Mongo doesn't preserve $in order) to match
// the customer's original array order, dropping any id that no longer
// resolves to a document (e.g. deleted properties).
function reorderByIds(ids, docs) {
  const byId = new Map(docs.map((doc) => [String(doc._id), doc]));
  return ids.map((id) => byId.get(String(id))).filter(Boolean);
}

router.get('/my-activity', protectCustomer, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.heartPage, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.heartLimit, 10) || DEFAULT_HEART_PAGE_SIZE, 1),
      MAX_HEART_PAGE_SIZE
    );

    // heartProperties/compareProperties on the customer doc are just ids —
    // reading them unpopulated is cheap and gives us the total count and the
    // page slice without ever fetching more Property docs than one page needs.
    const customer = await Customer.findById(req.customer._id)
      .select('heartProperties compareProperties')
      .lean();

    const allHeartIds = customer.heartProperties.map(String);
    const start = (page - 1) * limit;
    // const heartPageIds = customer.heartProperties; // TEMP: break pagination to verify the test catches it
    const heartPageIds = customer.heartProperties.slice(start, start + limit);

    const [heartDocs, compareDocs] = await Promise.all([
      Property.find({ _id: { $in: heartPageIds } }).select(PROPERTY_CARD_FIELDS).lean(),
      Property.find({ _id: { $in: customer.compareProperties } }).select(PROPERTY_CARD_FIELDS).lean(),
    ]);

    res.json({
      success: true,
      // Full, unpopulated id list — cheap, and used app-wide (e.g. the heart
      // icon on any property card) to know "is this property saved?" without
      // depending on which page of the Shortlist tab happens to be loaded.
      heartedIds: allHeartIds,
      // Only this page, fully populated — what the Shortlist tab renders.
      heartProperties: reorderByIds(heartPageIds, heartDocs),
      heartPagination: {
        page,
        limit,
        total: allHeartIds.length,
        hasMore: start + limit < allHeartIds.length,
      },
      compareProperties: reorderByIds(customer.compareProperties, compareDocs),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error-', error: err.message });
  }
});

// Generous wishlist cap — stops a scripted/abusive client from growing a
// customer document unbounded (heartProperties, unlike compareProperties,
// previously had no limit at all).
const MAX_HEART_PROPERTIES = 200;

// Toggle save property- favorite
router.post('/toggle-heart/:propertyId', protectCustomer, async (req, res) => {
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

    const updated = await Customer.findOneAndUpdate(
      {
        _id: req.customer._id,
        // Only enforced on the add path. Checked atomically in the same
        // query (rather than a separate read-then-write) so two concurrent
        // adds can't both slip past a plain length check.
        ...(existing ? {} : { $expr: { $lt: [{ $size: '$heartProperties' }, MAX_HEART_PROPERTIES] } }),
      },
      update,
      { new: true }
    ).select('heartProperties');

    if (!updated) {
      if (!existing) {
        return res.status(400).json({ message: `You can only save up to ${MAX_HEART_PROPERTIES} properties.` });
      }
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({
      success: true,
      isHearted: !existing,
      // Just ids, not populated — this fires on every heart-click anywhere in
      // the app, and all a caller needs is to update its "is this hearted?"
      // state, not a full property payload. The Shortlist tab gets full
      // property data from GET /my-activity instead.
      heartedIds: updated.heartProperties.map(String),
    });

  } catch (err) {
    console.error('Toggle heart error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Toggle save property- compare
// router.post('/toggle-compare/:propertyId', protectCustomer, async (req, res) => {
router.put('/compare', protectCustomer, async (req, res) => {
  try {
    const { propertyIds } = req.body;

    if (!Array.isArray(propertyIds)) {
      return res.status(400).json({ message: 'propertyIds must be an array' });
    }

    const validIds = propertyIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .slice(0, 4); // hard cap server-side, don't trust the client

    const updated = await Customer.findByIdAndUpdate(
      req.customer._id,
      { compareProperties: validIds }, // <-- matches schema field name
      { new: true, runValidators: true }
    ).populate({
      path: 'compareProperties',
      select: PROPERTY_CARD_FIELDS,
    });

    res.json({
      success: true,
      compareProperties: updated.compareProperties,
    });
  } catch (err) {
    console.error('Compare sync error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



export default router;
