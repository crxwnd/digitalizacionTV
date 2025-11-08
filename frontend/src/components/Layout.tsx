// frontend/src/components/Layout.tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

interface LayoutProps {
  user: {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN' | 'MANAGER';
  };
  onLogout: () => void;
}

const Layout = ({ user, onLogout }: LayoutProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'MANAGER'] },
    { path: '/areas', label: 'Áreas', icon: '🏢', roles: ['ADMIN', 'MANAGER'] },
    { path: '/screens', label: 'Pantallas', icon: '📺', roles: ['ADMIN', 'MANAGER'] },
    { path: '/content', label: 'Contenido', icon: '🎬', roles: ['ADMIN', 'MANAGER'] },
    { path: '/notifications', label: 'Notificaciones', icon: '📢', roles: ['ADMIN', 'MANAGER'] },
    { path: '/monitor', label: 'Monitor', icon: '👁️', roles: ['ADMIN', 'MANAGER'] },
    { path: '/users', label: 'Usuarios', icon: '👥', roles: ['ADMIN'] },
  ];

  const visibleLinks = navLinks.filter(link => link.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 glass-card-sidebar border-r border-border/50 overflow-y-auto">
        {/* Logo */}
        <div className="p-6 border-b border-border/50">
          <h1 className="text-2xl font-bold text-primary mb-1">DigitalizaciónTV</h1>
          <p className="text-xs text-primary/60">Sistema de Señalización Digital</p>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-primary truncate">{user.name}</p>
              <p className="text-xs text-primary/60 truncate">{user.email}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                user.role === 'ADMIN' 
                  ? 'bg-red-500/10 text-red-600' 
                  : 'bg-blue-500/10 text-blue-600'
              }`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {visibleLinks.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-primary text-white shadow-lg'
                        : 'text-primary/70 hover:bg-primary/5 hover:text-primary'
                    }`
                  }
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors font-medium"
          >
            <span className="text-xl">🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;