'use strict';

const expect = require('chai').expect;
const Promise = require('bluebird');
const moment = require('moment');
const calendarRouter = require('../../../lib/route/calendar');

const calendarHandler = calendarRouter.stack
  .find(layer => layer.route && layer.route.path === '/')
  .route.stack[0].handle;

describe('Calendar route', function(){
  it('uses the company date when no year is provided', async function(){
    const companyDate = moment.utc('2026-11-13');
    let calendarYear;
    const user = {
      company: {get_today: () => companyDate},
      promise_calendar: ({year}) => {
        calendarYear = year.format('YYYY');
        return Promise.resolve([]);
      },
      get_company_with_all_leave_types: () => Promise.resolve({}),
      reload_with_leave_details: () => Promise.resolve({
        get_leave_statistics_by_types: () => [],
      }),
      promise_supervisors: () => Promise.resolve([]),
      promise_allowance: () => Promise.resolve({}),
    };

    await new global.Promise((resolve, reject) => {
      try {
        calendarHandler(
          {query: {}, user},
          {render: (view, locals) => resolve({view, locals})}
        );
      } catch (error) {
        reject(error);
      }
    }).then(({view, locals}) => {
      expect(view).to.equal('calendar');
      expect(locals.current_year).to.equal('2026');
      expect(calendarYear).to.equal('2026');
    });
  });
});
