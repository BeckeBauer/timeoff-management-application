'use strict';

const expect = require('chai').expect;
const Promise = require('bluebird');
const EmailTransport = require('../../../lib/email');
const UserImporter = require('../../../lib/model/user_importer');
const usersRouter = require('../../../lib/route/users');

const addUserHandler = usersRouter.stack
  .find(layer => layer.route && layer.route.path === '/add/' && layer.route.methods.post)
  .route.stack[0].handle;
const editUserHandler = usersRouter.stack
  .find(layer => layer.route && layer.route.path === '/edit/:user_id/' && layer.route.methods.post)
  .route.stack[0].handle;

describe('Employee creation route', function(){
  it('creates an employee when optional fields are omitted', async function(){
    const company = {
      departments: [{id: 5}],
      normalise_date: date => date,
    };
    const userAttributes = [];
    const flashErrors = [];
    const originalValidateEmail = UserImporter.validate_email_to_be_free;
    const originalAddUser = UserImporter.add_user;
    const originalAddUserEmail = EmailTransport.prototype.promise_add_new_user_email;

    UserImporter.validate_email_to_be_free = () => Promise.resolve();
    UserImporter.add_user = attributes => {
      userAttributes.push(attributes);
      return Promise.resolve({});
    };
    EmailTransport.prototype.promise_add_new_user_email = () => Promise.resolve();

    try {
      const req = {
        body: {
          name: 'Alex',
          lastname: 'Example',
          email_address: 'alex@example.com',
          department: '5',
          start_date: '2026-11-13',
          password_one: 'secret',
          password_confirm: 'secret',
        },
        user: {
          id: 1,
          companyId: 2,
          company,
          get_company_for_add_user: () => Promise.resolve(company),
        },
        session: {
          flash_has_errors: () => flashErrors.length > 0,
          flash_error: message => flashErrors.push(message),
          flash_message: () => {},
        },
      };

      const redirectPath = await new global.Promise(resolve => {
        addUserHandler(req, {redirect_with_session: resolve});
      });

      expect(redirectPath).to.equal('../');
      expect(flashErrors).to.eql([]);
      expect(userAttributes).to.have.length(1);
      expect(userAttributes[0]).to.include({
        name: 'Alex',
        lastname: 'Example',
        email: 'alex@example.com',
        department_id: '5',
        end_date: null,
        admin: false,
        auto_approve: false,
      });
    } finally {
      UserImporter.validate_email_to_be_free = originalValidateEmail;
      UserImporter.add_user = originalAddUser;
      EmailTransport.prototype.promise_add_new_user_email = originalAddUserEmail;
    }
  });

  it('updates an employee when optional fields are omitted', async function(){
    const employeeAttributes = {
      id: 8,
      name: 'Alex',
      lastname: 'Example',
      email: 'alex@example.com',
      DepartmentId: '5',
      start_date: '2026-11-13',
      end_date: null,
      admin: false,
      auto_approve: false,
    };
    const updatedAttributes = [];
    const employee = {
      ...employeeAttributes,
      companyId: 2,
      get: () => employeeAttributes,
      updateAttributes: attributes => {
        updatedAttributes.push(attributes);
        return Promise.resolve();
      },
      full_name: () => 'Alex Example',
    };
    const company = {
      users: [employee],
      normalise_date: date => date,
    };
    const flashErrors = [];
    const req = {
      params: {user_id: '8'},
      body: {
        name: 'Alex',
        lastname: 'Example',
        email_address: 'alex@example.com',
        department: '5',
        start_date: '2026-11-13',
      },
      user: {
        id: 1,
        companyId: 2,
        company,
        get_company_for_user_details: () => Promise.resolve(company),
      },
      app: {
        get: () => ({User: {}}),
      },
      session: {
        flash_has_errors: () => flashErrors.length > 0,
        flash_error: message => flashErrors.push(message),
        flash_message: () => {},
      },
    };

    const redirectPath = await new global.Promise(resolve => {
      editUserHandler(req, {redirect_with_session: resolve});
    });

    expect(redirectPath).to.equal('.');
    expect(flashErrors).to.eql([]);
    expect(updatedAttributes).to.have.length(1);
    expect(updatedAttributes[0]).to.include({
      name: 'Alex',
      lastname: 'Example',
      email: 'alex@example.com',
      DepartmentId: '5',
      end_date: null,
      admin: false,
      auto_approve: false,
    });
  });
});
