// frontend/src/pages/Users.tsx
import React, { useEffect, useState } from 'react';
import { usersAPI } from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'PLAYER';
  active: boolean;
  createdAt: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      await usersAPI.delete(id);
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await usersAPI.toggleStatus(id);
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      ADMIN: 'badge badge-error',
      MANAGER: 'badge badge-info',
      PLAYER: 'badge badge-success',
    };
    return badges[role as keyof typeof badges] || 'badge';
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
          <h2 className="text-2xl font-bold text-primary">Usuarios</h2>
          <p className="text-sm text-primary/60 mt-1">
            Gestiona los usuarios del sistema
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-primary/60">Total</p>
          <p className="text-2xl font-bold text-primary">{users.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-primary/60">Admins</p>
          <p className="text-2xl font-bold text-red-600">
            {users.filter(u => u.role === 'ADMIN').length}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-primary/60">Managers</p>
          <p className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === 'MANAGER').length}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-primary/60">Activos</p>
          <p className="text-2xl font-bold text-green-600">
            {users.filter(u => u.active).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-minimal">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha de Registro</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary-light rounded-xl flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="text-primary/70">{user.email}</td>
                  <td>
                    <span className={getRoleBadge(user.role)}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`badge ${user.active ? 'badge-success' : 'badge-error'} cursor-pointer hover:opacity-80`}
                    >
                      {user.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="text-primary/70">
                    {new Date(user.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowModal(true);
                        }}
                        className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSave={() => {
            loadUsers();
            setShowModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
};

// Modal Component
const UserModal: React.FC<{
  user: User | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'MANAGER',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (user) {
        // Editar
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await usersAPI.update(user.id, updateData);
      } else {
        // Crear
        if (!formData.password) {
          setError('La contraseña es requerida');
          setLoading(false);
          return;
        }
        await usersAPI.create(formData);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar usuario');
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
          {user ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary/80 mb-2">
              Nombre completo
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-glass"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary/80 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-glass"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary/80 mb-2">
              Contraseña {user && '(dejar vacío para no cambiar)'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-glass"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary/80 mb-2">
              Rol
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'MANAGER' | 'PLAYER' })}
              
              className="input-glass"
            >
              <option value="ADMIN">Administrador</option>
              <option value="MANAGER">Gestor</option>
              <option value="PLAYER">Pantalla</option>
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

export default Users;