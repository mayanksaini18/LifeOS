// Timezone-aware day-boundary helpers. Dependency-free (uses the built-in Intl
// timezone database). A user's "day" is bucketed by their IANA timezone
// (e.g. "Asia/Kolkata"); an entry's `date` is stored as the UTC instant of the
// user's LOCAL midnight, so "today" matches the user's real calendar day.

const VALID_TZ_CACHE = new Map();

function isValidTimeZone(tz) {
  if (!tz || typeof tz !== 'string') return false;
  if (VALID_TZ_CACHE.has(tz)) return VALID_TZ_CACHE.get(tz);
  let ok = true;
  try {
    // Throws RangeError for an unknown timezone.
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
  } catch {
    ok = false;
  }
  VALID_TZ_CACHE.set(tz, ok);
  return ok;
}

// Fall back to UTC for missing/invalid zones (existing users, bad input).
function normalizeZone(tz) {
  return isValidTimeZone(tz) ? tz : 'UTC';
}

// Offset in ms of `zone` at instant `date`: (local wall-clock) - (UTC).
// e.g. Asia/Kolkata -> +19800000 (5h30m).
function zoneOffsetMs(date, zone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: zone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = {};
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
  const hour = p.hour === '24' ? 0 : Number(p.hour); // some engines emit '24' at midnight
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, hour, +p.minute, +p.second);
  return asUTC - date.getTime();
}

// The local calendar Y/M/D in `zone` for instant `date`.
function localYMD(date, zone) {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const p = {};
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
  return { y: +p.year, m: +p.month, d: +p.day };
}

// UTC instant of local midnight for a specific local calendar date (y-m-d) in
// `zone`. Treat the midnight wall-clock as if UTC, shift by the zone offset, and
// correct once if the offset differs across a DST boundary.
function localMidnightToUtc(y, m, d, zone) {
  const utcGuess = Date.UTC(y, m - 1, d);
  const offset = zoneOffsetMs(new Date(utcGuess), zone);
  let result = utcGuess - offset;
  const offset2 = zoneOffsetMs(new Date(result), zone);
  if (offset2 !== offset) result = utcGuess - offset2;
  return new Date(result);
}

// UTC Date at the START of the local day (midnight in `timeZone`) containing `date`.
function startOfDay(date, timeZone) {
  const zone = normalizeZone(timeZone);
  const { y, m, d } = localYMD(date, zone);
  return localMidnightToUtc(y, m, d, zone);
}

// UTC Date at the start of the local day `days` before the local day of `date`.
// Steps by CALENDAR days on the local date (Date.UTC normalizes month/year
// rollover), so it can't drift by the DST-lost/gained hour like ms subtraction.
function startOfDayDaysAgo(date, timeZone, days) {
  const zone = normalizeZone(timeZone);
  const { y, m, d } = localYMD(date, zone);
  const t = new Date(Date.UTC(y, m - 1, d - days));
  return localMidnightToUtc(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), zone);
}

// UTC instant of local midnight for a "YYYY-MM-DD" calendar-date key in `timeZone`.
function startOfLocalDate(key, timeZone) {
  const [y, m, d] = String(key).split('-').map(Number);
  return localMidnightToUtc(y, m, d, normalizeZone(timeZone));
}

// Resolve a client-supplied day input to the UTC start-of-local-day:
//  - falsy            -> today (local)
//  - "YYYY-MM-DD"     -> that calendar day (local)
//  - anything else    -> the local day containing that instant
function resolveDayStart(input, timeZone) {
  if (!input) return startOfDay(new Date(), timeZone);
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return startOfLocalDate(input, timeZone);
  }
  return startOfDay(new Date(input), timeZone);
}

// Local weekday (0=Sun..6=Sat) of the local calendar date containing `date`.
function localWeekday(date, timeZone) {
  const { y, m, d } = localYMD(date, normalizeZone(timeZone));
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// Local date key "YYYY-MM-DD" in `timeZone`.
function localDateKey(date, timeZone) {
  const { y, m, d } = localYMD(date, normalizeZone(timeZone));
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Local wall-clock "HH:MM" (24h) in `timeZone` — for matching reminder times.
function localHM(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: normalizeZone(timeZone), hour12: false,
    hour: '2-digit', minute: '2-digit',
  });
  const p = {};
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
  const hour = p.hour === '24' ? '00' : p.hour;
  return `${hour}:${p.minute}`;
}

// Local hour (0-23) in `timeZone` — for the greeting.
function localHour(date, timeZone) {
  return Number(localHM(date, timeZone).slice(0, 2));
}

module.exports = {
  isValidTimeZone,
  normalizeZone,
  zoneOffsetMs,
  startOfDay,
  startOfDayDaysAgo,
  startOfLocalDate,
  resolveDayStart,
  localWeekday,
  localDateKey,
  localHM,
  localHour,
};
