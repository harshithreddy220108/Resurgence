import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IoFlash, IoLeafOutline, IoEyeOutline, IoEyeOffOutline, IoCheckmark, IoClose } from 'react-icons/io5';
import { useAuthStore } from '../utils/useAuth';
import { useApi } from '../utils/useApi';
import '../pages/Login.css';

// ── Country codes (same list as ProfilePage) ─────────────────────────────────
const COUNTRIES = [
    { code: '+1', flag: '🇺🇸', label: 'US / CA' },
    { code: '+44', flag: '🇬🇧', label: 'UK' },
    { code: '+91', flag: '🇮🇳', label: 'India' },
    { code: '+61', flag: '🇦🇺', label: 'AUS' },
    { code: '+971', flag: '🇦🇪', label: 'UAE' },
    { code: '+65', flag: '🇸🇬', label: 'SGP' },
    { code: '+49', flag: '🇩🇪', label: 'Germany' },
    { code: '+33', flag: '🇫🇷', label: 'France' },
    { code: '+81', flag: '🇯🇵', label: 'Japan' },
    { code: '+86', flag: '🇨🇳', label: 'China' },
    { code: '+55', flag: '🇧🇷', label: 'Brazil' },
    { code: '+27', flag: '🇿🇦', label: 'S Africa' },
    { code: '+92', flag: '🇵🇰', label: 'Pakistan' },
    { code: '+234', flag: '🇳🇬', label: 'Nigeria' },
    { code: '+82', flag: '🇰🇷', label: 'Korea' },
    { code: '+52', flag: '🇲🇽', label: 'Mexico' },
    { code: '+7', flag: '🇷🇺', label: 'Russia' },
    { code: '+39', flag: '🇮🇹', label: 'Italy' },
    { code: '+34', flag: '🇪🇸', label: 'Spain' },
    { code: '+46', flag: '🇸🇪', label: 'Sweden' },
    { code: '+41', flag: '🇨🇭', label: 'Swiss' },
    { code: '+64', flag: '🇳🇿', label: 'NZL' },
];

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pw) {
    const checks = {
        length: pw.length >= 8,
        upper: /[A-Z]/.test(pw),
        lower: /[a-z]/.test(pw),
        number: /\d/.test(pw),
        special: /[^A-Za-z0-9]/.test(pw),
    };
    const score = Object.values(checks).filter(Boolean).length;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
    const colors = ['', '#f87171', '#fbbf24', '#a78bfa', '#4ade80', '#2dd4bf'];
    return { checks, score, label: labels[score] || '', color: colors[score] || '' };
}

