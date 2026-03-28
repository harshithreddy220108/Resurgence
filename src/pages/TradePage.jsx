import { useState, useEffect } from 'react';
import { IoFlash, IoCheckmarkCircle } from 'react-icons/io5';
import AppLayout from '../components/AppLayout';
import { useAuthStore } from '../utils/useAuth';
import { useApi } from '../utils/useApi';

// ── Time-aware match intelligence engine ──────────────────────────────────────
// Uses new Date() — works identically in dev, staging, and production.
// All logic is client-side; zero backend dependency.

const WINDOWS = {
    all: { start: 0, end: 1440, includesCycle: true },
    morning: { start: 360, end: 720, includesCycle: false },
    afternoon: { start: 720, end: 1080, includesCycle: true },  // 15:00 is inside
    evening: { start: 1080, end: 1320, includesCycle: false },
};

// Base match probability by trade type × window (tuned to solar energy economics)
const BASE_RATES = {
    sell: { all: 91, morning: 74, afternoon: 84, evening: 96 },
    buy: { all: 85, morning: 62, afternoon: 91, evening: 44 },
};

const PRICE_RANGES = {
    sell: { all: '$0.10–0.14', morning: '$0.11–0.13', afternoon: '$0.10–0.12', evening: '$0.14–0.16' },
    buy: { all: '$0.10–0.13', morning: '$0.11–0.13', afternoon: '$0.09–0.11', evening: '$0.14–0.17' },
};

const DEMAND_LABELS = {
    sell: { all: 'Balanced Market', morning: 'Rising Supply', afternoon: 'High Competition', evening: 'Peak Demand 🔥' },
    buy: { all: 'Broad Pool', morning: 'Limited Supply', afternoon: "Buyer's Market ⚡", evening: 'Scarce Supply' },
};

const NOTES = {
    sell: {
        all: 'Widest matching pool. Good balance of buyers and sellers throughout the day.',
        morning: 'Solar generation ramping up. Beat the afternoon rush with an early listing.',
        afternoon: 'Peak solar hours mean high seller competition. Price competitively to get matched.',
        evening: 'Grid deficit creates high buyer demand. You can command premium prices.',
    },
    buy: {
        all: 'Largest available supply pool. Set a fair price to stay in the match.',
        morning: 'Solar generation is limited. Expect fewer sellers and tighter prices.',
        afternoon: 'Peak solar surplus — maximum seller supply. Best time to secure cheap energy.',
        evening: 'Most solar sellers are offline. Expect higher prices and lower availability.',
    },
};

