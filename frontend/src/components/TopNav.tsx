import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home' },
  { to: '/voices', label: 'Voices' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
];

export function TopNav() {
  return (
    <nav className="topnav">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) => `topnav-tab${isActive ? ' active' : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
