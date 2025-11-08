// frontend/src/pages/Content.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Content {
  id: number;
  name: string;
  description: string | null;
  type: 'IMAGE' | 'VIDEO' | 'PRESENTATION' | 'HTML';
  url: string;
  fileSize: number | null;
  duration: number | null;
  areaId: number | null;
  active: boolean;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  area?: {
    id: number;
    name: string;
  };
  screens?: Array<{
    screen: {
      id: number;
      name: string;
      code: string;
    };
  }>;
}

interface Area {
  id: number;
  name: string;
}

const Content = () => {
  const [content, setContent] = useState<Content[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'IMAGE' as Content['type'],
    url: '',
    fileSize: '',
    duration: '',
    areaId: ''
  });

  useEffect(() => {
    loadContent();
    loadAreas();
  }, []);

  const loadContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContent(response.data);
    } catch (error) {
      console.error('Error al cargar contenido:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const data = {
        ...formData,
        fileSize: formData.fileSize ? parseInt(formData.fileSize) : null,
        duration: formData.duration ? parseInt(formData.duration) : null,
        areaId: formData.areaId ? parseInt(formData.areaId) : null
      };

      if (editingId) {
        await axios.put(`${API_URL}/api/content/${editingId}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/content`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        type: 'IMAGE',
        url: '',
        fileSize: '',
        duration: '',
        areaId: ''
      });
      loadContent();
    } catch (error) {
      console.error('Error al guardar contenido:', error);
    }
  };

  const handleEdit = (item: Content) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      description: item.description || '',
      type: item.type,
      url: item.url,
      fileSize: item.fileSize?.toString() || '',
      duration: item.duration?.toString() || '',
      areaId: item.areaId?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este contenido?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/content/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadContent();
    } catch (error) {
      console.error('Error al eliminar contenido:', error);
    }
  };

  const toggleActive = async (id: number, active: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const item = content.find(c => c.id === id);
      if (!item) return;

      await axios.put(`${API_URL}/api/content/${id}`, 
        { ...item, active: !active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadContent();
    } catch (error) {
      console.error('Error al actualizar contenido:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'IMAGE': return '🖼️';
      case 'VIDEO': return '🎥';
      case 'PRESENTATION': return '📊';
      case 'HTML': return '🌐';
      default: return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'IMAGE': return 'bg-blue-500/10 text-blue-600';
      case 'VIDEO': return 'bg-purple-500/10 text-purple-600';
      case 'PRESENTATION': return 'bg-green-500/10 text-green-600';
      case 'HTML': return 'bg-orange-500/10 text-orange-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Contenido</h1>
          <p className="text-primary/60">Gestiona el contenido multimedia de tus pantallas</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              name: '',
              description: '',
              type: 'IMAGE',
              url: '',
              fileSize: '',
              duration: '',
              areaId: ''
            });
            setShowModal(true);
          }}
          className="btn-primary"
        >
          + Agregar Contenido
        </button>
      </div>

      {/* Lista de contenido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {content.map((item) => (
          <div
            key={item.id}
            className="glass-card rounded-2xl p-6 hover:scale-105 transition-all duration-300 animate-slide-up"
          >
            {/* Preview */}
            <div className="aspect-video bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
              {item.type === 'IMAGE' ? (
                <img 
                  src={item.url} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-4xl">🖼️</span>';
                  }}
                />
              ) : (
                <span className="text-6xl">{getTypeIcon(item.type)}</span>
              )}
            </div>

            {/* Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-primary text-lg mb-1">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-primary/60 line-clamp-2">{item.description}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getTypeColor(item.type)}`}>
                  {item.type}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-primary/60">
                {item.area && (
                  <span className="px-2 py-1 bg-secondary/10 rounded-lg">
                    {item.area.name}
                  </span>
                )}
                {item.duration && (
                  <span className="px-2 py-1 bg-primary/5 rounded-lg">
                    {item.duration}s
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-primary/10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(item.id, item.active)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      item.active ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      item.active ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className={`text-xs font-medium ${item.active ? 'text-green-600' : 'text-gray-500'}`}>
                    {item.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 hover:bg-secondary/20 rounded-lg transition-colors"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {content.length === 0 && (
        <div className="text-center py-12 text-primary/60">
          <p className="text-lg mb-2">No hay contenido agregado</p>
          <p className="text-sm">Comienza agregando tu primer contenido multimedia</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <h2 className="text-2xl font-bold text-primary mb-6">
              {editingId ? 'Editar Contenido' : 'Nuevo Contenido'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Ej: Video Bienvenida"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Descripción opcional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Tipo *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Content['type'] })}
                    className="input-field"
                  >
                    <option value="IMAGE">Imagen</option>
                    <option value="VIDEO">Video</option>
                    <option value="PRESENTATION">Presentación</option>
                    <option value="HTML">HTML/Web</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Área</label>
                  <select
                    value={formData.areaId}
                    onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Global (todas las áreas)</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">URL *</label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Duración (segundos)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="input-field"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Tamaño (bytes)</label>
                  <input
                    type="number"
                    value={formData.fileSize}
                    onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                    className="input-field"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  {editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Content;