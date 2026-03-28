import { IoFlash, IoTrendingUp, IoLeafOutline, IoCashOutline, IoSunnyOutline } from 'react-icons/io5';
import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import StatCard from '../components/StatCard';
import SolarChart from '../components/SolarChart';
import EnergyTable from '../components/EnergyTable';
import { useAuthStore } from '../utils/useAuth';
import { useApi } from '../utils/useApi';
import { usePolling } from '../utils/usePolling';

const txColumns = [
    { key: 'date', label: 'Date', render: (v, row) => `${v} ${row.time}` },
    {
        key: 'type', label: 'Type',
        render: (v) => <span className={`badge badge-${v}`}>{v.toUpperCase()}</span>
    },
    { key: 'counterparty', label: 'Neighbor' },
    { key: 'kwh', label: 'kWh', render: (v) => `${v} kWh` },
    { key: 'pricePerKwh', label: '$/kWh', render: (v) => `$${v.toFixed(2)}` },
    { key: 'distance', label: 'Distance' },
    {
        key: 'status', label: 'Status',
        render: (v) => <span className={`badge badge-${v}`}>{v}</span>
    },
];

export default function UserDashboard() {
    const user = useAuthStore(state => state.user);
    const { request } = useApi();
    const [loading, setLoading] = useState(true);
    const [dbUser, setDbUser] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [forecast, setForecast] = useState(null);

    // Resolve DB user once on mount
    useEffect(() => {
        if (!user) return;
        request(`/api/users/by-email/${encodeURIComponent(user.email)}`, { method: 'GET' })
            .then(u => { if (u) setDbUser(u); })
            .catch(console.error);
    }, [user]);

    const fetchDashboardData = useCallback(async () => {
        if (!dbUser) return;
        try {
            let lat = null, lng = null;
            try {
                const position = await new Promise((resolve, reject) => {
                    if (!navigator.geolocation) reject('No geolocation');
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
                });
                lat = position.coords.latitude;
                lng = position.coords.longitude;
            } catch (geoErr) {}

            let forecastUrl = `/api/forecast/${dbUser.id}`;
            if (lat !== null && lng !== null) forecastUrl += `?lat=${lat}&lng=${lng}`;

            const [walletRes, txRes, forecastRes] = await Promise.all([
                request(`/api/wallets/${dbUser.id}`, { method: 'GET' }),
                request(`/api/transactions?user_id=${dbUser.id}`, { method: 'GET' }),
                request(forecastUrl, { method: 'GET' })
            ]);

            if (walletRes) setWallet(walletRes);
            if (txRes) setTransactions(txRes);
            if (forecastRes) setForecast(forecastRes);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [dbUser]);

    usePolling(fetchDashboardData, 8000, !!dbUser);

    if (loading) {
        return (
            <AppLayout role="user">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <div style={{ color: 'var(--teal-400)', fontWeight: 600 }}>Syncing node with virtual microgrid...</div>
                </div>
            </AppLayout>
        );
    }

    if (!wallet || !forecast) {
        return (
            <AppLayout role="user">
                <div style={{ color: 'var(--red-400)', padding: 40 }}>Failed to load dashboard data. Is the Python backend running?</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout role="user">
            <div className="page-header">
                <h1 className="page-title">Energy Wallet</h1>
                <p className="page-subtitle">Your personal energy trading dashboard — {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <StatCard
                    icon={<IoCashOutline color="var(--teal-400)" />}
                    label="Energy Credits"
                    value={`${wallet.energy_credits.toFixed(2)} EC`}
                    change="Available balance"
                    changeType="positive"
                    accent="teal"
                    delay={0}
                />
                <StatCard
                    icon={<IoFlash color="var(--amber-400)" />}
                    label="kWh Available"
                    value={`${wallet.kwh_available.toFixed(1)} kWh`}
                    change="Ready to sell"
                    changeType="positive"
                    accent="amber"
                    delay={1}
                />
                <StatCard
                    icon={<IoTrendingUp color="var(--green-400)" />}
                    label="Total Earned"
                    value={`$${wallet.total_earned.toFixed(2)}`}
                    change="All time"
                    accent="green"
                    delay={2}
                />
                <StatCard
                    icon={<IoLeafOutline color="#a78bfa" />}
                    label="CO₂ Offset"
                    value="64.2 kg"
                    change="This month"
                    accent="purple"
                    delay={3}
                />
            </div>

            {/* Main grid */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Solar Forecast Card */}
                <div className="glass-card teal-accent animate-fadein animate-fadein-delay-1">
                    <div className="section-header">
                        <div>
                            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <IoSunnyOutline color="var(--amber-400)" /> SunSync Forecast
                            </div>
                            <div className="section-subtitle">Predicted solar output — today</div>
                        </div>
                        <span className="badge badge-matched">AI Active</span>
                    </div>
                    <div className="chart-container">
                        <SolarChart data={forecast.hourly_curve} />
                    </div>
                    <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                        <div>
                            <div className="stat-label">Weather Context</div>
                            <div style={{ fontWeight: 700, color: 'var(--teal-400)', textTransform: 'capitalize' }}>
                                {forecast.weather_context ? `${Math.round(forecast.weather_context.temp_max_c)}°C / ${Math.round(forecast.weather_context.cloud_cover_pct)}% Clouds` : 'Cloudy'}
                            </div>
                        </div>
                        <div>
                            <div className="stat-label">Panel Rating</div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{forecast.panel_kw} kW</div>
                        </div>
                        <div>
                            <div className="stat-label">Total Est. Today</div>
                            <div style={{ fontWeight: 700, color: 'var(--amber-400)' }}>{forecast.predicted_total_kwh} kWh</div>
                        </div>
                    </div>
                </div>

                {/* Wallet Summary Card */}
                <div className="glass-card animate-fadein animate-fadein-delay-2">
                    <div className="section-header">
                        <div>
                            <div className="section-title">Wallet Summary</div>
                            <div className="section-subtitle">Credits & activity</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[
                            { label: 'Energy Credits Balance', value: `${wallet.energy_credits.toFixed(2)} EC`, color: 'var(--teal-400)' },
                            { label: 'kWh Consumed (YTD)', value: `${wallet.kwh_consumed.toFixed(1)} kWh`, color: 'var(--text-primary)' },
                            { label: 'Total Spent (All Time)', value: `$${wallet.total_spent.toFixed(2)}`, color: 'var(--red-400)' },
                            { label: 'Total Earned (All Time)', value: `$${wallet.total_earned.toFixed(2)}`, color: 'var(--green-400)' },
                        ].map((item) => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                                <span style={{ fontWeight: 700, color: item.color }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Savings vs. Grid ── */}
            <div style={{ marginBottom: 24 }} className="animate-fadein animate-fadein-delay-2">
                {wallet && (() => {
                    const RETAIL = 0.18;
                    const totalKwh = wallet.kwh_consumed;
                    const avgPrice = totalKwh > 0 && wallet.total_spent > 0 ? wallet.total_spent / totalKwh : 0.108;
                    const retailCost = totalKwh * RETAIL;
                    const savings = retailCost - wallet.total_spent;
                    const savingsPct = retailCost > 0 ? Math.round((savings / retailCost) * 100) : 0;
                    return (
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(251,191,36,0.07) 0%, rgba(45,212,191,0.05) 100%)',
                            border: '1px solid rgba(251,191,36,0.2)',
                            borderRadius: 'var(--radius-lg)', padding: '22px 28px',
                            display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center',
                        }}>
                            <div style={{ flex: '1 1 220px' }}>
                                <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--amber-400)', textTransform: 'uppercase', marginBottom: 6 }}>
                                    💰 Savings vs. Utility Grid — All Time
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    <span style={{ fontSize: '2.6rem', fontWeight: 800, color: 'var(--amber-400)', letterSpacing: '-0.04em' }}>${Math.max(0, savings).toFixed(2)}</span>
                                    <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>saved</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                    vs. buying the same {totalKwh.toFixed(1)} kWh from your utility at ${RETAIL}/kWh
                                </div>
                            </div>
                            <div style={{ flex: '2 1 320px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {[
                                    { label: 'You paid on Q-Trade', cost: `$${avgPrice.toFixed(3)}/kWh`, percentage: Math.round((avgPrice / RETAIL) * 100), color: 'var(--teal-400)', total: `$${wallet.total_spent.toFixed(2)}`, sub: `${totalKwh.toFixed(1)} kWh × avg $${avgPrice.toFixed(3)}` },
                                    { label: 'Utility retail rate', cost: `$${RETAIL}/kWh`, percentage: 100, color: 'var(--text-muted)', total: `$${retailCost.toFixed(2)}`, sub: `${totalKwh.toFixed(1)} kWh × $${RETAIL}` },
                                ].map(row => (
                                    <div key={row.label}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{row.label}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 8 }}>{row.sub}</span>
                                            </div>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: row.color }}>{row.total}</span>
                                        </div>
                                        <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${row.percentage}%`, background: row.color === 'var(--teal-400)' ? 'linear-gradient(90deg, var(--teal-600), var(--teal-400))' : 'rgba(255,255,255,0.12)', borderRadius: 4, transition: 'width 1s ease' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
                                <div style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 'var(--radius-md)', padding: '14px 20px' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--amber-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Net Savings</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--amber-400)' }}>{savingsPct}%</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>vs. retail grid</div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Recent Transactions - live */}
            <div className="glass-card animate-fadein animate-fadein-delay-3">
                <div className="section-header">
                    <div>
                        <div className="section-title">Recent Transactions</div>
                        <div className="section-subtitle">Your latest energy trades</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'var(--teal-400)', fontWeight: 600 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal-400)', display: 'inline-block', animation: 'live-pulse 1.4s infinite' }} />
                            Live
                        </span>
                        <button className="btn btn-secondary btn-sm" onClick={() => window.location.href = '/history'}>View All</button>
                    </div>
                </div>
                {transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        No transactions yet — run Quantum Pairing in the Energy Market!
                    </div>
                ) : (
                    <EnergyTable columns={txColumns} data={transactions.slice(0, 4).map(t => ({
                        ...t,
                        type: dbUser && t.buyer_id === dbUser.id ? 'buy' : 'sell',
                        counterparty: dbUser && t.buyer_id === dbUser.id ? t.seller : t.buyer,
                        kwh: t.kwh_amount,
                        pricePerKwh: t.price_per_kwh,
                        distance: 'Direct Grid',
                        status: t.status || 'completed',
                    }))} />
                )}
            </div>
        </AppLayout>
    );
}
