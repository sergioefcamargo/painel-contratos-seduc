import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '../data/db.sqlite');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      numero TEXT DEFAULT '',
      processo TEXT DEFAULT '',
      objeto TEXT DEFAULT '',
      fornecedor TEXT DEFAULT '',
      cnpj TEXT DEFAULT '',
      vig_inicio TEXT DEFAULT '',
      vig_fim TEXT DEFAULT '',
      modalidade TEXT DEFAULT '',
      classificacao TEXT DEFAULT '',
      situacao TEXT DEFAULT '',
      status_contrato TEXT DEFAULT '',
      alerta TEXT DEFAULT '',
      gestor TEXT DEFAULT '',
      area_responsavel TEXT DEFAULT '',
      processo_pagamento TEXT DEFAULT '',
      sislog TEXT DEFAULT '',
      data_assinatura TEXT DEFAULT '',
      data_publicacao_doe TEXT DEFAULT '',
      link_contrato TEXT DEFAULT '',
      termo_encerramento TEXT DEFAULT '',
      prazo TEXT DEFAULT '',
      dias_vencimento TEXT DEFAULT '',
      observacoes TEXT DEFAULT '',
      doc_ref TEXT DEFAULT '',
      auto_alocacao INTEGER DEFAULT 1,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contract_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
      item_num TEXT DEFAULT '',
      descricao TEXT DEFAULT '',
      qtd_contratada REAL DEFAULT 0,
      unidade TEXT DEFAULT '',
      unit_price_cents INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS empenhos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
      numero TEXT DEFAULT '',
      valor_cents INTEGER DEFAULT 0,
      origem TEXT DEFAULT 'contrato',
      aditivo_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS aditivos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
      numero TEXT DEFAULT '',
      ano TEXT DEFAULT '',
      tipo TEXT DEFAULT '',
      processo TEXT DEFAULT '',
      data TEXT DEFAULT '',
      item_num TEXT DEFAULT '',
      qtd_acrescimo REAL DEFAULT 0,
      qtd_supressao REAL DEFAULT 0,
      valor_acrescimo_cents INTEGER DEFAULT 0,
      valor_supressao_cents INTEGER DEFAULT 0,
      nova_vig_fim TEXT DEFAULT '',
      observacao TEXT DEFAULT '',
      empenho_num TEXT DEFAULT '',
      empenho_valor_cents INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lancamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
      of_num TEXT DEFAULT '',
      ano_of TEXT DEFAULT '',
      item_num TEXT DEFAULT '',
      qtd REAL DEFAULT 0,
      valor_nf_cents INTEGER DEFAULT 0,
      data_os TEXT DEFAULT '',
      nf TEXT DEFAULT '',
      data_nf TEXT DEFAULT '',
      empenho TEXT DEFAULT '',
      pago INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lancamento_alocacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lancamento_id INTEGER NOT NULL REFERENCES lancamentos(id) ON DELETE CASCADE,
      empenho TEXT DEFAULT '',
      qtd REAL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_items_contract ON contract_items(contract_id);
    CREATE INDEX IF NOT EXISTS idx_empenhos_contract ON empenhos(contract_id);
    CREATE INDEX IF NOT EXISTS idx_aditivos_contract ON aditivos(contract_id);
    CREATE INDEX IF NOT EXISTS idx_lancamentos_contract ON lancamentos(contract_id);
  `);
}
