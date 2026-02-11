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
    const [books, setBooks] = useState([]);
    const [patrons, setPatrons] = useState([]);
    const [loans, setLoans] = useState([]);
    const API_URL = 'http://localhost:3001/api';

    // ISBN Validation Helper (Client-side)
    const isValidISBN = (isbn) => {
        const regex = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/;
        return regex.test(isbn);
    };

    const fetchData = async () => {
        try {
            const [booksRes, patronsRes, loansRes] = await Promise.all([
                fetch(`${API_URL}/books`),
                fetch(`${API_URL}/patrons`),
                fetch(`${API_URL}/loans`)
            ]);

            const booksData = await booksRes.json();
            const patronsData = await patronsRes.json();
            const loansData = await loansRes.json();

            setBooks(booksData);
            setPatrons(patronsData);
            setLoans(loansData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const addBook = async (book) => {
        if (!isValidISBN(book.isbn)) {
            return { success: false, error: 'Invalid ISBN format. Must be 10 or 13 digits.' };
        }
        try {
            const res = await fetch(`${API_URL}/books`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(book)
            });
            if (!res.ok) throw new Error('Failed to add book');
            const newBook = await res.json();
            setBooks(prev => [...prev, newBook]);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const updateBook = async (updatedBook) => {
        if (!isValidISBN(updatedBook.isbn)) {
            return { success: false, error: 'Invalid ISBN format. Must be 10 or 13 digits.' };
        }
        try {
            const res = await fetch(`${API_URL}/books/${updatedBook.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedBook)
            });
            if (!res.ok) throw new Error('Failed to update book');
            const data = await res.json();
            setBooks(prev => prev.map(b => b.id === data.id ? data : b));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const deleteBook = async (id) => {
        try {
            const res = await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json();
                alert(err.error); // Simple alert for now
                return;
            }
            setBooks(prev => prev.filter(b => b.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const addPatron = async (patron) => {
        try {
            const res = await fetch(`${API_URL}/patrons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patron)
            });
            const newPatron = await res.json();
            setPatrons(prev => [...prev, newPatron]);
        } catch (error) {
            console.error(error);
        }
    };

    const checkoutBook = async (bookId, patronId) => {
        try {
            const res = await fetch(`${API_URL}/loans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, patronId })
            });
            if (!res.ok) return false;

            // Re-fetch to sync all states (books available count, loans list)
            fetchData();
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const returnBook = async (loanId) => {
        try {
            const res = await fetch(`${API_URL}/loans/${loanId}/return`, {
                method: 'PUT'
            });
            if (res.ok) {
                fetchData(); // Sync state
            }
        } catch (error) {
            console.error(error);
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
