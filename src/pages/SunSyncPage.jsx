import { useState, useEffect, useCallback } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import { IoSunnyOutline } from 'react-icons/io5';
import AppLayout from '../components/AppLayout';
import { getCurrentUser } from '../utils/auth';
import { usePolling } from '../utils/usePolling';

const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem',
            }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
                <div style={{ color: '#fbbf24', fontWeight: 700 }}>{payload[0].value.toFixed(2)} kWh</div>
            </div>
        );
    }
    return null;
};

export default function SunSyncPage() {
    const localUser = getCurrentUser();
    const [dbUser, setDbUser] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [weekly, setWeekly] = useState([]);
    const [loading, setLoading] = useState(true);

    // Resolve DB user once
    useEffect(() => {
        if (!localUser) return;
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
        fetch(`${API_BASE}/api/users/by-email/${encodeURIComponent(localUser.email)}`)

            .then(r => r.ok ? r.json() : null)
            .then(u => { if (u) setDbUser(u); })
            .catch(console.error);
    }, []);

    const fetchForecasts = useCallback(async () => {
        if (!dbUser) return;
        try {
            let lat = null, lng = null;
            try {
                const pos = await new Promise((res, rej) => {
                    if (!navigator.geolocation) rej('no geo');
                    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 });
                });
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
            } catch (_) {}

            const qs = lat ? `?lat=${lat}&lng=${lng}` : '';
            const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
            const [todayRes, weekRes] = await Promise.all([
                fetch(`${API_BASE}/api/forecast/${dbUser.id}${qs}`),
                fetch(`${API_BASE}/api/forecast/weekly/${dbUser.id}${qs}`)
            ]);

            if (todayRes.ok) setForecast(await todayRes.json());
            if (weekRes.ok) {
                const w = await weekRes.json();
                setWeekly(w.days || []);
            }
        } catch (err) {
            console.error('SunSync fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [dbUser]);

    usePolling(fetchForecasts, 300000, !!dbUser); // refresh every 5 minutes

    if (loading || !forecast) {
        return (
            <AppLayout role="user">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <div style={{ color: 'var(--amber-400)', fontWeight: 600 }}>
                        ☀️ {loading ? 'Computing solar forecast via Open-Meteo + scikit-learn...' : 'No panel data found. Check your profile.'}
                    </div>
                </div>
            </AppLayout>
        );
    }

    const peakPoint = forecast.hourly_curve?.reduce((a, b) => b.kwh > a.kwh ? b : a, { kwh: 0 }) || {};
    const selfUse = forecast.panel_kw ? Math.min(forecast.predicted_total_kwh * 0.61, forecast.predicted_total_kwh) : 0;
    const surplus = Math.max(0, forecast.predicted_total_kwh - selfUse);
    const expectedEarnings = (surplus * 0.115).toFixed(2);
    const wCtx = forecast.weather_context || {};
    const describeWeather = (cover) => {
        if (cover < 20) return 'Clear Sky';
        if (cover < 50) return 'Partly Cloudy';
        if (cover < 75) return 'Mostly Cloudy';
        return 'Overcast';
    };

    return (
        <AppLayout role="user">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <IoSunnyOutline color="var(--amber-400)" /> SunSync AI
                        </h1>
                        <p className="page-subtitle">AI-powered solar generation forecast — SDG 7.1 &amp; 7.3</p>
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'var(--teal-glow)', border: '1px solid var(--border-accent)',
                        borderRadius: 'var(--radius-sm)', padding: '8px 14px',
                        fontSize: '0.78rem', color: 'var(--teal-400)', fontWeight: 600,
                    }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal-400)', display: 'inline-block', animation: 'live-pulse 1.4s infinite' }} />
                        Live · scikit-learn + Open-Meteo
                    </div>
                </div>
            </div>

            {/* ── AI Recommendation banner ── */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(45,212,191,0.06) 100%)',
                border: '1px solid rgba(251,191,36,0.25)',
                borderRadius: 'var(--radius-lg)', padding: '20px 28px', marginBottom: 28,
                display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
            }}>
                <div style={{ fontSize: '2.2rem' }}>🤖</div>
                <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--amber-400)', textTransform: 'uppercase', marginBottom: 4 }}>
                        SunSync Recommendation — Today
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        List <span style={{ color: 'var(--amber-400)' }}>{surplus.toFixed(1)} kWh</span> surplus at{' '}
                        <span style={{ color: 'var(--teal-400)' }}>$0.11–$0.13/kWh</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                        Your panels will generate <strong style={{ color: 'var(--text-primary)' }}>{forecast.predicted_total_kwh} kWh</strong> today. After estimated household use, you'll have{' '}
                        <strong style={{ color: 'var(--amber-400)' }}>{surplus.toFixed(1)} kWh</strong> of sellable surplus.
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Est. Earnings', value: `$${expectedEarnings}`, color: 'var(--green-400)' },
                        { label: 'Peak Output', value: peakPoint.time ? `${peakPoint.kwh.toFixed(2)} kWh @ ${peakPoint.time}` : '—', color: 'var(--amber-400)' },
                        { label: 'Panel Capacity', value: `${forecast.panel_kw} kW`, color: 'var(--teal-400)' },
                    ].map(item => (
                        <div key={item.label} style={{
                            background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)',
                            padding: '10px 16px', textAlign: 'center', border: '1px solid var(--border)', minWidth: 100,
                        }}>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: item.color }}>{item.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Main grid ── */}
            <div className="grid-2" style={{ marginBottom: 24 }}>

                {/* Today's Live Forecast Chart */}
                <div className="glass-card" style={{ border: '1px solid rgba(251,191,36,0.2)' }}>
                    <div className="section-header">
                        <div>
                            <div className="section-title">⚡ Today's Live Forecast</div>
                            <div className="section-subtitle">Hourly solar generation (kWh) — real ML model</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--amber-400)' }}>
                            🌡 {wCtx.temp_max_c ? `${Math.round(wCtx.temp_max_c)}°C` : '—'} · ☁ {wCtx.cloud_cover_pct ? `${Math.round(wCtx.cloud_cover_pct)}%` : '—'}
                        </div>
                    </div>
                    <div style={{ height: 240, marginTop: 8 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={forecast.hourly_curve} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                                <defs>
                                    <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="10%" stopColor="#fbbf24" stopOpacity={0.5} />
                                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} unit=" kWh" />
                                <Tooltip content={<CustomChartTooltip />} />
                                <Area type="monotone" dataKey="kwh" name="Generation"
                                    stroke="#fbbf24" strokeWidth={2.5} fill="url(#sunGrad)"
                                    dot={false} activeDot={{ r: 5, fill: '#fbbf24', stroke: '#0d1628', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Energy budget bar */}
                    <div style={{ marginTop: 18, padding: '12px 0 0', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Today's energy budget — {forecast.predicted_total_kwh} kWh total
                        </div>
                        <div style={{ height: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 7, overflow: 'hidden', display: 'flex' }}>
                            <div title="Self-use" style={{ width: `${(selfUse / forecast.predicted_total_kwh) * 100}%`, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', borderRadius: '7px 0 0 7px' }} />
                            <div title="Sellable surplus" style={{ flex: 1, background: 'linear-gradient(90deg, #fbbf24, #f59e0b)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#a78bfa' }} />
                                Self-use ({selfUse.toFixed(1)} kWh)
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#fbbf24' }} />
                                Sellable ({surplus.toFixed(1)} kWh)
                            </div>
                        </div>
                    </div>
                </div>

                {/* 7-Day Live Outlook */}
                <div className="glass-card">
                    <div className="section-title" style={{ marginBottom: 14 }}>📅 7-Day Live Outlook</div>
                    {weekly.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '20px 0' }}>Loading forecast...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {weekly.map((day, i) => (
                                <div key={day.day} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                                    background: i === 0 ? 'rgba(251,191,36,0.07)' : 'rgba(255,255,255,0.02)',
                                    border: i === 0 ? '1px solid rgba(251,191,36,0.2)' : '1px solid transparent',
                                }}>
                                    <div style={{ width: 48, fontSize: '0.72rem', fontWeight: 600, color: i === 0 ? 'var(--amber-400)' : 'var(--text-secondary)' }}>
                                        {day.day}
                                    </div>
                                    <div style={{ fontSize: '1.1rem' }}>{day.icon}</div>
                                    <div style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{day.weather}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{day.temp}°C</div>
                                    <div style={{ width: 60, textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: day.predicted > 30 ? 'var(--amber-400)' : day.predicted > 10 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                            {day.predicted} kWh
                                        </div>
                                    </div>
                                    <div style={{ width: 48, height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.min(100, (day.predicted / (weekly.reduce((a, b) => Math.max(a, b.predicted), 1))) * 100)}%`,
                                            background: day.predicted > 30 ? '#fbbf24' : day.predicted > 10 ? '#2dd4bf' : '#6b7280',
                                            borderRadius: 3,
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
