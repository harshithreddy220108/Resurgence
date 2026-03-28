import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  IoFlash, IoGridOutline, IoWalletOutline, IoStatsChartOutline,
  IoPeopleOutline, IoLogOutOutline, IoLeafOutline, IoSunnyOutline,
  IoEarthOutline, IoStorefrontOutline, IoChevronBackOutline, IoChevronForwardOutline,
  IoPartlySunnyOutline, IoTimeOutline
} from 'react-icons/io5';
import { useAuthStore } from '../utils/useAuth';
import './Navbar.css';

const userLinks = [
  { to: '/dashboard', icon: <IoWalletOutline />, label: 'Energy Wallet' },
  { to: '/market', icon: <IoStorefrontOutline />, label: 'Energy Market' },
  { to: '/history', icon: <IoStatsChartOutline />, label: 'Transactions' },
  { to: '/impact', icon: <IoLeafOutline />, label: 'My Impact' },
  { to: '/sunsync', icon: <IoSunnyOutline />, label: 'SunSync AI' },
];

const adminLinks = [
  { to: '/admin', icon: <IoGridOutline />, label: 'Overview' },
  { to: '/admin/listings', icon: <IoFlash />, label: 'Active Listings' },
  { to: '/admin/matches', icon: <IoLeafOutline />, label: 'Match Results' },
  { to: '/admin/users', icon: <IoPeopleOutline />, label: 'Users' },
  { to: '/admin/sdg', icon: <IoEarthOutline />, label: 'SDG Report' },
];

export default function Navbar({ role = 'user', collapsed = false, onToggle }) {
  const links = role === 'admin' ? adminLinks : userLinks;
  const panelLabel = role === 'admin' ? 'Admin Panel' : 'My Account';
  const [navAvatar] = useState(() => localStorage.getItem('qtrade_avatar') || null);
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState({ tempC: 22, tempF: 72, desc: 'Fair', icon: <IoPartlySunnyOutline size={14} /> });
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    // Live clock for sidebar context
    const t = setInterval(() => setTime(new Date()), 60000); // update every minute
    
    // Live weather for sidebar context
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=30.2672&longitude=-97.7431&current_weather=true');
        const data = await res.json();
        const current = data.current_weather;
        if (current) {
           const tempC = Math.round(current.temperature);
           const tempF = Math.round(tempC * 9/5 + 32);
           let desc = 'Fair';
           let icon = <IoSunnyOutline size={14} />;
           const wc = current.weathercode;
           if (wc === 0) { desc = 'Clear'; icon = <IoSunnyOutline size={14} />; }
           else if (wc > 0 && wc <= 3) { desc = 'Partly Cloudy'; icon = <IoPartlySunnyOutline size={14} />; }
           else if (wc >= 45) { desc = 'Cloudy/Rain'; icon = <IoPartlySunnyOutline size={14} />; }
           setWeather({ tempC, tempF, desc, icon });
        }
      } catch (err) {
        console.error("Failed to fetch live weather", err);
      }
    };
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 300000); // 5 mins

    return () => {
      clearInterval(t);
      clearInterval(weatherInterval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

      {/* ── Top: Brand + Toggle ── */}
      <div className="sidebar-top">
        <div className="sidebar-brand" style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="brand-logo"><IoFlash /></div>
            {!collapsed && (
              <div className="brand-text">
                <div className="brand-name">Q-Trade</div>
                <div className="brand-tag">{panelLabel}</div>
              </div>
            )}
          </div>

          {/* ── Context Widget (Weather & Time) ── */}
          {!collapsed && (
            <div className="brand-context" style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 'var(--radius-sm)', padding: '8px 10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--amber-400)' }} title="Live tracking via Open-Meteo API">
                {weather.icon} {weather.desc}, {weather.tempF}°F / {weather.tempC}°C
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <IoTimeOutline size={14} /> {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}
        </div>

        <button
          className="sidebar-toggle"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <IoChevronForwardOutline /> : <IoChevronBackOutline />}
        </button>
      </div>

      {/* ── User Profile (below brand) ── */}
      <div className="sidebar-user-section">
        <NavLink to={role === 'user' ? '/profile' : '#'}
          style={{ textDecoration: 'none', flexShrink: 0 }}
          title="View profile">
          <div className="user-avatar" style={{
            overflow: 'hidden', cursor: role === 'user' ? 'pointer' : 'default',
            transition: 'box-shadow 0.2s ease',
          }}>
            {navAvatar
              ? <img src={navAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (localStorage.getItem('qtrade_profile_name')?.[0] ?? 'A') + (localStorage.getItem('qtrade_profile_name')?.[1] ?? 'J')}
          </div>
        </NavLink>
        {!collapsed && (
          <div className="user-info">
            <div className="user-name">{user?.name || 'Local Resident'}</div>
            <div className="user-role">{user?.is_admin ? 'Administrator' : 'Resident'}</div>
          </div>
        )}
        {!collapsed && (
          <button onClick={handleLogout} className="sidebar-logout" title="Logout">
            <IoLogOutOutline />
          </button>
        )}
      </div>

      <div className="sidebar-divider" />

      {/* ── Nav Links ── */}
      <ul className="sidebar-nav">
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.to === '/admin'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{link.icon}</span>
              {!collapsed && <span className="sidebar-label">{link.label}</span>}
              {collapsed && <span className="sidebar-tooltip">{link.label}</span>}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* ── Bottom logout (collapsed only) ── */}
      {collapsed && (
        <div className="sidebar-footer-collapsed">
          <button onClick={handleLogout} className="sidebar-logout" title="Logout">
            <IoLogOutOutline />
          </button>
        </div>
      )}
    </nav>
  );
}
