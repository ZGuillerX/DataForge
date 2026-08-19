import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setDevToken('');
    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.message);
      if (res.devToken) setDevToken(res.devToken);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Algo salió mal';
      setMessage(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-md">
      <div className="w-full max-w-[24rem] rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="mb-6 text-center">
          <h2 className="text-headline-sm font-headline-sm font-semibold text-on-surface">
            Recuperar contraseña
          </h2>
          <p className="mt-1 text-body-sm font-body-sm text-on-surface-variant">
            Ingresá tu correo y te enviamos instrucciones.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          {message && (
            <div className="rounded border border-outline-variant bg-background px-3 py-2 text-body-sm font-body-sm text-on-surface">
              {message}
            </div>
          )}

          {devToken && (
            <div className="rounded border border-tertiary-container/30 bg-tertiary-container/10 px-3 py-2 text-body-sm font-body-sm text-tertiary-container">
              Modo desarrollo (no hay servicio de email configurado):{' '}
              <Link to={`/reset-password?token=${devToken}`} className="underline">
                usar este link para continuar
              </Link>
            </div>
          )}

          <button
            className="mt-2 rounded bg-primary py-2.5 text-body-md font-body-md font-semibold text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Enviando…' : 'Enviar instrucciones'}
          </button>

          <Link
            to="/login"
            className="text-center text-label-caps font-label-caps text-on-surface-variant hover:text-on-surface"
          >
            ← Volver a iniciar sesión
          </Link>
        </form>
      </div>
    </div>
  );
}
