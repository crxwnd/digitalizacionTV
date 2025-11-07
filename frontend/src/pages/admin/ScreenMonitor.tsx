// frontend/src/pages/admin/ScreenMonitor.tsx
import React, { useState, useEffect, useRef } from 'react';
import { monitorAPI, screensAPI } from '../../services/api';
import { io, Socket } from 'socket.io-client';

interface ScreenStatus {
  code: string;
  name: string;
  area: string;
  status: 'online' | 'warning' | 'offline';
  lastSeen: string;
  ipAddress: string;
  currentContent: any;
}

interface AreaMonitor {
  areaId: number;
  areaName: string;
  screens: ScreenStatus[];
  totalScreens: number;
  onlineScreens: number;
  offlineScreens: number;
}

const ScreenMonitor: React.FC = () => {
  const [areas, setAreas] = useState<AreaMonitor[]>([]);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [selectedScreen, setSelectedScreen] = useState<ScreenStatus | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMonitorData();
    
    // Conectar WebSocket
    const socket = io(import.meta.env.VITE_WS_URL || 'ws://localhost:5000');
    socketRef.current = socket;

    socket.on('screen-status-update', (data) => {
      console.log('Estado de pantalla actualizado:', data);
      loadMonitorData();
    });

    socket.on('screen-approved', () => {
      loadMonitorData();
    });

    // Auto-refresh cada 5 segundos si está activado
    if (autoRefresh) {
      refreshInterval.current = setInterval(loadMonitorData, 5000);
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
      socket.disconnect();
    };
  }, [autoRefresh]);

  const loadMonitorData = async () => {
    try {
      const response = await monitorAPI.getGlobal();
      setAreas(response.data.areas.map((area: any) => ({
        areaId: area.id,
        areaName: area.name,
        screens: area.screens,
        totalScreens: area.totalScreens,
        onlineScreens: area.onlineScreens,
        offlineScreens: area.offlineScreens,
      })));
    } catch (error) {
      console.error('Error al cargar datos del monitor:', error);
    }
  };

  const handleRemoteControl = async (screenCode: string, action: string, data?: any) => {
    try {
      await monitorAPI.remoteControl(screenCode, { action, data });
      console.log(`Control remoto: ${action} en ${screenCode}`);
    } catch (error) {
      console.error('Error en control remoto:', error);
    }
  };

  const handleEmergencyAlert = async () => {
    if (!confirm('¿Enviar alerta de emergencia a TODAS las pantallas?')) return;

    const message = prompt('Mensaje de emergencia:');
    if (!message) return;

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: '🚨 ALERTA DE EMERGENCIA',
          message,
        }),
      });
      alert('¡Alerta de emergencia enviada a todas las pantallas!');
    } catch (error) {
      console.error('Error al enviar alerta:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500 animate-pulse';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'offline':
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Vista de cuadrícula de 4 pantallas (estilo cámaras de seguridad)
  const renderGridView = (area: AreaMonitor) => (
    <div className="grid grid-cols-2 gap-4">
      {area.screens.slice(0, 4).map((screen) => (
        <div
          key={screen.code}
          className="glass-card rounded-xl overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
          onClick={() => setSelectedScreen(screen)}
        >
          {/* Header de la pantalla */}
          <div className="bg-primary/90 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(screen.status)}`} />
              <span className="font-medium text-sm">{screen.name}</span>
            </div>
            <span className="text-xs opacity-75">{screen.lastSeen}</span>
          </div>

          {/* Vista previa del contenido */}
          <div className="relative bg-black aspect-video">
            {screen.status === 'online' ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-green-400 text-sm font-medium">EN LÍNEA</p>
                  {screen.currentContent && (
                    <p className="text-white/60 text-xs mt-1">
                      {screen.currentContent.title || 'Reproduciendo contenido'}
                    </p>
                  )}
                </div>
              </div>
            ) : screen.status === 'warning' ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse">
                    <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-yellow-400 text-sm font-medium">CONEXIÓN INESTABLE</p>
                  <p className="text-white/60 text-xs mt-1">Último contacto: {screen.lastSeen}</p>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900/20">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a4.977 4.977 0 016.586 0" />
                    </svg>
                  </div>
                  <p className="text-red-400 text-sm font-medium">SIN CONEXIÓN</p>
                  <p className="text-white/60 text-xs mt-1">{screen.ipAddress}</p>
                </div>
              </div>
            )}

            {/* Overlay de información */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="flex items-center justify-between text-white/80 text-xs">
                <span>{screen.area}</span>
                <span>{screen.code}</span>
              </div>
            </div>
          </div>

          {/* Controles rápidos */}
          <div className="bg-primary/5 px-4 py-2 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoteControl(screen.code, 'refresh');
                }}
                className="p-1.5 rounded hover:bg-primary/10 transition-colors"
                title="Refrescar"
              >
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoteControl(screen.code, 'play');
                }}
                className="p-1.5 rounded hover:bg-primary/10 transition-colors"
                title="Reproducir"
              >
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoteControl(screen.code, 'stop');
                }}
                className="p-1.5 rounded hover:bg-primary/10 transition-colors"
                title="Detener"
              >
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            </div>
            {getStatusIcon(screen.status)}
          </div>
        </div>
      ))}
      
      {/* Placeholder si hay menos de 4 pantallas */}
      {area.screens.length < 4 && Array.from({ length: 4 - area.screens.length }).map((_, i) => (
        <div key={`placeholder-${i}`} className="glass-card rounded-xl overflow-hidden opacity-50">
          <div className="bg-primary/30 text-white/60 px-4 py-2">
            <span className="text-sm">Sin pantalla</span>
          </div>
          <div className="bg-black/30 aspect-video flex items-center justify-center">
            <svg className="w-12 h-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-light p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 rounded-2xl mb-8 bg-white/95">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                Monitor de Pantallas
              </h1>
              <p className="text-primary/60">
                Vista en tiempo real de todas las pantallas del sistema
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Auto-refresh toggle */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="text-sm text-primary">Auto-actualizar</span>
              </label>

              {/* Vista toggle */}
              <div className="flex bg-white/50 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-primary/60 hover:text-primary'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-primary/60 hover:text-primary'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Botón de emergencia */}
              <button
                onClick={handleEmergencyAlert}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Alerta de Emergencia
              </button>
            </div>
          </div>

          {/* Estadísticas globales */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-green-600 text-sm">En línea</span>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {areas.reduce((acc, area) => acc + area.onlineScreens, 0)}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-yellow-600 text-sm">Advertencia</span>
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
              </div>
              <p className="text-2xl font-bold text-yellow-700 mt-1">
                {areas.reduce((acc, area) => 
                  acc + area.screens.filter(s => s.status === 'warning').length, 0
                )}
              </p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-red-600 text-sm">Sin conexión</span>
                <div className="w-3 h-3 bg-red-500 rounded-full" />
              </div>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {areas.reduce((acc, area) => acc + area.offlineScreens, 0)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-blue-600 text-sm">Total</span>
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {areas.reduce((acc, area) => acc + area.totalScreens, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Monitores por área */}
        <div className="space-y-8">
          {areas.map((area) => (
            <div key={area.areaId} className="glass-card p-6 rounded-2xl bg-white/95">
              {/* Header del área */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-primary">
                    {area.areaName}
                  </h2>
                  <p className="text-primary/60 text-sm mt-1">
                    {area.onlineScreens} de {area.totalScreens} pantallas en línea
                  </p>
                </div>
                
                {area.screens.length > 4 && (
                  <button
                    onClick={() => setSelectedArea(area.areaId)}
                    className="text-primary hover:text-primary-light transition-colors flex items-center gap-1"
                  >
                    <span>Ver todas</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Vista de pantallas */}
              {viewMode === 'grid' ? (
                renderGridView(area)
              ) : (
                <div className="space-y-3">
                  {area.screens.map((screen) => (
                    <div
                      key={screen.code}
                      className="flex items-center justify-between p-4 rounded-xl border border-neutral-light hover:border-primary/30 transition-all cursor-pointer"
                      onClick={() => setSelectedScreen(screen)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(screen.status)}`} />
                        <div>
                          <p className="font-medium text-primary">{screen.name}</p>
                          <p className="text-sm text-primary/60">{screen.code} • {screen.ipAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-primary/60">{screen.lastSeen}</span>
                        {getStatusIcon(screen.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal de detalles de pantalla */}
        {selectedScreen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-8">
            <div className="glass-card bg-white max-w-2xl w-full p-8 rounded-2xl">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-primary">{selectedScreen.name}</h3>
                  <p className="text-primary/60">{selectedScreen.code}</p>
                </div>
                <button
                  onClick={() => setSelectedScreen(null)}
                  className="p-2 rounded-lg hover:bg-neutral-light transition-colors"
                >
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-primary/60 mb-1">Estado</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedScreen.status)}`} />
                      <span className="font-medium text-primary capitalize">{selectedScreen.status}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-primary/60 mb-1">Último contacto</p>
                    <p className="font-medium text-primary">{selectedScreen.lastSeen}</p>
                  </div>
                  <div>
                    <p className="text-sm text-primary/60 mb-1">Dirección IP</p>
                    <p className="font-medium text-primary">{selectedScreen.ipAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-primary/60 mb-1">Área</p>
                    <p className="font-medium text-primary">{selectedScreen.area}</p>
                  </div>
                </div>

                {selectedScreen.currentContent && (
                  <div>
                    <p className="text-sm text-primary/60 mb-2">Contenido actual</p>
                    <div className="p-4 bg-neutral-lighter rounded-xl">
                      <p className="font-medium text-primary">
                        {selectedScreen.currentContent.title || 'Contenido sin título'}
                      </p>
                      <p className="text-sm text-primary/60 mt-1">
                        Tipo: {selectedScreen.currentContent.type}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      handleRemoteControl(selectedScreen.code, 'refresh');
                      setSelectedScreen(null);
                    }}
                    className="btn-primary flex-1"
                  >
                    Refrescar pantalla
                  </button>
                  <button
                    onClick={() => {
                      handleRemoteControl(selectedScreen.code, 'restart');
                      setSelectedScreen(null);
                    }}
                    className="btn-secondary flex-1"
                  >
                    Reiniciar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenMonitor;