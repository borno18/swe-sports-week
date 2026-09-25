import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createClient } from '@libsql/client';
import { createConfiguredBracket } from '../lib/bracket.ts';

// Load .env.local if present
if (fs.existsSync('.env.local')) {
  const env = fs.readFileSync('.env.local', 'utf-8');
  for (const line of env.split('\n')) {
    const match = line.trim().match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  }
}

const teams = [
  // Group A
  "Fakibaaz",
  "TLT Sports",
  "Binary Blusters",
  "The 9th",
  // Group B
  "Jani Na",
  "Hepta Hitters",
  "Backbench Blusters XI",
  "Team Semicolon"
];

const roundConfig = [
  { name: "Semi-finals", matchCount: 2, playersPerMatch: 2 },
  { name: "Final", matchCount: 1, playersPerMatch: 2 }
];

const groupStageConfig = {
  groupCount: 2,
  playersPerGroup: 4,
  advancePerGroup: 2
};

const bracket = createConfiguredBracket(
  teams.join("\n"),
  roundConfig,
  true,
  groupStageConfig,
  1
);

// Schedule Saturday matches
// Morning
// 7:30 - 8:30: Fakibaaz vs The 9th (gs_g1r1m1)
const m1 = bracket.groupStageRounds[0].find(m => m.id === 'gs_g1r1m1');
m1.date = '2026-09-26';
m1.time = '07:30';
m1.venue = 'Main University Ground';

// 8:30 - 9:30: TLT Sports vs Binary Blusters (gs_g1r1m2)
const m2 = bracket.groupStageRounds[0].find(m => m.id === 'gs_g1r1m2');
m2.date = '2026-09-26';
m2.time = '08:30';
m2.venue = 'Main University Ground';

// Afternoon
// 3:30 - 4:30: Jani Na vs Team Semicolon (gs_g2r1m1)
const m3 = bracket.groupStageRounds[0].find(m => m.id === 'gs_g2r1m1');
m3.date = '2026-09-26';
m3.time = '15:30';
m3.venue = 'Main University Ground';

// 4:30 - 5:30: Hepta Hitters vs Backbench Blusters XI (gs_g2r1m2)
const m4 = bracket.groupStageRounds[0].find(m => m.id === 'gs_g2r1m2');
m4.date = '2026-09-26';
m4.time = '16:30';
m4.venue = 'Main University Ground';

const cricketRulesText = [
  "আট দলের প্রত্যেকেই নিজেদের গ্রুপের সবার সাথে এক ম্যাচ করে খেলবে। পয়েন্টে সেরা দুই দল সেমিফাইনালে জায়গা পাবে।",
  "এক দলের হয়ে আটজন মাঠে নামবে, বাকিরা অতিরিক্ত খেলোয়াড়। অতিরিক্ত খেলোয়াড় শুধু ফিল্ডিং করতে পারবে।",
  "খেলা হবে আট ওভারে, একজন বোলার সর্বোচ্চ ২ ওভার বল করতে পারবে।",
  "খেলা হবে ফুল সার্কেলে। সব ধরনের বাই, লেগবাই এবং ওভার থ্রো-তে রান আছে।",
  "ম্যাচ পরিচালনায় দুইজন আম্পায়ার থাকবেন, আম্পায়ারের সিদ্ধান্ত ই চূড়ান্ত।",
  "কোন দল নির্দিষ্ট সময়ের মধ্যে খেলা শুরু করতে না পারলে শাস্তির মুখোমুখি হতে হবে।"
].join("\n");

const announcementBody = [
  "📢 ক্রিকেট টুর্নামেন্ট আপডেট: নিয়মাবলী!",
  "১. আট দলের প্রত্যেকেই নিজেদের গ্রুপের সবার সাথে এক ম্যাচ করে খেলবে। পয়েন্টে সেরা দুই দল সেমিফাইনালে জায়গা পাবে।",
  "২. এক দলের হয়ে আটজন মাঠে নামবে, বাকিরা অতিরিক্ত খেলোয়াড়। অতিরিক্ত খেলোয়াড় শুধু ফিল্ডিং করতে পারবে।",
  "৩. খেলা হবে আট ওভারে, একজন বোলার সর্বোচ্চ ২ ওভার বল করতে পারবে।",
  "৪. খেলা হবে ফুল সার্কেলে। সব ধরনের বাই, লেগবাই এবং ওভার থ্রো-তে রান আছে।",
  "৫. ম্যাচ পরিচালনায় দুইজন আম্পায়ার থাকবেন, আম্পায়ারের সিদ্ধান্ত ই চূড়ান্ত।",
  "৬. কোন দল নির্দিষ্ট সময়ের মধ্যে খেলা শুরু করতে না পারলে শাস্তির মুখোমুখি হতে হবে।",
  "",
  "🏏 শনিবারের খেলার সময়সূচি (Saturday Schedule):",
  "★ MORNING ★",
  "• 7:30 - 8:30: Fakibaaz VS The 9th",
  "• 8:30 - 9:30: TLT Sports VS Binary Blusters",
  "",
  "★ AFTERNOON ★",
  "• 3:30 - 4:30: Jani Na VS Team Semicolon",
  "• 4:30 - 5:30: Hepta Hitters VS Backbench Blusters XI",
  "",
  "⏰ সকল দলকে নির্দিষ্ট সময়ের মধ্যে মাঠে উপস্থিত থাকার জন্য অনুরোধ করা হচ্ছে!"
].join("\n");

