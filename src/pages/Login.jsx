import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IoFlash, IoLeafOutline, IoShieldCheckmarkOutline, IoEyeOutline, IoEyeOffOutline, IoClose } from 'react-icons/io5';
import { useAuthStore } from '../utils/useAuth';
import { useApi } from '../utils/useApi';
import './Login.css';

// ── Social provider config ────────────────────────────────────────────────────
const SOCIAL_PROVIDERS = [
    {
        id: 'google',
        label: 'Google',
        bg: '#fff',
        color: '#3c4043',
        border: 'rgba(0,0,0,0.2)',
        logo: (
            <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
        ),
    },
    {
        id: 'github',
        label: 'GitHub',
        bg: '#24292f',
        color: '#fff',
        border: 'transparent',
        logo: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
        ),
    },
    {
        id: 'apple',
        label: 'Apple',
        bg: '#000',
        color: '#fff',
        border: 'transparent',
        logo: (
            <svg width="18" height="18" viewBox="0 0 814 1000" fill="white">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.7C46.7 790.7 0 663 0 541.8c0-207.1 135.4-316.6 269.1-316.6 70.6 0 129.5 46.4 173.5 46.4 42.7 0 109.6-49.3 186.7-49.3zm-56.7-165.8c32.8-39.1 56.1-93.4 56.1-147.7 0-7.7-.6-15.4-1.9-22.4-52.6 1.9-114.7 35.2-152.8 79.1-29.9 33.8-57.1 88.1-57.1 143.1 0 8.3 1.3 16.6 1.9 19.2 3.2.6 8.4 1.3 13.6 1.3 47.1 0 106.1-31.6 140.2-72.6z" />
            </svg>
        ),
    },
];

