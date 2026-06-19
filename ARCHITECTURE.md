# Painel de Contratos SEDUC — Arquitetura

## Visão Geral

Monorepo com backend Node.js + frontend React, projetado como MVP escalável.

```
painel-contratos-seduc/
├── apps/
│   ├── api/          # Express 4 + SQLite (better-sqlite3) + JWT
│   └── web/          # React 18 + Vite + TanStack Query + React Router
├── index.html        # App legado (localStorage) — mantido para referência
└── package.json      # npm workspaces
```

---

## Backend — `apps/api`

### Stack
| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| Banco de dados | SQLite (better-sqlite3) — migra para PostgreSQL mudando `db.ts` |
| Autenticação | JWT (jsonwebtoken) + bcryptjs |
| TypeScript | tsx (dev) / esbuild (prod) |

### Schema do Banco de Dados

```sql
users               — autenticação e controle de acesso
contracts           — dados do contrato (identificação, vigência, gestão)
contract_items      — itens/produtos do contrato
empenhos            — empenhos vinculados (contrato ou aditivo)
aditivos            — aditivos, supressões e prorrogações
lancamentos         — ordens de fornecimento / notas fiscais
lancamento_alocacoes — alocação manual de NF por empenho
```

### Endpoints da API

```
POST   /api/auth/login                           — autenticar
GET    /api/auth/me                              — usuário atual

GET    /api/contracts?q=&gestor=&vigencia=       — listar contratos
POST   /api/contracts                            — criar contrato
GET    /api/contracts/dashboard                  — estatísticas do painel
GET    /api/contracts/:id                        — detalhe (com itens, empenhos, etc.)
PUT    /api/contracts/:id                        — atualizar
DELETE /api/contracts/:id                        — excluir

POST   /api/contracts/:id/items                  — adicionar item
PUT    /api/contracts/:id/items/:itemId          — editar item
DELETE /api/contracts/:id/items/:itemId          — excluir item

POST   /api/contracts/:id/empenhos
PUT    /api/contracts/:id/empenhos/:empenhoId
DELETE /api/contracts/:id/empenhos/:empenhoId

POST   /api/contracts/:id/aditivos
PUT    /api/contracts/:id/aditivos/:aditivoId
DELETE /api/contracts/:id/aditivos/:aditivoId

POST   /api/contracts/:id/lancamentos
PUT    /api/contracts/:id/lancamentos/:lancId
DELETE /api/contracts/:id/lancamentos/:lancId

GET    /api/health
```

---

## Frontend — `apps/web`

### Stack
| Camada | Tecnologia |
|--------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Roteamento | React Router v6 |
| Data fetching | TanStack Query v5 |
| Estilos | CSS puro (design system do app original — IBM Plex, Fraunces) |

### Arquitetura da Interface

```
src/
├── pages/
│   ├── Login.tsx            — autenticação
│   ├── Dashboard.tsx        — painel com métricas (KPIs, por gestor)
│   ├── ContractList.tsx     — lista com filtros (busca, vigência, gestor)
│   ├── ContractNew.tsx      — formulário de criação
│   └── ContractDetail.tsx   — detalhe com 5 abas:
│       ├── Resumo           — KPIs, dados do contrato, ações
│       ├── Itens            — tabela de itens com CRUD inline
│       ├── Empenhos         — empenhos com saldo calculado
│       ├── Aditivos         — acréscimos/supressões/prorrogações
│       └── Lançamentos      — OF/NF com controle de pagamento
├── components/
│   ├── Layout.tsx           — navbar + outlet
│   └── Modal.tsx            — modal reutilizável
├── lib/
│   └── fmt.ts               — formatadores BRL, datas, vigência
├── api.ts                   — cliente fetch com auth header
└── types.ts                 — tipos TypeScript do domínio
```

---

## Como Rodar

### Pré-requisitos
- Node.js 20+
- npm 9+

### Instalação
```bash
npm install
```

### Banco de dados + usuário admin
```bash
npm run db:seed -w apps/api
# Cria: admin@seduc.am.gov.br / seduc2026
```

### Desenvolvimento
```bash
npm run dev
# API:  http://localhost:3001
# Web:  http://localhost:5173
```

### Produção
```bash
npm run build
npm start         # inicia a API (serve o frontend como static files via express.static)
```

---

## Escalabilidade

| Decisão MVP | Caminho para produção |
|------------|----------------------|
| SQLite local | Trocar `db.ts` para pg (node-postgres) — schema é o mesmo |
| JWT no localStorage | Mover para httpOnly cookies |
| Usuário único | Adicionar tabela de papéis (admin/gestor/leitor) |
| Sem logs | Adicionar pino/winston + request ID |
| Deploy manual | Dockerfile + variáveis de ambiente (`JWT_SECRET`, `DB_PATH`, `PORT`) |

---

## Modelo de Domínio

```
Contract
├── items[]          (itens do objeto licitado)
├── empenhos[]       (dotações orçamentárias)
├── aditivos[]       (modificações contratuais)
│   └── empenho próprio (quando o aditivo gera empenho)
└── lancamentos[]    (execução: OF → NF)
    └── alocacoes[]  (rateio da NF por empenho)

Cálculos derivados (não armazenados):
  valor_atualizado = Σ(items.unit_price × qtd) + Σ(aditivos.acrescimo) − Σ(aditivos.supressao)
  saldo_contrato   = valor_atualizado − Σ(lancamentos.valor_nf)
  saldo_empenho    = Σ(empenhos.valor) − Σ(lancamentos.valor_nf)
  execucao_%       = Σ(lancamentos.valor_nf) / valor_atualizado
```
