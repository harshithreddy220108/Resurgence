import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { IoFlash, IoPeopleOutline, IoLeafOutline, IoTrendingUp } from 'react-icons/io5';
import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import StatCard from '../components/StatCard';
import { communityEnergyData } from '../data/mockData';
import { useApi } from '../utils/useApi';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem'
            }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
                {payload.map((p) => (
                    <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>
                        {p.name}: {p.value} kWh
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function AdminDashboard() {
    const totalTraded = communityEnergyData.reduce((s, d) => s + d.traded, 0);
    const totalGenerated = communityEnergyData.reduce((s, d) => s + d.generated, 0);
    const avgPrice = 0.108;
    const co2Base = parseFloat((totalTraded * 0.45).toFixed(2));

    const [co2Live, setCo2Live] = useState(co2Base);
    const [listings, setListings] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const { request } = useApi();

    useEffect(() => {
        async function fetchAdminData() {
            try {
                const [listRes, txRes] = await Promise.all([
                    request('/api/listings?status=open', { method: 'GET' }),
                    request('/api/transactions?limit=10', { method: 'GET' })
                ]);
                if (listRes) setListings(listRes);
                if (txRes) setMatches(txRes);
            } catch (err) {
                console.error("Admin fetch error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAdminData();

        const interval = setInterval(() => {
            setCo2Live(prev => parseFloat((prev + 0.003 + Math.random() * 0.002).toFixed(3)));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <AppLayout role="admin"><div style={{ padding: 40, color: 'var(--teal-400)' }}>Syncing microgrid metrics...</div></AppLayout>;
    }

    return (
        <AppLayout role="admin">
            <div className="page-header">
                <h1 className="page-title">Community Overview</h1>
                <p className="page-subtitle">Microgrid performance — week of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>

            {/* ── Feature 7: Real-Time CO₂ Counter ── */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(74,222,128,0.08) 0%, rgba(45,212,191,0.06) 100%)',
                border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 28px',
                marginBottom: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 24,
                flexWrap: 'wrap',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(74,222,128,0.25), rgba(74,222,128,0.05))',
                        border: '1px solid rgba(74,222,128,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                        boxShadow: '0 0 20px rgba(74,222,128,0.15)',
                        animation: 'pulse-glow 2s ease-in-out infinite',
                    }}>🌿</div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--green-400)', textTransform: 'uppercase', marginBottom: 2 }}>Live CO₂ Avoided — Platform Lifetime</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--green-400)', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                                {co2Live.toFixed(3)}
                            </span>
                            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>kg CO₂</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Equivalent Trees Planted', value: `${(co2Live / 21).toFixed(1)}`, unit: 'trees 🌳' },
                        { label: 'Car Miles Avoided', value: `${(co2Live * 2.48).toFixed(1)}`, unit: 'miles 🚗' },
                        { label: 'kWh Locally Traded', value: `${(co2Live / 0.45).toFixed(1)}`, unit: 'kWh ⚡' },
                    ].map(item => (
                        <div key={item.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{item.value} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.unit}</span></div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{item.label}</div>
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--green-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green-400)', display: 'inline-block', animation: 'live-pulse 1.4s infinite' }} />
                    Updating live
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <StatCard icon={<IoFlash color="var(--teal-400)" />} label="Total kWh Traded" value={`${totalTraded} kWh`} change="This week" accent="teal" delay={0} />
                <StatCard icon={<IoPeopleOutline color="var(--amber-400)" />} label="Active Users" value="6" change="5 active, 1 inactive" accent="amber" delay={1} />
                <StatCard icon={<IoTrendingUp color="var(--green-400)" />} label="Avg Price/kWh" value={`$${avgPrice}`} change="vs $0.18 retail" changeType="positive" accent="green" delay={2} />
                <StatCard icon={<IoLeafOutline color="#a78bfa" />} label="CO₂ Saved" value={`${co2Live.toFixed(1)} kg`} change="vs grid baseline" changeType="positive" accent="purple" delay={3} />
            </div>

            {/* Charts + Latest Matches */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Community Energy Chart */}
                <div className="glass-card">
                    <div className="section-header">
                        <div>
                            <div className="section-title">Community Energy Flow</div>
                            <div className="section-subtitle">Generated vs. Consumed vs. Traded (kWh)</div>
                        </div>
                    </div>
                    <div style={{ height: 240, marginTop: 8 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={communityEnergyData} barSize={8} barGap={3}>
                                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }} />
                                <Bar dataKey="generated" name="Generated" fill="var(--amber-400)" radius={[4, 4, 0, 0]} opacity={0.85} />
                                <Bar dataKey="consumed" name="Consumed" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.85} />
                                <Bar dataKey="traded" name="Traded P2P" fill="var(--teal-400)" radius={[4, 4, 0, 0]} opacity={0.85} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Latest Match Results */}
                <div className="glass-card teal-accent">
                    <div className="section-header">
                        <div>
                            <div className="section-title">⚛️ Latest Matches</div>
                            <div className="section-subtitle">Microgrid Matchmaker — today</div>
                        </div>
                        <span className="badge badge-matched">QAOA Run Complete</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {matches.map((m) => (
                            <div key={m.id} style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)', padding: '14px 16px',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                        <span style={{ color: 'var(--amber-400)' }}>{m.seller}</span>
                                        <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>→</span>
                                        <span style={{ color: 'var(--teal-400)' }}>{m.buyer}</span>
                                    </div>
                                    <span className="badge badge-matched">Matched</span>
                                </div>
                                <div style={{ display: 'flex', gap: 20 }}>
                                    {[
                                        { label: 'Volume', value: `${m.kwh} kWh` },
                                        { label: 'Price', value: `$${m.price}/kWh` },
                                        { label: 'Distance', value: 'Direct Grid' },
                                        { label: 'CO₂ Saved', value: `${m.co2_saved_kg.toFixed(1)} kg` },
                                    ].map((item) => (
                                        <div key={item.label}>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.label}</div>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Active Listings preview */}
            <div className="glass-card">
                <div className="section-header">
                    <div>
                        <div className="section-title">Active Listings</div>
                        <div className="section-subtitle">Open buy & sell orders</div>
                    </div>
                    <button className="btn btn-secondary btn-sm">View All</button>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th><th>User</th><th>Type</th><th>kWh</th><th>$/kWh</th><th>Status</th><th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listings.slice(0, 5).map((l) => (
                                <tr key={l.id}>
                                    <td><span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{Math.floor(l.id)}</span></td>
                                    <td>{l.neighbor}</td>
                                    <td><span className={`badge badge-${l.offer_type}`}>{l.offer_type.toUpperCase()}</span></td>
                                    <td>{l.kwh} kWh</td>
                                    <td>${l.price.toFixed(2)}</td>
                                    <td><span className={`badge badge-${l.status}`}>{l.status}</span></td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{l.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
