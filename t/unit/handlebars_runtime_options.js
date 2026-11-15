'use strict';

const expect = require('chai').expect;
const Handlebars = require('handlebars');
const fs = require('fs');
const runtimeOptions = require('../../lib/view/handlebars_runtime_options');
const viewHelpers = require('../../lib/view/helpers')();

describe('Handlebars model access', function(){
  it('renders dates from model getters in bank holiday rows', function(){
    class BankHoliday {
      get date() { return new Date('2026-06-04T00:00:00.000Z'); }
    }

    const template = Handlebars.compile('{{as_date bankHoliday.date}}');
    const rendered = template(
      {bankHoliday: new BankHoliday()},
      {...runtimeOptions, helpers: viewHelpers}
    );

    expect(rendered).to.equal('2026-06-04');
  });

  it('renders the explicitly allowed model getters and methods', function(){
    class Allowance {
      get carry_over() { return 1; }
      get manual_adjustment() { return 2; }
      get employement_range_adjustment() { return 3; }
      get number_of_days_taken_from_allowance() { return 4; }
      get is_accrued_allowance() { return true; }
      get accrued_adjustment() { return 5; }
      get nominal_allowance() { return 6; }
      get total_number_of_days_in_allowance() { return 7; }
      get number_of_days_available_in_allowance() { return 8; }
    }

    class User {
      get admin() { return true; }
      get email() { return 'user@example.com'; }
      get id() { return 9; }
      full_name() { return 'Example User'; }
    }

    class Company {
      get country() { return 'GB'; }
      get date_format() { return 'YYYY-MM-DD'; }
      get timezone() { return 'Europe/London'; }
      get share_all_absences() { return true; }
      get is_team_view_hidden() { return false; }
      get_available_date_formats() { return ['YYYY-MM-DD']; }
      get_default_date_format_for_date_picker() { return 'YYYY-MM-DD'; }
    }

    class Department {
      get name() { return 'Sales'; }
      get allowance() { return 20; }
      get bossId() { return 9; }
      get boss() { return new User(); }
      get users() { return [new User()]; }
      get include_public_holidays() { return true; }
    }

    class LeaveType {
      get limit() { return 10; }
      get name() { return 'Annual leave'; }
      get use_allowance() { return true; }
      get_color_class() { return 'blue'; }
    }

    const template = Handlebars.compile(
      '{{allowance.carry_over}}|{{allowance.manual_adjustment}}|'
      + '{{allowance.employement_range_adjustment}}|'
      + '{{allowance.number_of_days_taken_from_allowance}}|'
      + '{{allowance.is_accrued_allowance}}|{{allowance.accrued_adjustment}}|'
      + '{{allowance.nominal_allowance}}|'
      + '{{allowance.total_number_of_days_in_allowance}}|'
      + '{{allowance.number_of_days_available_in_allowance}}|'
      + '{{#if user.admin}}admin{{/if}}|'
      + '{{user.email}}|{{user.id}}|{{user.full_name}}|'
      + '{{company.country}}|{{company.date_format}}|{{company.timezone}}|'
      + '{{#if company.share_all_absences}}shared{{/if}}|'
      + '{{#if company.is_team_view_hidden}}hidden{{else}}visible{{/if}}|'
      + '{{#each company.get_available_date_formats}}{{this}}{{/each}}|'
      + '{{company.get_default_date_format_for_date_picker}}|'
      + '{{department.name}}|{{department.bossId}}|{{department.boss.id}}|'
      + '{{department.boss.full_name}}|{{department.users.length}}|'
      + '{{department.allowance}}|'
      + '{{#if department.include_public_holidays}}yes{{/if}}|'
      + '{{leaveType.name}}|{{leaveType.limit}}|'
      + '{{#if leaveType.use_allowance}}yes{{/if}}|'
      + '{{leaveType.get_color_class}}'
    );

    const rendered = template({
      allowance: new Allowance(),
      user: new User(),
      company: new Company(),
      department: new Department(),
      leaveType: new LeaveType(),
    }, runtimeOptions);

    expect(rendered).to.equal(
      '1|2|3|4|true|5|6|7|8|admin|user@example.com|9|Example User|'
      + 'GB|YYYY-MM-DD|Europe/London|shared|visible|YYYY-MM-DD|'
      + 'YYYY-MM-DD|Sales|9|9|Example User|1|20|yes|'
      + 'Annual leave|10|yes|blue'
    );
  });

  it('renders pending and approved leave statuses accurately', function(){
    class Leave {
      constructor(status) {
        this.status = status;
        this.id = status;
      }

      get userId() { return 1; }
      get leave_type() { return {name: 'Holiday'}; }
      get approver() { return null; }
      get comment() { return {comment: ''}; }
      is_new_leave() { return this.status === 'pending'; }
      is_approved_leave() { return this.status === 'approved'; }
      is_pended_revoke_leave() { return false; }
      get_deducted_days_number() { return 2; }
      get_start_leave_day() { return {date: '2026-11-13'}; }
      get_end_leave_day() { return {date: '2026-11-14'}; }
      does_start_half_morning() { return true; }
      does_start_half_afternoon() { return false; }
      does_end_half_morning() { return false; }
      does_end_half_afternoon() { return true; }
    }

    const template = Handlebars.compile(fs.readFileSync(
      require.resolve('../../views/partials/user_requests.hbs'),
      'utf8'
    ));
    const leaveDatesTemplate = Handlebars.compile(fs.readFileSync(
      require.resolve('../../views/partials/leave_dates.hbs'),
      'utf8'
    ));

    const rendered = template({
      leaves: [new Leave('pending'), new Leave('approved'), new Leave('rejected')],
      logged_user: {id: 1},
    }, {
      ...runtimeOptions,
      partials: {leave_dates: leaveDatesTemplate},
      helpers: {
        if_equal(left, right, options) {
          return left === right ? options.fn(this) : options.inverse(this);
        },
        as_date(value) {
          return value;
        },
      },
    });

    expect(rendered).to.contain('Pending');
    expect(rendered).to.contain('Approved');
    expect(rendered).to.contain('Rejected');
    expect(rendered).to.contain('<td>0</td>');
    expect(rendered).to.contain('<td>2</td>');
    expect(rendered).to.contain('2026-11-13');
    expect(rendered).to.contain('(morning)');
    expect(rendered).to.contain('2026-11-14');
    expect(rendered).to.contain('(afternoon)');
  });

  it('renders employee details and active status from model properties', function(){
    class Employee {
      get id() { return 7; }
      get name() { return 'Alex'; }
      get lastname() { return 'Example'; }
      get email() { return 'alex@example.com'; }
      get DepartmentId() { return 5; }
      get admin() { return false; }
      get auto_approve() { return false; }
      get start_date() { return '2026-01-15'; }
      get end_date() { return null; }
      full_name() { return `${this.name} ${this.lastname}`; }
      is_active() { return this.end_date === null; }
    }

    const detailsTemplate = Handlebars.compile(fs.readFileSync(
      require.resolve('../../views/user_details.hbs'),
      'utf8'
    ));
    const generalTemplate = Handlebars.compile(fs.readFileSync(
      require.resolve('../../views/partials/user_details/general.hbs'),
      'utf8'
    ));
    const employee = new Employee();
    const detailsRendered = detailsTemplate({
      employee,
      show_main_tab: true,
    }, {
      ...runtimeOptions,
      partials: {
        header: '',
        show_flash_messages: '',
        'user_details/absences': '',
        'user_details/schedule': '',
        'user_details/calendar': '',
        'user_details/general': '',
        footer: '',
      },
    });
    const generalRendered = generalTemplate({
      employee,
      departments: [{
        id: 5,
        name: 'Sales',
        boss: {name: 'Manager', lastname: 'Example'},
      }],
      logged_user: {
        company: {
          get_default_date_format_for_date_picker: () => 'YYYY-MM-DD',
        },
      },
      company: {name: 'Example Co', ldap_auth_enabled: false},
    }, {
      ...runtimeOptions,
      partials: {'user_details/breadcrumb': ''},
      helpers: {
        if_equal(left, right, options) {
          return left === right ? options.fn(this) : options.inverse(this);
        },
        as_date(value) {
          return value || '';
        },
      },
    });

    expect(detailsRendered).to.contain('Alex Example');
    expect(detailsRendered).not.to.contain('Deactivated');
    expect(generalRendered).to.contain('name="lastname" required value="Example"');
    expect(generalRendered).to.contain('name="start_date"');
    expect(generalRendered).to.contain('value="2026-01-15"');
    expect(generalRendered).to.contain('/settings/departments/edit/5');
  });

  it('renders company and individual schedule controls', function(){
    class Schedule {
      is_user_specific() { return true; }
      works_monday() { return true; }
      works_tuesday() { return true; }
      works_wednesday() { return true; }
      works_thursday() { return true; }
      works_friday() { return true; }
      works_saturday() { return true; }
      works_sunday() { return true; }
    }

    const widgetTemplate = Handlebars.compile(fs.readFileSync(
      require.resolve('../../views/partials/schedule_widget.hbs'),
      'utf8'
    ));
    const scheduleTemplate = Handlebars.compile(fs.readFileSync(
      require.resolve('../../views/partials/user_details/schedule.hbs'),
      'utf8'
    ));
    const schedule = new Schedule();
    const widgetRendered = widgetTemplate({schedule}, runtimeOptions);
    const scheduleRendered = scheduleTemplate({
      schedule,
      employee: {id: 7},
    }, {
      ...runtimeOptions,
      partials: {
        'user_details/breadcrumb': '',
        schedule_widget: widgetTemplate,
      },
    });

    expect(widgetRendered).to.contain('name ="sunday"');
    expect(widgetRendered).to.contain('checked');
    expect(scheduleRendered).to.contain('has <strong data-vpp="declare-user-specific-schedule">custom</strong>');
    expect(scheduleRendered).to.contain('Save employee specific schedule');
  });
});
