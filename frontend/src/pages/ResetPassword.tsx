import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength, { isPasswordValid } from '../components/PasswordStrength';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('El link de recuperación no es válido');
      return;
    }
    if (!isPasswordValid(password)) {
      setError('La contraseña no cumple los requisitos mínimos');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo actualizar la contraseña';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-md">
      <div className="w-full max-w-[24rem] rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="mb-6 text-center">
          <h2 className="text-headline-sm font-headline-sm font-semibold text-on-surface">
            Nueva contraseña
          </h2>
          <p className="mt-1 text-body-sm font-body-sm text-on-surface-variant">
            Elegí una contraseña nueva para tu cuenta.
          </p>
        </div>

        {done ? (
          <div className="rounded border border-secondary-container/30 bg-secondary-container/10 px-3 py-2 text-body-sm font-body-sm text-secondary-container">
            ✅ Contraseña actualizada. Redirigiendo a inicio de sesión…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant">
                Contraseña nueva
              </label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              {password.length > 0 && <PasswordStrength password={password} />}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant">
                Confirmar contraseña
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              {passwordsMismatch && (
                <span className="text-label-caps font-label-caps text-error">
                  Las contraseñas no coinciden
                </span>
              )}
            </div>

            {error && (
              <div className="rounded border border-error/30 bg-error/10 px-3 py-2 text-body-sm font-body-sm text-error">
                {error}
              </div>
            )}

            <button
              className="mt-2 rounded bg-primary py-2.5 text-body-md font-body-md font-semibold text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
            </button>

            <Link
              to="/login"
              className="text-center text-label-caps font-label-caps text-on-surface-variant hover:text-on-surface"
            >
              ← Volver a iniciar sesión
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
