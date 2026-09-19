import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createClient } from '@libsql/client';
import {
  createRoundRobin,
  calculateStandings,
  championOf,
  createBracket,
  chooseWinner,
} from '../lib/bracket.ts';
import {
  initializeSports,
  listSports,
  addSport,
  deleteSport,
} from '../lib/sports-store.ts';
import {
  addTournament,
  deleteTournament,
  listTournaments,
  mutateTournament,
} from '../lib/tournament-store.ts';

test('Round Robin generates fair schedule for odd and even teams and calculates standings', () => {
  // Test with 5 teams (ODD number!)
  const bracket5 = createRoundRobin('Batch 19\nBatch 20\nBatch 21\nBatch 22\nBatch 23');
  assert.equal(bracket5.entries.length, 5);
  assert.equal(bracket5.format, 'round_robin');
  // With 5 teams + 1 dummy, there are 5 rounds
  assert.equal(bracket5.rounds.length, 5);
  // Total matches played in 1 round-robin with 5 teams = 5 * 4 / 2 = 10 matches
  const totalMatches5 = bracket5.rounds.flat().length;
  assert.equal(totalMatches5, 10);

  // Test with 4 teams (EVEN number!)
  const bracket4 = createRoundRobin('Alice\nBob\nCarol\nDave');
  assert.equal(bracket4.entries.length, 4);
  assert.equal(bracket4.rounds.length, 3);
  const totalMatches4 = bracket4.rounds.flat().length;
  assert.equal(totalMatches4, 6);

  // Test standings calculation
  // Record match 1: Alice wins against Bob (score 3 - 1)
  const match1 = bracket4.rounds[0][0];
  match1.scoreA = '3';
  match1.scoreB = '1';
  match1.winner = match1.a;

  const standings = calculateStandings(bracket4);
  assert.equal(standings[0].id, match1.a);
  assert.equal(standings[0].won, 1);
  assert.equal(standings[0].points, 3);
  assert.equal(standings[0].gd, 2);

  const loser = standings.find(s => s.id === match1.b);
  assert.equal(loser.lost, 1);
  assert.equal(loser.points, 0);
  assert.equal(loser.gd, -2);
});

test('Two-leg ties support 2 matches and aggregate scoring', () => {
  const bracket = createBracket('Team Alpha\nTeam Beta', 2);
  assert.equal(bracket.rounds.length, 1);
  const final = bracket.rounds[0][0];
  assert.equal(final.legs, 2);

  // Leg 1: Alpha 2 - 1 Beta
  final.scoreA = '2';
  final.scoreB = '1';
  // Leg 2: Beta 2 - 0 Alpha
  final.scoreA2 = '0';
  final.scoreB2 = '2';
  // Aggregate: Alpha 2, Beta 3 -> Beta wins
  const aggA = Number(final.scoreA) + Number(final.scoreA2);
  const aggB = Number(final.scoreB) + Number(final.scoreB2);
  assert.equal(aggA, 2);
  assert.equal(aggB, 3);

  const updated = chooseWinner(bracket, final.id, final.b);
  assert.equal(championOf(updated).winner.name, 'Team Beta');
});

test('Sports & Tournament Sections DB CRUD: add sport, add section, delete section, delete sport', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'sports-store-test-'));
  const dbPath = join(dir, 'test.db');
  const db = createClient({ url: `file:${dbPath}` });

  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS sports (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Indoor', 'Outdoor')),
      color TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      sport_slug TEXT NOT NULL,
      title TEXT NOT NULL COLLATE NOCASE,
      entry_kind TEXT NOT NULL CHECK(entry_kind IN ('player','team')),
      version INTEGER NOT NULL DEFAULT 0,
      bracket TEXT NOT NULL,
      UNIQUE(sport_slug, title)
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS tournament_changes (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      previous_bracket TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`);

    // 1. Initialize sports
    await initializeSports(db, [{ slug: 'dart', name: 'Dart', icon: '🎯', category: 'Indoor', color: '#ffb59d', detail: 'Singles', participants: 0, matches: 0, stage: '' }]);
    const initialSports = await listSports(db);
    assert.equal(initialSports.length, 1);
    assert.equal(initialSports[0].slug, 'dart');

    // 2. Add new sport (e.g. Volleyball)
    const newSport = await addSport(db, {
      name: 'Volleyball',
      icon: '🏐',
      category: 'Outdoor',
      color: '#ff5722',
      detail: '6 batch teams',
    });
    assert.equal(newSport.slug, 'volleyball');

    const sportsAfterAdd = await listSports(db);
    assert.equal(sportsAfterAdd.length, 2);

    // 3. Add tournament section with Round Robin format under volleyball
    const tId = await addTournament(db, 'volleyball', 'Volleyball Batch League', 'team', 'round_robin', 1);
    assert.ok(tId);

    const tournaments = await listTournaments(db);
    const vTourney = tournaments.find(t => t.id === tId);
    assert.ok(vTourney);
    assert.equal(vTourney.bracket.format, 'round_robin');

    // Mutate lineup with 5 teams
    await mutateTournament(db, tId, 0, 'admin-1', {
      kind: 'lineup',
      names: 'Batch 19\nBatch 20\nBatch 21\nBatch 22\nBatch 23',
      format: 'round_robin',
    });
    const updatedTourney = (await listTournaments(db)).find(t => t.id === tId);
    assert.equal(updatedTourney.bracket.entries.length, 5);
    assert.equal(updatedTourney.bracket.rounds.length, 5);

    // 4. Delete section
    await deleteTournament(db, tId);
    const afterDeleteTourneys = await listTournaments(db);
    assert.equal(afterDeleteTourneys.some(t => t.id === tId), false);

    // 5. Delete sport
    await deleteSport(db, 'volleyball');
    const sportsAfterDelete = await listSports(db);
    assert.equal(sportsAfterDelete.length, 1);
    assert.equal(sportsAfterDelete.some(s => s.slug === 'volleyball'), false);
  } finally {
    db.close();
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    } catch {}
  }
});
