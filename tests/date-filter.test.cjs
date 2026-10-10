const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Exercise the production parser and extraction functions without booting Chrome.
const source = fs.readFileSync(path.join(__dirname, '../content.js'), 'utf8');
const start = source.indexOf('  const DAYS_PER =');
const end = source.indexOf('  function getCurrentChannelIdFromDOM()');
const context = vm.createContext({});
vm.runInContext(source.slice(start, end), context);
const { publishedTextToDays: parse, extractPublishedText: extract } = context;

test('Why Files dates below 26 days remain visible; older dates are hidden', () => {
  for (const [label, days] of [
    ['5d ago', 5], ['8d ago', 8], ['9d ago', 9], ['12d ago', 12],
    ['2w ago', 14], ['3w ago', 21], ['26d ago', 26], ['27d ago', 27],
    ['4w ago', 28], ['1mo ago', 30], ['2mo ago', 60], ['1y ago', 365]
  ]) {
    assert.equal(parse(label), days, label);
    assert.equal(parse(label) > 26, days > 26, label);
  }
});

test('full dates, streamed dates, short units and unknown metadata', () => {
  for (const [label, days] of [
    ['5 days ago', 5], ['Streamed 2 weeks ago', 14], ['Premiered 8 days ago', 8],
    ['1h ago', 1/24], ['2m ago', 2/1440], ['1s ago', 1/86400],
    ['a day ago', 1], ['yesterday', 1], ['Live now', 0],
    ['a while ago', null], ['615K views', null], ['', null]
  ]) assert.equal(parse(label), days, label);
});

test('new card metadata prefers the full aria label over compact display text', () => {
  const card = {
    querySelectorAll: () => [{ getAttribute: () => '5 days ago', textContent: '5d ago' }]
  };
  assert.equal(extract(card), '5 days ago');
  assert.equal(parse(extract(card)), 5);
});

test('new card metadata works without an accessibility label', () => {
  const card = {
    querySelectorAll: () => [{ getAttribute: () => null, textContent: '2w ago' }]
  };
  assert.equal(parse(extract(card)), 14);
});
