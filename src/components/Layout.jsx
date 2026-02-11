import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Book, Users, Repeat } from 'lucide-react';
import './Layout.css';

export default function Layout() {
    const navItems = [
        { to: "/", label: "Dashboard", icon: LayoutDashboard },
        { to: "/books", label: "Books", icon: Book },
        { to: "/patrons", label: "Patrons", icon: Users },
        { to: "/loans", label: "Loans", icon: Repeat },
    ];

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="logo">
                    <h2>LibManager</h2>
                </div>
                <nav>
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
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
