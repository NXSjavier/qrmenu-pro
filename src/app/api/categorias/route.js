import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verificarToken } from '@/lib/auth';

function getUser(req) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  return verificarToken(token);
}

export async function GET(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const [rows] = await pool.query('SELECT * FROM categorias WHERE restaurante_id = ? ORDER BY orden ASC', [user.id]);
  return NextResponse.json(rows);
}

export async function POST(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { nombre, icono, orden } = await req.json();
  if (!nombre) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

  const [result] = await pool.query(
    'INSERT INTO categorias (restaurante_id, nombre, icono, orden) VALUES (?, ?, ?, ?)',
    [user.id, nombre, icono || '🍽️', orden || 0]
  );
  return NextResponse.json({ id: result.insertId }, { status: 201 });
}

export async function PUT(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id, nombre, icono, orden } = await req.json();
  await pool.query('UPDATE categorias SET nombre=?, icono=?, orden=? WHERE id=? AND restaurante_id=?',
    [nombre, icono, orden, id, user.id]);
  return NextResponse.json({ success: true });
}

export async function DELETE(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await req.json();
  await pool.query('DELETE FROM categorias WHERE id=? AND restaurante_id=?', [id, user.id]);
  return NextResponse.json({ success: true });
}
