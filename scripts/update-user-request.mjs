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
  console.log('=== STARTING UPDATES FOR FOOTBALL, UNO, AND FIFA PHOTO DATA ===');

  const now = Date.now();
  const oct1Timestamp = new Date('2026-10-01T18:00:00+06:00').getTime();
  const oct2Timestamp = new Date('2026-10-02T18:00:00+06:00').getTime();

  // -------------------------------------------------------------
  // 1. FOOTBALL: THE 9TH & FC RECURSION IN FINALS, FC RECURSION WINS!
  // -------------------------------------------------------------
  console.log('\n1. Updating Football: FC Recursion Champions, The 9th Runner-Up...');
  const fbRes = await client.execute("SELECT version, bracket FROM tournaments WHERE id = 'football'");
  const fbBracket = JSON.parse(fbRes.rows[0].bracket);
  const fbVersion = Number(fbRes.rows[0].version) + 1;

  // Entries:
  // p1: ByteForce FC, p2: House Of Interaction, p3: The Overclocked, p4: Jani na
  // p5: The 9th, p6: Team Prompt Engineers, p7: fakibazz, p8: Recursion FC (FC Recursion)

  // Semi-Finals (Round 0)
  fbBracket.rounds[0][0].a = 'p5'; // The 9th
  fbBracket.rounds[0][0].b = 'p3'; // The Overclocked
  fbBracket.rounds[0][0].winner = 'p5';
  fbBracket.rounds[0][0].scoreA = 'W';
  fbBracket.rounds[0][0].scoreB = 'L';
  fbBracket.rounds[0][0].completedAt = oct1Timestamp;
  fbBracket.rounds[0][0].date = '2026-10-01';
  fbBracket.rounds[0][0].time = '15:30';
  fbBracket.rounds[0][0].venue = 'Main University Ground';

  fbBracket.rounds[0][1].a = 'p8'; // FC Recursion
  fbBracket.rounds[0][1].b = 'p1'; // Byteforce FC
  fbBracket.rounds[0][1].winner = 'p8';
  fbBracket.rounds[0][1].scoreA = 'W';
  fbBracket.rounds[0][1].scoreB = 'L';
  fbBracket.rounds[0][1].completedAt = oct1Timestamp;
  fbBracket.rounds[0][1].date = '2026-10-01';
  fbBracket.rounds[0][1].time = '16:30';
  fbBracket.rounds[0][1].venue = 'Main University Ground';

  // Grand Final (Round 1)
  fbBracket.rounds[1][0].a = 'p8'; // FC Recursion
  fbBracket.rounds[1][0].b = 'p5'; // The 9th
  fbBracket.rounds[1][0].winner = 'p8'; // FC Recursion beat The 9th
  fbBracket.rounds[1][0].scoreA = 'Winner (Champion)';
  fbBracket.rounds[1][0].scoreB = 'Runner-Up';
  fbBracket.rounds[1][0].completedAt = oct2Timestamp;
  fbBracket.rounds[1][0].date = '2026-10-02';
  fbBracket.rounds[1][0].time = '16:00';
  fbBracket.rounds[1][0].venue = 'Main University Ground';

  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ? WHERE id = ?',
    args: [JSON.stringify(fbBracket), fbVersion, 'football']
  });
  await client.execute({
    sql: "UPDATE sports SET detail = '🏆 Champion: Recursion FC · 🥈 Runner-Up: The 9th' WHERE slug = 'football'"
  });
  console.log(`✓ Football updated: FC Recursion Champions, The 9th Runner-Up (v${fbVersion})`);


  // -------------------------------------------------------------
  // 2. UNO: FATIHA TASNIM UPOMA IS CHAMPION!
  // -------------------------------------------------------------
  console.log('\n2. Updating UNO: Fatiha Tasnim Upoma emerges as Champion...');
  const unoRes = await client.execute("SELECT version, bracket FROM tournaments WHERE id = 'uno'");
  const unoBracket = JSON.parse(unoRes.rows[0].bracket);
  const unoVersion = Number(unoRes.rows[0].version) + 1;

  // Find Fatiha Tasnim Upoma
  let upomaEntry = unoBracket.entries.find(e => e.name.toLowerCase().includes('upoma'));
  if (!upomaEntry) {
    upomaEntry = { id: `p${unoBracket.entries.length + 1}`, name: 'Fatiha Tasnim Upoma (23 Batch)' };
    unoBracket.entries.push(upomaEntry);
  }

  // Update Grand Final match in Round 1
  if (unoBracket.rounds && unoBracket.rounds[1] && unoBracket.rounds[1][0]) {
    const finalMatch = unoBracket.rounds[1][0];
    finalMatch.winner = upomaEntry.id;
    finalMatch.advancers = [upomaEntry.id];
    finalMatch.completedAt = oct2Timestamp;
    finalMatch.scoreA = 'Champion';
    finalMatch.scores = {
      [upomaEntry.id]: '🏆 1st (Champion)'
    };
    for (const p of finalMatch.participants || []) {
      if (p !== upomaEntry.id) {
        finalMatch.scores[p] = 'Finalist';
      }
    }
  }

  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ? WHERE id = ?',
    args: [JSON.stringify(unoBracket), unoVersion, 'uno']
  });
  await client.execute({
    sql: "UPDATE sports SET detail = '🏆 Champion: Fatiha Tasnim Upoma (23 Batch)' WHERE slug = 'uno'"
  });
  console.log(`✓ UNO updated: Fatiha Tasnim Upoma is Champion (v${unoVersion})`);


  // -------------------------------------------------------------
  // 3. FIFA / EA FC 25: APPLY EXACT DATA FROM ATTACHED PHOTOS
  // -------------------------------------------------------------
  console.log('\n3. Updating FIFA (EA FC 25) with exact results from photos...');
  const fifaRes = await client.execute("SELECT version FROM tournaments WHERE id = 'fifa'");
  const fifaVersion = Number(fifaRes.rows[0].version) + 1;

  const fifaAllEntries = [
    // Group A (Image 1)
    { id: 'p_zaid', name: 'Zaid Afnan (25)' },
    { id: 'p_nafis', name: 'Nafis Uddin (23)' },
    { id: 'p_hasan', name: 'Md. Hasan Kabir (24)' },
    { id: 'p_shagnik', name: 'Shagnik Paul (22)' },
    // Group B (Image 1)
    { id: 'p_samin', name: 'Samin Yasar (24)' },
    { id: 'p_shahdin', name: 'Mohammed Shahdin Alam (25)' },
    { id: 'p_muhib', name: 'Faiyaz Abid Muhib (24)' },
    { id: 'p_jobail', name: 'Abu Jobail (23)' },
    { id: 'p_mahin', name: 'Imtiaz Haque Mahin (24)' },
    // Group C (Image 1)
    { id: 'p_zihan', name: 'Abil Waquer Zihan (24)' },
    { id: 'p_labid', name: 'Md. Labid Ibna Salabah (25)' },
    { id: 'p_nafiz', name: 'Mohammed Nafiz Mahmud (24)' },
    { id: 'p_anonno', name: 'Abu Ahosun Anonno (24)' },
    // Group D (Image 1)
    { id: 'p_fahad', name: 'Fahad Mahbub (24)' },
    { id: 'p_sushanta', name: 'Sushanta Paul (25)' },
    { id: 'p_aritro', name: 'Aritro Ghosh (24)' },
    { id: 'p_aanon', name: 'Aanon (24)' },
    // Knockout entrants (Images 2 & 4)
    { id: 'p_surjo', name: 'Surjo Sarker' },
    { id: 'p_joydip', name: 'Joydip Majumdar' },
    { id: 'p_ashraful', name: 'Ashraful Alam' },
    { id: 'p_hamim', name: 'Hamim Rahman' },
    { id: 'p_rafin', name: 'Rafin Islam Niloy' },
    { id: 'p_redwan', name: 'Redwan Hassan' },
    { id: 'p_shawon', name: 'Shawon Majid' },
    { id: 'p_hasin', name: 'Hasin Ishrak' }
  ];

  // Round 0: Round of 16 (Image 4)
  const fifaR16Matches = [
    {
      id: 'r16_m1', round: 0, position: 0, a: 'p_zaid', b: 'p_ashraful', winner: 'p_zaid',
      scoreA: 'W', scoreB: 'L', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:00', venue: 'Room 830, IICT', bye: false, legs: 1
    },
    {
      id: 'r16_m2', round: 0, position: 1, a: 'p_nafis', b: 'p_joydip', winner: 'p_joydip',
      scoreA: 'L', scoreB: 'W', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:20', venue: 'Room 830, IICT', bye: false, legs: 1
    },
    {
      id: 'r16_m3', round: 0, position: 2, a: 'p_samin', b: 'p_zihan', winner: 'p_samin',
      scoreA: 'W', scoreB: 'L', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:40', venue: 'Room 830, IICT', bye: false, legs: 1
    },
    {
      id: 'r16_m4', round: 0, position: 3, a: 'p_shahdin', b: 'p_hamim', winner: 'p_shahdin',
      scoreA: 'W', scoreB: 'L', completedAt: oct1Timestamp, date: '2026-09-30', time: '18:00', venue: 'Room 830, IICT', bye: false, legs: 1
    },
    {
      id: 'r16_m5', round: 0, position: 4, a: 'p_labid', b: 'p_surjo', winner: 'p_surjo',
      scoreA: 'L', scoreB: 'W', completedAt: oct1Timestamp, date: '2026-09-30', time: '18:20', venue: 'Room 830, IICT', bye: false, legs: 1
    },
    {
      id: 'r16_m6', round: 0, position: 5, a: 'p_fahad', b: 'p_rafin', winner: 'p_fahad',
      scoreA: 'W', scoreB: 'L', completedAt: oct1Timestamp, date: '2026-09-30', time: '18:40', venue: 'Room 830, IICT', bye: false, legs: 1
    },
    {
      id: 'r16_m7', round: 0, position: 6, a: 'p_sushanta', b: 'p_redwan', winner: 'p_sushanta',
      scoreA: 'W', scoreB: 'L', completedAt: oct1Timestamp, date: '2026-09-30', time: '19:00', venue: 'Room 830, IICT', bye: false, legs: 1
    },
    {
      id: 'r16_m8', round: 0, position: 7, a: 'p_shawon', b: 'p_hasin', winner: null,
      scoreA: '', scoreB: '', completedAt: null, date: '2026-09-30', time: '19:20', venue: 'Room 830, IICT', bye: false, legs: 1
    }
  ];

  // Round 1: Quarterfinals (Image 2)
  const fifaQFMatches = [
    {
      id: 'qf_m1', round: 1, position: 0, a: 'p_surjo', b: 'p_samin', winner: 'p_samin',
      scoreA: 'L', scoreB: 'W', completedAt: oct1Timestamp, date: '2026-10-01', time: '19:00', venue: 'Room 830, IICT', bye: false, legs: 1
    },
    {
      id: 'qf_m2', round: 1, position: 1, a: 'p_joydip', b: 'p_fahad', winner: 'p_fahad',
      scoreA: 'L', scoreB: 'W', completedAt: oct1Timestamp, date: '2026-10-01', time: '19:30', venue: 'Room 830, IICT', bye: false, legs: 1
    },
    {
      id: 'qf_m3', round: 1, position: 2, a: 'p_zihan', b: 'p_sushanta', winner: 'p_zihan',
      scoreA: 'W', scoreB: 'L', completedAt: oct1Timestamp, date: '2026-10-01', time: '20:00', venue: 'Room 830, IICT', bye: false, legs: 1
    },
    {
      id: 'qf_m4', round: 1, position: 3, a: 'p_zaid', b: 'p_shahdin', winner: 'p_shahdin',
      scoreA: 'L', scoreB: 'W', completedAt: oct1Timestamp, date: '2026-10-01', time: '20:30', venue: 'Room 830, IICT', bye: false, legs: 1
    }
  ];

  // Round 2: Semi Finals (Image 3)
  const fifaSFMatches = [
    {
      id: 'sf_m1', round: 2, position: 0, a: 'p_zihan', b: 'p_samin', winner: null,
      scoreA: '', scoreB: '', completedAt: null, date: '2026-10-02', time: '18:30', venue: 'Room 830, IICT', bye: false, legs: 2
    },
    {
      id: 'sf_m2', round: 2, position: 1, a: 'p_fahad', b: 'p_shahdin', winner: null,
      scoreA: '', scoreB: '', completedAt: null, date: '2026-10-02', time: '19:15', venue: 'Room 830, IICT', bye: false, legs: 2
    }
  ];

  // Round 3: Final
  const fifaFinalMatches = [
    {
      id: 'grand_final', round: 3, position: 0, a: null, b: null, winner: null,
      scoreA: '', scoreB: '', completedAt: null, date: '2026-10-03', time: '19:30', venue: 'Room 830, IICT', bye: false, legs: 1
    }
  ];

  const fifaNewBracket = {
    entries: fifaAllEntries,
    rounds: [fifaR16Matches, fifaQFMatches, fifaSFMatches, fifaFinalMatches],
    format: 'knockout',
    legs: 1
  };

  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ?, entry_kind = ? WHERE id = ?',
    args: [JSON.stringify(fifaNewBracket), fifaVersion, 'player', 'fifa']
  });
  await client.execute({
    sql: "UPDATE sports SET detail = 'Semi Finals: Zihan vs Samin · Fahad vs Shahdin' WHERE slug = 'fifa'"
  });
  console.log(`✓ FIFA (EA FC 25) bracket updated matching photos: R16 -> QF -> SF (v${fifaVersion})`);


  // -------------------------------------------------------------
  // 4. INSERT OFFICIAL ANNOUNCEMENTS FOR FOOTBALL & UNO CHAMPIONS
  // -------------------------------------------------------------
  console.log('\n4. Inserting announcements...');
  const userRes = await client.execute("SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1").catch(() => ({ rows: [] }));
  const adminId = userRes.rows.length > 0 ? String(userRes.rows[0].id) : null;

  const ann1Id = randomUUID();
  await client.execute({
    sql: 'INSERT INTO announcements (id, level, title, body, time, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [
      ann1Id,
      'important',
      '⚽ ফুটবল গ্র্যান্ড ফাইনাল: দ্য নাইনথকে পরাজিত করে চ্যাম্পিয়ন এফসি রিকার্শন!',
      '🏆 SWE SPORTS WEEK 2026 — FOOTBALL GRAND FINAL RESULT\n\n' +
      'শ্বাসরুদ্ধকর ফাইনাল ম্যাচ শেষে এবারের ফুটবল টুর্নামেন্টের শিরোপা জিতল এফসি রিকার্শন!\n\n' +
      '👑 CHAMPION: FC Recursion (এফসি রিকার্শন)\n' +
      '🥈 RUNNER-UP: The 9th (দ্য নাইনথ)\n\n' +
      'ফাইনালে দ্য নাইনথ-এর বিরুদ্ধে দুর্দান্ত নৈপুণ্য প্রদর্শন করে জয় ছিনিয়ে নেয় এফসি রিকার্শন। উভয় দলকে তাদের অসাধারণ লড়াইয়ের জন্য আন্তরিক অভিনন্দন!',
      'Friday, 2 Oct',
      now,
      adminId
    ]
  });

  const ann2Id = randomUUID();
  await client.execute({
    sql: 'INSERT INTO announcements (id, level, title, body, time, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [
      ann2Id,
      'important',
      '🎴 সেগমেন্ট UNO গ্র্যান্ড ফাইনাল: অপরাজিত চ্যাম্পিয়ন ফাতেহা তাসনিম উপমা!',
      '🎴 SWE SPORTS WEEK 2026 — UNO GRAND FINAL RESULT\n\n' +
      '৮ জন ফাইনালিস্টের মধ্যকার তুমুল উত্তেজনাকর ম্যাচ শেষে UNO সেগমেন্টের চ্যাম্পিয়ন হওয়ার গৌরব অর্জন করেছেন:\n\n' +
      '👑 CHAMPION: Fatiha Tasnim Upoma (ফাতিহা তাসনিম উপমা) — 23 Batch\n\n' +
      'চ্যাম্পিয়ন ফাতিহা তাসনিম উপমা সহ সকল ফাইনালিস্টকে আন্তরিক অভিনন্দন ও শুভেচ্ছা!',
      'Friday, 2 Oct',
      now,
      adminId
    ]
  });

  const ann3Id = randomUUID();
  await client.execute({
    sql: 'INSERT INTO announcements (id, level, title, body, time, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [
      ann3Id,
      'important',
      '🎮 EA FC 25 (FIFA): কোয়ার্টার ফাইনাল ফলাফল ও সেমিফাইনাল লাইনআপ ঘোষণা!',
      '🎮 EA SPORTS FC 25 TOURNAMENT UPDATE\n' +
      '📍 Venue: Room 830, IICT\n\n' +
      'কোয়ার্টার ফাইনাল ম্যাচ শেষে সেমিফাইনালে জায়গা করে নিয়েছে শীর্ষ ৪ প্রতিযোগী!\n\n' +
      '★ SEMI-FINAL 1:\n' +
      '• Abil Waquer Zihan (24 Batch) VS Samin Yasar (24 Batch)\n\n' +
      '★ SEMI-FINAL 2:\n' +
      '• Fahad Mahbub (24 Batch) VS Mohammed Shahdin Alam (25 Batch)\n\n' +
      'সেমিফাইনাল বিজয়ীরা সরাসরি গ্র্যান্ড ফাইনালে মুখোমুখি হবে!',
      'Friday, 2 Oct',
      now,
      adminId
    ]
  });

  console.log('✓ Added all 3 official announcements!');
  console.log('\n=== ALL USER UPDATES COMPLETED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
