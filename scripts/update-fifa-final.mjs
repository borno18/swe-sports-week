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
  console.log('=== UPDATING EA FC 25 (FIFA) FINAL RESULTS ===\n');

  const now = Date.now();
  const oct2Timestamp = new Date('2026-10-02T20:00:00+06:00').getTime();
  const oct3Timestamp = new Date('2026-10-03T22:45:00+06:00').getTime();

  const fifaRes = await client.execute("SELECT version, bracket FROM tournaments WHERE id = 'fifa'");
  if (fifaRes.rows.length === 0) {
    throw new Error('FIFA tournament not found');
  }

  const fifaVersion = Number(fifaRes.rows[0].version) + 1;
  const fifaBracket = JSON.parse(fifaRes.rows[0].bracket);

  // Round 2: Semi-Finals
  // Match 0: Zihan vs Samin -> Zihan wins
  const sf1 = fifaBracket.rounds[2][0];
  sf1.a = 'p_zihan';
  sf1.b = 'p_samin';
  sf1.winner = 'p_zihan';
  sf1.scoreA = 'W';
  sf1.scoreB = 'L';
  sf1.completedAt = oct2Timestamp;

  // Match 1: Fahad 10 - 8 Shahdin (both legs aggregate) -> Fahad wins
  const sf2 = fifaBracket.rounds[2][1];
  sf2.a = 'p_fahad';
  sf2.b = 'p_shahdin';
  sf2.winner = 'p_fahad';
  sf2.scoreA = '10';
  sf2.scoreB = '8';
  sf2.completedAt = oct2Timestamp;

  // Round 3: Grand Final
  // Zihan 9 - 3 Fahad -> Zihan Champion, Fahad Runner-Up
  const gf = fifaBracket.rounds[3][0];
  gf.a = 'p_zihan';
  gf.b = 'p_fahad';
  gf.winner = 'p_zihan';
  gf.scoreA = '9 (Champion)';
  gf.scoreB = '3 (Runner-Up)';
  gf.completedAt = oct3Timestamp;

  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ?, entry_kind = ? WHERE id = ?',
    args: [JSON.stringify(fifaBracket), fifaVersion, 'player', 'fifa']
  });

  const detailText = '🏆 Champion: Abil Waquer Zihan (24) · 🥈 Runner-Up: Fahad Mahbub (24)';
  await client.execute({
    sql: 'UPDATE sports SET detail = ? WHERE slug = ?',
    args: [detailText, 'fifa']
  });

  console.log(`✓ FIFA tournament updated to v${fifaVersion}`);
  console.log(`✓ Sports table detail updated: ${detailText}`);

  // Insert Announcement
  const userRes = await client.execute("SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1").catch(() => ({ rows: [] }));
  const adminId = userRes.rows.length > 0 ? String(userRes.rows[0].id) : null;

  const announcement = {
    id: randomUUID(),
    level: 'important',
    title: '🎮 EA FC 25 (FIFA) গ্র্যান্ড ফাইনাল: ৯-৩ ব্যবধানে জিতে অপরাজিত চ্যাম্পিয়ন Abil Waquer Zihan!',
    body:
      '🎮 EA FC 25 (FIFA) TOURNAMENT — GRAND FINAL & SEMIFINAL RESULTS 🎮\n\n' +
      'রোমাঞ্চকর লড়াই শেষে সম্পন্ন হলো EA FC 25 (FIFA) টুর্নামেন্টের সেমিফাইনাল ও গ্র্যান্ড ফাইনাল!\n\n' +
      '🏆 চ্যাম্পিয়ন (Champion): Abil Waquer Zihan (24)\n' +
      '🥈 রানার্সআপ (Runner-Up): Fahad Mahbub (24)\n\n' +
      '⚽ গ্র্যান্ড ফাইনাল ফলাফল:\n' +
      '• Abil Waquer Zihan 9 – 3 Fahad Mahbub\n\n' +
      '⚽ সেমিফাইনাল ফলাফল:\n' +
      '• Semifinal 1: Abil Waquer Zihan def. Samin Yasar\n' +
      '• Semifinal 2: Fahad Mahbub 10 – 8 Mohammed Shahdin Alam (Both Legs Aggregate)\n\n' +
      'চ্যাম্পিয়ন ও রানার্সআপসহ অংশগ্রহণকারী সকল খেলোয়াড়কে জানাই আন্তরিক অভিনন্দন!',
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
  console.log('\n=== ALL FIFA UPDATES APPLIED TO DATABASE SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
