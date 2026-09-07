import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export function StatusProgressBar({ currentStatus }) {
  const steps = ['Submitted', 'Registered', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
  const currentIndex = steps.indexOf(currentStatus) !== -1 ? steps.indexOf(currentStatus) : 0;

  return (
    <div className="w-full space-y-4">
      <div className="relative flex items-center justify-between">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-navy-950 -z-10 -translate-y-1/2 rounded-full" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-saffron-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step} className="flex flex-col items-center group">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isDone
                    ? 'bg-saffron-500 text-white ring-4 ring-saffron-500/20'
                    : 'bg-white dark:bg-navy-900 border-2 border-slate-300 dark:border-navy-700 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle2 size={16} /> : idx + 1}
              </div>
              <span
                className={`text-[10px] font-bold mt-2 text-center transition-colors ${
                  isCurrent
                    ? 'text-saffron-600 dark:text-saffron-400 font-extrabold'
                    : isDone
                    ? 'text-navy-800 dark:text-slate-200'
                    : 'text-slate-400'
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TimelineList({ events = [] }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="relative border-l-2 border-slate-200 dark:border-navy-800 ml-3 pl-6 space-y-6">
      {events.map((evt, idx) => (
        <div key={idx} className="relative">
          <span className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-saffron-500 ring-4 ring-saffron-500/20" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-navy-800 dark:text-white">{evt.status}</span>
            <span className="text-[10px] font-semibold text-slate-400">
              {new Date(evt.date || evt.timestamp).toLocaleString()}
            </span>
          </div>
          {evt.note && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{evt.note}</p>}
        </div>
      ))}
    </div>
  );
}
