'use strict';

const expect = require('chai').expect;
const flash_messages = require('../../lib/middleware/flash_messages');

describe('Flash messages', function(){
  it('can be reinstalled after the session is replaced', function(){
    const req = {session: {}};
    const res = {locals: {}};

    flash_messages(req, res, function(){});
    req.session = {};
    flash_messages.install(req.session, res);

    req.session.flash_message('Registration is complete.');

    expect(req.session.flash.messages).to.eql(['Registration is complete.']);
  });
});
