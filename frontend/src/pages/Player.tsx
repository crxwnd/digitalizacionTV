// frontend/src/pages/Player.tsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Screen {
  id: number;
  code: string;
  name: string;
  approved: boolean;
  online: boolean;
  area: {
    id: number;
    name: string;
  };
}

interface Content {
  id: number;
  name: string;
  type: 'IMAGE' | 'VIDEO' | 'PRESENTATION' | 'HTML';
  url: string;
  displayDuration: number;
  order: number;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: number;
}

const Player = () => {
  const [screen, setScreen] = useState<Screen | null>(null);
  const [content, setContent] = useState<Content[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const code = window.location.pathname.split('/').pop() || '';

  // Cargar datos de la pantalla
  const loadScreen = useCallback(async () => {
    if (!code) {
      setError('Código de pantalla no proporcionado');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/screens/code/${code}`);
      setScreen(response.data);
      setError(null);

      // Cargar contenido y notificaciones si está aprobada
      if (response.data.approved) {
        await loadContent();
        if (response.data.area) {
          await loadNotifications(response.data.area.id);
        }
      }
    } catch (error: any) {
      console.error('Error al cargar pantalla:', error);
      setError(error.response?.data?.error || 'Error al cargar pantalla');
    } finally {
      setLoading(false);
    }
  }, [code]);

  // Cargar contenido asignado
  const loadContent = async () => {
    if (!code) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/content/screen/${code}`);
      setContent(response.data);
    } catch (error) {
      console.error('Error al cargar contenido:', error);
      setContent([]);
    }
  };

  // Cargar notificaciones activas
  const loadNotifications = async (areaId: number) => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications/active`, {
        params: { areaId }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      setNotifications([]);
    }
  };

  // Enviar heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!code || !screen?.approved) return;
    
    try {
      const currentContent = content[currentContentIndex];
      await axios.post(`${API_URL}/api/screens/heartbeat/${code}`, {
        currentContent: currentContent?.name || 'Sin contenido',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en heartbeat:', error);
    }
  }, [code, screen, content, currentContentIndex]);

  // Cambiar contenido automáticamente
  useEffect(() => {
    if (content.length === 0) return;

    const currentItem = content[currentContentIndex];
    const duration = (currentItem?.displayDuration || 10) * 1000;

    const timer = setTimeout(() => {
      setCurrentContentIndex((prev) => (prev + 1) % content.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [content, currentContentIndex]);

  // Cargar pantalla y configurar heartbeat
  useEffect(() => {
    loadScreen();

    // Heartbeat cada 30 segundos
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);

    // Recargar notificaciones cada 5 minutos
    const notificationsInterval = setInterval(() => {
      if (screen?.area) {
        loadNotifications(screen.area.id);
      }
    }, 300000);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(notificationsInterval);
    };
  }, [loadScreen, sendHeartbeat, screen]);

  // Renderizar contenido según tipo
  const renderContent = (item: Content) => {
    switch (item.type) {
      case 'IMAGE':
        return (
          <img
            src={item.url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        );
      
      case 'VIDEO':
        return (
          <video
            src={item.url}
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
          />
        );
      
      case 'HTML':
        return (
          <iframe
            src={item.url}
            className="w-full h-full border-0"
            title={item.name}
          />
        );
      
      case 'PRESENTATION':
        return (
          <iframe
            src={item.url}
            className="w-full h-full border-0"
            title={item.name}
          />
        );
      
      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#254D6E] to-[#1a3a52]">
            <p className="text-2xl text-[#EDECE4]/60">Tipo de contenido no soportado</p>
          </div>
        );
    }
  };

  // Obtener color de notificación
  const getNotificationColor = (type: string) => {
    switch(type) {
      case 'alert': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'success': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #254D6E 0%, #1a3a52 100%)'
      }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#B88F69] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#EDECE4] text-lg">Cargando pantalla...</p>
        </div>
      </div>
    );
  }

  if (error || !screen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
      }}>
        <div className="backdrop-blur-2xl rounded-[32px] p-12 max-w-md text-center shadow-2xl border border-white/20" style={{
          background: 'rgba(139, 0, 0, 0.3)'
        }}>
          <svg className="w-20 h-20 mx-auto text-white mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-white/80">{error || 'Error al cargar pantalla'}</p>
          <p className="text-sm text-white/60 mt-4">Código: {code}</p>
        </div>
      </div>
    );
  }

  if (!screen.approved) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
      }}>
        <div className="backdrop-blur-2xl rounded-[32px] p-12 max-w-md text-center shadow-2xl border border-white/20" style={{
          background: 'rgba(217, 119, 6, 0.3)'
        }}>
          <svg className="w-20 h-20 mx-auto text-white mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2">Pendiente de Aprobación</h2>
          <p className="text-white/80 mb-6">
            Esta pantalla está registrada pero aún no ha sido aprobada por el administrador.
          </p>
          <div className="backdrop-blur-xl rounded-2xl p-4 border border-white/30" style={{
            background: 'rgba(255, 255, 255, 0.2)'
          }}>
            <p className="text-sm text-white/70 mb-1">Código de pantalla:</p>
            <p className="text-2xl font-bold text-white">{code}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentContent = content[currentContentIndex];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Contenido principal */}
      <div className="absolute inset-0">
        {content.length > 0 && currentContent ? (
          renderContent(currentContent)
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #254D6E 0%, #1a3a52 50%, #0f2738 100%)'
          }}>
            <div className="text-center p-12">
              <svg className="w-32 h-32 mx-auto mb-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h2 className="text-4xl font-bold mb-4" style={{ color: '#EDECE4' }}>{screen.name}</h2>
              <p className="text-xl mb-2" style={{ color: '#B88F69' }}>{screen.area.name}</p>
              <p className="text-white/50">En espera de contenido...</p>
            </div>
          </div>
        )}
      </div>

      {/* Notificaciones flotantes */}
      {notifications.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 p-6 space-y-4 pointer-events-none">
          {notifications.slice(0, 2).map((notification) => (
            <div
              key={notification.id}
              className={`${getNotificationColor(notification.type)} text-white rounded-2xl p-6 shadow-2xl animate-slide-down backdrop-blur-md bg-opacity-95`}
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl flex-shrink-0">
                  {notification.type === 'alert' ? '🚨' : 
                   notification.type === 'warning' ? '⚠️' : 
                   notification.type === 'success' ? '✅' : 'ℹ️'}
                </span>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{notification.title}</h3>
                  <p className="text-lg opacity-90">{notification.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Indicador de contenido (puntos) */}
      {content.length > 1 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 flex gap-3">
          {content.map((_, index) => (
            <div
              key={index}
              className={`rounded-full transition-all duration-300 ${
                index === currentContentIndex
                  ? 'w-8 h-3 bg-white'
                  : 'w-3 h-3 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Info de pantalla (esquina) */}
      <div className="fixed bottom-6 right-6 z-40 backdrop-blur-xl rounded-2xl px-4 py-2 text-xs opacity-50 hover:opacity-100 transition-opacity border border-white/20" style={{
        background: 'rgba(255, 255, 255, 0.1)'
      }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span style={{ color: '#EDECE4' }}>{screen.name} • {code}</span>
        </div>
      </div>
    </div>
  );
};

export default Player;