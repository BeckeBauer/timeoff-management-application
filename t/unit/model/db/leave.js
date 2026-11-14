
'use strict';

var expect  = require('chai').expect,
    _       = require('underscore'),
    Promise = require('bluebird'),
    model   = require('../../../../lib/model/db'),
    LeaveRequestParameters = require('../../../../lib/model/leave_request_parameters'),
    LeaveCollectionUtil = require('../../../../lib/model/leave_collection')();

describe('Check bug when type mismatch happenned', function(){
    var leave = model.Leave.build({
        status : '1',
        date_start     : '2015-05-07 00:00:00.000 +00:00',
        day_part_start : 2,
        date_end     : '2015-05-07 00:00:00.000 +00:00',
        day_part_end : 2,
    });

    it('String value of 2 properly used', function(){
        expect(
            leave.fit_with_leave_request(
                new LeaveRequestParameters( {
                    from_date      : '2015-05-07',
                    from_date_part : '2',
                    to_date        : '2015-05-07',
                    // do not care about following parameters
                    to_date_part : 2,
                    leave_type   : 1,
                    reason       : 1,
                })
            )
        ).to.be.equal(false);
    });
});

describe('leave request half a day with existing booking of half a day', function(){
    var leave = model.Leave.build({
        status : '1',
        date_start : '2015-04-09',
        date_end : '2015-04-09',
        day_part_start : 2,
        day_part_end : 2,
    });

    it('clash', function(){
        expect(
            leave.fit_with_leave_request(
                new LeaveRequestParameters( {
                    from_date      : '2015-04-09',
                    from_date_part : 2,
                    to_date        : '2015-04-09',
                    // do not care about following parameters
                    to_date_part : 1,
                    leave_type   : 1,
                    reason       : 1,
                })
            )
        ).to.not.be.ok;
    });

    it('fit', function(){
        expect(
            leave.fit_with_leave_request(
                new LeaveRequestParameters( {
                    from_date      : '2015-04-09',
                    from_date_part : 3,
                    to_date        : '2015-04-09',
                    // do not care about following parameters
                    to_date_part : 1,
                    leave_type   : 1,
                    reason       : 1,
                })
            )
        ).to.be.ok;
    });
});

describe('Leave request is spread through more then one day', function(){
    var leave = model.Leave.build({
        status : '1',

        date_start     : '2015-04-09',
        date_end       : '2015-04-10',
        day_part_start : 2,
        day_part_end   : 1,
    });

    it('leave object is instanciated', function(){
        expect( leave ).to.be.ok;
    });

    it('both ends are full, stick to the start', function(){
        expect(
            leave.fit_with_leave_request(
                new LeaveRequestParameters( {
                    from_date      : '2015-04-08',
                    from_date_part : 1,
                    to_date        : '2015-04-09',
                    to_date_part   : 1,
                    // do not care about following parameters
                    leave_type   : 1,
                    reason       : 1,
                })
            )
        ).to.not.be.ok;
    });

    it('both ends are full, stick to the end', function(){
        expect(
            leave.fit_with_leave_request(
                new LeaveRequestParameters( {
                    from_date      : '2015-04-10',
                    from_date_part : 1,
                    to_date        : '2015-04-11',
                    to_date_part   : 1,
                    // do not care about following parameters
                    leave_type   : 1,
                    reason       : 1,
                })
            )
        ).to.not.be.ok;
    });

    it('ends with part stick to the part start - should fit', function(){
        expect(
            leave.fit_with_leave_request(
                new LeaveRequestParameters( {
                    from_date      : '2015-04-08',
                    from_date_part : 1,
                    to_date        : '2015-04-09',
                    to_date_part   : 3,
                    // do not care about following parameters
                    leave_type   : 1,
                    reason       : 1,
                })
            )
        ).to.be.ok;
    });

    it('ends with part, stick to the part start - with clashes', function(){
        expect(
            leave.fit_with_leave_request(
                new LeaveRequestParameters( {
                    from_date      : '2015-04-08',
                    from_date_part : 1,
                    to_date        : '2015-04-09',
                    to_date_part   : 2,
                    // do not care about following parameters
                    leave_type   : 1,
                    reason       : 1,
                })
            )
        ).to.not.be.ok;
    });

    it('start with with part, stick to the full end', function(){
        expect(
            leave.fit_with_leave_request(
                new LeaveRequestParameters( {
                    from_date      : '2015-04-10',
                    from_date_part : 2,
                    to_date        : '2015-04-11',
                    to_date_part   : 1,
                    // do not care about following parameters
                    leave_type   : 1,
                    reason       : 1,
                })
            )
        ).to.not.be.ok;
    });
});

