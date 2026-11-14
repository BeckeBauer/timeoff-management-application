'use strict';

const expect = require('chai').expect;
const optional_validators = require('../../../lib/route/validator/optional');

describe('Optional query validators', function(){
  it('rejects missing and non-string values without throwing', function(){
    expect(optional_validators.isNumeric(undefined)).to.equal(false);
    expect(optional_validators.isDate(undefined)).to.equal(false);
    expect(optional_validators.isInt(undefined)).to.equal(false);
    expect(optional_validators.isNumeric(['2026'])).to.equal(false);
    expect(optional_validators.isDate({year: '2026'})).to.equal(false);
    expect(optional_validators.trim(undefined)).to.equal('');
    expect(optional_validators.toInt(undefined)).to.equal(null);
    expect(optional_validators.toBoolean(undefined)).to.equal(false);
    expect(optional_validators.toBoolean(['true'])).to.equal(false);
  });

  it('validates string values', function(){
    expect(optional_validators.isNumeric('2026')).to.equal(true);
    expect(optional_validators.isDate('2026-11-13')).to.equal(true);
    expect(optional_validators.isInt('42')).to.equal(true);
    expect(optional_validators.trim('  value  ')).to.equal('value');
    expect(optional_validators.toInt('42')).to.equal(42);
  });
});
