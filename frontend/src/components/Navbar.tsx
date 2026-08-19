import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

interface NavbarProps {
  title: string;
}

export default function Navbar({ title }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-outline-variant bg-surface px-gutter">
      <div className="flex items-center gap-md">
        <h1 className="text-headline-md font-headline-md font-semibold text-on-surface">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-md">
        <Link
          to="/jobs"
          className="hidden items-center gap-2 rounded border border-outline-variant px-4 py-1.5 text-body-sm font-body-sm text-on-surface transition-colors hover:border-primary hover:text-primary sm:flex"
        >
          <Icon name="download" size={16} />
          Exportar datos
        </Link>
        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container py-1 pl-1 pr-3 text-body-sm font-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-on-primary">
            {initials}
          </span>
          <span>{user?.email}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="rounded border border-outline-variant px-3 py-1.5 text-body-sm font-body-sm text-on-surface-variant transition-colors hover:border-error hover:text-error"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
