import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

function withAlocacoes(l: any) {
  const alocacoes = db.prepare('SELECT * FROM lancamento_alocacoes WHERE lancamento_id = ?').all(l.id);
  return { ...l, pago: !!l.pago, alocacoes };
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM lancamentos WHERE contract_id = ? ORDER BY id').all(req.params.id) as any[];
  res.json(rows.map(withAlocacoes));
});

router.post('/', (req, res) => {
  const {
    of_num = '', ano_of = '', item_num = '', qtd = 0,
    valor_nf_cents = 0, data_os = '', nf = '', data_nf = '',
    empenho = '', pago = false, alocacoes = [],
  } = req.body ?? {};

  const { lastInsertRowid } = db.prepare(`
    INSERT INTO lancamentos (contract_id, of_num, ano_of, item_num, qtd, valor_nf_cents, data_os, nf, data_nf, empenho, pago)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(req.params.id, of_num, ano_of, item_num, qtd, valor_nf_cents, data_os, nf, data_nf, empenho, pago ? 1 : 0);

  const id = lastInsertRowid;
  for (const a of (alocacoes as any[])) {
    db.prepare('INSERT INTO lancamento_alocacoes (lancamento_id, empenho, qtd) VALUES (?,?,?)').run(id, a.empenho, a.qtd);
  }

  res.status(201).json(withAlocacoes(db.prepare('SELECT * FROM lancamentos WHERE id = ?').get(id)));
});

router.put('/:lancId', (req, res) => {
  const {
    of_num, ano_of, item_num, qtd, valor_nf_cents, data_os, nf, data_nf, empenho, pago, alocacoes = [],
  } = req.body ?? {};

  db.prepare(`
    UPDATE lancamentos SET of_num=?, ano_of=?, item_num=?, qtd=?, valor_nf_cents=?, data_os=?, nf=?, data_nf=?, empenho=?, pago=?
    WHERE id=? AND contract_id=?
  `).run(of_num, ano_of, item_num, qtd, valor_nf_cents, data_os, nf, data_nf, empenho, pago ? 1 : 0, req.params.lancId, req.params.id);

  db.prepare('DELETE FROM lancamento_alocacoes WHERE lancamento_id = ?').run(req.params.lancId);
  for (const a of (alocacoes as any[])) {
    db.prepare('INSERT INTO lancamento_alocacoes (lancamento_id, empenho, qtd) VALUES (?,?,?)').run(req.params.lancId, a.empenho, a.qtd);
  }

  res.json(withAlocacoes(db.prepare('SELECT * FROM lancamentos WHERE id = ?').get(req.params.lancId)));
});

router.delete('/:lancId', (req, res) => {
  db.prepare('DELETE FROM lancamentos WHERE id = ? AND contract_id = ?').run(req.params.lancId, req.params.id);
  res.json({ ok: true });
});

export default router;
