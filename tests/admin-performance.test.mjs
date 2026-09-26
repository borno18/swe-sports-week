import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@libsql/client';
import { createConfiguredBracket, chooseWinner } from '../lib/bracket.ts';
import { readAdminTournaments } from '../lib/tournament-store.ts';
import { getSportRule } from '../lib/rules-store.ts';

test('admin overview returns accurate summaries and only the selected complete bracket', async () => {
  const db = createClient({ url: 'file::memory:' });
  try {
    await db.execute('CREATE TABLE tournaments (id TEXT, sport_slug TEXT, title TEXT, entry_kind TEXT, version INTEGER, bracket TEXT)');
    let bracket = createConfiguredBracket('A\nB\nC\nD', [{ name: 'Final', matchCount: 1, playersPerMatch: 2 }], true, { groupCount: 2, playersPerGroup: 2, advancePerGroup: 1 });
    bracket = chooseWinner(bracket, 'gs_g1r1m1', 'p1');
    for (const id of ['football', 'dart']) await db.execute({ sql: 'INSERT INTO tournaments VALUES(?,?,?,?,?,?)', args: [id, id, id, 'player', 2, JSON.stringify(bracket)] });
    const data = await readAdminTournaments(db, 'dart');
    assert.equal(data.selected.id, 'dart');
    assert.deepEqual(data.selected.bracket, bracket);
    assert.equal(data.tournaments[0].entryCount, 4);
    assert.equal(data.tournaments[0].decided, 1);
    assert.equal(data.tournaments[0].hasGroupStage, true);
    assert.equal('bracket' in data.tournaments[0], false);
    assert.equal((await readAdminTournaments(db, 'missing')).selected.id, 'football');
    assert.equal((await readAdminTournaments(db, 'dart', false)).selected, undefined);
    await db.execute('DELETE FROM tournaments');
    assert.equal((await readAdminTournaments(db)).selected, undefined);
  } finally { db.close(); }
});

test('viewing default rules does not write or overwrite organizer rules', async () => {
  const calls = [];
  const db = { execute: async query => { calls.push(typeof query === 'string' ? query : query.sql); return { rows: [] }; } };
  const rule = await getSportRule(db, 'football');
  assert.equal(rule.sportSlug, 'football');
  assert.equal(calls.length, 1);
  assert.match(calls[0], /^SELECT /);
});
