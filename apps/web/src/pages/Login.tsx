import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@seduc.am.gov.br');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.login(email, password);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(1200px 520px at 85% -160px, #eef3ee, transparent 60%), var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p className="eyebrow" style={{ justifyContent: 'center', display: 'flex' }}>SEDUC-AM</p>
          <h1 style={{ fontSize: 26 }}>Painel de Contratos</h1>
          <p style={{ color: 'var(--muted)', marginTop: 8 }}>Sistema de Gestão de Contratos</p>
        </div>

        <div className="section">
          {error && <div className="alert err" style={{ marginBottom: 16 }}>{error}</div>}
          <form onSubmit={submit}>
            <div style={{ marginBottom: 14 }}>
              <label>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <button type="submit" className="btn primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
