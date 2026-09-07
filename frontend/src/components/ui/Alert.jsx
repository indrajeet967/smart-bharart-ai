import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export default function Alert({
  variant = 'info', // 'info', 'success', 'warning', 'error'
  title,
  children,
  onDismiss,
  className = ''
}) {
  const variants = {
    info: {
      bg: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    success: {
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    warning: {
      bg: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400'
    },
    error: {
      bg: 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400'
    }
  };

  const config = variants[variant] || variants.info;
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs font-medium leading-relaxed ${config.bg} ${className}`}>
      <Icon size={18} className={`shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1">
        {title && <h4 className="font-bold text-sm mb-0.5">{title}</h4>}
        <div>{children}</div>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
