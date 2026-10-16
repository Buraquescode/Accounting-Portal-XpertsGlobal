import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';
import { ROLE_LABELS } from '../../utils/constants';

export default function Navbar() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const onLogout = async () => { await logout(); navigate('/login'); };
  // "New Request" is only shown to requesters (the server enforces this too).
  const links = (
    <>
      <NavLink to="/" end onClick={() => setOpen(false)}>Dashboard</NavLink>
      {hasRole('REQUESTER') && <NavLink to="/requests/new" onClick={() => setOpen(false)}>New Request</NavLink>}
    </>
  );

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand">Xperts Portal</Link>
        <nav className="navbar__links" aria-label="Main">{links}</nav>
        {user && (
          <div className="navbar__user">
            <span>{user.name}</span>
            {user.roles.map((r) => <span key={r} className="role-chip">{ROLE_LABELS[r] || r}</span>)}
            <Button variant="ghost" size="sm" onClick={onLogout}>Logout</Button>
          </div>
        )}
        <button type="button" className="navbar__toggle" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)}>
          Menu
        </button>
      </div>
      {open && (
        <div id="mobile-menu" className="navbar__menu">
          {links}
          {user && <><span>{user.name}</span><Button variant="ghost" size="sm" onClick={onLogout}>Logout</Button></>}
        </div>
      )}
    </header>
  );
}
