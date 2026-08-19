import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import '../styles/layout.css';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/jobs': 'Trabajos',
  '/files': 'Archivos',
  '/profile': 'Perfil',
};

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const title =
    Object.entries(PAGE_TITLES).find(([path]) => location.pathname.startsWith(path))?.[1] ??
    'DataForge';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title={title} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
