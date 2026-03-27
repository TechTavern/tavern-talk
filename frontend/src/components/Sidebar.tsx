import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home', icon: 'M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z' },
  { to: '/voices', label: 'Voices', icon: 'M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z' },
  { to: '/history', label: 'History', icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' },
  { to: '/settings', label: 'Settings', icon: 'M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z' },
];

const footerItems = [
  { to: '#', label: 'Support', icon: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z' },
  { to: '#', label: 'Logout', icon: 'M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z' },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d={d} clipRule="evenodd" />
    </svg>
  );
}

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <svg className="sidebar-brand-icon" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="var(--tertiary)" strokeWidth="1.5" fill="none" />
          <path d="M16 8 L20 14 L16 12 L12 14 Z" fill="var(--tertiary)" opacity="0.8" />
          <path d="M10 16 Q16 24 22 16" stroke="var(--tertiary)" strokeWidth="1.5" fill="none" />
        </svg>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Tavern Talk</span>
          <span className="sidebar-brand-role">Brewmaster</span>
          <span className="sidebar-brand-sub">Synthesis Expert</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <NavIcon d={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {footerItems.map((item) => (
          <a key={item.label} href={item.to} className="sidebar-link">
            <NavIcon d={item.icon} />
            {item.label}
          </a>
        ))}
      </div>
    </aside>
  );
}
