import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req, { params }) {
  const { slug, codigo } = params;

  try {
    const [rests] = await pool.query(`
      SELECT r.id, r.nombre FROM restaurantes r
      JOIN mesas m ON m.restaurante_id = r.id
      WHERE r.slug = ? AND m.codigo_qr = ? AND m.activa = 1 LIMIT 1
    `, [slug, codigo]);

    if (!rests.length) {
      return NextResponse.json({ error: 'Mesa no encontrada' }, { status: 404 });
    }

    const restaurante = rests[0];

    const [mesas] = await pool.query(
      'SELECT id, nombre_mesa FROM mesas WHERE codigo_qr = ? AND restaurante_id = ? LIMIT 1',
      [codigo, restaurante.id]
    );
    if (!mesas.length) {
      return NextResponse.json({ error: 'Mesa no encontrada' }, { status: 404 });
    }

    const [categorias] = await pool.query(
      'SELECT id, nombre, icono FROM categorias WHERE restaurante_id = ? ORDER BY orden ASC',
      [restaurante.id]
    );

    const [productos] = await pool.query(
      'SELECT id, categoria_id, nombre, descripcion, precio, imagen FROM productos WHERE restaurante_id = ? AND disponible = 1 ORDER BY id ASC',
      [restaurante.id]
    );

    return NextResponse.json({
      restaurante: { id: restaurante.id, nombre: restaurante.nombre },
      mesa: mesas[0],
      categorias,
      productos,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
