import { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Plus, Search, Edit2, Trash2, X, Check, AlertCircle, Loader2, Wand2, Sparkles, Book } from 'lucide-react';
import './Books.css';
import './BooksError.css';

export default function Books() {
    const { books, addBook, updateBook, deleteBook } = useLibrary();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingBook, setEditingBook] = useState(null);
    const [error, setError] = useState(null);
    const [isFetching, setIsFetching] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        quantity: 1,
        cover_url: ''
    });

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn.includes(searchTerm)
    );

    const fetchCoverAndISBN = async (title, author) => {
        try {
            const query = encodeURIComponent(`intitle:${title}+inauthor:${author}`);
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                const bookInfo = data.items[0].volumeInfo;
                const isbn13 = bookInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;
                const isbn10 = bookInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
                let cover_url = bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail;
                if (cover_url) cover_url = cover_url.replace('http://', 'https://');


                return { isbn: isbn13 || isbn10, cover_url: cover_url || '' };
            }

        } catch (err) {
            console.error('[Fetch] Error fetching cover:', err);
        }
        return null;
    };

    const handleFetchISBN = async () => {
        if (!formData.title || !formData.author) {
            setError('Please enter Title and Author first to fetch ISBN.');
            return;
        }

        setIsFetching(true);
        setError(null);

        const result = await fetchCoverAndISBN(formData.title, formData.author);
        if (result) {
            if (result.isbn) {
                setFormData(prev => ({ ...prev, isbn: result.isbn, cover_url: result.cover_url }));
            } else {
                setError('Book found, but no ISBN identifier available.');
                setFormData(prev => ({ ...prev, cover_url: result.cover_url }));
            }
        } else {
            setError('No book found matching that title and author.');
        }
        setIsFetching(false);
    };

    const handleRandomBook = async () => {
        const keywords = ['thriller', 'romance', 'sci-fi', 'drama', 'fantasy', 'mystery', 'novel', 'horror', 'contemporary', 'literary'];

        setIsFetching(true);
        setError(null);

        let attempts = 0;
        const maxAttempts = 5;
        let found = false;

        try {
            while (attempts < maxAttempts && !found) {
                const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
                const randomStart = Math.floor(Math.random() * 200);

                // Add subject:fiction to ensure fiction results
                const query = encodeURIComponent(`${randomKeyword}+subject:fiction`);
                const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&startIndex=${randomStart}&maxResults=10&printType=books`);
                const data = await response.json();

                if (data.items && data.items.length > 0) {
                    // Look through the batch for a compliant book
                    for (const item of data.items) {
                        const bookInfo = item.volumeInfo;

                        // Check for exactly one author
                        const hasOneAuthor = bookInfo.authors && bookInfo.authors.length === 1;

                        // Check for valid ISBN
                        const isbn13 = bookInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;
                        const isbn10 = bookInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
                        const foundISBN = isbn13 || isbn10;

                        if (hasOneAuthor && foundISBN) {
                            let cover_url = bookInfo.imageLinks?.thumbnail || '';
                            if (cover_url) cover_url = cover_url.replace('http://', 'https://');

                            setFormData({
                                title: bookInfo.title || '',
                                author: bookInfo.authors[0],
                                isbn: foundISBN,
                                quantity: 1,
                                cover_url: cover_url
                            });
                            found = true;
                            break;
                        }
                    }
                }
                attempts++;
            }

            if (!found) {
                setError('Failed to find a compliant random fiction book. Please try again.');
            }
        } catch (err) {
            setError('Failed to connect to book service.');
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let result;
        let bookToSave = { ...formData, quantity: parseInt(formData.quantity) };


        // If ISBN exists but cover doesn't, try one last time to grab the cover
        if (bookToSave.isbn && !bookToSave.cover_url) {

            const fetchResult = await fetchCoverAndISBN(bookToSave.title, bookToSave.author);
            if (fetchResult?.cover_url) {
                bookToSave.cover_url = fetchResult.cover_url;

            }
        }



        if (editingBook) {
            result = await updateBook({ ...editingBook, ...bookToSave });
        } else {
            result = await addBook(bookToSave);
        }



        if (result.success) {
            resetForm();
        } else {
            setError(result.error);
        }
    };

    const handleEdit = (book) => {
        setEditingBook(book);
        setFormData({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            quantity: book.quantity,
            cover_url: book.cover_url || ''
        });
        setIsFormOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this book?')) {
            deleteBook(id);
        }
    };

    const resetForm = () => {
        setEditingBook(null);
        setFormData({ title: '', author: '', isbn: '', quantity: 1, cover_url: '' });
        setError(null);
        setIsFormOpen(false);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Book Inventory</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}
                >
                    {isFormOpen ? <X size={18} /> : <Plus size={18} />}
                    {isFormOpen ? 'Close' : 'Add Book'}
                </button>
            </div>

            {isFormOpen && (
                <div className="form-container">
                    <div className="form-header-row">
                        <h2 className="section-title" style={{ marginBottom: 0 }}>{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
                        {!editingBook && (
                            <button
                                type="button"
                                className="btn surprise-btn"
                                onClick={handleRandomBook}
                                disabled={isFetching}
                            >
                                {isFetching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                Surprise Me
                            </button>
                        )}
                    </div>
                    {error && (
                        <div className="form-error">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Author</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    value={formData.author}
                                    onChange={e => setFormData({ ...formData, author: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">ISBN</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        style={{ flex: 1 }}
                                        value={formData.isbn}
                                        onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                                        placeholder="10 or 13 digits"
                                    />
                                    <button
                                        type="button"
                                        className="btn"
                                        style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-light)' }}
                                        onClick={handleFetchISBN}
                                        disabled={isFetching}
                                        title="Auto-fetch ISBN"
                                    >
                                        {isFetching ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="form-input"
                                    required
                                    value={formData.quantity}
                                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="btn btn-primary">
                                <Check size={18} />
                                Save Book
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="books-controls">
                <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search books..."
                        className="search-input"
                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="books-grid">
                {filteredBooks.map(book => {
                    return (
                        <div key={book.id} className="book-card">
                            <div className="book-card-visual">
                                {book.cover_url ? (
                                    <img src={book.cover_url} alt={book.title} className="book-cover" />
                                ) : (
                                    <div className="book-cover-placeholder">
                                        <Book size={40} />
                                    </div>
                                )}
                            </div>
                            <div className="book-card-info">
                                <div>
                                    <h3 className="book-title">{book.title}</h3>
                                    <p className="book-author">by {book.author}</p>
                                </div>
                                <div className="book-meta">
                                    <span>ISBN: {book.isbn}</span>
                                    <span className={`book-badge ${book.available > 0 ? 'badge-success' : 'badge-danger'}`}>
                                        {book.available} / {book.quantity} Available
                                    </span>
                                </div>
                                <div className="book-actions">
                                    <button
                                        className="btn"
                                        style={{ flex: 1, border: '1px solid var(--border)' }}
                                        onClick={() => handleEdit(book)}
                                    >
                                        <Edit2 size={16} /> Edit
                                    </button>
                                    <button
                                        className="btn"
                                        style={{ border: '1px solid var(--border)', color: 'var(--danger)' }}
                                        onClick={() => handleDelete(book.id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
