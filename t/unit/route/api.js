'use strict';

const expect = require('chai').expect;
const apiRouter = require('../../../lib/route/api');

const notificationsHandler = apiRouter.stack
  .find(layer => layer.route && layer.route.path === '/notifications/')
  .route.stack[0].handle;

describe('Notification API localization', function(){
  it('uses the requesting user preferred language for notification labels', async function(){
    const req = {
      user: {
        preferred_language: 'de',
        promise_leaves_to_be_processed: async () => [{}, {}, {}],
      },
    };

    const result = await new Promise(resolve => {
      notificationsHandler(req, {json: resolve});
    });

    expect(result.data[0].label).to.equal('3 Abwesenheitsanträge müssen bearbeitet werden.');
  });
});
