import { NavLink } from 'react-router-dom';
import { IconBeer, IconHome, IconMusic, IconHistory, IconSettings, IconHelpCircle, IconLogout } from '@tabler/icons-react';

const navItems = [
  { to: '/', label: 'Home', Icon: IconHome },
  { to: '/voices', label: 'Voices', Icon: IconMusic },
  { to: '/history', label: 'History', Icon: IconHistory },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
];

const footerItems = [
  { to: '#', label: 'Support', Icon: IconHelpCircle },
  { to: '#', label: 'Logout', Icon: IconLogout },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <IconBeer size={36} stroke={1.5} color="var(--tertiary)" className="sidebar-brand-icon" />
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
            <item.Icon size={18} stroke={1.5} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {footerItems.map((item) => (
          <a key={item.label} href={item.to} className="sidebar-link">
            <item.Icon size={18} stroke={1.5} />
            {item.label}
          </a>
        ))}
      </div>
    </aside>
  );
}
