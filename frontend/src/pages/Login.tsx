import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength, { isPasswordValid } from '../components/PasswordStrength';

type Tab = 'login' | 'register';

export default function Login() {
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const passwordsMismatch =
    tab === 'register' && confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (tab === 'register') {
      if (!isPasswordValid(password)) {
        setError('La contraseña no cumple los requisitos mínimos');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
    }

    setLoading(true);
    try {
      const res =
        tab === 'login'
          ? await authApi.login(email, password)
          : await authApi.register(email, password, name);
      login(res.token, res.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Algo salió mal';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-md">
      <div className="w-full max-w-[24rem] rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <img src="/dataforge_logo.png" alt="DataForge" className="h-[104px] w-auto" />
          <p className="text-body-sm font-body-sm text-on-surface-variant">
            Plataforma de pipelines de datos
          </p>
        </div>

        <div className="mb-6 flex rounded-lg border border-outline-variant bg-background p-1">
          <button
            className={`flex-1 rounded py-1.5 text-body-sm font-body-sm font-medium transition-colors ${
              tab === 'login'
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setTab('login')}
            type="button"
          >
            Iniciar sesión
          </button>
          <button
            className={`flex-1 rounded py-1.5 text-body-sm font-body-sm font-medium transition-colors ${
              tab === 'register'
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setTab('register')}
            type="button"
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {tab === 'register' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant">
                Nombre completo
              </label>
              <input
                className="rounded border border-outline-variant bg-background px-3 py-2 text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
                type="text"
                placeholder="Juan García"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant">
              Correo electrónico
            </label>
            <input
              className="rounded border border-outline-variant bg-background px-3 py-2 text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
              type="email"
              placeholder="tu@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-label-caps font-label-caps text-on-surface-variant">
                Contraseña
              </label>
              {tab === 'login' && (
                <Link
                  to="/forgot-password"
                  className="text-label-caps font-label-caps text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              )}
            </div>
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              required
            />
            {tab === 'register' && password.length > 0 && <PasswordStrength password={password} />}
          </div>

          {tab === 'register' && (
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
          )}

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
            {loading ? 'Cargando…' : tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
