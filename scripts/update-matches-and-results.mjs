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

const url = process.env.TURSO_DATABASE_URL || process.env.SPORTS_WEEK_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.SPORTS_WEEK_AUTH_TOKEN;
const client = url ? createClient({ url, authToken }) : createClient({ url: 'file:data/sports-week.db' });

async function run() {
  console.log('--- STARTING TOURNAMENT DATA UPDATES ---');

  // 1. UPDATE FOOTBALL MATCHES FOR MONDAY 28-09-2026
  console.log('1. Updating Football matches...');
  const fbRes = await client.execute("SELECT version, bracket FROM tournaments WHERE id = 'football'");
  if (fbRes.rows.length === 0) {
    throw new Error('Football tournament not found in database');
  }
  const fbBracket = JSON.parse(fbRes.rows[0].bracket);
  const fbNextVersion = Number(fbRes.rows[0].version) + 1;

  // Flatten group stage matches
  const gsMatches = fbBracket.groupStageRounds?.flat() ?? [];

  // Monday Morning 7.00 - 8.00: The Overclocked vs Byteforce FC -> gs_g1r2m1
  const mMorning1 = gsMatches.find(m => m.id === 'gs_g1r2m1');
  if (mMorning1) {
    mMorning1.date = '2026-09-28';
    mMorning1.time = '07:00';
    mMorning1.venue = 'SUST';
    console.log('✓ Scheduled gs_g1r2m1: The Overclocked vs Byteforce FC at Monday 7:00 AM');
  }

  // Monday Morning 8.00 - 9.00: FC Recursion vs The 9th -> gs_g2r1m1
  const mMorning2 = gsMatches.find(m => m.id === 'gs_g2r1m1');
  if (mMorning2) {
    mMorning2.date = '2026-09-28';
    mMorning2.time = '08:00';
    mMorning2.venue = 'SUST';
    console.log('✓ Scheduled gs_g2r1m1: FC Recursion vs The 9th at Monday 8:00 AM');
  }

  // Monday Afternoon 3.30 - 4.30: Team Prompt Engineers vs FC Recursion -> gs_g2r2m2
  const mAfternoon1 = gsMatches.find(m => m.id === 'gs_g2r2m2');
  if (mAfternoon1) {
    mAfternoon1.date = '2026-09-28';
    mAfternoon1.time = '15:30';
    mAfternoon1.venue = 'SUST';
    console.log('✓ Scheduled gs_g2r2m2: Team Prompt Engineers vs FC Recursion at Monday 3:30 PM');
  }

  // Monday Afternoon 4.30 - 5.30: The Overclocked vs House of Interaction -> gs_g1r1m2
  const mAfternoon2 = gsMatches.find(m => m.id === 'gs_g1r1m2');
  if (mAfternoon2) {
    mAfternoon2.date = '2026-09-28';
    mAfternoon2.time = '16:30';
    mAfternoon2.venue = 'SUST';
    console.log('✓ Scheduled gs_g1r1m2: The Overclocked vs House of Interaction at Monday 4:30 PM');
  }

  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ? WHERE id = ?',
    args: [JSON.stringify(fbBracket), fbNextVersion, 'football']
  });
  console.log(`✓ Football tournament updated to version ${fbNextVersion}`);


  // 2. UPDATE UNO - DAY 01
  console.log('\n2. Updating UNO tournament...');
  const unoNames = [
    // Match 01
    'Junayed Siddique (21)',
    'Jawadun Noor (21)',
    'Raifa Zaman (25)',
    'Sushanta Paul (25)',
    'Tasmina Zerin (25)',
    'Ayesha Akter Nishat (25)',
    'Safiya Mahdeat (25)',
    'Md. Labib Rafid Majumder (22)',
    'Arnob hasan sabit (22)',
    'Goutom Das Dipto (22)',
    // Match 02
    'F.M. Farhan Jarif (25)',
    'Upom Mazumder (25)',
    'Md. Sabuj Mahmud (21)',
    'Tareq (21)',
    'Durjoy Das (25)',
    'Md. Tanvir Hosen Anjum (25)',
    'Arifur Rahman (21)',
    'Uthpol Ghosh (21)',
    'Sifat (21)',
    'Sayed Jarif Nobbo (25)',
    // Match 03
    'Wujair Ibn Johir (25)',
    'Tasfiah Binte Aziz (25)',
    'MD. LABID IBNA SALABAH (25)',
    'Sayeed Rahat (25)',
    'Nigar Sultana Niha (25)',
    'Tayeba Tabassum (25)',
    'Aporup Dewan (24)',
    'Muhtarima Raisa (22)',
    'Anon (24)',
    'Md Apu Rayhan (22)'
  ];

  const unoEntries = unoNames.map((name, idx) => ({ id: `p${idx + 1}`, name }));
  const getUnoId = (n) => unoEntries.find(e => e.name === n)?.id;

  const m1Participants = unoEntries.slice(0, 10).map(e => e.id);
  const m1Advancers = [
    getUnoId('Sushanta Paul (25)'),
    getUnoId('Ayesha Akter Nishat (25)'),
    getUnoId('Raifa Zaman (25)')
  ];

  const m2Participants = unoEntries.slice(10, 20).map(e => e.id);
  const m2Advancers = [
    getUnoId('Tareq (21)'),
    getUnoId('Md. Sabuj Mahmud (21)'),
    getUnoId('Durjoy Das (25)')
  ];

  const m3Participants = unoEntries.slice(20, 30).map(e => e.id);
  const m3Advancers = [
    getUnoId('Aporup Dewan (24)'),
    getUnoId('Sayeed Rahat (25)'),
    getUnoId('Muhtarima Raisa (22)')
  ];

  const unoCompletedTime = 1790448000000;
  const unoBracket = {
    entries: unoEntries,
    rounds: [
      [
        {
          id: 'r1m1',
          round: 0,
          position: 0,
          a: m1Participants[0],
          b: m1Participants[1],
          winner: null,
          bye: false,
          date: '2026-09-26',
          time: '',
          venue: 'IICT',
          scoreA: '',
          scoreB: '',
          completedAt: unoCompletedTime,
          legs: 1,
          participants: m1Participants,
          advancers: m1Advancers,
          scores: {
            [m1Advancers[0]]: '1st',
            [m1Advancers[1]]: '2nd',
            [m1Advancers[2]]: '3rd'
          }
        },
        {
          id: 'r1m2',
          round: 0,
          position: 1,
          a: m2Participants[0],
          b: m2Participants[1],
          winner: null,
          bye: false,
          date: '2026-09-26',
          time: '',
          venue: 'IICT',
          scoreA: '',
          scoreB: '',
          completedAt: unoCompletedTime,
          legs: 1,
          participants: m2Participants,
          advancers: m2Advancers,
          scores: {
            [m2Advancers[0]]: '1st',
            [m2Advancers[1]]: '2nd',
            [m2Advancers[2]]: '3rd'
          }
        },
        {
          id: 'r1m3',
          round: 0,
          position: 2,
          a: m3Participants[0],
          b: m3Participants[1],
          winner: null,
          bye: false,
          date: '2026-09-26',
          time: '',
          venue: 'IICT',
          scoreA: '',
          scoreB: '',
          completedAt: unoCompletedTime,
          legs: 1,
          participants: m3Participants,
          advancers: m3Advancers,
          scores: {
            [m3Advancers[0]]: '1st',
            [m3Advancers[1]]: '2nd',
            [m3Advancers[2]]: '3rd'
          }
        }
      ],
      []
    ],
    format: 'flexible',
    legs: 1,
    playersPerGame: 10,
    totalGames: 3
  };

  const unoRes = await client.execute("SELECT version FROM tournaments WHERE id = 'uno'");
  const unoNextVersion = unoRes.rows.length > 0 ? Number(unoRes.rows[0].version) + 1 : 1;
  await client.execute({
    sql: 'INSERT INTO tournaments (id, sport_slug, title, entry_kind, version, bracket) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET bracket = excluded.bracket, version = excluded.version, entry_kind = excluded.entry_kind',
    args: ['uno', 'uno', 'UNO', 'player', unoNextVersion, JSON.stringify(unoBracket)]
  });
  console.log(`✓ UNO updated with 30 players, 3 matches, and 9 advancers (version ${unoNextVersion})`);

  await client.execute({
    sql: 'UPDATE sports SET detail = ? WHERE slug = ?',
    args: ['Top 3 advance per group match · Round 2 Next', 'uno']
  });


  // 3. UPDATE LUDO - DAY 01
  console.log('\n3. Updating Ludo tournament...');
  const ludoDuos = [
    'DEBASHIS (2021831034) & 2021831038',
    'Tayeba Tabassum (202561901075) & (202561901039)',
    'Md Apu Rayhan (2022831022) & Estiak Khan (2022831032)',
    'Nigar Sultana Niha (202561901070) & Tasfiah Binte Aziz (202561901061)',
    'Sheikh Nasim Limon (2022831023) & Iftakhar Hossain Sami (2022831038)',
    'Tasmina Zerin (202561901073) & Raifa Zaman (202561901059)',
    'Tushar Das (2021831003) & (2021831037)',
    'Goutom Das Dipto (2022831012) & Labib Rafid Mojumder (2022831048)',
    'Md. Sabuj Mahmud (2021831044) & Tareq (2021831027)',
    'Md. Tanvir Hosen Anjum (202561901080) & Rahmatullah Siddiquee (202561901074)'
  ];

  const ludoEntries = ludoDuos.map((name, idx) => ({ id: `p${idx + 1}`, name }));
  const ludoCompletedTime = 1790448000000;

  const ludoBracket = {
    entries: ludoEntries,
    rounds: [
      [
        {
          id: 'r1m1',
          round: 0,
          position: 0,
          a: 'p1',
          b: 'p2',
          winner: 'p2',
          bye: false,
          date: '2026-09-26',
          time: '',
          venue: 'IICT',
          scoreA: '',
          scoreB: '',
          completedAt: ludoCompletedTime,
          legs: 1,
          participants: ['p1', 'p2'],
          advancers: ['p2'],
          scores: { p2: 'W' }
        },
        {
          id: 'r1m2',
          round: 0,
          position: 1,
          a: 'p3',
          b: 'p4',
          winner: 'p3',
          bye: false,
          date: '2026-09-26',
          time: '',
          venue: 'IICT',
          scoreA: '',
          scoreB: '',
          completedAt: ludoCompletedTime,
          legs: 1,
          participants: ['p3', 'p4'],
          advancers: ['p3'],
          scores: { p3: 'W' }
        },
        {
          id: 'r1m3',
          round: 0,
          position: 2,
          a: 'p5',
          b: 'p6',
          winner: 'p5',
          bye: false,
          date: '2026-09-26',
          time: '',
          venue: 'IICT',
          scoreA: '',
          scoreB: '',
          completedAt: ludoCompletedTime,
          legs: 1,
          participants: ['p5', 'p6'],
          advancers: ['p5'],
          scores: { p5: 'W' }
        },
        {
          id: 'r1m4',
          round: 0,
          position: 3,
          a: 'p7',
          b: 'p8',
          winner: 'p8',
          bye: false,
          date: '2026-09-26',
          time: '',
          venue: 'IICT',
          scoreA: '',
          scoreB: '',
          completedAt: ludoCompletedTime,
          legs: 1,
          participants: ['p7', 'p8'],
          advancers: ['p8'],
          scores: { p8: 'W' }
        },
        {
          id: 'r1m5',
          round: 0,
          position: 4,
          a: 'p9',
          b: 'p10',
          winner: 'p9',
          bye: false,
          date: '2026-09-26',
          time: '',
          venue: 'IICT',
          scoreA: '',
          scoreB: '',
          completedAt: ludoCompletedTime,
          legs: 1,
          participants: ['p9', 'p10'],
          advancers: ['p9'],
          scores: { p9: 'W' }
        }
      ],
      []
    ],
    format: 'flexible',
    legs: 1,
    playersPerGame: 2,
    totalGames: 5
  };

  const ludoRes = await client.execute("SELECT version FROM tournaments WHERE id = 'ludo'");
  const ludoNextVersion = ludoRes.rows.length > 0 ? Number(ludoRes.rows[0].version) + 1 : 1;
  await client.execute({
    sql: 'INSERT INTO tournaments (id, sport_slug, title, entry_kind, version, bracket) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET bracket = excluded.bracket, version = excluded.version, entry_kind = excluded.entry_kind',
    args: ['ludo', 'ludo', 'Ludo', 'player', ludoNextVersion, JSON.stringify(ludoBracket)]
  });
  console.log(`✓ Ludo updated with 10 pairs, 5 matches, and 5 winners (version ${ludoNextVersion})`);

  await client.execute({
    sql: 'UPDATE sports SET detail = ? WHERE slug = ?',
    args: ['Open knockout · 5 Duos Advance to Round 2', 'ludo']
  });


  // 4. UPDATE 29 CARD EVENT
  console.log('\n4. Updating 29 Card Event tournament...');
  const card29Duos = [
    'Redwan Hasan & Jawadun Noor',
    'Tareq Monowar & Shadman Shawon',
    'Pranta Chowdhury & Shuvo Sarker',
    'Towhidul Islam & Shahriar Habib Fagun',
    'Iftakhar Sami & Sheikh Nasim Limon',
    'Abid Hasan Utsha & Fahad Mahbub',
    'Nabil Ahmed & Hasan Kabir',
    'Zihadul Islam & Shakibul Islam Munna',
    'Sabuj Ahmed & Borshon',
    'Manjur Fahim & Argha Biswas'
  ];

  const card29Entries = card29Duos.map((name, idx) => ({ id: `p${idx + 1}`, name }));
  const card29Venue = 'Room 830, IICT';
  const card29Date = '2026-09-28';

  const card29Bracket = {
    entries: card29Entries,
    rounds: [
      [
        {
          id: 'r1m1',
          round: 0,
          position: 0,
          a: 'p1',
          b: 'p2',
          winner: null,
          bye: false,
          date: card29Date,
          time: '18:30',
          venue: card29Venue,
          scoreA: '',
          scoreB: '',
          completedAt: null,
          legs: 1,
          participants: ['p1', 'p2'],
          advancers: [],
          scores: {}
        },
        {
          id: 'r1m2',
          round: 0,
          position: 1,
          a: 'p3',
          b: 'p4',
          winner: null,
          bye: false,
          date: card29Date,
          time: '18:30',
          venue: card29Venue,
          scoreA: '',
          scoreB: '',
          completedAt: null,
          legs: 1,
          participants: ['p3', 'p4'],
          advancers: [],
          scores: {}
        },
        {
          id: 'r1m3',
          round: 0,
          position: 2,
          a: 'p5',
          b: 'p6',
          winner: null,
          bye: false,
          date: card29Date,
          time: '19:00',
          venue: card29Venue,
          scoreA: '',
          scoreB: '',
          completedAt: null,
          legs: 1,
          participants: ['p5', 'p6'],
          advancers: [],
          scores: {}
        },
        {
          id: 'r1m4',
          round: 0,
          position: 3,
          a: 'p7',
          b: 'p8',
          winner: null,
          bye: false,
          date: card29Date,
          time: '19:00',
          venue: card29Venue,
          scoreA: '',
          scoreB: '',
          completedAt: null,
          legs: 1,
          participants: ['p7', 'p8'],
          advancers: [],
          scores: {}
        },
        {
          id: 'r1m5',
          round: 0,
          position: 4,
          a: 'p9',
          b: 'p10',
          winner: null,
          bye: false,
          date: card29Date,
          time: '19:00',
          venue: card29Venue,
          scoreA: '',
          scoreB: '',
          completedAt: null,
          legs: 1,
          participants: ['p9', 'p10'],
          advancers: [],
          scores: {}
        }
      ]
    ],
    format: 'flexible',
    legs: 1,
    playersPerGame: 2,
    totalGames: 5
  };

  const card29TournId = 'c4161dff-85c7-4c07-be1e-103403818039';
  const card29Res = await client.execute({
    sql: 'SELECT version FROM tournaments WHERE id = ?',
    args: [card29TournId]
  });
  const card29NextVersion = card29Res.rows.length > 0 ? Number(card29Res.rows[0].version) + 1 : 1;

  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ? WHERE id = ?',
    args: [JSON.stringify(card29Bracket), card29NextVersion, card29TournId]
  });
  console.log(`✓ 29 Card tournament updated with 5 matches scheduled for Monday 28-09-26 (version ${card29NextVersion})`);

  const card29RulesText =
    'ম্যাচের ধরন ও রাউন্ড: প্রতিটি ম্যাচ ১০ রাউন্ডে অনুষ্ঠিত হবে (যদি এর মধ্যে কোনো দল আগেই নির্ধারিত জয়ে না পৌঁছায়)।\n' +
    'টুর্নামেন্টের ম্যাচগুলো নকআউট ভিত্তিতে পরিচালিত হবে।\n' +
    'সতর্কতা: নির্ধারিত সময়ে উপস্থিত না থাকলে প্রতিপক্ষ টিমকে ওয়াকওভার দিয়ে নেক্সট রাউন্ডে কোয়ালিফাই করানো হবে।';

  await client.execute({
    sql: 'INSERT INTO sport_rules (sport_slug, title, format, advancement, rules_text, rounds, tiebreaker, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(sport_slug) DO UPDATE SET title = excluded.title, format = excluded.format, advancement = excluded.advancement, rules_text = excluded.rules_text, rounds = excluded.rounds, tiebreaker = excluded.tiebreaker, updated_at = excluded.updated_at',
    args: [
      '29',
      '২৯ কার্ড খেলার নিয়মাবলী ও সময়সূচি',
      'flexible',
      '১০ রাউন্ড শেষে বিজয়ী নির্ধারণ (নকআউট) · নির্ধারিত সময়ে উপস্থিত না থাকলে ওয়াকওভার',
      card29RulesText,
      '১০ রাউন্ড',
      '১০ রাউন্ড শেষে যদি ফলাফল সমান হয়, তবে ১টি টাইব্রেকার রাউন্ড খেলা হবে।',
      Date.now()
    ]
  });
  console.log('✓ Updated sport_rules for 29');

  await client.execute({
    sql: 'UPDATE sports SET detail = ? WHERE slug = ?',
    args: ['10-Round team matches · Room 830, IICT', '29']
  });


  // 5. INSERT ANNOUNCEMENTS
  console.log('\n5. Inserting Announcements...');
  const userRes = await client.execute("SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1").catch(() => ({ rows: [] }));
  const adminId = userRes.rows.length > 0 ? String(userRes.rows[0].id) : null;

  // Announcement 1: Football Monday Schedule
  const annFbId = randomUUID();
  const annFbBody =
    '⚽ SWE SPORTS WEEK — FOOTBALL SCHEDULE (MONDAY)\n\n' +
    '★ MORNING ★\n' +
    '• 7.00 - 8.00: The Overclocked vs Byteforce FC\n' +
    '• 8.00 - 9.00: FC Recursion vs The 9th\n\n' +
    '★ AFTERNOON ★\n' +
    '• 3.30 - 4.30: Team Prompt Engineers vs FC Recursion\n' +
    '• 4.30 - 5.30: The Overclocked vs House of Interaction\n\n' +
    '⏰ All teams must be present on the field on time!';

  await client.execute({
    sql: 'INSERT INTO announcements (id, level, title, body, time, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [annFbId, 'important', '⚽ ফুটবল: সোমবারের (Monday) ম্যাচ সময়সূচি ঘোষণা', annFbBody, 'Monday, 28 Sep', Date.now(), adminId]
  });

  // Announcement 2: 29 Card Schedule
  const ann29Id = randomUUID();
  const ann29Body =
    '♠️ ২৯ কার্ড ইভেন্ট — সময়সূচি ও ভেন্যু\n\n' +
    '📅 Date: 28-09-26 (Monday)\n' +
    '📍 Venue: Room 830, IICT\n\n' +
    '⏰ Time: 6.30 PM\n' +
    '• Match 01: Redwan Hasan & Jawadun Noor VS Tareq Monowar & Shadman Shawon\n' +
    '• Match 02: Pranta Chowdhury & Shuvo Sarker VS Towhidul Islam & Shahriar Habib Fagun\n\n' +
    '⏰ Time: 7.00 PM\n' +
    '• Match 03: Iftakhar Sami & Sheikh Nasim Limon VS Abid Hasan Utsha & Fahad Mahbub\n' +
    '• Match 04: Nabil Ahmed & Hasan Kabir VS Zihadul Islam & Shakibul Islam Munna\n' +
    '• Match 05: Sabuj Ahmed & Borshon VS Manjur Fahim & Argha Biswas\n\n' +
    '⚠️ বিশেষ সতর্কতা: নির্ধারিত সময়ে উপস্থিত না থাকলে প্রতিপক্ষ টিমকে ওয়াকওভার দিয়ে নেক্সট রাউন্ডে কোয়ালিফাই করানো হবে।';

  await client.execute({
    sql: 'INSERT INTO announcements (id, level, title, body, time, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [ann29Id, 'important', '♠️ ২৯ কার্ড ইভেন্ট: সময়সূচি ও ভেন্যু (Room 830, IICT)', ann29Body, 'Monday, 28 Sep', Date.now(), adminId]
  });

  // Announcement 3: UNO Day 01 Results
  const annUnoId = randomUUID();
  const annUnoBody =
    '🎴 UNO — DAY 01 MATCH RESULTS\n\n' +
    '🏆 MATCH-01\n' +
    'Participants: Junayed Siddique (21), Jawadun Noor (21), Raifa Zaman (25), Sushanta Paul (25), Tasmina Zerin (25), Ayesha Akter Nishat (25), Safiya Mahdeat (25), Md. Labib Rafid Majumder (22), Arnob hasan sabit (22), Goutom Das Dipto (22)\n' +
    'Winners (Top 3 Advance):\n' +
    '🥇 Sushanta Paul (25)\n' +
    '🥈 Ayesha Akter Nishat (25)\n' +
    '🥉 Raifa Zaman (25)\n\n' +
    '🏆 MATCH-02\n' +
    'Participants: F.M. Farhan Jarif (25), Upom Mazumder (25), Md. Sabuj Mahmud (21), Tareq (21), Durjoy Das (25), Md. Tanvir Hosen Anjum (25), Arifur Rahman (21), Uthpol Ghosh (21), Sifat (21), Sayed Jarif Nobbo (25)\n' +
    'Winners (Top 3 Advance):\n' +
    '🥇 Tareq (21)\n' +
    '🥈 Md. Sabuj Mahmud (21)\n' +
    '🥉 Durjoy Das (25)\n\n' +
    '🏆 MATCH-03\n' +
    'Participants: Wujair Ibn Johir (25), Tasfiah Binte Aziz (25), MD. LABID IBNA SALABAH (25), Sayeed Rahat (25), Nigar Sultana Niha (25), Tayeba Tabassum (25), Aporup Dewan (24), Muhtarima Raisa (22), Anon (24), Md Apu Rayhan (22)\n' +
    'Winners (Top 3 Advance):\n' +
    '🥇 Aporup Dewan (24)\n' +
    '🥈 Sayeed Rahat (25)\n' +
    '🥉 Muhtarima Raisa (22)\n\n' +
    '🎉 Congratulations to all the winners and participants! Best of luck for the upcoming matches!';

  await client.execute({
    sql: 'INSERT INTO announcements (id, level, title, body, time, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [annUnoId, 'update', '🎴 UNO — ডে ০১ (Day 01) ফলাফল ও উত্তীর্ণদের তালিকা', annUnoBody, 'Day 01 Result', Date.now(), adminId]
  });

  // Announcement 4: Ludo Day 01 Results
  const annLudoId = randomUUID();
  const annLudoBody =
    '🎲 Day-01 Ludo Match Results\n\n' +
    '➡️ Match 1:\n' +
    'DEBASHIS (2021831034) & 2021831038 VS Tayeba Tabassum (202561901075) & (202561901039)\n' +
    '🏆 Winner: Tayeba Tabassum & partner\n\n' +
    '➡️ Match 2:\n' +
    'Md Apu Rayhan (2022831022) & Estiak Khan(2022831032) VS Nigar Sultana Niha (202561901070) & Tasfiah Binte Aziz(202561901061)\n' +
    '🏆 Winner: Md Apu Rayhan & Estiak Khan\n\n' +
    '➡️ Match 3:\n' +
    'Sheikh Nasim Limon (2022831023) & Iftakhar Hossain Sami(2022831038) VS Tasmina Zerin (202561901073) & Raifa Zaman(202561901059)\n' +
    '🏆 Winner: Sheikh Nasim Limon & Iftakhar Hossain Sami\n\n' +
    '➡️ Match 4:\n' +
    'Tushar Das (2021831003) & (2021831037) VS Goutom Das Dipto (2022831012) & Labib Rafid Mojumder(2022831048)\n' +
    '🏆 Winner: Goutom Das Dipto & Labib Rafid Mojumder\n\n' +
    '➡️ Match 5:\n' +
    'Md. Sabuj Mahmud (2021831044) & Tareq (2021831027) VS Md. Tanvir Hosen Anjum (202561901080) & Rahmatullah Siddiquee(202561901074)\n' +
    '🏆 Winner: Md. Sabuj Mahmud & Tareq\n\n' +
    '🎉 অভিনন্দন বিজয়ী দলগুলোকে!';

  await client.execute({
    sql: 'INSERT INTO announcements (id, level, title, body, time, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [annLudoId, 'update', '🎲 লুডু — ডে ০১ (Day 01) ফলাফল ও কোয়ালিফাইং রাউন্ড', annLudoBody, 'Day 01 Result', Date.now(), adminId]
  });

  console.log('✓ All 4 Announcements created!');
  console.log('\n--- ALL UPDATES COMPLETED SUCCESSFULLY ---');
}

run().catch(err => {
  console.error('Fatal error during updates:', err);
  process.exit(1);
});
