import { useState, useEffect, useCallback, useRef } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import AppLayout from '../components/AppLayout';
import EnergyTable from '../components/EnergyTable';
import { useAuthStore } from '../utils/useAuth';
import { useApi } from '../utils/useApi';
import { usePolling } from '../utils/usePolling';

// ── Column definitions ────────────────────────────────────────────────────────

const txColumns = [
    {
        key: 'id', label: 'TX #',
        render: (v) => <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.78rem' }}>#{v}</span>
    },
    {
        key: 'date', label: 'Date / Time',
        render: (v, row) => (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                {v}&nbsp;<span style={{ opacity: 0.6 }}>{row.time}</span>
            </span>
        )
    },
    {
        key: 'type', label: 'Type',
        render: (v) => <span className={`badge badge-${v}`}>{v === 'sell' ? '☀️ Sold' : '⚡ Bought'}</span>
    },
    { key: 'counterparty', label: 'Neighbor', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'kwh_amount', label: 'Volume', render: (v) => `${v.toFixed(2)} kWh` },
    { key: 'price_per_kwh', label: '$/kWh', render: (v) => `$${v.toFixed(3)}` },
    {
        key: 'total_value', label: 'Total',
        render: (v) => <strong style={{ color: 'var(--teal-400)' }}>${v.toFixed(2)}</strong>
    },
    {
        key: 'co2_saved_kg', label: 'CO₂ Saved',
        render: (v) => <span style={{ color: '#a78bfa', fontWeight: 600 }}>{v?.toFixed(2) ?? '0.00'} kg</span>
    },
    {
        key: 'status', label: 'Status',
        render: (v) => <span className="badge badge-matched">✓ {v}</span>
    },
];

// ── Tooltip ───────────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem' }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</div>
                <div style={{ color: '#2dd4bf', fontWeight: 600 }}>{payload[0].value.toFixed(1)} kWh</div>
            </div>
        );
    }
    return null;
};

// ── Toast notification ────────────────────────────────────────────────────────

