import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { initializeTournaments, listTournaments, mutateTournament } from "../lib/tournament-store.ts";
import {
  createConfiguredBracket,
  roundName,
  chooseWinner,
  defaultRoundName,
} from "../lib/bracket.ts";

test("persisted group scores qualify entrants, invalidate corrected results, and preserve setup on reset", async () => {
  const db = createClient({ url: "file::memory:" });
  try {
    await db.execute(`CREATE TABLE tournaments (id TEXT PRIMARY KEY, sport_slug TEXT NOT NULL, title TEXT NOT NULL, entry_kind TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0, bracket TEXT NOT NULL, UNIQUE(sport_slug,title))`);
    await db.execute(`CREATE TABLE tournament_changes (id TEXT PRIMARY KEY, tournament_id TEXT NOT NULL, actor_id TEXT NOT NULL, action TEXT NOT NULL, previous_bracket TEXT NOT NULL, created_at INTEGER NOT NULL)`);
    await initializeTournaments(db, [{ slug: "football", name: "Football" }]);
    let version = 0;
    const save = async mutation => { await mutateTournament(db, "football", version, "test", mutation); version++; return (await listTournaments(db))[0].bracket; };
    const setup = { kind: "lineup", names: "A\nB\nC\nD", roundConfig: [{ name: "Final", matchCount: 1, playersPerMatch: 2 }], hasGroupStage: true, groupStageConfig: { groupCount: 2, playersPerGroup: 2, advancePerGroup: 1 } };
    const score = (matchId, a, b) => ({ kind: "details", matchId, date: "", time: "", venue: "", scoreA: "", scoreB: "", scores: { [a[0]]: a[1], [b[0]]: b[1] } });
    await save(setup);
    await save(score("gs_g1r1m1", ["p1", "2"], ["p2", "0"]));
    let bracket = await save(score("gs_g2r1m1", ["p3", "0"], ["p4", "3"]));
    assert.deepEqual(bracket.rounds[0][0].participants, ["p1", "p4"]);
    bracket = await save({ kind: "winner", matchId: "r1m1", entryId: "p4" });
    assert.equal(bracket.rounds[0][0].winner, "p4");
    await assert.rejects(mutateTournament(db, "football", 0, "test", { kind: "reset" }), /Another update/);
    bracket = await save(score("gs_g1r1m1", ["p1", "0"], ["p2", "2"]));
    assert.deepEqual(bracket.rounds[0][0].participants, ["p2", "p4"]);
    assert.equal(bracket.rounds[0][0].winner, null);
    bracket = await save(score("gs_g1r1m1", ["p1", ""], ["p2", ""]));
    assert.deepEqual(bracket.rounds[0][0].sourceSlots, [null, "p4"]);
    bracket = await save({ kind: "reset" });
    assert.deepEqual(bracket.roundConfig, setup.roundConfig);
    assert.equal(bracket.hasGroupStage, true);
    bracket = await save(setup);
    assert.equal(bracket.groupStageRounds.flat().length, 2);
  } finally { db.close(); }
});

test("creates configured bracket with custom round names, match counts, and players per match", () => {
  const roundConfigs = [
    { name: "Quarter-finals", matchCount: 4, playersPerMatch: 2 },
    { name: "Semi-finals", matchCount: 2, playersPerMatch: 2 },
    { name: "Championship Final", matchCount: 1, playersPerMatch: 2 },
  ];

  const names = [
    "Player 1", "Player 2", "Player 3", "Player 4",
    "Player 5", "Player 6", "Player 7", "Player 8",
  ].join("\n");

  const bracket = createConfiguredBracket(names, roundConfigs, false);

  assert.equal(bracket.rounds.length, 3);
  assert.equal(bracket.rounds[0].length, 4);
  assert.equal(bracket.rounds[1].length, 2);
  assert.equal(bracket.rounds[2].length, 1);

  // Check round names
  assert.equal(roundName(0, 3, "knockout", roundConfigs), "Quarter-finals");
  assert.equal(roundName(1, 3, "knockout", roundConfigs), "Semi-finals");
  assert.equal(roundName(2, 3, "knockout", roundConfigs), "Championship Final");

  // Check first round matchups
  assert.equal(bracket.rounds[0][0].a, "p1");
  assert.equal(bracket.rounds[0][0].b, "p2");
  assert.equal(bracket.rounds[0][1].a, "p3");
  assert.equal(bracket.rounds[0][1].b, "p4");

  // Win matches and check propagation
  const b1 = chooseWinner(bracket, "r1m1", "p1");
  const b2 = chooseWinner(b1, "r1m2", "p3");

  // Semi-final match 1 should now have p1 vs p3
  assert.equal(b2.rounds[1][0].a, "p1");
  assert.equal(b2.rounds[1][0].b, "p3");
});

