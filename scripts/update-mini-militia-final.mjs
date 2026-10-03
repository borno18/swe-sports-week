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
  console.log('=== UPDATING MINI MILITIA FINAL RESULTS ===\n');

  const now = Date.now();
  const oct2Timestamp = new Date('2026-10-02T19:00:00+06:00').getTime();
  const oct3Timestamp = new Date('2026-10-03T21:00:00+06:00').getTime();

  const mmEntries = [
    // Grand Finalists (Ranked by Aggregate Standings)
    { id: 'p4', name: 'OMOR FARUK MAHER (Wathor)' },
    { id: 'p5', name: 'Joydip Majumdar Borno (nightguy)' },
    { id: 'p_broforce', name: 'BroForce' },
    { id: 'p2', name: 'J Noah (22)' },
    { id: 'p7', name: 'Arnob Hasan Sabit (22)' },
    { id: 'p11', name: 'F.M. Farhan Jarif (Jarif)' },
    { id: 'p1', name: 'Wujair Ibn Johir (25)' },
    { id: 'p3', name: 'Anon (24)' },
    // Group Stage participants
    { id: 'p6', name: 'Upom Mazumder' },
    { id: 'p8', name: 'Rafin Islam Niloy' },
    { id: 'p9', name: 'Mohammad Nafiz Mahmud' },
    { id: 'p10', name: 'Nabil Ahmed' },
    { id: 'p12', name: 'Zaid Afnan' },
    { id: 'p13', name: 'Estiak Khan' }
  ];

  const mmBracket = {
    entries: mmEntries,
    rounds: [
      // Round 0: Group Stage Matches
      [
        {
          id: 'grp_a',
          round: 0,
          position: 0,
          a: 'p1',
          b: 'p2',
          winner: null,
          bye: false,
          date: '2026-10-02',
          time: '16:00',
          venue: 'Online / IICT',
          scoreA: '25 Kills',
          scoreB: '22 Kills',
          completedAt: oct2Timestamp,
          legs: 1,
          participants: ['p1', 'p2', 'p3'],
          advancers: ['p1', 'p2', 'p3'],
          scores: {
            p1: '25 Kills (+10) [Adv]',
            p2: '22 Kills (+7) [Adv]',
            p3: '20 Kills (+1) [Adv]'
          }
        },
        {
          id: 'grp_c',
          round: 0,
          position: 1,
          a: 'p4',
          b: 'p5',
          winner: null,
          bye: false,
          date: '2026-10-02',
          time: '16:30',
          venue: 'Online / IICT',
          scoreA: '44 Kills',
          scoreB: '26 Kills',
          completedAt: oct2Timestamp,
          legs: 1,
          participants: ['p4', 'p5', 'p6'],
          advancers: ['p4', 'p5'],
          scores: {
            p4: '44 Kills (+36) [Adv]',
            p5: '26 Kills (+9) [Adv]',
            p6: '9 Kills (-15)'
          }
        },
        {
          id: 'grp_b',
          round: 0,
          position: 2,
          a: 'p7',
          b: 'p_broforce',
          winner: null,
          bye: false,
          date: '2026-10-02',
          time: '19:00',
          venue: 'Online / IICT',
          scoreA: 'Advancing',
          scoreB: 'Advancing',
          completedAt: oct2Timestamp,
          legs: 1,
          participants: ['p7', 'p_broforce', 'p11', 'p8', 'p9', 'p10', 'p12', 'p13'],
          advancers: ['p_broforce', 'p7', 'p11'],
          scores: {
            p_broforce: 'Qualified [Adv]',
            p7: 'Qualified [Adv]',
            p11: 'Qualified [Adv]'
          }
        }
      ],
      // Round 1: Grand Final (2 Legs Combined: Catacombs & Outpost)
      [
        {
          id: 'grand_final',
          round: 1,
          position: 0,
          a: 'p4',
          b: 'p5',
          winner: 'p4',
          runnerUp: 'p5',
          bye: false,
          date: '2026-10-03',
          time: '20:00',
          venue: 'Catacombs & Outpost (2-Leg Aggregate)',
          scoreA: '73 Kills (Champion)',
          scoreB: '55 Kills (Runner-Up)',
          completedAt: oct3Timestamp,
          legs: 2,
          participants: ['p4', 'p5', 'p_broforce', 'p2', 'p7', 'p11', 'p1', 'p3'],
          advancers: ['p4'],
          scores: {
            p4: '🥇 1st · 73 Kills, 24 Deaths (+49) [G1: 34-12, G2: 39-12] · Champion',
            p5: '🥈 2nd · 55 Kills, 40 Deaths (+15) [G1: 28-19, G2: 27-21] · Runner-Up',
            p_broforce: '🥉 3rd · 48 Kills, 41 Deaths (+7)',
            p2: '4th · 32 Kills, 39 Deaths (-7)',
            p7: '5th · 36 Kills, 48 Deaths (-12)',
            p11: '6th · 32 Kills, 51 Deaths (-19)',
            p1: '7th · 16 Kills, 42 Deaths (-26)',
            p3: '8th · 18 Kills, 46 Deaths (-28)'
          }
        }
      ]
    ],
    format: 'flexible',
    legs: 2
  };

  const mmRes = await client.execute("SELECT version FROM tournaments WHERE id = 'mini-militia'");
  const mmVersion = mmRes.rows.length > 0 ? Number(mmRes.rows[0].version) + 1 : 1;

  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ?, entry_kind = ? WHERE id = ?',
    args: [JSON.stringify(mmBracket), mmVersion, 'player', 'mini-militia']
  });

  const detailText = '🏆 Champion: OMOR FARUK MAHER (Wathor) · 🥈 Runner-Up: Joydip Majumdar Borno (nightguy)';
  await client.execute({
    sql: 'UPDATE sports SET detail = ? WHERE slug = ?',
    args: [detailText, 'mini-militia']
  });

  console.log(`✓ Mini Militia tournament updated to v${mmVersion}`);
  console.log(`✓ Sports table detail updated: ${detailText}`);

  // Insert Announcement
  const userRes = await client.execute("SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1").catch(() => ({ rows: [] }));
  const adminId = userRes.rows.length > 0 ? String(userRes.rows[0].id) : null;

  const announcement = {
    id: randomUUID(),
    title: '🎮 মিনি মিলিশিয়া (Mini Militia) গ্র্যান্ড ফাইনাল: অপরাজিত পারফরম্যান্সে চ্যাম্পিয়ন OMOR FARUK MAHER (Wathor)!',
    body:
      '💥 MINI MILITIA GRAND FINAL RESULTS & OFFICIAL STANDINGS 💥\n\n' +
      'মিনি মিলিশিয়া টুর্নামেন্টের শ্বাসরুদ্ধকর ২-লেগের (Catacombs & Outpost) গ্র্যান্ড ফাইনাল সম্পন্ন হয়েছে। অবিশ্বাস্য ডমিনেটিং পারফরম্যান্স উপহার দিয়ে চ্যাম্পিয়ন হওয়ার গৌরব অর্জন করেছেন OMOR FARUK MAHER (Wathor) এবং রানার্সআপ হয়েছেন Joydip Majumdar Borno (nightguy)!\n\n' +
      '🏆 চ্যাম্পিয়ন (Champion): OMOR FARUK MAHER (Wathor)\n' +
      '• Game 1 (Catacombs): 34–12 (+22)\n' +
      '• Game 2 (Outpost): 39–12 (+27)\n' +
      '• Aggregate: 73 Kills, 24 Deaths (+49 K/D)\n\n' +
      '🥈 রানার্সআপ (Runners-Up): Joydip Majumdar Borno (nightguy)\n' +
      '• Game 1: 28–19 (+9)\n' +
      '• Game 2: 27–21 (+6)\n' +
      '• Aggregate: 55 Kills, 40 Deaths (+15 K/D)\n\n' +
      '📊 গ্র্যান্ড ফাইনাল সম্পূর্ণ স্ট্যান্ডিংস (Final 8 Standings):\n' +
      '1. 🥇 OMOR FARUK MAHER (Wathor) — 73 Kills, 24 Deaths (+49)\n' +
      '2. 🥈 Joydip Majumdar Borno (nightguy) — 55 Kills, 40 Deaths (+15)\n' +
      '3. 🥉 BroForce — 48 Kills, 41 Deaths (+7)\n' +
      '4. J Noah (22) — 32 Kills, 39 Deaths (-7)\n' +
      '5. Arnob Hasan Sabit (22) — 36 Kills, 48 Deaths (-12)\n' +
      '6. F.M. Farhan Jarif (Jarif) — 32 Kills, 51 Deaths (-19)\n' +
      '7. Wujair Ibn Johir (25) — 16 Kills, 42 Deaths (-26)\n' +
      '8. Anon (24) — 18 Kills, 46 Deaths (-28)\n\n' +
      'সকল প্রতিযোগী ও দর্শকদের জানাই আন্তরিক শুভেচ্ছা ও অভিনন্দন!',
    level: 'important',
    time: 'Saturday, 3 Oct',
    created_by: adminId,
    created_at: now
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
  console.log('\n=== ALL UPDATES APPLIED TO DATABASE SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
