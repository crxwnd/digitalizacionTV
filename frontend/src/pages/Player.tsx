// frontend/src/pages/Player.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { screensAPI } from '../services/api';

interface Screen {
  id: number;
  name: string;
  code: string;
  approved: boolean;
  currentContent: string | null;
  area: {
    name: string;
  };
}

const Player: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!code) {
      setError('Código de pantalla no proporcionado');
      setLoading(false);
      return;
    }

    loadScreen();
    const screenInterval = setInterval(loadScreen, 60000); // Verificar cada minuto

    // Heartbeat cada 30 segundos
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);
    
    // Actualizar reloj cada segundo
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(screenInterval);
      clearInterval(heartbeatInterval);
      clearInterval(clockInterval);
    };
  }, [code]);

  const loadScreen = async () => {
    try {
      const response = await screensAPI.getByCode(code!);
      setScreen(response.data);
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al cargar pantalla');
    } finally {
      setLoading(false);
    }
  };

  const sendHeartbeat = async () => {
    if (!code) return;
    
    try {
      await screensAPI.heartbeat(code, {
        timestamp: new Date().toISOString(),
        status: 'active',
      });
    } catch (error) {
      console.error('Error en heartbeat:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-white text-lg">Cargando pantalla...</p>
        </div>
      </div>
    );
  }

  if (error || !screen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700 p-8">
        <div className="glass-card rounded-3xl p-12 max-w-md text-center">
          <svg className="w-20 h-20 mx-auto text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-primary mb-2">Error</h2>
          <p className="text-primary/70">{error || 'Pantalla no encontrada'}</p>
          <p className="text-sm text-primary/50 mt-4">Código: {code}</p>
        </div>
      </div>
    );
  }

  if (!screen.approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600 p-8">
        <div className="glass-card rounded-3xl p-12 max-w-md text-center">
          <svg className="w-20 h-20 mx-auto text-yellow-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-primary mb-2">Pendiente de Aprobación</h2>
          <p className="text-primary/70 mb-6">
            Esta pantalla está registrada pero aún no ha sido aprobada por el administrador.
          </p>
          <div className="glass-card-dark rounded-xl p-4">
            <p className="text-sm text-primary/70 mb-1">Pantalla:</p>
            <p className="font-medium text-primary">{screen.name}</p>
            <p className="text-sm text-primary/70 mt-2 mb-1">Área:</p>
            <p className="font-medium text-primary">{screen.area.name}</p>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla activa y aprobada
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-secondary flex flex-col">
      {/* Header */}
      <header className="glass-card-dark border-b border-white/10 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{screen.name}</h1>
            <p className="text-white/70 text-sm">{screen.area.name}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">
              {currentTime.toLocaleTimeString('es-MX', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </p>
            <p className="text-white/70 text-sm">
              {currentTime.toLocaleDateString('es-MX', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 flex items-center justify-center p-8">
        {screen.currentContent ? (
          <div className="w-full h-full flex items-center justify-center">
            {/* Aquí irá el contenido dinámico (videos, imágenes, etc.) */}
            <div className="glass-card rounded-3xl p-12 text-center max-w-2xl">
              <svg className="w-24 h-24 mx-auto text-white/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              <p className="text-white text-xl">
                {screen.currentContent}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <svg className="w-32 h-32 mx-auto text-white/30 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h2 className="text-4xl font-bold text-white mb-4">
              Pantalla Lista
            </h2>
            <p className="text-white/70 text-xl">
              En espera de contenido...
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="glass-card-dark border-t border-white/10 px-8 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-2 text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Conectado</span>
            </span>
            <span className="text-white/50">•</span>
            <span className="text-white/70 font-mono">{screen.code}</span>
          </div>
          <div className="text-white/50">
            Sistema de Señalización Digital
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Player;