const Joi = require('joi');

const validateStudent = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().min(1).max(255),
    email: Joi.string().email().required(),
    studentId: Joi.string().required().min(1).max(50),
    maxBooksAllowed: Joi.number().integer().min(1).max(20).default(5),
  });

  return schema.validate(data);
};

module.exports = { validateStudent };


