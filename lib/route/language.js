'use strict';

const express = require('express');
const router = express.Router();
const i18n = require('../i18n');

const supported_languages = new Set(i18n.languages.map(language => language.code));

function get_return_path(value) {
  if (
    typeof value === 'string'
    && value.startsWith('/')
    && ! value.startsWith('//')
    && ! value.includes('\\')
  ) {
    return value;
  }

  return '/';
}

router.post('/', function(req, res, next) {
  const language = req.body.language;
  const return_path = get_return_path(req.body.return_to);

  if (! supported_languages.has(language)) {
    req.session.flash_error('Please select a supported language');
    return res.redirect_with_session(303, return_path);
  }

  if (! req.user) {
    req.session.language = language;
    req.session.language_selected = true;
    return res.redirect_with_session(303, return_path);
  }

  req.user.updateAttributes({preferred_language: language})
    .then(() => {
      req.session.language = language;
      req.session.language_selected = false;
      req.session.flash_message('Language preference saved');
      return res.redirect_with_session(303, return_path);
    })
    .catch(next);
});

module.exports = router;
