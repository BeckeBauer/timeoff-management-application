'use strict';

const expect = require('chai').expect;
const Promise = require('bluebird');
const moment = require('moment');
const absenceAware = require('../../../../lib/model/mixin/user/absence_aware');

describe('Employee calendar public holidays', function(){
  it('shows company holidays even when the department setting is off', async function(){
    const company = {
      bank_holidays: [{date: '2026-06-04', name: 'Corpus Christi'}],
      leave_types: [],
      get_today: () => moment.utc('2026-06-01'),
    };
    const employee = {
      company,
      getDepartment: () => Promise.resolve({include_public_holidays: false}),
      getCompany: () => Promise.resolve(company),
      getMy_leaves: () => Promise.resolve([]),
      promise_schedule_I_obey: () => Promise.resolve({
        is_it_working_day: () => true,
      }),
    };

    absenceAware.call(employee, {
      models: {
        Leave: {
          status_rejected: () => 0,
          status_canceled: () => 1,
        },
      },
    });

    const calendar = await employee.promise_calendar({
      year: moment.utc('2026-01-01'),
      show_full_year: false,
    });
    const june = calendar.find(month => month.get_base_date().month() === 5);

    expect(june.is_bank_holiday(4)).to.equal(true);
    expect(june.get_bank_holiday_name(4)).to.equal('Corpus Christi');
  });
});
