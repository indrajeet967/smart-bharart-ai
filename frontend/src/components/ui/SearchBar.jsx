import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  className = ''
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Search size={18} />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-250 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 text-sm font-medium transition-all focus:outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-500/30"
      />
      {value && (
        <button
          onClick={onClear ? onClear : () => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