async function updateDb(client, name) {
  console.log(`Updating database: ${name}...`);

  // Ensure tables exist
  await client.execute(`
    CREATE TABLE IF NOT EXISTS sport_rules (
      sport_slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'knockout',
      advancement TEXT NOT NULL,
      rules_text TEXT NOT NULL,
      rounds TEXT,
      tiebreaker TEXT,
      updated_at INTEGER NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      level TEXT NOT NULL CHECK (level IN ('general', 'important', 'urgent', 'update')),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // 1. Update cricket rules
  await client.execute({
    sql: `
      INSERT INTO sport_rules (sport_slug, title, format, advancement, rules_text, rounds, tiebreaker, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(sport_slug) DO UPDATE SET
        title = excluded.title,
        format = excluded.format,
        advancement = excluded.advancement,
        rules_text = excluded.rules_text,
        rounds = excluded.rounds,
        tiebreaker = excluded.tiebreaker,
        updated_at = excluded.updated_at
    `,
    args: [
      'cricket',
      'Cricket Tournament – Rules & Match Format',
      'round_robin',
      '৮ দল (২ গ্রুপ) · প্রতি গ্রুপ থেকে পয়েন্টে সেরা দুই দল সেমিফাইনালে উত্তীর্ণ হবে',
      cricketRulesText,
      'গ্রুপ পর্ব (৮ ওভার) → সেমিফাইনাল → ফাইনাল',
      'পয়েন্ট সমান হলে: নেট রান রেট (NRR) → মুখোমুখি লড়াই',
      Date.now()
    ]
  });
  console.log('✓ Updated sport_rules for cricket');

  // 2. Update tournaments table for cricket
  const existingCricket = await client.execute({
    sql: "SELECT version FROM tournaments WHERE id = 'cricket'",
    args: []
  });

  const nextVersion = existingCricket.rows.length > 0 ? Number(existingCricket.rows[0].version) + 1 : 1;

  await client.execute({
    sql: `
      INSERT INTO tournaments (id, sport_slug, title, entry_kind, version, bracket)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        bracket = excluded.bracket,
        version = excluded.version
    `,
    args: [
      'cricket',
      'cricket',
      'Cricket',
      'team',
      nextVersion,
      JSON.stringify(bracket)
    ]
  });
  console.log(`✓ Updated tournaments bracket for cricket (version ${nextVersion})`);

  // 3. Insert Announcement
  const annId = randomUUID();
  let adminId = null;
  const userRes = await client.execute("SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1").catch(() => ({ rows: [] }));
  if (userRes.rows.length > 0) adminId = String(userRes.rows[0].id);

  await client.execute({
    sql: `
      INSERT INTO announcements (id, level, title, body, time, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      annId,
      'important',
      '📢 ক্রিকেট টুর্নামেন্ট আপডেট: নিয়মাবলী ও শনিবারের সময়সূচি',
      announcementBody,
      'Saturday, 26 Sep · 1:00 AM',
      Date.now(),
      adminId
    ]
  });
  console.log('✓ Added announcement:', annId);
}

async function main() {
  // Update Turso DB if configured
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    const tursoClient = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
    await updateDb(tursoClient, 'Turso Cloud DB');
  }

  // Update local sqlite DB if exists
  if (fs.existsSync('data/sports-week.db')) {
    const localClient = createClient({
      url: 'file:data/sports-week.db'
    });
    await updateDb(localClient, 'Local SQLite DB');
  }

  console.log('\nAll databases updated successfully!');
}

main().catch(err => {
  console.error('Error updating database:', err);
  process.exit(1);
});
