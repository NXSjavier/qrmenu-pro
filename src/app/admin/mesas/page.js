'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MesasPage() {
  const router = useRouter();
  const [data, setData] = useState({ mesas: [], slug: '', baseURL: '' });
  const [loading, setLoading] = useState(true);
  const [nuevaMesa, setNuevaMesa] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [editNombre, setEditNombre] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  async function cargar() {
    try {
      const res = await fetch('/api/mesas', { headers: { Authorization: `Bearer ${token}` } });
      setData(await res.json());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { if (token) cargar(); }, [token]);

  async function crear() {
    if (!nuevaMesa.trim()) return;
    await fetch('/api/mesas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ accion: 'crear', nombre_mesa: nuevaMesa }),
    });
    setNuevaMesa('');
    cargar();
  }

  async function toggleMesa(id) {
    await fetch('/api/mesas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ accion: 'toggle', id }),
    });
    cargar();
  }

  async function editarMesa() {
    if (!editNombre.trim()) return;
    await fetch('/api/mesas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ accion: 'editar', id: editModal.id, nombre_mesa: editNombre }),
    });
    setEditModal(null);
    cargar();
  }

  return (
    <div className="min-h-screen p-3 sm:p-4">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <a href="/admin/dashboard" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition active:scale-90" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </a>
          <h1 className="text-base sm:text-lg font-extrabold text-white">Mesas</h1>
        </div>
      </div>

      {/* URL Base */}
      <div className="rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 border" style={{ background: 'rgba(255,215,0,0.08)', borderColor: 'rgba(255,215,0,0.2)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,215,0,0.15)' }}>
            <svg className="w-4 h-4" style={{ color: '#FFD700' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </span>
          <span className="text-sm sm:text-base font-bold text-white">Escanea el QR desde tu celular</span>
        </div>
        <p className="text-xs sm:text-sm text-gray-400 mb-3">Tu celular debe estar en la misma red WiFi que esta computadora.</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className="text-xs sm:text-sm text-gray-500">URL base:</span>
          <code className="text-xs sm:text-sm font-mono px-3 py-1.5 rounded-xl break-all" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,215,0,0.8)' }}>{data.baseURL}</code>
        </div>
      </div>

      {/* Crear */}
      <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 mb-6 sm:mb-8 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,215,0,0.08)' }}>
        <h3 className="font-extrabold text-white mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(255,215,0,0.15)' }}>+</div>
          Nueva Mesa
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" value={nuevaMesa} onChange={e => setNuevaMesa(e.target.value)} onKeyDown={e => e.key === 'Enter' && crear()}
            className="flex-1 border rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 text-white outline-none text-sm sm:text-base transition"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,215,0,0.1)' }}
            onFocus={e => e.target.style.borderColor = 'rgba(255,215,0,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,215,0,0.1)'}
            placeholder="Nombre de mesa (ej: Mesa 1)" />
          <button onClick={crear}
            className="w-full sm:w-auto px-6 py-3.5 sm:py-4 min-h-[48px] rounded-xl font-bold text-sm sm:text-base whitespace-nowrap transition text-white active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,165,0,0.2))', border: '1px solid rgba(255,215,0,0.2)', boxShadow: '0 4px 15px rgba(255,215,0,0.15)' }}>Crear Mesa</button>
        </div>
      </div>

      {/* Grid */}
      {loading ? <p className="text-gray-500 text-center py-12 text-sm">Cargando...</p> : data.mesas.length === 0 ? (
        <div className="text-center py-16"><div className="text-5xl sm:text-6xl mb-4 opacity-20">🪑</div><p className="text-gray-500 text-sm">No hay mesas aún</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {data.mesas.map(m => {
            const urlMenu = `${data.baseURL}/menu/${data.slug}/${m.codigo_qr}`;
            return (
              <div key={m.id} className="rounded-2xl p-4 sm:p-5 border hover:bg-white/5 transition" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,215,0,0.08)', opacity: m.activa ? 1 : 0.5 }}>
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0" style={{ background: m.activa ? 'rgba(255,215,0,0.15)' : 'rgba(239,68,68,0.15)' }}>
                      {m.activa ? '🪑' : '🔴'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-sm sm:text-base truncate">{m.nombre_mesa}</h3>
                      <span className="text-xs text-gray-500 font-mono block truncate">{m.codigo_qr}</span>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ml-2" style={{ background: m.activa ? 'rgba(255,215,0,0.1)' : 'rgba(239,68,68,0.1)', color: m.activa ? '#FFD700' : '#f87171' }}>
                    {m.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                {/* QR */}
                <div className="rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(urlMenu)}`}
                    alt="QR" className="mx-auto mb-2 sm:mb-3" style={{ width: 100, height: 100, borderRadius: 12 }} />
                  <a href={urlMenu} target="_blank" className="text-xs break-all line-clamp-2 font-medium transition block" style={{ color: 'rgba(255,215,0,0.7)' }}>{urlMenu}</a>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button onClick={() => toggleMesa(m.id)}
                    className="flex-1 min-h-[44px] py-3 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95"
                    style={{ background: m.activa ? 'rgba(239,68,68,0.1)' : 'rgba(255,215,0,0.1)', color: m.activa ? '#f87171' : '#FFD700' }}>
                    {m.activa ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => { setEditModal(m); setEditNombre(m.nombre_mesa); }}
                    className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl flex items-center justify-center transition text-sm sm:text-base flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>✏️</button>
                  <button onClick={() => {
                    const win = window.open('', '_blank');
                    win.document.write(`<html><head><title>${m.nombre_mesa}</title><style>body{font-family:sans-serif;text-align:center;padding:40px}img{width:300px;height:300px}h2{margin-bottom:20px}</style></head><body><h2>${m.nombre_mesa}</h2><img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(urlMenu)}"><p style="margin-top:15px;color:#666;font-size:12px;word-break:break-all">${urlMenu}</p><script>window.onload=function(){window.print()}</script></body></html>`);
                    win.document.close();
                  }} className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl flex items-center justify-center transition text-sm sm:text-base flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>🖨️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }}
          onClick={e => e.target === e.currentTarget && setEditModal(null)}>
          <div className="w-full max-w-sm mx-auto rounded-2xl sm:rounded-3xl p-6 sm:p-7 border" style={{ background: 'rgba(20,16,45,0.95)', borderColor: 'rgba(255,215,0,0.1)', backdropFilter: 'blur(40px)' }}>
            <h3 className="font-extrabold text-white text-base sm:text-lg mb-5 sm:mb-6">Editar Mesa</h3>
            <input type="text" value={editNombre} onChange={e => setEditNombre(e.target.value)}
              className="w-full border rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 text-white outline-none text-sm sm:text-base mb-4 transition"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,215,0,0.1)' }}
              onFocus={e => e.target.style.borderColor = 'rgba(255,215,0,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,215,0,0.1)'} />
            <div className="flex gap-3">
              <button onClick={editarMesa}
                className="flex-1 min-h-[44px] py-3 rounded-xl font-bold text-sm sm:text-base text-white active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,165,0,0.2))', border: '1px solid rgba(255,215,0,0.2)' }}>Guardar</button>
              <button onClick={() => setEditModal(null)}
                className="flex-1 min-h-[44px] py-3 rounded-xl text-gray-400 font-bold text-sm sm:text-base hover:bg-white/10 transition" style={{ background: 'rgba(255,255,255,0.05)' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
