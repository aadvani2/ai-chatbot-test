import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

let dbPath: string | null = null;
let db: sqlite3.Database | null = null;
let dbRun: ((sql: string, params?: any[]) => Promise<any>) | null = null;
let dbGet: ((sql: string, params?: any[]) => Promise<any>) | null = null;
let dbAll: ((sql: string, params?: any[]) => Promise<any>) | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

function getDatabase() {
  if (db === null) {
    if (typeof process === 'undefined' || !process.cwd) {
      throw new Error('Database can only be used in Node.js runtime');
    }
    
    dbPath = path.join(process.cwd(), 'data', 'chatbot.db');
    
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    db = new sqlite3.Database(dbPath);
    
    dbRun = promisify(db.run.bind(db));
    dbGet = promisify(db.get.bind(db));
    dbAll = promisify(db.all.bind(db));
  }
  
  return { db, dbRun: dbRun!, dbGet: dbGet!, dbAll: dbAll! };
}

async function ensureInitialized() {
  if (isInitialized) {
    return;
  }
  
  if (initPromise) {
    await initPromise;
    return;
  }
  
  initPromise = initializeDatabase();
  await initPromise;
  isInitialized = true;
  initPromise = null;
}

export async function initializeDatabase() {
  const { dbRun, dbGet } = getDatabase();
  
  await dbRun(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      message TEXT NOT NULL,
      response TEXT NOT NULL,
      needs_human INTEGER DEFAULT 0,
      admin_reply TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    await dbRun('ALTER TABLE conversations ADD COLUMN admin_reply TEXT');
  } catch (error: any) {
    if (!error.message?.includes('duplicate column')) {
    }
  }

  await dbRun(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `);

  await dbRun(`
    CREATE INDEX IF NOT EXISTS idx_conversation_id ON conversations(conversation_id)
  `);

  const welcomeMessage = await dbGet('SELECT value FROM settings WHERE key = ?', ['welcome_message']);
  if (!welcomeMessage) {
    await dbRun('INSERT INTO settings (key, value) VALUES (?, ?)', [
      'welcome_message',
      'Hello! How can I help you today?'
    ]);
  }

  const fallbackMessage = await dbGet('SELECT value FROM settings WHERE key = ?', ['fallback_message']);
  if (!fallbackMessage) {
    await dbRun('INSERT INTO settings (key, value) VALUES (?, ?)', [
      'fallback_message',
      'I apologize, but I don\'t have enough information to answer this question. Please contact support for further assistance.'
    ]);
  }

  const toneInstructions = await dbGet('SELECT value FROM settings WHERE key = ?', ['tone_instructions']);
  if (!toneInstructions) {
    await dbRun('INSERT INTO settings (key, value) VALUES (?, ?)', [
      'tone_instructions',
      'Respond in a friendly and helpful tone in English. Be clear and concise in your responses.'
    ]);
  }

  const existingUser = await dbGet('SELECT * FROM users WHERE username = ?', ['admin']);
  if (!existingUser) {
    const bcrypt = await import('bcryptjs');
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = await bcrypt.default.hash(defaultPassword, 10);
    try {
      await dbRun('INSERT INTO users (username, password_hash) VALUES (?, ?)', ['admin', passwordHash]);
      console.log('Default admin user created: admin / admin123');
    } catch (error: any) {
      if (!error.message?.includes('UNIQUE constraint')) {
        console.error('Error creating admin user:', error);
      }
    }
  }
}

export async function saveConversation(
  conversationId: string,
  message: string,
  response: string,
  needsHuman: boolean = false
) {
  await ensureInitialized();
  const { dbRun } = getDatabase();
  await dbRun(
    'INSERT INTO conversations (conversation_id, message, response, needs_human) VALUES (?, ?, ?, ?)',
    [conversationId, message, response, needsHuman ? 1 : 0]
  );
}

export async function getConversationHistory(conversationId: string) {
  await ensureInitialized();
  const { dbAll } = getDatabase();
  const rows = await dbAll(
    'SELECT message, response, needs_human, timestamp FROM conversations WHERE conversation_id = ? ORDER BY timestamp ASC',
    [conversationId]
  );
  return rows;
}

export async function getAllConversations() {
  await ensureInitialized();
  const { dbAll } = getDatabase();
  const rows = await dbAll(`
    SELECT 
      conversation_id,
      COUNT(*) as message_count,
      MAX(timestamp) as last_message_time,
      MAX(CASE WHEN needs_human = 1 THEN 1 ELSE 0 END) as has_escalation
    FROM conversations
    GROUP BY conversation_id
    ORDER BY last_message_time DESC
  `);
  return rows;
}

export async function getConversationWithReplies(conversationId: string) {
  await ensureInitialized();
  const { dbAll } = getDatabase();
  const messages = await dbAll(
    'SELECT id, message, response, needs_human, admin_reply, timestamp FROM conversations WHERE conversation_id = ? ORDER BY timestamp ASC',
    [conversationId]
  );
  return messages;
}

export async function saveAdminReply(conversationId: string, messageId: number, adminReply: string) {
  await ensureInitialized();
  const { dbRun } = getDatabase();
  await dbRun(
    'UPDATE conversations SET admin_reply = ? WHERE id = ? AND conversation_id = ?',
    [adminReply, messageId, conversationId]
  );
}

export async function addAdminMessage(conversationId: string, adminMessage: string) {
  await ensureInitialized();
  const { dbRun } = getDatabase();
  await dbRun(
    'INSERT INTO conversations (conversation_id, message, response, needs_human, admin_reply) VALUES (?, ?, ?, ?, ?)',
    [conversationId, '', '', 1, adminMessage]
  );
}

// Settings functions
export async function getSetting(key: string): Promise<string | null> {
  await ensureInitialized();
  const { dbGet } = getDatabase();
  const row = await dbGet('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? (row as any).value : null;
}

export async function setSetting(key: string, value: string) {
  await ensureInitialized();
  const { dbRun } = getDatabase();
  await dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

export async function getAllSettings() {
  await ensureInitialized();
  const { dbAll } = getDatabase();
  const rows = await dbAll('SELECT key, value FROM settings');
  const settings: Record<string, string> = {};
  rows.forEach((row: any) => {
    settings[row.key] = row.value;
  });
  return settings;
}

export async function getUserByUsername(username: string) {
  await ensureInitialized();
  const { dbGet } = getDatabase();
  return await dbGet('SELECT * FROM users WHERE username = ?', [username]);
}

export async function createUser(username: string, passwordHash: string) {
  await ensureInitialized();
  const { dbRun } = getDatabase();
  await dbRun('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash]);
}

export async function getTotalConversations(): Promise<number> {
  await ensureInitialized();
  const { dbGet } = getDatabase();
  const result = await dbGet('SELECT COUNT(DISTINCT conversation_id) as count FROM conversations');
  return (result as any)?.count || 0;
}

export async function getTotalMessages(): Promise<number> {
  await ensureInitialized();
  const { dbGet } = getDatabase();
  const result = await dbGet('SELECT COUNT(*) as count FROM conversations');
  return (result as any)?.count || 0;
}

export async function getHumanEscalations(): Promise<number> {
  await ensureInitialized();
  const { dbGet } = getDatabase();
  const result = await dbGet('SELECT COUNT(*) as count FROM conversations WHERE needs_human = 1');
  return (result as any)?.count || 0;
}

export async function conversationNeedsHumanIntervention(conversationId: string): Promise<boolean> {
  await ensureInitialized();
  const { dbGet } = getDatabase();
  const result = await dbGet(
    'SELECT COUNT(*) as count FROM conversations WHERE conversation_id = ? AND needs_human = 1',
    [conversationId]
  );
  return ((result as any)?.count || 0) > 0;
}

export function closeDatabase() {
  if (db === null) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    db!.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
