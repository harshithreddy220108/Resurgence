import { useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { IoLeafOutline, IoFlash, IoEarth, IoStatsChart, IoTrendingUp } from 'react-icons/io5';
import AppLayout from '../components/AppLayout';

// ── Mock community data ──────────────────────────────────────────────────────

const monthlyGrowth = [
    { month: 'Oct', kwh: 18.4, co2: 8.3, households: 8, peerPct: 22 },
    { month: 'Nov', kwh: 31.2, co2: 14.0, households: 12, peerPct: 31 },
    { month: 'Dec', kwh: 44.6, co2: 20.1, households: 18, peerPct: 38 },
    { month: 'Jan', kwh: 67.8, co2: 30.5, households: 22, peerPct: 44 },
    { month: 'Feb', kwh: 98.4, co2: 44.3, households: 28, peerPct: 52 },
    { month: 'Mar', kwh: 147.5, co2: 66.4, households: 34, peerPct: 62 },
];

const sdgTargetProgress = [
    {
        id: '7.1', title: 'Affordable Energy Access',
        target: 'All residents access clean energy at ≤50% of retail rate',
        achieved: 83,
        metric: '83% of households paying ≤$0.12/kWh vs $0.18 retail',
        color: '#2dd4bf',
    },
    {
        id: '7.2', title: 'Renewable Energy Share',
        target: 'Substantially increase share of renewable energy in community mix',
        achieved: 62,
        metric: '62% of community energy needs met from local solar',
        color: '#4ade80',
    },
    {
        id: '7.3', title: 'Energy Efficiency',
        target: 'Double improvement in energy efficiency (minimize transmission loss)',
        achieved: 91,
        metric: '91% reduction in avg transmission distance vs centralized grid',
        color: '#fbbf24',
    },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem' }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
                {payload.map(p => (
                    <div key={p.name} style={{ color: p.color || p.fill, fontWeight: 600 }}>{p.name}: {p.value}</div>
                ))}
            </div>
        );
    }
    return null;
};

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminSdgReport() {
    const totalKwh = monthlyGrowth.reduce((s, m) => s + m.kwh, 0).toFixed(1);
    const totalCo2 = monthlyGrowth.reduce((s, m) => s + m.co2, 0).toFixed(1);
    const currentPct = monthlyGrowth[monthlyGrowth.length - 1].peerPct;
    const households = monthlyGrowth[monthlyGrowth.length - 1].households;

    return (
        <AppLayout role="admin">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 className="page-title">🌍 SDG Impact Report</h1>
                        <p className="page-subtitle">Q-Trade community's contribution to UN SDG 7 — Affordable and Clean Energy</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 100, padding: '4px 12px' }}>SDG 7.1 ✓</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2dd4bf', background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 100, padding: '4px 12px' }}>SDG 7.2 ✓</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 100, padding: '4px 12px' }}>SDG 7.3 ✓</span>
                    </div>
                </div>
            </div>

            {/* ── Hero community impact banner ──────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(74,222,128,0.08) 0%, rgba(45,212,191,0.06) 60%, rgba(139,92,246,0.04) 100%)',
                border: '1px solid rgba(74,222,128,0.2)', borderRadius: 'var(--radius-xl)',
                padding: '24px 32px', marginBottom: 28,
                display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center',
            }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', color: '#4ade80', textTransform: 'uppercase', marginBottom: 8 }}>
                        🌿 Community Clean Energy Impact — Platform Lifetime
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                        <span style={{ color: '#4ade80' }}>{totalKwh} kWh</span> of solar energy has<br />flowed between neighbors — not<br />through a fossil-fuel grid.
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, flex: '0 0 auto' }}>
                    {[
                        { value: `${totalCo2} kg`, label: 'CO₂ Avoided', sub: `≈ ${Math.floor(totalCo2 / 21)} trees planted`, color: '#4ade80' },
                        { value: `${households}`, label: 'Households', sub: 'actively participating', color: '#2dd4bf' },
                        { value: `${currentPct}%`, label: 'Renewable Share', sub: 'of community energy', color: '#fbbf24' },
                        { value: `${(totalCo2 * 2.48).toFixed(0)} mi`, label: 'Car Miles Offset', sub: 'equivalent avoided', color: '#a78bfa' },
                    ].map(item => (
                        <div key={item.label} style={{
                            background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)', padding: '12px 16px', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.color, letterSpacing: '-0.03em' }}>{item.value}</div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{item.label}</div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 1 }}>{item.sub}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Stats grid ──────────────────────────────────────────────── */}
            <div className="stats-grid" style={{ marginBottom: 28 }}>
                {[
                    { icon: <IoFlash color="var(--teal-400)" />, label: 'Total kWh Traded', value: `${totalKwh} kWh`, change: '+85.4 kWh this month', accent: 'teal' },
                    { icon: <IoLeafOutline color="var(--green-400)" />, label: 'CO₂ Avoided', value: `${totalCo2} kg`, change: 'vs. grid baseline', accent: 'green' },
                    { icon: <IoEarth color="var(--amber-400)" />, label: 'P2P Energy Share', value: `${currentPct}%`, change: '+10% from last month', accent: 'amber' },
                    { icon: <IoTrendingUp color="#a78bfa" />, label: 'Active Households', value: `${households}`, change: '+6 this month', accent: 'purple' },
                ].map(card => (
                    <div key={card.label} className={`stat-card ${card.accent}`}>
                        <div className="stat-icon">{card.icon}</div>
                        <div className="stat-label">{card.label}</div>
                        <div className="stat-value" style={{ fontSize: '1.6rem' }}>{card.value}</div>
                        <div className="stat-change positive">{card.change}</div>
                    </div>
                ))}
            </div>

            {/* ── Charts ──────────────────────────────────────────────────── */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Community growth area chart */}
                <div className="glass-card">
                    <div className="section-header">
                        <div>
                            <div className="section-title">📈 Community Growth</div>
                            <div className="section-subtitle">Monthly kWh traded across the neighborhood</div>
                        </div>
                    </div>
                    <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyGrowth} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                                <defs>
                                    <linearGradient id="communityGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="10%" stopColor="#4ade80" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="kwh" name="kWh Traded" stroke="#4ade80" strokeWidth={2.5} fill="url(#communityGrad)" dot={{ fill: '#4ade80', r: 4 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Household participation bar chart */}
                <div className="glass-card">
                    <div className="section-header">
                        <div>
                            <div className="section-title">🏘️ Household Participation</div>
                            <div className="section-subtitle">Active prosumers growing each month</div>
                        </div>
                    </div>
                    <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyGrowth} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="households" name="Households" fill="#2dd4bf" radius={[4, 4, 0, 0]} opacity={0.85} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── SDG 7 target progress ────────────────────────────────────── */}
            <div className="glass-card teal-accent" style={{ marginBottom: 24 }}>
                <div className="section-header">
                    <div>
                        <div className="section-title">🎯 SDG 7 Target Progress</div>
                        <div className="section-subtitle">How Q-Trade neighborhoods contribute to each sub-target</div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {sdgTargetProgress.map(t => (
                        <div key={t.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: t.color, background: t.color + '18', padding: '3px 10px', borderRadius: 100, border: `1px solid ${t.color}30` }}>SDG {t.id}</span>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.title}</span>
                                </div>
                                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: t.color }}>{t.achieved}%</span>
                            </div>
                            <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
                                <div style={{
                                    height: '100%', width: `${t.achieved}%`,
                                    background: `linear-gradient(90deg, ${t.color}80, ${t.color})`,
                                    borderRadius: 5, boxShadow: `0 0 10px ${t.color}55`,
                                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                                }} />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <strong style={{ color: 'var(--text-secondary)' }}>Target:</strong> {t.target} &nbsp;·&nbsp;
                                <strong style={{ color: t.color }}>Achieved:</strong> {t.metric}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Neighborhood energy independence progress ─────────────── */}
            <div className="glass-card">
                <div className="section-header">
                    <div>
                        <div className="section-title">🏁 Energy Independence Progress</div>
                        <div className="section-subtitle">Neighborhood goal: 100% energy needs met from local P2P solar</div>
                    </div>
                    <span style={{ fontWeight: 700, color: '#4ade80', fontSize: '1.1rem' }}>{currentPct}%</span>
                </div>
                <div style={{ height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{
                        height: '100%', width: `${currentPct}%`,
                        background: 'linear-gradient(90deg, #2dd4bf, #4ade80)',
                        borderRadius: 8, transition: 'width 1s ease',
                        boxShadow: '0 0 16px rgba(74,222,128,0.4)',
                    }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>0% (Grid dependent)</span>
                    <span style={{ color: 'var(--green-400)', fontWeight: 600 }}>{currentPct}% today</span>
                    <span>100% (Energy independent)</span>
                </div>
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(74,222,128,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(74,222,128,0.15)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    At the current growth rate (+10% monthly), this neighborhood will reach <strong style={{ color: '#4ade80' }}>80% energy independence</strong> by {new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} — contributing directly to UN SDG 7.2's target of substantially increasing the share of renewable energy in the global energy mix.
                </div>
            </div>
        </AppLayout>
    );
}
