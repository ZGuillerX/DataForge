import { NavLink } from 'react-router-dom';
import '../styles/layout.css';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚡</div>
        <div className="sidebar-logo-text">
          Data<span>Forge</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Principal</div>

        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <span className="nav-link-icon">📊</span>
          Dashboard
        </NavLink>

        <NavLink to="/jobs" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <span className="nav-link-icon">⚙️</span>
          Trabajos
        </NavLink>

        <NavLink to="/files" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <span className="nav-link-icon">📁</span>
          Archivos
        </NavLink>
      </nav>
    </aside>
  );
}
