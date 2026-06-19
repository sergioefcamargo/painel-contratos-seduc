import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { fmtBRL, fmtDate, fmtQty, daysUntil, vigStatus, parseCents, centsToDisplay } from '../lib/fmt';
import type { Contract, ContractItem, Empenho, Aditivo, Lancamento } from '../types';
import Modal from '../components/Modal';

type Tab = 'resumo' | 'itens' | 'empenhos' | 'aditivos' | 'lancamentos';

/* ───────── helpers ───────── */

function VigBadge({ vigFim }: { vigFim: string }) {
  const s = vigStatus(vigFim);
  const map = { vigente: 'b-ok', vencendo: 'b-warn', vencida: 'b-err' };
  const label = { vigente: 'Vigente', vencendo: 'Vencendo', vencida: 'Vencida' };
  return <span className={`badge ${map[s]}`}>{label[s]}</span>;
}

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
      <div className={mono ? 'mono' : ''} style={{ fontWeight: 500 }}>{value}</div>
    </div>
  );
}

/* ───────── Items tab ───────── */

function ItemsTab({ contract }: { contract: Contract }) {
  const qc = useQueryClient();
  const cid = contract.id;
  const items = contract.items ?? [];
  const [editing, setEditing] = useState<ContractItem | null>(null);
  const [form, setForm] = useState({ item_num: '', descricao: '', qtd_contratada: '', unidade: '', unit_price_cents: '' });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['contract', cid] });

  const createMut = useMutation({ mutationFn: (d: any) => api.items.create(cid, d), onSuccess: invalidate });
  const updateMut = useMutation({ mutationFn: ({ id, d }: any) => api.items.update(cid, id, d), onSuccess: () => { setEditing(null); invalidate(); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => api.items.delete(cid, id), onSuccess: invalidate });

  function openEdit(item: ContractItem) {
    setEditing(item);
    setForm({
      item_num: item.item_num,
      descricao: item.descricao,
      qtd_contratada: String(item.qtd_contratada),
      unidade: item.unidade,
      unit_price_cents: centsToDisplay(item.unit_price_cents),
    });
  }

  function save() {
    const d = {
      item_num: form.item_num,
      descricao: form.descricao,
      qtd_contratada: parseFloat(form.qtd_contratada.replace(',', '.')) || 0,
      unidade: form.unidade,
      unit_price_cents: parseCents(form.unit_price_cents),
    };
    if (editing?.id) updateMut.mutate({ id: editing.id, d });
    else createMut.mutate(d);
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const totalCents = items.reduce((s, i) => s + Math.round(i.qtd_contratada * i.unit_price_cents), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Itens do Contrato</h2>
        <button className="btn primary sm" onClick={() => { setEditing({} as ContractItem); setForm({ item_num: '', descricao: '', qtd_contratada: '', unidade: '', unit_price_cents: '' }); }}>
          + Adicionar Item
        </button>
      </div>

      {items.length === 0 && <p className="empty">Nenhum item cadastrado.</p>}

      {items.length > 0 && (
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Item</th><th>Descrição</th><th className="num">Qtd.</th>
                <th>Unidade</th><th className="num">Vlr. Unit.</th><th className="num">Total</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className="mono">{item.item_num || '—'}</td>
                  <td style={{ maxWidth: 300 }}>{item.descricao}</td>
                  <td className="num mono">{fmtQty(item.qtd_contratada)}</td>
                  <td>{item.unidade}</td>
                  <td className="num mono">{fmtBRL(item.unit_price_cents)}</td>
                  <td className="num mono">{fmtBRL(Math.round(item.qtd_contratada * item.unit_price_cents))}</td>
                  <td style={{ display: 'flex', gap: 4 }}>
                    <button className="btn icon sm" onClick={() => openEdit(item)} title="Editar">✎</button>
                    <button className="btn icon del" onClick={() => { if (confirm('Excluir item?')) deleteMut.mutate(item.id); }} title="Excluir">✕</button>
                  </td>
                </tr>
              ))}
              <tr style={{ fontWeight: 600, borderTop: '2px solid var(--line)' }}>
                <td colSpan={5} style={{ paddingTop: 10 }}>Total</td>
                <td className="num mono" style={{ paddingTop: 10 }}>{fmtBRL(totalCents)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {editing !== null && (
        <Modal title={editing.id ? 'Editar Item' : 'Novo Item'} onClose={() => setEditing(null)}
          footer={<>
            <button className="btn" onClick={() => setEditing(null)}>Cancelar</button>
            <button className="btn primary" onClick={save} disabled={createMut.isPending || updateMut.isPending}>Salvar</button>
          </>}>
          <div className="grid g2">
            <div><label>Item</label><input value={form.item_num} onChange={set('item_num')} /></div>
            <div><label>Unidade</label><input value={form.unidade} onChange={set('unidade')} /></div>
          </div>
          <div style={{ marginTop: 12 }}><label>Descrição</label><input value={form.descricao} onChange={set('descricao')} /></div>
          <div className="grid g2" style={{ marginTop: 12 }}>
            <div><label>Qtd. Contratada</label><input value={form.qtd_contratada} onChange={set('qtd_contratada')} /></div>
            <div><label>Valor Unitário (R$)</label><input value={form.unit_price_cents} onChange={set('unit_price_cents')} placeholder="0,00" /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ───────── Empenhos tab ───────── */

function EmpenhosTab({ contract }: { contract: Contract }) {
  const qc = useQueryClient();
  const cid = contract.id;
  const empenhos = contract.empenhos ?? [];
  const lancamentos = contract.lancamentos ?? [];
  const [editing, setEditing] = useState<Empenho | null>(null);
  const [form, setForm] = useState({ numero: '', valor: '' });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['contract', cid] });

  const usadoPorEmpenho = (num: string) =>
    lancamentos.reduce((s, l) => s + (l.empenho === num || l.alocacoes?.some(a => a.empenho === num) ? l.valor_nf_cents : 0), 0);

  const createMut = useMutation({ mutationFn: (d: any) => api.empenhos.create(cid, d), onSuccess: invalidate });
  const updateMut = useMutation({ mutationFn: ({ id, d }: any) => api.empenhos.update(cid, id, d), onSuccess: () => { setEditing(null); invalidate(); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => api.empenhos.delete(cid, id), onSuccess: invalidate });

  function openEdit(e: Empenho) {
    setEditing(e);
    setForm({ numero: e.numero, valor: centsToDisplay(e.valor_cents) });
  }

  function save() {
    const d = { numero: form.numero, valor_cents: parseCents(form.valor), origem: editing?.origem ?? 'contrato' };
    if (editing?.id) updateMut.mutate({ id: editing.id, d });
    else createMut.mutate(d);
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const totalCap = empenhos.reduce((s, e) => s + e.valor_cents, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Empenhos</h2>
        <button className="btn primary sm" onClick={() => { setEditing({} as Empenho); setForm({ numero: '', valor: '' }); }}>
          + Adicionar Empenho
        </button>
      </div>

      {empenhos.length === 0 && <p className="empty">Nenhum empenho cadastrado.</p>}

      {empenhos.length > 0 && (
        <div className="scroll">
          <table>
            <thead><tr><th>Número</th><th>Origem</th><th className="num">Valor</th><th className="num">Usado</th><th className="num">Saldo</th><th></th></tr></thead>
            <tbody>
              {empenhos.map(e => {
                const usado = usadoPorEmpenho(e.numero);
                const saldo = e.valor_cents - usado;
                return (
                  <tr key={e.id}>
                    <td className="mono">{e.numero || '—'}</td>
                    <td><span className="badge b-muted">{e.origem}</span></td>
                    <td className="num mono">{fmtBRL(e.valor_cents)}</td>
                    <td className="num mono">{fmtBRL(usado)}</td>
                    <td className={`num mono ${saldo < 0 ? 'saldo-neg' : saldo === 0 ? 'saldo-zero' : 'saldo-pos'}`}>{fmtBRL(saldo)}</td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      <button className="btn icon sm" onClick={() => openEdit(e)} title="Editar">✎</button>
                      <button className="btn icon del" onClick={() => { if (confirm('Excluir empenho?')) deleteMut.mutate(e.id); }} title="Excluir">✕</button>
                    </td>
                  </tr>
                );
              })}
              <tr style={{ fontWeight: 600, borderTop: '2px solid var(--line)' }}>
                <td colSpan={2} style={{ paddingTop: 10 }}>Total</td>
                <td className="num mono" style={{ paddingTop: 10 }}>{fmtBRL(totalCap)}</td>
                <td colSpan={3}></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {editing !== null && (
        <Modal title={editing.id ? 'Editar Empenho' : 'Novo Empenho'} onClose={() => setEditing(null)}
          footer={<>
            <button className="btn" onClick={() => setEditing(null)}>Cancelar</button>
            <button className="btn primary" onClick={save} disabled={createMut.isPending || updateMut.isPending}>Salvar</button>
          </>}>
          <div className="grid g2">
            <div><label>Número do Empenho</label><input value={form.numero} onChange={set('numero')} /></div>
            <div><label>Valor (R$)</label><input value={form.valor} onChange={set('valor')} placeholder="0,00" /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ───────── Aditivos tab ───────── */

function AditivosTab({ contract }: { contract: Contract }) {
  const qc = useQueryClient();
  const cid = contract.id;
  const aditivos = contract.aditivos ?? [];
  const [editing, setEditing] = useState<Aditivo | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const invalidate = () => qc.invalidateQueries({ queryKey: ['contract', cid] });

  const createMut = useMutation({ mutationFn: (d: any) => api.aditivos.create(cid, d), onSuccess: invalidate });
  const updateMut = useMutation({ mutationFn: ({ id, d }: any) => api.aditivos.update(cid, id, d), onSuccess: () => { setEditing(null); invalidate(); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => api.aditivos.delete(cid, id), onSuccess: invalidate });

  function openEdit(a: Aditivo) {
    setEditing(a);
    setForm({
      numero: a.numero, ano: a.ano, tipo: a.tipo, processo: a.processo, data: a.data,
      item_num: a.item_num,
      qtd_acrescimo: String(a.qtd_acrescimo), qtd_supressao: String(a.qtd_supressao),
      valor_acrescimo_cents: centsToDisplay(a.valor_acrescimo_cents),
      valor_supressao_cents: centsToDisplay(a.valor_supressao_cents),
      nova_vig_fim: a.nova_vig_fim, observacao: a.observacao,
      empenho_num: a.empenho_num, empenho_valor_cents: centsToDisplay(a.empenho_valor_cents),
    });
  }

  function save() {
    const d = {
      ...form,
      qtd_acrescimo: parseFloat(form.qtd_acrescimo?.replace(',', '.')) || 0,
      qtd_supressao: parseFloat(form.qtd_supressao?.replace(',', '.')) || 0,
      valor_acrescimo_cents: parseCents(form.valor_acrescimo_cents),
      valor_supressao_cents: parseCents(form.valor_supressao_cents),
      empenho_valor_cents: parseCents(form.empenho_valor_cents),
    };
    if (editing?.id) updateMut.mutate({ id: editing.id, d });
    else createMut.mutate(d);
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Aditivos / Supressões</h2>
        <button className="btn primary sm" onClick={() => { setEditing({} as Aditivo); setForm({ numero: '', ano: '', tipo: '', processo: '', data: '', item_num: '', qtd_acrescimo: '', qtd_supressao: '', valor_acrescimo_cents: '', valor_supressao_cents: '', nova_vig_fim: '', observacao: '', empenho_num: '', empenho_valor_cents: '' }); }}>
          + Novo Aditivo
        </button>
      </div>

      {aditivos.length === 0 && <p className="empty">Nenhum aditivo cadastrado.</p>}

      {aditivos.length > 0 && (
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Nº/Ano</th><th>Tipo</th><th>Data</th><th className="num">Acréscimo (R$)</th>
                <th className="num">Supressão (R$)</th><th>Nova Vig. Fim</th><th></th>
              </tr>
            </thead>
            <tbody>
              {aditivos.map(a => (
                <tr key={a.id}>
                  <td className="mono">{[a.numero, a.ano].filter(Boolean).join('/') || '—'}</td>
                  <td>{a.tipo || '—'}</td>
                  <td className="mono">{fmtDate(a.data)}</td>
                  <td className="num mono saldo-pos">{a.valor_acrescimo_cents ? fmtBRL(a.valor_acrescimo_cents) : '—'}</td>
                  <td className="num mono saldo-neg">{a.valor_supressao_cents ? fmtBRL(a.valor_supressao_cents) : '—'}</td>
                  <td className="mono">{fmtDate(a.nova_vig_fim)}</td>
                  <td style={{ display: 'flex', gap: 4 }}>
                    <button className="btn icon sm" onClick={() => openEdit(a)} title="Editar">✎</button>
                    <button className="btn icon del" onClick={() => { if (confirm('Excluir aditivo?')) deleteMut.mutate(a.id); }} title="Excluir">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== null && (
        <Modal title={editing.id ? 'Editar Aditivo' : 'Novo Aditivo'} onClose={() => setEditing(null)} wide
          footer={<>
            <button className="btn" onClick={() => setEditing(null)}>Cancelar</button>
            <button className="btn primary" onClick={save} disabled={createMut.isPending || updateMut.isPending}>Salvar</button>
          </>}>
          <div className="grid g4">
            <div><label>Número</label><input value={form.numero} onChange={set('numero')} /></div>
            <div><label>Ano</label><input value={form.ano} onChange={set('ano')} /></div>
            <div><label>Tipo</label>
              <select value={form.tipo} onChange={set('tipo')}>
                <option value="">Selecione…</option>
                <option>Acréscimo</option><option>Supressão</option>
                <option>Prorrogação</option><option>Reequilíbrio</option><option>Rescisão</option>
              </select>
            </div>
            <div><label>Data</label><input type="date" value={form.data} onChange={set('data')} /></div>
          </div>
          <div className="grid g2" style={{ marginTop: 12 }}>
            <div><label>Processo</label><input value={form.processo} onChange={set('processo')} /></div>
            <div><label>Item</label><input value={form.item_num} onChange={set('item_num')} /></div>
          </div>
          <div className="grid g4" style={{ marginTop: 12 }}>
            <div><label>Qtd. Acréscimo</label><input value={form.qtd_acrescimo} onChange={set('qtd_acrescimo')} /></div>
            <div><label>Valor Acréscimo (R$)</label><input value={form.valor_acrescimo_cents} onChange={set('valor_acrescimo_cents')} placeholder="0,00" /></div>
            <div><label>Qtd. Supressão</label><input value={form.qtd_supressao} onChange={set('qtd_supressao')} /></div>
            <div><label>Valor Supressão (R$)</label><input value={form.valor_supressao_cents} onChange={set('valor_supressao_cents')} placeholder="0,00" /></div>
          </div>
          <div className="grid g3" style={{ marginTop: 12 }}>
            <div><label>Nova Vig. Fim</label><input type="date" value={form.nova_vig_fim} onChange={set('nova_vig_fim')} /></div>
            <div><label>Empenho Nº</label><input value={form.empenho_num} onChange={set('empenho_num')} /></div>
            <div><label>Valor Empenho (R$)</label><input value={form.empenho_valor_cents} onChange={set('empenho_valor_cents')} placeholder="0,00" /></div>
          </div>
          <div style={{ marginTop: 12 }}><label>Observação</label><textarea value={form.observacao} onChange={set('observacao')} rows={2} /></div>
        </Modal>
      )}
    </div>
  );
}

/* ───────── Lançamentos tab ───────── */

function LancamentosTab({ contract }: { contract: Contract }) {
  const qc = useQueryClient();
  const cid = contract.id;
  const lancamentos = contract.lancamentos ?? [];
  const [editing, setEditing] = useState<Lancamento | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const invalidate = () => qc.invalidateQueries({ queryKey: ['contract', cid] });

  const createMut = useMutation({ mutationFn: (d: any) => api.lancamentos.create(cid, d), onSuccess: invalidate });
  const updateMut = useMutation({ mutationFn: ({ id, d }: any) => api.lancamentos.update(cid, id, d), onSuccess: () => { setEditing(null); invalidate(); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => api.lancamentos.delete(cid, id), onSuccess: invalidate });

  function openEdit(l: Lancamento) {
    setEditing(l);
    setForm({
      of_num: l.of_num, ano_of: l.ano_of, item_num: l.item_num,
      qtd: String(l.qtd), valor_nf: centsToDisplay(l.valor_nf_cents),
      data_os: l.data_os, nf: l.nf, data_nf: l.data_nf,
      empenho: l.empenho, pago: l.pago,
    });
  }

  function save() {
    const d = {
      of_num: form.of_num, ano_of: form.ano_of, item_num: form.item_num,
      qtd: parseFloat(String(form.qtd).replace(',', '.')) || 0,
      valor_nf_cents: parseCents(form.valor_nf),
      data_os: form.data_os, nf: form.nf, data_nf: form.data_nf,
      empenho: form.empenho, pago: !!form.pago,
    };
    if (editing?.id) updateMut.mutate({ id: editing.id, d });
    else createMut.mutate(d);
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, [k]: e.target.value }));
  const setCheck = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, [k]: e.target.checked }));

  const totalNF = lancamentos.reduce((s, l) => s + l.valor_nf_cents, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Lançamentos (OF / NF)</h2>
        <button className="btn primary sm" onClick={() => { setEditing({} as Lancamento); setForm({ of_num: '', ano_of: '', item_num: '', qtd: '', valor_nf: '', data_os: '', nf: '', data_nf: '', empenho: '', pago: false }); }}>
          + Novo Lançamento
        </button>
      </div>

      {lancamentos.length === 0 && <p className="empty">Nenhum lançamento cadastrado.</p>}

      {lancamentos.length > 0 && (
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>OF</th><th>Item</th><th className="num">Qtd.</th>
                <th className="num">Valor NF</th><th>NF</th><th>Data NF</th>
                <th>Empenho</th><th>Pago</th><th></th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map(l => (
                <tr key={l.id}>
                  <td className="mono">{[l.of_num, l.ano_of].filter(Boolean).join('/') || '—'}</td>
                  <td>{l.item_num || '—'}</td>
                  <td className="num mono">{l.qtd ? fmtQty(l.qtd) : '—'}</td>
                  <td className="num mono">{fmtBRL(l.valor_nf_cents)}</td>
                  <td className="mono">{l.nf || '—'}</td>
                  <td className="mono">{fmtDate(l.data_nf)}</td>
                  <td className="mono">{l.empenho || '—'}</td>
                  <td>{l.pago ? <span className="badge b-ok">Pago</span> : <span className="badge b-muted">Pendente</span>}</td>
                  <td style={{ display: 'flex', gap: 4 }}>
                    <button className="btn icon sm" onClick={() => openEdit(l)} title="Editar">✎</button>
                    <button className="btn icon del" onClick={() => { if (confirm('Excluir lançamento?')) deleteMut.mutate(l.id); }} title="Excluir">✕</button>
                  </td>
                </tr>
              ))}
              <tr style={{ fontWeight: 600, borderTop: '2px solid var(--line)' }}>
                <td colSpan={3} style={{ paddingTop: 10 }}>Total Faturado</td>
                <td className="num mono" style={{ paddingTop: 10 }}>{fmtBRL(totalNF)}</td>
                <td colSpan={5}></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {editing !== null && (
        <Modal title={editing.id ? 'Editar Lançamento' : 'Novo Lançamento'} onClose={() => setEditing(null)} wide
          footer={<>
            <button className="btn" onClick={() => setEditing(null)}>Cancelar</button>
            <button className="btn primary" onClick={save} disabled={createMut.isPending || updateMut.isPending}>Salvar</button>
          </>}>
          <div className="grid g4">
            <div><label>Ordem de Fornecimento</label><input value={form.of_num} onChange={set('of_num')} /></div>
            <div><label>Ano OF</label><input value={form.ano_of} onChange={set('ano_of')} /></div>
            <div><label>Item</label><input value={form.item_num} onChange={set('item_num')} /></div>
            <div><label>Qtd.</label><input value={form.qtd} onChange={set('qtd')} /></div>
          </div>
          <div className="grid g3" style={{ marginTop: 12 }}>
            <div><label>Valor NF (R$)</label><input value={form.valor_nf} onChange={set('valor_nf')} placeholder="0,00" /></div>
            <div><label>NF Número</label><input value={form.nf} onChange={set('nf')} /></div>
            <div><label>Data NF</label><input type="date" value={form.data_nf} onChange={set('data_nf')} /></div>
          </div>
          <div className="grid g3" style={{ marginTop: 12 }}>
            <div><label>Data OS</label><input type="date" value={form.data_os} onChange={set('data_os')} /></div>
            <div><label>Empenho</label><input value={form.empenho} onChange={set('empenho')} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
              <input type="checkbox" id="pago" checked={!!form.pago} onChange={setCheck('pago')} style={{ width: 'auto' }} />
              <label htmlFor="pago" style={{ marginBottom: 0, cursor: 'pointer' }}>Pagamento realizado</label>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ───────── Resumo tab ───────── */

function ResumoTab({ contract, onEdit, onDelete }: { contract: Contract; onEdit: () => void; onDelete: () => void }) {
  const empenhos = contract.empenhos ?? [];
  const lancamentos = contract.lancamentos ?? [];
  const aditivos = contract.aditivos ?? [];
  const items = contract.items ?? [];

  const totalContratadoCents = items.reduce((s, i) => s + Math.round(i.qtd_contratada * i.unit_price_cents), 0);
  const acrescimosCents = aditivos.reduce((s, a) => s + a.valor_acrescimo_cents, 0);
  const supressoesCents = aditivos.reduce((s, a) => s + a.valor_supressao_cents, 0);
  const totalAtualCents = totalContratadoCents + acrescimosCents - supressoesCents;
  const totalEmpenhoCents = empenhos.reduce((s, e) => s + e.valor_cents, 0);
  const totalNFCents = lancamentos.reduce((s, l) => s + l.valor_nf_cents, 0);
  const saldoContratoCents = totalAtualCents - totalNFCents;
  const saldoEmpenhoCents = totalEmpenhoCents - totalNFCents;
  const execPct = totalAtualCents > 0 ? totalNFCents / totalAtualCents : 0;

  const vigFimAtual = aditivos.filter(a => a.nova_vig_fim).slice(-1)[0]?.nova_vig_fim || contract.vig_fim;
  const dias = daysUntil(vigFimAtual);

  function alertColor(dias: number | null) {
    if (dias === null) return undefined;
    if (dias < 0) return 'var(--red)';
    if (dias <= 30) return 'var(--amber)';
    return 'var(--green-d)';
  }

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        {[
          { k: 'Valor Atualizado', v: fmtBRL(totalAtualCents), cls: '' },
          { k: 'Total Empenhos', v: fmtBRL(totalEmpenhoCents), cls: '' },
          { k: 'Total Faturado (NF)', v: fmtBRL(totalNFCents), cls: '' },
          { k: 'Saldo Contrato', v: fmtBRL(saldoContratoCents), cls: saldoContratoCents < 0 ? 'saldo-neg' : 'saldo-pos' },
          { k: 'Saldo Empenho', v: fmtBRL(saldoEmpenhoCents), cls: saldoEmpenhoCents < 0 ? 'saldo-neg' : 'saldo-pos' },
          { k: 'Execução', v: `${(execPct * 100).toFixed(1)}%`, cls: '' },
        ].map(({ k, v, cls }) => (
          <div key={k} style={{ flex: 1, minWidth: 150, background: '#fbfaf6', border: '1px solid var(--line2)', borderRadius: 10, padding: '11px 13px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)' }}>{k}</div>
            <div className={`mono ${cls}`} style={{ fontSize: 17, marginTop: 3 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Vigência status */}
      {vigFimAtual && (
        <div className="alert info" style={{ marginBottom: 18 }}>
          <strong>Vigência até {fmtDate(vigFimAtual)}</strong>
          {dias !== null && (
            <span style={{ marginLeft: 12, color: alertColor(dias), fontWeight: 600 }}>
              {dias < 0 ? `Vencida há ${Math.abs(dias)} dias` : dias === 0 ? 'Vence hoje' : `${dias} dias restantes`}
            </span>
          )}
        </div>
      )}

      {/* Dados do contrato */}
      <div className="grid g3" style={{ gap: 16 }}>
        <Field label="Número do Contrato" value={contract.numero} mono />
        <Field label="Processo SEI" value={contract.processo} mono />
        <Field label="Modalidade" value={contract.modalidade} />
        <Field label="Fornecedor" value={contract.fornecedor} />
        <Field label="CNPJ / CPF" value={contract.cnpj} mono />
        <Field label="Vigência Início" value={fmtDate(contract.vig_inicio)} mono />
        <Field label="Vigência Fim Original" value={fmtDate(contract.vig_fim)} mono />
        <Field label="Data Assinatura" value={fmtDate(contract.data_assinatura)} mono />
        <Field label="Data Publicação DOE" value={fmtDate(contract.data_publicacao_doe)} mono />
        <Field label="Gestor" value={contract.gestor} />
        <Field label="Área Responsável" value={contract.area_responsavel} />
        <Field label="Processo Pagamento" value={contract.processo_pagamento} mono />
        <Field label="Classificação" value={contract.classificacao} />
        <Field label="SISLOG" value={contract.sislog} mono />
      </div>
      {contract.objeto && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Objeto</div>
          <div style={{ lineHeight: 1.6 }}>{contract.objeto}</div>
        </div>
      )}
      {contract.observacoes && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Observações</div>
          <div style={{ lineHeight: 1.6, color: 'var(--muted)' }}>{contract.observacoes}</div>
        </div>
      )}
      {contract.link_contrato && (
        <div style={{ marginTop: 16 }}>
          <a href={contract.link_contrato} target="_blank" rel="noopener noreferrer" className="btn sm">
            📄 Abrir contrato no SEI/DOE ↗
          </a>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--line2)' }}>
        <button className="btn" onClick={onEdit}>Editar dados</button>
        <button className="btn danger" onClick={onDelete}>Excluir contrato</button>
      </div>
    </div>
  );
}

/* ───────── Edit modal ───────── */

function EditModal({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<Contract>>({ ...contract });

  const set = (k: keyof Contract) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (d: Partial<Contract>) => api.contracts.update(contract.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contract', contract.id] }); onClose(); },
  });

  function save() { mutation.mutate(form); }

  return (
    <Modal title="Editar Contrato" onClose={onClose} wide
      footer={<>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={save} disabled={mutation.isPending}>Salvar</button>
      </>}>
      <div className="grid g3">
        <div><label>Número</label><input value={form.numero} onChange={set('numero')} /></div>
        <div><label>Processo SEI</label><input value={form.processo} onChange={set('processo')} /></div>
        <div><label>Modalidade</label>
          <select value={form.modalidade} onChange={set('modalidade')}>
            <option value="">Selecione…</option>
            <option>Pregão Eletrônico</option><option>Dispensa de Licitação</option>
            <option>Inexigibilidade</option><option>Concorrência</option>
            <option>Tomada de Preços</option><option>Convite</option><option>Credenciamento</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 12 }}><label>Objeto</label><textarea value={form.objeto} onChange={set('objeto')} rows={3} /></div>
      <div className="grid g2" style={{ marginTop: 12 }}>
        <div><label>Fornecedor</label><input value={form.fornecedor} onChange={set('fornecedor')} /></div>
        <div><label>CNPJ / CPF</label><input value={form.cnpj} onChange={set('cnpj')} /></div>
      </div>
      <div className="grid g4" style={{ marginTop: 12 }}>
        <div><label>Vig. Início</label><input type="date" value={form.vig_inicio} onChange={set('vig_inicio')} /></div>
        <div><label>Vig. Fim</label><input type="date" value={form.vig_fim} onChange={set('vig_fim')} /></div>
        <div><label>Data Assinatura</label><input type="date" value={form.data_assinatura} onChange={set('data_assinatura')} /></div>
        <div><label>Data Pub. DOE</label><input type="date" value={form.data_publicacao_doe} onChange={set('data_publicacao_doe')} /></div>
      </div>
      <div className="grid g3" style={{ marginTop: 12 }}>
        <div><label>Gestor</label><input value={form.gestor} onChange={set('gestor')} /></div>
        <div><label>Área Responsável</label><input value={form.area_responsavel} onChange={set('area_responsavel')} /></div>
        <div><label>Processo Pagamento</label><input value={form.processo_pagamento} onChange={set('processo_pagamento')} /></div>
      </div>
      <div className="grid g2" style={{ marginTop: 12 }}>
        <div><label>Classificação</label><input value={form.classificacao} onChange={set('classificacao')} /></div>
        <div><label>SISLOG</label><input value={form.sislog} onChange={set('sislog')} /></div>
      </div>
      <div style={{ marginTop: 12 }}><label>Link do Contrato</label><input type="url" value={form.link_contrato} onChange={set('link_contrato')} /></div>
      <div style={{ marginTop: 12 }}><label>Observações</label><textarea value={form.observacoes} onChange={set('observacoes')} rows={3} /></div>
    </Modal>
  );
}

/* ───────── Main page ───────── */

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('resumo');
  const [editOpen, setEditOpen] = useState(false);

  const { data: contract, isLoading, error } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => api.contracts.get(id!),
    enabled: !!id,
  });

  const deleteMut = useMutation({
    mutationFn: () => api.contracts.delete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/contracts');
    },
  });

  if (isLoading) return <p className="empty">Carregando…</p>;
  if (error) return <div className="alert err">{(error as Error).message}</div>;
  if (!contract) return null;

  const vigFimAtual = (contract.aditivos ?? []).filter(a => a.nova_vig_fim).slice(-1)[0]?.nova_vig_fim || contract.vig_fim;

  function handleDelete() {
    if (confirm(`Excluir o contrato ${contract!.numero || contract!.id}? Esta ação não pode ser desfeita.`)) {
      deleteMut.mutate();
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button className="btn sm" onClick={() => navigate('/contracts')}>← Contratos</button>
      </div>

      <header style={{ borderBottom: '2px solid var(--ink)', paddingBottom: 16, marginBottom: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p className="eyebrow">{contract.fornecedor || 'Contrato'}</p>
          <h1>{contract.numero || contract.id}</h1>
          {contract.objeto && (
            <p style={{ color: 'var(--muted)', marginTop: 6, maxWidth: 680, lineHeight: 1.4 }}>{contract.objeto}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <VigBadge vigFim={vigFimAtual} />
          {contract.gestor && (
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Gestor: <strong>{contract.gestor}</strong></span>
          )}
        </div>
      </header>

      <div className="tabs">
        {(['resumo', 'itens', 'empenhos', 'aditivos', 'lancamentos'] as Tab[]).map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {{ resumo: 'Resumo', itens: 'Itens', empenhos: 'Empenhos', aditivos: 'Aditivos', lancamentos: 'Lançamentos' }[t]}
            {t === 'itens' && contract.items?.length ? ` (${contract.items.length})` : ''}
            {t === 'empenhos' && contract.empenhos?.length ? ` (${contract.empenhos.length})` : ''}
            {t === 'aditivos' && contract.aditivos?.length ? ` (${contract.aditivos.length})` : ''}
            {t === 'lancamentos' && contract.lancamentos?.length ? ` (${contract.lancamentos.length})` : ''}
          </button>
        ))}
      </div>

      <div className="section" style={{ borderTopLeftRadius: 0, borderTopRightRadius: tab === 'resumo' ? 'var(--radius)' : 'var(--radius)' }}>
        {tab === 'resumo' && <ResumoTab contract={contract} onEdit={() => setEditOpen(true)} onDelete={handleDelete} />}
        {tab === 'itens' && <ItemsTab contract={contract} />}
        {tab === 'empenhos' && <EmpenhosTab contract={contract} />}
        {tab === 'aditivos' && <AditivosTab contract={contract} />}
        {tab === 'lancamentos' && <LancamentosTab contract={contract} />}
      </div>

      {editOpen && <EditModal contract={contract} onClose={() => setEditOpen(false)} />}
    </div>
  );
}
