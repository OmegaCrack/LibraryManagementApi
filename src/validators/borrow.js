const Joi = require('joi');

const validateBorrow = (data) => {
  const schema = Joi.object({
    studentId: Joi.number().integer().required(),
    bookId: Joi.number().integer().required(),
  });

  return schema.validate(data);
};

const validateReturn = (data) => {
  const schema = Joi.object({
    borrowId: Joi.number().integer().required(),
  });

  return schema.validate(data);
};

module.exports = { validateBorrow, validateReturn };