describe('Case when leave request is within one day', function(){

    var leave = model.Leave.build({
        status : '1',

        date_start     : '2015-04-09',
        date_end       : '2015-04-10',
        day_part_start : 2,
        day_part_end   : 1,
    });

    it('Is half and attempt to stick to the half day part so they fit', function(){
        expect(
            leave.fit_with_leave_request(
                new LeaveRequestParameters( {
                    from_date      : '2015-04-09',
                    from_date_part : 3,
                    to_date        : '2015-04-09',
                    // do not care about following parameters
                    to_date_part : 1,
                    leave_type   : 1,
                    reason       : 1,
                })
            )
        ).to.be.ok;
    });

    it('Is half and attempt to stick to the half day part with clashes', function(){
        expect(
            leave.fit_with_leave_request(
                new LeaveRequestParameters( {
                    from_date      : '2015-04-09',
                    from_date_part : 2,
                    to_date        : '2015-04-09',
                    // do not care about following parameters
                    to_date_part : 1,
                    leave_type   : 1,
                    reason       : 1,
                })
            )
        ).to.not.be.ok;
    });

    it('Is half and attempt to stick to the full day part', function(){
        expect(
            leave.fit_with_leave_request(
                new LeaveRequestParameters( {
                    from_date      : '2015-04-10',
                    from_date_part : 2,
                    to_date        : '2015-04-10',
                    // do not care about following parameters
                    to_date_part : 1,
                    leave_type   : 1,
                    reason       : 1,
                })
            )
        ).to.not.be.ok;
    });

    it('Is full day and attempt to stick it to the half day part',function(){
        expect(
            leave.fit_with_leave_request(
                new LeaveRequestParameters( {
                    from_date      : '2015-04-09',
                    from_date_part : 1,
                    to_date        : '2015-04-09',
                    // do not care about following parameters
                    to_date_part : 1,
                    leave_type   : 1,
                    reason       : 1,
                })
            )
        ).to.not.be.ok;
    });

    it('Is full day and attempt to stick it to the full day part',function(){
        expect(
            leave.fit_with_leave_request(
                new LeaveRequestParameters( {
                    from_date      : '2015-04-10',
                    from_date_part : 1,
                    to_date        : '2015-04-10',
                    // do not care about following parameters
                    to_date_part : 1,
                    leave_type   : 1,
                    reason       : 1,
                })
            )
        ).to.not.be.ok;
    });

});

describe('leave allowance deductions', function(){
    it('does not count pending or rejected requests against allowance', function(){
        var user = model.User.build();
        user.cached_schedule = {};
        user.my_leaves = [
            leaveWithStatus(model.Leave.status_approved(), 3),
            leaveWithStatus(model.Leave.status_new(), 2),
            leaveWithStatus(model.Leave.status_rejected(), 4),
        ];

        expect(user.calculate_number_of_days_taken_from_allowance()).to.equal(3);
    });

    it('includes rejected requests in the user leave history query', function(){
        var user = model.User.build(),
            query;

        user.promise_my_leaves = function(args){
            query = args;
            return Promise.resolve([]);
        };

        return user.promise_my_active_leaves_ever().then(function(){
            expect(query.filter_status).to.include(model.Leave.status_rejected());
        });
    });

    it('does not include rejected leave in the displayed deduction total', async function(){
        var approved = leaveForGrouping({
                approved: true,
                days: 3,
            }),
            rejected = leaveForGrouping({
                approved: false,
                days: 5,
            }),
            grouped = await LeaveCollectionUtil.promise_to_group_leaves([
                approved,
                rejected,
            ]);

        expect(grouped[0].leaves).to.have.length(2);
        expect(grouped[0].total_deduction).to.equal(3);
    });
});

function leaveWithStatus(status, deductedDays) {
    var leave = model.Leave.build({status: status});
    leave.user = {};
    leave.get_deducted_days_number = function(){
        return deductedDays;
    };

    return leave;
}

function leaveForGrouping(args) {
    return {
        get_start_leave_day: function(){
            return {date: '2026-01-15'};
        },
        is_new_leave: function(){
            return false;
        },
        is_approved_leave: function(){
            return args.approved;
        },
        get_deducted_days_number: function(){
            return args.days;
        },
    };
}
