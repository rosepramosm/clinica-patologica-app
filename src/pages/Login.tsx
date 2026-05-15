import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, ShieldAlert } from 'lucide-react';

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      onLogin(); // Notifica a App.tsx que el login fue exitoso
    } catch (err: any) {
      setError('Credenciales incorrectas. Verifique el ID/Correo y la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#eff6ff', display: 'inline-block', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <Lock size={48} color="var(--primary)" />
          </div>
          <h1 style={{ margin: 0, color: 'var(--primary)', fontSize: '2rem' }}>Acceso al Sistema</h1>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>Clínica Anatomo-Patológica</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
            <ShieldAlert size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">ID de Usuario (Correo Electrónico)</label>
            <input
              type="email"
              className="form-input"
              placeholder="Ej: admin@clinica.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-input"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1.3rem', padding: '1.2rem' }} disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
