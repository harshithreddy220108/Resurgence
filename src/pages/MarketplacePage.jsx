import { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { IoFlash, IoTrendingUp, IoTrendingDown, IoCheckmarkCircle } from 'react-icons/io5';
import AppLayout from '../components/AppLayout';
import { useApi } from '../utils/useApi';

// ── Mock market data ─────────────────────────────────────────────────────────

// 24-hour price history (minute-level mock, sampled every ~2h)
const priceHistory = [
    { time: '08:00', price: 0.108 }, { time: '09:00', price: 0.111 },
    { time: '10:00', price: 0.114 }, { time: '11:00', price: 0.116 },
    { time: '12:00', price: 0.120 }, { time: '13:00', price: 0.118 },
    { time: '14:00', price: 0.121 }, { time: '15:00', price: 0.119 },
    { time: '15:50', price: 0.118 },
];

const PriceTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.75rem' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                <div style={{ color: '#2dd4bf', fontWeight: 700 }}>${payload[0].value}/kWh</div>
            </div>
        );
    }
    return null;
};


// ── Stepper button style ──────────────────────────────────────────────────────
const stepBtnStyle = (accentColor, isRight = false) => ({
    width: 44, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.3rem', fontWeight: 300, lineHeight: 1,
    background: `${accentColor}18`,
    color: accentColor,
    border: 'none',
    borderRight: isRight ? 'none' : '1px solid var(--border)',
    borderLeft: isRight ? '1px solid var(--border)' : 'none',
    cursor: 'pointer',
    transition: 'background 0.15s ease, color 0.15s ease',
    fontFamily: 'monospace',
    userSelect: 'none',
});

