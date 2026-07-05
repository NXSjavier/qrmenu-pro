import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verificarToken } from '@/lib/auth';

export async function GET(req) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const user = verificarToken(token);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const [pedidos] = await pool.query(`
      SELECT p.id, p.mesa_id, p.estado, p.total, p.creado_en,
             m.nombre_mesa AS mesa_nombre,
             DATE_FORMAT(p.creado_en, '%H:%i') AS hora
      FROM pedidos p
      JOIN mesas m ON m.id = p.mesa_id
      WHERE p.restaurante_id = ? AND p.estado IN ('nuevo','preparando','listo')
      ORDER BY FIELD(p.estado, 'nuevo','preparando','listo'), p.creado_en ASC
    `, [user.id]);

    for (const pedido of pedidos) {
      const [items] = await pool.query(`
        SELECT pi.cantidad, pi.precio_unitario, pr.nombre
        FROM pedido_items pi
        JOIN productos pr ON pr.id = pi.producto_id
        WHERE pi.pedido_id = ?
      `, [pedido.id]);
      pedido.items = items;
    }

    return NextResponse.json(pedidos);
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { restaurante_id, mesa_id, items } = await req.json();
    if (!restaurante_id || !mesa_id || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const [mesas] = await pool.query('SELECT id FROM mesas WHERE id = ? AND restaurante_id = ? AND activa = 1', [mesa_id, restaurante_id]);
    if (!mesas.length) return NextResponse.json({ error: 'Mesa no válida' }, { status: 400 });

    let total = 0;
    const itemsData = [];
    for (const item of items) {
      const [prods] = await pool.query('SELECT precio FROM productos WHERE id = ? AND restaurante_id = ? AND disponible = 1', [item.producto_id, restaurante_id]);
      if (!prods.length) return NextResponse.json({ error: `Producto inválido: ${item.producto_id}` }, { status: 400 });
      const cantidad = Math.max(1, parseInt(item.cantidad) || 1);
      total += parseFloat(prods[0].precio) * cantidad;
      itemsData.push({ producto_id: item.producto_id, cantidad, precio_unitario: parseFloat(prods[0].precio), nota: item.nota || null });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [pedido] = await conn.query('INSERT INTO pedidos (restaurante_id, mesa_id, total) VALUES (?, ?, ?)', [restaurante_id, mesa_id, total]);
      const pedido_id = pedido.insertId;
      for (const item of itemsData) {
        await conn.query('INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, nota) VALUES (?, ?, ?, ?, ?)',
          [pedido_id, item.producto_id, item.cantidad, item.precio_unitario, item.nota]);
      }
      await conn.commit();
      return NextResponse.json({ success: true, pedido_id });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error al procesar el pedido' }, { status: 500 });
  }
}
