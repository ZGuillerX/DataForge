import { useEffect, useState, type FormEvent } from 'react';
import { usersApi } from '../api/users.api';
import { filesApi } from '../api/files.api';
import { jobsApi } from '../api/jobs.api';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength, { isPasswordValid } from '../components/PasswordStrength';

export default function Profile() {
  const { updateUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [totalFiles, setTotalFiles] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [doneJobs, setDoneJobs] = useState(0);
  const [failedJobs, setFailedJobs] = useState(0);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

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
    const loadActivity = async () => {
      try {
        const [filesRes, jobsRes] = await Promise.all([filesApi.list(1, 1), jobsApi.list(1, 100)]);
        setTotalFiles(filesRes.meta?.total ?? 0);
        setTotalJobs(jobsRes.meta?.total ?? 0);
        setDoneJobs(jobsRes.data.filter((j) => j.status === 'DONE').length);
        setFailedJobs(jobsRes.data.filter((j) => j.status === 'FAILED').length);
      } catch {
        /* ignore */
      }
    };
    load();
    loadActivity();
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

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');

    if (!isPasswordValid(newPassword)) {
      setPasswordMessage('❌ La contraseña nueva no cumple los requisitos mínimos');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('❌ Las contraseñas no coinciden');
      return;
    }

    setChangingPassword(true);
    try {
      await usersApi.changePassword(currentPassword, newPassword);
      setPasswordMessage('✅ Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo cambiar la contraseña';
      setPasswordMessage(`❌ ${msg}`);
    } finally {
      setChangingPassword(false);
      setTimeout(() => setPasswordMessage(''), 5000);
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

      {/* Activity summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">
          <span className="text-label-caps font-label-caps text-on-surface-variant">
            Archivos subidos
          </span>
          <div className="mt-2 text-headline-md font-headline-md text-on-surface">
            {totalFiles.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">
          <span className="text-label-caps font-label-caps text-on-surface-variant">
            Trabajos totales
          </span>
          <div className="mt-2 text-headline-md font-headline-md text-on-surface">
            {totalJobs.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">
          <span className="text-label-caps font-label-caps text-on-surface-variant">
            Completados
          </span>
          <div className="mt-2 text-headline-md font-headline-md text-secondary-container">
            {doneJobs.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">
          <span className="text-label-caps font-label-caps text-on-surface-variant">
            Fallidos
          </span>
          <div className="mt-2 text-headline-md font-headline-md text-error">
            {failedJobs.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        {/* Account data */}
        <div className="h-fit rounded-xl border border-outline-variant bg-surface-container p-md">
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

        {/* Change password */}
        <div className="h-fit rounded-xl border border-outline-variant bg-surface-container p-md">
          <div className="mb-5 flex items-center gap-3 border-b border-outline-variant pb-4">
            <Icon name="lock" className="text-primary" size={24} />
            <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface">
              Cambiar contraseña
            </h3>
          </div>

          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant">
                Contraseña actual
              </label>
              <PasswordInput
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant">
                Contraseña nueva
              </label>
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
                required
              />
              {newPassword.length > 0 && <PasswordStrength password={newPassword} />}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant">
                Confirmar contraseña nueva
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                required
              />
              {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                <span className="text-label-caps font-label-caps text-error">
                  Las contraseñas no coinciden
                </span>
              )}
            </div>

            {passwordMessage && (
              <div className="text-body-sm font-body-sm text-on-surface">{passwordMessage}</div>
            )}

            <button
              className="rounded bg-primary py-2.5 text-body-md font-body-md font-semibold text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-50"
              type="submit"
              disabled={changingPassword}
            >
              {changingPassword ? 'Actualizando…' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
