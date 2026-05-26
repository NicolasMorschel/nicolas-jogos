import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function FormInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`form-control input ${className}`.trim()} {...props} />;
}

export function FormSelect({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={`form-select input ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}

export function FormTextarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`form-control input textarea ${className}`.trim()} {...props} />;
}

export function CheckboxField({
  checked,
  onChange,
  children
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="form-check save-card-label">
      <input className="form-check-input" type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span className="form-check-label">{children}</span>
    </label>
  );
}
