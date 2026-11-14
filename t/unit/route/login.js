'use strict';

const expect = require('chai').expect;
const createLoginRouter = require('../../../lib/route/login');
const loginRouter = createLoginRouter({});
const logoutHandler = loginRouter.stack
  .find(layer => layer.route && layer.route.path === '/logout')
  .route.stack[0].handle;

describe('Logout route', function(){
  it('redirects after Passport completes logout', function(done){
    const req = {
      user: {id: 1},
      logout: callback => callback(null),
    };
    const res = {
      locals: {url_to_the_site_root: '/'},
      redirect_with_session: path => {
        expect(path).to.equal('/');
        done();
      },
    };

    logoutHandler(req, res, done);
  });

  it('passes logout failures to Express error handling', function(done){
    const error = new Error('logout failed');
    const req = {
      user: {id: 1},
      logout: callback => callback(error),
    };
    const res = {
      locals: {url_to_the_site_root: '/'},
      redirect_with_session: () => done(new Error('redirected after logout failure')),
    };

    logoutHandler(req, res, receivedError => {
      expect(receivedError).to.equal(error);
      done();
    });
  });
});
