import React, { forwardRef } from 'react';

const Select = forwardRef(({
  label,
  options = [],
  error,
  hint,
  icon: Icon = null,
  className = '',
  id,
  children,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon size={18} />
          </span>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full py-2.5 rounded-xl border bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-saffron-500/50 appearance-none pr-8 ${
            Icon ? 'pl-10' : 'pl-4'
          } ${
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-slate-250 dark:border-navy-800 focus:border-saffron-500'
          } ${className}`}
          {...props}
        >
          {children ? children : options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return <option key={val} value={val}>{lbl}</option>;
          })}
        </select>
        <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </span>
      </div>
      {error && <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}
      {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
