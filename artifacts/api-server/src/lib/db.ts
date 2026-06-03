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

  const insertUser = db.prepare(
    "INSERT OR IGNORE INTO users (id, name, email, password, role, avatar, created_at) VALUES (?,?,?,?,?,?,?)"
  );
  insertUser.run(SEED_USER_ID, "Alex", "alex@example.com", "password123", "user", null, new Date().toISOString());
  insertUser.run(SEED_PSYCH_ID, "Dr. Rivera", "doctor@example.com", "doctor123", "psychologist", null, new Date().toISOString());
  insertUser.run(SEED_PSYCH_ID + "-dr", "Dr. Rivera", "dr@clinic.com", "password123", "psychologist", null, new Date().toISOString());

  db.prepare("INSERT OR IGNORE INTO client_assignments (psychologist_id, client_id) VALUES (?,?)").run(SEED_PSYCH_ID, SEED_USER_ID);
  db.prepare("INSERT OR IGNORE INTO client_assignments (psychologist_id, client_id) VALUES (?,?)").run(SEED_PSYCH_ID + "-dr", SEED_USER_ID);

  const moodInsert = db.prepare(
    "INSERT OR IGNORE INTO mood_entries (id, user_id, mood_score, emotions, note, created_at) VALUES (?,?,?,?,?,?)"
  );
  const moods = [
    ["m1", 7, ["Calm", "Grateful"], "Good morning", now - 6 * dayMs],
    ["m2", 5, ["Tired", "Anxious"], null, now - 5 * dayMs],
    ["m3", 6, ["Calm"], "Feeling better", now - 4 * dayMs],
    ["m4", 8, ["Happy", "Energized"], null, now - 3 * dayMs],
    ["m5", 4, ["Sad", "Overwhelmed"], "Hard day", now - 2 * dayMs],
    ["m6", 7, ["Hopeful", "Calm"], null, now - dayMs],
  ];
  for (const [id, score, emotions, note, ts] of moods) {
    moodInsert.run(id as string, SEED_USER_ID, score as number, JSON.stringify(emotions), note, new Date(ts as number).toISOString());
  }

  db.prepare(
    "INSERT OR IGNORE INTO tasks (id, user_id, psychologist_id, title, description, due_date, completed_at, created_at) VALUES (?,?,?,?,?,?,?,?)"
  ).run(
    "task-seed-001", SEED_USER_ID, SEED_PSYCH_ID,
    "Daily breathing exercise",
    "Complete the 4-7-8 breathing technique for 5 minutes. Focus on slow, controlled breaths.",
    new Date(now + dayMs).toISOString(), null, new Date(now - dayMs).toISOString()
  );

  const journalInsert = db.prepare(
    "INSERT OR IGNORE INTO journal_entries (id, user_id, title, body, mood_tag, is_shared, created_at) VALUES (?,?,?,?,?,?,?)"
  );
  journalInsert.run("j1", SEED_USER_ID, "Starting fresh", "Tried the 4-7-8 breathing Dr. Rivera recommended. It actually helped me fall asleep faster.", "calm", 1, new Date(now - 3 * dayMs).toISOString());
  journalInsert.run("j2", SEED_USER_ID, "Rough afternoon", "Couldn't focus at all today. My mind kept jumping between different worries.", "anxious", 1, new Date(now - 2 * dayMs).toISOString());
  journalInsert.run("j3", SEED_USER_ID, "Personal note", "Some things I need to work through on my own first. Not ready to share yet.", "sad", 0, new Date(now - dayMs).toISOString());

  // Seed additional tasks
  db.prepare(
    "INSERT OR IGNORE INTO tasks (id, user_id, psychologist_id, title, description, due_date, completed_at, created_at) VALUES (?,?,?,?,?,?,?,?)"
  ).run("task-seed-002", SEED_USER_ID, SEED_PSYCH_ID, "Gratitude journal — 3 items daily",
    "Write 3 things you are grateful for each morning before checking your phone. Helps rewire morning anxiety patterns.",
    new Date(now + 5 * dayMs).toISOString(), null, new Date(now - dayMs).toISOString());
  db.prepare(
    "INSERT OR IGNORE INTO tasks (id, user_id, psychologist_id, title, description, due_date, completed_at, created_at) VALUES (?,?,?,?,?,?,?,?)"
  ).run("task-seed-003", SEED_USER_ID, SEED_PSYCH_ID, "10-min mindfulness session",
    "Use the HOLA! Breathe feature for a guided 10-minute mindfulness session. Do this before bed.",
    new Date(now + 3 * dayMs).toISOString(), null, new Date(now - dayMs).toISOString());

  // Seed session notes
  const noteInsert = db.prepare(
    "INSERT OR IGNORE INTO notes (id, client_id, psychologist_id, template, title, content, created_at) VALUES (?,?,?,?,?,?,?)"
  );
  noteInsert.run("note-seed-001", SEED_USER_ID, SEED_PSYCH_ID, "free", "Session #4 – Anxiety & Sleep",
    JSON.stringify({ text: "Client reported significant improvement in sleep quality after implementing 4-7-8 breathing. Mood scores trending upward from 5 to 7 over the past week. Discussed cognitive reframing techniques for work-related anxiety. Assigned journaling homework for intrusive thoughts." }),
    new Date(now - 2 * dayMs).toISOString());
  noteInsert.run("note-seed-002", SEED_USER_ID, SEED_PSYCH_ID, "free", "Session #3 – Mood Tracker Review",
    JSON.stringify({ text: "Reviewed 2-week mood chart. Identified Tuesday/Wednesday as consistently lower mood days — correlates with client work schedule. Introduced PMR (Progressive Muscle Relaxation). Client engaged and motivated. Continue weekly sessions." }),
    new Date(now - 9 * dayMs).toISOString());

  // Seed goals
  const goalInsert = db.prepare(
    "INSERT OR IGNORE INTO goals (id, client_id, psychologist_id, title, description, target_date, status, created_at, achieved_at) VALUES (?,?,?,?,?,?,?,?,?)"
  );
  goalInsert.run("goal-seed-001", SEED_USER_ID, SEED_PSYCH_ID, "Daily mood check-in streak",
    "Log mood every day for 14 consecutive days to build self-awareness and routine.",
    new Date(now + 14 * dayMs).toISOString(), "active", new Date(now - 3 * dayMs).toISOString(), null);
  goalInsert.run("goal-seed-002", SEED_USER_ID, SEED_PSYCH_ID, "Reduce anxiety score below 4",
    "Practice breathing exercises and journaling daily. Target: anxiety reported <4 in mood check-ins.",
    new Date(now + 21 * dayMs).toISOString(), "active", new Date(now - 3 * dayMs).toISOString(), null);

  // Seed appointments
  const apptInsert = db.prepare(
    "INSERT OR IGNORE INTO appointments (id, psychologist_id, client_id, client_name, session_type, date_time, notes, created_at) VALUES (?,?,?,?,?,?,?,?)"
  );
  apptInsert.run("appt-seed-001", SEED_PSYCH_ID, SEED_USER_ID, "Alex", "followup",
    new Date(now + dayMs).toISOString(),
    "Review mood patterns and discuss breathing exercises", new Date(now - dayMs).toISOString());
  apptInsert.run("appt-seed-002", SEED_PSYCH_ID, SEED_USER_ID, "Alex", "initial",
    new Date(now + 7 * dayMs).toISOString(),
    "Monthly progress review", new Date(now - dayMs).toISOString());

  // Seed direct messages
  const msgInsert = db.prepare(
    "INSERT OR IGNORE INTO messages (id, sender_id, sender_role, recipient_id, content, read, created_at) VALUES (?,?,?,?,?,?,?)"
  );
  msgInsert.run("msg-seed-001", SEED_PSYCH_ID, "psychologist", SEED_USER_ID,
    "Hi Alex! Just checking in after our last session. How are the breathing exercises going?",
    1, new Date(now - 2 * dayMs).toISOString());
  msgInsert.run("msg-seed-002", SEED_USER_ID, "user", SEED_PSYCH_ID,
    "Hi Dr. Rivera! They are really helping. I managed to sleep before midnight 3 nights in a row 😊",
    1, new Date(now - 2 * dayMs + 3600000).toISOString());
  msgInsert.run("msg-seed-003", SEED_PSYCH_ID, "psychologist", SEED_USER_ID,
    "That is wonderful progress! Keep it up. See you at our session tomorrow at 10am.",
    1, new Date(now - 2 * dayMs + 7200000).toISOString());
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
