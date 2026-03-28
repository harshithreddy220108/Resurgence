import { useState, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import EnergyTable from '../components/EnergyTable';
import { usePolling } from '../utils/usePolling';
import { useApi } from '../utils/useApi';

const columns = [
    { key: 'id', label: 'TX #', render: (v) => <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.78rem' }}>#{v}</span> },
    { key: 'seller', label: 'Seller ☀️', render: (v) => <span style={{ color: 'var(--amber-400)', fontWeight: 600 }}>{v}</span> },
    { key: 'buyer', label: 'Buyer ⚡', render: (v) => <span style={{ color: 'var(--teal-400)', fontWeight: 600 }}>{v}</span> },
    { key: 'kwh_amount', label: 'Volume', render: (v) => `${v.toFixed(2)} kWh` },
    { key: 'price_per_kwh', label: 'Agreed Price', render: (v) => `$${v.toFixed(3)}/kWh` },
    { key: 'total_value', label: 'Total Value', render: (v) => <strong style={{ color: 'var(--green-400)' }}>${v.toFixed(2)}</strong> },
    { key: 'co2_saved_kg', label: 'CO₂ Avoided', render: (v) => <span style={{ color: '#a78bfa' }}>{v?.toFixed(3) ?? '—'} kg</span> },
    { key: 'date', label: 'Date', render: (v, row) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{v} {row.time}</span> },
];

export default function AdminMatches() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { request } = useApi();

    const fetchMatches = useCallback(async () => {
        try {
            const res = await request('/api/transactions?limit=100', { method: 'GET' });
            if (res) setTransactions(res);
        } catch (err) {
            console.error('AdminMatches fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    usePolling(fetchMatches, 10000);

    const totalKwh = transactions.reduce((s, t) => s + t.kwh_amount, 0);
    const totalCO2 = transactions.reduce((s, t) => s + (t.co2_saved_kg || 0), 0);
    const totalValue = transactions.reduce((s, t) => s + t.total_value, 0);

    return (
        <AppLayout role="admin">
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 className="page-title">Match Results</h1>
                        <p className="page-subtitle">⚛️ Microgrid Matchmaker — Quantum QAOA pairings</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--teal-400)', fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal-400)', display: 'inline-block', animation: 'live-pulse 1.4s infinite' }} />
                        Live · updating every 10s
                    </div>
                </div>
            </div>

            {/* AI banner */}
            <div style={{
                background: 'var(--teal-glow)', border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 28,
                display: 'flex', alignItems: 'center', gap: 12
            }}>
                <div style={{ fontSize: '1.5rem' }}>⚛️</div>
                <div>
                    <div style={{ fontWeight: 700, color: 'var(--teal-400)', marginBottom: 2 }}>Quantum Optimization Active</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        QAOA bipartite matching via Qiskit Aer — {transactions.length} total completed matches in DB.
                        Each run optimises buyer↔seller pairs for minimum grid distance and maximum price overlap.
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 28 }}>
                <div className="stat-card teal">
                    <div className="stat-label">Matches Made</div>
                    <div className="stat-value" style={{ color: 'var(--teal-400)' }}>{transactions.length}</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-label">Total kWh Matched</div>
                    <div className="stat-value" style={{ color: 'var(--green-400)' }}>{totalKwh.toFixed(1)} kWh</div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-label">CO₂ Avoided</div>
                    <div className="stat-value" style={{ color: '#a78bfa' }}>{totalCO2.toFixed(2)} kg</div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-label">Total Value Traded</div>
                    <div className="stat-value" style={{ color: 'var(--amber-400)' }}>${totalValue.toFixed(2)}</div>
                </div>
            </div>

            <div className="glass-card teal-accent">
                <div className="section-header">
                    <div>
                        <div className="section-title">All Completed Pairings</div>
                        <div className="section-subtitle">Optimal seller → buyer assignments from DB</div>
                    </div>
                    <span className="badge badge-matched">Quantum Optimized</span>
                </div>
                {loading ? (
                    <div style={{ padding: '30px 0', color: 'var(--teal-400)', textAlign: 'center', fontSize: '0.875rem' }}>
                        Loading matches...
                    </div>
                ) : transactions.length === 0 ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        No matches yet. Run Quantum Pairing from the Energy Market to create matches.
                    </div>
                ) : (
                    <EnergyTable columns={columns} data={transactions} />
                )}
            </div>
        </AppLayout>
    );
}
