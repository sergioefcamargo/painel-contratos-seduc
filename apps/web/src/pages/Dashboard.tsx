import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { fmtBRL } from '../lib/fmt';

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.dashboard,
  });

  if (isLoading) return <p className="empty">Carregando…</p>;
  if (error) return <div className="alert err">{(error as Error).message}</div>;
  if (!data) return null;

  const saldoCents = data.totalEmpenhadoCents - data.totalNFCents;

  return (
    <div>
      <header className="top" style={{ borderBottom: '2px solid var(--ink)', paddingBottom: 16, marginBottom: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p className="eyebrow">SEDUC-AM</p>
          <h1>Painel de Contratos</h1>
        </div>
        <Link to="/contracts/new" className="btn primary">+ Novo Contrato</Link>
      </header>

      <div className="section">
        <h2>Resumo Executivo</h2>
        <div className="bignums">
          <div className="bignum accent">
            <div className="k">Total de Contratos</div>
            <div className="v">{data.total}</div>
          </div>
          <div className="bignum">
            <div className="k">Vigentes</div>
            <div className="v pos">{data.vigentes}</div>
            <div className="sub">{data.total ? Math.round(data.vigentes / data.total * 100) : 0}% do total</div>
          </div>
          <div className="bignum">
            <div className="k">Vencendo em 30 dias</div>
            <div className="v" style={{ color: data.vencendo > 0 ? 'var(--amber)' : undefined }}>{data.vencendo}</div>
          </div>
          <div className="bignum">
            <div className="k">Vencidos</div>
            <div className="v neg">{data.vencidas}</div>
          </div>
          <div className="bignum">
            <div className="k">Total Empenhado</div>
            <div className="v" style={{ fontSize: 20 }}>{fmtBRL(data.totalEmpenhadoCents)}</div>
          </div>
          <div className="bignum">
            <div className="k">Total Faturado (NF)</div>
            <div className="v" style={{ fontSize: 20 }}>{fmtBRL(data.totalNFCents)}</div>
          </div>
          <div className="bignum">
            <div className="k">Saldo Empenhos</div>
            <div className={`v ${saldoCents < 0 ? 'neg' : 'pos'}`} style={{ fontSize: 20 }}>
              {fmtBRL(saldoCents)}
            </div>
          </div>
        </div>
      </div>

      {data.byGestor.length > 0 && (
        <div className="section">
          <h2>Por Gestor / Responsável</h2>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Gestor</th>
                  <th className="num">Total</th>
                  <th className="num">Vigentes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.byGestor.map(g => (
                  <tr key={g.gestor}>
                    <td>{g.gestor}</td>
                    <td className="num mono">{g.total}</td>
                    <td className="num mono" style={{ color: 'var(--green-d)' }}>{g.vigentes}</td>
                    <td>
                      <Link to={`/contracts?gestor=${encodeURIComponent(g.gestor)}`} className="btn sm">
                        Ver contratos →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/contracts?vigencia=vencendo" className="btn" style={{ borderColor: 'var(--amber)' }}>
          ⚠️ Ver contratos vencendo ({data.vencendo})
        </Link>
        <Link to="/contracts?vigencia=vencida" className="btn danger">
          Ver contratos vencidos ({data.vencidas})
        </Link>
      </div>
    </div>
  );
}