test("creates configured bracket with group stage and knockouts", () => {
  const roundConfigs = [
    { name: "Semi-finals", matchCount: 2, playersPerMatch: 2 },
    { name: "Grand Final", matchCount: 1, playersPerMatch: 2 },
  ];

  const groupConfig = {
    groupCount: 2,
    playersPerGroup: 4,
    advancePerGroup: 2,
  };

  const names = [
    "Team A1", "Team A2", "Team A3", "Team A4",
    "Team B1", "Team B2", "Team B3", "Team B4",
  ].join("\n");

  const bracket = createConfiguredBracket(names, roundConfigs, true, groupConfig);

  assert.equal(bracket.hasGroupStage, true);
  assert.ok(bracket.groupStageRounds);
  assert.ok(bracket.groupStageRounds.length > 0);

  // Check total group matches: 2 groups of 4 = 6 matches per group = 12 matches total
  const totalGroupMatches = bracket.groupStageRounds.flat().length;
  assert.equal(totalGroupMatches, 12);

  // Check knockout rounds exist
  assert.equal(bracket.rounds.length, 2);
  assert.equal(bracket.rounds[0].length, 2);
  assert.equal(bracket.rounds[1].length, 1);
});

test("defaultRoundName generates sensible defaults based on remaining rounds", () => {
  assert.equal(defaultRoundName(0, 1), "Final");
  assert.equal(defaultRoundName(0, 2), "Semi-finals");
  assert.equal(defaultRoundName(1, 2), "Final");
  assert.equal(defaultRoundName(0, 3), "Quarter-finals");
  assert.equal(defaultRoundName(1, 3), "Semi-finals");
  assert.equal(defaultRoundName(2, 3), "Final");
  assert.equal(defaultRoundName(0, 4), "Round of 16");
});

import { confirmGroupQualifiers, tournamentGroups, isMatchReady, championOf, getMatchParticipants } from '../lib/bracket.ts';

test('groups stay out of knockouts until qualified, advance, and invalidate dependent results on undo', () => {
  let bracket = createConfiguredBracket('A\nB\nC\nD', [{name:'Grand Final',matchCount:1,playersPerMatch:2}], true, {groupCount:2,playersPerGroup:2,advancePerGroup:1});
  assert.deepEqual(bracket.rounds[0][0].sourceSlots,[null,null]);
  bracket = chooseWinner(bracket,'gs_g1r1m1','p1');
  assert.equal(isMatchReady(bracket.rounds[0][0]),false);
  assert.throws(()=>chooseWinner(bracket,'r1m1','p1'),/must qualify/);
  bracket = chooseWinner(bracket,'gs_g2r1m1','p3');
  assert.deepEqual(bracket.rounds[0][0].sourceSlots,['p1','p3']);
  bracket = chooseWinner(bracket,'r1m1','p3');
  assert.equal(championOf(bracket).winner.name,'C');
  bracket = chooseWinner(bracket,'gs_g1r1m1',null);
  assert.equal(championOf(bracket),null);
  assert.equal(bracket.rounds[0][0].winner,null);
  assert.equal(bracket.groupStageRounds.flat().find(m=>m.id==='gs_g2r1m1').winner,'p3');
});

