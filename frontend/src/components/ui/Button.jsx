import React from 'react';

export default function Button({
  children,
  variant = 'primary', // 'primary', 'secondary', 'saffron', 'outline', 'ghost', 'danger'
  size = 'md', // 'sm', 'md', 'lg'
  isLoading = false,
  isDisabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary: 'bg-navy-800 hover:bg-navy-900 text-white focus:ring-navy-800 shadow-md shadow-navy-900/10 dark:bg-navy-800 dark:hover:bg-navy-700',
    saffron: 'bg-saffron-500 hover:bg-saffron-600 text-white focus:ring-saffron-500 shadow-md shadow-saffron-500/20',
    secondary: 'bg-slate-200 dark:bg-navy-900 hover:bg-slate-300 dark:hover:bg-navy-800 text-slate-800 dark:text-slate-100 focus:ring-slate-400',
    outline: 'border-2 border-slate-300 dark:border-navy-700 hover:border-slate-400 dark:hover:border-navy-600 bg-transparent text-slate-700 dark:text-slate-200 focus:ring-slate-400',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-navy-900 text-slate-700 dark:text-slate-300 focus:ring-slate-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-600 shadow-md shadow-red-600/10'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5'
  };

  return (
    <button
      type={type}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="shrink-0" />
      ) : null}
      
      <span>{children}</span>

      {!isLoading && Icon && iconPosition === 'right' ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="shrink-0" />
      ) : null}
    </button>
  );
}
