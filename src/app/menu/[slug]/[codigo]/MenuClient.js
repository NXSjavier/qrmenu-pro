'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const BG_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200',
];

export default function MenuClient({ initialData }) {
  const { restaurante, mesa, categorias, productos } = initialData;
  const [carrito, setCarrito] = useState({});
  const [activeCat, setActiveCat] = useState(categorias.length ? categorias[0].id : null);
  const [pedidoId, setPedidoId] = useState(null);
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const [pedidoListo, setPedidoListo] = useState(false);
  const [resumen, setResumen] = useState([]);
  const [pedidoTotal, setPedidoTotal] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [estadoTexto, setEstadoTexto] = useState('Preparando tu pedido...');
  const [estadoEmoji, setEstadoEmoji] = useState('⏳');
  const [progreso, setProgreso] = useState(10);
  const [listoNotified, setListoNotified] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const intervalRef = useRef(null);
  const audioCtxRef = useRef(null);
  const cardRefs = useRef({});

  useEffect(() => {
    const saved = localStorage.getItem(`carrito_${mesa.id}`);
    if (saved) setCarrito(JSON.parse(saved));
    const savedPedido = localStorage.getItem(`pedido_id_${mesa.id}`);
    if (savedPedido) { setPedidoId(parseInt(savedPedido)); setPedidoEnviado(true); }
  }, []);

  useEffect(() => {
    const bgInterval = setInterval(() => setBgIndex(i => (i + 1) % BG_IMAGES.length), 6000);
    return () => clearInterval(bgInterval);
  }, []);

  useEffect(() => {
    if (!pedidoId) return;
    intervalRef.current = setInterval(verificarEstado, 5000);
    verificarEstado();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pedidoId]);

  const verificarEstado = useCallback(async () => {
    if (!pedidoId) return;
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/estado`);
      if (!res.ok) { setEstadoTexto('Pedido no encontrado'); setEstadoEmoji('❌'); return; }
      const data = await res.json();
      switch (data.estado) {
        case 'nuevo': setEstadoTexto('Pedido recibido, pronto lo preparamos...'); setEstadoEmoji('✅'); setProgreso(25); break;
        case 'preparando': setEstadoTexto('Estamos preparando tu pedido...'); setEstadoEmoji('👨‍🍳'); setProgreso(60); break;
        case 'listo':
        case 'entregado':
          setEstadoTexto(data.estado === 'listo' ? '¡Tu pedido está listo!' : '¡Disfruta! Buen provecho');
          setEstadoEmoji('😊'); setProgreso(100);
          if (!listoNotified) { setListoNotified(true); setPedidoListo(true); playListo(); if (navigator.vibrate) navigator.vibrate([100,100,100,100,200]); }
          break;
      }
    } catch {}
  }, [pedidoId, listoNotified]);

  function playListo() {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = 'sine';
        const t = ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(0.12, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        osc.start(t); osc.stop(t + 0.25);
      });
    } catch {}
  }

  const totalCarrito = Object.entries(carrito).reduce((sum, [id, qty]) => {
    const p = productos.find(pr => pr.id === parseInt(id));
    return sum + (p ? p.precio * qty : 0);
  }, 0);
  const totalItems = Object.values(carrito).reduce((a, b) => a + b, 0);

  function agregar(prod) {
    setCarrito(prev => {
      const next = { ...prev, [prod.id]: (prev[prod.id] || 0) + 1 };
      localStorage.setItem(`carrito_${mesa.id}`, JSON.stringify(next));
      return next;
    });
    if (navigator.vibrate) navigator.vibrate(10);
  }

  function quitar(prodId) {
    setCarrito(prev => {
      const next = { ...prev };
      if (next[prodId] > 1) next[prodId]--; else delete next[prodId];
      localStorage.setItem(`carrito_${mesa.id}`, JSON.stringify(next));
      return next;
    });
    if (navigator.vibrate) navigator.vibrate(5);
  }

  async function enviarPedido() {
    if (enviando) return;
    setEnviando(true);
    const items = Object.entries(carrito).map(([id, qty]) => ({ producto_id: parseInt(id), cantidad: qty, precio_unitario: productos.find(p => p.id === parseInt(id)).precio }));
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurante_id: restaurante.id, mesa_id: mesa.id, items }),
      });
      const data = await res.json();
      if (data.success) {
        setPedidoId(data.pedido_id);
        setResumen(items.map(i => ({ ...i, nombre: productos.find(p => p.id === i.producto_id)?.nombre || 'Producto' })));
        setPedidoTotal(totalCarrito); setPedidoEnviado(true); setCarrito({});
        localStorage.removeItem(`carrito_${mesa.id}`); localStorage.setItem(`pedido_id_${mesa.id}`, data.pedido_id);
      } else alert('Error: ' + (data.error || 'No se pudo enviar'));
    } catch { alert('Error de conexión'); }
    setEnviando(false);
  }

  function cerrarCelebracion() {
    setPedidoListo(false); setPedidoEnviado(false); setPedidoId(null);
    setResumen([]); setPedidoTotal(0); setListoNotified(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    localStorage.removeItem(`pedido_id_${mesa.id}`); if (navigator.vibrate) navigator.vibrate(0);
  }

  function scrollToCat(catId) {
    setActiveCat(catId);
    document.getElementById(`cat-${catId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleMouseMove(e, id) {
    const card = cardRefs.current[id];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(10px)`;
  }

  function handleMouseLeave(id) {
    const card = cardRefs.current[id];
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0)';
  }

  const bgImages = BG_IMAGES.map(url => `${url}&q=80&auto=format&fit=crop&w=1920`);

  return (
    <div className="relative min-h-screen pb-32 overflow-x-hidden">
      {/* Background Carousel */}
      <div className="fixed inset-0 z-0">
        {bgImages.map((url, i) => (
          <div key={i} className="absolute inset-0 transition-all duration-1500 ease-in-out"
            style={{
              opacity: i === bgIndex ? 1 : 0,
              backgroundImage: `url(${url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(24px) saturate(0.7)',
              transform: `scale(${i === bgIndex ? 1.05 : 1})`,
              transition: 'opacity 2s ease-in-out, transform 6s ease-out',
            }}
          />
        ))}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(12,10,26,0.85) 0%, rgba(12,10,26,0.6) 30%, rgba(12,10,26,0.7) 60%, rgba(12,10,26,0.95) 100%)',
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Top Bar */}
        <div className="sticky top-0 z-30" style={{
          background: 'rgba(12,10,26,0.75)',
          backdropFilter: 'blur(40px) saturate(1.5)',
          borderBottom: '1px solid rgba(255,215,0,0.08)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
        }}>
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20"
                style={{ transform: 'perspective(500px) rotateX(2deg)' }}>
                <span className="text-lg">👑</span>
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-white leading-tight tracking-wide">{restaurante.nombre}</h1>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400"></span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,215,0,0.6)' }}>Mesa {mesa.nombre_mesa}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(255,215,0,0.4)' }}>Menú</p>
              <p className="text-[10px] text-gray-500">Digital</p>
            </div>
          </div>
          {categorias.length > 0 && (
            <div className="max-w-4xl mx-auto px-4 pb-3 overflow-x-auto">
              <div className="flex gap-2">
                {categorias.map(cat => (
                  <button key={cat.id} onClick={() => scrollToCat(cat.id)}
                    className={`px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                      activeCat === cat.id
                        ? 'text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    style={activeCat === cat.id ? {
                      background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.05))',
                      border: '1px solid rgba(255,215,0,0.3)',
                      boxShadow: '0 4px 20px rgba(255,215,0,0.15)',
                    } : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                    {cat.icono} {cat.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Products */}
        <div className="max-w-4xl mx-auto px-4 pt-6">
          {categorias.map(cat => (
            <div key={cat.id} id={`cat-${cat.id}`} className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-6 w-1 rounded-full bg-gradient-to-b from-amber-400 to-yellow-600 shadow-sm shadow-amber-500/30"></div>
                <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,215,0,0.5)' }}>{cat.icono} {cat.nombre}</span>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(255,215,0,0.15), transparent)' }}></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {productos.filter(p => p.categoria_id === cat.id).map(prod => (
                  <div key={prod.id} ref={el => cardRefs.current[prod.id] = el}
                    onMouseMove={e => handleMouseMove(e, prod.id)} onMouseLeave={() => handleMouseLeave(prod.id)}
                    className="group rounded-3xl p-5 flex gap-4 transition-all duration-300 cursor-pointer"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      backdropFilter: 'blur(12px)',
                      transformStyle: 'preserve-3d',
                      transform: 'perspective(800px) rotateY(0deg) rotateX(0deg)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    }}>
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden flex-shrink-0 relative"
                      style={{ transform: 'translateZ(20px)' }}>
                      {prod.imagen
                        ? <img src={prod.imagen} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: 'rgba(255,215,0,0.05)' }}>🍽️</div>
                      }
                      <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)' }}></div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-white text-sm md:text-base tracking-wide">{prod.nombre}</h3>
                        <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{prod.descripcion || '—'}</p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-lg md:text-xl font-extrabold tracking-tight" style={{
                          background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}>${parseFloat(prod.precio).toFixed(2)}</p>
                        <div className="flex items-center gap-2">
                          {carrito[prod.id] > 0 && (
                            <>
                              <button onClick={() => quitar(prod.id)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all active:scale-90"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4"/></svg>
                              </button>
                              <span className="text-sm font-bold text-white w-5 text-center tabular-nums">{carrito[prod.id]}</span>
                            </>
                          )}
                          <button onClick={() => agregar(prod)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg transition-all active:scale-90 hover:shadow-xl"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,165,0,0.2))',
                              border: '1px solid rgba(255,215,0,0.2)',
                              boxShadow: '0 4px 15px rgba(255,215,0,0.15)',
                            }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Cart Bar */}
        {totalItems > 0 && !pedidoEnviado && !pedidoListo && (
          <div className="fixed bottom-0 left-0 right-0 z-40 p-4 md:p-6" style={{
            background: 'rgba(12,10,26,0.9)',
            backdropFilter: 'blur(40px) saturate(1.5)',
            borderTop: '1px solid rgba(255,215,0,0.1)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
          }}>
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="min-w-[24px] h-[24px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-2"
                    style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', boxShadow: '0 2px 10px rgba(255,215,0,0.3)' }}>{totalItems}</span>
                  <span className="text-xs" style={{ color: 'rgba(255,215,0,0.6)' }}>en tu pedido</span>
                </div>
                <p className="text-2xl md:text-3xl font-extrabold" style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>${totalCarrito.toFixed(2)}</p>
              </div>
              <button onClick={enviarPedido} disabled={enviando}
                className="px-10 py-4 rounded-2xl text-white font-bold text-sm disabled:opacity-50 active:scale-95 transition-all duration-300 hover:shadow-xl flex items-center gap-3"
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  boxShadow: '0 8px 30px rgba(255,215,0,0.25)',
                }}>
                {enviando ? 'Enviando...' : '📋 Pedir'}
              </button>
            </div>
          </div>
        )}

        {/* Waiting Modal */}
        {pedidoEnviado && !pedidoListo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }}>
            <div className="w-full max-w-sm rounded-3xl p-8 md:p-10 text-center border animate-modalIn"
              style={{
                background: 'rgba(20,16,45,0.95)',
                backdropFilter: 'blur(40px)',
                borderColor: 'rgba(255,215,0,0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,215,0,0.05)',
              }}>
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.05))',
                  border: '1px solid rgba(255,215,0,0.1)',
                  boxShadow: '0 8px 30px rgba(255,215,0,0.1)',
                }}>
                <span className="text-5xl">{estadoEmoji}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">Pedido <span style={{ color: '#FFD700' }}>#{pedidoId}</span></h2>
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{estadoTexto}</p>
              <div className="mt-6 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)' }}>
                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{
                  width: `${progreso}%`,
                  background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                  boxShadow: '0 0 15px rgba(255,215,0,0.3)',
                }}></div>
              </div>
              {resumen.length > 0 && (
                <div className="mt-5 text-left rounded-2xl p-4 space-y-2 max-h-32 overflow-y-auto"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {resumen.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300"><span style={{ color: '#FFD700' }} className="font-bold">{item.cantidad}x</span> {item.nombre}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>${(item.precio_unitario * item.cantidad).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex items-center justify-between text-sm font-bold" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Total</span>
                    <span className="text-white">${pedidoTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 mt-6">
                <span className="w-2 h-2 rounded-full" style={{ background: '#FFD700', animation: 'pulse-dot 1.5s ease-in-out infinite' }}></span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Actualizando automáticamente...</span>
              </div>
            </div>
          </div>
        )}

        {/* Celebration */}
        {pedidoListo && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
            style={{ background: 'rgba(12,10,26,0.92)', backdropFilter: 'blur(30px)' }}>
            {[...Array(30)].map((_, i) => (
              <div key={i} className="absolute pointer-events-none"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: 4, height: 4,
                  borderRadius: '50%',
                  background: i % 2 ? '#FFD700' : '#FFA500',
                  animation: `sparkleFloat ${2 + Math.random() * 2}s ease-in-out ${Math.random() * 2}s infinite`,
                  opacity: 0,
                }}
              />
            ))}
            <div className="text-center relative z-10 max-w-sm w-full">
              <div className="mx-auto mb-6 w-36 h-36 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,165,0,0.1))',
                  border: '2px solid rgba(255,215,0,0.2)',
                  boxShadow: '0 0 60px rgba(255,215,0,0.15), inset 0 0 40px rgba(255,215,0,0.05)',
                  animation: 'smileyBounce 0.8s cubic-bezier(.4,0,.2,1) forwards',
                }}>
                <span className="text-7xl">😊</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-3" style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'fadeUp 0.5s 0.3s both',
              }}>
                ¡Listo!
              </h2>
              <p className="text-xl font-bold text-white mb-1" style={{ animation: 'fadeUp 0.5s 0.5s both' }}>Tu pedido está listo</p>
              <p className="text-sm" style={{ color: 'rgba(255,215,0,0.5)', animation: 'fadeUp 0.5s 0.6s both' }}>
                Pedido #{pedidoId} · Mesa {mesa.nombre_mesa}
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)', animation: 'fadeUp 0.5s 0.7s both' }}>
                Por favor pasa a recoger tu orden
              </p>
              <button onClick={cerrarCelebracion}
                className="mt-8 w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95 hover:shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  boxShadow: '0 8px 30px rgba(255,215,0,0.25)',
                  animation: 'fadeUp 0.5s 0.9s both',
                }}>
                ¡Buen provecho! 🎉
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-dot { 0%,100% { transform:scale(1); opacity:1 } 50% { transform:scale(1.5); opacity:.5 } }
        @keyframes smileyBounce { 0% { transform:scale(0) rotate(-20deg); opacity:0 } 50% { transform:scale(1.2) rotate(5deg) } 70% { transform:scale(0.9) } 100% { transform:scale(1) rotate(0deg); opacity:1 } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }
        @keyframes sparkleFloat { 0% { transform:translateY(0) scale(0); opacity:0 } 20% { opacity:1 } 100% { transform:translateY(-120px) scale(0); opacity:0 } }
        @keyframes animate-modalIn { from { opacity:0; transform:scale(0.9) translateY(20px) } to { opacity:1; transform:scale(1) translateY(0) } }
        .animate-modalIn { animation: animate-modalIn 0.4s ease-out; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.1); border-radius: 4px; }
        @media (max-width: 640px) {
          .group { backdrop-filter: blur(8px) !important; }
        }
      `}</style>
    </div>
  );
}
