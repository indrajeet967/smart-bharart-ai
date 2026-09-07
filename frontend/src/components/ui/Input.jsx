import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  hint,
  icon: Icon = null,
  rightIcon: RightIcon = null,
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon size={18} />
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full py-2.5 rounded-xl border bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-saffron-500/50 ${
            Icon ? 'pl-10' : 'pl-4'
          } ${RightIcon ? 'pr-10' : 'pr-4'} ${
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-slate-250 dark:border-navy-800 focus:border-saffron-500'
          } ${className}`}
          {...props}
        />
        {RightIcon && (
          <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
            <RightIcon size={18} />
          </span>
        )}
      </div>
      {error && <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}
      {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
