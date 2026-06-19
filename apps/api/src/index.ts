import express from 'express';
import cors from 'cors';
import { migrate } from './db.js';
import authRouter from './routes/auth.js';
import contractsRouter from './routes/contracts.js';
import itemsRouter from './routes/items.js';
import empenhosRouter from './routes/empenhos.js';
import aditivosRouter from './routes/aditivos.js';
import lancamentosRouter from './routes/lancamentos.js';

migrate();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/contracts/:id/items', itemsRouter);
app.use('/api/contracts/:id/empenhos', empenhosRouter);
app.use('/api/contracts/:id/aditivos', aditivosRouter);
app.use('/api/contracts/:id/lancamentos', lancamentosRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
