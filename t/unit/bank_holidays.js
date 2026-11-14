'use strict';

var expect = require('chai').expect,
    model = require('../../lib/model/db');

describe('Default bank holidays', function() {
  it('includes Hesse holidays only when the Hesse region is selected', function() {
    var national = model.BankHoliday.get_default_bank_holidays({
      country_code: 'DE',
    });
    var hesse = model.BankHoliday.get_default_bank_holidays({
      country_code: 'DE',
      region: 'HE',
    });

    expect(national.some(holiday => holiday.date === '2026-06-04')).to.equal(false);
    expect(national.some(holiday => holiday.date === '2027-05-27')).to.equal(false);
    expect(hesse.some(holiday => holiday.date === '2026-06-04')).to.equal(true);
    expect(hesse.some(holiday => holiday.date === '2027-05-27')).to.equal(true);
  });
});
