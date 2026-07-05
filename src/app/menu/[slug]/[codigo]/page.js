import pool from '@/lib/db';
import MenuClient from './MenuClient';

export default async function MenuPage({ params }) {
  const { slug, codigo } = params;

  try {
    const [rests] = await pool.query(`
      SELECT r.id, r.nombre FROM restaurantes r
      JOIN mesas m ON m.restaurante_id = r.id
      WHERE r.slug = ? AND m.codigo_qr = ? AND m.activa = 1 LIMIT 1
    `, [slug, codigo]);

    if (!rests.length) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6"><span className="text-4xl">🔍</span></div>
            <h1 className="text-xl font-extrabold text-white mb-2">Mesa no encontrada</h1>
            <p className="text-gray-500 text-sm">Código QR inválido o mesa inactiva</p>
          </div>
        </div>
      );
    }

    const restaurante = rests[0];

    const [mesas] = await pool.query(
      'SELECT id, nombre_mesa FROM mesas WHERE codigo_qr = ? AND restaurante_id = ? LIMIT 1',
      [codigo, restaurante.id]
    );
    if (!mesas.length) throw new Error('Mesa no encontrada');

    const [categorias] = await pool.query(
      'SELECT id, nombre, icono FROM categorias WHERE restaurante_id = ? ORDER BY orden ASC',
      [restaurante.id]
    );

    const [productos] = await pool.query(
      'SELECT id, categoria_id, nombre, descripcion, precio, imagen FROM productos WHERE restaurante_id = ? AND disponible = 1 ORDER BY id ASC',
      [restaurante.id]
    );

    const initialData = {
      restaurante: { id: restaurante.id, nombre: restaurante.nombre },
      mesa: mesas[0],
      categorias,
      productos,
    };

    return <MenuClient initialData={initialData} />;
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6"><span className="text-4xl">🔍</span></div>
          <h1 className="text-xl font-extrabold text-white mb-2">Error</h1>
          <p className="text-gray-500 text-sm">No se pudo cargar el menú</p>
        </div>
      </div>
    );
  }
}