// ── Shared social provider config ─────────────────────────────────────────────
const SOCIAL_PROVIDERS = [
    {
        id: 'google', label: 'Google', bg: '#fff', color: '#3c4043', border: 'rgba(0,0,0,0.2)',
        logo: (<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>),
    },
    {
        id: 'github', label: 'GitHub', bg: '#24292f', color: '#fff', border: 'transparent',
        logo: (<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>),
    },
    {
        id: 'apple', label: 'Apple', bg: '#000', color: '#fff', border: 'transparent',
        logo: (<svg width="18" height="18" viewBox="0 0 814 1000" fill="white"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.7C46.7 790.7 0 663 0 541.8c0-207.1 135.4-316.6 269.1-316.6 70.6 0 129.5 46.4 173.5 46.4 42.7 0 109.6-49.3 186.7-49.3zm-56.7-165.8c32.8-39.1 56.1-93.4 56.1-147.7 0-7.7-.6-15.4-1.9-22.4-52.6 1.9-114.7 35.2-152.8 79.1-29.9 33.8-57.1 88.1-57.1 143.1 0 8.3 1.3 16.6 1.9 19.2 3.2.6 8.4 1.3 13.6 1.3 47.1 0 106.1-31.6 140.2-72.6z" /></svg>),
    },
];

function OrDivider() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>OR CONTINUE WITH</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirm: '',
        phone: '', countryCode: '+1', role: 'user',
    });
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const [socialLoading, setSocialLoading] = useState('');

    const handleSocialLogin = (providerId) => {
        setError('');
        setSocialLoading(providerId);
        setTimeout(() => {
            const result = socialLogin(providerId);
            setSocialLoading('');
            if (!result.ok) return setError(result.error);
            navigate('/dashboard');
        }, 1200);
    };

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const strength = getStrength(form.password);
    const passwordsMatch = form.password && form.confirm && form.password === form.confirm;

    const handleStep1 = (e) => {
        e.preventDefault();
        setError('');
        if (!form.name.trim()) return setError('Please enter your full name.');
        if (!form.email.includes('@')) return setError('Please enter a valid email address.');
        if (strength.score < 2) return setError('Choose a stronger password (min 8 chars).');
        if (form.password !== form.confirm) return setError('Passwords do not match.');
        setStep(2);
    };

    const { setAuth } = useAuthStore();
    const { request, loading } = useApi();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const result = await request('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    name: form.name.trim(),
                    email: form.email.trim().toLowerCase(),
                    password: form.password,
                    panel_capacity_kw: 5.0, // Default for demo
                    location_lat: 30.2672,
                    location_lng: -97.7431
                })
            });
            
            setAuth({ id: result.user_id, name: result.name, is_admin: form.role === 'admin', email: form.email.trim().toLowerCase() }, result.access_token);
            navigate(form.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            setError(err.message || 'Registration failed.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg-orb login-bg-orb-1" />
            <div className="login-bg-orb login-bg-orb-2" />
            <div className="login-bg-orb login-bg-orb-3" />

            <div className="login-container">
                {/* ── Left hero (same as login) ── */}
                <div className="login-hero">
                    <div className="hero-brand">
                        <div className="hero-logo"><IoFlash /></div>
                        <span className="hero-name">Q-Trade</span>
                    </div>

                    <div className="hero-main">
                        <div className="login-sdg-badge">🌍 Aligned with UN SDG 7 · Affordable &amp; Clean Energy</div>
                        <h1 className="hero-headline">
                            Join your<br />
                            <span className="hero-highlight">local energy grid.</span>
                        </h1>
                        <p className="hero-desc">
                            Create your Q-Trade account and start trading solar energy
                            directly with your neighbors. Free to join. Zero grid waste.
                        </p>
                        <div className="hero-features">
                            <div className="hero-feature"><IoLeafOutline /><span>Earn from surplus solar you'd otherwise export for nothing</span></div>
                            <div className="hero-feature"><IoFlash /><span>AI forecasts help you list at the perfect time</span></div>
                            <div className="hero-feature"><IoLeafOutline /><span>Every kWh traded locally = less fossil fuel burned</span></div>
                        </div>
                    </div>

                    <div className="hero-stats-row">
                        <div className="hero-stat"><div className="hero-stat-value">4,280</div><div className="hero-stat-label">kWh Traded</div></div>
                        <div className="hero-stat"><div className="hero-stat-value">1,926 kg</div><div className="hero-stat-label">CO₂ Avoided</div></div>
                        <div className="hero-stat"><div className="hero-stat-value">127</div><div className="hero-stat-label">Households</div></div>
                    </div>
                </div>

                {/* ── Right: registration form ── */}
                <div className="login-form-panel">
                    <div className="login-card glass-card">

                        {/* Step indicator */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
                            {[1, 2].map(n => (
                                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: '0.75rem',
                                        background: step >= n ? 'var(--teal-400)' : 'rgba(255,255,255,0.08)',
                                        color: step >= n ? '#fff' : 'var(--text-muted)',
                                        border: step === n ? '2px solid var(--teal-400)' : '2px solid transparent',
                                        boxShadow: step === n ? '0 0 12px rgba(45,212,191,0.4)' : 'none',
                                        transition: 'all 0.25s ease',
                                    }}>{step > n ? <IoCheckmark /> : n}</div>
                                    <span style={{ fontSize: '0.72rem', color: step === n ? 'var(--teal-400)' : 'var(--text-muted)', fontWeight: 600 }}>
                                        {n === 1 ? 'Account' : 'Contact'}
                                    </span>
                                    {n < 2 && <div style={{ width: 30, height: 1, background: step > n ? 'var(--teal-400)' : 'var(--border)' }} />}
                                </div>
                            ))}
                        </div>

                        <h2 className="login-title">{step === 1 ? 'Create account' : 'Contact details'}</h2>
                        <p className="login-subtitle">
                            {step === 1 ? 'Step 1 of 2 — account credentials' : 'Step 2 of 2 — almost there!'}
                        </p>

                        {/* Role toggle (only on step 1) */}
                        {step === 1 && (
                            <div className="login-role-toggle" style={{ marginBottom: 20 }}>
                                <button type="button" className={`role-toggle-btn ${form.role === 'user' ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, role: 'user' }))}>Resident</button>
                                <button type="button" className={`role-toggle-btn ${form.role === 'admin' ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, role: 'admin' }))}>Admin</button>
                            </div>
                        )}

                        {error && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, color: '#f87171', fontSize: '0.82rem', fontWeight: 500 }}>
                                <IoClose style={{ flexShrink: 0 }} /> {error}
                            </div>
                        )}

                        {/* Social sign-up buttons (step 1 only) */}
                        {step === 1 && (
                            <>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                                    {SOCIAL_PROVIDERS.map(p => (
                                        <button key={p.id} type="button" disabled={!!socialLoading}
                                            onClick={() => handleSocialLogin(p.id)}
                                            title={`Sign up with ${p.label}`}
                                            style={{
                                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                gap: 7, padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                                                background: p.bg, color: p.color, border: `1px solid ${p.border}`,
                                                cursor: socialLoading ? 'wait' : 'pointer',
                                                fontFamily: 'var(--font)', fontWeight: 600, fontSize: '0.8rem',
                                                opacity: socialLoading && socialLoading !== p.id ? 0.5 : 1,
                                                transition: 'all 0.2s ease',
                                            }}
                                            onMouseEnter={e => { if (!socialLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'; } }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                                        >
                                            {socialLoading === p.id
                                                ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${p.color}40`, borderTopColor: p.color, animation: 'spin 0.7s linear infinite' }} />
                                                : p.logo}
                                            <span>{socialLoading === p.id ? 'Connecting…' : p.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <OrDivider />
                            </>
                        )}

                        {/* ── Step 1: credentials ── */}
                        {step === 1 && (
                            <form onSubmit={handleStep1} className="login-form-body">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input type="text" className="form-input" placeholder="Alex Johnson" value={form.name} onChange={set('name')} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input type="email" className="form-input" placeholder="you@neighborhood.com" value={form.email} onChange={set('email')} required />
                                </div>

                                {/* Password with eye + strength bar */}
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Password</span>
                                        {form.password && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: strength.color }}>{strength.label}</span>}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showPw ? 'text' : 'password'} className="form-input" placeholder="Min 8 characters"
                                            value={form.password} onChange={set('password')} required style={{ paddingRight: 40 }} />
                                        <button type="button" onClick={() => setShowPw(v => !v)} style={{
                                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem',
                                        }}>{showPw ? <IoEyeOffOutline /> : <IoEyeOutline />}</button>
                                    </div>
                                    {/* Strength bar */}
                                    {form.password && (
                                        <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)', transition: 'background 0.3s ease' }} />
                                            ))}
                                        </div>
                                    )}
                                    {/* Requirement chips */}
                                    {form.password && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                            {[
                                                { key: 'length', label: '8+ chars' },
                                                { key: 'upper', label: 'Uppercase' },
                                                { key: 'number', label: 'Number' },
                                                { key: 'special', label: 'Symbol' },
                                            ].map(r => (
                                                <span key={r.key} style={{
                                                    fontSize: '0.62rem', padding: '2px 8px', borderRadius: 100, fontWeight: 600,
                                                    background: strength.checks[r.key] ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.05)',
                                                    color: strength.checks[r.key] ? '#4ade80' : 'var(--text-muted)',
                                                    border: `1px solid ${strength.checks[r.key] ? 'rgba(74,222,128,0.3)' : 'transparent'}`,
                                                }}>{strength.checks[r.key] ? '✓ ' : ''}{r.label}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Confirm password */}
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Confirm Password</span>
                                        {form.confirm && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: passwordsMatch ? '#4ade80' : '#f87171' }}>
                                            {passwordsMatch ? '✓ Match' : '✗ No match'}
                                        </span>}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showConfirm ? 'text' : 'password'} className="form-input" placeholder="Repeat password"
                                            value={form.confirm} onChange={set('confirm')} required style={{ paddingRight: 40 }} />
                                        <button type="button" onClick={() => setShowConfirm(v => !v)} style={{
                                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem',
                                        }}>{showConfirm ? <IoEyeOffOutline /> : <IoEyeOutline />}</button>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 4 }}>
                                    Continue →
                                </button>
                            </form>
                        )}

                        {/* ── Step 2: contact ── */}
                        {step === 2 && (
                            <form onSubmit={handleSubmit} className="login-form-body">
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <select className="form-select" value={form.countryCode}
                                            onChange={(e) => setForm(f => ({ ...f, countryCode: e.target.value, phone: '' }))}
                                            style={{ width: 130, flexShrink: 0 }}>
                                            {COUNTRIES.map(c => (
                                                <option key={c.code} value={c.code}>{c.flag} {c.code}  {c.label}</option>
                                            ))}
                                        </select>
                                        <input type="tel" className="form-input" placeholder="555 234-5678"
                                            value={form.phone} onChange={set('phone')} />
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(45,212,191,0.05)', border: '1px solid rgba(45,212,191,0.15)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 8, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    <strong style={{ color: 'var(--teal-400)' }}>You're creating a {form.role === 'admin' ? '🛡️ Admin' : '⚡ Resident'} account.</strong><br />
                                    Email: <code style={{ color: 'var(--text-primary)' }}>{form.email}</code>
                                </div>

                                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                    <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>← Back</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                                        <IoFlash /> {loading ? 'Creating...' : 'Create Account'}
                                    </button>
                                </div>
                            </form>
                        )}

                        <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Already have an account?{' '}
                            <Link to="/" style={{ color: 'var(--teal-400)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
