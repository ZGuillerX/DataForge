import { useEffect, useState, type FormEvent } from 'react';
import { usersApi } from '../api/users.api';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

export default function Profile() {
  const { updateUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await usersApi.getMe();
        setName(profile.name ?? '');
        setEmail(profile.email);
        setCreatedAt(profile.createdAt);
      } catch {
        setMessage('❌ No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const updated = await usersApi.updateProfile(name);
      updateUser({ id: updated.id, email: updated.email, name: updated.name });
      setMessage('✅ Perfil actualizado');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo actualizar el perfil';
      setMessage(`❌ ${msg}`);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <div>Cargando…</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Perfil</h2>
          <p className="page-subtitle">Tu informacion de cuenta</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div className="form-group">
            <label className="form-label">Correo electronico</label>
            <input className="form-input" type="email" value={email} disabled />
          </div>

          <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <input
              className="form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          {createdAt && (
            <div className="text-muted" style={{ fontSize: 12 }}>
              Miembro desde {new Date(createdAt).toLocaleDateString()}
            </div>
          )}

          {message && <div style={{ fontSize: 13 }}>{message}</div>}

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
