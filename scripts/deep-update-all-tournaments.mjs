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
  console.log('=== STARTING DEEP TOURNAMENT DATA UPDATES ===');

  const now = Date.now();
  const oct1Timestamp = new Date('2026-10-01T18:00:00+06:00').getTime();
  const oct2Timestamp = new Date('2026-10-02T18:00:00+06:00').getTime();
  const oct3Timestamp = new Date('2026-10-03T18:00:00+06:00').getTime();

  // -------------------------------------------------------------
  // 1. FOOTBALL: UPDATE GROUP MATCH RESULTS & SEMI-FINAL FIXTURES
  // -------------------------------------------------------------
  console.log('\n1. Updating Football tournament...');
  const fbRes = await client.execute("SELECT version, bracket FROM tournaments WHERE id = 'football'");
  if (fbRes.rows.length > 0) {
    const fbBracket = JSON.parse(fbRes.rows[0].bracket);
    const fbVersion = Number(fbRes.rows[0].version) + 1;

    // Entries: p1: ByteForce FC, p2: House Of Interaction, p3: The Overclocked, p4: Jani na, p5: The 9th, p6: Team Prompt Engineers, p7: fakibazz, p8: Recursion FC
    // Check group stage matches
    const gs = fbBracket.groupStageRounds?.flat() ?? [];
    for (const m of gs) {
      // Prompt Engineers (p6) 1 - 1 Fakibaaz (p7)
      if ((m.a === 'p6' && m.b === 'p7') || (m.a === 'p7' && m.b === 'p6')) {
        m.scoreA = '1';
        m.scoreB = '1';
        m.winner = 'draw';
        m.completedAt = new Date('2026-09-27T16:00:00+06:00').getTime();
      }
      // Jani na (p4) 1 - 4 House of Interaction (p2)
      if ((m.a === 'p4' && m.b === 'p2') || (m.a === 'p2' && m.b === 'p4')) {
        if (m.a === 'p4') { m.scoreA = '1'; m.scoreB = '4'; m.winner = 'p2'; }
        else { m.scoreA = '4'; m.scoreB = '1'; m.winner = 'p2'; }
        m.completedAt = new Date('2026-09-27T17:00:00+06:00').getTime();
      }
    }

    // Knockout Round 0: Semifinals (Oct 01)
    // SF 1: The 9th (p5) vs The Overclocked (p3)
    // SF 2: FC Recursion (p8) vs Byteforce FC (p1)
    if (fbBracket.rounds && fbBracket.rounds.length > 0) {
      const sfRound = fbBracket.rounds[0];
      if (sfRound[0]) {
        sfRound[0].a = 'p5';
        sfRound[0].b = 'p3';
        sfRound[0].date = '2026-10-01';
        sfRound[0].time = '15:30';
        sfRound[0].venue = 'Main University Ground';
      }
      if (sfRound[1]) {
        sfRound[1].a = 'p8';
        sfRound[1].b = 'p1';
        sfRound[1].date = '2026-10-01';
        sfRound[1].time = '16:30';
        sfRound[1].venue = 'Main University Ground';
      }
      if (fbBracket.rounds[1] && fbBracket.rounds[1][0]) {
        fbBracket.rounds[1][0].date = '2026-10-03';
        fbBracket.rounds[1][0].time = '16:00';
        fbBracket.rounds[1][0].venue = 'Main University Ground';
      }
    }

    await client.execute({
      sql: 'UPDATE tournaments SET bracket = ?, version = ? WHERE id = ?',
      args: [JSON.stringify(fbBracket), fbVersion, 'football']
    });
    await client.execute({
      sql: "UPDATE sports SET detail = 'Semi-Finals: The 9th vs The Overclocked · Recursion vs Byteforce' WHERE slug = 'football'"
    });
    console.log(`✓ Football updated with Semifinals (The 9th vs Overclocked, Recursion vs Byteforce) (v${fbVersion})`);
  }


  // -------------------------------------------------------------
  // 2. EA FC 26 (FIFA) ESPORTS TOURNAMENT
  // -------------------------------------------------------------
  console.log('\n2. Updating EA FC 26 (FIFA) tournament...');
  const fifaEntries = [
    // Group A
    { id: 'p1', name: 'Nafis Uddin (23)' },
    { id: 'p2', name: 'Shagnik Paul (22)' },
    { id: 'p3', name: 'Zaid Afnan (25)' },
    { id: 'p4', name: 'Md. Hasan Kabir (24)' },
    // Group B
    { id: 'p5', name: 'Samin Yasar (25)' },
    { id: 'p6', name: 'Mohammed Shahdin Alam (25)' },
    { id: 'p7', name: 'Imtiaz Haque Mahin (24)' },
    { id: 'p8', name: 'Abu Jobail (23)' },
    { id: 'p9', name: 'Faiyaz Abid Muhib (24)' },
    // Group C
    { id: 'p10', name: 'Abil Waquer Zihan (24)' },
    { id: 'p11', name: 'Mohammed Nafiz Mahmud (24)' },
    { id: 'p12', name: 'Md. Labid Ibna Salabah (25)' },
    { id: 'p13', name: 'Abu Ahosun Anonno (24)' },
    // Group D
    { id: 'p14', name: 'Sushanta Paul (25)' },
    { id: 'p15', name: 'Fahad Mahbub (24)' },
    { id: 'p16', name: 'Aanon (24)' },
    { id: 'p17', name: 'Aritro Ghosh (24)' }
  ];

  const fifaMatches = [
    // Group A
    { id: 'ga_m1', round: 0, position: 0, a: 'p1', b: 'p2', winner: 'p1', scoreA: '7', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:00', venue: 'Room 830, IICT', bye: false, legs: 1 },
    { id: 'ga_m2', round: 0, position: 1, a: 'p3', b: 'p4', winner: 'p3', scoreA: '3', scoreB: '0 (WO)', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:20', venue: 'Room 830, IICT', bye: false, legs: 1 },
    { id: 'ga_m3', round: 0, position: 2, a: 'p3', b: 'p1', winner: 'p3', scoreA: '3', scoreB: '2', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:40', venue: 'Room 830, IICT', bye: false, legs: 1 },
    { id: 'ga_m4', round: 0, position: 3, a: 'p3', b: 'p2', winner: 'p3', scoreA: '2', scoreB: '1', completedAt: oct1Timestamp, date: '2026-09-30', time: '18:00', venue: 'Room 830, IICT', bye: false, legs: 1 },
    { id: 'ga_m5', round: 0, position: 4, a: 'p1', b: 'p4', winner: 'p1', scoreA: '5', scoreB: '2', completedAt: oct1Timestamp, date: '2026-09-30', time: '18:20', venue: 'Room 830, IICT', bye: false, legs: 1 },
    // Group B
    { id: 'gb_m1', round: 0, position: 5, a: 'p6', b: 'p7', winner: 'p6', scoreA: '4', scoreB: '3', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:00', venue: 'Room 830, IICT', bye: false, legs: 1 },
    { id: 'gb_m2', round: 0, position: 6, a: 'p5', b: 'p8', winner: 'p5', scoreA: '4', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:20', venue: 'Room 830, IICT', bye: false, legs: 1 },
    { id: 'gb_m3', round: 0, position: 7, a: 'p5', b: 'p6', winner: 'p5', scoreA: '3', scoreB: '2', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:40', venue: 'Room 830, IICT', bye: false, legs: 1 },
    { id: 'gb_m4', round: 0, position: 8, a: 'p5', b: 'p7', winner: 'p5', scoreA: '4', scoreB: '3', completedAt: oct1Timestamp, date: '2026-09-30', time: '18:00', venue: 'Room 830, IICT', bye: false, legs: 1 },
    { id: 'gb_m5', round: 0, position: 9, a: 'p6', b: 'p8', winner: 'p6', scoreA: '9', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '18:20', venue: 'Room 830, IICT', bye: false, legs: 1 },
    { id: 'gb_m6', round: 0, position: 10, a: 'p5', b: 'p9', winner: 'p5', scoreA: '3', scoreB: '2', completedAt: oct1Timestamp, date: '2026-09-30', time: '18:40', venue: 'Room 830, IICT', bye: false, legs: 1 },
    { id: 'gb_m7', round: 0, position: 11, a: 'p6', b: 'p9', winner: 'p6', scoreA: '1', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '19:00', venue: 'Room 830, IICT', bye: false, legs: 1 },
    // Group C
    { id: 'gc_m1', round: 0, position: 12, a: 'p10', b: 'p11', winner: 'p10', scoreA: '7', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:30', venue: 'Room 830, IICT', bye: false, legs: 1 },
    { id: 'gc_m2', round: 0, position: 13, a: 'p11', b: 'p13', winner: 'p11', scoreA: '3', scoreB: '0 (WO)', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:50', venue: 'Room 830, IICT', bye: false, legs: 1 },
    { id: 'gc_m3', round: 0, position: 14, a: 'p10', b: 'p12', winner: 'p10', scoreA: '5', scoreB: '1', completedAt: oct1Timestamp, date: '2026-09-30', time: '18:10', venue: 'Room 830, IICT', bye: false, legs: 1 },
    { id: 'gc_m4', round: 0, position: 15, a: 'p10', b: 'p13', winner: 'p10', scoreA: '3', scoreB: '0 (WO)', completedAt: oct1Timestamp, date: '2026-09-30', time: '18:30', venue: 'Room 830, IICT', bye: false, legs: 1 },
    // Group D
    { id: 'gd_m1', round: 0, position: 16, a: 'p15', b: 'p16', winner: 'p15', scoreA: '3', scoreB: '1', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:30', venue: 'Room 830, IICT', bye: false, legs: 1 },
    { id: 'gd_m2', round: 0, position: 17, a: 'p14', b: 'p17', winner: 'p14', scoreA: '7', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:50', venue: 'Room 830, IICT', bye: false, legs: 1 },
    { id: 'gd_m3', round: 0, position: 18, a: 'p14', b: 'p16', winner: 'p14', scoreA: '3', scoreB: '0 (WO)', completedAt: oct1Timestamp, date: '2026-09-30', time: '18:10', venue: 'Room 830, IICT', bye: false, legs: 1 }
  ];

  const fifaKnockoutRound = [
    // Quarter-Finals
    { id: 'qf1', round: 1, position: 0, a: 'p3', b: 'p6', winner: null, scoreA: '', scoreB: '', date: '2026-10-02', time: '19:00', venue: 'Room 830, IICT', bye: false, legs: 2 },
    { id: 'qf2', round: 1, position: 1, a: 'p5', b: 'p1', winner: null, scoreA: '', scoreB: '', date: '2026-10-02', time: '19:30', venue: 'Room 830, IICT', bye: false, legs: 2 },
    { id: 'qf3', round: 1, position: 2, a: 'p10', b: 'p15', winner: null, scoreA: '', scoreB: '', date: '2026-10-02', time: '20:00', venue: 'Room 830, IICT', bye: false, legs: 2 },
    { id: 'qf4', round: 1, position: 3, a: 'p14', b: 'p11', winner: null, scoreA: '', scoreB: '', date: '2026-10-02', time: '20:30', venue: 'Room 830, IICT', bye: false, legs: 2 }
  ];

  const fifaBracket = {
    entries: fifaEntries,
    rounds: [fifaMatches, fifaKnockoutRound],
    format: 'flexible',
    legs: 1
  };

  const fifaRes = await client.execute("SELECT version FROM tournaments WHERE id = 'fifa'");
  const fifaVersion = fifaRes.rows.length > 0 ? Number(fifaRes.rows[0].version) + 1 : 1;
  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ?, entry_kind = ? WHERE id = ?',
    args: [JSON.stringify(fifaBracket), fifaVersion, 'player', 'fifa']
  });
  await client.execute({
    sql: "UPDATE sports SET detail = 'Group Stage Completed · Quarter Finals: Zaid, Samin, Zihan, Sushanta' WHERE slug = 'fifa'"
  });
  console.log(`✓ FIFA (EA FC 26) updated with 17 players, 19 group matches & QFs (v${fifaVersion})`);


  // -------------------------------------------------------------
  // 3. TABLE TENNIS: MALE & FEMALE TOURNAMENT
  // -------------------------------------------------------------
  console.log('\n3. Updating Table Tennis tournament...');
  const ttEntries = [
    // Male
    { id: 'p1', name: 'Tushar (21)' },
    { id: 'p2', name: 'Nazmul (23)' },
    { id: 'p3', name: 'Tareq (22)' },
    { id: 'p4', name: 'Nahian (24)' },
    { id: 'p5', name: 'Aporup (24)' },
    { id: 'p6', name: 'Sushanto (25)' },
    { id: 'p7', name: 'Shahin (23)' },
    { id: 'p8', name: 'Labib (22)' },
    { id: 'p9', name: 'Arnob Sabit (22)' },
    { id: 'p10', name: 'Aurnob (24)' },
    { id: 'p11', name: 'Nazmul (22)' },
    { id: 'p12', name: 'Zaid (25)' },
    // Female
    { id: 'pf1', name: 'Sadiya (25)' },
    { id: 'pf2', name: 'Sumaiya (25)' },
    { id: 'pf3', name: 'Ishra (25)' },
    { id: 'pf4', name: 'Niha (25)' },
    { id: 'pf5', name: 'Safiya (25)' }
  ];

  const ttRound0 = [
    // Day 1 Male Knockout
    { id: 'm_r1m1', round: 0, position: 0, a: 'p1', b: 'p2', winner: 'p1', scoreA: 'W', scoreB: 'L', completedAt: oct1Timestamp, date: '2026-09-29', time: '17:00', venue: 'IICT Table', bye: false, legs: 1 },
    { id: 'm_r1m2', round: 0, position: 1, a: 'p3', b: 'p4', winner: 'p3', scoreA: 'W', scoreB: 'L', completedAt: oct1Timestamp, date: '2026-09-29', time: '17:20', venue: 'IICT Table', bye: false, legs: 1 },
    { id: 'm_r1m3', round: 0, position: 2, a: 'p5', b: 'p6', winner: 'p5', scoreA: 'W', scoreB: 'L', completedAt: oct1Timestamp, date: '2026-09-29', time: '17:40', venue: 'IICT Table', bye: false, legs: 1 },
    { id: 'm_r1m4', round: 0, position: 3, a: 'p7', b: 'p8', winner: 'p7', scoreA: 'W', scoreB: 'L', completedAt: oct1Timestamp, date: '2026-09-29', time: '18:00', venue: 'IICT Table', bye: false, legs: 1 },
    // Female Round Robin Day 2
    { id: 'f_m1', round: 0, position: 4, a: 'pf2', b: 'pf4', winner: 'pf2', scoreA: '3', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:30', venue: 'IICT Table', bye: false, legs: 1 },
    { id: 'f_m2', round: 0, position: 5, a: 'pf3', b: 'pf5', winner: 'pf3', scoreA: '3', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:45', venue: 'IICT Table', bye: false, legs: 1 },
    { id: 'f_m3', round: 0, position: 6, a: 'pf1', b: 'pf2', winner: 'pf1', scoreA: '3', scoreB: '1', completedAt: oct1Timestamp, date: '2026-09-30', time: '18:00', venue: 'IICT Table', bye: false, legs: 1 },
    { id: 'f_m4', round: 0, position: 7, a: 'pf1', b: 'pf5', winner: 'pf1', scoreA: '3', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '18:15', venue: 'IICT Table', bye: false, legs: 1 }
  ];

  const ttRound1 = [
    // Male QF & SF (Oct 01)
    { id: 'm_qf1', round: 1, position: 0, a: 'p9', b: 'p10', winner: null, scoreA: '', scoreB: '', date: '2026-10-01', time: '17:00', venue: 'IICT Table', bye: false, legs: 1 },
    { id: 'm_qf2', round: 1, position: 1, a: 'p1', b: 'p11', winner: null, scoreA: '', scoreB: '', date: '2026-10-01', time: '17:20', venue: 'IICT Table', bye: false, legs: 1 },
    { id: 'm_qf3', round: 1, position: 2, a: 'p12', b: 'p5', winner: null, scoreA: '', scoreB: '', date: '2026-10-01', time: '17:40', venue: 'IICT Table', bye: false, legs: 1 },
    { id: 'm_sf1', round: 1, position: 3, a: 'p7', b: null, winner: null, scoreA: '', scoreB: '', date: '2026-10-01', time: '18:15', venue: 'IICT Table', bye: false, legs: 1 },
    // Female Final Day Matches (Oct 01)
    { id: 'f_m5', round: 1, position: 4, a: 'pf4', b: 'pf3', winner: null, scoreA: '', scoreB: '', date: '2026-10-01', time: '18:00', venue: 'IICT Table', bye: false, legs: 1 },
    { id: 'f_m6', round: 1, position: 5, a: 'pf2', b: 'pf5', winner: null, scoreA: '', scoreB: '', date: '2026-10-01', time: '18:10', venue: 'IICT Table', bye: false, legs: 1 },
    { id: 'f_m7', round: 1, position: 6, a: 'pf1', b: 'pf3', winner: null, scoreA: '', scoreB: '', date: '2026-10-01', time: '18:20', venue: 'IICT Table', bye: false, legs: 1 },
    { id: 'f_m8', round: 1, position: 7, a: 'pf5', b: 'pf4', winner: null, scoreA: '', scoreB: '', date: '2026-10-01', time: '18:30', venue: 'IICT Table', bye: false, legs: 1 }
  ];

  const ttBracket = {
    entries: ttEntries,
    rounds: [ttRound0, ttRound1],
    format: 'flexible',
    legs: 1
  };

  const ttRes = await client.execute("SELECT version FROM tournaments WHERE id = 'table-tennis'");
  const ttVersion = ttRes.rows.length > 0 ? Number(ttRes.rows[0].version) + 1 : 1;
  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ?, entry_kind = ? WHERE id = ?',
    args: [JSON.stringify(ttBracket), ttVersion, 'player', 'table-tennis']
  });
  await client.execute({
    sql: "UPDATE sports SET detail = 'Male Knockout & Female Round-Robin · Final Stages' WHERE slug = 'table-tennis'"
  });
  console.log(`✓ Table Tennis updated with Male & Female entries, Day 1-2 results, and finals (v${ttVersion})`);


  // -------------------------------------------------------------
  // 4. PEN FIGHT TOURNAMENT
  // -------------------------------------------------------------
  console.log('\n4. Updating Pen Fight tournament...');
  const pfEntries = [
    { id: 'p1', name: 'Kawsar Ahmmed Hridoy (21)' },
    { id: 'p2', name: 'Humayra Mahi (22)' },
    { id: 'p3', name: 'Fatema (22)' },
    { id: 'p4', name: 'Nazmul Islam (22)' },
    { id: 'p5', name: 'Upom Mazumder (25)' },
    { id: 'p6', name: 'Nasim (22)' },
    { id: 'p7', name: 'Rahmatullah Siddiquee (25)' },
    { id: 'p8', name: 'Nabil Ahmed (24)' },
    { id: 'p9', name: 'Rayeed (23)' },
    { id: 'p10', name: 'Md. Atikur Rahman (24)' },
    // Group Qualifiers
    { id: 'p11', name: 'Md Redwan Hasan (21)' },
    { id: 'p12', name: 'Arifur Rahman (21)' },
    { id: 'p13', name: 'Jawadun Noor (21)' },
    { id: 'p14', name: 'Estiak Khan (22)' },
    { id: 'p15', name: 'Muhtarima Raisa (22)' },
    { id: 'p16', name: 'Shahriar Habib Fagun (23)' },
    { id: 'p17', name: 'Tareq Monowar (22)' }
  ];

  const pfRound0 = [
    {
      id: 'pf_d1',
      round: 0,
      position: 0,
      a: 'p1',
      b: 'p6',
      winner: null,
      scoreA: '',
      scoreB: '',
      completedAt: oct1Timestamp,
      date: '2026-09-29',
      time: '18:00',
      venue: 'Room 830, IICT',
      bye: false,
      legs: 1,
      participants: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
      advancers: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
      scores: { p1: 'Day 1 Winner', p2: 'Day 1 Winner', p3: 'Day 1 Winner', p4: 'Day 1 Winner', p5: 'Day 1 Winner', p6: 'Day 1 Winner' }
    },
    {
      id: 'pf_d2',
      round: 0,
      position: 1,
      a: 'p7',
      b: 'p10',
      winner: null,
      scoreA: '',
      scoreB: '',
      completedAt: oct1Timestamp,
      date: '2026-09-30',
      time: '18:00',
      venue: 'Room 830, IICT',
      bye: false,
      legs: 1,
      participants: ['p7', 'p8', 'p9', 'p10'],
      advancers: ['p7', 'p8', 'p9', 'p10'],
      scores: { p7: 'Day 2 Winner', p8: 'Day 2 Winner', p9: 'Day 2 Winner', p10: 'Day 2 Winner' }
    }
  ];

  const pfRound1 = [
    {
      id: 'pf_qualifier',
      round: 1,
      position: 0,
      a: 'p11',
      b: 'p12',
      winner: null,
      scoreA: '',
      scoreB: '',
      date: '2026-10-01',
      time: '18:30',
      venue: 'Room 830, IICT',
      bye: false,
      legs: 1,
      participants: ['p11', 'p12', 'p13', 'p14', 'p15', 'p16', 'p17'],
      advancers: [],
      scores: {}
    },
    {
      id: 'pf_sf1',
      round: 1,
      position: 1,
      a: 'p1',
      b: 'p6',
      winner: null,
      scoreA: '',
      scoreB: '',
      date: '2026-10-01',
      time: '19:00',
      venue: 'Room 830, IICT',
      bye: false,
      legs: 1,
      participants: ['p1', 'p6', 'p10', 'p2', 'p9'],
      advancers: [],
      scores: {}
    },
    {
      id: 'pf_sf2',
      round: 1,
      position: 2,
      a: 'p3',
      b: 'p4',
      winner: null,
      scoreA: '',
      scoreB: '',
      date: '2026-10-01',
      time: '20:30',
      venue: 'Room 830, IICT',
      bye: false,
      legs: 1,
      participants: ['p3', 'p4', 'p7', 'p5', 'p8'],
      advancers: [],
      scores: {}
    }
  ];

  const pfBracket = {
    entries: pfEntries,
    rounds: [pfRound0, pfRound1],
    format: 'flexible',
    legs: 1
  };

  const pfRes = await client.execute("SELECT version FROM tournaments WHERE id = 'pen-fight'");
  const pfVersion = pfRes.rows.length > 0 ? Number(pfRes.rows[0].version) + 1 : 1;
  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ?, entry_kind = ? WHERE id = ?',
    args: [JSON.stringify(pfBracket), pfVersion, 'player', 'pen-fight']
  });
  await client.execute({
    sql: "UPDATE sports SET detail = 'Survival Battles · Semi-Finals: Hridoy, Nasim, Atikur, Fatema, Nazmul' WHERE slug = 'pen-fight'"
  });
  console.log(`✓ Pen Fight updated with 17 players, Days 1-2 winners & Semi-Finals (v${pfVersion})`);


  // -------------------------------------------------------------
  // 5. UNO GRAND FINAL UPDATE (8 Finalists)
  // -------------------------------------------------------------
  console.log('\n5. Updating UNO Grand Finalists...');
  const unoRes = await client.execute("SELECT version, bracket FROM tournaments WHERE id = 'uno'");
  if (unoRes.rows.length > 0) {
    const unoBracket = JSON.parse(unoRes.rows[0].bracket);
    const unoVersion = Number(unoRes.rows[0].version) + 1;

    const unoFinalists = [
      'Sushanta Paul Nibir (25 Batch)',
      'Md. Nafiz Mahmud (24 Batch)',
      'Fatiha Tasnim Upoma (23 Batch)',
      'Syed Tahsin Ar Rafi (25 Batch)',
      'Sharmin Sultana Jui (22 Batch)',
      'Nabila Tabassum (22 Batch)',
      'Hazera Ritu (21 Batch)',
      'Sayeed Rahat (25 Batch)'
    ];

    const getOrAddUnoEntry = (name) => {
      let found = unoBracket.entries.find(e => e.name === name);
      if (!found) {
        found = { id: `p${unoBracket.entries.length + 1}`, name };
        unoBracket.entries.push(found);
      }
      return found.id;
    };

    const finalParticipantIds = unoFinalists.map(getOrAddUnoEntry);

    const unoGrandFinalMatch = {
      id: 'uno_grand_final',
      round: 1,
      position: 0,
      a: finalParticipantIds[0],
      b: finalParticipantIds[1],
      winner: null,
      bye: false,
      date: '2026-10-01',
      time: '20:00',
      venue: 'Room 830, IICT',
      scoreA: '',
      scoreB: '',
      completedAt: null,
      legs: 1,
      participants: finalParticipantIds,
      advancers: [],
      scores: {}
    };

    unoBracket.rounds[1] = [unoGrandFinalMatch];

    await client.execute({
      sql: 'UPDATE tournaments SET bracket = ?, version = ? WHERE id = ?',
      args: [JSON.stringify(unoBracket), unoVersion, 'uno']
    });
    await client.execute({
      sql: "UPDATE sports SET detail = '8 Grand Finalists: Sushanta, Nafiz, Upoma, Tahsin, Jui, Nabila, Ritu, Rahat' WHERE slug = 'uno'"
    });
    console.log(`✓ UNO updated with 8 Grand Finalists (v${unoVersion})`);
  }


  // -------------------------------------------------------------
  // 6. CHESS COMPLETE BRACKET (Preliminary, R16, QF, and Final)
  // -------------------------------------------------------------
  console.log('\n6. Updating Chess complete tournament history...');
  const chessFullEntries = [
    { id: 'p1', name: 'RAFIN ISLAM NILOY (2023831045)' },
    { id: 'p2', name: 'Shuvashish Sarker (2023831025)' },
    { id: 'p3', name: 'Iftakhar Hossain Sami (22)' },
    { id: 'p4', name: 'Sushanto Tanchangya (25)' },
    { id: 'p5', name: 'Sayed Jarif Nobbo (25)' },
    { id: 'p6', name: 'A. S. M. Sajid Al Faisal Shihan (25)' },
    { id: 'p7', name: 'Kazi Ilhum Sarwar Chowdhury (24)' },
    { id: 'p8', name: 'Durjoy Das (25)' },
    { id: 'p9', name: 'Goutom Das Dipto (22)' },
    { id: 'p10', name: 'Tareq Monowar (22)' },
    { id: 'p11', name: 'F.M. Farhan Jarif (25)' },
    { id: 'p12', name: 'Arnob Hasan Sabit (22)' },
    { id: 'p13', name: 'Upom Mazumder (25)' },
    { id: 'p14', name: 'Wujair Ibn Johir (25)' },
    { id: 'p15', name: 'Md. Sabuj Mahmud (21)' },
    { id: 'p16', name: 'Raj Bhowmik Sany (25)' }
  ];

  const chessR16 = [
    { id: 'r16_m1', round: 0, position: 0, a: 'p4', b: 'p9', winner: 'p4', scoreA: '1', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '16:00', venue: 'IICT', bye: false, legs: 1 },
    { id: 'r16_m2', round: 0, position: 1, a: 'p6', b: 'p10', winner: 'p6', scoreA: '1', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '16:20', venue: 'IICT', bye: false, legs: 1 },
    { id: 'r16_m3', round: 0, position: 2, a: 'p2', b: 'p11', winner: 'p2', scoreA: '1', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '16:40', venue: 'IICT', bye: false, legs: 1 },
    { id: 'r16_m4', round: 0, position: 3, a: 'p5', b: 'p12', winner: 'p5', scoreA: '1', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:00', venue: 'IICT', bye: false, legs: 1 },
    { id: 'r16_m5', round: 0, position: 4, a: 'p3', b: 'p13', winner: 'p3', scoreA: '1', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:20', venue: 'IICT', bye: false, legs: 1 },
    { id: 'r16_m6', round: 0, position: 5, a: 'p7', b: 'p14', winner: 'p7', scoreA: '1', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '17:40', venue: 'IICT', bye: false, legs: 1 },
    { id: 'r16_m7', round: 0, position: 6, a: 'p8', b: 'p15', winner: 'p8', scoreA: '1', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '18:00', venue: 'IICT', bye: false, legs: 1 },
    { id: 'r16_m8', round: 0, position: 7, a: 'p1', b: 'p16', winner: 'p1', scoreA: '1', scoreB: '0', completedAt: oct1Timestamp, date: '2026-09-30', time: '18:20', venue: 'IICT', bye: false, legs: 1 }
  ];

  const chessQF = [
    { id: 'qf_m1', round: 1, position: 0, a: 'p3', b: 'p4', winner: 'p3', scoreA: '1', scoreB: '0', completedAt: oct1Timestamp, date: '2026-10-01', time: '16:00', venue: 'IICT', bye: false, legs: 1 },
    { id: 'qf_m2', round: 1, position: 1, a: 'p2', b: 'p5', winner: 'p2', scoreA: '1', scoreB: '0', completedAt: oct1Timestamp, date: '2026-10-01', time: '16:30', venue: 'IICT', bye: false, legs: 1 },
    { id: 'qf_m3', round: 1, position: 2, a: 'p6', b: 'p7', winner: 'p6', scoreA: '1', scoreB: '0', completedAt: oct1Timestamp, date: '2026-10-01', time: '17:00', venue: 'IICT', bye: false, legs: 1 },
    { id: 'qf_m4', round: 1, position: 3, a: 'p8', b: 'p1', winner: 'p1', scoreA: '0', scoreB: '1', completedAt: oct1Timestamp, date: '2026-10-01', time: '17:30', venue: 'IICT', bye: false, legs: 1 }
  ];

  const chessSF = [
    { id: 'sf_m1', round: 2, position: 0, a: 'p3', b: 'p2', winner: 'p2', scoreA: '0', scoreB: '1', completedAt: oct2Timestamp, date: '2026-10-02', time: '15:00', venue: 'IICT', bye: false, legs: 1 },
    { id: 'sf_m2', round: 2, position: 1, a: 'p6', b: 'p1', winner: 'p1', scoreA: '0', scoreB: '1', completedAt: oct2Timestamp, date: '2026-10-02', time: '15:30', venue: 'IICT', bye: false, legs: 1 }
  ];

  const chessFinal = [
    { id: 'grand_final', round: 3, position: 0, a: 'p1', b: 'p2', winner: 'p1', scoreA: '1 (Champion)', scoreB: '0 (Runner-Up)', completedAt: oct2Timestamp, date: '2026-10-02', time: '16:30', venue: 'IICT', bye: false, legs: 1 }
  ];

  const chessBracketFull = {
    entries: chessFullEntries,
    rounds: [chessR16, chessQF, chessSF, chessFinal],
    format: 'knockout',
    legs: 1
  };

  const chessRes2 = await client.execute("SELECT version FROM tournaments WHERE id = 'chess'");
  const chessVersion2 = Number(chessRes2.rows[0].version) + 1;
  await client.execute({
    sql: 'UPDATE tournaments SET bracket = ?, version = ? WHERE id = ?',
    args: [JSON.stringify(chessBracketFull), chessVersion2, 'chess']
  });
  console.log(`✓ Chess tournament updated with complete tournament bracket through Grand Final (v${chessVersion2})`);


  // -------------------------------------------------------------
  // 7. INSERT ADDITIONAL ANNOUNCEMENTS FOR REVEALED SEGMENTS
  // -------------------------------------------------------------
  console.log('\n7. Inserting Coordinator Announcements for all newly scraped segments...');
  const userRes = await client.execute("SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1").catch(() => ({ rows: [] }));
  const adminId = userRes.rows.length > 0 ? String(userRes.rows[0].id) : null;

  const newAnnouncements = [
    {
      level: 'important',
      title: '⚽ ফুটবল (Football): সেমিফাইনাল ফিক্সচার ও খেলার সময়সূচি',
      body:
        '🔥 SWE SPORTS WEEK 2026 — FOOTBALL SEMI-FINALS\n' +
        '📍 Venue: Main University Ground\n\n' +
        '★ Semi-Final 1 (3:30 PM – 4:30 PM):\n' +
        '• The 9th VS The Overclocked\n\n' +
        '★ Semi-Final 2 (4:30 PM – 5:30 PM):\n' +
        '• FC Recursion VS Byteforce FC\n\n' +
        '🏆 বিজয়ী দল দুটি সরাসরি গ্র্যান্ড ফাইনালে মুখোমুখি হবে!',
      time: 'Thursday, 1 Oct'
    },
    {
      level: 'important',
      title: '🎮 EA FC 26 (FIFA): গ্রুপ পর্বের ফলাফল ও কোয়ার্টার ফাইনাল লাইনআপ',
      body:
        '⚽ EA FC 26 ESPORTS TOURNAMENT UPDATE\n' +
        '📍 Venue: Room 830, IICT\n\n' +
        '★ কোয়ালিফাইড প্লেয়ার্স:\n' +
        '• Group A: Zaid Afnan (25), Nafis Uddin (23)\n' +
        '• Group B: Samin Yasar (25), Mohammed Shahdin Alam (25)\n' +
        '• Group C: Abil Waquer Zihan (24), Mohammed Nafiz Mahmud (24)\n' +
        '• Group D: Sushanta Paul (25), Fahad Mahbub (24)\n\n' +
        '★ কোয়ার্টার ফাইনাল ফিক্সচার (Home & Away Double Leg):\n' +
        '1. Zaid Afnan vs Mohammed Shahdin Alam\n' +
        '2. Samin Yasar vs Nafis Uddin\n' +
        '3. Abil Waquer Zihan vs Fahad Mahbub\n' +
        '4. Sushanta Paul vs Mohammed Nafiz Mahmud',
      time: 'Thursday, 1 Oct'
    },
    {
      level: 'important',
      title: '🏓 টেবিল টেনিস (Table Tennis): পুরুষ ও নারী বিভাগের ফাইনাল ডে সময়সূচি',
      body:
        '🏓 TABLE TENNIS FINAL DAY FIXTURES\n\n' +
        '★ পুরুষ একক (Male):\n' +
        '• Match 1: Sabit (22) vs Aurnob (24)\n' +
        '• Match 2: Tushar (21) vs Nazmul (22)\n' +
        '• Match 3: Zaid (25) vs Aporup (24)\n' +
        '• Semi-Final 1: Shahin vs Winner Match 1\n' +
        '• Semi-Final 2: Winner Match 2 vs Winner Match 3\n\n' +
        '★ নারী একক (Female League):\n' +
        'শীর্ষ পয়েন্ট অর্জনকারী নির্ধারণ করবে চ্যাম্পিয়ন ও রানার্সআপ:\n' +
        'সাদিয়া, সুমাইয়া, নিহা, ইশরা এবং সাফিয়া।',
      time: 'Thursday, 1 Oct'
    },
    {
      level: 'important',
      title: '🎴 সেগমেন্ট UNO: গ্র্যান্ড ফাইনালের ৮ প্রতিযোগীর তালিকা',
      body:
        '🎴 UNO TOURNAMENT GRAND FINAL\n' +
        '📍 Venue: Room 830, IICT\n\n' +
        'চূড়ান্ত পর্বে উত্তীর্ণ ৮ ফাইনালিস্ট:\n' +
        '১. Sushanta Paul Nibir (25 Batch)\n' +
        '২. Md. Nafiz Mahmud (24 Batch)\n' +
        '৩. Fatiha Tasnim Upoma (23 Batch)\n' +
        '৪. Syed Tahsin Ar Rafi (25 Batch)\n' +
        '৫. Sharmin Sultana Jui (22 Batch)\n' +
        '৬. Nabila Tabassum (22 Batch)\n' +
        '৭. Hazera Ritu (21 Batch)\n' +
        '৮. Sayeed Rahat (25 Batch)\n\n' +
        'একক ম্যাচে ৮ জনের লড়াইয়ে নির্ধারিত হবে UNO চ্যাম্পিয়ন!',
      time: 'Thursday, 1 Oct'
    },
    {
      level: 'important',
      title: '🖊️ কলম যুদ্ধ (Pen Fight): সেমিফাইনালের লাইনআপ ও নিয়মাবলী',
      body:
        '🖊️ PEN FIGHT SEMI-FINALS\n' +
        '📍 Venue: Room 830, IICT\n\n' +
        '★ Semi-Final 1: Hridoy (21), Nasim (22), Md. Atikur (24), Humayra Mahi (22), Rayed (23) + Qualifier\n' +
        '★ Semi-Final 2: Fatema (22), Nazmul (22), Rahmatullah (25), Upom (25), Nabil (24) + Qualifier\n\n' +
        'বেঁচে থাকা শীর্ষ প্রতিযোগীরা যাবেন ফাইনাল মঞ্চে!',
      time: 'Thursday, 1 Oct'
    }
  ];

  for (const ann of newAnnouncements) {
    const id = randomUUID();
    await client.execute({
      sql: 'INSERT INTO announcements (id, level, title, body, time, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [id, ann.level, ann.title, ann.body, ann.time, now, adminId]
    });
    console.log(`✓ Added announcement: ${ann.title}`);
  }

  console.log('\n=== ALL DEEP TOURNAMENT UPDATES COMPLETE! ===');
}

main().catch(err => {
  console.error('Fatal error in deep updates:', err);
  process.exit(1);
});
