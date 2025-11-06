// frontend/src/pages/Areas.tsx
import React, { useEffect, useState } from 'react';
import { areasAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Area {
  id: number;
  name: string;
  description: string | null;
  managerId: number;
  manager: {
    name: string;
    email: string;
  };
  _count: {
    screens: number;
  };
  createdAt: string;
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
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: '',
  });

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
      console.error('Error al cargar áreas:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (area?: Area) => {
    if (area) {
      setEditingArea(area);
      setFormData({
        name: area.name,
        description: area.description || '',
        managerId: area.managerId.toString(),
      });
    } else {
      setEditingArea(null);
      setFormData({ name: '', description: '', managerId: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingArea(null);
    setFormData({ name: '', description: '', managerId: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingArea) {
        await areasAPI.update(editingArea.id, {
          ...formData,
          managerId: parseInt(formData.managerId),
        });
      } else {
        await areasAPI.create({
          ...formData,
          managerId: parseInt(formData.managerId),
        });
      }
      
      await loadData();
      closeModal();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar área');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta área?')) return;
    
    try {
      await areasAPI.delete(id);
      await loadData();
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Áreas</h2>
          <p className="text-primary/60 mt-1">Gestiona las áreas y sus responsables</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Nueva Área</span>
          </button>
        )}
      </div>

      {/* Areas Grid */}
      {areas.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-primary/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-primary/60">No hay áreas registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((area) => (
            <div
              key={area.id}
              className="glass-card rounded-2xl p-6 hover:shadow-xl transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>

                {isAdmin && (
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal(area)}
                      className="p-2 rounded-lg bg-white/50 hover:bg-white transition-colors"
                    >
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(area.id)}
                      className="p-2 rounded-lg bg-white/50 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold text-primary mb-2">{area.name}</h3>
              
              {area.description && (
                <p className="text-sm text-primary/60 mb-4 line-clamp-2">{area.description}</p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-primary/70">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{area.manager.name}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-primary/70">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{area._count.screens} pantallas</span>
                </div>
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
              {editingArea ? 'Editar Área' : 'Nueva Área'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Nombre del Área *
                </label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="Ej: Restaurante, Lobby, Alberca..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Descripción
                </label>
                <textarea
                  className="input-glass"
                  placeholder="Descripción opcional del área..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Responsable *
                </label>
                <select
                  className="input-glass"
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  required
                >
                  <option value="">Selecciona un responsable...</option>
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
                  onClick={closeModal}
                  className="btn-ghost flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  {editingArea ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Areas;