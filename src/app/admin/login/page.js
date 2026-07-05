'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch {
      setError('Error de conexión');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20 mb-4">
            <span className="text-3xl sm:text-4xl">👑</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">QRMenu Admin</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Inicia sesión en tu restaurante</p>
        </div>

        <form onSubmit={handleSubmit} className="backdrop-blur-xl border rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-4 sm:space-y-5" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,215,0,0.1)', backdropFilter: 'blur(40px)' }}>
          {error && (
            <div className="rounded-xl px-4 py-3 text-xs sm:text-sm text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 text-white outline-none text-sm sm:text-base transition"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,215,0,0.1)' }}
              onFocus={e => e.target.style.borderColor = 'rgba(255,215,0,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,215,0,0.1)'}
              placeholder="admin@restaurante.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 text-white outline-none text-sm sm:text-base transition"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,215,0,0.1)' }}
              onFocus={e => e.target.style.borderColor = 'rgba(255,215,0,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,215,0,0.1)'}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] sm:min-h-[52px] py-3.5 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all disabled:opacity-50 text-white active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,165,0,0.2))', border: '1px solid rgba(255,215,0,0.2)', boxShadow: '0 8px 30px rgba(255,215,0,0.15)' }}
            onMouseEnter={e => e.target.style.background = 'linear-gradient(135deg, rgba(255,215,0,0.4), rgba(255,165,0,0.3))'}
            onMouseLeave={e => e.target.style.background = 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,165,0,0.2))'}
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>

          <p className="text-center text-gray-500 text-xs sm:text-sm">
            ¿No tienes cuenta?{' '}
            <a href="/admin/register" className="font-semibold" style={{ color: '#FFD700' }}>Registrarse</a>
          </p>
        </form>
      </div>
    </div>
  );
}
