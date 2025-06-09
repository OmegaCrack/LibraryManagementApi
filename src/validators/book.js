const Joi = require('joi');

const validateBook = (data) => {
  const schema = Joi.object({
    title: Joi.string().required().min(1).max(255),
    author: Joi.string().required().min(1).max(255),
    isbn: Joi.string()
      .required()
      .pattern(
        /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/
      ),
    category: Joi.string().required().min(1).max(100),
    totalCopies: Joi.number().integer().min(1).required(),
  });

  return schema.validate(data);
};

const validateBookUpdate = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(1).max(255),
    author: Joi.string().min(1).max(255),
    category: Joi.string().min(1).max(100),
    totalCopies: Joi.number().integer().min(1),
  });

  return schema.validate(data);
};

module.exports = { validateBook, validateBookUpdate };
