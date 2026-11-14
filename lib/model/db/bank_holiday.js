"use strict";

var moment = require('moment'),
_          = require('underscore'),
config     = require('../../config');

module.exports = function(sequelize, DataTypes) {
    var BankHoliday = sequelize.define("BankHoliday", {
        // TODO add validators!
        name : {
            type      : DataTypes.STRING,
            allowNull : false
        },
        date : {
            type         : DataTypes.DATE,
            allowNull    : false,
        },
    }, {
        indexes : [
          {
            fields : ['companyId'],
          }
        ],
        classMethods: {
            associate : function( models ) {
                BankHoliday.belongsTo(models.Company, {as : 'company'});
            },

            get_default_bank_holidays : function(args){
                var country = config.get('countries')[args.country_code];
                var national_holidays = country
                    && country.bank_holidays
                    && country.bank_holidays.length > 0
                    ? country.bank_holidays
                    : [{
                        name : 'Early May bank holiday',
                        date : '2015-05-04',
                    }];

                var region = args.region && country && country.regions
                    ? country.regions[args.region]
                    : null;

                if (args.region && !region) {
                    throw new Error(
                        'Unknown region ' + args.region + ' for country ' + args.country_code
                    );
                }

                return national_holidays.concat(
                    region ? region.bank_holidays || [] : []
                );
            },

            generate_bank_holidays : function(args){
                var company = args.company,
                    country_code = args.country_code;

                var bank_holidays = _.map(
                    BankHoliday.get_default_bank_holidays({
                        country_code : country_code,
                        region       : args.region || company.region,
                    }),
                    function(bh){
                        return {
                            name      : bh.name,
                            date      : bh.date,
                            companyId : company.id,
                        };
                    }
                );

                return BankHoliday.bulkCreate(bank_holidays);
            },
        },

        instanceMethods : {
          get_pretty_date : function(){
            return moment.utc(this.date).format('YYYY-MM-DD');
          },
        }
    });

    return BankHoliday;
};
