import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'qrmenu-secret-key-2024';

export function generarToken(restaurante) {
  return jwt.sign(
    { id: restaurante.id, nombre: restaurante.nombre, slug: restaurante.slug },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verificarToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function compararPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}
