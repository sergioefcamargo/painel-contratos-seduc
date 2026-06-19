export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface ContractItem {
  id: number;
  contract_id: string;
  item_num: string;
  descricao: string;
  qtd_contratada: number;
  unidade: string;
  unit_price_cents: number;
  sort_order: number;
}

export interface Empenho {
  id: number;
  contract_id: string;
  numero: string;
  valor_cents: number;
  origem: string;
  aditivo_id: number | null;
}

export interface Aditivo {
  id: number;
  contract_id: string;
  numero: string;
  ano: string;
  tipo: string;
  processo: string;
  data: string;
  item_num: string;
  qtd_acrescimo: number;
  qtd_supressao: number;
  valor_acrescimo_cents: number;
  valor_supressao_cents: number;
  nova_vig_fim: string;
  observacao: string;
  empenho_num: string;
  empenho_valor_cents: number;
}

export interface AlocacaoManual {
  empenho: string;
  qtd: number;
}

export interface Lancamento {
  id: number;
  contract_id: string;
  of_num: string;
  ano_of: string;
  item_num: string;
  qtd: number;
  valor_nf_cents: number;
  data_os: string;
  nf: string;
  data_nf: string;
  empenho: string;
  pago: boolean;
  alocacoes: AlocacaoManual[];
}

export interface Contract {
  id: string;
  numero: string;
  processo: string;
  objeto: string;
  fornecedor: string;
  cnpj: string;
  vig_inicio: string;
  vig_fim: string;
  modalidade: string;
  classificacao: string;
  situacao: string;
  status_contrato: string;
  alerta: string;
  gestor: string;
  area_responsavel: string;
  processo_pagamento: string;
  sislog: string;
  data_assinatura: string;
  data_publicacao_doe: string;
  link_contrato: string;
  termo_encerramento: string;
  prazo: string;
  dias_vencimento: string;
  observacoes: string;
  doc_ref: string;
  auto_alocacao: number;
  created_at: string;
  updated_at: string;
  items?: ContractItem[];
  empenhos?: Empenho[];
  aditivos?: Aditivo[];
  lancamentos?: Lancamento[];
}

export interface DashboardStats {
  total: number;
  vigentes: number;
  vencidas: number;
  vencendo: number;
  totalEmpenhadoCents: number;
  totalNFCents: number;
  byGestor: { gestor: string; total: number; vigentes: number }[];
}
