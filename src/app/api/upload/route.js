import { NextResponse } from 'next/server';
import { verificarToken } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const user = verificarToken(token);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('imagen');
    const tipo = formData.get('tipo') || 'productos';

    if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });

    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', tipo);

    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${tipo}/${filename}` });
  } catch (error) {
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 });
  }
}
