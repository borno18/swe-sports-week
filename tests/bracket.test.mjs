import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createBracket, chooseWinner, championOf, renameEntries } from '../lib/bracket.ts';
import { initializeTournaments, listTournaments, mutateTournament } from '../lib/tournament-store.ts';

test('every lineup size 2–64 produces exactly n−1 played matches and one champion', () => {
  for (let count = 2; count <= 64; count++) {
    let bracket = createBracket(Array.from({ length: count }, (_, i) => `Team ${i+1}`).join('\n'));
    assert.equal(bracket.rounds.flat().filter(m => !m.bye).length, count - 1);
    for (let round = 0; round < bracket.rounds.length; round++) {
      for (const match of bracket.rounds[round]) {
        if (match.bye) continue;
        assert.ok(match.a && match.b, `Both sides resolved for ${count} entrants`);
        bracket = chooseWinner(bracket, match.id, match.a);
      }
    }
    assert.ok(championOf(bracket));
    assert.equal(bracket.rounds.flat().filter(m => m.completedAt).length, count-1);
  }
});

test('undo invalidates its dependent winners but preserves the other half', () => {
  let bracket = createBracket('A\nB\nC\nD\nE\nF\nG\nH');
  for (let r=0;r<bracket.rounds.length;r++) for (const m of bracket.rounds[r]) bracket = chooseWinner(bracket,m.id,m.a);
  bracket = chooseWinner(bracket,'r1m1',null);
  assert.equal(bracket.rounds[1][0].winner,null);
  assert.ok(bracket.rounds[1][1].winner);
  assert.equal(championOf(bracket),null);
  bracket = chooseWinner(bracket,'r1m1','p2');
  assert.equal(bracket.rounds[1][0].a,'p2');
  assert.equal(bracket.rounds[2][0].a,null);
});

test('rejects duplicate names, invalid entrants, unresolved matches and manual byes', () => {
  assert.throws(() => createBracket('A\na'), /unique/);
  assert.throws(() => createBracket('A'), /2 and 64/);
  assert.throws(() => createBracket('A\n'+'B'.repeat(81)), /80/);
  const b = createBracket('A\nB\nC');
  assert.throws(() => chooseWinner(b,'r1m1','not-an-entry'), /Both opponents/);
  assert.throws(() => chooseWinner(b,'r2m1','p1'), /Both opponents/);
  assert.throws(() => chooseWinner(b,'r1m2',null), /automatically/);
});

test('renaming preserves identity and all published results', () => {
  const b = chooseWinner(createBracket('A\nB'),'r1m1','p1');
  const renamed = renameEntries(b,'New A\nNew B');
  assert.equal(championOf(renamed).winner.name,'New A');
  assert.equal(renamed.rounds[0][0].winner,b.rounds[0][0].winner);
  assert.throws(() => renameEntries(b,'A\nB\nC'), /same number/);
});

test('persistent storage, stale saves, rollback, section isolation and undo are atomic', () => {
  const directory = mkdtempSync(join(tmpdir(),'sports-week-test-'));
  const path = join(directory,'test.db');
  let db = new DatabaseSync(path);
  try {
    initializeTournaments(db,[{slug:'dart',name:'Dart'},{slug:'chess',name:'Chess'}]);
    mutateTournament(db,'dart',0,'test-admin',{kind:'lineup',names:'Alice\nBob\nCarol'});
    assert.throws(() => mutateTournament(db,'dart',0,'test-admin',{kind:'reset'}), /Another update/);
    assert.throws(() => mutateTournament(db,'dart',1,'test-admin',{kind:'winner',matchId:'r2m1',entryId:'p1'}), /Both opponents/);
    assert.equal(listTournaments(db).find(t=>t.id==='dart').version,1);
    mutateTournament(db,'dart',1,'test-admin',{kind:'winner',matchId:'r1m1',entryId:'p2'});
    mutateTournament(db,'dart',2,'test-admin',{kind:'winner',matchId:'r2m1',entryId:'p2'});
    db.close(); db = new DatabaseSync(path);
    const saved = listTournaments(db).find(t=>t.id==='dart');
    assert.equal(championOf(saved.bracket).winner.name,'Bob');
    assert.equal(listTournaments(db).find(t=>t.id==='chess').bracket.entries.length,0);
    assert.equal(db.prepare('SELECT count(*) AS n FROM tournament_changes').get().n,3);
    mutateTournament(db,'dart',3,'test-admin',{kind:'winner',matchId:'r1m1',entryId:null});
    assert.equal(championOf(listTournaments(db).find(t=>t.id==='dart').bracket),null);
  } finally { db.close(); rmSync(directory,{recursive:true,force:true}); }
});
