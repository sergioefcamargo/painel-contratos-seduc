import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM empenhos WHERE contract_id = ? ORDER BY id').all(req.params.id));
});

router.post('/', (req, res) => {
  const { numero = '', valor_cents = 0, origem = 'contrato', aditivo_id } = req.body ?? {};
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO empenhos (contract_id, numero, valor_cents, origem, aditivo_id) VALUES (?,?,?,?,?)'
  ).run(req.params.id, numero, valor_cents, origem, aditivo_id ?? null);
  res.status(201).json(db.prepare('SELECT * FROM empenhos WHERE id = ?').get(lastInsertRowid));
});

router.put('/:empenhoId', (req, res) => {
  const { numero, valor_cents, origem } = req.body ?? {};
  db.prepare('UPDATE empenhos SET numero=?, valor_cents=?, origem=? WHERE id=? AND contract_id=?')
    .run(numero, valor_cents, origem, req.params.empenhoId, req.params.id);
  res.json(db.prepare('SELECT * FROM empenhos WHERE id = ?').get(req.params.empenhoId));
});

router.delete('/:empenhoId', (req, res) => {
  db.prepare('DELETE FROM empenhos WHERE id = ? AND contract_id = ?').run(req.params.empenhoId, req.params.id);
  res.json({ ok: true });
});

export default router;