// ── Divider ───────────────────────────────────────────────────────────────────
function OrDivider() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>OR CONTINUE WITH</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [socialLoading, setSocialLoading] = useState(''); // provider id

    const { setAuth } = useAuthStore();
    const { request, loading } = useApi();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const formData = new URLSearchParams();
            formData.append('username', email.trim().toLowerCase());
            formData.append('password', password);

            const result = await request('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            if (isAdmin && !result.is_admin) {
                return setError('This account does not have admin privileges.');
            }
            if (!isAdmin && result.is_admin) {
                return setError('Please use the Admin tab to sign in.');
            }

            setAuth({ id: result.user_id, name: result.name, is_admin: result.is_admin, email: email.trim().toLowerCase() }, result.access_token);
            navigate(result.is_admin ? '/admin' : '/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        }
    };

    const handleSocialLogin = (providerId) => {
        setError('Social login is disabled in this demo sandbox.');
    };

    return (
        <div className="login-page">
            <div className="login-bg-orb login-bg-orb-1" />
            <div className="login-bg-orb login-bg-orb-2" />
            <div className="login-bg-orb login-bg-orb-3" />

            <div className="login-container">
                {/* ── Left: Hero panel ── */}
                <div className="login-hero">
                    <div className="hero-brand">
                        <div className="hero-logo"><IoFlash /></div>
                        <span className="hero-name">Q-Trade</span>
                    </div>
                    <div className="hero-main">
                        <div className="login-sdg-badge">
                            🌍 Aligned with UN SDG 7 · Affordable &amp; Clean Energy
                        </div>
                        <h1 className="hero-headline">
                            Your Neighborhood.<br />
                            <span className="hero-highlight">Your Energy Grid.</span>
                        </h1>
                        <p className="hero-desc">
                            Trade solar energy directly with your neighbors using AI-powered
                            forecasting and quantum-optimized matching. Keep it local. Keep it green.
                        </p>
                        <div className="hero-features">
                            <div className="hero-feature"><IoLeafOutline /><span>Zero transmission waste — shortest local routes</span></div>
                            <div className="hero-feature"><IoFlash /><span>SunSync AI forecasts your solar generation daily</span></div>
                            <div className="hero-feature"><IoShieldCheckmarkOutline /><span>QAOA quantum engine matches buyers &amp; sellers optimally</span></div>
                        </div>
                    </div>
                    <div className="hero-stats-row">
                        <div className="hero-stat"><div className="hero-stat-value">4,280</div><div className="hero-stat-label">kWh Traded</div></div>
                        <div className="hero-stat"><div className="hero-stat-value">1,926 kg</div><div className="hero-stat-label">CO₂ Avoided</div></div>
                        <div className="hero-stat"><div className="hero-stat-value">127</div><div className="hero-stat-label">Households</div></div>
                    </div>
                </div>

                {/* ── Right: Login form ── */}
                <div className="login-form-panel">
                    <div className="login-card glass-card">
                        <h2 className="login-title">Welcome back</h2>
                        <p className="login-subtitle">Sign in to your energy wallet</p>

                        <div className="login-role-toggle">
                            <button type="button" className={`role-toggle-btn ${!isAdmin ? 'active' : ''}`}
                                onClick={() => { setIsAdmin(false); setError(''); }}>Resident</button>
                            <button type="button" className={`role-toggle-btn ${isAdmin ? 'active' : ''}`}
                                onClick={() => { setIsAdmin(true); setError(''); }}>Admin</button>
                        </div>

                        {/* Social sign-in buttons */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                            {SOCIAL_PROVIDERS.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    disabled={!!socialLoading}
                                    onClick={() => handleSocialLogin(p.id)}
                                    title={`Sign in with ${p.label}`}
                                    style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: 7, padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                                        background: p.bg, color: p.color,
                                        border: `1px solid ${p.border}`,
                                        cursor: socialLoading ? 'wait' : 'pointer',
                                        fontFamily: 'var(--font)', fontWeight: 600, fontSize: '0.8rem',
                                        opacity: socialLoading && socialLoading !== p.id ? 0.5 : 1,
                                        transition: 'all 0.2s ease',
                                        position: 'relative', overflow: 'hidden',
                                    }}
                                    onMouseEnter={e => { if (!socialLoading) e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                                >
                                    {socialLoading === p.id ? (
                                        <div style={{
                                            width: 16, height: 16, borderRadius: '50%',
                                            border: `2px solid ${p.color}40`,
                                            borderTopColor: p.color,
                                            animation: 'spin 0.7s linear infinite',
                                        }} />
                                    ) : p.logo}
                                    <span>{socialLoading === p.id ? 'Connecting…' : p.label}</span>
                                </button>
                            ))}
                        </div>

                        <OrDivider />

                        {error && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
                                borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 14,
                                color: '#f87171', fontSize: '0.82rem', fontWeight: 500,
                            }}>
                                <IoClose style={{ flexShrink: 0 }} /> {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="login-form-body">
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input type="email" className="form-input" placeholder="you@neighborhood.com"
                                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showPw ? 'text' : 'password'} className="form-input"
                                        placeholder="••••••••" value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ paddingRight: 40 }} required />
                                    <button type="button" onClick={() => setShowPw(v => !v)} style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem',
                                    }}>{showPw ? <IoEyeOffOutline /> : <IoEyeOutline />}</button>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg"
                                style={{ width: '100%', marginTop: 8, opacity: loading ? 0.7 : 1 }} disabled={loading || !!socialLoading}>
                                <IoFlash /> {loading ? 'Signing in…' : 'Sign In'}
                            </button>
                        </form>

                        <div className="login-demo-hint" style={{ textAlign: 'left', lineHeight: 1.8 }}>
                            <strong>Demo accounts (Live DB):</strong><br />
                            Resident: <code>user@qtrade.test</code> / <code>password123</code><br />
                            Admin: <code>admin@qtrade.test</code> / <code>admin1234</code><br />
                            <em>(If no accounts exist, please use Register first)</em>
                        </div>

                        <div style={{ marginTop: 16, textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Don't have an account?{' '}
                            <Link to="/register" style={{ color: 'var(--teal-400)', fontWeight: 600, textDecoration: 'none' }}>
                                Create one →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spin keyframe */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
