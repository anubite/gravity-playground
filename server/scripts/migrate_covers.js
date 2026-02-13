import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import logic directly to keep the script standalone and robust
const dbPath = path.join(__dirname, '..', 'library.db');

async function fetchCover(title, author) {
    try {
        const query = encodeURIComponent(`intitle:${title}+inauthor:${author}`);
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const bookInfo = data.items[0].volumeInfo;
            let cover_url = bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail;
            if (cover_url) {
                return cover_url.replace('http://', 'https://');
            }
        }
    } catch (err) {
        console.error(`[Migration] Error fetching for "${title}":`, err.message);
    }
    return null;
}

async function runMigration() {
    console.log('[Migration] Starting cover backfill...');

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    try {
        const books = await db.all('SELECT id, title, author FROM books WHERE cover_url IS NULL OR cover_url = ""');
        console.log(`[Migration] Found ${books.length} books needing covers.`);

        for (const book of books) {
            process.stdout.write(`[Migration] Processing "${book.title}"... `);
            const cover_url = await fetchCover(book.title, book.author);

            if (cover_url) {
                await db.run('UPDATE books SET cover_url = ? WHERE id = ?', [cover_url, book.id]);
                console.log('✅ Found');
            } else {
                console.log('❌ Not found');
            }

            // Subtle delay to be nice to the API
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('[Migration] Finished!');
    } catch (err) {
        console.error('[Migration] Fatal error:', err);
    } finally {
        await db.close();
    }
}

runMigration();
