import React from 'react';

export default function Badge({
  children,
  variant = 'neutral', // 'success', 'warning', 'danger', 'info', 'neutral', 'saffron'
  size = 'sm', // 'sm', 'md'
  icon: Icon = null,
  className = ''
}) {
  const variants = {
    success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    danger: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
    info: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    saffron: 'bg-saffron-50 dark:bg-saffron-500/10 text-saffron-700 dark:text-saffron-400 border-saffron-200 dark:border-saffron-500/20',
    neutral: 'bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-800'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5'
  };

  return (
    <span
      className={`inline-flex items-center font-extrabold rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {Icon && <Icon size={size === 'sm' ? 12 : 14} className="shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
