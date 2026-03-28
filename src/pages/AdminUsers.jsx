import AppLayout from '../components/AppLayout';
import EnergyTable from '../components/EnergyTable';
import { mockUsers } from '../data/mockData';

const columns = [
    { key: 'id', label: 'ID', render: (v) => <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{v}</span> },
    { key: 'name', label: 'Name', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    {
        key: 'role', label: 'Role',
        render: (v) => (
            <span className={`badge ${v === 'seller' ? 'badge-sell' : v === 'buyer' ? 'badge-buy' : 'badge-matched'}`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
            </span>
        )
    },
    { key: 'kwh', label: 'kWh Available', render: (v) => v > 0 ? `${v} kWh` : <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'credits', label: 'Credits (EC)', render: (v) => <span style={{ color: 'var(--teal-400)', fontWeight: 600 }}>{v} EC</span> },
    { key: 'trades', label: 'Total Trades', render: (v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span> },
    { key: 'joined', label: 'Joined' },
    {
        key: 'status', label: 'Status',
        render: (v) => <span className={`badge ${v === 'active' ? 'badge-matched' : 'badge-cancelled'}`}>{v}</span>
    },
];

export default function AdminUsers() {
    const activeCount = mockUsers.filter(u => u.status === 'active').length;
    const sellers = mockUsers.filter(u => u.role === 'seller' || u.role === 'both').length;
    const buyers = mockUsers.filter(u => u.role === 'buyer' || u.role === 'both').length;

    return (
        <AppLayout role="admin">
            <div className="page-header">
                <h1 className="page-title">User Management</h1>
                <p className="page-subtitle">All registered prosumers on the Q-Trade network</p>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 28 }}>
                <div className="stat-card teal">
                    <div className="stat-label">Total Users</div>
                    <div className="stat-value">{mockUsers.length}</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-label">Active</div>
                    <div className="stat-value" style={{ color: 'var(--green-400)' }}>{activeCount}</div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-label">Sellers</div>
                    <div className="stat-value" style={{ color: 'var(--amber-400)' }}>{sellers}</div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-label">Buyers</div>
                    <div className="stat-value" style={{ color: '#a78bfa' }}>{buyers}</div>
                </div>
            </div>

            <div className="glass-card">
                <div className="section-header">
                    <div>
                        <div className="section-title">All Users</div>
                        <div className="section-subtitle">{mockUsers.length} registered accounts</div>
                    </div>
                    <button className="btn btn-primary btn-sm">+ Add User</button>
                </div>
                <EnergyTable columns={columns} data={mockUsers} />
            </div>
        </AppLayout>
    );
}
