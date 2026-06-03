import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, "..", "..", "hola.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  initSchema(_db);
  seedData(_db);
  return _db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      avatar TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mood_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mood_score INTEGER NOT NULL,
      emotions TEXT NOT NULL DEFAULT '[]',
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_mood_user ON mood_entries(user_id);

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      mood_tag TEXT,
      is_shared INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_id);

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      psychologist_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      due_date TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      psychologist_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL,
      reviewed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_psych ON alerts(psychologist_id);

    CREATE TABLE IF NOT EXISTS link_codes (
      code TEXT PRIMARY KEY,
      psychologist_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS client_assignments (
      psychologist_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      PRIMARY KEY (psychologist_id, client_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      content TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      psychologist_id TEXT NOT NULL,
      template TEXT NOT NULL DEFAULT 'free',
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notes_client ON notes(client_id);

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      psychologist_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      target_date TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      achieved_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_goals_client ON goals(client_id);

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      psychologist_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      session_type TEXT NOT NULL DEFAULT 'followup',
      date_time TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_appt_psych ON appointments(psychologist_id);
    CREATE INDEX IF NOT EXISTS idx_appt_client ON appointments(client_id);

    CREATE TABLE IF NOT EXISTS ai_summary_cache (
      client_id TEXT PRIMARY KEY,
      summary TEXT NOT NULL,
      generated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS push_tokens (
      user_id TEXT PRIMARY KEY,
      token TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

// ── Seed Data ─────────────────────────────────────────────────────────────
const SEED_USER_ID = "seed-user-001";
const SEED_PSYCH_ID = "seed-psych-001";

function seedData(db: Database.Database): void {
  const userCount = (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
  if (userCount > 0) return;

  const now = Date.now();
  const dayMs = 86400000;
  const hr = 3600000;

  const insertUser = db.prepare(
    "INSERT OR IGNORE INTO users (id, name, email, password, role, avatar, created_at) VALUES (?,?,?,?,?,?,?)"
  );
  const moodInsert = db.prepare(
    "INSERT OR IGNORE INTO mood_entries (id, user_id, mood_score, emotions, note, created_at) VALUES (?,?,?,?,?,?)"
  );
  const taskInsert = db.prepare(
    "INSERT OR IGNORE INTO tasks (id, user_id, psychologist_id, title, description, due_date, completed_at, created_at) VALUES (?,?,?,?,?,?,?,?)"
  );
  const journalInsert = db.prepare(
    "INSERT OR IGNORE INTO journal_entries (id, user_id, title, body, mood_tag, is_shared, created_at) VALUES (?,?,?,?,?,?,?)"
  );
  const noteInsert = db.prepare(
    "INSERT OR IGNORE INTO notes (id, client_id, psychologist_id, template, title, content, created_at) VALUES (?,?,?,?,?,?,?)"
  );
  const goalInsert = db.prepare(
    "INSERT OR IGNORE INTO goals (id, client_id, psychologist_id, title, description, target_date, status, created_at, achieved_at) VALUES (?,?,?,?,?,?,?,?,?)"
  );
  const apptInsert = db.prepare(
    "INSERT OR IGNORE INTO appointments (id, psychologist_id, client_id, client_name, session_type, date_time, notes, created_at) VALUES (?,?,?,?,?,?,?,?)"
  );
  const msgInsert = db.prepare(
    "INSERT OR IGNORE INTO messages (id, sender_id, sender_role, recipient_id, content, read, created_at) VALUES (?,?,?,?,?,?,?)"
  );
  const alertInsert = db.prepare(
    "INSERT OR IGNORE INTO alerts (id, psychologist_id, client_id, client_name, type, message, severity, reviewed, created_at) VALUES (?,?,?,?,?,?,?,?,?)"
  );
  const assignInsert = db.prepare(
    "INSERT OR IGNORE INTO client_assignments (psychologist_id, client_id) VALUES (?,?)"
  );

  // ── Clinicians ──────────────────────────────────────────────────────────
  insertUser.run(SEED_PSYCH_ID, "Dr. Rivera", "doctor@example.com", "doctor123", "psychologist", null, new Date(now - 90 * dayMs).toISOString());
  insertUser.run(SEED_PSYCH_ID + "-dr", "Dr. Rivera", "dr@clinic.com", "password123", "psychologist", null, new Date(now - 90 * dayMs).toISOString());

  // ── Patients ────────────────────────────────────────────────────────────
  // 1. Alex Kim — anxiety, improving
  insertUser.run(SEED_USER_ID, "Alex Kim", "alex@example.com", "password123", "user", null, new Date(now - 30 * dayMs).toISOString());

  // 2. Maya Chen — generalised anxiety, mixed progress
  insertUser.run("seed-user-002", "Maya Chen", "maya@example.com", "password123", "user", null, new Date(now - 45 * dayMs).toISOString());

  // 3. James Wilson — depression, struggling (alerts active)
  insertUser.run("seed-user-003", "James Wilson", "james@example.com", "password123", "user", null, new Date(now - 60 * dayMs).toISOString());

  // 4. Sofia Martinez — stress management, good progress
  insertUser.run("seed-user-004", "Sofia Martinez", "sofia@example.com", "password123", "user", null, new Date(now - 21 * dayMs).toISOString());

  // 5. Ethan Brooks — grief counselling, very low mood (critical alert)
  insertUser.run("seed-user-005", "Ethan Brooks", "ethan@example.com", "password123", "user", null, new Date(now - 14 * dayMs).toISOString());

  // 6. Priya Patel — work-life balance, moderate / stable
  insertUser.run("seed-user-006", "Priya Patel", "priya@example.com", "password123", "user", null, new Date(now - 55 * dayMs).toISOString());

  // ── Assignments ─────────────────────────────────────────────────────────
  for (const uid of [SEED_USER_ID, "seed-user-002", "seed-user-003", "seed-user-004", "seed-user-005", "seed-user-006"]) {
    assignInsert.run(SEED_PSYCH_ID, uid);
    assignInsert.run(SEED_PSYCH_ID + "-dr", uid);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MOOD ENTRIES
  // ═══════════════════════════════════════════════════════════════════════

  // 1. Alex Kim — improving arc (anxiety → recovery)
  const alexMoods: [string, number, string[], string | null, number][] = [
    ["alex-m1", 5, ["Anxious", "Tired"], "Woke up early with racing thoughts again", now - 13 * dayMs],
    ["alex-m2", 4, ["Overwhelmed", "Anxious"], "Hard meeting at work. Couldn't concentrate.", now - 12 * dayMs],
    ["alex-m3", 6, ["Calm", "Hopeful"], "Tried the breathing exercise. Helped a little.", now - 11 * dayMs],
    ["alex-m4", 5, ["Tired", "Sad"], null, now - 10 * dayMs],
    ["alex-m5", 7, ["Calm", "Grateful"], "Good morning, slept well", now - 9 * dayMs],
    ["alex-m6", 6, ["Calm", "Focused"], "Breathing before bed worked", now - 8 * dayMs],
    ["alex-m7", 5, ["Anxious"], "Stressful commute", now - 7 * dayMs],
    ["alex-m8", 7, ["Calm", "Grateful"], "Good morning", now - 6 * dayMs],
    ["alex-m9", 5, ["Tired", "Anxious"], null, now - 5 * dayMs],
    ["alex-m10", 6, ["Calm"], "Feeling better", now - 4 * dayMs],
    ["alex-m11", 8, ["Happy", "Energized"], null, now - 3 * dayMs],
    ["alex-m12", 4, ["Sad", "Overwhelmed"], "Hard day", now - 2 * dayMs],
    ["alex-m13", 7, ["Hopeful", "Calm"], null, now - dayMs],
  ];
  for (const [id, score, emotions, note, ts] of alexMoods) {
    moodInsert.run(id, SEED_USER_ID, score, JSON.stringify(emotions), note, new Date(ts).toISOString());
  }

  // 2. Maya Chen — up-and-down, mostly anxious
  const mayaMoods: [string, number, string[], string | null, number][] = [
    ["maya-m1", 6, ["Calm", "Hopeful"], "First day on new meds, cautiously optimistic", now - 13 * dayMs],
    ["maya-m2", 5, ["Anxious", "Tired"], "Side effects kicking in", now - 12 * dayMs],
    ["maya-m3", 4, ["Anxious", "Overwhelmed"], "Panic attack at the grocery store", now - 11 * dayMs],
    ["maya-m4", 6, ["Calm"], "Managed to go for a walk", now - 10 * dayMs],
    ["maya-m5", 7, ["Hopeful", "Grateful"], "Slept 8 hours!", now - 9 * dayMs],
    ["maya-m6", 5, ["Anxious", "Sad"], "Family call triggered old stuff", now - 8 * dayMs],
    ["maya-m7", 6, ["Calm", "Focused"], null, now - 7 * dayMs],
    ["maya-m8", 7, ["Happy", "Calm"], "Good therapy session", now - 6 * dayMs],
    ["maya-m9", 6, ["Calm"], null, now - 5 * dayMs],
    ["maya-m10", 5, ["Tired", "Anxious"], "Work deadline pressure", now - 4 * dayMs],
    ["maya-m11", 7, ["Hopeful", "Grateful"], null, now - 3 * dayMs],
    ["maya-m12", 6, ["Calm", "Focused"], "Journaled for 20 min", now - 2 * dayMs],
    ["maya-m13", 6, ["Calm", "Hopeful"], null, now - dayMs],
  ];
  for (const [id, score, emotions, note, ts] of mayaMoods) {
    moodInsert.run(id, "seed-user-002", score, JSON.stringify(emotions), note, new Date(ts).toISOString());
  }

  // 3. James Wilson — declining arc, risk alerts triggered
  const jamesMoods: [string, number, string[], string | null, number][] = [
    ["james-m1", 5, ["Sad", "Tired"], "Can't get motivated", now - 13 * dayMs],
    ["james-m2", 4, ["Sad", "Lonely"], null, now - 12 * dayMs],
    ["james-m3", 4, ["Overwhelmed", "Sad"], "Missed work today", now - 11 * dayMs],
    ["james-m4", 3, ["Hopeless", "Sad"], "What's the point", now - 10 * dayMs],
    ["james-m5", 5, ["Tired"], "Managed to eat something", now - 9 * dayMs],
    ["james-m6", 3, ["Hopeless", "Lonely"], "Didn't leave the house", now - 8 * dayMs],
    ["james-m7", 2, ["Hopeless", "Overwhelmed"], "Very dark day", now - 7 * dayMs],
    ["james-m8", 4, ["Sad", "Tired"], null, now - 6 * dayMs],
    ["james-m9", 3, ["Sad", "Lonely"], "Cancelled plans again", now - 5 * dayMs],
    ["james-m10", 4, ["Tired", "Sad"], null, now - 4 * dayMs],
    ["james-m11", 3, ["Hopeless", "Overwhelmed"], "Bad night", now - 3 * dayMs],
    ["james-m12", 2, ["Sad", "Hopeless"], "Can't see a way forward", now - 2 * dayMs],
    ["james-m13", 3, ["Tired", "Sad"], null, now - dayMs],
  ];
  for (const [id, score, emotions, note, ts] of jamesMoods) {
    moodInsert.run(id, "seed-user-003", score, JSON.stringify(emotions), note, new Date(ts).toISOString());
  }

  // 4. Sofia Martinez — stress, clear upward trend
  const sofiaMoods: [string, number, string[], string | null, number][] = [
    ["sofia-m1", 5, ["Stressed", "Tired"], "Deadline week at work", now - 13 * dayMs],
    ["sofia-m2", 6, ["Calm", "Focused"], "Yoga helped this morning", now - 12 * dayMs],
    ["sofia-m3", 6, ["Hopeful"], null, now - 11 * dayMs],
    ["sofia-m4", 7, ["Calm", "Grateful"], "Great family dinner", now - 10 * dayMs],
    ["sofia-m5", 7, ["Happy", "Energized"], "Morning run, felt alive", now - 9 * dayMs],
    ["sofia-m6", 6, ["Calm", "Focused"], null, now - 8 * dayMs],
    ["sofia-m7", 8, ["Happy", "Grateful"], "Promoted at work!", now - 7 * dayMs],
    ["sofia-m8", 7, ["Calm", "Happy"], "Celebration dinner", now - 6 * dayMs],
    ["sofia-m9", 8, ["Energized", "Hopeful"], null, now - 5 * dayMs],
    ["sofia-m10", 7, ["Calm", "Grateful"], "Meditation 15 min", now - 4 * dayMs],
    ["sofia-m11", 8, ["Happy", "Calm"], "Weekend hike", now - 3 * dayMs],
    ["sofia-m12", 9, ["Grateful", "Happy"], "Best week in months", now - 2 * dayMs],
    ["sofia-m13", 8, ["Calm", "Energized"], null, now - dayMs],
  ];
  for (const [id, score, emotions, note, ts] of sofiaMoods) {
    moodInsert.run(id, "seed-user-004", score, JSON.stringify(emotions), note, new Date(ts).toISOString());
  }

  // 5. Ethan Brooks — grief, persistently low (critical alerts)
  const ethanMoods: [string, number, string[], string | null, number][] = [
    ["ethan-m1", 3, ["Sad", "Lonely"], "Still thinking about mom every hour", now - 13 * dayMs],
    ["ethan-m2", 2, ["Hopeless", "Sad"], "Couldn't get out of bed", now - 12 * dayMs],
    ["ethan-m3", 3, ["Sad", "Lonely"], null, now - 11 * dayMs],
    ["ethan-m4", 4, ["Tired", "Sad"], "Managed a short walk", now - 10 * dayMs],
    ["ethan-m5", 2, ["Hopeless", "Overwhelmed"], "Found her old messages on my phone", now - 9 * dayMs],
    ["ethan-m6", 3, ["Sad"], null, now - 8 * dayMs],
    ["ethan-m7", 2, ["Hopeless", "Sad"], "Couldn't sleep", now - 7 * dayMs],
    ["ethan-m8", 3, ["Sad", "Lonely"], "Ate something at least", now - 6 * dayMs],
    ["ethan-m9", 2, ["Hopeless", "Overwhelmed"], "Another hard night", now - 5 * dayMs],
    ["ethan-m10", 3, ["Sad"], null, now - 4 * dayMs],
    ["ethan-m11", 2, ["Hopeless", "Sad"], "Don't see the point", now - 3 * dayMs],
    ["ethan-m12", 3, ["Lonely", "Sad"], null, now - 2 * dayMs],
    ["ethan-m13", 2, ["Hopeless"], "Worst day yet", now - dayMs],
  ];
  for (const [id, score, emotions, note, ts] of ethanMoods) {
    moodInsert.run(id, "seed-user-005", score, JSON.stringify(emotions), note, new Date(ts).toISOString());
  }

  // 6. Priya Patel — burnout / work-life balance, stable moderate
  const priyaMoods: [string, number, string[], string | null, number][] = [
    ["priya-m1", 6, ["Tired", "Focused"], "Long day but manageable", now - 13 * dayMs],
    ["priya-m2", 5, ["Tired", "Stressed"], "Back-to-back meetings", now - 12 * dayMs],
    ["priya-m3", 7, ["Calm", "Hopeful"], "WFH day, less commute stress", now - 11 * dayMs],
    ["priya-m4", 6, ["Focused", "Calm"], null, now - 10 * dayMs],
    ["priya-m5", 5, ["Tired", "Anxious"], "Project presentation nerves", now - 9 * dayMs],
    ["priya-m6", 7, ["Relieved", "Happy"], "Presentation went well!", now - 8 * dayMs],
    ["priya-m7", 6, ["Calm", "Grateful"], null, now - 7 * dayMs],
    ["priya-m8", 6, ["Focused", "Calm"], "Cooked dinner instead of ordering out", now - 6 * dayMs],
    ["priya-m9", 7, ["Happy", "Calm"], "Weekend finally", now - 5 * dayMs],
    ["priya-m10", 8, ["Energized", "Happy"], "Danced at home, forgot I could do that", now - 4 * dayMs],
    ["priya-m11", 6, ["Tired", "Calm"], "Back to the grind", now - 3 * dayMs],
    ["priya-m12", 6, ["Focused", "Calm"], null, now - 2 * dayMs],
    ["priya-m13", 7, ["Hopeful", "Calm"], "Boundary set with manager. First time ever.", now - dayMs],
  ];
  for (const [id, score, emotions, note, ts] of priyaMoods) {
    moodInsert.run(id, "seed-user-006", score, JSON.stringify(emotions), note, new Date(ts).toISOString());
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ALERTS
  // ═══════════════════════════════════════════════════════════════════════
  alertInsert.run("alert-001", SEED_PSYCH_ID, "seed-user-003", "James Wilson",
    "mood_drop", "Mood score dropped to 2 — patient noted 'very dark day'. Check in recommended.",
    "high", 0, new Date(now - 7 * dayMs).toISOString());
  alertInsert.run("alert-002", SEED_PSYCH_ID, "seed-user-003", "James Wilson",
    "mood_drop", "Sustained low mood (avg 3.1) over 7 days. Patient missed two sessions.",
    "critical", 0, new Date(now - 2 * dayMs).toISOString());
  alertInsert.run("alert-003", SEED_PSYCH_ID, "seed-user-005", "Ethan Brooks",
    "mood_drop", "Mood score of 2 with note 'Don't see the point'. Requires urgent review.",
    "critical", 0, new Date(now - dayMs).toISOString());
  alertInsert.run("alert-004", SEED_PSYCH_ID, "seed-user-005", "Ethan Brooks",
    "sustained_low", "Mood average 2.6/10 over 13 days. No improvement since intake.",
    "high", 0, new Date(now - 3 * dayMs).toISOString());
  alertInsert.run("alert-005", SEED_PSYCH_ID, SEED_USER_ID, "Alex Kim",
    "mood_drop", "Mood dropped to 4 — patient reported feeling overwhelmed and sad.",
    "medium", 1, new Date(now - 2 * dayMs).toISOString());

  // ═══════════════════════════════════════════════════════════════════════
  // TASKS
  // ═══════════════════════════════════════════════════════════════════════
  // Alex
  taskInsert.run("task-alex-001", SEED_USER_ID, SEED_PSYCH_ID, "Daily 4-7-8 breathing",
    "Complete the 4-7-8 breathing technique for 5 minutes before bed. Focus on slow, controlled breaths.",
    new Date(now + dayMs).toISOString(), null, new Date(now - dayMs).toISOString());
  taskInsert.run("task-alex-002", SEED_USER_ID, SEED_PSYCH_ID, "Gratitude journal — 3 items daily",
    "Write 3 things you are grateful for each morning before checking your phone.",
    new Date(now + 5 * dayMs).toISOString(), new Date(now - dayMs).toISOString(), new Date(now - 5 * dayMs).toISOString());
  taskInsert.run("task-alex-003", SEED_USER_ID, SEED_PSYCH_ID, "10-min mindfulness session",
    "Use the HOLA! Breathe feature for a guided 10-minute mindfulness session before bed.",
    new Date(now + 3 * dayMs).toISOString(), null, new Date(now - dayMs).toISOString());
  // Maya
  taskInsert.run("task-maya-001", "seed-user-002", SEED_PSYCH_ID, "Track anxious thoughts",
    "Use the journal to log what triggers your anxiety. Note time, context, and intensity (1-10).",
    new Date(now + 2 * dayMs).toISOString(), null, new Date(now - 3 * dayMs).toISOString());
  taskInsert.run("task-maya-002", "seed-user-002", SEED_PSYCH_ID, "5-4-3-2-1 grounding exercise",
    "When panic starts: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.",
    new Date(now + 7 * dayMs).toISOString(), null, new Date(now - 3 * dayMs).toISOString());
  // James
  taskInsert.run("task-james-001", "seed-user-003", SEED_PSYCH_ID, "Daily check-in message",
    "Send Dr. Rivera a one-line update each morning, even just 'still here'. No pressure on content.",
    new Date(now + dayMs).toISOString(), null, new Date(now - 10 * dayMs).toISOString());
  taskInsert.run("task-james-002", "seed-user-003", SEED_PSYCH_ID, "Leave the house once today",
    "Walk to the end of the street and back. That's it. No expectations beyond that.",
    new Date(now).toISOString(), null, new Date(now - 5 * dayMs).toISOString());
  // Sofia
  taskInsert.run("task-sofia-001", "seed-user-004", SEED_PSYCH_ID, "Morning yoga — 15 min",
    "Follow the 15-min guided yoga routine. Focus on breathing, not perfection.",
    new Date(now + 2 * dayMs).toISOString(), new Date(now - dayMs).toISOString(), new Date(now - 7 * dayMs).toISOString());
  taskInsert.run("task-sofia-002", "seed-user-004", SEED_PSYCH_ID, "Phone-free evenings",
    "No screens after 9pm. Replace with reading, journaling, or stretching.",
    new Date(now + 14 * dayMs).toISOString(), null, new Date(now - 7 * dayMs).toISOString());
  // Ethan
  taskInsert.run("task-ethan-001", "seed-user-005", SEED_PSYCH_ID, "Reach out to one person today",
    "Text or call one person — a friend, sibling, neighbour. You don't have to explain anything.",
    new Date(now).toISOString(), null, new Date(now - 7 * dayMs).toISOString());
  // Priya
  taskInsert.run("task-priya-001", "seed-user-006", SEED_PSYCH_ID, "Set one boundary at work this week",
    "Identify one recurring overreach and practise saying no — even via email is fine.",
    new Date(now + 5 * dayMs).toISOString(), new Date(now - dayMs).toISOString(), new Date(now - 7 * dayMs).toISOString());
  taskInsert.run("task-priya-002", "seed-user-006", SEED_PSYCH_ID, "Lunch break walk — 20 min",
    "Step away from your desk every day at lunch. A 20-min walk resets cortisol levels.",
    new Date(now + 10 * dayMs).toISOString(), null, new Date(now - 7 * dayMs).toISOString());

  // ═══════════════════════════════════════════════════════════════════════
  // JOURNAL ENTRIES (Alex only — mobile app user)
  // ═══════════════════════════════════════════════════════════════════════
  journalInsert.run("j1", SEED_USER_ID, "Starting fresh", "Tried the 4-7-8 breathing Dr. Rivera recommended. It actually helped me fall asleep faster.", "calm", 1, new Date(now - 3 * dayMs).toISOString());
  journalInsert.run("j2", SEED_USER_ID, "Rough afternoon", "Couldn't focus at all today. My mind kept jumping between different worries. Called mom, that helped a bit.", "anxious", 1, new Date(now - 2 * dayMs).toISOString());
  journalInsert.run("j3", SEED_USER_ID, "Personal note", "Some things I need to work through on my own first. Not ready to share yet.", "sad", 0, new Date(now - dayMs).toISOString());

  // ═══════════════════════════════════════════════════════════════════════
  // SESSION NOTES
  // ═══════════════════════════════════════════════════════════════════════
  noteInsert.run("note-alex-001", SEED_USER_ID, SEED_PSYCH_ID, "free", "Session #4 – Anxiety & Sleep",
    JSON.stringify({ text: "Client reported significant improvement in sleep quality after implementing 4-7-8 breathing. Mood scores trending upward from 5 to 7 over the past week. Discussed cognitive reframing techniques for work-related anxiety. Assigned journaling homework for intrusive thoughts." }),
    new Date(now - 2 * dayMs).toISOString());
  noteInsert.run("note-alex-002", SEED_USER_ID, SEED_PSYCH_ID, "free", "Session #3 – Mood Tracker Review",
    JSON.stringify({ text: "Reviewed 2-week mood chart. Identified Tuesday/Wednesday as consistently lower mood days — correlates with client work schedule. Introduced PMR (Progressive Muscle Relaxation). Client engaged and motivated." }),
    new Date(now - 9 * dayMs).toISOString());
  noteInsert.run("note-maya-001", "seed-user-002", SEED_PSYCH_ID, "free", "Session #6 – Panic Attack Debrief",
    JSON.stringify({ text: "Client experienced a panic attack in a public setting (grocery store) this week. Debriefed the experience using AWARE technique. Reinforced grounding exercises. Discussed whether current medication dosage is adequate — will consult with prescribing physician." }),
    new Date(now - 4 * dayMs).toISOString());
  noteInsert.run("note-maya-002", "seed-user-002", SEED_PSYCH_ID, "free", "Session #5 – Progress Review",
    JSON.stringify({ text: "Mood trend remains variable but client is engaging well with therapy. Sleep improving. Social anxiety still limiting but client attended one group event this week — significant progress." }),
    new Date(now - 11 * dayMs).toISOString());
  noteInsert.run("note-james-001", "seed-user-003", SEED_PSYCH_ID, "free", "Session #3 – Risk Assessment",
    JSON.stringify({ text: "URGENT: Client mood scores averaging 3/10 for past 10 days. Expressed feelings of hopelessness. Conducted Columbia Protocol assessment — no active SI but passive ideation present. Safety plan reviewed and updated. Emergency contact verified. Increasing session frequency to twice weekly." }),
    new Date(now - dayMs).toISOString());
  noteInsert.run("note-sofia-001", "seed-user-004", SEED_PSYCH_ID, "free", "Session #4 – Work Promotion & Stress",
    JSON.stringify({ text: "Excellent session. Client received a promotion and reported feeling 'the best in months'. Mood scores have been 7-9 for two weeks. Discussed how to maintain gains during high-stress periods. Transition to bi-weekly sessions approved." }),
    new Date(now - 3 * dayMs).toISOString());
  noteInsert.run("note-ethan-001", "seed-user-005", SEED_PSYCH_ID, "free", "Session #2 – Grief Assessment",
    JSON.stringify({ text: "Client lost his mother 6 weeks ago. Grief is complicated by estranged relationship. Experiencing persistent low mood (avg 2.8/10), social isolation, sleep disruption. No SI currently but monitoring closely. Referred to grief support group. Next session in 3 days." }),
    new Date(now - 5 * dayMs).toISOString());
  noteInsert.run("note-priya-001", "seed-user-006", SEED_PSYCH_ID, "free", "Session #5 – Burnout & Boundaries",
    JSON.stringify({ text: "Client successfully set a boundary with her manager this week — declined an unreasonable weekend request for the first time. Celebrated this as significant progress. Mood improving. Discussed assertive communication frameworks. Homework: identify one more boundary opportunity." }),
    new Date(now - 2 * dayMs).toISOString());

  // ═══════════════════════════════════════════════════════════════════════
  // GOALS
  // ═══════════════════════════════════════════════════════════════════════
  goalInsert.run("goal-alex-001", SEED_USER_ID, SEED_PSYCH_ID, "14-day mood check-in streak",
    "Log mood every day for 14 consecutive days to build self-awareness and routine.",
    new Date(now + 14 * dayMs).toISOString(), "active", new Date(now - 3 * dayMs).toISOString(), null);
  goalInsert.run("goal-alex-002", SEED_USER_ID, SEED_PSYCH_ID, "Reduce anxiety to below 4 in check-ins",
    "Practice breathing exercises and journaling daily.",
    new Date(now + 21 * dayMs).toISOString(), "active", new Date(now - 3 * dayMs).toISOString(), null);
  goalInsert.run("goal-maya-001", "seed-user-002", SEED_PSYCH_ID, "Attend one social event per week",
    "Combat isolation by accepting at least one social invitation each week.",
    new Date(now + 30 * dayMs).toISOString(), "active", new Date(now - 10 * dayMs).toISOString(), null);
  goalInsert.run("goal-james-001", "seed-user-003", SEED_PSYCH_ID, "Leave the house daily",
    "Even a 5-minute walk counts. Building momentum from minimal baseline.",
    new Date(now + 7 * dayMs).toISOString(), "active", new Date(now - 10 * dayMs).toISOString(), null);
  goalInsert.run("goal-sofia-001", "seed-user-004", SEED_PSYCH_ID, "Establish consistent sleep schedule",
    "In bed by 10:30pm, up by 6:30am. Track adherence in mood journal.",
    new Date(now + 21 * dayMs).toISOString(), "achieved", new Date(now - 20 * dayMs).toISOString(), new Date(now - 3 * dayMs).toISOString());
  goalInsert.run("goal-ethan-001", "seed-user-005", SEED_PSYCH_ID, "Connect with one person per day",
    "Reach out to a friend, family member, or neighbour — even a brief text counts.",
    new Date(now + 14 * dayMs).toISOString(), "active", new Date(now - 7 * dayMs).toISOString(), null);
  goalInsert.run("goal-priya-001", "seed-user-006", SEED_PSYCH_ID, "Set three clear work boundaries",
    "Identify and enforce boundaries around after-hours messages, meeting overruns, and weekend work.",
    new Date(now + 30 * dayMs).toISOString(), "active", new Date(now - 20 * dayMs).toISOString(), null);

  // ═══════════════════════════════════════════════════════════════════════
  // APPOINTMENTS
  // ═══════════════════════════════════════════════════════════════════════
  apptInsert.run("appt-alex-001", SEED_PSYCH_ID, SEED_USER_ID, "Alex Kim", "followup",
    new Date(now + dayMs + 2 * hr).toISOString(), "Review mood patterns and discuss breathing exercises", new Date(now - dayMs).toISOString());
  apptInsert.run("appt-alex-002", SEED_PSYCH_ID, SEED_USER_ID, "Alex Kim", "followup",
    new Date(now + 8 * dayMs + 2 * hr).toISOString(), "Monthly progress review", new Date(now - dayMs).toISOString());
  apptInsert.run("appt-maya-001", SEED_PSYCH_ID, "seed-user-002", "Maya Chen", "followup",
    new Date(now + 2 * dayMs + 10 * hr).toISOString(), "Panic attack debrief follow-up; medication check-in", new Date(now - 4 * dayMs).toISOString());
  apptInsert.run("appt-maya-002", SEED_PSYCH_ID, "seed-user-002", "Maya Chen", "followup",
    new Date(now + 9 * dayMs + 10 * hr).toISOString(), "Ongoing CBT — thought records review", new Date(now - 4 * dayMs).toISOString());
  apptInsert.run("appt-james-001", SEED_PSYCH_ID, "seed-user-003", "James Wilson", "followup",
    new Date(now + hr).toISOString(), "URGENT — risk review, safety plan update", new Date(now - dayMs).toISOString());
  apptInsert.run("appt-james-002", SEED_PSYCH_ID, "seed-user-003", "James Wilson", "followup",
    new Date(now + 3 * dayMs + 14 * hr).toISOString(), "Twice-weekly check-in", new Date(now - dayMs).toISOString());
  apptInsert.run("appt-sofia-001", SEED_PSYCH_ID, "seed-user-004", "Sofia Martinez", "followup",
    new Date(now + 10 * dayMs + 11 * hr).toISOString(), "Bi-weekly session — maintaining gains", new Date(now - 3 * dayMs).toISOString());
  apptInsert.run("appt-ethan-001", SEED_PSYCH_ID, "seed-user-005", "Ethan Brooks", "followup",
    new Date(now + dayMs + 15 * hr).toISOString(), "Grief session + risk monitoring", new Date(now - 5 * dayMs).toISOString());
  apptInsert.run("appt-ethan-002", SEED_PSYCH_ID, "seed-user-005", "Ethan Brooks", "followup",
    new Date(now + 4 * dayMs + 15 * hr).toISOString(), "Twice-weekly grief counselling", new Date(now - 5 * dayMs).toISOString());
  apptInsert.run("appt-priya-001", SEED_PSYCH_ID, "seed-user-006", "Priya Patel", "followup",
    new Date(now + 5 * dayMs + 9 * hr).toISOString(), "Boundary-setting debrief + assertiveness workshop", new Date(now - 2 * dayMs).toISOString());

  // ═══════════════════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════════════════
  // Alex ↔ Dr. Rivera
  msgInsert.run("msg-alex-001", SEED_PSYCH_ID, "psychologist", SEED_USER_ID,
    "Hi Alex! Just checking in after our last session. How are the breathing exercises going?",
    1, new Date(now - 2 * dayMs).toISOString());
  msgInsert.run("msg-alex-002", SEED_USER_ID, "user", SEED_PSYCH_ID,
    "Hi Dr. Rivera! They are really helping. I managed to sleep before midnight 3 nights in a row 😊",
    1, new Date(now - 2 * dayMs + 2 * hr).toISOString());
  msgInsert.run("msg-alex-003", SEED_PSYCH_ID, "psychologist", SEED_USER_ID,
    "That is wonderful progress! Keep it up. See you at our session tomorrow at 10am.",
    1, new Date(now - 2 * dayMs + 4 * hr).toISOString());

  // Maya ↔ Dr. Rivera
  msgInsert.run("msg-maya-001", SEED_PSYCH_ID, "psychologist", "seed-user-002",
    "Maya, I saw you logged a panic attack yesterday. That sounds really difficult. How are you feeling now?",
    1, new Date(now - 10 * dayMs).toISOString());
  msgInsert.run("msg-maya-002", "seed-user-002", "user", SEED_PSYCH_ID,
    "Still a bit shaky but better. I used the grounding exercise and it actually stopped the spiral. Never thought it would work.",
    1, new Date(now - 10 * dayMs + 3 * hr).toISOString());
  msgInsert.run("msg-maya-003", SEED_PSYCH_ID, "psychologist", "seed-user-002",
    "I'm really proud of you for using the tool under pressure. That's a major win. We'll talk through it fully in our next session.",
    1, new Date(now - 10 * dayMs + 5 * hr).toISOString());
  msgInsert.run("msg-maya-004", "seed-user-002", "user", SEED_PSYCH_ID,
    "Thank you. I actually feel a tiny bit more confident now. See you Thursday.",
    0, new Date(now - 9 * dayMs).toISOString());

  // James ↔ Dr. Rivera (unread — James not responding)
  msgInsert.run("msg-james-001", SEED_PSYCH_ID, "psychologist", "seed-user-003",
    "James, I'm thinking of you. I noticed your mood has been quite low this week. Please reply when you can, even just a word.",
    0, new Date(now - 5 * dayMs).toISOString());
  msgInsert.run("msg-james-002", SEED_PSYCH_ID, "psychologist", "seed-user-003",
    "James — our session is tomorrow. I want you to know it's safe to tell me exactly how you're feeling. No editing needed.",
    0, new Date(now - 2 * dayMs).toISOString());

  // Ethan ↔ Dr. Rivera
  msgInsert.run("msg-ethan-001", SEED_PSYCH_ID, "psychologist", "seed-user-005",
    "Ethan, I'm here. I read your note from this morning. You don't have to face this alone. Can we talk before our next session?",
    0, new Date(now - hr).toISOString());

  // Priya ↔ Dr. Rivera
  msgInsert.run("msg-priya-001", "seed-user-006", "user", SEED_PSYCH_ID,
    "I did it. I said no to the Saturday meeting. My manager was fine about it actually. Small thing but it felt huge.",
    1, new Date(now - dayMs).toISOString());
  msgInsert.run("msg-priya-002", SEED_PSYCH_ID, "psychologist", "seed-user-006",
    "That is NOT a small thing, Priya. That is weeks of work paying off. I'm genuinely delighted. Tell me everything on Friday.",
    1, new Date(now - dayMs + 2 * hr).toISOString());
}

// ── Type Helpers ──────────────────────────────────────────────────────────
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "psychologist" | "admin";
  avatar: string | null;
  createdAt: string;
}

export interface MoodEntry {
  id: string;
  userId: string;
  moodScore: number;
  emotions: string[];
  note: string | null;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  body: string;
  moodTag: string | null;
  isShared: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  psychologistId: string;
  title: string;
  description: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface RiskAlert {
  id: string;
  psychologistId: string;
  clientId: string;
  clientName: string;
  type: "mood_drop" | "no_checkin" | "distress_emotion" | "task_overdue";
  message: string;
  severity: "high" | "medium" | "low";
  reviewed: boolean;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderRole: "user" | "psychologist";
  recipientId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface SessionNote {
  id: string;
  clientId: string;
  psychologistId: string;
  template: "soap" | "progress" | "free";
  title: string;
  content: Record<string, string>;
  createdAt: string;
}

export interface Goal {
  id: string;
  clientId: string;
  psychologistId: string;
  title: string;
  description: string;
  targetDate: string | null;
  status: "active" | "achieved" | "paused";
  createdAt: string;
  achievedAt: string | null;
}

export interface Appointment {
  id: string;
  psychologistId: string;
  clientId: string;
  clientName: string;
  sessionType: "initial" | "followup" | "crisis";
  dateTime: string;
  notes: string;
  createdAt: string;
}

export interface AISummaryCache {
  summary: string;
  generatedAt: string;
}

// ── User Operations ────────────────────────────────────────────────────────
function rowToUser(row: Record<string, unknown>): UserRecord {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    password: row.password as string,
    role: row.role as UserRecord["role"],
    avatar: (row.avatar ?? null) as string | null,
    createdAt: row.created_at as string,
  };
}

export function dbGetUser(id: string): UserRecord | undefined {
  const row = getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToUser(row) : undefined;
}

export function dbGetUserByEmail(email: string): UserRecord | undefined {
  const row = getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as Record<string, unknown> | undefined;
  return row ? rowToUser(row) : undefined;
}

export function dbCreateUser(user: UserRecord): void {
  getDb().prepare(
    "INSERT INTO users (id, name, email, password, role, avatar, created_at) VALUES (?,?,?,?,?,?,?)"
  ).run(user.id, user.name, user.email, user.password, user.role, user.avatar, user.createdAt);
}

export function dbGetAllUsers(): UserRecord[] {
  return (getDb().prepare("SELECT * FROM users").all() as Record<string, unknown>[]).map(rowToUser);
}

// ── Mood Operations ────────────────────────────────────────────────────────
function rowToMood(row: Record<string, unknown>): MoodEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    moodScore: row.mood_score as number,
    emotions: JSON.parse((row.emotions as string) || "[]"),
    note: (row.note ?? null) as string | null,
    createdAt: row.created_at as string,
  };
}

export function dbGetMoodEntries(userId: string): MoodEntry[] {
  return (getDb().prepare("SELECT * FROM mood_entries WHERE user_id = ? ORDER BY created_at DESC").all(userId) as Record<string, unknown>[]).map(rowToMood);
}

export function dbAddMoodEntry(entry: MoodEntry): void {
  getDb().prepare(
    "INSERT INTO mood_entries (id, user_id, mood_score, emotions, note, created_at) VALUES (?,?,?,?,?,?)"
  ).run(entry.id, entry.userId, entry.moodScore, JSON.stringify(entry.emotions), entry.note, entry.createdAt);
}

// ── Journal Operations ─────────────────────────────────────────────────────
function rowToJournal(row: Record<string, unknown>): JournalEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    body: row.body as string,
    moodTag: (row.mood_tag ?? null) as string | null,
    isShared: row.is_shared === 1 || row.is_shared === true,
    createdAt: row.created_at as string,
  };
}

export function dbGetJournalEntries(userId: string): JournalEntry[] {
  return (getDb().prepare("SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC").all(userId) as Record<string, unknown>[]).map(rowToJournal);
}

export function dbAddJournalEntry(entry: JournalEntry): void {
  getDb().prepare(
    "INSERT INTO journal_entries (id, user_id, title, body, mood_tag, is_shared, created_at) VALUES (?,?,?,?,?,?,?)"
  ).run(entry.id, entry.userId, entry.title, entry.body, entry.moodTag, entry.isShared ? 1 : 0, entry.createdAt);
}

export function dbUpdateJournalEntry(entryId: string, userId: string, data: { isShared?: boolean; title?: string; body?: string }): JournalEntry | undefined {
  if (data.isShared !== undefined) {
    getDb().prepare("UPDATE journal_entries SET is_shared = ? WHERE id = ? AND user_id = ?").run(data.isShared ? 1 : 0, entryId, userId);
  }
  if (data.title !== undefined) {
    getDb().prepare("UPDATE journal_entries SET title = ? WHERE id = ? AND user_id = ?").run(data.title, entryId, userId);
  }
  if (data.body !== undefined) {
    getDb().prepare("UPDATE journal_entries SET body = ? WHERE id = ? AND user_id = ?").run(data.body, entryId, userId);
  }
  const row = getDb().prepare("SELECT * FROM journal_entries WHERE id = ? AND user_id = ?").get(entryId, userId) as Record<string, unknown> | undefined;
  return row ? rowToJournal(row) : undefined;
}

export function dbDeleteJournalEntry(entryId: string, userId: string): boolean {
  const result = getDb().prepare("DELETE FROM journal_entries WHERE id = ? AND user_id = ?").run(entryId, userId);
  return result.changes > 0;
}

// ── Task Operations ────────────────────────────────────────────────────────
function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    psychologistId: row.psychologist_id as string,
    title: row.title as string,
    description: (row.description ?? "") as string,
    dueDate: (row.due_date ?? null) as string | null,
    completedAt: (row.completed_at ?? null) as string | null,
    createdAt: row.created_at as string,
  };
}

export function dbGetTask(id: string): Task | undefined {
  const row = getDb().prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToTask(row) : undefined;
}

export function dbGetUserTasks(userId: string): Task[] {
  return (getDb().prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC").all(userId) as Record<string, unknown>[]).map(rowToTask);
}

export function dbGetAllTasks(): Task[] {
  return (getDb().prepare("SELECT * FROM tasks ORDER BY created_at DESC").all() as Record<string, unknown>[]).map(rowToTask);
}

export function dbGetTasksByPsychologist(psychId: string): Task[] {
  return (getDb().prepare("SELECT * FROM tasks WHERE psychologist_id = ? ORDER BY created_at DESC").all(psychId) as Record<string, unknown>[]).map(rowToTask);
}

export function dbCreateTask(task: Task): void {
  getDb().prepare(
    "INSERT INTO tasks (id, user_id, psychologist_id, title, description, due_date, completed_at, created_at) VALUES (?,?,?,?,?,?,?,?)"
  ).run(task.id, task.userId, task.psychologistId, task.title, task.description, task.dueDate, task.completedAt, task.createdAt);
}

export function dbCompleteTask(taskId: string, completedAt: string): void {
  getDb().prepare("UPDATE tasks SET completed_at = ? WHERE id = ?").run(completedAt, taskId);
}

// ── Alert Operations ───────────────────────────────────────────────────────
function rowToAlert(row: Record<string, unknown>): RiskAlert {
  return {
    id: row.id as string,
    psychologistId: row.psychologist_id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string,
    type: row.type as RiskAlert["type"],
    message: row.message as string,
    severity: row.severity as RiskAlert["severity"],
    reviewed: row.reviewed === 1 || row.reviewed === true,
    createdAt: row.created_at as string,
  };
}

export function dbGetAlert(id: string): RiskAlert | undefined {
  const row = getDb().prepare("SELECT * FROM alerts WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToAlert(row) : undefined;
}

export function dbGetAlertsByPsychologist(psychId: string): RiskAlert[] {
  return (getDb().prepare("SELECT * FROM alerts WHERE psychologist_id = ? ORDER BY created_at DESC").all(psychId) as Record<string, unknown>[]).map(rowToAlert);
}

export function dbCreateAlert(alert: RiskAlert): void {
  getDb().prepare(
    "INSERT INTO alerts (id, psychologist_id, client_id, client_name, type, message, severity, reviewed, created_at) VALUES (?,?,?,?,?,?,?,?,?)"
  ).run(alert.id, alert.psychologistId, alert.clientId, alert.clientName, alert.type, alert.message, alert.severity, alert.reviewed ? 1 : 0, alert.createdAt);
}

export function dbMarkAlertReviewed(alertId: string): void {
  getDb().prepare("UPDATE alerts SET reviewed = 1 WHERE id = ?").run(alertId);
}

export function dbHasRecentAlert(psychId: string, clientId: string, type: string): boolean {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const row = getDb().prepare(
    "SELECT id FROM alerts WHERE psychologist_id = ? AND client_id = ? AND type = ? AND reviewed = 0 AND created_at > ?"
  ).get(psychId, clientId, type, cutoff);
  return !!row;
}

// ── Link Code Operations ───────────────────────────────────────────────────
export function dbGetLinkCode(code: string): { psychologistId: string; expiresAt: number } | undefined {
  const row = getDb().prepare("SELECT * FROM link_codes WHERE code = ?").get(code) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return { psychologistId: row.psychologist_id as string, expiresAt: row.expires_at as number };
}

export function dbSetLinkCode(code: string, data: { psychologistId: string; expiresAt: number }): void {
  getDb().prepare("INSERT OR REPLACE INTO link_codes (code, psychologist_id, expires_at) VALUES (?,?,?)").run(code, data.psychologistId, data.expiresAt);
}

export function dbDeleteLinkCode(code: string): void {
  getDb().prepare("DELETE FROM link_codes WHERE code = ?").run(code);
}

// ── Client Assignment Operations ───────────────────────────────────────────
export function dbGetClientsByPsychologist(psychId: string): string[] {
  return (getDb().prepare("SELECT client_id FROM client_assignments WHERE psychologist_id = ?").all(psychId) as { client_id: string }[]).map((r) => r.client_id);
}

export function dbIsClientOfPsychologist(psychId: string, clientId: string): boolean {
  const row = getDb().prepare("SELECT 1 FROM client_assignments WHERE psychologist_id = ? AND client_id = ?").get(psychId, clientId);
  return !!row;
}

export function dbAddClientAssignment(psychId: string, clientId: string): void {
  getDb().prepare("INSERT OR IGNORE INTO client_assignments (psychologist_id, client_id) VALUES (?,?)").run(psychId, clientId);
}

export function dbGetPsychologistForClient(clientId: string): string | undefined {
  const row = getDb().prepare("SELECT psychologist_id FROM client_assignments WHERE client_id = ? LIMIT 1").get(clientId) as { psychologist_id: string } | undefined;
  return row?.psychologist_id;
}

// ── Message Operations ─────────────────────────────────────────────────────
function rowToMsg(row: Record<string, unknown>): DirectMessage {
  return {
    id: row.id as string,
    senderId: row.sender_id as string,
    senderRole: row.sender_role as DirectMessage["senderRole"],
    recipientId: row.recipient_id as string,
    content: row.content as string,
    read: row.read === 1 || row.read === true,
    createdAt: row.created_at as string,
  };
}

export function dbGetThreadKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

export function dbAddDirectMessage(msg: DirectMessage): void {
  getDb().prepare(
    "INSERT INTO messages (id, sender_id, sender_role, recipient_id, content, read, created_at) VALUES (?,?,?,?,?,?,?)"
  ).run(msg.id, msg.senderId, msg.senderRole, msg.recipientId, msg.content, msg.read ? 1 : 0, msg.createdAt);
}

export function dbGetDirectMessages(userId: string, psychId: string): DirectMessage[] {
  return (getDb().prepare(
    "SELECT * FROM messages WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?) ORDER BY created_at ASC"
  ).all(userId, psychId, psychId, userId) as Record<string, unknown>[]).map(rowToMsg);
}

export function dbMarkMessagesRead(userId: string, psychId: string): void {
  getDb().prepare(
    "UPDATE messages SET read = 1 WHERE recipient_id = ? AND sender_id = ?"
  ).run(userId, psychId);
}

export function dbGetUnreadCount(userId: string): number {
  const row = getDb().prepare("SELECT COUNT(*) as c FROM messages WHERE recipient_id = ? AND read = 0").get(userId) as { c: number };
  return row.c;
}

// ── Note Operations ────────────────────────────────────────────────────────
function rowToNote(row: Record<string, unknown>): SessionNote {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    psychologistId: row.psychologist_id as string,
    template: row.template as SessionNote["template"],
    title: row.title as string,
    content: JSON.parse((row.content as string) || "{}"),
    createdAt: row.created_at as string,
  };
}

export function dbGetNotes(clientId: string, psychId?: string): SessionNote[] {
  if (psychId) {
    return (getDb().prepare("SELECT * FROM notes WHERE client_id = ? AND psychologist_id = ? ORDER BY created_at DESC").all(clientId, psychId) as Record<string, unknown>[]).map(rowToNote);
  }
  return (getDb().prepare("SELECT * FROM notes WHERE client_id = ? ORDER BY created_at DESC").all(clientId) as Record<string, unknown>[]).map(rowToNote);
}

export function dbAddNote(note: SessionNote): void {
  getDb().prepare(
    "INSERT INTO notes (id, client_id, psychologist_id, template, title, content, created_at) VALUES (?,?,?,?,?,?,?)"
  ).run(note.id, note.clientId, note.psychologistId, note.template, note.title, JSON.stringify(note.content), note.createdAt);
}

// ── Goal Operations ────────────────────────────────────────────────────────
function rowToGoal(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    psychologistId: row.psychologist_id as string,
    title: row.title as string,
    description: (row.description ?? "") as string,
    targetDate: (row.target_date ?? null) as string | null,
    status: row.status as Goal["status"],
    createdAt: row.created_at as string,
    achievedAt: (row.achieved_at ?? null) as string | null,
  };
}

export function dbGetGoals(clientId: string): Goal[] {
  return (getDb().prepare("SELECT * FROM goals WHERE client_id = ? ORDER BY created_at DESC").all(clientId) as Record<string, unknown>[]).map(rowToGoal);
}

export function dbAddGoal(goal: Goal): void {
  getDb().prepare(
    "INSERT INTO goals (id, client_id, psychologist_id, title, description, target_date, status, created_at, achieved_at) VALUES (?,?,?,?,?,?,?,?,?)"
  ).run(goal.id, goal.clientId, goal.psychologistId, goal.title, goal.description, goal.targetDate, goal.status, goal.createdAt, goal.achievedAt);
}

export function dbUpdateGoal(goalId: string, data: Partial<Goal>): Goal | undefined {
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (data.status !== undefined) { sets.push("status = ?"); vals.push(data.status); }
  if (data.achievedAt !== undefined) { sets.push("achieved_at = ?"); vals.push(data.achievedAt); }
  if (data.title !== undefined) { sets.push("title = ?"); vals.push(data.title); }
  if (data.description !== undefined) { sets.push("description = ?"); vals.push(data.description); }
  if (data.targetDate !== undefined) { sets.push("target_date = ?"); vals.push(data.targetDate); }
  if (sets.length > 0) {
    vals.push(goalId);
    getDb().prepare(`UPDATE goals SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  }
  const row = getDb().prepare("SELECT * FROM goals WHERE id = ?").get(goalId) as Record<string, unknown> | undefined;
  return row ? rowToGoal(row) : undefined;
}

// ── Appointment Operations ─────────────────────────────────────────────────
function rowToAppt(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as string,
    psychologistId: row.psychologist_id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string,
    sessionType: row.session_type as Appointment["sessionType"],
    dateTime: row.date_time as string,
    notes: (row.notes ?? "") as string,
    createdAt: row.created_at as string,
  };
}

export function dbGetAppointmentsByPsychologist(psychId: string): Appointment[] {
  return (getDb().prepare("SELECT * FROM appointments WHERE psychologist_id = ? ORDER BY date_time ASC").all(psychId) as Record<string, unknown>[]).map(rowToAppt);
}

export function dbGetAppointmentsByClient(clientId: string): Appointment[] {
  return (getDb().prepare("SELECT * FROM appointments WHERE client_id = ? ORDER BY date_time ASC").all(clientId) as Record<string, unknown>[]).map(rowToAppt);
}

export function dbCreateAppointment(appt: Appointment): void {
  getDb().prepare(
    "INSERT INTO appointments (id, psychologist_id, client_id, client_name, session_type, date_time, notes, created_at) VALUES (?,?,?,?,?,?,?,?)"
  ).run(appt.id, appt.psychologistId, appt.clientId, appt.clientName, appt.sessionType, appt.dateTime, appt.notes, appt.createdAt);
}

// ── AI Summary Cache ───────────────────────────────────────────────────────
export function dbGetAISummaryCache(clientId: string): AISummaryCache | undefined {
  const row = getDb().prepare("SELECT * FROM ai_summary_cache WHERE client_id = ?").get(clientId) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return { summary: row.summary as string, generatedAt: row.generated_at as string };
}

export function dbSetAISummaryCache(clientId: string, data: AISummaryCache): void {
  getDb().prepare("INSERT OR REPLACE INTO ai_summary_cache (client_id, summary, generated_at) VALUES (?,?,?)").run(clientId, data.summary, data.generatedAt);
}

// ── Push Token Operations ──────────────────────────────────────────────────
export function dbGetPushToken(userId: string): string | undefined {
  const row = getDb().prepare("SELECT token FROM push_tokens WHERE user_id = ?").get(userId) as { token: string } | undefined;
  return row?.token;
}

export function dbSetPushToken(userId: string, token: string): void {
  getDb().prepare("INSERT OR REPLACE INTO push_tokens (user_id, token, updated_at) VALUES (?,?,?)").run(userId, token, new Date().toISOString());
}

export function dbGetPushTokensForClients(clientIds: string[]): string[] {
  if (clientIds.length === 0) return [];
  const placeholders = clientIds.map(() => "?").join(",");
  return (getDb().prepare(`SELECT token FROM push_tokens WHERE user_id IN (${placeholders})`).all(...clientIds) as { token: string }[]).map((r) => r.token);
}
