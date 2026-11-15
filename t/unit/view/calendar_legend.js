'use strict';

const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const buildCalendarLegend = require('../../../lib/view/calendar_legend');
const calendarLegendTemplate = Handlebars.compile(
  fs.readFileSync(path.join(__dirname, '../../../views/partials/calendar_legend.hbs'), 'utf8')
);

describe('Calendar legend', function(){
  const calendar = [{
    weeks: [[
      {is_bank_holiday: true},
      {morning_leave_type_id: 1},
      {afternoon_leave_type_id: 2, is_new_leave: true},
    ]],
  }];
  const leaveTypes = [
    {id: 1, name: 'Annual leave', get_color_class: () => 'leave_type_color_1'},
    {id: 2, name: 'Sick leave', get_color_class: () => 'leave_type_color_2'},
  ];

  it('shows only the public holiday item in the regular view', function(){
    const legend = buildCalendarLegend({calendar, leaveTypes, showAbsences: false});

    expect(legend.show).to.equal(true);
    expect(legend.has_public_holidays).to.equal(true);
    expect(legend.absence_types).to.eql([]);
    expect(legend.has_pending_absences).to.equal(false);

    const rendered = calendarLegendTemplate({
      calendar_legend: legend,
      show_full_year: false,
    });
    expect(rendered).to.contain('Public holidays');
    expect(rendered).not.to.contain('Annual leave');
  });

  it('includes displayed leave types and pending absences in the expanded view', function(){
    const legend = buildCalendarLegend({calendar, leaveTypes, showAbsences: true});

    expect(legend.absence_types).to.eql([
      {name: 'Annual leave', color_class: 'leave_type_color_1'},
    ]);
    expect(legend.has_pending_absences).to.equal(true);

    const rendered = calendarLegendTemplate({
      calendar_legend: legend,
      show_full_year: true,
    });
    expect(rendered).to.contain('Public holidays');
    expect(rendered).to.contain('leave_type_color_1');
    expect(rendered).to.contain('Annual leave');
    expect(rendered).not.to.contain('Sick leave');
    expect(rendered).to.contain('pending-absence');
    expect(rendered).to.contain('Pending absence');
  });
});
