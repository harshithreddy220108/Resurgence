import { useNavigate } from 'react-router-dom';
import { IoFlash } from 'react-icons/io5';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden', flexDirection: 'column',
            fontFamily: 'var(--font)',
        }}>
            {/* Background orbs */}
            <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', top: -200, left: -200, background: 'radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', bottom: -100, right: -100, background: 'radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

            {/* Giant 404 background text */}
            <div style={{
                position: 'absolute', fontSize: 'clamp(120px, 25vw, 280px)', fontWeight: 900,
                color: 'rgba(255,255,255,0.02)', userSelect: 'none', letterSpacing: '-0.05em',
                lineHeight: 1, zIndex: 0,
            }}>404</div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px' }}>
                <div style={{
                    width: 56, height: 56, borderRadius: 16, margin: '0 auto 24px',
                    background: 'linear-gradient(135deg, var(--teal-600), var(--teal-400))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', color: 'white', boxShadow: 'var(--shadow-teal)',
                }}>
                    <IoFlash />
                </div>

                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--teal-400)', textTransform: 'uppercase', marginBottom: 12 }}>
                    Grid Offline
                </div>

                <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 14, lineHeight: 1.2 }}>
                    This node doesn't exist.
                </h1>

                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 36px', lineHeight: 1.7 }}>
                    The page you're looking for isn't on the microgrid. It may have moved, or the route was never wired up.
                </p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate(-1)} style={{
                        padding: '11px 24px', borderRadius: 'var(--radius-sm)', fontWeight: 600,
                        fontSize: '0.875rem', border: '1px solid var(--border)', background: 'var(--bg-card)',
                        color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'var(--font)',
                        transition: 'all 0.2s ease',
                    }}
                        onMouseEnter={e => { e.target.style.background = 'var(--bg-card-hover)'; e.target.style.borderColor = 'var(--border-accent)'; }}
                        onMouseLeave={e => { e.target.style.background = 'var(--bg-card)'; e.target.style.borderColor = 'var(--border)'; }}>
                        ← Go Back
                    </button>
                    <button onClick={() => navigate('/dashboard')} style={{
                        padding: '11px 24px', borderRadius: 'var(--radius-sm)', fontWeight: 600,
                        fontSize: '0.875rem', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                        background: 'linear-gradient(135deg, var(--teal-500), var(--teal-400))',
                        color: '#fff', boxShadow: '0 4px 16px rgba(45,212,191,0.3)',
                        transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                        onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(45,212,191,0.45)'; }}
                        onMouseLeave={e => { e.target.style.transform = ''; e.target.style.boxShadow = '0 4px 16px rgba(45,212,191,0.3)'; }}>
                        ⚡ Back to Dashboard
                    </button>
                </div>

                <div style={{ marginTop: 48, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Q-Trade Microgrid Network · Error 404
                </div>
            </div>
        </div>
    );
}
