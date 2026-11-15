
'use strict';

var expect = require('chai').expect,
_          = require('underscore'),
bluebird   = require('bluebird'),
Email      = require('../../lib/email');

describe('Check Email', function(){

  it('Knows how to render and parse template', function(done){

    var email = new Email();

    bluebird.resolve(email.promise_rendered_email_template({
      template_name : 'foobar',
      context : {
        user : {
          name : 'FOO',
          reload_with_session_details : function(){ bluebird.resolve(1); },
        },
      },
    }))
    .then(function(email){

      expect(email.subject).to.be.equal('Email subject goes here');
      expect(email.body).to.match(/Hello FOO\./);

      done();
    });

  });

  it('renders email subjects and bodies in the recipient preferred language', function(){
    var email = new Email();

    return email.promise_rendered_email_template({
      template_name: 'foobar',
      context: {
        user: {
          name: 'Mina',
          preferred_language: 'de',
          reload_with_session_details: function(){ return bluebird.resolve(1); },
        },
      },
    }).then(function(rendered_email){
      expect(rendered_email.subject).to.equal('E-Mail-Betreff hier einfügen');
      expect(rendered_email.body).to.match(/Hallo Mina\./);
      expect(rendered_email.body).not.to.contain('=====');
    });
  });

  it('uses the actual recipient language when rendering a requestor email', function(){
    var email = new Email();

    return email.promise_rendered_email_template({
      template_name: 'foobar',
      context: {
        user: {
          name: 'Manager',
          preferred_language: 'en',
          reload_with_session_details: function(){ return bluebird.resolve(1); },
        },
        recipient: {preferred_language: 'de'},
      },
    }).then(function(rendered_email){
      expect(rendered_email.subject).to.equal('E-Mail-Betreff hier einfügen');
    });
  });

  it('renders emails in Korean for Korean-preferring recipients', function(){
    var email = new Email();

    return email.promise_rendered_email_template({
      template_name: 'foobar',
      context: {
        user: {
          name: 'Mina',
          preferred_language: 'ko',
          reload_with_session_details: function(){ return bluebird.resolve(1); },
        },
      },
    }).then(function(rendered_email){
      expect(rendered_email.subject).to.equal('이메일 제목');
      expect(rendered_email.body).to.match(/안녕하세요 Mina\./);
    });
  });
});

