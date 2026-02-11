import { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Plus, Search, Edit2, Trash2, X, Check, AlertCircle } from 'lucide-react';
import './Books.css';
import './BooksError.css';

export default function Books() {
    const { books, addBook, updateBook, deleteBook } = useLibrary();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingBook, setEditingBook] = useState(null);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        quantity: 1
    });

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn.includes(searchTerm)
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        let result;
        if (editingBook) {
            result = updateBook({ ...editingBook, ...formData, quantity: parseInt(formData.quantity) });
        } else {
            result = addBook({ ...formData, quantity: parseInt(formData.quantity) });
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
            quantity: book.quantity
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
        setFormData({ title: '', author: '', isbn: '', quantity: 1 });
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
                    <h2 className="section-title">{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
                    {error && (
                        <div className="form-error">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    value={formData.isbn}
                                    onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                                />
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
                {filteredBooks.map(book => (
                    <div key={book.id} className="book-card">
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
                ))}
            </div>
        </div>
    );
}
