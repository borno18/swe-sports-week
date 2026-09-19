import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createClient } from '@libsql/client';
import { listAnnouncements, addAnnouncement, deleteAnnouncement } from '../lib/announcement-store.ts';

test('announcements CRUD: create, list, validation, and delete in database', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'sports-week-ann-test-'));
  const dbPath = join(dir, 'test.db');
  const db = createClient({ url: `file:${dbPath}` });

  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      level TEXT NOT NULL CHECK (level IN ('general', 'important', 'urgent', 'update')),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL
    )`);

    await db.execute({
      sql: `INSERT INTO users (id, name, email, password_hash, password_salt, role, active, created_at, updated_at)
            VALUES ('user-1', 'Sports Admin', 'admin@example.com', 'h', 's', 'SUPER_ADMIN', 1, 100, 100)`,
    });

    // 1. Initially empty
    const initialList = await listAnnouncements(db);
    assert.equal(initialList.length, 0);

    // 2. Add announcements
    const id1 = await addAnnouncement(db, {
      level: 'important',
      title: 'Rain Delay',
      body: 'Football semi-final rescheduled to 4:00 PM on SUST Ground.',
      time: 'Day 3 · 2:30 PM',
      createdBy: 'user-1',
    });
    assert.ok(id1);

    const id2 = await addAnnouncement(db, {
      level: 'urgent',
      title: 'Venue Change for Chess',
      body: 'Chess matches moved to Seminar Hall 2 due to technical maintenance.',
      createdBy: 'user-1',
    });
    assert.ok(id2);

    // 3. List announcements and check fields
    const list = await listAnnouncements(db);
    assert.equal(list.length, 2);

    const urgentNotice = list.find(a => a.id === id2);
    assert.ok(urgentNotice);
    assert.equal(urgentNotice.level, 'urgent');
    assert.equal(urgentNotice.title, 'Venue Change for Chess');
    assert.equal(urgentNotice.authorName, 'Sports Admin');
    assert.ok(urgentNotice.time); // auto-populated time

    // 4. Validation errors
    await assert.rejects(
      async () => addAnnouncement(db, { level: 'invalid', title: 'Test', body: 'Test', createdBy: 'user-1' }),
      /Invalid announcement level/
    );
    await assert.rejects(
      async () => addAnnouncement(db, { level: 'general', title: '', body: 'Test', createdBy: 'user-1' }),
      /Title must be between 1 and 150/
    );
    await assert.rejects(
      async () => addAnnouncement(db, { level: 'general', title: 'Test', body: '', createdBy: 'user-1' }),
      /Announcement body must be between 1 and 2,000/
    );

    // 5. Delete announcement
    await deleteAnnouncement(db, id1);
    const afterDelete = await listAnnouncements(db);
    assert.equal(afterDelete.length, 1);
    assert.equal(afterDelete[0].id, id2);
  } finally {
    db.close();
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    } catch {}
  }
});
