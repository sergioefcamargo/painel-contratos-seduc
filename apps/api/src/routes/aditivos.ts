import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

const ADITIVO_FIELDS = [
  'numero', 'ano', 'tipo', 'processo', 'data', 'item_num',
  'qtd_acrescimo', 'qtd_supressao', 'valor_acrescimo_cents', 'valor_supressao_cents',
  'nova_vig_fim', 'observacao', 'empenho_num', 'empenho_valor_cents',
];

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM aditivos WHERE contract_id = ? ORDER BY id').all(req.params.id));
});

router.post('/', (req, res) => {
  const body = req.body ?? {};
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO aditivos (contract_id, ${ADITIVO_FIELDS.join(',')})
    VALUES (?, ${ADITIVO_FIELDS.map(() => '?').join(',')})
  `).run(req.params.id, ...ADITIVO_FIELDS.map(f => body[f] ?? ''));
  res.status(201).json(db.prepare('SELECT * FROM aditivos WHERE id = ?').get(lastInsertRowid));
});

router.put('/:aditivoId', (req, res) => {
  const body = req.body ?? {};
  db.prepare(`
    UPDATE aditivos SET ${ADITIVO_FIELDS.map(f => `${f}=?`).join(',')}
    WHERE id=? AND contract_id=?
  `).run(...ADITIVO_FIELDS.map(f => body[f] ?? ''), req.params.aditivoId, req.params.id);
  res.json(db.prepare('SELECT * FROM aditivos WHERE id = ?').get(req.params.aditivoId));
});

router.delete('/:aditivoId', (req, res) => {
  db.prepare('DELETE FROM aditivos WHERE id = ? AND contract_id = ?').run(req.params.aditivoId, req.params.id);
  res.json({ ok: true });
});

export default router;
