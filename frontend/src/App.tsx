// frontend/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Areas from './pages/Areas';
import Screens from './pages/Screens';
import Users from './pages/Users';
import Content from './pages/Content';
import Notifications from './pages/Notifications';
import ScreenMonitor from './pages/ScreenMonitor';
import Player from './pages/Player';

function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Ruta del Player (pública) */}
      <Route path="/player/:code" element={<Player />} />

      {/* Rutas protegidas */}
      {!user ? (
        <>
          <Route path="/login" element={<Login onLogin={login} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <Route element={<Layout user={user} onLogout={logout} />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/areas" element={<Areas />} />
          <Route path="/screens" element={<Screens />} />
          <Route path="/content" element={<Content />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/monitor" element={<ScreenMonitor />} />
          
          {/* Ruta de usuarios solo para ADMIN */}
          {user.role === 'ADMIN' && (
            <Route path="/users" element={<Users />} />
          )}
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      )}
    </Routes>
  );
}

export default App;