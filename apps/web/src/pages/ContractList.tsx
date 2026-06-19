import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { fmtDate, vigStatus, fmtBRL } from '../lib/fmt';
import type { Contract } from '../types';

function VigBadge({ vigFim }: { vigFim: string }) {
  const s = vigStatus(vigFim);
  const map = { vigente: 'b-ok', vencendo: 'b-warn', vencida: 'b-err' };
  const label = { vigente: 'Vigente', vencendo: 'Vencendo', vencida: 'Vencida' };
  return <span className={`badge ${map[s]}`}>{label[s]}</span>;
}

export default function ContractList() {
  const [search] = useSearchParams();
  const [q, setQ] = useState(search.get('q') ?? '');
  const [situacao, setSituacao] = useState(search.get('situacao') ?? '');
  const [gestor, setGestor] = useState(search.get('gestor') ?? '');
  const [vigencia, setVigencia] = useState(search.get('vigencia') ?? '');

  const params: Record<string, string> = {};
  if (q) params.q = q;
  if (situacao) params.situacao = situacao;
  if (gestor) params.gestor = gestor;
  if (vigencia) params.vigencia = vigencia;

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts', params],
    queryFn: () => api.contracts.list(params),
  });

  const totalEmpenhadoCents = contracts.reduce((s: number, c: Contract) => {
    return s;
  }, 0);

  return (
    <div>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p className="eyebrow">Gestão</p>
          <h1>Contratos</h1>
        </div>
        <Link to="/contracts/new" className="btn primary">+ Novo Contrato</Link>
      </header>

      <div className="section" style={{ paddingBottom: 14 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label>Buscar</label>
            <input placeholder="Fornecedor, número, objeto, CNPJ…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div style={{ minWidth: 160 }}>
            <label>Vigência</label>
            <select value={vigencia} onChange={e => setVigencia(e.target.value)}>
              <option value="">Todas</option>
              <option value="vigente">Vigentes</option>
              <option value="vencendo">Vencendo (30d)</option>
              <option value="vencida">Vencidas</option>
            </select>
          </div>
          <div style={{ minWidth: 200 }}>
            <label>Gestor</label>
            <input placeholder="Nome do gestor…" value={gestor} onChange={e => setGestor(e.target.value)} />
          </div>
          {(q || situacao || gestor || vigencia) && (
            <button className="btn sm" onClick={() => { setQ(''); setSituacao(''); setGestor(''); setVigencia(''); }}>
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {isLoading && <p className="empty">Carregando…</p>}

      {!isLoading && contracts.length === 0 && (
        <p className="empty">Nenhum contrato encontrado.</p>
      )}

      {!isLoading && contracts.length > 0 && (
        <div className="section" style={{ padding: 0 }}>
          <div className="scroll">
            <table>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <th style={{ padding: '12px 14px' }}>Contrato / Processo</th>
                  <th style={{ padding: '12px 8px' }}>Fornecedor</th>
                  <th style={{ padding: '12px 8px' }}>Objeto</th>
                  <th style={{ padding: '12px 8px' }}>Gestor</th>
                  <th style={{ padding: '12px 8px' }}>Vig. Fim</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c: Contract) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/contracts/${c.id}`}>
                    <td style={{ padding: '10px 14px' }}>
                      <div className="mono" style={{ fontWeight: 600 }}>{c.numero || '—'}</div>
                      {c.processo && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.processo}</div>}
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.fornecedor || '—'}</div>
                      {c.cnpj && <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{c.cnpj}</div>}
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--muted)' }}>{c.objeto || '—'}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{c.gestor || '—'}</td>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{fmtDate(c.vig_fim)}</td>
                    <td><VigBadge vigFim={c.vig_fim} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line2)', color: 'var(--muted)', fontSize: 13 }}>
            {contracts.length} contrato{contracts.length !== 1 ? 's' : ''} encontrado{contracts.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
