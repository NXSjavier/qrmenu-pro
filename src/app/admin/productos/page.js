'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductosPage() {
  const router = useRouter();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ categoria_id: '', nombre: '', descripcion: '', precio: '', imagen: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  async function cargar() {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/productos', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/categorias', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setProductos(await pRes.json());
      setCategorias(await cRes.json());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { if (token) cargar(); }, [token]);

  function openCreate() { setEditing(null); setForm({ categoria_id: '', nombre: '', descripcion: '', precio: '', imagen: '' }); setShowModal(true); }

  function openEdit(p) { setEditing(p); setForm({ categoria_id: p.categoria_id || '', nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio.toString(), imagen: p.imagen || '' }); setShowModal(true); }

  async function handleSave() {
    await fetch('/api/productos', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editing ? { ...form, id: editing.id } : form),
    });
    setShowModal(false);
    cargar();
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar producto?')) return;
    await fetch('/api/productos', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id }) });
    cargar();
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm({ ...form, imagen: ev.target.result });
    reader.readAsDataURL(file);
  }

  return (
    <div className="min-h-screen p-3 sm:p-4">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <a href="/admin/dashboard" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition active:scale-90" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </a>
          <h1 className="text-base sm:text-lg font-extrabold text-white">Productos</h1>
        </div>
        <button onClick={openCreate}
          className="px-4 sm:px-5 py-2.5 sm:py-3 min-h-[44px] rounded-xl font-bold text-xs sm:text-sm transition text-white active:scale-95"
          style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,165,0,0.2))', border: '1px solid rgba(255,215,0,0.2)', boxShadow: '0 4px 15px rgba(255,215,0,0.15)' }}>+ Nuevo</button>
      </div>

      {loading ? <p className="text-gray-500 text-center py-12 text-sm">Cargando...</p> : productos.length === 0 ? (
        <div className="text-center py-16"><div className="text-5xl sm:text-6xl mb-4 opacity-20">🍔</div><p className="text-gray-500 text-sm">No hay productos. ¡Crea el primero!</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {productos.map(p => (
            <div key={p.id} className="rounded-2xl p-4 border flex gap-3 sm:gap-4 hover:bg-white/5 transition cursor-pointer active:scale-[0.99]"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,215,0,0.08)' }} onClick={() => openEdit(p)}>
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl sm:text-3xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {p.imagen ? <img src={p.imagen} className="w-full h-full object-cover" /> : '🍽️'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm sm:text-base">{p.nombre}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2">{p.descripcion || ''}</p>
                <p className="text-sm sm:text-base font-extrabold mt-1.5" style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>${parseFloat(p.precio).toFixed(2)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-600">{p.disponible ? 'Disponible' : 'No disponible'}</span>
                  <button onClick={e => { e.stopPropagation(); handleDelete(p.id); }} className="text-xs text-red-400 hover:text-red-300 min-h-[36px] px-2">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="w-full max-w-md mx-auto rounded-2xl sm:rounded-3xl p-6 sm:p-7 border" style={{ background: 'rgba(20,16,45,0.95)', borderColor: 'rgba(255,215,0,0.1)', backdropFilter: 'blur(40px)' }}>
            <h3 className="font-extrabold text-white text-base sm:text-lg mb-5 sm:mb-6">{editing ? 'Editar' : 'Nuevo'} Producto</h3>
            <div className="space-y-4">
              <select value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}
                className="w-full border rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 text-white outline-none text-sm sm:text-base"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,215,0,0.1)' }}>
                <option value="" className="text-gray-500">Sin categoría</option>
                {categorias.map(c => <option key={c.id} value={c.id} className="text-white">{c.icono} {c.nombre}</option>)}
              </select>
              <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="w-full border rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 text-white outline-none text-sm sm:text-base transition"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,215,0,0.1)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(255,215,0,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,215,0,0.1)'}
                placeholder="Nombre" />
              <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                className="w-full border rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 text-white outline-none text-sm sm:text-base resize-none transition"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,215,0,0.1)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(255,215,0,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,215,0,0.1)'}
                placeholder="Descripción" rows={2} />
              <input type="number" step="0.01" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })}
                className="w-full border rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 text-white outline-none text-sm sm:text-base transition"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,215,0,0.1)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(255,215,0,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,215,0,0.1)'}
                placeholder="Precio" />
              <div>
                <label className="block text-gray-400 text-xs sm:text-sm font-semibold mb-2">Imagen</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs sm:text-sm text-gray-400 w-full" />
                {form.imagen && <img src={form.imagen} className="w-20 h-20 rounded-xl object-cover mt-2" />}
              </div>
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
