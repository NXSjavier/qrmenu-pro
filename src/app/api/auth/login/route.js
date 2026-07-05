import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generarToken, compararPassword } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const [rows] = await pool.query('SELECT * FROM restaurantes WHERE email = ?', [email]);
    if (!rows.length || !compararPassword(password, rows[0].password_hash)) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const restaurante = rows[0];
    const token = generarToken(restaurante);

    return NextResponse.json({
      token,
      restaurante: { id: restaurante.id, nombre: restaurante.nombre, slug: restaurante.slug },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
