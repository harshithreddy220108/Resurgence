import { useState, useRef, useEffect } from 'react';
import {
    IoCameraOutline, IoSaveOutline, IoCheckmarkCircle,
    IoSunnyOutline, IoNotificationsOutline, IoShieldCheckmarkOutline,
    IoPersonOutline, IoFlash, IoEyeOutline, IoEyeOffOutline, IoClose,
} from 'react-icons/io5';
import AppLayout from '../components/AppLayout';
import { getCurrentUser, updateUser } from '../utils/auth';

const AVATAR_KEY = 'qtrade_avatar';

// ── Per-country phone rules (digit count + format hint) ──────────────────────
const COUNTRY_PHONE_RULES = {
    '+1': { digits: 10, format: 'XXX XXX-XXXX', example: '555 234-5678' },
    '+44': { digits: 10, format: 'XXXX XXX XXXX', example: '7700 900 123' },
    '+91': { digits: 10, format: 'XXXXX XXXXX', example: '98765 43210' },
    '+61': { digits: 9, format: 'XXX XXX XXX', example: '412 345 678' },
    '+971': { digits: 9, format: 'XX XXX XXXX', example: '50 123 4567' },
    '+65': { digits: 8, format: 'XXXX XXXX', example: '8123 4567' },
    '+49': { digits: 11, format: 'XXXXX XXXXXX', example: '01512 3456789' },
    '+33': { digits: 9, format: 'X XX XX XX XX', example: '6 12 34 56 78' },
    '+81': { digits: 10, format: 'XXX XXXX XXXX', example: '90 1234 5678' },
    '+82': { digits: 10, format: 'XXX XXXX XXXX', example: '10 1234 5678' },
    '+86': { digits: 11, format: 'XXX XXXX XXXX', example: '138 1234 5678' },
    '+55': { digits: 11, format: 'XX XXXXX XXXX', example: '11 98765 4321' },
    '+52': { digits: 10, format: 'XX XXXX XXXX', example: '55 1234 5678' },
    '+27': { digits: 9, format: 'XX XXX XXXX', example: '82 123 4567' },
    '+234': { digits: 10, format: 'XXX XXX XXXX', example: '803 123 4567' },
    '+92': { digits: 10, format: 'XXX XXXXXXX', example: '300 1234567' },
    '+880': { digits: 10, format: 'XXXX XXXXXX', example: '1812 345678' },
    '+63': { digits: 10, format: 'XXX XXX XXXX', example: '912 345 6789' },
    '+62': { digits: 10, format: 'XXX XXXX XXXX', example: '812 3456 7890' },
    '+66': { digits: 9, format: 'XX XXX XXXX', example: '81 234 5678' },
    '+7': { digits: 10, format: 'XXX XXX-XX-XX', example: '912 345-67-89' },
    '+39': { digits: 10, format: 'XXX XXX XXXX', example: '312 345 6789' },
    '+34': { digits: 9, format: 'XXX XXX XXX', example: '612 345 678' },
    '+31': { digits: 9, format: 'X XXXXXXXX', example: '6 12345678' },
    '+46': { digits: 9, format: 'XX XXX XXXX', example: '70 123 4567' },
    '+41': { digits: 9, format: 'XX XXX XXXX', example: '78 123 4567' },
    '+64': { digits: 9, format: 'XX XXX XXXX', example: '21 123 4567' },
};

