import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type LabelHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300', className)}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
    </label>
  )
);

Label.displayName = 'Label';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={cn(
            'mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'dark:border-gray-600 dark:bg-gray-800 dark:focus-visible:ring-offset-gray-900',
            className
          )}
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label htmlFor={checkboxId} className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-body-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
            {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  name: string;
  options: Array<{ value: string; label: string; description?: string; disabled?: boolean }>;
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
}

export function RadioGroup({ className, name, options, value, onChange, label, error, ...props }: RadioGroupProps) {
  const groupId = name;

  return (
    <div className={cn(className)} {...props}>
      {label && (
        <Label htmlFor={groupId}>{label}</Label>
      )}
      <div className="space-y-3" role="radiogroup" aria-labelledby={label ? groupId : undefined} aria-invalid={error ? 'true' : 'false'}>
        {options.map((option) => (
          <div key={option.value} className="flex items-start gap-3">
            <input
              type="radio"
              id={`${groupId}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange?.(option.value)}
              disabled={option.disabled}
              className={cn(
                'mt-0.5 h-4 w-4 border-gray-300 text-primary-600',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'dark:border-gray-600 dark:bg-gray-800 dark:focus-visible:ring-offset-gray-900'
              )}
            />
            <label htmlFor={`${groupId}-${option.value}`} className="flex flex-col cursor-pointer">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{option.label}</span>
              {option.description && (
                <span className="text-body-sm text-gray-500 dark:text-gray-400">{option.description}</span>
              )}
            </label>
          </div>
        ))}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
    </div>
  );
}

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onChange'> {
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  description?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const switchId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex items-center gap-3">
        <button
          role="switch"
          type="button"
          ref={ref}
          id={switchId}
          aria-checked={props.checked || false}
          aria-disabled={props.disabled}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            props.checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600',
            className
          )}
          onClick={() => {
            if (!props.disabled && props.onChange) {
              props.onChange({ target: { checked: !props.checked } } as React.ChangeEvent<HTMLInputElement>);
            }
          }}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200',
              props.checked ? 'translate-x-6' : 'translate-x-1'
            )}
            aria-hidden="true"
          />
        </button>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label htmlFor={switchId} className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-body-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';