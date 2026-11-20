import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('data.js', root), 'utf8');
const entries = JSON.parse(source.slice(source.indexOf('['), source.lastIndexOf(']') + 1));
const batch = JSON.parse(readFileSync(new URL('sources/1120-import.json', root), 'utf8'));
const moduleURL = new URL('src/catalog.js', root);

test('the title uses the requested library name', () => {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  assert.match(html, /<title>San's visual library<\/title>/);
});

test('every entry stays reachable in ordered gallery pages', async () => {
  assert.ok(existsSync(moduleURL), 'Gallery pagination has not been implemented');
  const { galleryPages } = await import(moduleURL);
  assert.equal(entries.length, 539);
  for (const category of new Set(entries.map(item => item.category))) {
    const items = entries.filter(item => item.category === category);
    const pages = galleryPages(items);
    assert.deepEqual(pages.flat().map(item => item.id), items.map(item => item.id));
    assert.ok(pages.every(page => page.length > 0 && page.length <= 6));
  }
  assert.deepEqual(galleryPages([]), []);
  assert.equal(galleryPages(entries.slice(0, 7)).length, 2);
});

test('every preview, including video posters, resolves to a local file', async () => {
  assert.ok(existsSync(moduleURL), 'Preview selection has not been implemented');
  const { previewFor } = await import(moduleURL);
  for (const entry of entries) {
    const path = previewFor(entry);
    assert.ok(existsSync(new URL(path, root)), `${entry.id}: missing ${path}`);
  }
  assert.equal(previewFor({ mediaType: 'animation', referenceVideo: 'assets/reference/color-source.mp4' }), 'assets/reference/color-source.jpg');
});

test('approved 1120 entries have complete cards and local video references', () => {
  assert.equal(new Set(entries.map(item => item.id)).size, entries.length);
  assert.equal(batch.entries.length, 26);
  for (const selected of batch.entries) {
    const entry = entries.find(item => item.id === selected.id);
    assert.ok(entry, `Missing ${selected.id}`);
    assert.deepEqual(Object.keys(entry).sort(), Object.keys(entries.find(item => item.id === 'skeleton-fill')).sort());
    for (const field of ['zh', 'en', 'description', 'prompt', 'promptLabel', 'example', 'referenceTime', 'credit']) {
      assert.ok(entry[field], `${entry.id}: missing ${field}`);
    }
    assert.equal(entry.standardName, entry.zh);
    assert.equal(entry.mediaType, 'video');
    assert.equal(entry.sourceUrl, entry.referenceVideo);
    for (const path of [entry.media, entry.poster, entry.referenceVideo, entry.referenceVideo.replace('.mp4', '.jpg')]) {
      assert.ok(existsSync(new URL(path, root)), `${entry.id}: missing ${path}`);
    }
    assert.match(entry.promptLabel, /整理补充/);
    assert.ok(entry.details.some(([name]) => name === '本地来源'));
  }
});
