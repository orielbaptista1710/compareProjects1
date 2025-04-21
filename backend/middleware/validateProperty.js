const Joi = require('joi');

const propertySchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  location: Joi.string().required(),
  city: Joi.string().required(),
  // Add all other required fields
});

module.exports = (req, res, next) => {
  const { error } = propertySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: 'Validation error',
      details: error.details 
    });
  }
  next();
};