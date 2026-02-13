import { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Plus, Check, Undo2 } from 'lucide-react';
import './Loans.css';

export default function Loans() {
    const { books, patrons, loans, checkoutBook, returnBook } = useLibrary();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filter, setFilter] = useState('active'); // active, overdue, returned, all

    const [formData, setFormData] = useState({
        bookId: '',
        patronId: ''
    });

    const [message, setMessage] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.bookId && formData.patronId) {
            const success = checkoutBook(parseInt(formData.bookId), parseInt(formData.patronId));
            if (success) {
                setIsFormOpen(false);
                setFormData({ bookId: '', patronId: '' });
                setMessage({ type: 'success', text: 'Book checked out successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to checkout book. It might be unavailable.' });
            }
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const getFilteredLoans = () => {
        const today = new Date();
        return loans.filter(loan => {
            const isOverdue = !loan.returned && new Date(loan.dueDate) < today;
            if (filter === 'active') return !loan.returned;
            if (filter === 'overdue') return isOverdue;
            if (filter === 'returned') return loan.returned;
            return true;
        }).sort((a, b) => new Date(b.loanDate) - new Date(a.loanDate));
    };

    const getLoanStatus = (loan) => {
        if (loan.returned) return { label: 'Returned', class: 'status-returned' };
        if (new Date(loan.dueDate) < new Date()) return { label: 'Overdue', class: 'status-overdue' };
        return { label: 'Active', class: 'status-active' };
    };

    const availableBooks = books.filter(b => b.available > 0);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Loan Management</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setIsFormOpen(true)}
                >
                    <Plus size={18} /> New Loan
                </button>
            </div>

            {message && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: 'var(--radius)',
                    backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: message.type === 'success' ? '#166534' : '#991b1b'
                }}>
                    {message.text}
                </div>
            )}

            {isFormOpen && (
                <div className="form-container">
                    <h2 className="section-title">Checkout Book</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Select Patron</label>
                                <select
                                    className="form-input"
                                    required
                                    value={formData.patronId}
                                    onChange={e => setFormData({ ...formData, patronId: e.target.value })}
                                >
                                    <option value="">-- Select Patron --</option>
                                    {patrons.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.memberId})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Select Book</label>
                                <select
                                    className="form-input"
                                    required
                                    value={formData.bookId}
                                    onChange={e => setFormData({ ...formData, bookId: e.target.value })}
                                >
                                    <option value="">-- Select Book --</option>
                                    {availableBooks.map(b => (
                                        <option key={b.id} value={b.id}>{b.title} (Qty: {b.available})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn" onClick={() => setIsFormOpen(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">
                                <Check size={18} /> Confirm Checkout
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="filter-controls">
                {['all', 'active', 'overdue', 'returned'].map(f => (
                    <button
                        key={f}
                        className={`filter-btn ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            <div className="loans-grid">
                {getFilteredLoans().map(loan => {
                    const book = books.find(b => b.id === loan.bookId);
                    const patron = patrons.find(p => p.id === loan.patronId);
                    const status = getLoanStatus(loan);

                    if (!book || !patron) return null;

                    return (
                        <div key={loan.id} className="loan-card">
                            <div className="loan-header">
                                <div>
                                    <h3 className="loan-book-title">{book.title}</h3>
                                    <div className="loan-patron-name">
                                        <img
                                            src={patron.avatar}
                                            alt={patron.name}
                                            style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                                        />
                                        {patron.name}
                                    </div>
                                </div>
                                <span className={`status-badge ${status.class}`}>{status.label}</span>
                            </div>

                            <div className="loan-dates">
                                <div>
                                    <span className="date-label">Borrowed</span>
                                    <div className="date-value">{loan.loanDate}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className="date-label">Due</span>
                                    <div className="date-value">{loan.dueDate}</div>
                                </div>
                            </div>

                            {!loan.returned && (
                                <button className="btn return-btn" onClick={() => returnBook(loan.id)}>
                                    <Undo2 size={16} /> Return Book
                                </button>
                            )}
                        </div>
                    )
                })}
                {getFilteredLoans().length === 0 && <p className="text-gray-500">No loans found for this filter.</p>}
            </div>
        </div>
    );
}