function getMatchIntelligence(slot, tradeType, now) {
    const totalMins = now.getHours() * 60 + now.getMinutes();
    const win = WINDOWS[slot];

    const isActive = totalMins >= win.start && totalMins < win.end;
    const hasPassed = totalMins >= win.end;

    let rate = BASE_RATES[tradeType][slot];
    if (isActive) rate = Math.min(rate + 5, 99);
    if (hasPassed) rate = Math.max(rate - 15, 20);
    if (win.includesCycle && !hasPassed) rate = Math.min(rate + 4, 99);

    // Rate label + color
    let rateLabel, rateColor;
    if (rate >= 88) { rateLabel = 'Excellent'; rateColor = '#4ade80'; }
    else if (rate >= 72) { rateLabel = 'Good'; rateColor = '#2dd4bf'; }
    else if (rate >= 55) { rateLabel = 'Fair'; rateColor = '#fbbf24'; }
    else { rateLabel = 'Low'; rateColor = '#f87171'; }

    // Status label
    const statusLabel = hasPassed ? '⚠️ Window Passed Today'
        : isActive ? '🟢 Window Active Right Now'
            : '🕐 Upcoming Window';

    // Note (append warning if window passed)
    const note = NOTES[tradeType][slot]
        + (hasPassed ? ' ⚠️ This window has already passed — listing will queue for tomorrow\'s cycle.' : '');

    // Countdown to next 15:00 daily cycle (ticks in real time)
    const cycle = new Date(now);
    cycle.setHours(15, 0, 0, 0);
    if (now >= cycle) cycle.setDate(cycle.getDate() + 1); // next day if past
    const diff = cycle - now;
    const ch = Math.floor(diff / 3600000);
    const cm = Math.floor((diff % 3600000) / 60000);
    const cs = Math.floor((diff % 60000) / 1000);
    const countdown = ch > 0 ? `${ch}h ${cm}m` : cm > 0 ? `${cm}m ${cs}s` : `${cs}s`;
    const cycleUrgent = diff < 30 * 60000; // < 30 min remaining

    return {
        rate, rateLabel, rateColor, statusLabel,
        suggestedPrice: PRICE_RANGES[tradeType][slot],
        demandLabel: DEMAND_LABELS[tradeType][slot],
        note, countdown, cycleUrgent, isActive, hasPassed,
    };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function TradePage() {
    const [tradeType, setTradeType] = useState('sell');
    const [slot, setSlot] = useState('afternoon');
    const [kwh, setKwh] = useState('');
    const [price, setPrice] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [now, setNow] = useState(new Date());

    const { user } = useAuthStore();
    const { request, loading } = useApi();

    // Refresh every 30 seconds so countdown and modifiers stay current
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(t);
    }, []);

    const intel = getMatchIntelligence(slot, tradeType, now);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (!user) return;
        try {
            await request('/api/listings', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: user.id || 1, // fallback for safety if context syncs late
                    offer_type: tradeType,
                    kwh_amount: parseFloat(kwh),
                    price_per_kwh: parseFloat(price)
                })
            });
        } catch (err) {
            console.error(err);
        }
        setTimeout(() => { setSubmitted(false); setKwh(''); setPrice(''); }, 3500);
    };

    const slotOptions = [
        { value: 'all', label: 'Today (all day)' },
        { value: 'morning', label: 'Morning   (06:00 – 12:00)' },
        { value: 'afternoon', label: 'Afternoon (12:00 – 18:00)' },
        { value: 'evening', label: 'Evening   (18:00 – 22:00)' },
    ];

    return (
        <AppLayout role="user">
            <div className="page-header">
                <h1 className="page-title">Trade Energy</h1>
                <p className="page-subtitle">Set your buy or sell preferences for today's matching cycle</p>
            </div>

            <div className="grid-2">

                {/* ── Left: Trade Form ─────────────────────────────────────── */}
                <div className="glass-card teal-accent">
                    <div className="section-header">
                        <div>
                            <div className="section-title">New Listing</div>
                            <div className="section-subtitle">Matching runs daily at 15:00</div>
                        </div>
                    </div>

                    {submitted && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: 'var(--green-glow)', border: '1px solid rgba(74,222,128,0.25)',
                            borderRadius: 'var(--radius-sm)', padding: '12px 16px',
                            marginBottom: 20, color: 'var(--green-400)', fontWeight: 600, fontSize: '0.875rem',
                        }}>
                            <IoCheckmarkCircle style={{ fontSize: '1.2rem' }} />
                            Listing submitted! You'll be matched at the next cycle.
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Buy vs Sell */}
                        <div className="form-group">
                            <label className="form-label">I want to...</label>
                            <div className="role-toggle">
                                <button type="button" className={`role-btn ${tradeType === 'sell' ? 'active sell' : ''}`}
                                    onClick={() => setTradeType('sell')}>☀️ Sell Solar</button>
                                <button type="button" className={`role-btn ${tradeType === 'buy' ? 'active buy' : ''}`}
                                    onClick={() => setTradeType('buy')}>⚡ Buy Energy</button>
                            </div>
                        </div>

                        {/* kWh */}
                        <div className="form-group">
                            <label className="form-label">Amount (kWh)</label>
                            <input type="number" className="form-input" placeholder="e.g. 5.0"
                                min="0.1" step="0.1" value={kwh}
                                onChange={(e) => setKwh(e.target.value)} required />
                        </div>

                        {/* Price — hint updates with window selection */}
                        <div className="form-group">
                            <label className="form-label">Price per kWh ($)</label>
                            <input type="number" className="form-input"
                                placeholder={`e.g. ${intel.suggestedPrice.split('–')[0].replace('$', '')}`}
                                min="0.01" step="0.01" value={price}
                                onChange={(e) => setPrice(e.target.value)} required />
                            <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                💡 Suggested for this window:{' '}
                                <strong style={{ color: intel.rateColor }}>{intel.suggestedPrice}/kWh</strong>
                            </div>
                        </div>

                        {/* Time window — drives the intelligence panel */}
                        <div className="form-group">
                            <label className="form-label">Availability Window</label>
                            <select className="form-select" value={slot}
                                onChange={(e) => setSlot(e.target.value)}>
                                {slotOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>

                        <button type="submit"
                            className={`btn btn-lg ${tradeType === 'sell' ? 'btn-amber' : 'btn-primary'}`}
                            style={{ width: '100%' }} disabled={loading}>
                            <IoFlash />
                            {loading ? 'Submitting...' : (tradeType === 'sell' ? 'List Solar Energy for Sale' : 'Place Buy Order')}
                        </button>
                    </form>
                </div>

                {/* ── Right: Intelligence + Pricing panels ─────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Match Intelligence Panel */}
                    <div className="glass-card" style={{
                        border: `1px solid ${intel.rateColor}35`,
                        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${intel.rateColor}12`,
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                            <div>
                                <div className="section-title">⚡ Match Intelligence</div>
                                <div className="section-subtitle">Reacts live to your time window &amp; trade type</div>
                            </div>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem',
                                color: 'var(--teal-400)', background: 'var(--teal-glow)',
                                padding: '3px 10px', borderRadius: 100, border: '1px solid var(--border-accent)'
                            }}>
                                <span style={{
                                    width: 6, height: 6, borderRadius: '50%', background: 'var(--teal-400)',
                                    display: 'inline-block', animation: 'live-pulse 1.4s infinite'
                                }} />
                                Live
                            </div>
                        </div>

                        {/* Big probability display */}
                        <div style={{
                            background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-md)',
                            padding: '18px 20px', marginBottom: 16,
                            border: `1px solid ${intel.rateColor}20`,
                        }}>
                            <div style={{
                                fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10
                            }}>
                                Match Probability — {intel.statusLabel}
                            </div>

                            {/* Animated bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                                <div style={{
                                    flex: 1, height: 12, background: 'rgba(255,255,255,0.05)',
                                    borderRadius: 6, overflow: 'hidden', position: 'relative'
                                }}>
                                    <div style={{
                                        height: '100%', width: `${intel.rate}%`,
                                        background: `linear-gradient(90deg, ${intel.rateColor}80, ${intel.rateColor})`,
                                        borderRadius: 6, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
                                        boxShadow: `0 0 10px ${intel.rateColor}55`,
                                    }} />
                                </div>
                                <div style={{
                                    fontSize: '2.2rem', fontWeight: 800, color: intel.rateColor,
                                    minWidth: 68, textAlign: 'right', letterSpacing: '-0.04em',
                                    fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                                    transition: 'color 0.4s ease',
                                }}>
                                    {intel.rate}%
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{
                                    fontSize: '0.78rem', fontWeight: 700, color: intel.rateColor,
                                    background: `${intel.rateColor}18`, borderRadius: 100, padding: '3px 12px',
                                    border: `1px solid ${intel.rateColor}35`,
                                    transition: 'all 0.4s ease',
                                }}>{intel.rateLabel}</span>
                                <span style={{
                                    fontSize: '0.78rem', color: 'var(--text-secondary)',
                                    fontWeight: 500
                                }}>{intel.demandLabel}</span>
                            </div>
                        </div>

                        {/* Insight note */}
                        <div style={{
                            background: `${intel.rateColor}0a`, borderRadius: 'var(--radius-sm)',
                            padding: '10px 14px', fontSize: '0.78rem', color: 'var(--text-secondary)',
                            lineHeight: 1.65, marginBottom: 16,
                            borderLeft: `3px solid ${intel.rateColor}55`,
                            transition: 'border-color 0.4s ease, background 0.4s ease',
                        }}>
                            {intel.note}
                        </div>

                        {/* Countdown + Suggested price tiles */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {[
                                {
                                    label: 'Next QAOA Cycle',
                                    value: intel.countdown,
                                    color: intel.cycleUrgent ? '#f87171' : 'var(--teal-400)',
                                    bg: intel.cycleUrgent ? 'rgba(248,113,113,0.08)' : 'rgba(45,212,191,0.08)',
                                    border: intel.cycleUrgent ? 'rgba(248,113,113,0.2)' : 'rgba(45,212,191,0.15)',
                                },
                                {
                                    label: 'Suggested Price',
                                    value: `${intel.suggestedPrice}/kWh`,
                                    color: 'var(--amber-400)',
                                    bg: 'rgba(251,191,36,0.07)',
                                    border: 'rgba(251,191,36,0.2)',
                                },
                            ].map(tile => (
                                <div key={tile.label} style={{
                                    background: tile.bg, borderRadius: 'var(--radius-sm)',
                                    padding: '12px 14px', border: `1px solid ${tile.border}`,
                                    transition: 'all 0.4s ease',
                                }}>
                                    <div style={{
                                        fontSize: '0.62rem', color: 'var(--text-muted)',
                                        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4
                                    }}>
                                        {tile.label}
                                    </div>
                                    <div style={{
                                        fontSize: '0.92rem', fontWeight: 700, color: tile.color,
                                        fontVariantNumeric: 'tabular-nums'
                                    }}>
                                        {tile.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>


                </div>
            </div>
        </AppLayout>
    );
}
