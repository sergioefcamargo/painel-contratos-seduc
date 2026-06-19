import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Contract } from '../types';

const EMPTY: Partial<Contract> = {
  numero: '', processo: '', objeto: '', fornecedor: '', cnpj: '',
  vig_inicio: '', vig_fim: '', modalidade: '', classificacao: '',
  situacao: '', gestor: '', area_responsavel: '',
  processo_pagamento: '', sislog: '', data_assinatura: '',
  data_publicacao_doe: '', link_contrato: '', observacoes: '',
  auto_alocacao: 1,
};

export default function ContractNew() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<Contract>>(EMPTY);
  const [error, setError] = useState('');

  const set = (k: keyof Contract) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (data: Partial<Contract>) => api.contracts.create(data),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(`/contracts/${c.id}`);
    },
    onError: (e: Error) => setError(e.message),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate(form);
  }

  return (
    <div>
      <header style={{ marginBottom: 24 }}>
        <button className="btn sm" style={{ marginBottom: 10 }} onClick={() => navigate('/contracts')}>← Voltar</button>
        <p className="eyebrow">Gestão</p>
        <h1>Novo Contrato</h1>
      </header>

      {error && <div className="alert err" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={submit}>
        <div className="section">
          <h2>Identificação</h2>
          <div className="grid g3">
            <div><label>Número do Contrato</label><input value={form.numero} onChange={set('numero')} /></div>
            <div><label>Processo SEI</label><input value={form.processo} onChange={set('processo')} /></div>
            <div><label>Modalidade</label>
              <select value={form.modalidade} onChange={set('modalidade')}>
                <option value="">Selecione…</option>
                <option>Pregão Eletrônico</option>
                <option>Dispensa de Licitação</option>
                <option>Inexigibilidade</option>
                <option>Concorrência</option>
                <option>Tomada de Preços</option>
                <option>Convite</option>
                <option>Credenciamento</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 13 }}>
            <label>Objeto</label>
            <textarea value={form.objeto} onChange={set('objeto')} rows={3} />
          </div>
        </div>

        <div className="section">
          <h2>Fornecedor</h2>
          <div className="grid g2">
            <div><label>Razão Social / Nome</label><input value={form.fornecedor} onChange={set('fornecedor')} /></div>
            <div><label>CNPJ / CPF</label><input value={form.cnpj} onChange={set('cnpj')} /></div>
          </div>
        </div>

        <div className="section">
          <h2>Vigência</h2>
          <div className="grid g4">
            <div><label>Início</label><input type="date" value={form.vig_inicio} onChange={set('vig_inicio')} /></div>
            <div><label>Fim</label><input type="date" value={form.vig_fim} onChange={set('vig_fim')} /></div>
            <div><label>Data Assinatura</label><input type="date" value={form.data_assinatura} onChange={set('data_assinatura')} /></div>
            <div><label>Data Publicação DOE</label><input type="date" value={form.data_publicacao_doe} onChange={set('data_publicacao_doe')} /></div>
          </div>
        </div>

        <div className="section">
          <h2>Gestão</h2>
          <div className="grid g3">
            <div><label>Gestor</label><input value={form.gestor} onChange={set('gestor')} /></div>
            <div><label>Área Responsável</label><input value={form.area_responsavel} onChange={set('area_responsavel')} /></div>
            <div><label>Processo de Pagamento</label><input value={form.processo_pagamento} onChange={set('processo_pagamento')} /></div>
          </div>
          <div className="grid g2" style={{ marginTop: 13 }}>
            <div><label>Classificação</label><input value={form.classificacao} onChange={set('classificacao')} /></div>
            <div><label>SISLOG</label><input value={form.sislog} onChange={set('sislog')} /></div>
          </div>
          <div style={{ marginTop: 13 }}>
            <label>Link do Contrato (SEI/DOE)</label>
            <input type="url" value={form.link_contrato} onChange={set('link_contrato')} />
          </div>
          <div style={{ marginTop: 13 }}>
            <label>Observações</label>
            <textarea value={form.observacoes} onChange={set('observacoes')} rows={3} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={() => navigate('/contracts')}>Cancelar</button>
          <button type="submit" className="btn primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando…' : 'Criar Contrato'}
          </button>
        </div>
      </form>
    </div>
  );
}
