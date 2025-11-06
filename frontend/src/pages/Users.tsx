// frontend/src/pages/Users.tsx
import React, { useEffect, useState } from 'react';
import { usersAPI } from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER';
  active: boolean;
  createdAt: string;
  _count?: {
    areas: number;
  };
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MANAGER',
  });

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

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'MANAGER' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'MANAGER' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // Si no se proporciona password, no lo incluimos en la actualización
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await usersAPI.update(editingUser.id, updateData);
      } else {
        await usersAPI.create(formData);
      }

      await loadUsers();
      closeModal();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar usuario');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await usersAPI.toggleStatus(id);
      await loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      await usersAPI.delete(id);
      await loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar usuario');
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
          <h2 className="text-2xl font-bold text-primary">Usuarios</h2>
          <p className="text-primary/60 mt-1">Administra los usuarios del sistema</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="table-minimal">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Áreas</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div>
                    <p className="font-medium text-primary">{user.name}</p>
                    <p className="text-sm text-primary/60">{user.email}</p>
                  </div>
                </td>
                <td>
                  <span className={`badge ${user.role === 'ADMIN' ? 'badge-info' : 'badge-success'}`}>
                    {user.role === 'ADMIN' ? 'Administrador' : 'Gestor'}
                  </span>
                </td>
                <td>
                  <span className="text-primary/70">
                    {user._count?.areas || 0} {user._count?.areas === 1 ? 'área' : 'áreas'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleToggleStatus(user.id)}
                    className={`badge cursor-pointer ${user.active ? 'badge-success' : 'badge-error'}`}
                  >
                    {user.active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openModal(user)}
                      className="p-2 rounded-lg bg-white/50 hover:bg-white transition-colors"
                      title="Editar"
                    >
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-2 rounded-lg bg-white/50 hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-primary/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-primary/60">No hay usuarios registrados</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="glass-card rounded-2xl p-8 max-w-md w-full animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-primary mb-6">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="Ej: Juan Pérez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  className="input-glass"
                  placeholder="ejemplo@hotel.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Contraseña {editingUser ? '(dejar en blanco para no cambiar)' : '*'}
                </label>
                <input
                  type="password"
                  className="input-glass"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Rol *
                </label>
                <select
                  className="input-glass"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="MANAGER">Gestor de Área</option>
                  <option value="ADMIN">Administrador</option>
                </select>
                <p className="text-xs text-primary/50 mt-1">
                  {formData.role === 'ADMIN' 
                    ? 'Tendrá acceso completo al sistema'
                    : 'Solo podrá gestionar sus áreas asignadas'}
                </p>
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
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;