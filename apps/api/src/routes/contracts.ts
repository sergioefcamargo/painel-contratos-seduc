import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const uid = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const CONTRACT_FIELDS = [
  'numero', 'processo', 'objeto', 'fornecedor', 'cnpj',
  'vig_inicio', 'vig_fim', 'modalidade', 'classificacao', 'situacao',
  'status_contrato', 'alerta', 'gestor', 'area_responsavel',
  'processo_pagamento', 'sislog', 'data_assinatura', 'data_publicacao_doe',
  'link_contrato', 'termo_encerramento', 'prazo', 'dias_vencimento',
  'observacoes', 'doc_ref', 'auto_alocacao',
];

function enrichContract(c: any) {
  if (!c) return null;
  c.items = db.prepare('SELECT * FROM contract_items WHERE contract_id = ? ORDER BY sort_order, id').all(c.id);
  c.empenhos = db.prepare('SELECT * FROM empenhos WHERE contract_id = ? ORDER BY id').all(c.id);
  c.aditivos = db.prepare('SELECT * FROM aditivos WHERE contract_id = ? ORDER BY id').all(c.id);
  c.lancamentos = db.prepare(`
    SELECT l.*,
      (SELECT json_group_array(json_object('empenho',a.empenho,'qtd',a.qtd))
       FROM lancamento_alocacoes a WHERE a.lancamento_id = l.id) as alocacoes_json
    FROM lancamentos l WHERE l.contract_id = ? ORDER BY l.id
  `).all(c.id).map((l: any) => ({
    ...l,
    pago: !!l.pago,
    alocacoes: l.alocacoes_json ? JSON.parse(l.alocacoes_json) : [],
    alocacoes_json: undefined,
  }));
  return c;
}

router.get('/', (req, res) => {
  const { q, situacao, gestor, vigencia } = req.query as Record<string, string>;
  let sql = 'SELECT * FROM contracts WHERE 1=1';
  const params: any[] = [];

  if (q) {
    sql += ' AND (fornecedor LIKE ? OR numero LIKE ? OR objeto LIKE ? OR cnpj LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (situacao) { sql += ' AND situacao = ?'; params.push(situacao); }
  if (gestor) { sql += ' AND gestor LIKE ?'; params.push(`%${gestor}%`); }
  if (vigencia === 'vigente') {
    sql += " AND vig_fim >= date('now') AND vig_inicio <= date('now')";
  } else if (vigencia === 'vencida') {
    sql += " AND vig_fim < date('now')";
  } else if (vigencia === 'vencendo') {
    sql += " AND vig_fim >= date('now') AND vig_fim <= date('now', '+30 days')";
  }

  sql += ' ORDER BY updated_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/dashboard', (_req, res) => {
  const total = (db.prepare('SELECT COUNT(*) as n FROM contracts').get() as any).n;
  const vigentes = (db.prepare("SELECT COUNT(*) as n FROM contracts WHERE vig_fim >= date('now') AND vig_inicio <= date('now')").get() as any).n;
  const vencidas = (db.prepare("SELECT COUNT(*) as n FROM contracts WHERE vig_fim < date('now')").get() as any).n;
  const vencendo = (db.prepare("SELECT COUNT(*) as n FROM contracts WHERE vig_fim >= date('now') AND vig_fim <= date('now','+30 days')").get() as any).n;

  const totalEmpenhadoCents = (db.prepare('SELECT COALESCE(SUM(valor_cents),0) as s FROM empenhos').get() as any).s;
  const totalNFCents = (db.prepare('SELECT COALESCE(SUM(valor_nf_cents),0) as s FROM lancamentos').get() as any).s;

  const byGestor = db.prepare(`
    SELECT gestor, COUNT(*) as total,
      SUM(CASE WHEN vig_fim >= date('now') AND vig_inicio <= date('now') THEN 1 ELSE 0 END) as vigentes
    FROM contracts WHERE gestor != '' GROUP BY gestor ORDER BY total DESC LIMIT 10
  `).all();

  res.json({ total, vigentes, vencidas, vencendo, totalEmpenhadoCents, totalNFCents, byGestor });
});

router.post('/', (req, res) => {
  const id = uid();
  const body = req.body ?? {};
  const fields = CONTRACT_FIELDS.filter(f => f in body);
  const values = fields.map(f => body[f] ?? '');

  db.prepare(`
    INSERT INTO contracts (id, ${fields.join(',')}, created_by)
    VALUES (?, ${fields.map(() => '?').join(',')}, ?)
  `).run(id, ...values, req.user!.userId);

  res.status(201).json(enrichContract(db.prepare('SELECT * FROM contracts WHERE id = ?').get(id)));
});

router.get('/:id', (req, res) => {
  const c = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
  if (!c) { res.status(404).json({ error: 'Contrato não encontrado' }); return; }
  res.json(enrichContract(c));
});

router.put('/:id', (req, res) => {
  const body = req.body ?? {};
  const fields = CONTRACT_FIELDS.filter(f => f in body);
  if (!fields.length) { res.status(400).json({ error: 'Nenhum campo para atualizar' }); return; }

  db.prepare(`
    UPDATE contracts SET ${fields.map(f => `${f} = ?`).join(',')}, updated_at = datetime('now')
    WHERE id = ?
  `).run(...fields.map(f => body[f]), req.params.id);

  const c = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
  if (!c) { res.status(404).json({ error: 'Contrato não encontrado' }); return; }
  res.json(enrichContract(c));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM contracts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
