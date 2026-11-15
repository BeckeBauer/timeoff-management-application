'use strict';

const express_handlebars = require('express-handlebars');
const handlebars_library = require('handlebars');

const translatable_attribute = /\b(alt|aria-label|data-content|data-original-title|placeholder|title|value)(\s*=\s*)(["'])(.*?)\3/gi;

function localized_text(text, strings) {
  if (! /[A-Za-z]/.test(text)) {
    return text;
  }

  const leading = text.match(/^\s*/)[0];
  const trailing = text.match(/\s*$/)[0];
  const phrase = text.slice(leading.length, text.length - trailing.length);

  if (! phrase) {
    return text;
  }

  if (strings) {
    strings.add(phrase);
  }

  const handlebars_string = JSON.stringify(phrase)
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n');

  return leading + `{{{t ${handlebars_string}}}}` + trailing;
}

function localized_attribute_text(text, strings) {
  return text.split(/(\{\{\{[\s\S]*?\}\}\}|\{\{[\s\S]*?\}\})/g)
    .map(part => part.startsWith('{{') ? part : localized_text(part, strings))
    .join('');
}

function localized_tag(tag, strings) {
  return tag.replace(translatable_attribute, (attribute, name, equals, quote, value) => {
    if (
      /^(?:ldaps?:\/\/|(?:cn|dc)=)/i.test(value.trim())
    ) {
      return attribute;
    }

    return name + equals + quote + localized_attribute_text(value, strings) + quote;
  });
}

function transform_template(template, strings) {
  let output = '';
  let inside_tag = false;
  let tag_buffer = '';
  let raw_tag = null;
  let index = 0;

  while (index < template.length) {
    if (raw_tag) {
      const closing_tag = template.toLowerCase().indexOf(`</${raw_tag}`, index);
      if (closing_tag < 0) {
        output += template.slice(index);
        break;
      }

      output += template.slice(index, closing_tag);
      index = closing_tag;
      raw_tag = null;
      continue;
    }

    if (template.startsWith('{{', index)) {
      const is_triple = template.startsWith('{{{', index);
      const closing = is_triple ? '}}}' : '}}';
      const end = template.indexOf(closing, index + (is_triple ? 3 : 2));
      const token_end = end < 0 ? template.length : end + closing.length;
      const token = template.slice(index, token_end);

      if (inside_tag) {
        tag_buffer += token;
      } else {
        output += token;
      }
      index = token_end;
      continue;
    }

    if (template.startsWith('<!--', index)) {
      const end = template.indexOf('-->', index + 4);
      const token_end = end < 0 ? template.length : end + 3;
      const token = template.slice(index, token_end);

      if (inside_tag) {
        tag_buffer += token;
      } else {
        output += token;
      }
      index = token_end;
      continue;
    }

    const character = template[index];

    if (inside_tag) {
      tag_buffer += character;
      index += 1;

      if (character === '>') {
        output += localized_tag(tag_buffer, strings);
        const opening_raw_tag = tag_buffer.match(/^<(script|style)\b/i);
        if (opening_raw_tag && ! /\/\s*>$/.test(tag_buffer)) {
          raw_tag = opening_raw_tag[1].toLowerCase();
        }
        inside_tag = false;
        tag_buffer = '';
      }
      continue;
    }

    if (
      character === '<'
      && /^<\/?[A-Za-z!]/.test(template.slice(index))
    ) {
      inside_tag = true;
      tag_buffer = character;
      index += 1;
      continue;
    }

    const next_tag = template.indexOf('<', index);
    const next_expression = template.indexOf('{{', index);
    const boundaries = [next_tag, next_expression].filter(position => position >= 0);
    const end = boundaries.length ? Math.min(...boundaries) : template.length;

    if (end === index) {
      output += character;
      index += 1;
    } else {
      output += localized_text(template.slice(index, end), strings);
      index = end;
    }
  }

  if (inside_tag) {
    output += tag_buffer;
  }

  return output;
}

function create_handlebars_engine(options) {
  const handlebars = handlebars_library.create();
  const original_compile = handlebars.compile.bind(handlebars);

  handlebars.compile = (template, compile_options) => original_compile(
    transform_template(template),
    compile_options
  );

  return express_handlebars.create(Object.assign({}, options, {
    handlebars,
  }));
}

function get_template_strings(template) {
  const strings = new Set();
  transform_template(template, strings);
  return Array.from(strings);
}

module.exports = {
  create_handlebars_engine,
  get_template_strings,
};
