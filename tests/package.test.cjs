const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('manifest uses MV3, minimal permissions, existing entrypoints, and matching versions', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, pkg.version);
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.deepEqual(manifest.host_permissions, ['https://www.youtube.com/*']);
  for (const file of [...manifest.content_scripts.flatMap(s => s.js), manifest.action.default_popup]) {
    assert.ok(fs.existsSync(path.join(root, file)), file);
  }
});
