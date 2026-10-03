import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createClient } from '@libsql/client';

if (fs.existsSync('.env.local')) {
  const env = fs.readFileSync('.env.local', 'utf-8');
  for (const line of env.split('\n')) {
    const match = line.trim().match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  }
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function main() {
  console.log('=== UPDATING CARROM FINAL RESULTS ===\n');

  const now = Date.now();
  const oct2Timestamp = new Date('2026-10-02T20:30:00+06:00').getTime();
  const oct3Timestamp = new Date('2026-10-03T22:30:00+06:00').getTime();

  const carromEntries = [
    { id: 'p1', name: 'Tareq & Sajeeb' },
    { id: 'p2', name: 'Team Nabil (24)' },
    { id: 'p3', name: 'Team Jobail (23)' },
    { id: 'p4', name: 'Arnob Sabit & Najmul' }
  ];

  const carromBracket = {
    entries: carromEntries,
    rounds: [
      // Round 0: Semi-Finals
      [
        {
          id: 'sf1',
          round: 0,
          position: 0,
          a: 'p1',
          b: 'p2',
          winner: 'p1',
          bye: false,
          date: '2026-10-02',
          time: '18:45',
          venue: 'IICT',
          scoreA: 'W',
          scoreB: 'L',
          completedAt: oct2Timestamp,
          legs: 1
        },
        {
          id: 'sf2',
          round: 0,
          position: 1,
          a: 'p3',
          b: 'p4',
          winner: 'p4',
          bye: false,
          date: '2026-10-02',
          time: '19:30',
          venue: 'IICT',
          scoreA: 'L',
          scoreB: 'W',
          completedAt: oct2Timestamp,
          legs: 1
        }
      ],
      // Round 1: Grand Final
      [
        {
          id: 'final',
          round: 1,
          position: 0,
          a: 'p4',
          b: 'p1',
          winner: 'p4',
          bye: false,
          date: '2026-10-03',
          time: '20:30',
          venue: 'IICT',
          scoreA: 'Winner (Champion)',
          scoreB: 'Runner-Up',
          completedAt: oct3Timestamp,
          legs: 1
        }
      ]
    ],
    format: 'knockout',
    legs: 1
  };

  const carromRes = await client.execute("SELECT version FROM tournaments WHERE id = 'carrom'");
  const carromVersion = carromRes.rows.length > 0 ? Number(carromRes.rows[0].version) + 1 : 1;

  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ?, entry_kind = ? WHERE id = ?',
    args: [JSON.stringify(carromBracket), carromVersion, 'team', 'carrom']
  });

  const detailText = '🏆 Champion: Arnob Sabit & Najmul · 🥈 Runner-Up: Tareq & Sajeeb';
  await client.execute({
    sql: 'UPDATE sports SET detail = ? WHERE slug = ?',
    args: [detailText, 'carrom']
  });

  console.log(`✓ Carrom tournament updated to v${carromVersion}`);
  console.log(`✓ Sports table detail updated: ${detailText}`);

  // Insert Announcement
  const userRes = await client.execute("SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1").catch(() => ({ rows: [] }));
  const adminId = userRes.rows.length > 0 ? String(userRes.rows[0].id) : null;

  const announcement = {
    id: randomUUID(),
    level: 'important',
    title: '🏆 ক্যারম (Carrom) টুর্নামেন্ট গ্র্যান্ড ফাইনাল: অপরাজিত চ্যাম্পিয়ন Arnob Sabit & Najmul!',
    body:
      '🏆🔥 CARROM TOURNAMENT — FINAL RESULT 🔥🏆\n\n' +
      '👑 CHAMPIONS 👑\n' +
      '🏆 Arnob Sabit & Najmul 🏆\n\n' +
      '🥈 RUNNER-UP\n' +
      '🥈 Tareq & Sajeeb 🥈\n\n' +
      '🎯 After an exciting tournament filled with intense matches, brilliant shots, and thrilling moments, Arnob Sabit & Najmul have claimed the Championship Title! 🏆🔥\n\n' +
      '👏 Congratulations to our Champions and Runner-Up!\n' +
      '❤️ A huge thank you to everyone who participated and made this Carrom Tournament memorable.',
    time: 'Saturday, 3 Oct',
    created_at: now,
    created_by: adminId
  };

  await client.execute({
    sql: 'INSERT INTO announcements (id, level, title, body, time, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [
      announcement.id,
      announcement.level,
      announcement.title,
      announcement.body,
      announcement.time,
      announcement.created_at,
      announcement.created_by
    ]
  });

  console.log('✓ Announcement created successfully:', announcement.title);
  console.log('\n=== ALL CARROM UPDATES APPLIED TO DATABASE SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
