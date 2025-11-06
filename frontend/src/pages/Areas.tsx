// frontend/src/pages/Areas.tsx
import React, { useEffect, useState } from 'react';
import { areasAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Area {
  id: number;
  name: string;
  description: string | null;
  manager: {
    id: number;
    name: string;
    email: string;
  };
  screens: Array<{
    id: number;
    name: string;
    code: string;
    online: boolean;
  }>;
}

interface Manager {
  id: number;
  name: string;
  email: string;
}

const Areas: React.FC = () => {
  const { isAdmin } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [areasRes, managersRes] = await Promise.all([
        areasAPI.getAll(),
        isAdmin ? usersAPI.getAll() : Promise.resolve({ data: [] }),
      ]);
      
      setAreas(areasRes.data);
      
      if (isAdmin) {
        const managersList = managersRes.data.filter((u: any) => u.role === 'MANAGER');
        setManagers(managersList);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta área?')) return;

    try {
      await areasAPI.delete(id);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar área');
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary">Áreas</h2>
          <p className="text-sm text-primary/60 mt-1">
            Organiza las pantallas por áreas
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingArea(null);
              setShowModal(true);
            }}
            className="btn-primary"
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nueva Área
          </button>
        )}
      </div>

      {/* Grid de áreas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areas.map((area) => (
          <div key={area.id} className="glass-card rounded-2xl p-6 hover:shadow-xl transition-all">
            {/* Header del card */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-primary mb-1">
                  {area.name}
                </h3>
                {area.description && (
                  <p className="text-sm text-primary/60">
                    {area.description}
                  </p>
                )}
              </div>
              {isAdmin && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      setEditingArea(area);
                      setShowModal(true);
                    }}
                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(area.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Manager */}
            <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-neutral-light/50">
              <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary-light rounded-xl flex items-center justify-center text-white font-semibold">
                {area.manager.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">
                  {area.manager.name}
                </p>
                <p className="text-xs text-primary/60 truncate">
                  {area.manager.email}
                </p>
              </div>
            </div>

            {/* Estadísticas de pantallas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary/70">Total de Pantallas</span>
                <span className="font-semibold text-primary">{area.screens.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary/70">Online</span>
                <span className="font-semibold text-green-600">
                  {area.screens.filter(s => s.online).length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary/70">Offline</span>
                <span className="font-semibold text-red-600">
                  {area.screens.filter(s => !s.online).length}
                </span>
              </div>
            </div>

            {/* Lista de pantallas */}
            {area.screens.length > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-light/50">
                <p className="text-xs font-medium text-primary/60 mb-2">Pantallas:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {area.screens.map((screen) => (
                    <div
                      key={screen.id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/30"
                    >
                      <span className="text-primary truncate">{screen.name}</span>
                      <span className={`badge ${screen.online ? 'badge-success' : 'badge-error'}`}>
                        {screen.online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {areas.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-primary/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-primary/60">No hay áreas registradas</p>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary mt-4"
            >
              Crear primera área
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AreaModal
          area={editingArea}
          managers={managers}
          onClose={() => {
            setShowModal(false);
            setEditingArea(null);
          }}
          onSave={() => {
            loadData();
            setShowModal(false);
            setEditingArea(null);
          }}
        />
      )}
    </div>
  );
};

// Modal Component
const AreaModal: React.FC<{
  area: Area | null;
  managers: Manager[];
  onClose: () => void;
  onSave: () => void;
}> = ({ area, managers, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: area?.name || '',
    description: area?.description || '',
    managerId: area?.manager.id || (managers[0]?.id || 0),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (area) {
        await areasAPI.update(area.id, formData);
      } else {
        await areasAPI.create(formData);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar área');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card rounded-2xl p-8 max-w-md w-full animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-primary mb-6">
          {area ? 'Editar Área' : 'Nueva Área'}
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary/80 mb-2">
              Nombre del área
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-glass"
              placeholder="Ej: Recepción, Lobby, Sala de Espera"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary/80 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-glass"
              rows={3}
              placeholder="Descripción del área..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary/80 mb-2">
              Manager asignado
            </label>
            <select
              value={formData.managerId}
              onChange={(e) => setFormData({ ...formData, managerId: parseInt(e.target.value) })}
              className="input-glass"
              required
            >
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name} ({manager.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Areas;