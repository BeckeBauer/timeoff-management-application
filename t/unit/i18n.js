'use strict';

const expect = require('chai').expect;
const i18n = require('../../lib/i18n');
const handlebarsEngine = require('../../lib/view/handlebars_engine');
const viewHelpers = require('../../lib/view/helpers')();

describe('German localization', function(){
  it('falls back to English for unsupported languages and translates German text', function(){
    expect(i18n.normalizeLanguage('fr')).to.equal('en');
    expect(i18n.translate('Calendar', 'fr')).to.equal('Calendar');
    expect(i18n.translate('Calendar', 'de')).to.equal('Kalender');
  });

  it('translates email subject and body while preserving the subject separator', function(){
    const source = 'Confirm registration on TimeOff.Management\n=====\nHello';
    const translated = i18n.translate(source, 'de');

    expect(translated).to.equal(
      'Registrierung bei TimeOff.Management bestätigen\n=====\nHallo'
    );
    expect(i18n.hasTranslation(source, 'de')).to.equal(true);
  });

  it('does not interpret Handlebars partials inside HTML attributes as visible text', function(){
    const strings = handlebarsEngine.get_template_strings(
      '<a href="/team/?{{> team_view_url_parameters}}" title="Go to calendar">Calendar</a>'
      + '<input placeholder="Employee">'
      + '<div title="{{#if today}}Today{{/if}}"></div>'
      + '<script>const text = "Save";</script>'
    );

    expect(strings).to.eql(['Go to calendar', 'Calendar', 'Employee', 'Today']);
  });

  it('translates static text inside dynamic tooltip attributes', function(){
    const engine = handlebarsEngine.create_handlebars_engine({
      extname: '.hbs',
      helpers: viewHelpers,
      runtimeOptions: require('../../lib/view/handlebars_runtime_options'),
    });

    return engine.renderView(
      require.resolve('../../views/partials/calendar_cell.hbs'),
      {
        language: 'de',
        day: {val: 4, is_bank_holiday: true, bank_holiday_name: 'Neujahr'},
        layout: false,
      }
    ).then(rendered => {
      expect(rendered).to.contain('title="Feiertag: Neujahr"');
    });
  });

  it('translates dynamic validation and flash messages', function(){
    expect(i18n.translate('New allowance for Sales should be numeric', 'de'))
      .to.equal('Der neue Urlaubsanspruch für Sales muss eine Zahl sein.');
    expect(i18n.translate('Request from Mina Example was processed', 'de'))
      .to.equal('Antrag von Mina Example wurde bearbeitet.');
    expect(i18n.translate('3 leave requests to process', 'de'))
      .to.equal('3 Abwesenheitsanträge müssen bearbeitet werden.');
  });
});
