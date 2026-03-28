import { useState } from 'react';
import Navbar from './Navbar';
import TradeTicker from './TradeTicker';

export default function AppLayout({ role, children }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
            <TradeTicker />
            <Navbar
                role={role}
                collapsed={collapsed}
                onToggle={() => setCollapsed((prev) => !prev)}
            />
            <main className="main-content animate-fadein">
                {children}
            </main>
        </div>
    );
}
