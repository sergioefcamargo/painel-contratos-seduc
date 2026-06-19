import { Outlet, NavLink, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  const user = JSON.parse(localStorage.getItem('user') ?? '{}');

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
      <nav style={{
        background: 'var(--ink)', color: '#fff', padding: '0 20px',
        display: 'flex', alignItems: 'center', gap: 24, height: 52,
      }}>
        <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em', flex: 1 }}>
          Contratos SEDUC
        </span>
        <NavLink to="/dashboard" style={({ isActive }) => ({
          color: isActive ? '#fff' : 'rgba(255,255,255,0.62)', fontWeight: 600, fontSize: 14,
          textDecoration: 'none', borderBottom: isActive ? '2px solid var(--green-soft)' : 'none', paddingBottom: 2,
        })}>
          Painel
        </NavLink>
        <NavLink to="/contracts" style={({ isActive }) => ({
          color: isActive ? '#fff' : 'rgba(255,255,255,0.62)', fontWeight: 600, fontSize: 14,
          textDecoration: 'none', borderBottom: isActive ? '2px solid var(--green-soft)' : 'none', paddingBottom: 2,
        })}>
          Contratos
        </NavLink>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginLeft: 'auto' }}>
          {user?.name ?? user?.email}
        </span>
        <button onClick={logout} style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.25)',
          color: 'rgba(255,255,255,0.75)', borderRadius: 7, padding: '5px 12px', fontSize: 13, cursor: 'pointer',
        }}>
          Sair
        </button>
      </nav>
      <div className="wrap" style={{ paddingTop: 24 }}>
        <Outlet />
      </div>
    </div>
  );
}
