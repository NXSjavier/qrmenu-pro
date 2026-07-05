import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verificarToken } from '@/lib/auth';

export async function GET(req, { params }) {
  const { id } = params;
  try {
    const [rows] = await pool.query('SELECT id, estado, mesa_id FROM pedidos WHERE id = ?', [id]);
    if (!rows.length) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    return NextResponse.json({ id: rows[0].id, estado: rows[0].estado });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const user = verificarToken(token);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = params;
  const { estado } = await req.json();

  if (!['preparando', 'listo', 'entregado'].includes(estado)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  try {
    const [pedidos] = await pool.query('SELECT id FROM pedidos WHERE id = ? AND restaurante_id = ?', [id, user.id]);
    if (!pedidos.length) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

    await pool.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
