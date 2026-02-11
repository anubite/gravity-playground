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
      available INTEGER NOT NULL
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

    console.log('Database initialized');
    return db;
}
