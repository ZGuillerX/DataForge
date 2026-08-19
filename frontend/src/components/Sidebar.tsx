import { NavLink } from 'react-router-dom';
import Icon from './Icon';

const NAV_ITEMS = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/files', icon: 'folder', label: 'Archivos' },
  { to: '/jobs', icon: 'terminal', label: 'Trabajos' },
  { to: '/profile', icon: 'settings', label: 'Perfil' },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-outline-variant bg-surface-container p-md">
      <div className="mb-6 flex flex-col items-start gap-1 px-1 pt-1">
        <img src="/dataforge_logo.png" alt="DataForge" className="h-16 w-auto" />
        <p className="text-label-caps font-label-caps tracking-wide text-on-surface-variant">
          Data Engineering
        </p>
      </div>

      <NavLink
        to="/files"
        className="mb-6 flex items-center justify-center gap-2 rounded bg-primary py-2 text-body-md font-body-md font-semibold text-on-primary transition-colors hover:bg-primary-fixed"
      >
        <Icon name="add" size={18} />
        Nueva importación
      </NavLink>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-body-md font-body-md transition-colors ${
                isActive
                  ? 'bg-primary-container font-medium text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} filled={isActive} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant pt-md">
        <a
          href="https://github.com/ZGuillerX/DataForge"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-body-md font-body-md text-on-surface-variant transition-colors hover:bg-surface-container-high"
        >
          <Icon name="help" />
          Soporte
        </a>
        <a
          href="/api/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-body-md font-body-md text-on-surface-variant transition-colors hover:bg-surface-container-high"
        >
          <Icon name="description" />
          Documentación
        </a>
      </div>
    </aside>
  );
}
