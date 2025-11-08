// frontend/src/pages/Notifications.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: number;
  active: boolean;
  startDate: string;
  endDate: string | null;
  areaId: number | null;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

interface Area {
  id: number;
  name: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: '1',
    startDate: '',
    endDate: '',
    areaId: ''
  });

  useEffect(() => {
    loadNotifications();
    loadAreas();
  }, []);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
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
        priority: parseInt(formData.priority),
        areaId: formData.areaId ? parseInt(formData.areaId) : null,
        startDate: formData.startDate || new Date().toISOString(),
        endDate: formData.endDate || null
      };

      if (editingId) {
        await axios.put(`${API_URL}/api/notifications/${editingId}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/notifications`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({
        title: '',
        message: '',
        type: 'info',
        priority: '1',
        startDate: '',
        endDate: '',
        areaId: ''
      });
      loadNotifications();
    } catch (error) {
      console.error('Error al guardar notificación:', error);
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditingId(notification.id);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority.toString(),
      startDate: notification.startDate.split('T')[0],
      endDate: notification.endDate ? notification.endDate.split('T')[0] : '',
      areaId: notification.areaId?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta notificación?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadNotifications();
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  };

  const toggleActive = async (id: number, active: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const notification = notifications.find(n => n.id === id);
      if (!notification) return;

      await axios.put(`${API_URL}/api/notifications/${id}`, 
        { ...notification, active: !active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadNotifications();
    } catch (error) {
      console.error('Error al actualizar notificación:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'alert': return '🚨';
      case 'success': return '✅';
      default: return '📢';
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'info': return 'bg-blue-500/10 border-blue-500/20 text-blue-600';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600';
      case 'alert': return 'bg-red-500/10 border-red-500/20 text-red-600';
      case 'success': return 'bg-green-500/10 border-green-500/20 text-green-600';
      default: return 'bg-gray-500/10 border-gray-500/20 text-gray-600';
    }
  };

  const getPriorityBadge = (priority: number) => {
    switch(priority) {
      case 3: return <span className="px-2 py-1 bg-red-500/10 text-red-600 rounded-lg text-xs font-medium">Alta</span>;
      case 2: return <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 rounded-lg text-xs font-medium">Media</span>;
      default: return <span className="px-2 py-1 bg-blue-500/10 text-blue-600 rounded-lg text-xs font-medium">Baja</span>;
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
          <h1 className="text-3xl font-bold text-primary mb-2">Notificaciones</h1>
          <p className="text-primary/60">Gestiona avisos y alertas para tus pantallas</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              title: '',
              message: '',
              type: 'info',
              priority: '1',
              startDate: '',
              endDate: '',
              areaId: ''
            });
            setShowModal(true);
          }}
          className="btn-primary"
        >
          + Nueva Notificación
        </button>
      </div>

      {/* Lista de notificaciones */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`glass-card rounded-2xl p-6 border-2 ${getTypeColor(notification.type)} hover:scale-[1.01] transition-all duration-300 animate-slide-up`}
          >
            <div className="flex items-start justify-between">
              {/* Contenido */}
              <div className="flex items-start gap-4 flex-1">
                <span className="text-3xl">{getTypeIcon(notification.type)}</span>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-primary">{notification.title}</h3>
                    {getPriorityBadge(notification.priority)}
                  </div>
                  
                  <p className="text-primary/80 mb-3">{notification.message}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm text-primary/60">
                    <div className="flex items-center gap-1">
                      <span>📅</span>
                      <span>{new Date(notification.startDate).toLocaleDateString()}</span>
                      {notification.endDate && (
                        <>
                          <span>→</span>
                          <span>{new Date(notification.endDate).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span>👤</span>
                      <span>{notification.createdBy.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controles */}
              <div className="flex items-center gap-4">
                {/* Toggle Activo/Inactivo */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(notification.id, notification.active)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      notification.active ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      notification.active ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className={`text-xs font-medium ${notification.active ? 'text-green-600' : 'text-gray-500'}`}>
                    {notification.active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                {/* Botones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(notification)}
                    className="p-2 hover:bg-secondary/20 rounded-lg transition-colors"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(notification.id)}
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

      {notifications.length === 0 && (
        <div className="text-center py-12 text-primary/60">
          <p className="text-lg mb-2">No hay notificaciones creadas</p>
          <p className="text-sm">Comienza creando tu primera notificación</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <h2 className="text-2xl font-bold text-primary mb-6">
              {editingId ? 'Editar Notificación' : 'Nueva Notificación'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Título *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="Ej: Importante: Tormenta en camino"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">Mensaje *</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="input-field"
                  rows={4}
                  placeholder="Escribe el mensaje de la notificación..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Tipo *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="info">ℹ️ Información</option>
                    <option value="warning">⚠️ Advertencia</option>
                    <option value="alert">🚨 Alerta</option>
                    <option value="success">✅ Éxito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Prioridad *</label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="1">Baja</option>
                    <option value="2">Media</option>
                    <option value="3">Alta</option>
                  </select>
                </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Fecha inicio</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Fecha fin (opcional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-field"
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

export default Notifications;