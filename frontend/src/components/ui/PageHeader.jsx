import React from 'react';

export default function PageHeader({
  title,
  description,
  icon: Icon = null,
  actions,
  badge
}) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-saffron-500/10 text-saffron-500 dark:bg-saffron-500/20 flex items-center justify-center shrink-0">
              <Icon size={22} />
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-outfit text-navy-800 dark:text-white leading-tight flex items-center gap-2">
              <span>{title}</span>
              {badge && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-saffron-500/10 text-saffron-600 dark:text-saffron-400 border border-saffron-500/20 font-bold">
                  {badge}
                </span>
              )}
            </h1>
          </div>
        </div>
        {description && (
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-3xl">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
