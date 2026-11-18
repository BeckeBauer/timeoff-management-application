'use strict';

const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const runtimeOptions = require('../../../lib/view/handlebars_runtime_options');

describe('Calendar feed links', function() {
  it('renders webcal subscription links with the public host and port', function() {
    const templatePath = path.join(__dirname, '../../../views/feeds_list.hbs');
    const template = Handlebars.create();
    ['header', 'show_flash_messages', 'footer'].forEach(name => template.registerPartial(name, ''));

    const rendered = template.compile(fs.readFileSync(templatePath, 'utf8'))(
      {
        current_webcal_origin: 'webcal://calendar.example.com:8443',
        calendar_feed: {feed_token: 'personal-token'},
        team_view_feed: {feed_token: 'team-token'},
        keep_team_view_hidden: false,
      },
      runtimeOptions
    );

    expect(rendered).to.contain('href="webcal://calendar.example.com:8443/feed/personal-token/ical.ics"');
    expect(rendered).to.contain('href="webcal://calendar.example.com:8443/feed/team-token/ical.ics"');
    expect(rendered).to.not.contain('webcal://https://');
  });
});
