import Icon from './Icon';

interface Rule {
  key: string;
  label: string;
  test: (password: string) => boolean;
}

const RULES: Rule[] = [
  { key: 'length', label: 'Al menos 8 caracteres', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'Una letra mayúscula', test: (p) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'Una letra minúscula', test: (p) => /[a-z]/.test(p) },
  {
    key: 'symbol',
    label: 'Un número o símbolo',
    test: (p) => /[0-9!@#$%^&*(),.?":{}|<>_\-+=[\]/\\;'`~]/.test(p),
  },
];

export function isPasswordValid(password: string): boolean {
  return RULES.every((rule) => rule.test(password));
}

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  return (
    <ul className="flex flex-col gap-1">
      {RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <li
            key={rule.key}
            className={`flex items-center gap-1.5 text-label-caps font-label-caps transition-colors ${
              passed ? 'text-secondary-container' : 'text-error'
            }`}
          >
            <Icon name={passed ? 'check_circle' : 'cancel'} size={14} />
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
