import AppLayout from '../components/AppLayout';
import EnergyTable from '../components/EnergyTable';
import { mockListings } from '../data/mockData';

const columns = [
    { key: 'id', label: 'ID', render: (v) => <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{v}</span> },
    { key: 'user', label: 'User' },
    { key: 'type', label: 'Type', render: (v) => <span className={`badge badge-${v}`}>{v.toUpperCase()}</span> },
    { key: 'kwh', label: 'kWh', render: (v) => `${v} kWh` },
    { key: 'price', label: '$/kWh', render: (v) => `$${v.toFixed(2)}` },
    { key: 'location', label: 'Grid Location' },
    { key: 'time', label: 'Listed At', render: (v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v}`}>{v}</span> },
];

const buyTotal = mockListings.filter(l => l.type === 'buy').reduce((s, l) => s + l.kwh, 0);
const sellTotal = mockListings.filter(l => l.type === 'sell').reduce((s, l) => s + l.kwh, 0);

export default function AdminListings() {
    return (
        <AppLayout role="admin">
            <div className="page-header">
                <h1 className="page-title">Active Listings</h1>
                <p className="page-subtitle">All open buy & sell orders awaiting matching</p>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 28 }}>
                <div className="stat-card teal">
                    <div className="stat-label">Total Buy Demand</div>
                    <div className="stat-value" style={{ color: 'var(--teal-400)' }}>{buyTotal.toFixed(1)} kWh</div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-label">Total Sell Supply</div>
                    <div className="stat-value" style={{ color: 'var(--amber-400)' }}>{sellTotal.toFixed(1)} kWh</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-label">Supply/Demand Balance</div>
                    <div className="stat-value" style={{ color: sellTotal >= buyTotal ? 'var(--green-400)' : 'var(--red-400)' }}>
                        {sellTotal >= buyTotal ? 'Surplus' : 'Deficit'}
                    </div>
                </div>
            </div>

            <div className="glass-card">
                <div className="section-header">
                    <div>
                        <div className="section-title">All Listings</div>
                        <div className="section-subtitle">{mockListings.length} orders in queue</div>
                    </div>
                    <span className="badge badge-pending">Pre-match</span>
                </div>
                <EnergyTable columns={columns} data={mockListings} />
            </div>
        </AppLayout>
    );
}
