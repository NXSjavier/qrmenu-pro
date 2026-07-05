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

  const { searchParams } = new URL(req.url);
  const soloDisponibles = searchParams.get('disponibles');

  let query = 'SELECT * FROM productos WHERE restaurante_id = ?';
  const params = [user.id];
  if (soloDisponibles) {
    query += ' AND disponible = 1';
  }
  query += ' ORDER BY id ASC';

  const [rows] = await pool.query(query, params);
  return NextResponse.json(rows);
}

export async function POST(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { categoria_id, nombre, descripcion, precio, imagen } = await req.json();
  if (!nombre || !precio) return NextResponse.json({ error: 'Nombre y precio requeridos' }, { status: 400 });

  const [result] = await pool.query(
    'INSERT INTO productos (restaurante_id, categoria_id, nombre, descripcion, precio, imagen) VALUES (?, ?, ?, ?, ?, ?)',
    [user.id, categoria_id || null, nombre, descripcion || null, precio, imagen || null]
  );
  return NextResponse.json({ id: result.insertId }, { status: 201 });
}

export async function PUT(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id, categoria_id, nombre, descripcion, precio, imagen, disponible } = await req.json();

  if (imagen !== undefined) {
    await pool.query(
      'UPDATE productos SET categoria_id=?, nombre=?, descripcion=?, precio=?, imagen=?, disponible=? WHERE id=? AND restaurante_id=?',
      [categoria_id, nombre, descripcion, precio, imagen, disponible ?? 1, id, user.id]
    );
  } else {
    await pool.query(
      'UPDATE productos SET categoria_id=?, nombre=?, descripcion=?, precio=?, disponible=? WHERE id=? AND restaurante_id=?',
      [categoria_id, nombre, descripcion, precio, disponible ?? 1, id, user.id]
    );
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await req.json();
  await pool.query('DELETE FROM productos WHERE id=? AND restaurante_id=?', [id, user.id]);
  return NextResponse.json({ success: true });
}
