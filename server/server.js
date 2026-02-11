import express from 'express';
import cors from 'cors';
import { dbPromise, initializeDatabase } from './database.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize DB
initializeDatabase();

// --- Books API ---

app.get('/api/books', async (req, res) => {
    const db = await dbPromise;
    const books = await db.all('SELECT * FROM books');
    res.json(books);
});

app.post('/api/books', async (req, res) => {
    const { title, author, isbn, quantity } = req.body;
    const db = await dbPromise;

    // Basic Server-side ISBN validation
    const isbnRegex = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/;
    if (!isbnRegex.test(isbn)) {
        return res.status(400).json({ error: 'Invalid ISBN format' });
    }

    try {
        const result = await db.run(
            'INSERT INTO books (title, author, isbn, quantity, available) VALUES (?, ?, ?, ?, ?)',
            [title, author, isbn, quantity, quantity]
        );
        const newBook = await db.get('SELECT * FROM books WHERE id = ?', result.lastID);
        res.json(newBook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/books/:id', async (req, res) => {
    const { title, author, isbn, quantity } = req.body;
    const { id } = req.params;
    const db = await dbPromise;

    const isbnRegex = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/;
    if (isbn && !isbnRegex.test(isbn)) {
        return res.status(400).json({ error: 'Invalid ISBN format' });
    }

    try {
        // Check current availability vs quantity change
        const currentBook = await db.get('SELECT * FROM books WHERE id = ?', id);
        if (!currentBook) return res.status(404).json({ error: 'Book not found' });

        const quantityDiff = quantity - currentBook.quantity;
        const newAvailable = currentBook.available + quantityDiff;

        if (newAvailable < 0) {
            return res.status(400).json({ error: 'Cannot reduce quantity below currently loaned amount' });
        }

        await db.run(
            'UPDATE books SET title = ?, author = ?, isbn = ?, quantity = ?, available = ? WHERE id = ?',
            [title, author, isbn, quantity, newAvailable, id]
        );
        const updatedBook = await db.get('SELECT * FROM books WHERE id = ?', id);
        res.json(updatedBook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/books/:id', async (req, res) => {
    const db = await dbPromise;
    try {
        // Check for active loans
        const loans = await db.get('SELECT count(*) as count FROM loans WHERE bookId = ? AND returned = 0', req.params.id);
        if (loans.count > 0) {
            return res.status(400).json({ error: 'Cannot delete book with active loans' });
        }

        await db.run('DELETE FROM books WHERE id = ?', req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Patrons API ---

app.get('/api/patrons', async (req, res) => {
    const db = await dbPromise;
    const patrons = await db.all('SELECT * FROM patrons');
    res.json(patrons);
});

app.post('/api/patrons', async (req, res) => {
    const { name, email, memberId, avatar } = req.body;
    const db = await dbPromise;
    try {
        const result = await db.run(
            'INSERT INTO patrons (name, email, memberId, avatar) VALUES (?, ?, ?, ?)',
            [name, email, memberId, avatar]
        );
        const newPatron = await db.get('SELECT * FROM patrons WHERE id = ?', result.lastID);
        res.json(newPatron);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Loans API ---

app.get('/api/loans', async (req, res) => {
    const db = await dbPromise;
    const loans = await db.all('SELECT * FROM loans');
    res.json(loans);
});

app.post('/api/loans', async (req, res) => {
    const { bookId, patronId } = req.body;
    const db = await dbPromise;

    try {
        const book = await db.get('SELECT * FROM books WHERE id = ?', bookId);
        if (!book || book.available < 1) {
            return res.status(400).json({ error: 'Book not available' });
        }

        const loanDate = new Date().toISOString().split('T')[0];
        const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        await db.run(
            'INSERT INTO loans (bookId, patronId, loanDate, dueDate, returned) VALUES (?, ?, ?, ?, 0)',
            [bookId, patronId, loanDate, dueDate]
        );

        await db.run('UPDATE books SET available = available - 1 WHERE id = ?', bookId);

        // Fetch result
        const result = await db.get('SELECT * FROM loans WHERE rowid = last_insert_rowid()');
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/loans/:id/return', async (req, res) => {
    const db = await dbPromise;
    const { id } = req.params;

    try {
        const loan = await db.get('SELECT * FROM loans WHERE id = ?', id);
        if (!loan) return res.status(404).json({ error: 'Loan not found' });
        if (loan.returned) return res.status(400).json({ error: 'Loan already returned' });

        await db.run('UPDATE loans SET returned = 1 WHERE id = ?', id);
        await db.run('UPDATE books SET available = available + 1 WHERE id = ?', loan.bookId);

        const updatedLoan = await db.get('SELECT * FROM loans WHERE id = ?', id);
        res.json(updatedLoan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
