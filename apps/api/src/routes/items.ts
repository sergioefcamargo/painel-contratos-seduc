import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM contract_items WHERE contract_id = ? ORDER BY sort_order, id').all(req.params.id));
});

router.post('/', (req, res) => {
  const { item_num = '', descricao = '', qtd_contratada = 0, unidade = '', unit_price_cents = 0, sort_order = 0 } = req.body ?? {};
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO contract_items (contract_id, item_num, descricao, qtd_contratada, unidade, unit_price_cents, sort_order) VALUES (?,?,?,?,?,?,?)'
  ).run(req.params.id, item_num, descricao, qtd_contratada, unidade, unit_price_cents, sort_order);
  res.status(201).json(db.prepare('SELECT * FROM contract_items WHERE id = ?').get(lastInsertRowid));
});

router.put('/:itemId', (req, res) => {
  const { item_num, descricao, qtd_contratada, unidade, unit_price_cents, sort_order } = req.body ?? {};
  db.prepare(
    'UPDATE contract_items SET item_num=?, descricao=?, qtd_contratada=?, unidade=?, unit_price_cents=?, sort_order=? WHERE id=? AND contract_id=?'
  ).run(item_num, descricao, qtd_contratada, unidade, unit_price_cents, sort_order, req.params.itemId, req.params.id);
  res.json(db.prepare('SELECT * FROM contract_items WHERE id = ?').get(req.params.itemId));
});

router.delete('/:itemId', (req, res) => {
  db.prepare('DELETE FROM contract_items WHERE id = ? AND contract_id = ?').run(req.params.itemId, req.params.id);
  res.json({ ok: true });
});

export default router;
