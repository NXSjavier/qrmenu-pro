import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verificarToken } from '@/lib/auth';
import os from 'os';

function getUser(req) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  return verificarToken(token);
}

function getRealIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets).sort()) {
    const interfaces = nets[name];
    if (!interfaces) continue;
    for (const net of interfaces) {
      if (net.family === 'IPv4' && !net.internal && net.address.startsWith('192.168.')) {
        return net.address;
      }
    }
  }
  return null;
}

export async function GET(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const [rows] = await pool.query('SELECT * FROM mesas WHERE restaurante_id = ? ORDER BY id ASC', [user.id]);
  const [slugResult] = await pool.query('SELECT slug FROM restaurantes WHERE id = ?', [user.id]);
  const slug = slugResult[0]?.slug;

  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  let host = req.headers.get('host') || 'localhost:8000';

  const hostname = host.split(':')[0];
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const realIP = getRealIP();
    if (realIP) {
      const port = host.split(':')[1] || '8000';
      host = `${realIP}:${port}`;
    }
  }

  return NextResponse.json({ mesas: rows, slug, baseURL: `${protocol}://${host}` });
}

export async function POST(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { accion, nombre_mesa, id } = await req.json();

  if (accion === 'crear') {
    if (!nombre_mesa) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    const codigo = Math.random().toString(36).substring(2, 12);
    const [result] = await pool.query(
      'INSERT INTO mesas (restaurante_id, nombre_mesa, codigo_qr) VALUES (?, ?, ?)',
      [user.id, nombre_mesa, codigo]
    );
    return NextResponse.json({ id: result.insertId, codigo_qr: codigo }, { status: 201 });
  }

  if (accion === 'editar') {
    await pool.query('UPDATE mesas SET nombre_mesa=? WHERE id=? AND restaurante_id=?', [nombre_mesa, id, user.id]);
    return NextResponse.json({ success: true });
  }

  if (accion === 'toggle') {
    await pool.query('UPDATE mesas SET activa = CASE WHEN activa = 1 THEN 0 ELSE 1 END WHERE id=? AND restaurante_id=?', [id, user.id]);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
}
