// frontend/src/pages/Screens.tsx
import React, { useEffect, useState } from 'react';
import { screensAPI, areasAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Screen {
  id: number;
  name: string;
  code: string;
  ip: string | null;
  areaId: number;
  area: {
    name: string;
  };
  approved: boolean;
  online: boolean;
  lastHeartbeat: string | null;
  currentContent: string | null;
  createdAt: string;
}

interface Area {
  id: number;
  name: string;
}

const Screens: React.FC = () => {
  const { isAdmin } = useAuth();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'pending'>('all');

  const [formData, setFormData] = useState({
    name: '',
    ip: '',
    areaId: '',
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [screensRes, areasRes] = await Promise.all([
        screensAPI.getAll(),
        areasAPI.getAll(),
      ]);

      setScreens(screensRes.data);
      setAreas(areasRes.data);
    } catch (error) {
      console.error('Error al cargar pantallas:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (screen?: Screen) => {
    if (screen) {
      setEditingScreen(screen);
      setFormData({
        name: screen.name,
        ip: screen.ip || '',
        areaId: screen.areaId.toString(),
      });
    } else {
      setEditingScreen(null);
      setFormData({ name: '', ip: '', areaId: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingScreen(null);
    setFormData({ name: '', ip: '', areaId: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingScreen) {
        await screensAPI.update(editingScreen.id, {
          ...formData,
          areaId: parseInt(formData.areaId),
        });
      } else {
        await screensAPI.create({
          ...formData,
          areaId: parseInt(formData.areaId),
        });
      }

      await loadData();
      closeModal();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar pantalla');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta pantalla?')) return;

    try {
      await screensAPI.delete(id);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar pantalla');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await screensAPI.approve(id);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al aprobar pantalla');
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm('¿Estás seguro de rechazar esta pantalla?')) return;

    try {
      await screensAPI.reject(id);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al rechazar pantalla');
    }
  };

  const filteredScreens = screens.filter((screen) => {
    if (filter === 'all') return true;
    if (filter === 'online') return screen.online;
    if (filter === 'offline') return !screen.online;
    if (filter === 'pending') return !screen.approved;
    return true;
  });

  const getTimeSinceLastHeartbeat = (lastHeartbeat: string | null) => {
    if (!lastHeartbeat) return 'Nunca';
    
    const now = new Date().getTime();
    const last = new Date(lastHeartbeat).getTime();
    const diff = Math.floor((now - last) / 1000); // segundos
    
    if (diff < 60) return `Hace ${diff}s`;
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    return `Hace ${Math.floor(diff / 86400)}d`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Código copiado al portapapeles');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Pantallas</h2>
          <p className="text-primary/60 mt-1">Monitorea y gestiona todas las pantallas</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Filters */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-primary text-white shadow-lg'
                  : 'glass-card text-primary/70 hover:text-primary'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('online')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === 'online'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'glass-card text-primary/70 hover:text-primary'
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setFilter('offline')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === 'offline'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'glass-card text-primary/70 hover:text-primary'
              }`}
            >
              Offline
            </button>
            {isAdmin && (
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === 'pending'
                    ? 'bg-yellow-500 text-white shadow-lg'
                    : 'glass-card text-primary/70 hover:text-primary'
                }`}
              >
                Pendientes
              </button>
            )}
          </div>

          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Nueva Pantalla</span>
          </button>
        </div>
      </div>

      {/* Screens Grid */}
      {filteredScreens.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-primary/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-primary/60">No hay pantallas registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredScreens.map((screen) => (
            <div
              key={screen.id}
              className="glass-card rounded-2xl p-6 hover:shadow-xl transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${screen.online ? 'from-green-400 to-green-600' : 'from-red-400 to-red-600'} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary">{screen.name}</h3>
                    <span className="text-xs text-primary/60">{screen.area.name}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex flex-col items-end space-y-2">
                  <span className={`badge ${screen.online ? 'badge-success' : 'badge-error'}`}>
                    {screen.online ? 'Online' : 'Offline'}
                  </span>
                  {!screen.approved && (
                    <span className="badge badge-warning">Pendiente</span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary/70">Código:</span>
                  <button
                    onClick={() => copyToClipboard(screen.code)}
                    className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-white/50 hover:bg-white transition-colors"
                  >
                    <span className="font-mono font-medium text-primary">{screen.code}</span>
                    <svg className="w-4 h-4 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>

                {screen.ip && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary/70">IP:</span>
                    <span className="font-mono text-primary">{screen.ip}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary/70">Última conexión:</span>
                  <span className="text-primary">{getTimeSinceLastHeartbeat(screen.lastHeartbeat)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-4 border-t border-neutral-light/30">
                {isAdmin && !screen.approved && (
                  <>
                    <button
                      onClick={() => handleApprove(screen.id)}
                      className="flex-1 px-4 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-medium text-sm transition-colors"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(screen.id)}
                      className="flex-1 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-medium text-sm transition-colors"
                    >
                      Rechazar
                    </button>
                  </>
                )}

                <button
                  onClick={() => openModal(screen)}
                  className="p-2 rounded-lg bg-white/50 hover:bg-white transition-colors"
                >
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                <button
                  onClick={() => handleDelete(screen.id)}
                  className="p-2 rounded-lg bg-white/50 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="glass-card rounded-2xl p-8 max-w-md w-full animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-primary mb-6">
              {editingScreen ? 'Editar Pantalla' : 'Nueva Pantalla'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Nombre de la Pantalla *
                </label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="Ej: Pantalla Principal Lobby"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  IP Estática (opcional)
                </label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="Ej: 192.168.1.100"
                  value={formData.ip}
                  onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                />
                <p className="text-xs text-primary/50 mt-1">
                  Opcional: Asigna una IP estática para identificación única
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Área *
                </label>
                <select
                  className="input-glass"
                  value={formData.areaId}
                  onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                  required
                >
                  <option value="">Selecciona un área...</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              {!editingScreen && (
                <div className="glass-card-dark rounded-xl p-4 mt-4">
                  <p className="text-sm text-primary mb-2">
                    <strong>Nota:</strong> Después de crear la pantalla, recibirás un código único que deberás usar para acceder al player.
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-ghost flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  {editingScreen ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Screens;