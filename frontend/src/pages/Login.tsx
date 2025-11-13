// frontend/src/pages/Login.tsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER';
}

interface LoginProps {
  onLogin: (userData: User, token: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;
      onLogin(user, token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #254D6E 0%, #1a3a52 50%, #0f2738 100%)'
    }}>
      {/* Efectos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 -left-10 w-72 h-72 rounded-full" style={{
          background: 'radial-gradient(circle, rgba(184,143,105,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }} />
        <div className="absolute bottom-20 -right-10 w-96 h-96 rounded-full" style={{
          background: 'radial-gradient(circle, rgba(224,229,229,0.1) 0%, transparent 70%)',
          filter: 'blur(80px)'
        }} />
      </div>

      {/* Card principal con Liquid Glass */}
      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-2xl rounded-[32px] p-8 shadow-2xl border border-white/20" style={{
          background: 'rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(37, 77, 110, 0.37), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3)'
        }}>
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="mb-4 inline-block p-4 rounded-[20px]" style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.18)'
            }}>
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="#EDECE4" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#EDECE4' }}>
              DigitalizaciónTV
            </h1>
            <p className="text-sm" style={{ color: 'rgba(237, 236, 228, 0.6)' }}>
              Sistema de Señalización Digital
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#EDECE4' }}>
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-2xl text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.09)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#EDECE4'
                }}
                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(184, 143, 105, 0.5)'}
                onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#EDECE4' }}>
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.09)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#EDECE4'
                }}
                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(184, 143, 105, 0.5)'}
                onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-2xl p-4 animate-slide-up" style={{
                background: 'rgba(239, 68, 68, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading ? 'rgba(184, 143, 105, 0.3)' : 'rgba(184, 143, 105, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(184, 143, 105, 0.4)',
                color: '#EDECE4',
                boxShadow: '0 4px 16px rgba(184, 143, 105, 0.3)'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Credenciales de prueba */}
          <div className="mt-6 rounded-2xl p-4" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <p className="text-xs mb-2" style={{ color: 'rgba(237, 236, 228, 0.5)' }}>
              Credenciales de prueba:
            </p>
            <div className="space-y-1 text-sm" style={{ color: '#EDECE4' }}>
              <p>
                <span className="font-semibold">Admin:</span> admin@digitalizacion.com / admin123
              </p>
              <p>
                <span className="font-semibold">Gestor:</span> gestor@digitalizacion.com / gestor123
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs" style={{ color: 'rgba(237, 236, 228, 0.4)' }}>
            © 2024 DigitalizaciónTV. Sistema de Señalización Digital para Hoteles.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;