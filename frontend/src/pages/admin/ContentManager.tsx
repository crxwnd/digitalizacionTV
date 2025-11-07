// frontend/src/pages/admin/ContentManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { contentAPI, screensAPI } from '../../services/api';
import { io, Socket } from 'socket.io-client';

interface Content {
  id: number;
  title: string;
  description?: string;
  type: string;
  filePath: string;
  fileSize: number;
  active: boolean;
  createdAt: string;
  area?: { id: number; name: string };
  uploadedBy: { name: string };
}

interface Screen {
  id: number;
  code: string;
  name: string;
  online: boolean;
  area?: { name: string };
}

const ContentManager: React.FC = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [selectedScreen, setSelectedScreen] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Estado para nueva notificación
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'INFO',
    priority: 'NORMAL',
    displayImmediately: false,
  });

  useEffect(() => {
    loadContent();
    loadScreens();

    // Conectar WebSocket
    const socketConnection = io(import.meta.env.VITE_WS_URL || 'ws://localhost:5000');
    setSocket(socketConnection);

    socketConnection.on('content-uploaded', (data) => {
      showNotification('success', `Nuevo contenido subido: ${data.title}`);
      loadContent();
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const loadContent = async () => {
    try {
      const response = await contentAPI.getAll();
      setContents(response.data);
    } catch (error) {
      console.error('Error al cargar contenido:', error);
    }
  };

  const loadScreens = async () => {
    try {
      const response = await screensAPI.getAll();
      setScreens(response.data);
    } catch (error) {
      console.error('Error al cargar pantallas:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.split('.')[0]);
    formData.append('type', file.type.split('/')[0].toUpperCase());

    try {
      // Simular progreso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await contentAPI.upload(formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      showNotification('success', '¡Contenido subido exitosamente!');
      loadContent();
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error: any) {
      setUploading(false);
      setUploadProgress(0);
      showNotification('error', error.response?.data?.error || 'Error al subir archivo');
    }
  };

  const handleAssignContent = async () => {
    if (!selectedContent || !selectedScreen) {
      showNotification('warning', 'Selecciona contenido y pantalla');
      return;
    }

    try {
      await contentAPI.assignToScreen({
        screenCode: selectedScreen,
        contentId: selectedContent.id,
        immediate: true,
      });

      showNotification('success', '¡Contenido asignado correctamente!');
      
      // Limpiar selección
      setSelectedContent(null);
      setSelectedScreen('');
    } catch (error: any) {
      showNotification('error', 'Error al asignar contenido');
    }
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      showNotification('warning', 'Completa título y mensaje');
      return;
    }

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(notificationForm),
      });

      showNotification('success', '¡Notificación enviada!');
      
      // Limpiar formulario
      setNotificationForm({
        title: '',
        message: '',
        type: 'INFO',
        priority: 'NORMAL',
        displayImmediately: false,
      });
    } catch (error) {
      showNotification('error', 'Error al enviar notificación');
    }
  };

  const handleDeleteContent = async (id: number) => {
    if (!confirm('¿Eliminar este contenido?')) return;

    try {
      await contentAPI.delete(id);
      showNotification('success', 'Contenido eliminado');
      loadContent();
    } catch (error) {
      showNotification('error', 'Error al eliminar');
    }
  };

  const showNotification = (type: string, message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-lighter to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 rounded-2xl mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Gestión de Contenido
          </h1>
          <p className="text-primary/60">
            Sube y gestiona contenido multimedia para las pantallas
          </p>
        </div>

        {/* Notificación */}
        {notification && (
          <div className={`glass-card p-4 mb-6 rounded-xl border-l-4 ${
            notification.type === 'success' ? 'border-green-500' :
            notification.type === 'error' ? 'border-red-500' :
            'border-yellow-500'
          }`}>
            <p className="text-primary font-medium">{notification.message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna 1: Upload y contenido */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload */}
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-xl font-semibold text-primary mb-4">
                Subir Contenido
              </h2>
              
              <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept="image/*,video/*,.pdf,.ppt,.pptx"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-primary font-medium mb-1">
                    Click para subir archivo
                  </p>
                  <p className="text-sm text-primary/60">
                    Videos, imágenes, PDFs o presentaciones (máx. 5GB)
                  </p>
                </label>
              </div>

              {uploading && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-primary mb-1">
                    <span>Subiendo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-primary/10 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Lista de contenido */}
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-xl font-semibold text-primary mb-4">
                Contenido Disponible
              </h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {contents.map((content) => (
                  <div
                    key={content.id}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedContent?.id === content.id
                        ? 'border-primary bg-primary/5'
                        : 'border-neutral-light hover:border-primary/30'
                    }`}
                    onClick={() => setSelectedContent(content)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-primary">
                          {content.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-primary/60">
                          <span className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${
                              content.type === 'VIDEO' ? 'bg-blue-500' :
                              content.type === 'IMAGE' ? 'bg-green-500' :
                              'bg-yellow-500'
                            }`} />
                            {content.type}
                          </span>
                          <span>{formatFileSize(content.fileSize)}</span>
                          <span>{content.area?.name || 'Global'}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteContent(content.id);
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna 2: Asignación y notificaciones */}
          <div className="space-y-6">
            {/* Asignar a pantalla */}
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-xl font-semibold text-primary mb-4">
                Asignar a Pantalla
              </h2>
              
              {selectedContent && (
                <div className="mb-4 p-3 bg-primary/5 rounded-lg">
                  <p className="text-sm text-primary">
                    Contenido seleccionado:
                  </p>
                  <p className="font-medium text-primary">
                    {selectedContent.title}
                  </p>
                </div>
              )}

              <select
                value={selectedScreen}
                onChange={(e) => setSelectedScreen(e.target.value)}
                className="input-glass w-full mb-4"
              >
                <option value="">Seleccionar pantalla...</option>
                {screens.filter(s => s.online).map((screen) => (
                  <option key={screen.code} value={screen.code}>
                    {screen.name} - {screen.area?.name || 'Sin área'}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAssignContent}
                disabled={!selectedContent || !selectedScreen}
                className="btn-primary w-full disabled:opacity-50"
              >
                Asignar y Reproducir
              </button>
            </div>

            {/* Enviar notificación */}
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-xl font-semibold text-primary mb-4">
                Enviar Aviso
              </h2>
              
              <input
                type="text"
                placeholder="Título del aviso"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                className="input-glass w-full mb-3"
              />
              
              <textarea
                placeholder="Mensaje..."
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                className="input-glass w-full mb-3 min-h-[100px]"
              />
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <select
                  value={notificationForm.type}
                  onChange={(e) => setNotificationForm({...notificationForm, type: e.target.value})}
                  className="input-glass"
                >
                  <option value="INFO">Información</option>
                  <option value="WARNING">Advertencia</option>
                  <option value="ALERT">Alerta</option>
                  <option value="EMERGENCY">Emergencia</option>
                </select>
                
                <select
                  value={notificationForm.priority}
                  onChange={(e) => setNotificationForm({...notificationForm, priority: e.target.value})}
                  className="input-glass"
                >
                  <option value="LOW">Baja</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
              
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={notificationForm.displayImmediately}
                  onChange={(e) => setNotificationForm({...notificationForm, displayImmediately: e.target.checked})}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="text-sm text-primary">
                  Mostrar inmediatamente
                </span>
              </label>
              
              <button
                onClick={handleSendNotification}
                className={`w-full px-6 py-2.5 rounded-xl font-medium transition-all ${
                  notificationForm.type === 'EMERGENCY'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'btn-secondary'
                }`}
              >
                {notificationForm.type === 'EMERGENCY' ? '🚨 Enviar Alerta de Emergencia' : 'Enviar Aviso'}
              </button>
            </div>

            {/* Estadísticas rápidas */}
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-xl font-semibold text-primary mb-4">
                Estadísticas
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-primary/60">Total contenido</span>
                  <span className="font-semibold text-primary">{contents.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary/60">Pantallas online</span>
                  <span className="font-semibold text-green-600">
                    {screens.filter(s => s.online).length}/{screens.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary/60">Espacio usado</span>
                  <span className="font-semibold text-primary">
                    {formatFileSize(contents.reduce((acc, c) => acc + c.fileSize, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentManager;