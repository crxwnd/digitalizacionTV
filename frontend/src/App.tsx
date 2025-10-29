import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Sistema de Señalización Digital
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Gestiona tus pantallas digitales desde un solo lugar
        </p>
        <div className="space-y-4">
          <Link
            to="/admin"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition duration-200"
          >
            Panel de Administración
          </Link>
          <Link
            to="/player"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition duration-200"
          >
            Modo Pantalla (Player)
          </Link>
        </div>
      </div>
    </div>
  );
}

function AdminPanel() {
  const [health, setHealth] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/health`)
      .then(res => res.json())
      .then(data => {
        setHealth(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Panel de Administración</h1>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado del Backend</h2>
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-yellow-700 font-medium">Conectando...</span>
            </div>
          ) : health ? (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-700 font-medium">{health.message}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-red-700 font-medium">Error de conexión</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Áreas</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-500 mt-2">Áreas registradas</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pantallas</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-sm text-gray-500 mt-2">Pantallas activas</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Usuarios</h3>
            <p className="text-3xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-500 mt-2">Gestores registrados</p>
          </div>
        </div>

        <Link to="/" className="text-blue-600 hover:underline">← Volver al inicio</Link>
      </div>
    </div>
  );
}

function PlayerMode() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center text-white">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h1 className="text-6xl font-bold mb-4">Modo Pantalla</h1>
        <p className="text-2xl text-gray-400">Esperando contenido...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/player" element={<PlayerMode />} />
      </Routes>
    </Router>
  );
}

export default App;