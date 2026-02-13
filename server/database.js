import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dbPromise = open({
  filename: path.join(__dirname, 'library.db'),
  driver: sqlite3.verbose().Database
});

export async function initializeDatabase() {
  const db = await dbPromise;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      available INTEGER NOT NULL,
      cover_url TEXT
    );

    CREATE TABLE IF NOT EXISTS patrons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      memberId TEXT NOT NULL,
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookId INTEGER,
      patronId INTEGER,
      loanDate TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      returned BOOLEAN DEFAULT 0,
      FOREIGN KEY(bookId) REFERENCES books(id),
      FOREIGN KEY(patronId) REFERENCES patrons(id)
    );
  `);

  // Migration for existing tables: check if cover_url exists, if not check for coverUrl, rename if needed.
  try {
    const tableInfo = await db.all("PRAGMA table_info(books)");
    const hasSnakeCase = tableInfo.some(column => column.name === 'cover_url');
    const hasCamelCase = tableInfo.some(column => column.name === 'coverUrl');

    if (!hasSnakeCase) {
      if (hasCamelCase) {
        console.log('[Database] Migrating coverUrl to cover_url...');
        await db.exec('ALTER TABLE books RENAME COLUMN coverUrl TO cover_url');
      } else {
        console.log('[Database] Adding cover_url column...');
        await db.exec('ALTER TABLE books ADD COLUMN cover_url TEXT');
      }
    }
  } catch (err) {
    console.error('[Database] Migration error:', err);
  }

  console.log('[Database] Ready');
  return db;
}