function Toast({ message, visible }) {
    if (!visible) return null;
    return (
        <div style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
            background: 'linear-gradient(135deg, rgba(45,212,191,0.15), rgba(45,212,191,0.08))',
            border: '1px solid var(--teal-400)', borderRadius: 'var(--radius-md)',
            padding: '14px 20px', color: 'var(--teal-400)', fontWeight: 700,
            fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            animation: 'fadein 0.3s ease',
        }}>
            ⚡ {message}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function TransactionHistory() {
    const user = useAuthStore(state => state.user);
    const { request } = useApi();
    const [dbUser, setDbUser] = useState(null);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [toast, setToast] = useState('');
    const [toastVisible, setToastVisible] = useState(false);
    const [newIds, setNewIds] = useState(new Set());
    const lastMaxId = useRef(0);

    // Resolve DB user once on mount
    useEffect(() => {
        if (!user) return;
        request(`/api/users/by-email/${encodeURIComponent(user.email)}`, { method: 'GET' })
            .then(u => { if (u) setDbUser(u); })
            .catch(console.error);
    }, [user]);

    const fetchData = useCallback(async () => {
        if (!dbUser) return;
        try {
            const [walletRes, txRes] = await Promise.all([
                request(`/api/wallets/${dbUser.id}`, { method: 'GET' }),
                request(`/api/transactions?user_id=${dbUser.id}&limit=100`, { method: 'GET' })
            ]);
            if (walletRes) setWallet(walletRes);
            if (txRes) {
                const data = txRes;
                // Detect new transactions since last poll
                const maxId = data.length > 0 ? Math.max(...data.map(t => t.id)) : 0;
                if (lastMaxId.current > 0 && maxId > lastMaxId.current) {
                    const fresh = new Set(data.filter(t => t.id > lastMaxId.current).map(t => t.id));
                    setNewIds(fresh);
                    setToast(`New transaction matched — ${data.find(t => t.id > lastMaxId.current)?.kwh_amount?.toFixed(1)} kWh`);
                    setToastVisible(true);
                    setTimeout(() => setToastVisible(false), 4000);
                    setTimeout(() => setNewIds(new Set()), 5000);
                }
                lastMaxId.current = maxId;
                setTransactions(data);
            }
        } catch (err) {
            console.error('History fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [dbUser]);

    usePolling(fetchData, 5000, !!dbUser);

    if (loading) {
        return <AppLayout role="user"><div style={{ padding: 40, color: 'var(--teal-400)' }}>Syncing history...</div></AppLayout>;
    }
    if (!wallet) {
        return <AppLayout role="user"><div style={{ padding: 40, color: 'var(--red-400)' }}>Failed to fetch transactions.</div></AppLayout>;
    }

    // Adapt rows: fix buyer/seller label using real DB id
    const transformedTxs = transactions.map(t => ({
        ...t,
        type: dbUser && t.buyer_id === dbUser.id ? 'buy' : 'sell',
        counterparty: dbUser && t.buyer_id === dbUser.id ? t.seller : t.buyer,
    }));

    const filtered = filter === 'all' ? transformedTxs
        : transformedTxs.filter(t => t.type === filter);

    // Real monthly volume from live data
    const monthlyMap = {};
    transactions.forEach(t => {
        const m = t.date ? t.date.split(' ')[0] : 'Mar';
        monthlyMap[m] = (monthlyMap[m] || 0) + t.kwh_amount;
    });
    const monthlyVolume = Object.entries(monthlyMap).map(([month, kwh]) => ({
        month, kwh: parseFloat(kwh.toFixed(1))
    }));

    const filters = [
        { key: 'all', label: 'All', count: transformedTxs.length },
        { key: 'sell', label: 'Sold', count: transformedTxs.filter(t => t.type === 'sell').length },
        { key: 'buy', label: 'Bought', count: transformedTxs.filter(t => t.type === 'buy').length },
    ];

    return (
        <AppLayout role="user">
            <Toast message={toast} visible={toastVisible} />

            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 className="page-title">Transaction History</h1>
                        <p className="page-subtitle">All your energy trades on the Q-Trade network</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--teal-400)', fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal-400)', display: 'inline-block', animation: 'live-pulse 1.4s infinite' }} />
                        Live · updating every 5s
                    </div>
                </div>
            </div>

            {/* ── Stat cards + volume chart ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.4fr', gap: 20, marginBottom: 28 }}>
                {[
                    { label: 'Total Volume', value: `${(wallet.kwh_consumed + wallet.kwh_available).toFixed(1)} kWh`, color: 'var(--teal-400)', accent: 'teal' },
                    { label: 'Total Earned', value: `$${wallet.total_earned.toFixed(2)}`, color: 'var(--green-400)', accent: 'green' },
                    { label: 'Total Spent', value: `$${wallet.total_spent.toFixed(2)}`, color: 'var(--amber-400)', accent: 'amber' },
                ].map(item => (
                    <div key={item.label} className={`stat-card ${item.accent}`}>
                        <div className="stat-label">{item.label}</div>
                        <div className="stat-value" style={{ color: item.color, fontSize: '1.6rem' }}>{item.value}</div>
                    </div>
                ))}
                <div className="glass-card" style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                        Volume by Month
                    </div>
                    <div style={{ height: 60 }}>
                        {monthlyVolume.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyVolume} margin={{ top: 0, right: 0, bottom: 0, left: -24 }}>
                                    <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="kwh" fill="#2dd4bf" radius={[3, 3, 0, 0]} opacity={0.85} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
                                No data yet
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="glass-card">
                <div className="section-header" style={{ marginBottom: 0 }}>
                    <div>
                        <div className="section-title">All Transactions</div>
                        <div className="section-subtitle">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {filters.map(f => (
                                <button key={f.key} onClick={() => setFilter(f.key)} style={{
                                    padding: '5px 13px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600,
                                    border: `1px solid ${filter === f.key ? 'var(--teal-400)' : 'var(--border)'}`,
                                    background: filter === f.key ? 'var(--teal-glow)' : 'transparent',
                                    color: filter === f.key ? 'var(--teal-400)' : 'var(--text-secondary)',
                                    cursor: 'pointer', transition: 'all 0.15s ease',
                                }}>
                                    {f.label} <span style={{ opacity: 0.7 }}>({f.count})</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: 16 }}>
                    <EnergyTable
                        columns={txColumns}
                        data={filtered.map(row => ({
                            ...row,
                            _highlight: newIds.has(row.id),
                        }))}
                    />
                    {filtered.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            {transactions.length === 0
                                ? '⚡ No transactions yet. Run Quantum Pairing in the Energy Market to create matches!'
                                : 'No transactions match this filter.'}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
