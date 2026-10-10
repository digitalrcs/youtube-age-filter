const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../content.js'), 'utf8');

function fixture(t, html, settings = {}, url = 'https://www.youtube.com/') {
  const dom = new JSDOM(html, { url, runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const values = { 'ytAgeFilter.maxDays': '2', ...settings };
  const listeners = [];
  dom.window.chrome = {
    runtime: { getManifest: () => ({ version: 'test' }), onMessage: { addListener() {} } },
    storage: {
      local: {
        get: (keys, callback) => setTimeout(() => callback(Object.fromEntries(keys.map(k => [k, values[k]]))), 0),
        set: (changes, callback) => {
          Object.assign(values, changes);
          listeners.forEach(fn => fn(Object.fromEntries(Object.entries(changes).map(([k,v]) => [k, {newValue:v}])), 'local'));
          callback();
        }
      },
      onChanged: { addListener: fn => listeners.push(fn) }
    }
  };
  dom.window.eval(source);
  return dom.window;
}
const wait = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));
const card = (date, channel = 'example') => `<ytd-rich-item-renderer><a href='/watch?v=test'>Video</a><a href='/@${channel}'>${channel}</a><span class='ytContentMetadataViewModelMetadataText' aria-label='${date}'>${date}</span></ytd-rich-item-renderer>`;

test('old videos hide, whitelist overrides age, and Pause/Start restores and reapplies', async t => {
  const w = fixture(t, card('7 months ago') + card('1 day ago', 'recent') + card('1 year ago', 'allowed'), {
    'ytAgeFilter.whitelistChannels': JSON.stringify(['handle:allowed'])
  });
  await wait();
  const [old, recent, allowed] = w.document.querySelectorAll('ytd-rich-item-renderer');
  assert.equal(old.style.display, 'none');
  assert.notEqual(recent.style.display, 'none');
  assert.notEqual(allowed.style.display, 'none');
  w.document.getElementById('yt-age-filter-pause').click();
  await wait();
  assert.notEqual(old.style.display, 'none');
  assert.equal(w.document.getElementById('yt-age-filter-pause').textContent, 'Start');
  w.document.getElementById('yt-age-filter-pause').click();
  await wait();
  assert.equal(old.style.display, 'none');
});

test('metadata changes on reused cards trigger filtering and restoration', async t => {
  const w = fixture(t, card('1 day ago'));
  await wait();
  const el = w.document.querySelector('ytd-rich-item-renderer');
  const metadata = el.querySelector('span');
  metadata.setAttribute('aria-label', '7 months ago');
  metadata.textContent = '7mo ago';
  await wait();
  assert.equal(el.style.display, 'none');
  metadata.setAttribute('aria-label', '1 hour ago');
  metadata.textContent = '1h ago';
  await wait();
  assert.notEqual(el.style.display, 'none');
});

test('mixed sections retain full videos while pure Shorts shelves hide', async t => {
  const w = fixture(t, `<ytd-item-section-renderer>${card('1 day ago')}<ytd-reel-item-renderer><a href='/shorts/one'>Short</a></ytd-reel-item-renderer></ytd-item-section-renderer><grid-shelf-view-model><a href='/shorts/two'>Short</a></grid-shelf-view-model>`);
  await wait();
  assert.notEqual(w.document.querySelector('ytd-item-section-renderer').style.display, 'none');
  assert.equal(w.document.querySelector('ytd-reel-item-renderer').style.display, 'none');
  assert.equal(w.document.querySelector('grid-shelf-view-model').style.display, 'none');
});

test('paused startup leaves content visible, including late additions', async t => {
  const w = fixture(t, card('7 months ago'), { 'ytAgeFilter.enabled': false });
  await wait();
  w.document.body.insertAdjacentHTML('beforeend', card('1 year ago'));
  await wait();
  assert.equal(w.document.querySelectorAll('[data-yt-age-hidden="1"]').length, 0);
  assert.equal(w.document.getElementById('yt-age-filter-shorts-style'), null);
});

test('channel video pages honor handle exceptions without per-card channel links', async t => {
  const w = fixture(t, card('1 year ago').replace("<a href='/@example'>example</a>", ''), {
    'ytAgeFilter.whitelistChannels': JSON.stringify(['handle:example'])
  }, 'https://www.youtube.com/@example/videos');
  await wait();
  assert.notEqual(w.document.querySelector('ytd-rich-item-renderer').style.display, 'none');
});
