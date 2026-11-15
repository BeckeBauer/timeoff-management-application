'use strict';

var models = require('../lib/model/db');

module.exports = {
  up: function(queryInterface) {
    return queryInterface.describeTable('Users')
      .then(function(attributes) {
        if (attributes.hasOwnProperty('preferred_language')) {
          return 1;
        }

        return queryInterface.addColumn(
          'Users',
          'preferred_language',
          models.User.attributes.preferred_language
        );
      });
  },

  down: function(queryInterface) {
    return queryInterface.removeColumn('Users', 'preferred_language');
  }
};
