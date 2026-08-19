import { useEffect, useState, type FormEvent } from 'react';
import { usersApi } from '../api/users.api';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

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
      <div className="flex flex-col items-center gap-2 py-24 text-on-surface-variant">
        <div>Cargando…</div>
      </div>
    );
  }

  return (
    <>
      <div>
        <h2 className="text-headline-md font-headline-md text-on-surface">Perfil</h2>
        <p className="mt-1 text-body-sm font-body-sm text-on-surface-variant">
          Tu información de cuenta.
        </p>
      </div>

      <div className="max-w-md rounded-xl border border-outline-variant bg-surface-container p-md">
        <div className="mb-5 flex items-center gap-3 border-b border-outline-variant pb-4">
          <Icon name="person" className="text-primary" size={24} />
          <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface">
            Datos de la cuenta
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant">
              Correo electrónico
            </label>
            <input
              className="rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm font-body-sm text-on-surface-variant"
              type="email"
              value={email}
              disabled
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant">
              Nombre completo
            </label>
            <input
              className="rounded border border-outline-variant bg-background px-3 py-2 text-body-sm font-body-sm text-on-surface focus:border-primary focus:outline-none"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          {createdAt && (
            <div className="text-body-sm font-body-sm text-on-surface-variant">
              Miembro desde {new Date(createdAt).toLocaleDateString()}
            </div>
          )}

          {message && <div className="text-body-sm font-body-sm text-on-surface">{message}</div>}

          <button
            className="rounded bg-primary py-2.5 text-body-md font-body-md font-semibold text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-50"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </>
  );
}