test('tied groups require a valid tie-break decision and reject incomplete or duplicate qualifiers', () => {
  let bracket = createConfiguredBracket('A\nB\nC\nD', [{name:'Final',matchCount:1,playersPerMatch:2}], true, {groupCount:2,playersPerGroup:2,advancePerGroup:1});
  assert.throws(()=>confirmGroupQualifiers(bracket,'g1',['p1']),/Finish every/);
  bracket = chooseWinner(bracket,'gs_g1r1m1','draw');
  assert.equal(tournamentGroups(bracket)[0].tied,true);
  assert.deepEqual(tournamentGroups(bracket)[0].qualifiers,[]);
  assert.throws(()=>confirmGroupQualifiers(bracket,'g1',['p3']),/standings order/);
  bracket = confirmGroupQualifiers(bracket,'g1',['p2']);
  assert.equal(bracket.rounds[0][0].a,'p2');
  bracket = chooseWinner(bracket,'gs_g1r1m1','p1');
  assert.equal(bracket.groupQualifiers.g1,undefined);
  assert.equal(bracket.rounds[0][0].a,'p1');
});

test('configured multiplayer draws for 2–40 players finish without duplicate or dropped entrants', () => {
  for (const playersPerMatch of [2,3,4,8]) for (let count=2;count<=40;count++) {
    const configs=[];
    let incoming=count;
    do {
      const matches=Math.ceil(incoming/playersPerMatch);
      configs.push({name:`Stage ${configs.length+1}`,matchCount:matches,playersPerMatch,playerCount:incoming});
      incoming=matches;
    } while(incoming>1);
    let bracket=createConfiguredBracket(Array.from({length:count},(_,i)=>`P${i}`).join('\n'),configs);
    assert.equal(new Set(bracket.rounds[0].flatMap(getMatchParticipants)).size,count);
    for (let r=0;r<bracket.rounds.length;r++) for (const snapshot of bracket.rounds[r]) {
      const match=bracket.rounds[r].find(m=>m.id===snapshot.id);
      if (!match.bye) {
        assert.ok(isMatchReady(match),`ready ${count}/${playersPerMatch}/${match.id}`);
        bracket=chooseWinner(bracket,match.id,getMatchParticipants(match)[0]);
      }
    }
    assert.ok(championOf(bracket));
  }
});

test('fixed source slots preserve identity when results arrive out of order', () => {
  let bracket=createConfiguredBracket('A\nB\nC\nD\nE\nF\nG\nH',[
    {name:'Opener',matchCount:4,playersPerMatch:2}, {name:'Final',matchCount:1,playersPerMatch:4},
  ]);
  bracket=chooseWinner(bracket,'r1m4','p8');
  assert.deepEqual(bracket.rounds[1][0].sourceSlots,[null,null,null,'p8']);
  assert.throws(()=>chooseWinner(bracket,'r2m1','p8'),/must qualify/);
  for(const id of ['r1m1','r1m2','r1m3']) bracket=chooseWinner(bracket,id,bracket.rounds[0].find(m=>m.id===id).a);
  bracket=chooseWinner(bracket,'r2m1','p1');
  bracket.rounds[1][0].scores={p1:'10',p8:'5'};
  bracket=chooseWinner(bracket,'r1m4','p7');
  assert.equal(bracket.rounds[1][0].winner,null);
  assert.deepEqual(bracket.rounds[1][0].scores,{});
});

test('invalid capacities, malformed configs, incomplete groups and unsupported two-leg multiplayer fail loudly', () => {
  const names='A\nB\nC\nD';
  assert.throws(()=>createConfiguredBracket(names,[{name:'Final',matchCount:1,playersPerMatch:2}]),/cannot fit/);
  assert.throws(()=>createConfiguredBracket(names,[{name:'Final',matchCount:1,playersPerMatch:4,playerCount:3}]),/must have 4/);
  assert.throws(()=>createConfiguredBracket(names,[{name:'Final',matchCount:1,playersPerMatch:4}],true,{groupCount:2,playersPerGroup:3,advancePerGroup:1}),/exactly 6/);
  assert.throws(()=>createConfiguredBracket(names,[{name:'Final',matchCount:1,playersPerMatch:4}],false,undefined,2),/Two-leg/);
  for(const value of [null,{},[],[{name:'Final',matchCount:NaN,playersPerMatch:2}], [{name:'Final',matchCount:1.5,playersPerMatch:2}]]) assert.throws(()=>createConfiguredBracket(names,value));
});
