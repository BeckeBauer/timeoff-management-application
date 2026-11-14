'use strict';

const expect = require('chai').expect;
const Promise = require('bluebird');
const settingsRouter = require('../../../lib/route/settings');

const createLeaveTypeHandler = settingsRouter.stack
  .find(layer => layer.route && layer.route.path === '/leavetypes' && layer.route.methods.post)
  .route.stack[0].handle;

describe('Leave type creation route', function(){
  it('creates a leave type when optional form values are omitted', async function(){
    const company = {id: 42, leave_types: []};
    let createdAttributes;
    const flashErrors = [];
    const req = {
      body: {
        name__new: 'Volunteer day',
        color__new: 'leave_type_color_3',
        limit__new: '',
      },
      user: {
        id: 1,
        get_company_with_all_leave_types: () => Promise.resolve(company),
      },
      app: {
        get: () => ({
          LeaveType: {
            create: attributes => {
              createdAttributes = attributes;
              return Promise.resolve(attributes);
            },
          },
        }),
      },
      session: {
        flash_message: () => {},
        flash_error: message => flashErrors.push(message),
      },
    };

    const redirectPath = await new global.Promise(resolve => {
      createLeaveTypeHandler(req, {redirect_with_session: resolve});
    });

    expect(redirectPath).to.equal('/settings/general/');
    expect(flashErrors).to.eql([]);
    expect(createdAttributes).to.include({
      name: 'Volunteer day',
      color: 'leave_type_color_3',
      use_allowance: false,
      auto_approve: false,
      limit: '0',
      sort_order: 0,
      companyId: 42,
    });
  });
});
