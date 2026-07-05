'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

function AdminNav({ router }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50" style={{ background: 'rgba(12,10,26,0.85)', backdropFilter: 'blur(40px) saturate(1.5)', borderBottom: '1px solid rgba(255,215,0,0.08)' }}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
            <span className="text-lg">👑</span>
          </div>
          <div>
            <h1 className="text-base md:text-lg font-extrabold text-white leading-tight">
              QRMenu <span style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Admin</span>
            </h1>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-white transition active:scale-90"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          <a href="/admin/categorias" className="text-xs lg:text-sm text-gray-400 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition">Categorías</a>
          <a href="/admin/productos" className="text-xs lg:text-sm text-gray-400 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition">Productos</a>
          <a href="/admin/mesas" className="text-xs lg:text-sm text-gray-400 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition">Mesas</a>
          <button onClick={() => { localStorage.removeItem('token'); router.push('/admin/login'); }}
            className="text-xs lg:text-sm text-red-400 hover:text-red-300 px-3 py-2 rounded-xl hover:bg-red-500/10 transition">Salir</button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 px-4 py-3 space-y-1" style={{ background: 'rgba(12,10,26,0.95)', backdropFilter: 'blur(40px)' }}>
          {[
            { href: '/admin/categorias', label: '📂 Categorías' },
            { href: '/admin/productos', label: '🍔 Productos' },
            { href: '/admin/mesas', label: '🪑 Mesas' },
          ].map(item => (
            <a key={item.href} href={item.href}
              className="block w-full text-left px-4 py-3 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition"
              onClick={() => setMenuOpen(false)}>{item.label}</a>
          ))}
          <button onClick={() => { localStorage.removeItem('token'); router.push('/admin/login'); }}
            className="block w-full text-left px-4 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition">🚪 Salir</button>
        </div>
      )}
    </nav>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [lastIds, setLastIds] = useState(new Set());

  const cargarStats = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/productos', { headers: { Authorization: `Bearer ${token}` } });
      const prods = await res.json();
      const catRes = await fetch('/api/categorias', { headers: { Authorization: `Bearer ${token}` } });
      const cats = await catRes.json();
      const mesaRes = await fetch('/api/mesas', { headers: { Authorization: `Bearer ${token}` } });
      const mesaData = await mesaRes.json();
      setStats({
        categorias: cats.length,
        productos: prods.length,
        mesas: mesaData.mesas.length,
        mesasActivas: mesaData.mesas.filter(m => m.activa).length,
      });
    } catch {}
  }, []);

  const cargarPedidos = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/pedidos', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!Array.isArray(data)) { setPedidos([]); return; }
      setPedidos(data);

      const currentIds = new Set(data.map(p => p.id));
      setLastIds(prev => {
        for (const id of currentIds) {
          if (!prev.has(id)) {
            const p = data.find(pd => pd.id === id);
            if (p && p.estado === 'nuevo') playDing();
          }
        }
        return currentIds;
      });
    } catch {}
  }, []);

  useEffect(() => {
    cargarStats();
    cargarPedidos();
    const interval = setInterval(cargarPedidos, 3000);
    return () => clearInterval(interval);
  }, [cargarStats, cargarPedidos]);

  async function cambiarEstado(id, estado) {
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/pedidos/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado }),
      });
      cargarPedidos();
    } catch {}
  }

  const cols = { nuevo: [], preparando: [], listos: [] };
  pedidos.forEach(p => {
    const key = p.estado === 'nuevo' ? 'nuevo' : p.estado === 'preparando' ? 'preparando' : 'listos';
    cols[key].push(p);
  });

  return (
    <div>
      <AdminNav router={router} />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {[
              { label: 'Categorías', value: stats.categorias, icon: '📂' },
              { label: 'Productos', value: stats.productos, icon: '🍽️' },
              { label: 'Mesas', value: stats.mesasActivas, extra: `/${stats.mesas}`, icon: '🪑' },
              { label: 'Pedidos Hoy', value: pedidos.length, icon: '📋' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-4 sm:p-5 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,215,0,0.08)' }}>
                <div className="flex items-center gap-3 mb-2 sm:mb-3">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400/15 to-yellow-600/5 flex items-center justify-center text-base sm:text-lg" style={{ border: '1px solid rgba(255,215,0,0.1)' }}>
                    {s.icon}
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold" style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {s.value}{s.extra || ''}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Accesos rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8">
          {[
            { href: '/admin/categorias', icon: '📂', label: 'Categorías', sub: 'Organizar menú' },
            { href: '/admin/productos', icon: '🍔', label: 'Productos', sub: 'Agregar platos' },
            { href: '/admin/mesas', icon: '🪑', label: 'Mesas', sub: 'Gestionar QR' },
          ].map((item, i) => (
            <a key={i} href={item.href}
              className="rounded-2xl p-4 sm:p-5 border flex items-center gap-3 sm:gap-4 hover:bg-white/5 transition active:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,215,0,0.08)' }}>
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0" style={{ background: 'rgba(255,215,0,0.1)' }}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-semibold text-white">{item.label}</div>
                <div className="text-xs sm:text-sm text-gray-500">{item.sub}</div>
              </div>
            </a>
          ))}
        </div>

        {/* Pedidos en Tiempo Real */}
        <h2 className="text-xs sm:text-sm font-extrabold text-gray-400 uppercase tracking-wider mb-3 sm:mb-4">Pedidos en Tiempo Real</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {[
            { key: 'nuevo', title: 'Nuevos', color: 'rgba(255,215,0,0.9)', bg: 'rgba(255,215,0,0.9)', count: cols.nuevo.length, bgCard: 'rgba(255,215,0,0.08)' },
            { key: 'preparando', title: 'Preparando', color: 'rgba(255,165,0,0.9)', bg: 'rgba(255,165,0,0.9)', count: cols.preparando.length, bgCard: 'rgba(255,165,0,0.08)' },
            { key: 'listos', title: 'Listos', color: 'rgba(34,197,94,0.9)', bg: 'rgba(34,197,94,0.9)', count: cols.listos.length, bgCard: 'rgba(34,197,94,0.08)' },
          ].map(col => (
            <div key={col.key} className="rounded-2xl p-4 sm:p-5 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,215,0,0.06)' }}>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: col.bg }}></span>
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider" style={{ color: col.color }}>{col.title}</h3>
                <span className="ml-auto text-xs text-gray-500 bg-white/5 px-2.5 py-0.5 rounded-full">{col.count}</span>
              </div>
              <div className="space-y-3 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-1">
                {cols[col.key].map(p => (
                  <div key={p.id} className="rounded-2xl p-4 border" style={{ background: col.bgCard, borderColor: col.bgCard }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style={{ background: `${col.bgCard}66` }}>
                          {p.estado === 'nuevo' ? '🆕' : p.estado === 'preparando' ? '👨‍🍳' : '✅'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm sm:text-base">{p.mesa_nombre}</span>
                            <span className="text-xs text-gray-500">#{p.id}</span>
                          </div>
                          <span className="text-xs text-gray-500">{p.hora}</span>
                        </div>
                      </div>
                      <span className="text-sm sm:text-base font-extrabold flex-shrink-0 ml-2" style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>${parseFloat(p.total).toFixed(2)}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400 mb-3 leading-relaxed">
                      {p.items?.map((i, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 mr-3">
                          <span className="font-semibold" style={{ color: 'rgba(255,215,0,0.7)' }}>{i.cantidad}x</span>
                          <span>{i.nombre}</span>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {p.estado === 'nuevo' && (
                        <button onClick={() => cambiarEstado(p.id, 'preparando')}
                          className="flex-1 min-h-[44px] py-3 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95"
                          style={{ background: 'rgba(255,215,0,0.2)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.2)' }}
                          onMouseEnter={e => e.target.style.background = 'rgba(255,215,0,0.3)'}
                          onMouseLeave={e => e.target.style.background = 'rgba(255,215,0,0.2)'}
                        >👨‍🍳 Preparar</button>
                      )}
                      {(p.estado === 'nuevo' || p.estado === 'preparando') && (
                        <button onClick={() => cambiarEstado(p.id, 'listo')}
                          className="flex-1 min-h-[44px] py-3 rounded-xl text-xs sm:text-sm font-bold text-white transition active:scale-95"
                          style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,165,0,0.2))', border: '1px solid rgba(255,215,0,0.2)' }}
                          onMouseEnter={e => e.target.style.background = 'linear-gradient(135deg, rgba(255,215,0,0.4), rgba(255,165,0,0.3))'}
                          onMouseLeave={e => e.target.style.background = 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,165,0,0.2))'}
                        >✅ Listo</button>
                      )}
                      {p.estado !== 'entregado' && (
                        <button onClick={() => cambiarEstado(p.id, 'entregado')}
                          className="flex-1 min-h-[44px] py-3 rounded-xl text-xs sm:text-sm font-bold bg-white/5 hover:bg-white/10 text-gray-400 transition active:scale-95">Entregado</button>
                      )}
                    </div>
                  </div>
                ))}
                {cols[col.key].length === 0 && (
                  <p className="text-center text-gray-600 text-xs sm:text-sm py-8">Sin pedidos</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function playDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [1200, 1500].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.15);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.15);
    });
  } catch {}
}
