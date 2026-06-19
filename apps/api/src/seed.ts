import bcrypt from 'bcryptjs';
import { db, migrate } from './db.js';

migrate();

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@seduc.am.gov.br');
if (!existing) {
  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)')
    .run('Administrador', 'admin@seduc.am.gov.br', bcrypt.hashSync('seduc2026', 10), 'admin');
  console.log('Usuário criado: admin@seduc.am.gov.br / seduc2026');
} else {
  console.log('Usuário admin já existe.');
}
