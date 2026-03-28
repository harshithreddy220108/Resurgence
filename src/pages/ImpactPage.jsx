import { useState } from 'react';
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { IoLeafOutline, IoFlash, IoTrendingUp, IoCashOutline, IoEarthOutline, IoStarOutline } from 'react-icons/io5';
import AppLayout from '../components/AppLayout';

// ── Mock data ────────────────────────────────────────────────────────────────

const monthlyData = [
    { month: 'Jan', kwhTraded: 38.2, co2: 17.2, peerPct: 48, savings: 19.8 },
    { month: 'Feb', kwhTraded: 62.1, co2: 27.9, peerPct: 54, savings: 32.3 },
    { month: 'Mar', kwhTraded: 147.5, co2: 66.4, peerPct: 62, savings: 76.7 },
];

// SDG 7 sub-targets and our contribution
const sdgTargets = [
    {
        id: '7.1', label: 'Affordable Energy Access',
        description: 'Affordable clean energy for your household vs. utility retail',
        score: 78, unit: '% cost reduction vs. grid',
        color: '#2dd4bf',
    },
    {
        id: '7.2', label: 'Renewable Energy Share',
        description: 'Share of your energy consumption sourced from local solar P2P',
        score: 62, unit: '% of energy from renewables',
        color: '#4ade80',
    },
    {
        id: '7.3', label: 'Energy Efficiency',
        description: 'Reduction in transmission loss vs. centralized grid routing',
        score: 91, unit: '% shorter transmission vs. grid',
        color: '#fbbf24',
    },
];