const defaultProfile = {
    name: 'Alex Johnson',
    email: 'alex.johnson@neighborhood.com',
    phone: '555 234-5678',
    countryCode: '+1',
    address: '42 Maple Street, Greenfield',
    bio: 'Solar enthusiast and community energy advocate. Helping our neighborhood cut grid dependence one kWh at a time.',
    // Solar panel config
    panelBrand: 'SunPower',
    panelModel: 'SPR-MAX3-400',
    panelCapacityKw: '8.4',
    installDate: '2024-09-15',
    azimuth: 'South (180°)',
    tilt: '25°',
    // Trading prefs
    defaultWindow: 'afternoon',
    minPrice: '0.09',
    maxPrice: '0.15',
    autoAccept: false,
    // Notifications
    emailMatches: true,
    emailForecast: true,
    emailCommunity: false,
    smsAlerts: true,
};

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ icon, title, subtitle, children, accent }) {
    return (
        <div className={`glass-card ${accent || ''}`} style={{ marginBottom: 20 }}>
            <div className="section-header" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: '1.1rem', color: 'var(--teal-400)' }}>{icon}</div>
                    <div>
                        <div className="section-title">{title}</div>
                        {subtitle && <div className="section-subtitle">{subtitle}</div>}
                    </div>
                </div>
            </div>
            {children}
        </div>
    );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, desc }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                {desc && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
            </div>
            <button type="button" onClick={() => onChange(!checked)} style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: checked ? 'var(--teal-400)' : 'rgba(255,255,255,0.12)',
                position: 'relative', transition: 'background 0.25s ease', flexShrink: 0,
            }}>
                <div style={{
                    position: 'absolute', top: 3, left: checked ? 23 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: 'white',
                    transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const [profile, setProfile] = useState(defaultProfile);
    const [avatar, setAvatar] = useState(() => localStorage.getItem(AVATAR_KEY) || null);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState('personal');
    const fileRef = useRef();

    // Security form state
    const [sec, setSec] = useState({ currentPw: '', newEmail: '', newPw: '', confirmPw: '' });
    const [secShowPw, setSecShowPw] = useState({ current: false, new: false, confirm: false });
    const [secResult, setSecResult] = useState(null); // { ok, msg }

    // Persist avatar to localStorage
    useEffect(() => {
        if (avatar) localStorage.setItem(AVATAR_KEY, avatar);
        else localStorage.removeItem(AVATAR_KEY);
    }, [avatar]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setAvatar(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        // Persist name to localStorage so Navbar can pick it up
        localStorage.setItem('qtrade_profile_name', profile.name);
    };

    const set = (key) => (e) => setProfile(p => ({ ...p, [key]: e.target?.value ?? e }));

    const navSections = [
        { key: 'personal', label: 'Personal Info', icon: <IoPersonOutline /> },
        { key: 'solar', label: 'Solar Panel', icon: <IoSunnyOutline /> },
        { key: 'trading', label: 'Trading Preferences', icon: <IoFlash /> },
        { key: 'notifs', label: 'Notifications', icon: <IoNotificationsOutline /> },
        { key: 'security', label: 'Security', icon: <IoShieldCheckmarkOutline /> },
    ];

    return (
        <AppLayout role="user">
            <div className="page-header">
                <h1 className="page-title">My Profile</h1>
                <p className="page-subtitle">Manage your account, solar config and preferences</p>
            </div>

            {/* ── Profile hero with avatar ─────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(45,212,191,0.08), rgba(139,92,246,0.05))',
                border: '1px solid rgba(45,212,191,0.2)', borderRadius: 'var(--radius-xl)',
                padding: '28px 32px', marginBottom: 28,
                display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap',
            }}>
                {/* Avatar with upload */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                        width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
                        border: '3px solid var(--teal-400)', boxShadow: '0 0 24px rgba(45,212,191,0.35)',
                        background: 'linear-gradient(135deg, var(--teal-600), #1e40af)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', fontWeight: 800, color: 'white',
                    }}>
                        {avatar
                            ? <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : 'AJ'}
                    </div>
                    {/* Upload button */}
                    <button type="button"
                        onClick={() => fileRef.current.click()}
                        title="Change photo"
                        style={{
                            position: 'absolute', bottom: 0, right: 0,
                            width: 30, height: 30, borderRadius: '50%', border: '2px solid var(--bg-primary)',
                            background: 'var(--teal-400)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: '0.85rem', transition: 'transform 0.2s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                        onMouseLeave={e => e.currentTarget.style.transform = ''}>
                        <IoCameraOutline />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={handleAvatarChange} />
                </div>

                {/* Name + stats */}
                <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{profile.name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--teal-400)', fontWeight: 600, marginBottom: 8 }}>Resident · Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 400 }}>{profile.bio}</div>
                </div>

                {/* Quick stats */}
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {[
                        { label: 'kWh Traded', value: '247.8', color: 'var(--teal-400)' },
                        { label: 'CO₂ Avoided', value: '111.5 kg', color: '#4ade80' },
                        { label: 'Clean Score', value: '55/100', color: 'var(--amber-400)' },
                    ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Two-column: section nav + form ───────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>

                {/* Section selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {navSections.map(s => (
                        <button key={s.key} type="button"
                            onClick={() => setActiveSection(s.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                                borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                                background: activeSection === s.key ? 'var(--teal-glow)' : 'transparent',
                                color: activeSection === s.key ? 'var(--teal-400)' : 'var(--text-secondary)',
                                fontWeight: 600, fontSize: '0.82rem', fontFamily: 'var(--font)',
                                textAlign: 'left', width: '100%',
                                boxShadow: activeSection === s.key ? 'inset 3px 0 0 var(--teal-400)' : 'none',
                                transition: 'all 0.15s ease',
                            }}>
                            <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Form area */}
                <form onSubmit={handleSave}>
                    {/* Save bar */}
                    {saved && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                            background: 'var(--green-glow)', border: '1px solid rgba(74,222,128,0.25)',
                            borderRadius: 'var(--radius-sm)', padding: '12px 16px',
                            color: '#4ade80', fontWeight: 600, fontSize: '0.875rem',
                        }}>
                            <IoCheckmarkCircle style={{ fontSize: '1.2rem' }} />
                            Profile saved successfully!
                        </div>
                    )}

                    {/* ── Personal Info ── */}
                    {activeSection === 'personal' && (
                        <Section icon={<IoPersonOutline />} title="Personal Information" subtitle="Your public profile and contact details">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                {[
                                    { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your full name' },
                                    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@neighborhood.com' },
                                    { label: 'Neighborhood Address', key: 'address', type: 'text', placeholder: '42 Maple Street' },
                                ].map(f => (
                                    <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">{f.label}</label>
                                        <input type={f.type} className="form-input" placeholder={f.placeholder}
                                            value={profile[f.key]} onChange={set(f.key)} />
                                    </div>
                                ))}

                                {/* Phone with country code */}
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Phone Number</span>
                                        {(() => {
                                            const rule = COUNTRY_PHONE_RULES[profile.countryCode];
                                            const digitCount = profile.phone.replace(/\D/g, '').length;
                                            if (!rule) return null;
                                            return (
                                                <span style={{
                                                    fontSize: '0.68rem', fontWeight: 600,
                                                    color: digitCount === rule.digits ? '#4ade80' : digitCount > rule.digits ? '#f87171' : 'var(--text-muted)',
                                                }}>
                                                    {digitCount}/{rule.digits} digits
                                                </span>
                                            );
                                        })()}
                                    </label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <select
                                            className="form-select"
                                            value={profile.countryCode}
                                            onChange={(e) => {
                                                set('countryCode')(e);
                                                // Clear phone when switching country to avoid leftover digits
                                                setProfile(p => ({ ...p, countryCode: e.target.value, phone: '' }));
                                            }}
                                            style={{ width: 130, flexShrink: 0 }}
                                        >
                                            {[
                                                { code: '+1', flag: '🇺🇸', label: 'US / CA' },
                                                { code: '+44', flag: '🇬🇧', label: 'UK' },
                                                { code: '+91', flag: '🇮🇳', label: 'India' },
                                                { code: '+61', flag: '🇦🇺', label: 'AUS' },
                                                { code: '+971', flag: '🇦🇪', label: 'UAE' },
                                                { code: '+65', flag: '🇸🇬', label: 'SGP' },
                                                { code: '+49', flag: '🇩🇪', label: 'Germany' },
                                                { code: '+33', flag: '🇫🇷', label: 'France' },
                                                { code: '+81', flag: '🇯🇵', label: 'Japan' },
                                                { code: '+82', flag: '🇰🇷', label: 'Korea' },
                                                { code: '+86', flag: '🇨🇳', label: 'China' },
                                                { code: '+55', flag: '🇧🇷', label: 'Brazil' },
                                                { code: '+52', flag: '🇲🇽', label: 'Mexico' },
                                                { code: '+27', flag: '🇿🇦', label: 'S Africa' },
                                                { code: '+234', flag: '🇳🇬', label: 'Nigeria' },
                                                { code: '+92', flag: '🇵🇰', label: 'Pakistan' },
                                                { code: '+880', flag: '🇧🇩', label: 'Bangla' },
                                                { code: '+63', flag: '🇵🇭', label: 'PHL' },
                                                { code: '+62', flag: '🇮🇩', label: 'IDN' },
                                                { code: '+66', flag: '🇹🇭', label: 'THA' },
                                                { code: '+7', flag: '🇷🇺', label: 'Russia' },
                                                { code: '+39', flag: '🇮🇹', label: 'Italy' },
                                                { code: '+34', flag: '🇪🇸', label: 'Spain' },
                                                { code: '+31', flag: '🇳🇱', label: 'NLD' },
                                                { code: '+46', flag: '🇸🇪', label: 'Sweden' },
                                                { code: '+41', flag: '🇨🇭', label: 'Swiss' },
                                                { code: '+64', flag: '🇳🇿', label: 'NZL' },
                                            ].map(c => (
                                                <option key={c.code} value={c.code}>
                                                    {c.flag} {c.code}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            placeholder={COUNTRY_PHONE_RULES[profile.countryCode]?.example ?? '555 234-5678'}
                                            value={profile.phone}
                                            maxLength={COUNTRY_PHONE_RULES[profile.countryCode]?.digits + 4}
                                            onChange={(e) => {
                                                // Strip excess digits beyond the country max
                                                const rule = COUNTRY_PHONE_RULES[profile.countryCode];
                                                const raw = e.target.value;
                                                const digitsOnly = raw.replace(/\D/g, '');
                                                if (rule && digitsOnly.length > rule.digits) return;
                                                setProfile(p => ({ ...p, phone: raw }));
                                            }}
                                        />
                                    </div>

                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0, marginTop: 16 }}>
                                <label className="form-label">Bio</label>
                                <textarea className="form-input" rows={3} placeholder="Tell your neighborhood a little about yourself..."
                                    style={{ resize: 'vertical', fontFamily: 'var(--font)', lineHeight: 1.6 }}
                                    value={profile.bio} onChange={set('bio')} />
                            </div>
                        </Section>
                    )}

                    {/* ── Solar Panel ── */}
                    {activeSection === 'solar' && (
                        <Section icon={<IoSunnyOutline />} title="Solar Panel Configuration" subtitle="SunSync uses these to forecast your daily generation" accent="teal-accent">
                            <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 18, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                ⚡ <strong style={{ color: 'var(--amber-400)' }}>SunSync AI</strong> uses your panel specs to build a personalised generation model. Accurate specs = better forecasts.
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                {[
                                    { label: 'Panel Brand', key: 'panelBrand', type: 'text', placeholder: 'e.g. SunPower' },
                                    { label: 'Panel Model', key: 'panelModel', type: 'text', placeholder: 'e.g. SPR-MAX3-400' },
                                    { label: 'Capacity (kW peak)', key: 'panelCapacityKw', type: 'number', placeholder: 'e.g. 8.4' },
                                    { label: 'Installation Date', key: 'installDate', type: 'date', placeholder: '' },
                                    { label: 'Panel Azimuth', key: 'azimuth', type: 'text', placeholder: 'e.g. South (180°)' },
                                    { label: 'Tilt Angle', key: 'tilt', type: 'text', placeholder: 'e.g. 25°' },
                                ].map(f => (
                                    <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">{f.label}</label>
                                        <input type={f.type} className="form-input" placeholder={f.placeholder}
                                            value={profile[f.key]} onChange={set(f.key)} step={f.type === 'number' ? '0.1' : undefined} />
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* ── Trading Preferences ── */}
                    {activeSection === 'trading' && (
                        <Section icon={<IoFlash />} title="Trading Preferences" subtitle="Default settings applied when you create a new listing">
                            <div className="form-group">
                                <label className="form-label">Default Availability Window</label>
                                <select className="form-select" value={profile.defaultWindow} onChange={set('defaultWindow')}>
                                    <option value="all">Today (all day)</option>
                                    <option value="morning">Morning (06:00 – 12:00)</option>
                                    <option value="afternoon">Afternoon (12:00 – 18:00)</option>
                                    <option value="evening">Evening (18:00 – 22:00)</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Min Acceptable Price ($/kWh)</label>
                                    <input type="number" className="form-input" min="0.01" step="0.01"
                                        placeholder="e.g. 0.09" value={profile.minPrice} onChange={set('minPrice')} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Max Acceptable Price ($/kWh)</label>
                                    <input type="number" className="form-input" min="0.01" step="0.01"
                                        placeholder="e.g. 0.15" value={profile.maxPrice} onChange={set('maxPrice')} />
                                </div>
                            </div>
                            <div style={{ marginTop: 20 }}>
                                <Toggle
                                    checked={profile.autoAccept}
                                    onChange={set('autoAccept')}
                                    label="Auto-accept QAOA matches"
                                    desc="Automatically confirm matches from the daily 15:00 cycle within your price range" />
                            </div>
                        </Section>
                    )}

                    {/* ── Notifications ── */}
                    {activeSection === 'notifs' && (
                        <Section icon={<IoNotificationsOutline />} title="Notification Preferences" subtitle="Choose how you hear about trades, forecasts, and community updates">
                            <div style={{ marginBottom: 12, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Email Notifications</div>
                            <Toggle checked={profile.emailMatches} onChange={set('emailMatches')} label="Match Results" desc="Get notified when the QAOA engine matches your listing" />
                            <Toggle checked={profile.emailForecast} onChange={set('emailForecast')} label="Daily SunSync Forecast" desc="Morning email with tomorrow's predicted generation and trade recommendations" />
                            <Toggle checked={profile.emailCommunity} onChange={set('emailCommunity')} label="Community Updates" desc="Monthly neighbourhood energy roundup and platform announcements" />
                            <div style={{ marginTop: 20, marginBottom: 12, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>SMS Notifications</div>
                            <Toggle checked={profile.smsAlerts} onChange={set('smsAlerts')} label="Urgent Match Alerts" desc="SMS when time-sensitive matches need your immediate confirmation" />
                        </Section>
                    )}

                    {/* ── Security ── */}
                    {activeSection === 'security' && (
                        <Section icon={<IoShieldCheckmarkOutline />} title="Security" subtitle="Change your email or password — requires current password">

                            {secResult && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                                    background: secResult.ok ? 'var(--green-glow)' : 'rgba(248,113,113,0.08)',
                                    border: `1px solid ${secResult.ok ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
                                    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                                    color: secResult.ok ? '#4ade80' : '#f87171', fontSize: '0.82rem', fontWeight: 500,
                                }}>
                                    {secResult.ok ? <IoCheckmarkCircle /> : <IoClose />} {secResult.msg}
                                </div>
                            )}

                            {/* ── Change email ── */}
                            <div style={{ marginBottom: 6, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Change Email</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">New Email Address</label>
                                    <input type="email" className="form-input" placeholder="new@neighborhood.com"
                                        value={sec.newEmail} onChange={e => setSec(s => ({ ...s, newEmail: e.target.value }))} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Current Password (to confirm)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={secShowPw.current ? 'text' : 'password'} className="form-input"
                                            placeholder="••••••••" value={sec.currentPw}
                                            onChange={e => setSec(s => ({ ...s, currentPw: e.target.value }))}
                                            style={{ paddingRight: 40 }} />
                                        <button type="button" onClick={() => setSecShowPw(s => ({ ...s, current: !s.current }))} style={{
                                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem',
                                        }}>{secShowPw.current ? <IoEyeOffOutline /> : <IoEyeOutline />}</button>
                                    </div>
                                </div>
                            </div>
                            <button type="button"
                                onClick={() => {
                                    if (!sec.newEmail) return setSecResult({ ok: false, msg: 'Enter a new email address.' });
                                    if (!sec.currentPw) return setSecResult({ ok: false, msg: 'Enter your current password.' });
                                    const user = getCurrentUser();
                                    if (!user) return setSecResult({ ok: false, msg: 'Not logged in.' });
                                    const r = updateUser(user.id, { email: sec.newEmail }, sec.currentPw);
                                    setSecResult({ ok: r.ok, msg: r.ok ? `Email updated to ${sec.newEmail}` : r.error });
                                    if (r.ok) setSec(s => ({ ...s, newEmail: '', currentPw: '' }));
                                    setTimeout(() => setSecResult(null), 4000);
                                }}
                                className="btn btn-secondary" style={{ marginBottom: 28 }}>Update Email</button>

                            <div style={{ borderTop: '1px solid var(--border)', marginBottom: 20 }} />

                            {/* ── Change password ── */}
                            <div style={{ marginBottom: 12, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Change Password</div>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={secShowPw.current ? 'text' : 'password'} className="form-input"
                                        placeholder="••••••••" value={sec.currentPw}
                                        onChange={e => setSec(s => ({ ...s, currentPw: e.target.value }))}
                                        style={{ paddingRight: 40 }} />
                                    <button type="button" onClick={() => setSecShowPw(s => ({ ...s, current: !s.current }))} style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem',
                                    }}>{secShowPw.current ? <IoEyeOffOutline /> : <IoEyeOutline />}</button>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={secShowPw.new ? 'text' : 'password'} className="form-input"
                                            placeholder="Min 8 characters" value={sec.newPw}
                                            onChange={e => setSec(s => ({ ...s, newPw: e.target.value }))}
                                            style={{ paddingRight: 40 }} />
                                        <button type="button" onClick={() => setSecShowPw(s => ({ ...s, new: !s.new }))} style={{
                                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem',
                                        }}>{secShowPw.new ? <IoEyeOffOutline /> : <IoEyeOutline />}</button>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Confirm New Password</span>
                                        {sec.confirmPw && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: sec.newPw === sec.confirmPw ? '#4ade80' : '#f87171' }}>
                                            {sec.newPw === sec.confirmPw ? '✓ Match' : '✗ No match'}
                                        </span>}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={secShowPw.confirm ? 'text' : 'password'} className="form-input"
                                            placeholder="Repeat new password" value={sec.confirmPw}
                                            onChange={e => setSec(s => ({ ...s, confirmPw: e.target.value }))}
                                            style={{ paddingRight: 40 }} />
                                        <button type="button" onClick={() => setSecShowPw(s => ({ ...s, confirm: !s.confirm }))} style={{
                                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem',
                                        }}>{secShowPw.confirm ? <IoEyeOffOutline /> : <IoEyeOutline />}</button>
                                    </div>
                                </div>
                            </div>
                            <button type="button"
                                onClick={() => {
                                    if (!sec.currentPw) return setSecResult({ ok: false, msg: 'Enter your current password.' });
                                    if (sec.newPw.length < 8) return setSecResult({ ok: false, msg: 'New password must be at least 8 characters.' });
                                    if (sec.newPw !== sec.confirmPw) return setSecResult({ ok: false, msg: 'Passwords do not match.' });
                                    const user = getCurrentUser();
                                    if (!user) return setSecResult({ ok: false, msg: 'Not logged in.' });
                                    const r = updateUser(user.id, { password: sec.newPw }, sec.currentPw);
                                    setSecResult({ ok: r.ok, msg: r.ok ? 'Password updated successfully.' : r.error });
                                    if (r.ok) setSec({ currentPw: '', newEmail: '', newPw: '', confirmPw: '' });
                                    setTimeout(() => setSecResult(null), 4000);
                                }}
                                className="btn btn-secondary" style={{ marginBottom: 28 }}>Update Password</button>

                            {/* Danger zone */}
                            <div style={{ borderTop: '1px solid rgba(248,113,113,0.2)', paddingTop: 20 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#f87171', marginBottom: 12 }}>Danger Zone</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 'var(--radius-sm)' }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Delete Account</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Permanently removes your account, listings and trade history</div>
                                    </div>
                                    <button type="button" disabled style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(248,113,113,0.3)', background: 'transparent', color: '#f8717166', cursor: 'not-allowed', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font)' }}>
                                        Delete (Phase 2)
                                    </button>
                                </div>
                            </div>
                        </Section>
                    )}

                    {/* Save button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button type="button" onClick={() => setProfile(defaultProfile)}
                            className="btn btn-secondary">Reset to defaults</button>
                        <button type="submit" className="btn btn-primary" style={{ minWidth: 140 }}>
                            <IoSaveOutline /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
