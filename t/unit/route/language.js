'use strict';

const expect = require('chai').expect;
const languageRouter = require('../../../lib/route/language');

const languageHandler = languageRouter.stack
  .find(layer => layer.route && layer.route.path === '/')
  .route.stack[0].handle;

function submitLanguage(req) {
  return new Promise((resolve, reject) => {
    languageHandler(req, {
      redirect_with_session: (...args) => resolve(args),
    }, reject);
  });
}

describe('Language preference route', function(){
  it('stores the selected language in an anonymous session', async function(){
    const req = {
      body: {language: 'de', return_to: '/login/'},
      session: {},
    };

    expect(await submitLanguage(req)).to.eql([303, '/login/']);
    expect(req.session.language).to.equal('de');
    expect(req.session.language_selected).to.equal(true);
  });

  it('accepts Korean as a supported selection', async function(){
    const req = {
      body: {language: 'ko', return_to: '/login/'},
      session: {},
    };

    expect(await submitLanguage(req)).to.eql([303, '/login/']);
    expect(req.session.language).to.equal('ko');
  });

  it('persists the selected language for a signed-in user', async function(){
    const updates = [];
    const messages = [];
    const req = {
      body: {language: 'de', return_to: '/settings/general/'},
      session: {
        flash_message: message => messages.push(message),
      },
      user: {
        updateAttributes: attributes => {
          updates.push(attributes);
          return Promise.resolve();
        },
      },
    };

    expect(await submitLanguage(req)).to.eql([303, '/settings/general/']);
    expect(updates).to.eql([{preferred_language: 'de'}]);
    expect(req.session.language).to.equal('de');
    expect(req.session.language_selected).to.equal(false);
    expect(messages).to.eql(['Language preference saved']);
  });

  it('rejects unsupported languages and unsafe return paths', async function(){
    const errors = [];
    const req = {
      body: {language: 'fr', return_to: '//example.com'},
      session: {flash_error: message => errors.push(message)},
    };

    expect(await submitLanguage(req)).to.eql([303, '/']);
    expect(errors).to.eql(['Please select a supported language']);
  });
});
