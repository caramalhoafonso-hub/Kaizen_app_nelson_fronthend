import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',               icon: '📊', label: 'Dashboard'       },
  { to: '/materia-prima',  icon: '📦', label: 'Matéria-Prima'   },
  { to: '/scanner',        icon: '📷', label: 'Scanner QR'      },
  { to: '/movimentacoes',  icon: '📋', label: 'Movimentações'   },
];

export default function Navbar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>Gestão de Stock</h2>
        <p>Matéria-Prima</p>
      </div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
