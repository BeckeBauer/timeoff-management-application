'use strict';

const expect = require('chai').expect;
const moment = require('moment');
const fs = require('fs');
const Handlebars = require('handlebars');
const UserAllowance = require('../../../lib/model/user_allowance');
const runtimeOptions = require('../../../lib/view/handlebars_runtime_options');
const viewHelpers = require('../../../lib/view/helpers')();

const currentYear = moment.utc().year();

function createAllowance({
  startDate,
  endDate = null,
  daysTaken = 0,
  now,
  annualAllowance = 24,
  country = 'DE',
  accrued = false,
}) {
  return new UserAllowance({
    user: {
      start_date: startDate,
      end_date: endDate,
      company: {country},
      department: {is_accrued_allowance: accrued},
    },
    number_of_days_taken_from_allowance: daysTaken,
    manual_adjustment: 0,
    carry_over: 0,
    nominal_allowance: annualAllowance,
    now: moment.utc(now),
  });
}

describe('German employment-based allowance', function(){
  it('grants monthly portions on completed service months and full entitlement after six', function(){
    const startDate = `${currentYear}-03-03`;

    expect(createAllowance({
      startDate,
      now: `${currentYear}-04-02`,
    }).total_number_of_days_in_allowance).to.equal(0);

    expect(createAllowance({
      startDate,
      now: `${currentYear}-04-03`,
    }).total_number_of_days_in_allowance).to.equal(2);

    expect(createAllowance({
      startDate,
      now: `${currentYear}-09-02`,
    }).total_number_of_days_in_allowance).to.equal(10);

    expect(createAllowance({
      startDate,
      now: `${currentYear}-09-03`,
    }).total_number_of_days_in_allowance).to.equal(24);
  });

  it('prorates a first-half departure by full calendar-year months after six months of service', function(){
    const allowance = createAllowance({
      startDate: `${currentYear - 1}-03-03`,
      endDate: `${currentYear}-04-03`,
      now: `${currentYear}-04-03`,
    });

    expect(allowance.total_number_of_days_in_allowance).to.equal(6);
  });

  it('uses completed service months when an employee leaves before six months', function(){
    const firstHalfDeparture = createAllowance({
      startDate: `${currentYear}-03-03`,
      endDate: `${currentYear}-04-03`,
      now: `${currentYear}-04-03`,
    });
    const secondHalfBeforeSixMonths = createAllowance({
      startDate: `${currentYear}-03-03`,
      endDate: `${currentYear}-07-01`,
      now: `${currentYear}-07-01`,
    });

    expect(firstHalfDeparture.total_number_of_days_in_allowance).to.equal(2);
    expect(secondHalfBeforeSixMonths.total_number_of_days_in_allowance).to.equal(6);
  });

  it('keeps full entitlement for a second-half departure after six months of service', function(){
    const allowance = createAllowance({
      startDate: `${currentYear - 1}-12-03`,
      endDate: `${currentYear}-07-01`,
      now: `${currentYear}-07-01`,
    });

    expect(allowance.total_number_of_days_in_allowance).to.equal(24);
  });

  it('rounds portions over half a day up and otherwise retains one decimal', function(){
    const startDate = `${currentYear}-03-03`;

    expect(createAllowance({
      startDate,
      now: `${currentYear}-04-03`,
      annualAllowance: 20,
    }).total_number_of_days_in_allowance).to.equal(2);

    expect(createAllowance({
      startDate,
      now: `${currentYear}-04-03`,
      annualAllowance: 18,
    }).total_number_of_days_in_allowance).to.equal(1.5);

    expect(createAllowance({
      startDate,
      now: `${currentYear}-04-03`,
      annualAllowance: 16,
    }).total_number_of_days_in_allowance).to.equal(1.3);
  });

  it('uses the German monthly entitlement instead of the daily accrued calculation', function(){
    const allowance = createAllowance({
      startDate: `${currentYear}-03-03`,
      now: `${currentYear}-04-03`,
      accrued: true,
    });

    expect(allowance.number_of_days_available_in_allowance).to.equal(2);
  });

  it('reports excess leave taken for a terminated employee without changing leave records', function(){
    const allowance = createAllowance({
      startDate: `${currentYear}-03-03`,
      endDate: `${currentYear}-04-03`,
      daysTaken: 4,
      now: `${currentYear}-04-03`,
    });

    expect(allowance.excess_days).to.equal(2);
    expect(allowance.number_of_days_taken_from_allowance).to.equal(4);
  });

  it('does not report excess leave for active employees or other countries', function(){
    const activeEmployee = createAllowance({
      startDate: `${currentYear}-03-03`,
      daysTaken: 4,
      now: `${currentYear}-04-03`,
    });
    const nonGermanEmployee = createAllowance({
      startDate: `${currentYear}-03-03`,
      endDate: `${currentYear}-04-03`,
      daysTaken: 4,
      now: `${currentYear}-04-03`,
      country: 'GB',
    });

    expect(activeEmployee.excess_days).to.equal(0);
    expect(nonGermanEmployee.excess_days).to.equal(0);
  });

  it('shows the excess leave notice in the allowance breakdown', function(){
    const allowance = createAllowance({
      startDate: `${currentYear}-03-03`,
      endDate: `${currentYear}-04-03`,
      daysTaken: 4,
      now: `${currentYear}-04-03`,
    });
    const template = Handlebars.compile(fs.readFileSync(
      require.resolve('../../../views/partials/user_details/allowance_breakdown.hbs'),
      'utf8'
    ));
    const rendered = template({user_allowance: allowance}, {
      ...runtimeOptions,
      helpers: viewHelpers,
    });

    expect(rendered).to.contain('2 days of leave taken exceed the calculated German entitlement');
    expect(rendered).to.contain('Leave already taken remains recorded.');
  });

  it('leaves the existing calculation unchanged for other countries', function(){
    const allowance = createAllowance({
      startDate: `${currentYear}-03-03`,
      now: `${currentYear}-04-03`,
      country: 'GB',
    });

    expect(allowance.total_number_of_days_in_allowance).to.equal(20);
  });
});
