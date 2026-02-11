import { createContext, useContext, useState, useEffect } from 'react';

const LibraryContext = createContext();

const initialBooks = [
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0743273565', quantity: 5, available: 3 },
    { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0446310789', quantity: 3, available: 0 },
    { id: 3, title: '1984', author: 'George Orwell', isbn: '978-0451524935', quantity: 10, available: 9 },
];

const initialPatrons = [
    { id: 1, name: 'John Doe', email: 'john@example.com', memberId: 'M001', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', memberId: 'M002', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' },
];

const initialLoans = [
    { id: 1, bookId: 1, patronId: 1, loanDate: '2023-10-01', dueDate: '2023-10-15', returned: false },
    { id: 2, bookId: 2, patronId: 2, loanDate: '2023-10-05', dueDate: '2023-10-19', returned: false },
];

export function LibraryProvider({ children }) {
    // ISBN Validation Helper
    const isValidISBN = (isbn) => {
        // Simple regex for ISBN-10 or ISBN-13 (ignoring strict checksum for this demo)
        const regex = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/;
        return regex.test(isbn);
    };

    // Initialize state from localStorage or use defaults
    const [books, setBooks] = useState(() => {
        const saved = localStorage.getItem('library_books');
        const parsed = saved ? JSON.parse(saved) : initialBooks;
        // Sanitize: removes books with invalid ISBNs on load
        return parsed.filter(book => isValidISBN(book.isbn));
    });

    const [patrons, setPatrons] = useState(() => {
        const saved = localStorage.getItem('library_patrons');
        return saved ? JSON.parse(saved) : initialPatrons;
    });

    const [loans, setLoans] = useState(() => {
        const saved = localStorage.getItem('library_loans');
        return saved ? JSON.parse(saved) : initialLoans;
    });

    // Persist to localStorage
    useEffect(() => localStorage.setItem('library_books', JSON.stringify(books)), [books]);
    useEffect(() => localStorage.setItem('library_patrons', JSON.stringify(patrons)), [patrons]);
    useEffect(() => localStorage.setItem('library_loans', JSON.stringify(loans)), [loans]);

    const addBook = (book) => {
        if (!isValidISBN(book.isbn)) {
            return { success: false, error: 'Invalid ISBN format. Must be 10 or 13 digits.' };
        }
        const newBook = { ...book, id: Date.now(), available: book.quantity };
        setBooks([...books, newBook]);
        return { success: true };
    };

    const updateBook = (updatedBook) => {
        if (!isValidISBN(updatedBook.isbn)) {
            return { success: false, error: 'Invalid ISBN format. Must be 10 or 13 digits.' };
        }
        setBooks(books.map(b => b.id === updatedBook.id ? updatedBook : b));
        return { success: true };
    };

    const deleteBook = (id) => {
        setBooks(books.filter(b => b.id !== id));
    };

    const addPatron = (patron) => {
        const newPatron = { ...patron, id: Date.now() };
        setPatrons([...patrons, newPatron]);
    };

    const checkoutBook = (bookId, patronId) => {
        const book = books.find(b => b.id === bookId);
        if (book && book.available > 0) {
            const loan = {
                id: Date.now(),
                bookId,
                patronId,
                loanDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days
                returned: false
            };
            setLoans([...loans, loan]);
            setBooks(books.map(b => b.id === bookId ? { ...b, available: b.available - 1 } : b));
            return true;
        }
        return false;
    };

    const returnBook = (loanId) => {
        const loan = loans.find(l => l.id === loanId);
        if (loan && !loan.returned) {
            setLoans(loans.map(l => l.id === loanId ? { ...l, returned: true } : l));
            setBooks(books.map(b => b.id === loan.bookId ? { ...b, available: b.available + 1 } : b));
        }
    };

    return (
        <LibraryContext.Provider value={{
            books, patrons, loans,
            addBook, updateBook, deleteBook,
            addPatron,
            checkoutBook, returnBook
        }}>
            {children}
        </LibraryContext.Provider>
    );
}

export function useLibrary() {
    return useContext(LibraryContext);
}
