import { useLibrary } from '../context/LibraryContext';
import { Book, Users, Repeat, AlertCircle } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
    const { books, patrons, loans } = useLibrary();

    const totalBooks = books.reduce((acc, book) => acc + book.quantity, 0);
    const activeLoans = loans.filter(l => !l.returned).length;
    const overdueLoans = loans.filter(l => !l.returned && new Date(l.dueDate) < new Date()).length;

    const stats = [
        { label: 'Total Books', value: totalBooks, icon: Book, color: 'blue' },
        { label: 'Registered Patrons', value: patrons.length, icon: Users, color: 'green' },
        { label: 'Active Loans', value: activeLoans, icon: Repeat, color: 'orange' },
        { label: 'Overdue Books', value: overdueLoans, icon: AlertCircle, color: 'red' },
    ];

    return (
        <div>
            <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Dashboard</h1>

            <div className="dashboard-stats">
                {stats.map((stat) => (
                    <div key={stat.label} className="stat-card">
                        <div className={`stat-icon text-${stat.color}-600 bg-${stat.color}-50`}>
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{stat.label}</h3>
                            <div className="stat-value">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="recent-activity">
                <h2 className="section-title">Recent Activity</h2>
                <div className="activity-list">
                    {loans.slice(-5).reverse().map(loan => {
                        const book = books.find(b => b.id === loan.bookId);
                        const patron = patrons.find(p => p.id === loan.patronId);
                        return (
                            <div key={loan.id} className="activity-item">
                                <div className="activity-content">
                                    <p><strong>{patron?.name}</strong> borrowed <strong>{book?.title}</strong></p>
                                    <span className="activity-time">{loan.loanDate}</span>
                                </div>
                            </div>
                        )
                    })}
                    {loans.length === 0 && <p className="text-gray-500">No recent activity.</p>}
                </div>
            </div>
        </div>
    );
}
