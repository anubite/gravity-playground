import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Book, Users, Repeat, Menu, X } from 'lucide-react';
import './Layout.css';

export default function Layout() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    const navItems = [
        { to: "/", label: "Dashboard", icon: LayoutDashboard },
        { to: "/books", label: "Books", icon: Book },
        { to: "/patrons", label: "Patrons", icon: Users },
        { to: "/loans", label: "Loans", icon: Repeat },
    ];

    return (
        <div className="app-layout">
            <header className="mobile-header mobile-only">
                <div className="mobile-logo">
                    <img src="/logo.png" alt="Logo" className="mobile-logo-img" />
                    <span>Vibing Books</span>
                </div>
                <button className="menu-toggle" onClick={toggleMenu}>
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {isMenuOpen && <div className="drawer-overlay mobile-only" onClick={closeMenu}></div>}

            <aside className={`sidebar ${isMenuOpen ? 'drawer-open' : ''}`}>
                <div className="logo desktop-only">
                    <img src="/logo.png" alt="Vibing Books Logo" className="logo-img" />
                    <h2>Vibing Books</h2>
                </div>
                <nav>
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={closeMenu}
                        >
                            <Icon size={20} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
            <main className="content">
                <div className="container">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
