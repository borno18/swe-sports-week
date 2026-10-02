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

async function run() {
  console.log('=== STARTING COMPLETE RESULTS UPDATE FROM FB EVENT ===');

  const now = Date.now();
  const oct2Timestamp = new Date('2026-10-02T18:00:00+06:00').getTime();
  const oct3Timestamp = new Date('2026-10-03T18:00:00+06:00').getTime();

  // 1. UPDATE CHESS TOURNAMENT (Champion: Rafin Islam Niloy, Runner-Up: Shuvashish Sarker)
  console.log('\n1. Updating Chess tournament...');
  const chessEntries = [
    { id: 'p1', name: 'Rafin Islam Niloy (2023831045)' },
    { id: 'p2', name: 'Shuvashish Sarker (2023831025)' }
  ];
  const chessBracket = {
    entries: chessEntries,
    rounds: [
      [
        {
          id: 'r1m1',
          round: 0,
          position: 0,
          a: 'p1',
          b: 'p2',
          winner: 'p1',
          bye: false,
          date: '2026-10-02',
          time: '16:00',
          venue: 'IICT',
          scoreA: '1 (Champion)',
          scoreB: '0 (Runner-Up)',
          completedAt: oct2Timestamp,
          legs: 1
        }
      ]
    ],
    format: 'knockout',
    legs: 1
  };
  const chessRes = await client.execute("SELECT version FROM tournaments WHERE id = 'chess'");
  const chessVersion = chessRes.rows.length > 0 ? Number(chessRes.rows[0].version) + 1 : 1;
  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ? WHERE id = ?',
    args: [JSON.stringify(chessBracket), chessVersion, 'chess']
  });
  await client.execute({
    sql: "UPDATE sports SET detail = 'Champion: Rafin Islam Niloy · Runner-Up: Shuvashish Sarker' WHERE slug = 'chess'"
  });
  console.log(`✓ Chess tournament updated with Champion & Runner-Up (v${chessVersion})`);


  // 2. UPDATE DART TOURNAMENT (Champion: Md. Sabuj Mahmud, Runner-Up: Rahmatullah Siddiquee)
  console.log('\n2. Updating Dart tournament...');
  const dartEntries = [
    { id: 'p1', name: 'Md. Sabuj Mahmud (21 Batch)' },
    { id: 'p2', name: 'Rahmatullah Siddiquee (25 Batch)' },
    { id: 'p3', name: 'Md. Atikur Rahman (24 Batch)' },
    { id: 'p4', name: 'Md. Shafayet Shahan Sifat (21 Batch)' },
    { id: 'p5', name: 'Junayed Siddique (21 Batch)' }
  ];
  const dartBracket = {
    entries: dartEntries,
    rounds: [
      [
        {
          id: 'r1m1',
          round: 0,
          position: 0,
          a: 'p1',
          b: 'p2',
          winner: 'p1',
          bye: false,
          date: '2026-10-02',
          time: '17:00',
          venue: 'IICT',
          scoreA: 'Champion (1st)',
          scoreB: 'Runner-Up (2nd)',
          completedAt: oct2Timestamp,
          legs: 1,
          participants: ['p1', 'p2', 'p3', 'p4', 'p5'],
          advancers: ['p1'],
          scores: {
            p1: '1st (Champion)',
            p2: '2nd (Runner-Up)',
            p3: 'Finalist',
            p4: 'Finalist',
            p5: 'Finalist'
          }
        }
      ]
    ],
    format: 'knockout',
    legs: 1
  };
  const dartRes = await client.execute("SELECT version FROM tournaments WHERE id = 'dart'");
  const dartVersion = dartRes.rows.length > 0 ? Number(dartRes.rows[0].version) + 1 : 1;
  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ? WHERE id = ?',
    args: [JSON.stringify(dartBracket), dartVersion, 'dart']
  });
  await client.execute({
    sql: "UPDATE sports SET detail = 'Champion: Md. Sabuj Mahmud · Runner-Up: Rahmatullah Siddiquee' WHERE slug = 'dart'"
  });
  console.log(`✓ Dart tournament updated with Champion & Runner-Up (v${dartVersion})`);


  // 3. UPDATE CALL BRIDGE TOURNAMENT
  console.log('\n3. Updating Call Bridge tournament...');
  const callBridgeTournId = '314b1bba-2807-4c84-8179-6912539d8f6c';
  const cbEntries = [
    { id: 'p1', name: 'Pranta Chowdhury (23)' },
    { id: 'p2', name: 'Tushar Das (21)' },
    { id: 'p3', name: 'Nazmul Islam (22)' },
    { id: 'p4', name: 'Apu Rayhan (22)' },
    { id: 'p5', name: 'Tareq Monowar (22)' },
    { id: 'p6', name: 'Arnob Hasan Sabit (22)' },
    { id: 'p7', name: 'Kawsar Ahmmed Hridoy (21)' },
    { id: 'p8', name: 'Towhidul Islam (23)' },
    { id: 'p9', name: 'Junayed Siddique (21)' },
    { id: 'p10', name: 'Rahmatullah Siddiquee (25)' },
    { id: 'p11', name: 'Zihadul Islam (22)' },
    { id: 'p12', name: 'Md Sabuj Mahmud (21)' },
    { id: 'p13', name: 'Zaid Afnan (25)' },
    { id: 'p14', name: 'Swapneel Bagchi Samya (24)' },
    { id: 'p15', name: 'Ayman Chowdhury (21)' }
  ];

  const cbBracket = {
    entries: cbEntries,
    rounds: [
      // Round 0: Round 2 & Round 3 completed matches (Day 5 & Day 6)
      [
        {
          id: 'r2m1_d5',
          round: 0,
          position: 0,
          a: 'p3',
          b: 'p5',
          winner: null,
          bye: false,
          date: '2026-10-01',
          time: '18:00',
          venue: 'Room 830, IICT',
          scoreA: '16 pts',
          scoreB: '14 pts',
          completedAt: new Date('2026-10-01T19:00:00+06:00').getTime(),
          legs: 1,
          participants: ['p3', 'p5', 'p10', 'p15'],
          advancers: ['p3', 'p5'],
          scores: { p3: '16 pts', p5: '14 pts', p10: '11 pts', p15: '-5 pts' }
        },
        {
          id: 'r3m1_d5',
          round: 0,
          position: 1,
          a: 'p1',
          b: 'p5',
          winner: null,
          bye: false,
          date: '2026-10-01',
          time: '19:30',
          venue: 'Room 830, IICT',
          scoreA: '28 pts',
          scoreB: '14 pts',
          completedAt: new Date('2026-10-01T20:30:00+06:00').getTime(),
          legs: 1,
          participants: ['p1', 'p5', 'p4', 'p14'],
          advancers: ['p1', 'p5', 'p4'],
          scores: { p1: '28 pts', p5: '14 pts', p4: '11 pts (Wildcard)', p14: '-1 pt' }
        },
        {
          id: 'r2m1_d6',
          round: 0,
          position: 2,
          a: 'p9',
          b: 'p2',
          winner: null,
          bye: false,
          date: '2026-10-02',
          time: '18:00',
          venue: 'Room 830, IICT',
          scoreA: '17 pts',
          scoreB: '11 pts',
          completedAt: oct2Timestamp,
          legs: 1,
          participants: ['p9', 'p2', 'p11', 'p12'],
          advancers: ['p9', 'p2'],
          scores: { p9: '17 pts', p2: '11 pts', p11: '6 pts', p12: '2 pts' }
        },
        {
          id: 'r3m1_d6',
          round: 0,
          position: 3,
          a: 'p3',
          b: 'p7',
          winner: null,
          bye: false,
          date: '2026-10-02',
          time: '19:00',
          venue: 'Room 830, IICT',
          scoreA: '16 pts',
          scoreB: '11 pts',
          completedAt: oct2Timestamp,
          legs: 1,
          participants: ['p3', 'p7', 'p8', 'p13'],
          advancers: ['p3', 'p7', 'p8'],
          scores: { p3: '16 pts', p7: '11 pts', p8: '3 pts (Wildcard)', p13: '-10 pts' }
        },
        {
          id: 'r3m2_d6',
          round: 0,
          position: 4,
          a: 'p2',
          b: 'p6',
          winner: null,
          bye: false,
          date: '2026-10-02',
          time: '20:00',
          venue: 'Room 830, IICT',
          scoreA: '15 pts',
          scoreB: '12 pts',
          completedAt: oct2Timestamp,
          legs: 1,
          participants: ['p2', 'p6', 'p9', 'p10'],
          advancers: ['p2', 'p6'],
          scores: { p2: '15 pts', p6: '12 pts', p9: '-1 pt', p10: '-3 pts' }
        }
      ],
      // Round 1: Semi-Finals (Day 7 — Saturday 3 Oct 2026)
      [
        {
          id: 'sf1',
          round: 1,
          position: 0,
          a: 'p1',
          b: 'p2',
          winner: null,
          bye: false,
          date: '2026-10-03',
          time: '18:00',
          venue: 'Room 830, IICT',
          scoreA: '',
          scoreB: '',
          completedAt: null,
          legs: 1,
          participants: ['p1', 'p2', 'p3', 'p4'],
          advancers: [],
          scores: {}
        },
        {
          id: 'sf2',
          round: 1,
          position: 1,
          a: 'p5',
          b: 'p6',
          winner: null,
          bye: false,
          date: '2026-10-03',
          time: '19:00',
          venue: 'Room 830, IICT',
          scoreA: '',
          scoreB: '',
          completedAt: null,
          legs: 1,
          participants: ['p5', 'p6', 'p7', 'p8'],
          advancers: [],
          scores: {}
        }
      ],
      // Round 2: Grand Final (Day 7 — Saturday 3 Oct 2026)
      [
        {
          id: 'grand_final',
          round: 2,
          position: 0,
          a: null,
          b: null,
          winner: null,
          bye: false,
          date: '2026-10-03',
          time: '20:30',
          venue: 'Room 830, IICT',
          scoreA: '',
          scoreB: '',
          completedAt: null,
          legs: 1,
          participants: [],
          advancers: [],
          scores: {}
        }
      ]
    ],
    format: 'flexible',
    legs: 1,
    playersPerGame: 4,
    totalGames: 8
  };

  const cbRes = await client.execute({
    sql: 'SELECT version FROM tournaments WHERE id = ?',
    args: [callBridgeTournId]
  });
  const cbVersion = cbRes.rows.length > 0 ? Number(cbRes.rows[0].version) + 1 : 1;
  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ?, entry_kind = ? WHERE id = ?',
    args: [JSON.stringify(cbBracket), cbVersion, 'player', callBridgeTournId]
  });
  await client.execute({
    sql: "UPDATE sports SET detail = 'Semi-Finals & Final Scheduled for Day 7 (Today)' WHERE slug = 'call-bridge'"
  });
  console.log(`✓ Call Bridge updated with R2/R3 results and SF/Final schedule (v${cbVersion})`);


  // 4. UPDATE LUDO TOURNAMENT (Day 6 results & finalists)
  console.log('\n4. Updating Ludo tournament...');
  const ludoRes = await client.execute("SELECT version, bracket FROM tournaments WHERE id = 'ludo'");
  const ludoPrevBracket = JSON.parse(ludoRes.rows[0].bracket);
  const ludoVersion = Number(ludoRes.rows[0].version) + 1;

  // New entries for Day 6
  const existingEntries = ludoPrevBracket.entries || [];
  const addEntry = (name) => {
    let found = existingEntries.find(e => e.name === name);
    if (!found) {
      found = { id: `p${existingEntries.length + 1}`, name };
      existingEntries.push(found);
    }
    return found.id;
  };

  const idAntuUtpol = addEntry('Antu Kalower (2021831052) & Utpol (2021831004)');
  const idTareqNazmul = addEntry('Tareq Monowar Musfik (2022831035) & Md. Nazmul Alam (2022831042)');
  const idArnobDigonto = addEntry('Arnob Sabit (2022831030) & Digonto (2024831046)');
  const idFariaShawon = addEntry('Faria Mahmood (2023831026) & Shawon Das (2023831015)');
  const idNasimSami = addEntry('Sheikh Nasim Limon (2022831023) & Sami (2022831038)');
  const idAbidPonkoj = addEntry('Abid (2022831019) & Ponkoj (2022831047)');
  const idApuEstiak = addEntry('Md Apu Rayhan (2022831022) & Estiak Khan (2022831032)');

  // Build rounds: Round 0 is Day 1; Round 1 is Round 3 & 4; Round 2 is Semi-Finals; Round 3 is Final
  const ludoRound1 = [
    {
      id: 'r3m1',
      round: 1,
      position: 0,
      a: idAntuUtpol,
      b: idTareqNazmul,
      winner: idAntuUtpol,
      bye: false,
      date: '2026-10-02',
      time: '16:00',
      venue: 'IICT',
      scoreA: 'W',
      scoreB: 'L',
      completedAt: oct2Timestamp,
      legs: 1,
      participants: [idAntuUtpol, idTareqNazmul],
      advancers: [idAntuUtpol],
      scores: { [idAntuUtpol]: 'Winner' }
    },
    {
      id: 'r4m1',
      round: 1,
      position: 1,
      a: idAntuUtpol,
      b: idFariaShawon,
      winner: idAntuUtpol,
      bye: false,
      date: '2026-10-02',
      time: '17:00',
      venue: 'IICT',
      scoreA: 'W',
      scoreB: 'L',
      completedAt: oct2Timestamp,
      legs: 1,
      participants: [idAntuUtpol, idFariaShawon],
      advancers: [idAntuUtpol],
      scores: { [idAntuUtpol]: 'Winner' }
    },
    {
      id: 'r4m2',
      round: 1,
      position: 2,
      a: idArnobDigonto,
      b: idNasimSami,
      winner: idArnobDigonto,
      bye: false,
      date: '2026-10-02',
      time: '17:30',
      venue: 'IICT',
      scoreA: 'W',
      scoreB: 'L',
      completedAt: oct2Timestamp,
      legs: 1,
      participants: [idArnobDigonto, idNasimSami],
      advancers: [idArnobDigonto],
      scores: { [idArnobDigonto]: 'Winner' }
    }
  ];

  const ludoRound2 = [
    {
      id: 'sf1',
      round: 2,
      position: 0,
      a: idAbidPonkoj,
      b: idArnobDigonto,
      winner: null,
      bye: false,
      date: '2026-10-03',
      time: '17:00',
      venue: 'IICT',
      scoreA: '',
      scoreB: '',
      completedAt: null,
      legs: 1,
      participants: [idAbidPonkoj, idArnobDigonto],
      advancers: [],
      scores: {}
    },
    {
      id: 'sf2',
      round: 2,
      position: 1,
      a: idAntuUtpol,
      b: idApuEstiak,
      winner: idAntuUtpol,
      bye: false,
      date: '2026-10-02',
      time: '18:30',
      venue: 'IICT',
      scoreA: 'W',
      scoreB: 'L',
      completedAt: oct2Timestamp,
      legs: 1,
      participants: [idAntuUtpol, idApuEstiak],
      advancers: [idAntuUtpol],
      scores: { [idAntuUtpol]: 'Winner (Qualified for Grand Final)' }
    }
  ];

  const ludoRound3 = [
    {
      id: 'final',
      round: 3,
      position: 0,
      a: idAntuUtpol,
      b: null,
      winner: null,
      bye: false,
      date: '2026-10-03',
      time: '19:30',
      venue: 'IICT',
      scoreA: '',
      scoreB: '',
      completedAt: null,
      legs: 1,
      participants: [idAntuUtpol],
      advancers: [],
      scores: {}
    }
  ];

  ludoPrevBracket.entries = existingEntries;
  ludoPrevBracket.rounds = [ludoPrevBracket.rounds[0], ludoRound1, ludoRound2, ludoRound3];

  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ? WHERE id = ?',
    args: [JSON.stringify(ludoPrevBracket), ludoVersion, 'ludo']
  });
  await client.execute({
    sql: "UPDATE sports SET detail = 'Grand Finalist: Antu Kalower & Utpol · SF1 Pending' WHERE slug = 'ludo'"
  });
  console.log(`✓ Ludo updated with Round 3, Round 4, Semi-Finals and Final (v${ludoVersion})`);


  // 5. UPDATE CRICKET TOURNAMENT (Semifinals: Binary Blusters vs Fakibaaz, The 9th vs Hepta Hitters)
  console.log('\n5. Updating Cricket tournament semifinals...');
  const cricketRes = await client.execute("SELECT version, bracket FROM tournaments WHERE id = 'cricket'");
  const cricketBracket = JSON.parse(cricketRes.rows[0].bracket);
  const cricketVersion = Number(cricketRes.rows[0].version) + 1;

  // Entries: p1: Fakibaaz, p3: Binary Blusters, p4: The 9th, p6: Hepta Hitters
  // Semifinal 1: Binary Blusters (p3) vs Fakibaaz (p1)
  // Semifinal 2: The 9th (p4) vs Hepta Hitters (p6)
  if (cricketBracket.rounds && cricketBracket.rounds.length > 0) {
    const sfRound = cricketBracket.rounds[0];
    if (sfRound[0]) {
      sfRound[0].a = 'p3';
      sfRound[0].b = 'p1';
      sfRound[0].date = '2026-10-02';
      sfRound[0].time = '15:00';
      sfRound[0].venue = 'Main University Ground';
    }
    if (sfRound[1]) {
      sfRound[1].a = 'p4';
      sfRound[1].b = 'p6';
      sfRound[1].date = '2026-10-02';
      sfRound[1].time = '15:45';
      sfRound[1].venue = 'Main University Ground';
    }

    if (cricketBracket.rounds[1] && cricketBracket.rounds[1][0]) {
      cricketBracket.rounds[1][0].date = '2026-10-03';
      cricketBracket.rounds[1][0].time = '15:30';
      cricketBracket.rounds[1][0].venue = 'Main University Ground';
    }
  }

  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ? WHERE id = ?',
    args: [JSON.stringify(cricketBracket), cricketVersion, 'cricket']
  });
  await client.execute({
    sql: "UPDATE sports SET detail = 'Semi Finals: Binary vs Fakibaaz · The 9th vs Hepta' WHERE slug = 'cricket'"
  });
  console.log(`✓ Cricket updated with Semifinals (v${cricketVersion})`);


  // 6. UPDATE CARROM TOURNAMENT (Semifinals: Tareq vs Nabil, Jobail vs Arnob Sabit)
  console.log('\n6. Updating Carrom tournament...');
  const carromEntries = [
    { id: 'p1', name: 'Team Tareq (22)' },
    { id: 'p2', name: 'Team Nabil (24)' },
    { id: 'p3', name: 'Team Jobail (23)' },
    { id: 'p4', name: 'Team Arnob Sabit (22)' }
  ];
  const carromBracket = {
    entries: carromEntries,
    rounds: [
      [
        {
          id: 'sf1',
          round: 0,
          position: 0,
          a: 'p1',
          b: 'p2',
          winner: null,
          bye: false,
          date: '2026-10-02',
          time: '18:45',
          venue: 'IICT',
          scoreA: '',
          scoreB: '',
          completedAt: null,
          legs: 1
        },
        {
          id: 'sf2',
          round: 0,
          position: 1,
          a: 'p3',
          b: 'p4',
          winner: null,
          bye: false,
          date: '2026-10-02',
          time: '19:30',
          venue: 'IICT',
          scoreA: '',
          scoreB: '',
          completedAt: null,
          legs: 1
        }
      ],
      [
        {
          id: 'final',
          round: 1,
          position: 0,
          a: null,
          b: null,
          winner: null,
          bye: false,
          date: '2026-10-03',
          time: '19:00',
          venue: 'IICT',
          scoreA: '',
          scoreB: '',
          completedAt: null,
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
  await client.execute({
    sql: "UPDATE sports SET detail = 'Semi-Finals: Team Tareq vs Nabil · Team Jobail vs Arnob Sabit' WHERE slug = 'carrom'"
  });
  console.log(`✓ Carrom updated with Semifinals (v${carromVersion})`);


  // 7. UPDATE MINI MILITIA TOURNAMENT
  console.log('\n7. Updating Mini Militia tournament...');
  const mmEntries = [
    // Group A
    { id: 'p1', name: 'Wujair Ibn Johir (25)' },
    { id: 'p2', name: 'J Noah (22)' },
    { id: 'p3', name: 'Anon (24)' },
    // Group C
    { id: 'p4', name: 'Wathor' },
    { id: 'p5', name: 'Joydip Majumdar Borno' },
    { id: 'p6', name: 'Upom Mazumder' },
    // Group B
    { id: 'p7', name: 'Arnob Hasan Sabit' },
    { id: 'p8', name: 'Rafin Islam Niloy' },
    { id: 'p9', name: 'Mohammad Nafiz Mahmud' },
    { id: 'p10', name: 'Nabil Ahmed' },
    { id: 'p11', name: 'F.M. Farhan Jarif' },
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
          advancers: ['p4', 'p5', 'p6'],
          scores: {
            p4: '44 Kills (+36) [Adv]',
            p5: '26 Kills (+9) [Adv]',
            p6: '9 Kills (-15) [Adv]'
          }
        },
        {
          id: 'grp_b',
          round: 0,
          position: 2,
          a: 'p7',
          b: 'p8',
          winner: null,
          bye: false,
          date: '2026-10-02',
          time: '19:00',
          venue: 'Online / IICT',
          scoreA: '',
          scoreB: '',
          completedAt: null,
          legs: 1,
          participants: ['p7', 'p8', 'p9', 'p10', 'p11', 'p12', 'p13'],
          advancers: [],
          scores: {}
        }
      ],
      // Round 1: Grand Final (2 Legs: Catacombs & Outpost)
      [
        {
          id: 'final_leg1',
          round: 1,
          position: 0,
          a: null,
          b: null,
          winner: null,
          bye: false,
          date: '2026-10-03',
          time: '20:00',
          venue: 'Catacombs (Leg 1)',
          scoreA: '',
          scoreB: '',
          completedAt: null,
          legs: 2,
          participants: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
          advancers: [],
          scores: {}
        },
        {
          id: 'final_leg2',
          round: 1,
          position: 1,
          a: null,
          b: null,
          winner: null,
          bye: false,
          date: '2026-10-03',
          time: '20:45',
          venue: 'Outpost (Leg 2)',
          scoreA: '',
          scoreB: '',
          completedAt: null,
          legs: 2,
          participants: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
          advancers: [],
          scores: {}
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
  await client.execute({
    sql: "UPDATE sports SET detail = 'Groups A & C Qualified · 2-Leg Grand Final Scheduled' WHERE slug = 'mini-militia'"
  });
  console.log(`✓ Mini Militia updated with Group Stage & 2-Leg Finals (v${mmVersion})`);


  // 8. INSERT OFFICIAL ANNOUNCEMENTS FROM EVENT COORDINATORS
  console.log('\n8. Inserting Announcements...');
  const userRes = await client.execute("SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1").catch(() => ({ rows: [] }));
  const adminId = userRes.rows.length > 0 ? String(userRes.rows[0].id) : null;

  const announcementsToInsert = [
    {
      level: 'important',
      title: '♟️ দাবা (Chess) গ্র্যান্ড ফাইনাল: চ্যাম্পিয়ন ও রানার্সআপ ঘোষণা!',
      body:
        '🏆 SWE Sports Week 2026 — Chess Tournament Final Result\n\n' +
        'অত্যন্ত রোমাঞ্চকর ফাইনাল ম্যাচ শেষে সম্পন্ন হলো এবারের দাবা প্রতিযোগিতা!\n\n' +
        '👑 CHAMPION: RAFIN ISLAM NILOY (Registration No: 2023831045)\n' +
        '🥈 RUNNER-UP: Shuvashish Sarker (Registration No: 2023831025)\n\n' +
        'উভয় খেলোয়াড়কে তাদের চমৎকার পারফরম্যান্সের জন্য অভিনন্দন ও শুভেচ্ছা!',
      time: 'Friday, 2 Oct'
    },
    {
      level: 'important',
      title: '🎯 ডার্ট (Dart) টুর্নামেন্ট: গ্র্যান্ড ফাইনাল ফলাফল ও চ্যাম্পিয়ন ঘোষণা',
      body:
        '🎯 SWE Sports Week 2026 — Dart Tournament Result\n\n' +
        'ফাইনালিস্ট পাঁচ প্রতিযোগীর মধ্যে টানটান উত্তেজনাকর লড়াই শেষে বিজয়ী:\n\n' +
        '🥇 CHAMPION: Md. Sabuj Mahmud (21 Batch)\n' +
        '🥈 RUNNER-UP: Rahmatullah Siddiquee (25 Batch)\n\n' +
        'অন্যান্য ফাইনালিস্ট:\n' +
        '• Md. Atikur Rahman (24 Batch)\n' +
        '• Md. Shafayet Shahan Sifat (21 Batch)\n' +
        '• Junayed Siddique (21 Batch)\n\n' +
        'বিজয়ীদের জানাই আন্তরিক অভিনন্দন!',
      time: 'Friday, 2 Oct'
    },
    {
      level: 'urgent',
      title: '🎴 কল ব্রিজ (Call Bridge): সেমিফাইনাল ও ফাইনাল সময়সূচি (Day 7 — Today)',
      body:
        '🃏 CALL BRIDGE TOURNAMENT — SEMI-FINAL & FINAL SCHEDULE\n' +
        '📅 Date: 03-10-2026 (Saturday / Day 7)\n' +
        '📍 Venue: Room 830, IICT\n\n' +
        '★ Semi-Final 1 Lineup (6:00 PM):\n' +
        '• Pranta Chowdhury (23 Batch)\n' +
        '• Tushar Das (21 Batch)\n' +
        '• Nazmul Islam (22 Batch)\n' +
        '• Apu Rayhan (22 Batch)\n\n' +
        '★ Semi-Final 2 Lineup (7:00 PM):\n' +
        '• Tareq Monowar (22 Batch)\n' +
        '• Arnob Hasan Sabit (22 Batch)\n' +
        '• Kawsar Ahmmed Hridoy (21 Batch)\n' +
        '• Towhidul Islam (23 Batch)\n\n' +
        '📌 Grand Final Rule: প্রতি সেমিফাইনাল থেকে শীর্ষ ২ জন খেলোয়াড় সরাসরি ৪ জনের গ্র্যান্ড ফাইনালে উত্তীর্ণ হবেন।',
      time: 'Saturday, 3 Oct'
    },
    {
      level: 'important',
      title: '🎲 লুডু (Ludo): ডে ০৬ ম্যাচের ফলাফল ও গ্র্যান্ড ফাইনালিস্ট',
      body:
        '🎲 Day-06 Ludo Match Results & Standings\n\n' +
        '• Round 3: Antu Kalower (21) & Utpol (21) def. Tareq Monowar Musfik (22) & Md. Nazmul Alam (22)\n' +
        '• Lottery Winner: Arnob Sabit (22) & Digonto (24)\n' +
        '• Round 4 (Match 1): Antu & Utpol def. Faria Mahmood (23) & Shawon Das (23)\n' +
        '• Round 4 (Match 2): Arnob & Digonto def. Sheikh Nasim Limon (22) & Sami (22)\n' +
        '• Semi-Final 2: Antu & Utpol def. Apu (22) & Estiak Khan (22) — Qualified for Final!\n\n' +
        '🔥 ১ম গ্র্যান্ড ফাইনালিস্ট: Antu Kalower & Utpol\n' +
        '⏳ অপর সেমিফাইনাল: Abid & Ponkoj VS Arnob Sabit & Digonto',
      time: 'Friday, 2 Oct'
    },
    {
      level: 'update',
      title: '🎮 মিনি মিলিশিয়া (Mini Militia): গ্রুপ পর্বের ফলাফল ও ২-লেগ গ্র্যান্ড ফাইনাল',
      body:
        '🔥 MINI MILITIA UPDATE & FINALISTS\n\n' +
        '★ Group A Qualifiers:\n' +
        '🥇 Wujair Ibn Johir — 25 Kills (+10)\n' +
        '🥈 J Noah — 22 Kills (+7)\n' +
        '🥉 Anon — 20 Kills (+1)\n\n' +
        '★ Group C Qualifiers:\n' +
        '🥇 Wathor — 44 Kills (+36)\n' +
        '🥈 Joydip Majumdar Borno — 26 Kills (+9)\n' +
        '🥉 Upom Mazumder — 9 Kills (-15)\n\n' +
        '★ Group B Decider:\n' +
        'Arnob Hasan Sabit, Rafin Islam Niloy, Mohammad Nafiz Mahmud, Nabil Ahmed, F.M. Farhan Jarif, Zaid Afnan, Estiak Khan (শীর্ষ ৩ জন উত্তীর্ণ হবেন)\n\n' +
        '🏆 Grand Final Format: ৯ জন ফাইনালিস্টকে নিয়ে Catacombs (Leg 1) এবং Outpost (Leg 2) এই দুই লেগের সমন্বয়ে চূড়ান্ত বিজয়ী নির্ধারিত হবে!',
      time: 'Friday, 2 Oct'
    },
    {
      level: 'update',
      title: '🏏 ক্রিকেট (Cricket): সেমিফাইনাল লাইনআপ ও খেলার সময়',
      body:
        '🏏 SWE SPORTS WEEK 2026 — CRICKET SEMI-FINALS\n' +
        '📍 Venue: Main University Ground\n\n' +
        '• Semifinal 1 (3:00 PM): Binary Blusters vs Fakibaaz\n' +
        '• Semifinal 2 (3:45 PM): The 9th vs Hepta Hitters\n\n' +
        'প্রতিটি দলকে নির্ধারিত সময়ের অন্তত ১৫ মিনিট পূর্বে মাঠে উপস্থিত থাকার জন্য অনুরোধ জানানো যাচ্ছে।',
      time: 'Friday, 2 Oct'
    },
    {
      level: 'update',
      title: '◉ ক্যারম (Carrom): সেমিফাইনাল সময়সূচি ও ওয়াকওভার সতর্কবার্তা',
      body:
        '◉ CARROM SEMIFINALS SCHEDULE\n' +
        '📍 Venue: Room 830, IICT\n\n' +
        '• Semifinal 1 (6:45 PM): Team Tareq (22) vs Team Nabil (24)\n' +
        '• Semifinal 2 (7:30 PM): Team Jobail (23) vs Team Arnob Sabit (22)\n\n' +
        '⚠️ সতর্কবার্তা: নির্ধারিত সময়ের ১০ মিনিটের মধ্যে কোনো দল উপস্থিত না থাকলে প্রতিপক্ষকে ওয়াকওভার প্রদান করা হবে।',
      time: 'Friday, 2 Oct'
    }
  ];

  for (const ann of announcementsToInsert) {
    const id = randomUUID();
    await client.execute({
      sql: 'INSERT INTO announcements (id, level, title, body, time, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [id, ann.level, ann.title, ann.body, ann.time, now, adminId]
    });
    console.log(`✓ Added announcement: ${ann.title}`);
  }

  console.log('\n=== ALL UPDATES COMPLETED SUCCESSFULLY! ===');
}

run().catch(err => {
  console.error('Error updating tournament results:', err);
  process.exit(1);
});
