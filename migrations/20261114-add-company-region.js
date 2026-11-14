'use strict';

var models = require('../lib/model/db');

module.exports = {
  up: function(queryInterface) {
    return queryInterface.describeTable('Companies')
      .then(function(attributes) {
        if (attributes.hasOwnProperty('region')) {
          return 1;
        }

        return queryInterface.addColumn(
          'Companies',
          'region',
          models.Company.attributes.region
        );
      });
  },

  down: function(queryInterface) {
    return queryInterface.removeColumn('Companies', 'region');
  }
};
