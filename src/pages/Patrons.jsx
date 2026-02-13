import { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Plus, X, Check, RefreshCw } from 'lucide-react';
import './Patrons.css';

const generateAvatarUrl = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

export default function Patrons() {
    const { patrons, addPatron } = useLibrary();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        memberId: ''
    });
    const [avatarSeed, setAvatarSeed] = useState(Date.now().toString());

    const handleSubmit = (e) => {
        e.preventDefault();
        addPatron({
            ...formData,
            avatar: generateAvatarUrl(avatarSeed)
        });
        resetForm();
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', memberId: '' });
        setAvatarSeed(Date.now().toString());
        setIsFormOpen(false);
    };

    const regenerateAvatar = () => {
        setAvatarSeed(Date.now().toString() + Math.random());
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Patrons</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}
                >
                    {isFormOpen ? <X size={18} /> : <Plus size={18} />}
                    {isFormOpen ? 'Close' : 'Add Patron'}
                </button>
            </div>

            {isFormOpen && (
                <div className="form-container">
                    <h2 className="section-title">Register New Patron</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="patron-form-main">
                            <div className="patron-inputs">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Member ID</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        value={formData.memberId}
                                        onChange={e => setFormData({ ...formData, memberId: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="avatar-preview-section">
                                <label className="form-label">Avatar Preview</label>
                                <div className="patron-avatar large">
                                    <img src={generateAvatarUrl(avatarSeed)} alt="Avatar Preview" />
                                </div>
                                <button type="button" className="btn randomize-btn" onClick={regenerateAvatar}>
                                    <RefreshCw size={16} /> Randomize
                                </button>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="btn btn-primary">
                                <Check size={18} />
                                Register Patron
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="patrons-grid">
                {patrons.map(patron => (
                    <div key={patron.id} className="patron-card">
                        <div className="patron-avatar">
                            <img src={patron.avatar} alt={patron.name} />
                        </div>
                        <h3 className="patron-name">{patron.name}</h3>
                        <p className="patron-email">{patron.email}</p>
                        <span className="patron-id">ID: {patron.memberId}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
