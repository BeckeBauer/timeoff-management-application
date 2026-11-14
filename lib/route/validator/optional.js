'use strict';

const validator = require('validator');

module.exports = {
  isNumeric: value => typeof value === 'string' && validator.isNumeric(value),
  isDate: value => typeof value === 'string' && validator.isDate(value),
  isInt: value => typeof value === 'string' && validator.isInt(value),
  trim: value => typeof value === 'string' ? validator.trim(value) : '',
  toInt: value => typeof value === 'string' && validator.isInt(value)
    ? validator.toInt(value)
    : null,
  toBoolean: value => typeof value === 'string' && validator.toBoolean(value),
};
