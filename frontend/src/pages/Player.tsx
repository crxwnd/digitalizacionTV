// frontend/src/pages/Player.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';

interface ScreenData {
  id: number;
  code: string;
  name: string;
  online: boolean;
  approved: boolean;
  currentContent: any;
  area?: {
    id: number;
    name: string;
  };
}

interface NotificationData {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  duration: number;
}

const Player: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [screen, setScreen] = useState<ScreenData | null>(null);
  const [currentContent, setCurrentContent] = useState<any>(null);
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const socketRef = useRef<Socket | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const notificationTimeout = useRef<NodeJS.Timeout | null>(null);

  // Función para enviar heartbeat
  const sendHeartbeat = async () => {
    if (!code) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/screens/heartbeat/${code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentContent: currentContent,
          status: 'active',
        }),
      });

      if (!response.ok) {
        throw new Error(`Heartbeat failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('💓 Heartbeat enviado exitosamente:', new Date().toLocaleTimeString());
      
      // Actualizar información de la pantalla si cambió
      if (data.screen) {
        setScreen(prev => ({ ...prev, ...data.screen }));
      }
    } catch (err) {
      console.error('❌ Error al enviar heartbeat:', err);
      setConnectionStatus('disconnected');
    }
  };

  // Función para obtener información inicial de la pantalla
  const fetchScreenInfo = async () => {
    if (!code) return;

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/screens/code/${code}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Pantalla no encontrada. Verifica el código.');
        }
        throw new Error(`Error al obtener información: ${response.status}`);
      }

      const data = await response.json();
      setScreen(data);
      
      if (!data.approved) {
        setError('Esta pantalla aún no ha sido aprobada por el administrador.');
        return;
      }

      if (data.currentContent) {
        const content = typeof data.currentContent === 'string' 
          ? JSON.parse(data.currentContent) 
          : data.currentContent;
        setCurrentContent(content);
      }

      setError(null);
      setConnectionStatus('connected');
    } catch (err: any) {
      console.error('Error al obtener información de la pantalla:', err);
      setError(err.message || 'Error al conectar con el servidor');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  // Configurar WebSocket
  useEffect(() => {
    if (!code) return;

    // Obtener información inicial
    fetchScreenInfo();

    // Conectar WebSocket
    const socket = io(import.meta.env.VITE_WS_URL || 'ws://localhost:5000', {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 WebSocket conectado');
      setConnectionStatus('connected');
      
      // Unirse a la sala de la pantalla
      socket.emit('join-screen', code);
      
      // Unirse a la sala del área si existe
      if (screen?.area?.id) {
        socket.emit('join-area', screen.area.id);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      setConnectionStatus('disconnected');
    });

    // Escuchar cambios de contenido
    socket.on('content-updated', (content: any) => {
      console.log('📺 Contenido actualizado:', content);
      setCurrentContent(content);
    });

    socket.on('content-change', (content: any) => {
      console.log('🔄 Cambio inmediato de contenido:', content);
      setCurrentContent(content);
    });

    // Escuchar notificaciones
    socket.on('notification-received', (notif: NotificationData) => {
      console.log('📢 Notificación recibida:', notif);
      showNotification(notif);
    });

    socket.on('urgent-notification', (notif: NotificationData) => {
      console.log('🚨 Notificación urgente:', notif);
      showNotification(notif);
    });

    socket.on('emergency-alert', (alert: NotificationData) => {
      console.log('🚨 ALERTA DE EMERGENCIA:', alert);
      showNotification({ ...alert, duration: 60, priority: 'URGENT' });
    });

    // Control remoto
    socket.on('remote-control', (command: any) => {
      console.log('🎮 Comando remoto recibido:', command);
      handleRemoteControl(command);
    });

    // Solicitud de captura de pantalla
    socket.on('request-capture', () => {
      console.log('📸 Solicitud de captura recibida');
      captureAndSendScreenshot();
    });

    // Configurar heartbeat cada 30 segundos
    heartbeatInterval.current = setInterval(sendHeartbeat, 30000);
    
    // Enviar primer heartbeat inmediatamente
    sendHeartbeat();

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      if (notificationTimeout.current) {
        clearTimeout(notificationTimeout.current);
      }
      if (socket) {
        socket.disconnect();
      }
    };
  }, [code]);

  // Mostrar notificación
  const showNotification = (notif: NotificationData) => {
    setNotification(notif);
    
    // Auto-ocultar después de la duración especificada
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
    }
    
    notificationTimeout.current = setTimeout(() => {
      setNotification(null);
    }, (notif.duration || 30) * 1000);
  };

  // Manejar control remoto
  const handleRemoteControl = (command: any) => {
    switch (command.action) {
      case 'refresh':
        window.location.reload();
        break;
      case 'changeContent':
        setCurrentContent(command.data);
        break;
      case 'play':
      case 'pause':
      case 'stop':
        // Manejar controles de reproducción
        const video = document.querySelector('video');
        if (video) {
          if (command.action === 'play') video.play();
          if (command.action === 'pause') video.pause();
          if (command.action === 'stop') {
            video.pause();
            video.currentTime = 0;
          }
        }
        break;
      case 'volume':
        const audioElements = document.querySelectorAll('video, audio');
        audioElements.forEach((el: any) => {
          el.volume = command.data.level / 100;
        });
        break;
    }
  };

  // Capturar y enviar screenshot
  const captureAndSendScreenshot = async () => {
    try {
      // Implementar captura usando html2canvas si es necesario
      // Por ahora, enviar confirmación
      if (socketRef.current && code) {
        socketRef.current.emit(`capture-${code}`, {
          status: 'success',
          timestamp: new Date(),
          message: 'Captura simulada',
        });
      }
    } catch (error) {
      console.error('Error al capturar pantalla:', error);
    }
  };

  // Renderizar contenido
  const renderContent = () => {
    if (!currentContent) {
      return (
        <div className="flex items-center justify-center h-full glass-card-dark p-8 rounded-2xl">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-primary mb-2">Sin contenido</h2>
            <p className="text-primary/60">Esperando contenido del administrador...</p>
          </div>
        </div>
      );
    }

    // Renderizar según el tipo de contenido
    if (currentContent.type === 'content') {
      const fileUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${currentContent.url}`;
      const fileExt = currentContent.url?.split('.').pop()?.toLowerCase();

      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt || '')) {
        return <img src={fileUrl} alt={currentContent.title} className="w-full h-full object-contain" />;
      }

      if (['mp4', 'webm', 'ogg'].includes(fileExt || '')) {
        return (
          <video 
            src={fileUrl} 
            className="w-full h-full object-contain"
            autoPlay 
            loop 
            muted
            playsInline
          />
        );
      }

      if (fileExt === 'pdf') {
        return (
          <iframe
            src={fileUrl}
            className="w-full h-full"
            title={currentContent.title}
          />
        );
      }
    }

    if (currentContent.type === 'playlist') {
      // Implementar lógica de playlist
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-2xl text-primary">Reproduciendo playlist: {currentContent.id}</p>
        </div>
      );
    }

    if (currentContent.type === 'url') {
      return (
        <iframe
          src={currentContent.url}
          className="w-full h-full"
          title="Contenido web"
        />
      );
    }

    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xl text-primary/60">Tipo de contenido no reconocido</p>
      </div>
    );
  };

  // Estados de carga y error
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-white text-xl">Conectando con el servidor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center p-8">
        <div className="glass-card max-w-md w-full p-8 rounded-2xl text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">ERROR</h2>
          <p className="text-primary/80 mb-4">{error}</p>
          <p className="text-sm text-primary/60">Código: {code}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-neutral-lighter overflow-hidden">
      {/* Indicador de estado */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500' :
          connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
          'bg-red-500'
        }`} />
        <span className="text-xs text-primary/60 font-medium">
          {screen?.name || code}
        </span>
      </div>

      {/* Contenido principal */}
      <div className="w-full h-full">
        {renderContent()}
      </div>

      {/* Notificación overlay */}
      {notification && (
        <div className={`absolute inset-x-0 top-0 z-[100] p-8 animate-in ${
          notification.priority === 'URGENT' || notification.type === 'EMERGENCY'
            ? 'bg-red-600/95'
            : notification.type === 'WARNING'
            ? 'bg-yellow-500/95'
            : 'bg-primary/95'
        }`}>
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-2">{notification.title}</h2>
            <p className="text-xl">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;
