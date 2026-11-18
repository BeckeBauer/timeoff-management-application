'use strict';

const expect = require('chai').expect;
const Promise = require('bluebird');
const moment = require('moment');
const calendarRouter = require('../../../lib/route/calendar');

const calendarHandler = calendarRouter.stack
  .find(layer => layer.route && layer.route.path === '/')
  .route.stack[0].handle;
const calendarFeedsHandler = calendarRouter.stack
  .find(layer => layer.route && layer.route.path === '/feeds/')
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

  it('builds an absolute feed address using the externally visible protocol and host', async function(){
    const user = {
      getFeeds: () => Promise.resolve([
        {type: 'calendar', feed_token: 'personal-token'},
        {type: 'teamview', feed_token: 'team-token'},
      ]),
    };

    const rendered = await new global.Promise((resolve, reject) => {
      try {
        calendarFeedsHandler(
          {
            user,
            protocol: 'http',
            get: header => header === 'x-forwarded-proto'
              ? 'https, http'
              : 'calendar.example.com:8443',
          },
          {render: (view, locals) => resolve({view, locals})}
        );
      } catch (error) {
        reject(error);
      }
    });

    expect(rendered.view).to.equal('feeds_list');
    expect(rendered.locals.current_origin).to.equal('https://calendar.example.com:8443');
  });
});
