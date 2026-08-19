import { useState } from 'react';
import Icon from './Icon';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}

export default function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        className="w-full rounded border border-outline-variant bg-background px-3 py-2 pr-10 text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-on-surface"
        tabIndex={-1}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        <Icon name={visible ? 'visibility_off' : 'visibility'} size={18} />
      </button>
    </div>
  );
}
