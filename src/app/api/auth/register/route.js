import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generarToken, hashPassword } from '@/lib/auth';

export async function POST(req) {
  try {
    const { nombre, email, password } = await req.json();
    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    const slug = nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const [existe] = await pool.query('SELECT id FROM restaurantes WHERE email = ?', [email]);
    if (existe.length) {
      return NextResponse.json({ error: 'Email ya registrado' }, { status: 400 });
    }

    const hash = hashPassword(password);
    const [result] = await pool.query(
      'INSERT INTO restaurantes (nombre, slug, email, password_hash) VALUES (?, ?, ?, ?)',
      [nombre, slug, email, hash]
    );

    const token = generarToken({ id: result.insertId, nombre, slug });

    return NextResponse.json({
      token,
      restaurante: { id: result.insertId, nombre, slug },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
