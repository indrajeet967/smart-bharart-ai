import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No Data Found',
  description = 'There are no items to display at the moment.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`p-12 text-center glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-navy-950 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-1">
        <Icon size={28} />
      </div>
      <h3 className="text-base font-bold text-navy-800 dark:text-white font-outfit">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button variant="saffron" size="sm" onClick={onAction} className="mt-3">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
