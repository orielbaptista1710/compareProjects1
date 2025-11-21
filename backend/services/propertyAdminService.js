const Property = require('../models/Property');

exports.fetchProperties = async ({ page = 1, limit = 20, status, city, state, propertyType, search }) => {
  const skip = (page - 1) * limit;
  const filter = {};

  if (status) filter.status = status;
  if (city) filter.city = city;
  if (state) filter.state = state;
  if (propertyType) filter.propertyType = propertyType;
  if (search && search.length <= 50) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { developerName: { $regex: search, $options: 'i' } },
      { locality: { $exists: true, $regex: search, $options: 'i' } },
    ];
  }

  const LIST_PROJECTION = {
    title: 1,
    developerName: 1,
    price: 1,
    state: 1,
    city: 1,
    locality: 1,
    status: 1,
    submittedAt: 1,
    reviewedAt: 1,
    reviewedBy: 1,
    'coverImage.url': 1,
    'coverImage.thumbnail': 1,
    userId: 1,
  };

  const [total, properties] = await Promise.all([
    Property.countDocuments(filter),
    Property.find(filter)
      .select(LIST_PROJECTION)
      .populate('userId', 'displayName')
      .populate('reviewedBy', 'displayName')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { data: properties, total };
};

exports.updatePropertyStatus = async (id, status, adminId, rejectionReason = null) => {
  const update = {
    status,
    reviewedBy: adminId,
    reviewedAt: Date.now(),
  };

  if (status === 'rejected') update.rejectionReason = rejectionReason;

  const property = await Property.findByIdAndUpdate(id, update, { new: true });

  if (!property) throw new Error('Property not found');

  return property;
};