// ─────────────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
    const [orderType, setOrderType] = useState('buy');
    const [bids, setBids] = useState([]);
    const [asks, setAsks] = useState([]);
    const [recentTrades, setRecentTrades] = useState([]);
    const [loading, setLoading] = useState(true);

    const [kwh, setKwh] = useState(1.0);
    const [price, setPrice] = useState(0.12);
    const [submitted, setSubmitted] = useState(false);
    const [flash, setFlash] = useState(null);
    const { request } = useApi();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [optimizing, setOptimizing] = useState(false);

    // Dynamics from live data
    const BEST_BID = bids.length > 0 ? Math.max(...bids.map(b => b.price)) : 0.000;
    const BEST_ASK = asks.length > 0 ? Math.min(...asks.map(a => a.price)) : 0.000;
    const SPREAD = bids.length > 0 && asks.length > 0 ? (BEST_ASK - BEST_BID).toFixed(3) : '0.000';
    const MID_PRICE = bids.length > 0 && asks.length > 0 ? ((BEST_BID + BEST_ASK) / 2).toFixed(4) : '0.0000';
    const MAX_KWH = bids.length > 0 || asks.length > 0 ? Math.max(0.1, ...[...bids, ...asks].map(o => o.kwh)) : 10;

    // Stepper helpers
    const stepKwh = (delta) => setKwh(v => Math.max(0.1, Math.min(50, parseFloat((v + delta).toFixed(1)))));
    const stepPrice = (delta) => setPrice(v => Math.max(0.001, Math.min(1.0, parseFloat((v + delta).toFixed(3)))));


    useEffect(() => {
        async function fetchMarket() {
            try {
                const [listRes, txRes] = await Promise.all([
                    request('/api/listings?status=open', { method: 'GET' }),
                    request('/api/transactions?limit=6', { method: 'GET' })
                ]);
                if (listRes) {
                    setBids(listRes.filter(d => d.offer_type === 'buy'));
                    setAsks(listRes.filter(d => d.offer_type === 'sell'));
                    if (listRes.length > 0 && !submitted) setPrice(Math.max(...listRes.filter(d => d.offer_type === 'buy').map(b => b.price)));
                }
                if (txRes) {
                    setRecentTrades(txRes);
                }
            } catch (err) {
                console.error("Market fetch error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchMarket();
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const clockStr = currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const handleQuickFill = (p, isAsk) => {
        setOrderType(isAsk ? 'buy' : 'sell');
        setPrice(parseFloat(p.toFixed(3)));
        setFlash(p);
        setTimeout(() => setFlash(null), 800);
    };

    const handleOptimize = async () => {
        setOptimizing(true);
        try {
            const res = await request('/api/market/optimize', { method: 'POST' });
            if (res) {
                // Refresh data to show the completed quantum matches
                const [listRes, txRes] = await Promise.all([
                    request('/api/listings?status=open', { method: 'GET' }),
                    request('/api/transactions?limit=6', { method: 'GET' })
                ]);
                if (listRes) {
                    setBids(listRes.filter(d => d.offer_type === 'buy'));
                    setAsks(listRes.filter(d => d.offer_type === 'sell'));
                }
                if (txRes) setRecentTrades(txRes);
            }
        } catch (e) {
            console.error("Optimization failed", e);
        } finally {
            setOptimizing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);
        try {
            await request('/api/listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: "2",
                    offer_type: orderType,
                    kwh_amount: parseFloat(kwh),
                    price_per_kwh: parseFloat(price)
                })
            });
            // Refresh order book
            const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
            const listRes = await fetch(`${API_BASE}/api/listings?status=open`);

            if (listRes.ok) {
                const data = await listRes.json();
                setBids(data.filter(d => d.offer_type === 'buy'));
                setAsks(data.filter(d => d.offer_type === 'sell'));
            }
        } catch (err) {
            console.error(err);
        }
        setTimeout(() => { setSubmitted(false); setKwh(1.0); setPrice(parseFloat(BEST_BID)); }, 3000);
    };

    const totalBidKwh = bids.length > 0 ? bids.reduce((s, b) => s + b.kwh, 0).toFixed(1) : "0.0";
    const totalAskKwh = asks.length > 0 ? asks.reduce((s, a) => s + a.kwh, 0).toFixed(1) : "0.0";
    const depthBidPct = (parseFloat(totalBidKwh) + parseFloat(totalAskKwh)) > 0 ? (totalBidKwh / (parseFloat(totalBidKwh) + parseFloat(totalAskKwh)) * 100).toFixed(0) : "50";

    if (loading) {
        return <AppLayout role="user"><div style={{ padding: 40, color: 'var(--teal-400)' }}>Syncing order book with local microgrid...</div></AppLayout>;
    }

    return (
        <AppLayout role="user">

            {/* ── Page header + market ticker ─────────────────────────── */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: 4 }}>Energy Market</h1>
                        <p className="page-subtitle">Live order book · QAOA cycle at 15:00 daily</p>
                    </div>

                    {/* Live clock + status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <button 
                            onClick={handleOptimize}
                            disabled={optimizing}
                            style={{ 
                                padding: '8px 16px', background: 'var(--teal-glow)', 
                                border: '1px solid var(--teal-400)', color: 'var(--teal-400)', 
                                borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: optimizing ? 'wait' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease',
                                opacity: optimizing ? 0.7 : 1
                            }}>
                            <IoFlash /> {optimizing ? "Running QAOA cycle..." : "Run Quantum Pairing"}
                        </button>
                        <div style={{ fontSize: '0.7rem', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)', fontWeight: 600 }}>{clockStr}</div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 700,
                            color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
                            borderRadius: 100, padding: '4px 12px'
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'live-pulse 1.4s infinite' }} />
                            Market Open
                        </div>
                    </div>
                </div>

                {/* Market ticker stat row */}
                <div style={{ display: 'flex', gap: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginTop: 16 }}>
                    {[
                        { label: 'Mid Price', value: `$${MID_PRICE}/kWh`, color: 'var(--teal-400)', sub: 'current market' },
                        { label: 'Best Bid', value: `$${BEST_BID}/kWh`, color: '#4ade80', sub: 'highest buyer' },
                        { label: 'Best Ask', value: `$${BEST_ASK}/kWh`, color: 'var(--amber-400)', sub: 'lowest seller' },
                        { label: 'Spread', value: `$${SPREAD}`, color: 'var(--text-secondary)', sub: 'bid-ask gap' },
                        { label: 'Open Orders', value: `${bids.length + asks.length}`, color: 'var(--text-primary)', sub: 'bids + asks' },
                        { label: 'Volume 24h', value: '15.5 kWh', color: 'var(--text-primary)', sub: 'traded today' },
                    ].map((item, i, arr) => (
                        <div key={item.label} style={{
                            flex: 1, padding: '12px 18px', textAlign: 'center',
                            borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: '0.96rem', fontWeight: 800, color: item.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{item.value}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.sub}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Main 3-column layout ─────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: 20, marginBottom: 20 }}>

                {/* ── Left: Bid (Buy) Orders ── */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div className="section-title" style={{ color: '#4ade80', marginBottom: 2 }}>🟢 Buy Orders (Bids)</div>
                            <div className="section-subtitle">{totalBidKwh} kWh total demand</div>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#4ade80' }}>{bids.length} open</span>
                    </div>

                    {/* Column headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 60px', padding: '8px 18px', background: 'rgba(0,0,0,0.15)' }}>
                        {['Neighbor', 'kWh', 'Price', 'Time'].map(h => (
                            <div key={h} style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
                        ))}
                    </div>

                    {bids.map((bid, i) => (
                        <div key={bid.id}
                            onClick={() => handleQuickFill(bid.price, false)}
                            style={{
                                display: 'grid', gridTemplateColumns: '1fr 80px 70px 60px',
                                padding: '10px 18px', cursor: 'pointer',
                                background: flash === bid.price ? 'rgba(74,222,128,0.15)' : i % 2 === 0 ? 'rgba(0,0,0,0.08)' : 'transparent',
                                transition: 'background 0.3s ease', position: 'relative',
                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,222,128,0.06)'}
                            onMouseLeave={e => e.currentTarget.style.background = flash === bid.price ? 'rgba(74,222,128,0.15)' : i % 2 === 0 ? 'rgba(0,0,0,0.08)' : 'transparent'}
                        >
                            {/* Depth bar */}
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(bid.kwh / MAX_KWH) * 80}%`, background: 'rgba(74,222,128,0.06)', pointerEvents: 'none' }} />
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, zIndex: 1, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{bid.neighbor}</span>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', zIndex: 1 }}>{bid.kwh}</span>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#4ade80', zIndex: 1 }}>${bid.price.toFixed(3)}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', zIndex: 1 }}>{bid.time}</span>
                        </div>
                    ))}

                    <div style={{ padding: '10px 18px', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                        Click any row to sell to this buyer
                    </div>
                </div>

                {/* ── Right: Ask (Sell) Orders ── */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div className="section-title" style={{ color: 'var(--amber-400)', marginBottom: 2 }}>🟡 Sell Orders (Asks)</div>
                            <div className="section-subtitle">{totalAskKwh} kWh total supply</div>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--amber-400)' }}>{asks.length} open</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 60px', padding: '8px 18px', background: 'rgba(0,0,0,0.15)' }}>
                        {['Neighbor', 'kWh', 'Price', 'Time'].map(h => (
                            <div key={h} style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
                        ))}
                    </div>

                    {asks.map((ask, i) => (
                        <div key={ask.id}
                            onClick={() => handleQuickFill(ask.price, true)}
                            style={{
                                display: 'grid', gridTemplateColumns: '1fr 80px 70px 60px',
                                padding: '10px 18px', cursor: 'pointer',
                                background: flash === ask.price ? 'rgba(251,191,36,0.15)' : i % 2 === 0 ? 'rgba(0,0,0,0.08)' : 'transparent',
                                transition: 'background 0.3s ease', position: 'relative',
                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,191,36,0.07)'}
                            onMouseLeave={e => e.currentTarget.style.background = flash === ask.price ? 'rgba(251,191,36,0.15)' : i % 2 === 0 ? 'rgba(0,0,0,0.08)' : 'transparent'}
                        >
                            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${(ask.kwh / MAX_KWH) * 80}%`, background: 'rgba(251,191,36,0.05)', pointerEvents: 'none' }} />
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, zIndex: 1, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{ask.neighbor}</span>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', zIndex: 1 }}>{ask.kwh}</span>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--amber-400)', zIndex: 1 }}>${ask.price.toFixed(3)}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', zIndex: 1 }}>{ask.time}</span>
                        </div>
                    ))}

                    <div style={{ padding: '10px 18px', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                        Click any row to buy from this seller
                    </div>
                </div>

                {/* ── Right column: Quick order + spread ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Spread indicator */}
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', padding: '16px 18px',
                    }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>Market Depth</div>
                        {/* Depth bar */}
                        <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex', marginBottom: 8 }}>
                            <div style={{ width: `${depthBidPct}%`, background: 'linear-gradient(90deg, #166534, #4ade80)', borderRadius: '5px 0 0 5px' }} />
                            <div style={{ flex: 1, background: 'linear-gradient(90deg, #92400e, #fbbf24)', borderRadius: '0 5px 5px 0' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                            <span style={{ color: '#4ade80', fontWeight: 600 }}>🟢 {depthBidPct}% demand</span>
                            <span style={{ color: 'var(--amber-400)', fontWeight: 600 }}>{100 - parseInt(depthBidPct)}% supply 🟡</span>
                        </div>
                        <div style={{ marginTop: 10, textAlign: 'center', padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Bid-Ask Spread</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>${SPREAD}</div>
                        </div>
                    </div>

                    {/* Quick order form */}
                    <div className="glass-card teal-accent" style={{ flex: 1 }}>
                        <div className="section-title" style={{ marginBottom: 14 }}>⚡ Quick Order</div>

                        {submitted && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--green-glow)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 14, color: '#4ade80', fontWeight: 600, fontSize: '0.82rem' }}>
                                <IoCheckmarkCircle /> Order placed! Queued for 15:00 cycle.
                            </div>
                        )}

                        {/* Buy / Sell toggle */}
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 3, gap: 3, marginBottom: 14 }}>
                            {[{ key: 'buy', label: '⚡ Buy', color: '#4ade80' }, { key: 'sell', label: '☀️ Sell', color: 'var(--amber-400)' }].map(opt => (
                                <button key={opt.key} type="button"
                                    onClick={() => setOrderType(opt.key)}
                                    style={{
                                        flex: 1, padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                                        fontWeight: 700, fontSize: '0.82rem', fontFamily: 'var(--font)',
                                        background: orderType === opt.key ? opt.color + '22' : 'transparent',
                                        color: orderType === opt.key ? opt.color : 'var(--text-secondary)',
                                        boxShadow: orderType === opt.key ? `0 0 0 1px ${opt.color}40` : 'none',
                                        transition: 'all 0.2s ease',
                                    }}>{opt.label}</button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                            {/* kWh stepper */}
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Amount (kWh)</label>
                                <div style={{
                                    display: 'flex', alignItems: 'stretch', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                                    background: 'rgba(255,255,255,0.04)',
                                }}>
                                    <button type="button" onClick={() => stepKwh(-0.5)}
                                        style={stepBtnStyle(orderType === 'buy' ? '#4ade80' : '#fbbf24')}>
                                        −
                                    </button>
                                    <div style={{
                                        flex: 1, display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center', padding: '8px 4px',
                                        cursor: 'default', userSelect: 'none',
                                    }}>
                                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                                            {kwh.toFixed(1)}
                                        </div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>kWh</div>
                                    </div>
                                    <button type="button" onClick={() => stepKwh(+0.5)}
                                        style={stepBtnStyle(orderType === 'buy' ? '#4ade80' : '#fbbf24', true)}>
                                        +
                                    </button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                    {[0.5, 1, 2, 5, 10].map(v => (
                                        <button key={v} type="button" onClick={() => setKwh(v)}
                                            style={{
                                                fontSize: '0.62rem', padding: '2px 7px', borderRadius: 100,
                                                background: kwh === v ? 'rgba(45,212,191,0.18)' : 'rgba(255,255,255,0.05)',
                                                color: kwh === v ? 'var(--teal-400)' : 'var(--text-muted)',
                                                border: kwh === v ? '1px solid rgba(45,212,191,0.35)' : '1px solid transparent',
                                                cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600,
                                                transition: 'all 0.15s ease',
                                            }}>{v}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Price stepper */}
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Limit Price ($/kWh)</label>
                                <div style={{
                                    display: 'flex', alignItems: 'stretch', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                                    background: 'rgba(255,255,255,0.04)',
                                }}>
                                    <button type="button" onClick={() => stepPrice(-0.001)}
                                        style={stepBtnStyle(orderType === 'buy' ? '#4ade80' : '#fbbf24')}>
                                        −
                                    </button>
                                    <div style={{
                                        flex: 1, display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center', padding: '8px 4px',
                                        cursor: 'default', userSelect: 'none',
                                    }}>
                                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: orderType === 'buy' ? '#4ade80' : '#fbbf24', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                                            ${price.toFixed(3)}
                                        </div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>per kWh</div>
                                    </div>
                                    <button type="button" onClick={() => stepPrice(+0.001)}
                                        style={stepBtnStyle(orderType === 'buy' ? '#4ade80' : '#fbbf24', true)}>
                                        +
                                    </button>
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                    {orderType === 'buy'
                                        ? `Best ask: $${BEST_ASK} · Click any ask row to auto-fill`
                                        : `Best bid: $${BEST_BID} · Click any bid row to auto-fill`}
                                </div>
                            </div>
                            {/* Order summary */}
                            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '0.78rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Order value</span>
                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${(kwh * price).toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>vs. retail grid</span>
                                    <span style={{ fontWeight: 700, color: '#4ade80' }}>Save ${((0.18 - price) * kwh).toFixed(2)}</span>
                                </div>
                            </div>
                            <button type="submit"
                                style={{
                                    padding: '11px', borderRadius: 'var(--radius-sm)', fontWeight: 700,
                                    fontSize: '0.875rem', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                                    background: orderType === 'buy'
                                        ? 'linear-gradient(135deg, #15803d, #4ade80)'
                                        : 'linear-gradient(135deg, #b45309, #fbbf24)',
                                    color: '#fff',
                                    boxShadow: orderType === 'buy' ? '0 4px 16px rgba(74,222,128,0.3)' : '0 4px 16px rgba(251,191,36,0.3)',
                                    transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                }}>
                                <IoFlash />
                                {orderType === 'buy' ? 'Place Buy Order' : 'List Solar for Sale'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* ── Bottom: Price chart + Recent trades ──────────────────── */}
            <div className="grid-2">

                {/* Price chart */}
                <div className="glass-card">
                    <div className="section-header">
                        <div>
                            <div className="section-title">📈 Price History — Today</div>
                            <div className="section-subtitle">Avg trade price per hour ($/kWh)</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#2dd4bf', fontWeight: 600 }}>
                            <IoTrendingUp /> +9.3% since 08:00
                        </div>
                    </div>
                    <div style={{ height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={priceHistory} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                                <defs>
                                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="10%" stopColor="#2dd4bf" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0.100, 0.140]} tickFormatter={v => `$${v.toFixed(3)}`} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<PriceTooltip />} />
                                <Area type="monotone" dataKey="price" stroke="#2dd4bf" strokeWidth={2.5} fill="url(#priceGrad)" dot={false} activeDot={{ r: 5, fill: '#2dd4bf', stroke: '#0d1628', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent trades tape */}
                <div className="glass-card">
                    <div className="section-header">
                        <div>
                            <div className="section-title">🔄 Recent Matches</div>
                            <div className="section-subtitle">Latest completed trades</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#4ade80' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'live-pulse 1.4s infinite' }} />
                            Live feed
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {/* Header */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 60px 60px', padding: '4px 0', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                            {['Seller → Buyer', '', 'kWh', 'Price'].map(h => (
                                <div key={h} style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
                            ))}
                        </div>
                        {recentTrades.map((t, i) => (
                            <div key={t.id} style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr 60px 60px',
                                padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
                                opacity: 1 - i * 0.12,
                            }}>
                                <span style={{ fontSize: '0.78rem', color: 'var(--amber-400)', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.seller}</span>
                                <span style={{ fontSize: '0.78rem', color: '#4ade80', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>→ {t.buyer}</span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.kwh}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: t.trend === 'up' ? '#4ade80' : '#f87171' }}>${t.price}</span>
                                    {t.trend === 'up' ? <IoTrendingUp size={10} color="#4ade80" /> : <IoTrendingDown size={10} color="#f87171" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
