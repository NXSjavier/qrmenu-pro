'use client';
import { useState } from 'react';

export default function LandingPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleQuickRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        window.location.href = '/admin/dashboard';
      } else {
        setError(data.error || 'Error al registrarse');
      }
    } catch { setError('Error de conexión'); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(139,92,246,0.15), transparent 70%)' }}></div>
        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center mx-auto shadow-2xl mb-6">
            <span className="text-4xl">🍽️</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 leading-tight">
            Tu menú digital<br />
            <span className="bg-gradient-to-r from-violet-400 to-blue-400" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>con solo un QR</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-lg mx-auto mb-10">
            Tus clientes escanean y piden desde su celular. Tú recibes el pedido al instante.
          </p>

          {/* Quick Register */}
          <div className="max-w-md mx-auto">
            <div className="rounded-3xl p-8 border border-white/10 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <h2 className="text-white font-bold text-lg mb-5">Crea tu restaurante gratis</h2>
              {error && <div className="mb-4 text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-3">{error}</div>}
              <form onSubmit={handleQuickRegister} className="space-y-3">
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white outline-none focus:border-violet-500/50 text-sm"
                  placeholder="Nombre del restaurante" required />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white outline-none focus:border-violet-500/50 text-sm"
                  placeholder="Email" required />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white outline-none focus:border-violet-500/50 text-sm"
                  placeholder="Contraseña" required />
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-blue-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50">
                  {loading ? 'Creando...' : 'Comenzar gratis'}
                </button>
              </form>
              <p className="text-gray-500 text-xs mt-4">
                ¿Ya tienes cuenta? <a href="/admin/login" className="text-violet-400 hover:text-violet-300 font-semibold">Iniciar sesión</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '📱', title: 'Menú desde el celular', desc: 'Tus clientes escanean el QR y ven el menú al instante. Sin apps, sin registrar.' },
            { icon: '🔔', title: 'Notificaciones en tiempo real', desc: 'Cuando un cliente pide, escuchas un sonido en el dashboard. Sabes al instante.' },
            { icon: '😊', title: 'Cliente feliz', desc: 'Cuando el pedido está listo, el cliente ve una celebración con sonido y vibración.' },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl p-6 border border-white/5 text-center hover:bg-white/5 transition" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-5xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
