import React from 'react';

export default function Card({
  children,
  className = '',
  glass = true,
  hoverable = false,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-200 dark:border-navy-800 p-6 transition-all duration-300 ${
        glass ? 'glass bg-white dark:bg-navy-900/90' : 'bg-white dark:bg-navy-900'
      } ${
        hoverable ? 'hover:-translate-y-1 hover:shadow-xl cursor-pointer hover:border-slate-300 dark:hover:border-navy-700' : 'shadow-sm'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between pb-4 border-b border-slate-150 dark:border-navy-800/80 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', icon: Icon = null }) {
  return (
    <h3 className={`text-base font-extrabold font-outfit text-navy-800 dark:text-white flex items-center gap-2 ${className}`}>
      {Icon && <Icon size={18} className="text-saffron-500 shrink-0" />}
      <span>{children}</span>
    </h3>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`pt-4 border-t border-slate-150 dark:border-navy-800/80 mt-4 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}
