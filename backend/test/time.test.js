const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  isValidTimeZone, normalizeZone, startOfDay, startOfDayDaysAgo,
  localDateKey, localHM, localHour,
} = require('../src/utils/time');

const iso = (d) => d.toISOString();

test('normalizeZone falls back to UTC for missing/invalid zones', () => {
  assert.equal(normalizeZone('Asia/Kolkata'), 'Asia/Kolkata');
  assert.equal(normalizeZone(undefined), 'UTC');
  assert.equal(normalizeZone('Not/AZone'), 'UTC');
  assert.equal(isValidTimeZone('America/New_York'), true);
  assert.equal(isValidTimeZone('bogus'), false);
});

test('startOfDay for UTC is plain midnight', () => {
  assert.equal(iso(startOfDay(new Date('2026-03-15T10:00:00Z'), 'UTC')), '2026-03-15T00:00:00.000Z');
  assert.equal(iso(startOfDay(new Date('2026-03-15T00:00:00Z'), 'UTC')), '2026-03-15T00:00:00.000Z');
});

test('startOfDay for Asia/Kolkata (+5:30) anchors to local midnight', () => {
  // 10:00 UTC == 15:30 IST on Mar 15 -> local midnight Mar 15 IST == Mar 14 18:30 UTC
  assert.equal(iso(startOfDay(new Date('2026-03-15T10:00:00Z'), 'Asia/Kolkata')), '2026-03-14T18:30:00.000Z');
  // 02:00 UTC == 07:30 IST Mar 15 -> still Mar 15 local -> same anchor
  assert.equal(iso(startOfDay(new Date('2026-03-15T02:00:00Z'), 'Asia/Kolkata')), '2026-03-14T18:30:00.000Z');
  // The instant just before local midnight belongs to the PREVIOUS local day
  assert.equal(iso(startOfDay(new Date('2026-03-14T18:29:59Z'), 'Asia/Kolkata')), '2026-03-13T18:30:00.000Z');
  // ...and exactly at local midnight belongs to the new day
  assert.equal(iso(startOfDay(new Date('2026-03-14T18:30:00Z'), 'Asia/Kolkata')), '2026-03-14T18:30:00.000Z');
});

test('startOfDay handles a DST zone across the spring-forward boundary', () => {
  // US DST 2026 starts Sun Mar 8 02:00 local. Before it NY is EST (-5).
  // Mar 8 local midnight EST == 05:00 UTC.
  assert.equal(iso(startOfDay(new Date('2026-03-08T12:00:00Z'), 'America/New_York')), '2026-03-08T05:00:00.000Z');
  // Mar 9 (after DST) NY is EDT (-4); local midnight == 04:00 UTC.
  assert.equal(iso(startOfDay(new Date('2026-03-09T12:00:00Z'), 'America/New_York')), '2026-03-09T04:00:00.000Z');
});

test('startOfDayDaysAgo steps whole local days (DST-safe)', () => {
  // 30 days before Mar 15 IST anchor
  const anchor = startOfDay(new Date('2026-03-15T10:00:00Z'), 'Asia/Kolkata'); // 2026-03-14T18:30Z
  const back30 = startOfDayDaysAgo(new Date('2026-03-15T10:00:00Z'), 'Asia/Kolkata', 30);
  assert.equal(iso(back30), '2026-02-12T18:30:00.000Z');
  assert.ok(back30 < anchor);
  // Across NY spring-forward: 2 days before Mar 9 -> Mar 7 (still EST, 05:00 UTC)
  assert.equal(iso(startOfDayDaysAgo(new Date('2026-03-09T12:00:00Z'), 'America/New_York', 2)), '2026-03-07T05:00:00.000Z');
});

test('localDateKey / localHM / localHour reflect the zone', () => {
  const d = new Date('2026-03-14T20:00:00Z'); // 01:30 IST Mar 15
  assert.equal(localDateKey(d, 'Asia/Kolkata'), '2026-03-15');
  assert.equal(localDateKey(d, 'UTC'), '2026-03-14');
  assert.equal(localHM(d, 'Asia/Kolkata'), '01:30');
  assert.equal(localHM(d, 'UTC'), '20:00');
  assert.equal(localHour(d, 'Asia/Kolkata'), 1);
  assert.equal(localHour(d, 'UTC'), 20);
});
