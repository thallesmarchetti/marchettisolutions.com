"use client";
import { AlertTriangle, X } from 'lucide-react';

export function PriorityBadge({ priority, lang = 'pt' }: { priority?: string; lang?: string }) {
  const p = (priority || 'normal').toLowerCase();
  if (p === 'urgent') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60">
        <AlertTriangle size={11} />
        {lang === 'pt' ? 'Urgente' : 'Urgent'}
      </span>
    );
  }
  if (p === 'high') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
        {lang === 'pt' ? 'Alta' : 'High'}
      </span>
    );
  }
  if (p === 'low') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
        {lang === 'pt' ? 'Baixa' : 'Low'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300">
      Normal
    </span>
  );
}

export function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
        active
          ? 'bg-gray-200 dark:bg-slate-800 border-l-4 border-[#2b88c4] dark:border-sky-400 text-[#2b88c4] dark:text-sky-400 font-semibold'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function MetricCard({ title, value, sub, icon }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800">{icon}</div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>
    </div>
  );
}

export function StatusBadge({ status, text }: { status: string; text: string }) {
  if (status === 'cancelled') {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
        {text}
      </span>
    );
  }
  const isPositive = status === 'paid' || status === 'active';
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        isPositive
          ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400'
          : 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-400'
      }`}
    >
      {text}
    </span>
  );
}

export function GenericModal({ title, onClose, onSubmit, children, t }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-transparent dark:border-slate-800 w-full max-w-lg z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6">
          {children}
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg">
              {t('cancel')}
            </button>
            <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
