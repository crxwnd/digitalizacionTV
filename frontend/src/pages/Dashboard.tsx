// frontend/src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { screensAPI, areasAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Stats {
  screens: {
    total: number;
    online: number;
    offline: number;
    approved: number;
    pending: number;
  };
  areas: number;
  users: number;
}

const Dashboard: React.FC = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats>({
    screens: { total: 0, online: 0, offline: 0, approved: 0, pending: 0 },
    areas: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar pantallas y calcular stats manualmente
      const screensRes = await screensAPI.getAll();
      const screens = screensRes.data || [];

      const screensStats = {
        total: screens.length,
        online: screens.filter((s: any) => s.online).length,
        offline: screens.filter((s: any) => !s.online).length,
        approved: screens.filter((s: any) => s.approved).length,
        pending: screens.filter((s: any) => !s.approved).length,
      };

      // Cargar áreas
      const areasRes = await areasAPI.getAll();
      
      const newStats: Stats = {
        screens: screensStats,
        areas: areasRes.data?.length || 0,
        users: 0,
      };

      // Cargar usuarios solo si es admin
      if (isAdmin) {
        try {
          const usersRes = await usersAPI.getAll();
          newStats.users = usersRes.data?.length || 0;
        } catch (err) {
          console.error('Error al cargar usuarios:', err);
        }
      }

      setStats(newStats);
    } catch (error: any) {
      console.error('Error al cargar estadísticas:', error);
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="glass-card rounded-2xl p-8 max-w-md text-center">
          <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-primary mb-2">{error}</h3>
          <button onClick={loadStats} className="btn-primary mt-4">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Cards de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pantallas"
          value={stats.screens.total}
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          color="from-primary to-primary-dark"
        />

        <StatCard
          title="Pantallas Online"
          value={stats.screens.online}
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="from-green-400 to-green-600"
        />

        <StatCard
          title="Pantallas Offline"
          value={stats.screens.offline}
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="from-red-400 to-red-600"
        />

        <StatCard
          title="Pendientes Aprobación"
          value={stats.screens.pending}
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="from-yellow-400 to-yellow-600"
        />
      </div>

      {/* Segunda fila de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-primary mb-4">
            Estado del Sistema
          </h3>
          <div className="space-y-4">
            <ProgressBar
              label="Online"
              value={stats.screens.online}
              total={stats.screens.total}
              color="bg-green-500"
            />
            <ProgressBar
              label="Offline"
              value={stats.screens.offline}
              total={stats.screens.total}
              color="bg-red-500"
            />
            <ProgressBar
              label="Aprobadas"
              value={stats.screens.approved}
              total={stats.screens.total}
              color="bg-blue-500"
            />
            <ProgressBar
              label="Pendientes"
              value={stats.screens.pending}
              total={stats.screens.total}
              color="bg-yellow-500"
            />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-primary mb-4">
            Accesos Rápidos
          </h3>
          <div className="space-y-3">
            <QuickLink
              to="/screens"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
              label="Registrar Nueva Pantalla"
            />
            <QuickLink
              to="/areas"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              label="Gestionar Áreas"
            />
            {isAdmin && (
              <QuickLink
                to="/users"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                }
                label="Administrar Usuarios"
              />
            )}
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Resumen General
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {stats.areas}
            </div>
            <p className="text-primary/60">Áreas Totales</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {stats.screens.total}
            </div>
            <p className="text-primary/60">Pantallas Totales</p>
          </div>
          {isAdmin && (
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {stats.users}
              </div>
              <p className="text-primary/60">Usuarios Totales</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className="glass-card rounded-2xl p-6 hover:shadow-xl transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-primary/60 mb-1">{title}</p>
        <p className="text-3xl font-bold text-primary">{value}</p>
      </div>
      <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
        {icon}
      </div>
    </div>
  </div>
);

const ProgressBar: React.FC<{
  label: string;
  value: number;
  total: number;
  color: string;
}> = ({ label, value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-primary/70">{label}</span>
        <span className="text-primary font-medium">{value} / {total}</span>
      </div>
      <div className="h-2 bg-neutral-light rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const QuickLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
}> = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center space-x-3 p-4 rounded-xl bg-white/30 hover:bg-white/50 transition-all group"
  >
    <div className="text-primary group-hover:text-secondary transition-colors">
      {icon}
    </div>
    <span className="text-sm font-medium text-primary group-hover:text-secondary transition-colors">
      {label}
    </span>
    <svg className="w-4 h-4 ml-auto text-primary/40 group-hover:text-secondary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </Link>
);

export default Dashboard;