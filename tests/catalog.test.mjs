import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@libsql/client';
import { initializeCatalog } from '../lib/catalog-store.ts';
import { sports } from '../lib/data.ts';

async function database() {
  const db = createClient({ url: 'file::memory:' });
  await db.batch([
    'CREATE TABLE sports (slug TEXT PRIMARY KEY,name TEXT,icon TEXT,category TEXT,color TEXT,detail TEXT,created_at INTEGER)',
    'CREATE TABLE tournaments (id TEXT PRIMARY KEY,sport_slug TEXT,title TEXT,entry_kind TEXT,bracket TEXT)',
  ], 'write');
  return db;
}

test('catalog bootstrap seeds once and preserves deleted sections and sports across restarts', async () => {
  const db = await database();
  try {
    await initializeCatalog(db, sports);
    assert.equal((await db.execute('SELECT * FROM sports')).rows.length, sports.length);
    assert.equal((await db.execute('SELECT * FROM tournaments')).rows.length, sports.length);
    await db.batch(['DELETE FROM tournaments', 'DELETE FROM sports'], 'write');
    await initializeCatalog(db, sports);
    assert.equal((await db.execute('SELECT * FROM tournaments')).rows.length, 0);
    assert.equal((await db.execute('SELECT * FROM sports')).rows.length, 0);
  } finally { db.close(); }
});

test('upgrading a populated database preserves its custom catalog and missing default sections', async () => {
  const db = await database();
  try {
    await db.execute("INSERT INTO sports VALUES('custom','Custom','🏆','Indoor','#ffffff','League',1)");
    await initializeCatalog(db, sports);
    assert.deepEqual((await db.execute('SELECT slug FROM sports')).rows.map(r => r.slug), ['custom']);
    assert.equal((await db.execute('SELECT * FROM tournaments')).rows.length, 0);
  } finally { db.close(); }
});