const badges = [
    { icon: '☀️', label: 'Solar Trader', earned: true, desc: 'Completed first trade' },
    { icon: '🌱', label: 'Green Starter', earned: true, desc: 'Avoided first 10 kg CO₂' },
    { icon: '⚡', label: 'Active Prosumer', earned: true, desc: '10+ trades completed' },
    { icon: '🌍', label: 'SDG Champion', earned: false, desc: 'Trade 500+ kWh clean energy' },
    { icon: '🏆', label: 'Grid Pioneer', earned: false, desc: 'Rank in top 5% of neighborhood' },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem',
            }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
                {payload.map(p => (
                    <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>
                        {p.name}: {p.value}{typeof p.value === 'number' && p.dataKey === 'peerPct' ? '%' : p.dataKey === 'kwhTraded' ? ' kWh' : p.dataKey === 'co2' ? ' kg' : ''}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// ─────────────────────────────────────────────────────────────────────────────

export default function ImpactPage() {
    const [activeChart, setActiveChart] = useState('kwhTraded');

    const totalKwh = monthlyData.reduce((s, m) => s + m.kwhTraded, 0).toFixed(1);
    const totalCo2 = monthlyData.reduce((s, m) => s + m.co2, 0).toFixed(1);
    const totalSaved = monthlyData.reduce((s, m) => s + m.savings, 0).toFixed(2);
    const avgPeerPct = (monthlyData.reduce((s, m) => s + m.peerPct, 0) / monthlyData.length).toFixed(0);
    const cleanScore = parseInt(avgPeerPct);

    const chartOptions = [
        { key: 'kwhTraded', label: 'kWh Traded', color: '#2dd4bf' },
        { key: 'co2', label: 'CO₂ Avoided (kg)', color: '#4ade80' },
        { key: 'peerPct', label: 'P2P Energy %', color: '#fbbf24' },
        { key: 'savings', label: 'Savings ($)', color: '#a78bfa' },
    ];
    const activeOpt = chartOptions.find(o => o.key === activeChart);

    return (
        <AppLayout role="user">
            <div className="page-header">
                <h1 className="page-title">My Impact</h1>
                <p className="page-subtitle">Your personal contribution to SDG 7 — Affordable and Clean Energy</p>
            </div>

            {/* ── Hero: Cleanliness Score ────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(45,212,191,0.1) 0%, rgba(74,222,128,0.07) 50%, rgba(167,139,250,0.06) 100%)',
                border: '1px solid rgba(45,212,191,0.25)',
                borderRadius: 'var(--radius-xl)',
                padding: '28px 32px',
                marginBottom: 28,
                display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'wrap',
            }}>
                {/* Circular score */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 10px' }}>
                        <svg width="120" height="120" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                            <circle cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGrad)" strokeWidth="10"
                                strokeDasharray={`${2 * Math.PI * 52 * cleanScore / 100} ${2 * Math.PI * 52}`}
                                strokeLinecap="round" transform="rotate(-90 60 60)" />
                            <defs>
                                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#2dd4bf" />
                                    <stop offset="100%" stopColor="#4ade80" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2dd4bf', lineHeight: 1 }}>{cleanScore}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>out of 100</div>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--teal-400)' }}>Clean Energy Score</div>
                </div>

                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--green-400)', marginBottom: 6 }}>
                        🌱 Your Clean Energy Story
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 10 }}>
                        You've kept <span style={{ color: 'var(--teal-400)' }}>{totalKwh} kWh</span> of solar<br />
                        energy flowing locally — not through<br />
                        a distant fossil-fuel grid.
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        That's <strong style={{ color: 'var(--green-400)' }}>{totalCo2} kg of CO₂ avoided</strong>, equivalent to planting{' '}
                        <strong style={{ color: 'var(--green-400)' }}>{(totalCo2 / 21).toFixed(0)} trees</strong> or keeping a car off the road for{' '}
                        <strong style={{ color: 'var(--green-400)' }}>{(totalCo2 * 2.48).toFixed(0)} miles</strong>.
                    </div>
                </div>

                {/* Quick equivalents */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
                    {[
                        { emoji: '🌳', value: `${(totalCo2 / 21).toFixed(0)}`, label: 'Trees equivalent' },
                        { emoji: '🚗', value: `${(totalCo2 * 2.48).toFixed(0)} mi`, label: 'Car miles avoided' },
                        { emoji: '💡', value: `${(parseFloat(totalKwh) * 50).toFixed(0)} hrs`, label: 'LED bulb hours' },
                    ].map(item => (
                        <div key={item.label} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)',
                            padding: '8px 14px', border: '1px solid var(--border)',
                        }}>
                            <span style={{ fontSize: '1.3rem' }}>{item.emoji}</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{item.value}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Stat cards ────────────────────────────────────────────── */}
            <div className="stats-grid" style={{ marginBottom: 28 }}>
                {[
                    { icon: <IoFlash color="var(--teal-400)" />, label: 'kWh Traded (Solar)', value: `${totalKwh} kWh`, change: '+85.4 kWh this month', changeType: 'positive', accent: 'teal' },
                    { icon: <IoLeafOutline color="var(--green-400)" />, label: 'CO₂ Avoided', value: `${totalCo2} kg`, change: 'vs. grid baseline', changeType: 'positive', accent: 'green' },
                    { icon: <IoEarthOutline color="var(--amber-400)" />, label: 'P2P Energy Share', value: `${avgPeerPct}%`, change: 'of your monthly usage', accent: 'amber' },
                    { icon: <IoCashOutline color="#a78bfa" />, label: 'Total Savings', value: `$${totalSaved}`, change: 'vs. utility retail rates', changeType: 'positive', accent: 'purple' },
                ].map((card, i) => (
                    <div key={card.label} className={`stat-card ${card.accent}`}>
                        <div className="stat-icon">{card.icon}</div>
                        <div className="stat-label">{card.label}</div>
                        <div className="stat-value" style={{ fontSize: '1.6rem' }}>{card.value}</div>
                        <div className={`stat-change ${card.changeType || ''}`}>{card.change}</div>
                    </div>
                ))}
            </div>

            {/* ── Charts + SDG alignment ─────────────────────────────────── */}
            <div className="grid-2" style={{ marginBottom: 24 }}>

                {/* Monthly progress chart */}
                <div className="glass-card">
                    <div className="section-header">
                        <div>
                            <div className="section-title">📈 Monthly Progress</div>
                            <div className="section-subtitle">Your growing clean energy contribution</div>
                        </div>
                    </div>
                    {/* Chart tab switcher */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                        {chartOptions.map(opt => (
                            <button key={opt.key}
                                onClick={() => setActiveChart(opt.key)}
                                style={{
                                    padding: '4px 12px', borderRadius: 100, fontSize: '0.73rem', fontWeight: 600,
                                    border: `1px solid ${activeChart === opt.key ? opt.color + '50' : 'var(--border)'}`,
                                    background: activeChart === opt.key ? opt.color + '18' : 'transparent',
                                    color: activeChart === opt.key ? opt.color : 'var(--text-secondary)',
                                    cursor: 'pointer', transition: 'all 0.2s ease',
                                }}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                                <defs>
                                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="15%" stopColor={activeOpt.color} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={activeOpt.color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey={activeChart} name={activeOpt.label}
                                    stroke={activeOpt.color} strokeWidth={2.5}
                                    fill="url(#chartGrad)" dot={{ fill: activeOpt.color, r: 4 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* SDG 7 alignment */}
                <div className="glass-card teal-accent">
                    <div className="section-header">
                        <div>
                            <div className="section-title">🌍 SDG 7 Alignment</div>
                            <div className="section-subtitle">Your contribution to the UN Sustainable Development Goals</div>
                        </div>
                        <span style={{
                            fontSize: '0.68rem', fontWeight: 700, color: 'var(--teal-400)',
                            background: 'var(--teal-glow)', border: '1px solid var(--border-accent)',
                            borderRadius: 100, padding: '3px 10px',
                        }}>Goal 7: Clean Energy</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {sdgTargets.map(t => (
                            <div key={t.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <div>
                                        <span style={{
                                            fontSize: '0.7rem', fontWeight: 700, color: t.color,
                                            background: t.color + '18', padding: '2px 8px', borderRadius: 100,
                                            marginRight: 8, border: `1px solid ${t.color}30`
                                        }}>SDG {t.id}</span>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.label}</span>
                                    </div>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: t.color }}>{t.score}%</span>
                                </div>
                                <div style={{ height: 7, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                                    <div style={{
                                        height: '100%', width: `${t.score}%`,
                                        background: `linear-gradient(90deg, ${t.color}80, ${t.color})`,
                                        borderRadius: 4, boxShadow: `0 0 8px ${t.color}44`,
                                    }} />
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Badges ─────────────────────────────────────────────────── */}
            <div className="glass-card">
                <div className="section-header">
                    <div>
                        <div className="section-title">🏅 Prosumer Achievements</div>
                        <div className="section-subtitle">Earn badges by contributing to your community's clean energy future</div>
                    </div>
                    <span style={{
                        fontSize: '0.78rem', color: 'var(--text-secondary)',
                    }}>{badges.filter(b => b.earned).length}/{badges.length} earned</span>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {badges.map(badge => (
                        <div key={badge.label} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                            padding: '16px 20px', borderRadius: 'var(--radius-md)',
                            border: `1px solid ${badge.earned ? 'rgba(45,212,191,0.2)' : 'var(--border)'}`,
                            background: badge.earned ? 'rgba(45,212,191,0.05)' : 'rgba(255,255,255,0.02)',
                            opacity: badge.earned ? 1 : 0.45,
                            minWidth: 100, textAlign: 'center', flex: '1 1 100px',
                            transition: 'all 0.2s ease',
                        }}>
                            <div style={{ fontSize: '2rem', filter: badge.earned ? 'none' : 'grayscale(1)' }}>{badge.icon}</div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: badge.earned ? 'var(--text-primary)' : 'var(--text-muted)' }}>{badge.label}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{badge.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
