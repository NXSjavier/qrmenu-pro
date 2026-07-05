'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ICONOS = ['🍽️', '🥗', '🍖', '🍕', '🌮', '🍔', '🌯', '🥘', '🍝', '🍣', '🥟', '🍜', '☕', '🥤', '🍺', '🍷', '🧃', '🍰', '🍦', '🍩', '🥐', '🧀', '🥑', '🌶️'];

export default function CategoriasPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', icono: '🍽️', orden: 0 });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  async function cargar() {
    try {
      const res = await fetch('/api/categorias', { headers: { Authorization: `Bearer ${token}` } });
      setCategorias(await res.json());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { if (token) cargar(); }, [token]);

  function openCreate() {
    setEditing(null);
    setForm({ nombre: '', icono: '🍽️', orden: 0 });
    setShowModal(true);
  }

  function openEdit(cat) {
    setEditing(cat);
    setForm({ nombre: cat.nombre, icono: cat.icono, orden: cat.orden });
    setShowModal(true);
  }

  async function handleSave() {
    await fetch('/api/categorias', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editing ? { ...form, id: editing.id } : form),
    });
    setShowModal(false);
    cargar();
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar categoría?')) return;
    await fetch('/api/categorias', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    cargar();
  }

  return (
    <div className="min-h-screen p-3 sm:p-4">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <a href="/admin/dashboard" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition active:scale-90" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </a>
          <h1 className="text-base sm:text-lg font-extrabold text-white">Categorías</h1>
        </div>
        <button onClick={openCreate}
          className="px-4 sm:px-5 py-2.5 sm:py-3 min-h-[44px] rounded-xl font-bold text-xs sm:text-sm transition text-white active:scale-95"
          style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,165,0,0.2))', border: '1px solid rgba(255,215,0,0.2)', boxShadow: '0 4px 15px rgba(255,215,0,0.15)' }}>
          + Nueva
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-12 text-sm">Cargando...</p>
      ) : categorias.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl sm:text-6xl mb-4 opacity-20">📂</div>
          <p className="text-gray-500 text-sm">No hay categorías. ¡Crea la primera!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {categorias.map(cat => (
            <div key={cat.id} className="rounded-2xl p-4 sm:p-5 border text-center hover:bg-white/5 transition cursor-pointer active:scale-[0.97]"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,215,0,0.08)' }} onClick={() => openEdit(cat)}>
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{cat.icono || '🍽️'}</div>
              <h3 className="font-bold text-white text-sm sm:text-base">{cat.nombre}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Orden {cat.orden}</p>
              <button onClick={e => { e.stopPropagation(); handleDelete(cat.id); }}
                className="mt-2 sm:mt-3 text-xs text-red-400 hover:text-red-300 min-h-[36px] px-3 rounded-lg">Eliminar</button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="w-full max-w-sm mx-auto rounded-2xl sm:rounded-3xl p-6 sm:p-7 border" style={{ background: 'rgba(20,16,45,0.95)', borderColor: 'rgba(255,215,0,0.1)', backdropFilter: 'blur(40px)' }}>
            <h3 className="font-extrabold text-white text-base sm:text-lg mb-5 sm:mb-6">{editing ? 'Editar' : 'Nueva'} Categoría</h3>
            <div className="space-y-4">
              <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="w-full border rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 text-white outline-none text-sm sm:text-base transition"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,215,0,0.1)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(255,215,0,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,215,0,0.1)'}
                placeholder="Nombre de la categoría" />
              <div>
                <label className="block text-gray-400 text-xs sm:text-sm font-semibold mb-2">Ícono</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {ICONOS.map(ico => (
                    <button key={ico} onClick={() => setForm({ ...form, icono: ico })}
                      className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl flex items-center justify-center text-base sm:text-lg transition active:scale-90"
                      style={form.icono === ico ? { background: 'rgba(255,215,0,0.2)', border: '1px solid rgba(255,215,0,0.5)' } : { background: 'rgba(255,255,255,0.05)', border: '1px solid transparent' }}>
                      {ico}
                    </button>
                  ))}
                </div>
              </div>
              <input type="number" value={form.orden} onChange={e => setForm({ ...form, orden: parseInt(e.target.value) || 0 })}
                className="w-full border rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 text-white outline-none text-sm sm:text-base transition"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,215,0,0.1)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(255,215,0,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,215,0,0.1)'}
                placeholder="Orden" />
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave}
                  className="flex-1 min-h-[44px] py-3 rounded-xl font-bold text-sm sm:text-base text-white active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,165,0,0.2))', border: '1px solid rgba(255,215,0,0.2)' }}>Guardar</button>
                <button onClick={() => setShowModal(false)}
                  className="flex-1 min-h-[44px] py-3 rounded-xl text-gray-400 font-bold text-sm sm:text-base hover:bg-white/10 transition" style={{ background: 'rgba(255,255,255,0.05)' }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
