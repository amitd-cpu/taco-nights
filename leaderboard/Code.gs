/**
 * Taco Nights leaderboard - Google Apps Script web app backed by a Google Sheet.
 *
 * Setup (about 3 minutes, once):
 *  1. Go to https://sheets.new and create an empty spreadsheet (name it "Taco Nights scores").
 *  2. Extensions -> Apps Script. Delete the sample code, paste this whole file, save.
 *  3. Deploy -> New deployment -> type "Web app".
 *       Execute as: Me.      Who has access: Anyone.
 *     Authorize when asked. Copy the Web app URL (ends in /exec).
 *  4. In the game's index.html set  const LEADERBOARD_URL = '<that URL>';  then commit and push.
 *     (Also bump CACHE in sw.js so installed phones refresh.)
 *
 * After editing this script later: Deploy -> Manage deployments -> edit -> New version, or the
 * URL keeps serving the old code.
 *
 * GET  -> JSON array of the last 3000 score rows: {t, id, name, level, earned, stars}
 * POST -> body JSON {id, name, level, earned, stars}; appends one row. Values are clamped.
 */
var SHEET = 'scores';
var MAX_ROWS = 3000;

function doGet() {
  var values = sheet().getDataRange().getValues().slice(1);
  if (values.length > MAX_ROWS) values = values.slice(values.length - MAX_ROWS);
  var out = values.map(function (r) { return { t: r[0], id: r[1], name: r[2], level: r[3], earned: r[4], stars: r[5] }; });
  return json(out);
}

function doPost(e) {
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'bad json' }); }
  var name = String(d.name || '').replace(/[<>]/g, '').trim().slice(0, 20);
  var id = String(d.id || '').replace(/[^a-z0-9]/gi, '').slice(0, 40);
  var level = clamp(Number(d.level) | 0, 1, 20);
  var earned = clamp(Number(d.earned) | 0, 0, 5000);
  var stars = clamp(Number(d.stars) | 0, 0, 3);
  if (!name || !id) return json({ ok: false, error: 'name and id required' });
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try { sheet().appendRow([new Date(), id, name, level, earned, stars]); }
  finally { lock.releaseLock(); }
  return json({ ok: true });
}

function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(SHEET);
  if (!s) { s = ss.insertSheet(SHEET); s.appendRow(['time', 'id', 'name', 'level', 'earned', 'stars']); }
  return s;
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, isNaN(v) ? a : v)); }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
