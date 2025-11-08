// frontend/src/pages/ScreenMonitor.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Screen {
  id: number;
  name: string;
  code: string;
  location: string | null;
  online: boolean;
  currentContent: string | null;
  area: {
    name: string;
  };
}

interface Area {
  id: number;
  name: string;
}

const ScreenMonitor = () => {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScreens();
    loadAreas();

    // Actualizar cada 10 segundos
    const interval = setInterval(loadScreens, 10000);
    return () => clearInterval(interval);
  }, [selectedArea]);

  const loadScreens = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/screens`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let filteredScreens = response.data;
      if (selectedArea) {
        filteredScreens = filteredScreens.filter((s: Screen) => 
          s.area && (s.area as any).id === selectedArea
        );
      }
      
      setScreens(filteredScreens);
    } catch (error) {
      console.error('Error al cargar pantallas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAreas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/areas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAreas(response.data);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
    }
  };

  const openPlayerPreview = (code: string) => {
    window.open(`/player/${code}`, '_blank', 'width=1280,height=720');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="loading-spinner" />
      </div>
    );
  }

  const onlineScreens = screens.filter(s => s.online);
  const offlineScreens = screens.filter(s => !s.online);

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Monitor de Pantallas</h1>
          <p className="text-primary/60">Vista en tiempo real de todas las pantallas activas</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Filtro por área */}
          <select
            value={selectedArea || ''}
            onChange={(e) => setSelectedArea(e.target.value ? parseInt(e.target.value) : null)}
            className="input-field w-64"
          >
            <option value="">Todas las áreas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>{area.name}</option>
            ))}
          </select>

          {/* Estadísticas rápidas */}
          <div className="glass-card rounded-xl px-4 py-2 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-primary">{onlineScreens.length} Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-medium text-primary">{offlineScreens.length} Offline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pantallas Online */}
      {onlineScreens.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            Pantallas Activas ({onlineScreens.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {onlineScreens.map((screen) => (
              <div
                key={screen.id}
                className="glass-card rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 animate-slide-up cursor-pointer group"
                onClick={() => openPlayerPreview(screen.code)}
              >
                {/* Preview simulado */}
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <iframe
                      src={`/player/${screen.code}`}
                      className="w-full h-full border-0 pointer-events-none"
                      title={screen.name}
                    />
                  </div>
                  
                  {/* Overlay al hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-center">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <p className="text-sm font-medium">Click para vista completa</p>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary">{screen.name}</h3>
                      <p className="text-xs text-primary/60">{screen.code}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-secondary/10 rounded-lg text-primary/70">
                      {screen.area.name}
                    </span>
                    {screen.location && (
                      <span className="px-2 py-1 bg-primary/5 rounded-lg text-primary/70">
                        📍 {screen.location}
                      </span>
                    )}
                  </div>

                  {screen.currentContent && (
                    <p className="text-xs text-primary/50 truncate">
                      ▶️ {screen.currentContent}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pantallas Offline */}
      {offlineScreens.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            Pantallas Inactivas ({offlineScreens.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {offlineScreens.map((screen) => (
              <div
                key={screen.id}
                className="glass-card rounded-2xl overflow-hidden opacity-60 animate-slide-up"
              >
                {/* Preview deshabilitado */}
                <div className="aspect-video bg-gradient-to-br from-gray-500/10 to-gray-600/10 flex items-center justify-center">
                  <div className="text-center text-primary/40">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Offline</p>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary">{screen.name}</h3>
                      <p className="text-xs text-primary/60">{screen.code}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-secondary/10 rounded-lg text-primary/70">
                      {screen.area.name}
                    </span>
                    {screen.location && (
                      <span className="px-2 py-1 bg-primary/5 rounded-lg text-primary/70">
                        📍 {screen.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {screens.length === 0 && (
        <div className="text-center py-12 text-primary/60">
          <p className="text-lg mb-2">No hay pantallas {selectedArea ? 'en esta área' : 'registradas'}</p>
          <p className="text-sm">Las pantallas aparecerán aquí cuando estén activas</p>
        </div>
      )}
    </div>
  );
};

export default ScreenMonitor;