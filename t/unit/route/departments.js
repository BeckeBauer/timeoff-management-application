'use strict';

const expect = require('chai').expect;
const Promise = require('bluebird');
const departmentsRouter = require('../../../lib/route/departments');

const addDepartmentHandler = departmentsRouter.stack
  .find(layer => layer.route && layer.route.path === '/departments/' && layer.route.methods.post)
  .route.stack[0].handle;

describe('Department creation route', function(){
  it('creates a department when the unchecked accrued-allowance box is omitted', async function(){
    const company = {
      id: 12,
      users: [{id: 34}],
    };
    let createdAttributes;
    const flashErrors = [];
    const req = {
      body: {
        name__new: 'Operations',
        allowance__new: '20',
        boss_id__new: '34',
        include_public_holidays__new: 'on',
      },
      user: {
        id: 34,
        getCompany: () => Promise.resolve(company),
      },
      app: {
        get: () => ({
          Department: {
            create: attributes => {
              createdAttributes = attributes;
              return Promise.resolve(attributes);
            },
          },
        }),
      },
      session: {
        flash_has_errors: () => false,
        flash_message: () => {},
        flash_error: message => flashErrors.push(message),
      },
    };
    const redirectPath = await new global.Promise(resolve => {
      addDepartmentHandler(req, {
        redirect_with_session: resolve,
      });
    });

    expect(redirectPath).to.equal('/settings/departments/');
    expect(flashErrors).to.eql([]);
    expect(createdAttributes).to.include({
      name: 'Operations',
      allowance: '20',
      bossId: '34',
      include_public_holidays: true,
      is_accrued_allowance: false,
      companyId: 12,
    });
  });
});
