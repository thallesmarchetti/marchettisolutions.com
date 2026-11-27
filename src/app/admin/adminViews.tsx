"use client";
import React, { useEffect, useState } from 'react';
import { logAuditEvent } from '@/lib/audit';
import { createClient } from '@/lib/supabase/client';
import { updateCustomerRecord } from '@/lib/customerData';
import { setAdminData } from '@/lib/adminData';
import AdminTeamManagement from './components/AdminTeamManagement';
import { CheckCircle, X, Download, ShieldCheck, Headset, Lock, Mail, Send, Users, Wallet, FileSpreadsheet, Plus, ArrowDownRight, LineChart, Search, Edit, Trash2, Eye, FileDown, Building, Save, Clock, PlayCircle, RefreshCw, Ban, Calendar, Repeat, PauseCircle, Printer, MessageCircle, AlertTriangle, ThumbsUp, ThumbsDown, Receipt, BellRing, Layers } from 'lucide-react';
import { CURRENCY_SYMBOLS, parseTicketTimestamp, getInvoiceOverdueInfo, getInvoiceBRLAmount, getTicketSlaInfo, buildWhatsAppLink } from './adminShared';
import { PriorityBadge, MetricCard, StatusBadge } from './adminUi';

export function DashboardView({ t, exchangeRates, lang }: any) {
  const [globalPeriod, setGlobalPeriod] = useState('this_month');

  const [stats, setStats] = useState({
    byCurrency: {
      BRL: { paid: 0, pending: 0, expense: 0 },
      AUD: { paid: 0, pending: 0, expense: 0 },
      USD: { paid: 0, pending: 0, expense: 0 }
    },
    paidInvoicesBRLTotal: 0,
    manualIncomeBRLTotal: 0,
    mrrByCurrency: {
      BRL: 0,
      AUD: 0,
      USD: 0
    },
    activeContractsCount: 0,
    openTickets: 0,
    closedTickets: 0,
    totalClients: 0,
    newClientsInPeriod: 0
  });

  const [sixMonthsData, setSixMonthsData] = useState<any[]>([]);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  const isDateInGlobalPeriod = (dateStr: any, period: string): boolean => {
    if (period === 'all_time') return true;
    const dt = parseTicketTimestamp(dateStr);
    if (!dt) return false;

    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let startOfPeriod: Date;

    if (period === 'this_month') {
      startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (period === 'last_30_days') {
      startOfPeriod = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    } else if (period === 'this_quarter') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      startOfPeriod = new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
    } else if (period === 'this_year') {
      startOfPeriod = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else {
      return true;
    }

    return dt >= startOfPeriod && dt <= endOfToday;
  };

  const convertToBRL = (amount: any, currency?: string): number => {
    const val = parseFloat(String(amount || 0)) || 0;
    const curr = (currency || 'BRL').toUpperCase();
    if (curr === 'AUD') return val * (exchangeRates.AUD_BRL || 3.75);
    if (curr === 'USD') return val * (exchangeRates.USD_BRL || 5.75);
    return val;
  };

  useEffect(() => {
    const computeDashboardData = () => {
      const invoices = JSON.parse(localStorage.getItem('marchetti_invoices') || '[]');
      const entries = JSON.parse(localStorage.getItem('marchetti_entries') || '[]');
      const tickets = JSON.parse(localStorage.getItem('marchetti_tickets') || '[]');
      const clients = JSON.parse(localStorage.getItem('marchetti_clients') || '[]');
      const contractsPrimary = JSON.parse(localStorage.getItem('marchetti_contracts') || '[]');
      const contractsFallback = JSON.parse(localStorage.getItem('marchetti_mrr') || '[]');
      const allContracts = contractsPrimary.length > 0 ? contractsPrimary : contractsFallback;

      const byCurrency: any = {
        BRL: { paid: 0, pending: 0, expense: 0 },
        AUD: { paid: 0, pending: 0, expense: 0 },
        USD: { paid: 0, pending: 0, expense: 0 }
      };

      let paidInvoicesBRLTotal = 0;
      let manualIncomeBRLTotal = 0;

      invoices.forEach((inv: any) => {
        if (inv.status === 'cancelled') return;
        if (!isDateInGlobalPeriod(inv.date, globalPeriod)) return;
        const curr = (inv.currency || 'BRL').toUpperCase();
        const val = parseFloat(inv.rawAmount || inv.val || 0) || 0;
        if (!byCurrency[curr]) byCurrency[curr] = { paid: 0, pending: 0, expense: 0 };
        if (inv.status === 'paid') {
          byCurrency[curr].paid += val;
          // Usa a cotação histórica congelada no dia do pagamento
          paidInvoicesBRLTotal += getInvoiceBRLAmount(inv, exchangeRates);
        } else {
          byCurrency[curr].pending += val;
        }
      });

      entries.forEach((ent: any) => {
        if (!isDateInGlobalPeriod(ent.date, globalPeriod)) return;
        const curr = (ent.currency || 'BRL').toUpperCase();
        const val = parseFloat(ent.amount || 0) || 0;
        if (!byCurrency[curr]) byCurrency[curr] = { paid: 0, pending: 0, expense: 0 };
        if (ent.type === 'in') {
          byCurrency[curr].paid += val;
          manualIncomeBRLTotal += convertToBRL(val, curr);
        } else if (ent.type === 'out') {
          byCurrency[curr].expense += val;
        }
      });

      const filteredTickets = tickets.filter((tk: any) => isDateInGlobalPeriod(tk.date, globalPeriod));
      const newClientsInPeriod = clients.filter((cl: any) => isDateInGlobalPeriod(cl.date, globalPeriod)).length;

      const mrrByCurrency: any = { BRL: 0, AUD: 0, USD: 0 };
      let activeContractsCount = 0;

      allContracts.forEach((contract: any) => {
        const status = String(contract.status || 'active').toLowerCase();
        const isActive = status === 'active' || status === 'ativo';
        if (!isActive) return;

        activeContractsCount += 1;
        const curr = (contract.currency || 'BRL').toUpperCase();
        const rawAmount = parseFloat(
          contract.monthlyValue ?? contract.amount ?? contract.value ?? contract.rawAmount ?? contract.val ?? 0
        ) || 0;
        const cycle = String(contract.cycle || contract.billingCycle || 'monthly').toLowerCase();
        const monthlyEquivalent = (cycle === 'yearly' || cycle === 'annual' || cycle === 'anual')
          ? rawAmount / 12
          : rawAmount;

        if (!mrrByCurrency[curr]) mrrByCurrency[curr] = 0;
        mrrByCurrency[curr] += monthlyEquivalent;
      });

      setStats({
        byCurrency,
        paidInvoicesBRLTotal,
        manualIncomeBRLTotal,
        mrrByCurrency,
        activeContractsCount,
        openTickets: filteredTickets.filter((tk: any) => tk.status !== 'completed').length,
        closedTickets: filteredTickets.filter((tk: any) => tk.status === 'completed').length,
        totalClients: clients.length,
        newClientsInPeriod
      });

      // Gráfico de 6 meses usando cotação histórica congelada das faturas pagas
      const now = new Date();
      const monthsPT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthsEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const fullMonthsPT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const fullMonthsEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      const evolution: any[] = [];

      for (let i = 5; i >= 0; i--) {
        const refDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const targetYear = refDate.getFullYear();
        const targetMonth = refDate.getMonth();
        const shortYear = String(targetYear).slice(-2);

        const label = lang === 'pt'
          ? `${monthsPT[targetMonth]}/${shortYear}`
          : `${monthsEN[targetMonth]}/${shortYear}`;
        const fullLabel = lang === 'pt'
          ? `${fullMonthsPT[targetMonth]} ${targetYear}`
          : `${fullMonthsEN[targetMonth]} ${targetYear}`;

        let monthRevenueBRL = 0;
        let monthExpenseBRL = 0;

        invoices.forEach((inv: any) => {
          if (inv.status !== 'paid') return;
          const dt = parseTicketTimestamp(inv.date);
          if (!dt) return;
          if (dt.getFullYear() === targetYear && dt.getMonth() === targetMonth) {
            monthRevenueBRL += getInvoiceBRLAmount(inv, exchangeRates);
          }
        });

        entries.forEach((ent: any) => {
          const dt = parseTicketTimestamp(ent.date);
          if (!dt) return;
          if (dt.getFullYear() === targetYear && dt.getMonth() === targetMonth) {
            const valBRL = convertToBRL(ent.amount, ent.currency);
            if (ent.type === 'in') monthRevenueBRL += valBRL;
            else if (ent.type === 'out') monthExpenseBRL += valBRL;
          }
        });

        evolution.push({
          key: `${targetYear}-${targetMonth}`,
          label,
          fullLabel,
          revenue: monthRevenueBRL,
          expense: monthExpenseBRL,
          net: monthRevenueBRL - monthExpenseBRL
        });
      }

      setSixMonthsData(evolution);
    };

    computeDashboardData();
    window.addEventListener('invoicesUpdated', computeDashboardData);
    window.addEventListener('entriesUpdated', computeDashboardData);
    window.addEventListener('ticketsUpdated', computeDashboardData);
    window.addEventListener('clientAdded', computeDashboardData);
    window.addEventListener('contractsUpdated', computeDashboardData);
    window.addEventListener('storage', computeDashboardData);

    return () => {
      window.removeEventListener('invoicesUpdated', computeDashboardData);
      window.removeEventListener('entriesUpdated', computeDashboardData);
      window.removeEventListener('ticketsUpdated', computeDashboardData);
      window.removeEventListener('clientAdded', computeDashboardData);
      window.removeEventListener('contractsUpdated', computeDashboardData);
      window.removeEventListener('storage', computeDashboardData);
    };
  }, [globalPeriod, exchangeRates, lang]);

  // Receita consolidada em BRL usa o valor congelado das faturas pagas + entradas manuais
  const totalPaidBRL = stats.paidInvoicesBRLTotal + stats.manualIncomeBRLTotal;

  const totalExpensesBRL =
    stats.byCurrency.BRL.expense +
    stats.byCurrency.AUD.expense * exchangeRates.AUD_BRL +
    stats.byCurrency.USD.expense * exchangeRates.USD_BRL;

  const totalPendingBRL =
    stats.byCurrency.BRL.pending +
    stats.byCurrency.AUD.pending * exchangeRates.AUD_BRL +
    stats.byCurrency.USD.pending * exchangeRates.USD_BRL;

  const totalMrrBRL =
    stats.mrrByCurrency.BRL +
    stats.mrrByCurrency.AUD * exchangeRates.AUD_BRL +
    stats.mrrByCurrency.USD * exchangeRates.USD_BRL;

  const netPeriodBRL = totalPaidBRL - totalExpensesBRL;

  const maxSixMonthsValue = Math.max(
    1,
    ...sixMonthsData.map(m => Math.max(m.revenue, m.expense))
  );

  const semesterTotalRevenue = sixMonthsData.reduce((acc, m) => acc + m.revenue, 0);
  const semesterTotalExpense = sixMonthsData.reduce((acc, m) => acc + m.expense, 0);

  const periodOptions = [
    { id: 'this_month', label: lang === 'pt' ? 'Este Mês' : 'This Month' },
    { id: 'last_30_days', label: lang === 'pt' ? 'Últimos 30 dias' : 'Last 30 Days' },
    { id: 'this_quarter', label: lang === 'pt' ? 'Este Trimestre' : 'This Quarter' },
    { id: 'this_year', label: lang === 'pt' ? 'Este Ano' : 'This Year' },
    { id: 'all_time', label: lang === 'pt' ? 'Todo o Período' : 'All Time' }
  ];

  const formatBRL = (value: number) =>
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('desc_dashboard')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 px-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <Calendar size={14} className="text-[#2b88c4]" />
            <span className="hidden sm:inline">{lang === 'pt' ? 'Período:' : 'Period:'}</span>
          </div>
          {periodOptions.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setGlobalPeriod(opt.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                globalPeriod === opt.id
                  ? 'bg-[#2b88c4] text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title={t('rev_monthly')}
          value={formatBRL(totalPaidBRL)}
          sub={`BRL ${stats.byCurrency.BRL.paid.toFixed(2)} | AUD ${stats.byCurrency.AUD.paid.toFixed(2)} | USD ${stats.byCurrency.USD.paid.toFixed(2)}`}
          icon={<Wallet className="text-blue-600 dark:text-sky-400" size={22} />}
        />

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-emerald-200/80 dark:border-emerald-900/60 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full mb-1">
                <Repeat size={10} /> {lang === 'pt' ? 'Contratos Ativos' : 'Active Contracts'}
              </span>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('mrr')}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60">
              <Repeat className="text-emerald-600 dark:text-emerald-400" size={22} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mb-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatBRL(totalMrrBRL)}</h3>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              /{lang === 'pt' ? 'mês' : 'mo'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {stats.activeContractsCount}{' '}
            {lang === 'pt'
              ? stats.activeContractsCount === 1
                ? 'contrato ativo'
                : 'contratos ativos'
              : stats.activeContractsCount === 1
              ? 'active contract'
              : 'active contracts'}{' '}
            • BRL {stats.mrrByCurrency.BRL.toFixed(0)} | AUD {stats.mrrByCurrency.AUD.toFixed(0)} | USD {stats.mrrByCurrency.USD.toFixed(0)}
          </p>
        </div>

        <MetricCard
          title={t('expenses_period')}
          value={formatBRL(totalExpensesBRL)}
          sub={`${lang === 'pt' ? 'Saldo líquido no período:' : 'Period net balance:'} ${netPeriodBRL >= 0 ? '+' : ''}${formatBRL(netPeriodBRL)}`}
          icon={<ArrowDownRight className="text-rose-500" size={22} />}
        />

        <MetricCard
          title={t('pending_receivable')}
          value={formatBRL(totalPendingBRL)}
          sub={`BRL ${stats.byCurrency.BRL.pending.toFixed(2)} | AUD ${stats.byCurrency.AUD.pending.toFixed(2)} | USD ${stats.byCurrency.USD.pending.toFixed(2)}`}
          icon={<FileSpreadsheet className="text-amber-500" size={22} />}
        />

        <MetricCard
          title={t('open_tickets')}
          value={stats.openTickets}
          sub={`${stats.closedTickets} ${t('closed_tickets').toLowerCase()}`}
          icon={<Headset className="text-indigo-500" size={22} />}
        />

        <MetricCard
          title={t('new_clients')}
          value={stats.totalClients}
          sub={
            globalPeriod === 'all_time'
              ? (lang === 'pt' ? 'Base total cadastrada' : 'Total registered base')
              : (lang === 'pt'
                  ? `+${stats.newClientsInPeriod} novo(s) no período`
                  : `+${stats.newClientsInPeriod} new in period`)
          }
          icon={<Users className="text-green-600 dark:text-green-400" size={22} />}
        />
      </div>

      {/* Gráfico Interativo de Evolução Financeira (Receitas vs. Despesas — Últimos 6 Meses) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <LineChart size={20} className="text-[#2b88c4]" />
              {lang === 'pt'
                ? 'Evolução Financeira (Receitas vs. Despesas — Últimos 6 Meses)'
                : 'Financial Evolution (Revenue vs. Expenses — Last 6 Months)'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {lang === 'pt'
                ? 'Comparativo mensal consolidado em Reais (BRL) com taxas de câmbio congeladas no pagamento.'
                : 'Monthly comparison consolidated in BRL using exchange rates locked on payment.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-50/70 dark:bg-sky-950/40 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-sky-900/60">
              <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-blue-600 to-sky-400 inline-block" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {lang === 'pt' ? 'Receitas:' : 'Revenue:'}{' '}
                <strong className="text-blue-700 dark:text-sky-400">{formatBRL(semesterTotalRevenue)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 bg-rose-50/70 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-100 dark:border-rose-900/60">
              <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-rose-600 to-rose-400 inline-block" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {lang === 'pt' ? 'Despesas:' : 'Expenses:'}{' '}
                <strong className="text-rose-600 dark:text-rose-400">{formatBRL(semesterTotalExpense)}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="relative pt-10 pb-2">
          <div className="h-64 flex flex-col justify-between pointer-events-none select-none">
            {[1, 0.66, 0.33, 0].map((ratio, idx) => (
              <div key={idx} className="flex items-center gap-3 w-full">
                <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500 w-20 text-right shrink-0">
                  {ratio === 0
                    ? 'R$ 0'
                    : `R$ ${(maxSixMonthsValue * ratio).toLocaleString('pt-BR', {
                        maximumFractionDigits: 0
                      })}`}
                </span>
                <div
                  className={`flex-1 border-b ${
                    ratio === 0
                      ? 'border-gray-200 dark:border-slate-700'
                      : 'border-dashed border-gray-100 dark:border-slate-800'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="absolute inset-x-0 top-10 bottom-2 pl-24 pr-2 grid grid-cols-6 gap-2 sm:gap-6 items-end">
            {sixMonthsData.map((item, idx) => {
              const revHeightPct = maxSixMonthsValue > 0 ? (item.revenue / maxSixMonthsValue) * 100 : 0;
              const expHeightPct = maxSixMonthsValue > 0 ? (item.expense / maxSixMonthsValue) * 100 : 0;
              const isHovered = hoveredMonthIdx === idx;

              const tooltipAlignClass =
                idx === 0
                  ? 'left-0'
                  : idx === sixMonthsData.length - 1
                  ? 'right-0'
                  : 'left-1/2 -translate-x-1/2';

              return (
                <div
                  key={item.key}
                  onMouseEnter={() => setHoveredMonthIdx(idx)}
                  onMouseLeave={() => setHoveredMonthIdx(null)}
                  className={`h-full flex flex-col items-center justify-end relative rounded-xl px-1.5 transition-colors cursor-pointer ${
                    isHovered ? 'bg-gray-50/90 dark:bg-slate-800/50' : ''
                  }`}
                >
                  {isHovered && (
                    <div
                      className={`absolute -top-28 ${tooltipAlignClass} z-30 w-56 bg-gray-900 dark:bg-slate-800 text-white rounded-xl p-3.5 shadow-2xl border border-slate-700 pointer-events-none animate-in fade-in zoom-in-95 duration-150`}
                    >
                      <p className="text-xs font-bold text-sky-300 border-b border-slate-700 pb-1.5 mb-2">
                        {item.fullLabel}
                      </p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-gray-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-sky-400" />
                            {lang === 'pt' ? 'Receitas:' : 'Revenue:'}
                          </span>
                          <span className="font-bold text-sky-300">{formatBRL(item.revenue)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-gray-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-400" />
                            {lang === 'pt' ? 'Despesas:' : 'Expenses:'}
                          </span>
                          <span className="font-bold text-rose-300">{formatBRL(item.expense)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1.5 mt-1 border-t border-slate-700">
                          <span className="text-gray-400 font-medium">
                            {lang === 'pt' ? 'Saldo:' : 'Net:'}
                          </span>
                          <span
                            className={`font-extrabold ${
                              item.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.net >= 0 ? '+' : ''}
                            {formatBRL(item.net)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="w-full h-64 flex items-end justify-center gap-1.5 sm:gap-2.5 px-1">
                    <div
                      className="w-4 sm:w-7 rounded-t-md bg-gradient-to-t from-blue-600 to-sky-400 hover:brightness-110 transition-all duration-500 shadow-sm"
                      style={{
                        height: item.revenue > 0 ? `max(6px, ${revHeightPct}%)` : '3px',
                        opacity: item.revenue > 0 ? 1 : 0.25
                      }}
                    />
                    <div
                      className="w-4 sm:w-7 rounded-t-md bg-gradient-to-t from-rose-600 to-rose-400 hover:brightness-110 transition-all duration-500 shadow-sm"
                      style={{
                        height: item.expense > 0 ? `max(6px, ${expHeightPct}%)` : '3px',
                        opacity: item.expense > 0 ? 1 : 0.25
                      }}
                    />
                  </div>

                  <span
                    className={`text-xs font-semibold mt-2.5 transition-colors ${
                      isHovered
                        ? 'text-[#2b88c4] dark:text-sky-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
 * VIEW: CONTRATOS RECORRENTES (MRR)
 * ========================================== */
export function ContratosView({
  t,
  lang,
  exchangeRates,
  onOpenModal,
  onEditContract,
  onToggleStatus,
  onGenerateInvoice,
  onGenerateAllMonthInvoices,
  onDeleteContract
}: any) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [filterCycle, setFilterCycle] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const loadContracts = () => {
      const dbContracts = JSON.parse(localStorage.getItem('marchetti_contracts') || '[]');
      setContracts(dbContracts);
    };
    loadContracts();
    window.addEventListener('contractsUpdated', loadContracts);
    window.addEventListener('storage', loadContracts);
    return () => {
      window.removeEventListener('contractsUpdated', loadContracts);
      window.removeEventListener('storage', loadContracts);
    };
  }, []);

  const currentPeriodTag = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;

  const getMonthlyEquivalent = (ct: any) => {
    const raw = parseFloat(ct.monthlyValue || 0) || 0;
    return ct.cycle === 'yearly' ? raw / 12 : raw;
  };

  const toBRL = (val: number, curr: string) => {
    const c = (curr || 'BRL').toUpperCase();
    if (c === 'AUD') return val * (exchangeRates.AUD_BRL || 3.75);
    if (c === 'USD') return val * (exchangeRates.USD_BRL || 5.75);
    return val;
  };

  const activeContracts = contracts.filter(c => c.status === 'active');
  const pausedContracts = contracts.filter(c => c.status === 'paused');

  const totalMrrBRL = activeContracts.reduce(
    (acc, ct) => acc + toBRL(getMonthlyEquivalent(ct), ct.currency),
    0
  );
  const totalArrBRL = totalMrrBRL * 12;

  const pendingToBillThisMonth = activeContracts.filter(
    ct => ct.lastBilledPeriod !== currentPeriodTag
  ).length;

  const filteredContracts = contracts.filter(ct => {
    const matchesQuery =
      !searchTerm ||
      ct.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ct.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ct.id?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesQuery) return false;
    if (filterCurrency && (ct.currency || 'BRL') !== filterCurrency) return false;
    if (filterCycle && (ct.cycle || 'monthly') !== filterCycle) return false;
    if (filterStatus && ct.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('contracts')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('desc_contracts')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onGenerateAllMonthInvoices}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            title={
              lang === 'pt'
                ? `Gerar cobranças de ${currentPeriodTag} para todos os contratos ativos`
                : `Generate ${currentPeriodTag} invoices for all active contracts`
            }
          >
            <Layers size={17} />
            {t('generate_month_invoices')}
            {pendingToBillThisMonth > 0 && (
              <span className="ml-0.5 px-2 py-0.5 text-xs font-extrabold rounded-full bg-white/20 text-white">
                {pendingToBillThisMonth}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> {t('new_contract')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="MRR Ativo Consolidado"
          value={`R$ ${totalMrrBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={lang === 'pt' ? 'Receita mensal garantida' : 'Guaranteed monthly revenue'}
          icon={<Repeat className="text-emerald-600 dark:text-emerald-400" size={22} />}
        />
        <MetricCard
          title="ARR Projetado (12m)"
          value={`R$ ${totalArrBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={lang === 'pt' ? 'Projeção anual recorrente' : 'Projected annual recurring'}
          icon={<LineChart className="text-blue-600 dark:text-sky-400" size={22} />}
        />
        <MetricCard
          title="Contratos Ativos"
          value={activeContracts.length}
          sub={`${pausedContracts.length} ${lang === 'pt' ? 'pausado(s)' : 'paused'}`}
          icon={<CheckCircle className="text-indigo-500" size={22} />}
        />
        <MetricCard
          title={`Faturamento ${currentPeriodTag}`}
          value={pendingToBillThisMonth}
          sub={lang === 'pt' ? 'Contrato(s) aguardando fatura' : 'Contract(s) pending invoice'}
          icon={<Receipt className="text-amber-500" size={22} />}
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cliente ou plano..."
              className="pl-9 pr-3 py-2 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none"
            />
          </div>

          <select
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none"
          >
            <option value="">Todas as Moedas</option>
            <option value="BRL">BRL (R$)</option>
            <option value="AUD">AUD (A$)</option>
            <option value="USD">USD ($)</option>
          </select>

          <select
            value={filterCycle}
            onChange={(e) => setFilterCycle(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none"
          >
            <option value="">Todos os Ciclos</option>
            <option value="monthly">Mensal</option>
            <option value="yearly">Anual</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none"
          >
            <option value="">Todos os Status</option>
            <option value="active">{t('active')}</option>
            <option value="paused">{t('paused')}</option>
            <option value="cancelled">{t('cancelled')}</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setFilterCurrency('');
              setFilterCycle('');
              setFilterStatus('');
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-slate-800">
                <th className="px-6 py-4">Contrato</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Plano / Serviço</th>
                <th className="px-6 py-4">Ciclo / Venc.</th>
                <th className="px-6 py-4 text-right">MRR Equivalente</th>
                <th className="px-6 py-4 text-center">{t('status')}</th>
                <th className="px-6 py-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">
                    Nenhum contrato recorrente encontrado. Clique em <strong>{t('new_contract')}</strong> para cadastrar.
                  </td>
                </tr>
              ) : (
                filteredContracts.map(ct => {
                  const monthlyEq = getMonthlyEquivalent(ct);
                  const isBilledThisMonth = ct.lastBilledPeriod === currentPeriodTag;
                  return (
                    <tr key={ct.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 dark:text-white block">{ct.id}</span>
                        <span className="text-[11px] text-gray-400">Início: {ct.startDate || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900 dark:text-white block">{ct.clientName}</span>
                        {ct.clientEmail && <span className="text-xs text-gray-400">{ct.clientEmail}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700 dark:text-gray-200 font-medium block">{ct.title}</span>
                        {ct.notes && <span className="text-xs text-gray-400">{ct.notes}</span>}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                        <span className="font-semibold block">
                          {ct.cycle === 'yearly' ? 'Anual' : 'Mensal'}
                        </span>
                        <span className="text-gray-400">Todo dia {ct.billingDay || 10}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                          {ct.symbol || CURRENCY_SYMBOLS[ct.currency] || 'R$'} {monthlyEq.toFixed(2)}/mês
                        </span>
                        {ct.currency && ct.currency !== 'BRL' && (
                          <span className="text-[11px] text-gray-400">
                            ≈ R$ {toBRL(monthlyEq, ct.currency).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {ct.status === 'active' && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400">
                            {t('active')}
                          </span>
                        )}
                        {ct.status === 'paused' && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-400">
                            {t('paused')}
                          </span>
                        )}
                        {ct.status === 'cancelled' && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                            {t('cancelled')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {ct.status === 'active' && (
                          <button
                            onClick={() => onGenerateInvoice(ct)}
                            className={`p-2 mx-0.5 rounded-lg transition-colors ${
                              isBilledThisMonth
                                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                                : 'text-blue-600 hover:bg-blue-50 dark:text-sky-400 dark:hover:bg-blue-900/30'
                            }`}
                            title={
                              isBilledThisMonth
                                ? `Fatura ${currentPeriodTag} já gerada`
                                : `Gerar Fatura Mensal (${currentPeriodTag})`
                            }
                          >
                            <Receipt size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => onEditContract(ct)}
                          className="text-gray-400 hover:text-amber-600 p-2 mx-0.5 transition-colors rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30"
                          title="Editar Contrato"
                        >
                          <Edit size={16} />
                        </button>
                        {ct.status === 'active' ? (
                          <button
                            onClick={() => onToggleStatus(ct.id, 'paused')}
                            className="text-gray-400 hover:text-yellow-600 p-2 mx-0.5 transition-colors rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                            title="Pausar Contrato"
                          >
                            <PauseCircle size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => onToggleStatus(ct.id, 'active')}
                            className="text-gray-400 hover:text-green-600 p-2 mx-0.5 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30"
                            title="Reativar Contrato"
                          >
                            <PlayCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteContract(ct)}
                          className="text-gray-400 hover:text-red-600 p-2 mx-0.5 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="Excluir Contrato"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
 * VIEW: EXPORTAÇÃO DE RELATÓRIOS
 * ========================================== */
export function RelatoriosView({ t, lang, exchangeRates, showToast }: any) {
  const [reportType, setReportType] = useState<'finance' | 'invoices' | 'contracts' | 'tickets' | 'clients'>('finance');
  const [periodFilter, setPeriodFilter] = useState('this_month');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const bump = () => setRefreshTick(prev => prev + 1);
    window.addEventListener('invoicesUpdated', bump);
    window.addEventListener('entriesUpdated', bump);
    window.addEventListener('ticketsUpdated', bump);
    window.addEventListener('clientAdded', bump);
    window.addEventListener('contractsUpdated', bump);
    return () => {
      window.removeEventListener('invoicesUpdated', bump);
      window.removeEventListener('entriesUpdated', bump);
      window.removeEventListener('ticketsUpdated', bump);
      window.removeEventListener('clientAdded', bump);
      window.removeEventListener('contractsUpdated', bump);
    };
  }, []);

  const inPeriod = (dateStr: any): boolean => {
    if (periodFilter === 'all_time') return true;
    const dt = parseTicketTimestamp(dateStr);
    if (!dt) return false;
    const now = new Date();
    const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start: Date;
    if (periodFilter === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (periodFilter === 'last_30_days') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    } else if (periodFilter === 'this_quarter') {
      start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
    }
    return dt >= start && dt <= endToday;
  };

  const toBRL = (amount: number, curr: string) => {
    const c = (curr || 'BRL').toUpperCase();
    if (c === 'AUD') return amount * (exchangeRates.AUD_BRL || 3.75);
    if (c === 'USD') return amount * (exchangeRates.USD_BRL || 5.75);
    return amount;
  };

  const buildReportDataset = () => {
    void refreshTick;
    const invoices = JSON.parse(localStorage.getItem('marchetti_invoices') || '[]');
    const entries = JSON.parse(localStorage.getItem('marchetti_entries') || '[]');
    const contracts = JSON.parse(localStorage.getItem('marchetti_contracts') || '[]');
    const tickets = JSON.parse(localStorage.getItem('marchetti_tickets') || '[]');
    const clients = JSON.parse(localStorage.getItem('marchetti_clients') || '[]');

    if (reportType === 'finance') {
      // Faturas pagas usam a taxa de câmbio congelada no dia do pagamento
      const paidInvRows = invoices
        .filter((inv: any) => inv.status === 'paid' && inPeriod(inv.date))
        .map((inv: any) => {
          const amt = parseFloat(inv.rawAmount || inv.val || 0) || 0;
          const curr = (inv.currency || 'BRL').toUpperCase();
          const frozenBrl = getInvoiceBRLAmount(inv, exchangeRates);
          const rateTag =
            curr !== 'BRL' && inv.paidExchangeRate
              ? ` (Câmbio: R$ ${Number(inv.paidExchangeRate).toFixed(4)})`
              : '';
          return {
            date: inv.date,
            type: 'Receita',
            desc: `Fatura ${inv.id} — ${inv.desc}${rateTag}`,
            category: inv.clientName,
            currency: curr,
            originalAmount: amt,
            brlAmount: frozenBrl
          };
        });

      const entryRows = entries
        .filter((ent: any) => inPeriod(ent.date))
        .map((ent: any) => {
          const amt = parseFloat(ent.amount || 0) || 0;
          const curr = (ent.currency || 'BRL').toUpperCase();
          return {
            date: ent.date,
            type: ent.type === 'in' ? 'Receita' : 'Despesa',
            desc: ent.desc,
            category: ent.category || 'Operacional',
            currency: curr,
            originalAmount: amt,
            brlAmount: toBRL(amt, curr)
          };
        });

      const combined = [...paidInvRows, ...entryRows].filter(r => {
        if (currencyFilter !== 'ALL' && r.currency !== currencyFilter) return false;
        if (statusFilter === 'IN' && r.type !== 'Receita') return false;
        if (statusFilter === 'OUT' && r.type !== 'Despesa') return false;
        return true;
      });

      const totalIn = combined.filter(r => r.type === 'Receita').reduce((a, b) => a + b.brlAmount, 0);
      const totalOut = combined.filter(r => r.type === 'Despesa').reduce((a, b) => a + b.brlAmount, 0);

      return {
        title: 'Relatório Financeiro & Fluxo de Caixa Consolidado (Câmbio Histórico Congelado)',
        headers: ['Data', 'Tipo', 'Descrição', 'Cliente / Categoria', 'Moeda', 'Valor Original', 'Consolidado (BRL)'],
        rows: combined.map(r => [
          r.date,
          r.type,
          r.desc,
          r.category,
          r.currency,
          `${CURRENCY_SYMBOLS[r.currency] || 'R$'} ${r.originalAmount.toFixed(2)}`,
          `R$ ${r.brlAmount.toFixed(2)}`
        ]),
        kpis: [
          { label: 'Entradas (BRL)', value: `R$ ${totalIn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'Saídas (BRL)', value: `R$ ${totalOut.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'Saldo Líquido (BRL)', value: `R$ ${(totalIn - totalOut).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
        ]
      };
    }

    if (reportType === 'invoices') {
      const filtered = invoices.filter((inv: any) => {
        if (!inPeriod(inv.date)) return false;
        if (currencyFilter !== 'ALL' && (inv.currency || 'BRL') !== currencyFilter) return false;
        const overdueInfo = getInvoiceOverdueInfo(inv);
        if (statusFilter === 'overdue') return overdueInfo.isOverdue;
        if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
        return true;
      });

      const totalBRL = filtered
        .filter((i: any) => i.status !== 'cancelled')
        .reduce((acc: number, i: any) => acc + getInvoiceBRLAmount(i, exchangeRates), 0);

      return {
        title: 'Relatório de Faturas (Invoices)',
        headers: ['Fatura #', 'Emissão', 'Vencimento', 'Cliente', 'Serviço', 'Status', 'Valor Original', 'Valor BRL'],
        rows: filtered.map((inv: any) => {
          const amt = parseFloat(inv.rawAmount || inv.val || 0) || 0;
          const curr = inv.currency || 'BRL';
          const overdueInfo = getInvoiceOverdueInfo(inv);
          const statusLabel =
            inv.status === 'paid'
              ? 'Pago'
              : inv.status === 'cancelled'
              ? 'Cancelada'
              : overdueInfo.isOverdue
              ? `Vencida (${overdueInfo.daysOverdue}d)`
              : 'Pendente';
          return [
            inv.id,
            inv.date,
            inv.dueDate || '—',
            inv.clientName,
            inv.desc,
            statusLabel,
            `${inv.symbol || CURRENCY_SYMBOLS[curr] || 'R$'} ${amt.toFixed(2)}`,
            `R$ ${getInvoiceBRLAmount(inv, exchangeRates).toFixed(2)}`
          ];
        }),
        kpis: [
          { label: 'Total de Faturas', value: String(filtered.length) },
          { label: 'Pagas', value: String(filtered.filter((i: any) => i.status === 'paid').length) },
          { label: 'Volume Ativo (BRL)', value: `R$ ${totalBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
        ]
      };
    }

    if (reportType === 'contracts') {
      const filtered = contracts.filter((ct: any) => {
        if (currencyFilter !== 'ALL' && (ct.currency || 'BRL') !== currencyFilter) return false;
        if (statusFilter !== 'ALL' && ct.status !== statusFilter) return false;
        return true;
      });

      const mrrBRL = filtered
        .filter((c: any) => c.status === 'active')
        .reduce((acc: number, c: any) => {
          const raw = parseFloat(c.monthlyValue || 0) || 0;
          const m = c.cycle === 'yearly' ? raw / 12 : raw;
          return acc + toBRL(m, c.currency || 'BRL');
        }, 0);

      return {
        title: 'Relatório de Contratos Recorrentes (MRR)',
        headers: ['Contrato #', 'Cliente', 'Plano / Serviço', 'Ciclo', 'Dia Venc.', 'Status', 'MRR Original', 'MRR (BRL)'],
        rows: filtered.map((ct: any) => {
          const raw = parseFloat(ct.monthlyValue || 0) || 0;
          const monthlyEq = ct.cycle === 'yearly' ? raw / 12 : raw;
          const curr = ct.currency || 'BRL';
          const stLabel = ct.status === 'active' ? 'Ativo' : ct.status === 'paused' ? 'Pausado' : 'Cancelado';
          return [
            ct.id,
            ct.clientName,
            ct.title,
            ct.cycle === 'yearly' ? 'Anual' : 'Mensal',
            `Dia ${ct.billingDay || 10}`,
            stLabel,
            `${ct.symbol || CURRENCY_SYMBOLS[curr] || 'R$'} ${monthlyEq.toFixed(2)}`,
            `R$ ${toBRL(monthlyEq, curr).toFixed(2)}`
          ];
        }),
        kpis: [
          { label: 'Contratos Listados', value: String(filtered.length) },
          { label: 'MRR Ativo (BRL)', value: `R$ ${mrrBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'ARR Projetado (BRL)', value: `R$ ${(mrrBRL * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
        ]
      };
    }

    if (reportType === 'tickets') {
      const filtered = tickets.filter((tk: any) => {
        if (!inPeriod(tk.date)) return false;
        if (statusFilter !== 'ALL' && tk.status !== statusFilter) return false;
        return true;
      });

      return {
        title: 'Relatório Operacional de Chamados',
        headers: ['Ticket #', 'Data', 'Cliente', 'Serviço', 'Prioridade', 'Orçamento', 'Status'],
        rows: filtered.map((tk: any) => [
          tk.id,
          tk.date,
          tk.clientName,
          t(tk.servKey) || tk.servKey,
          (tk.priority || 'normal').toUpperCase(),
          tk.estimate
            ? `${tk.estimate.symbol || 'R$'} ${Number(tk.estimate.amount || 0).toFixed(2)} (${tk.estimate.status})`
            : '—',
          tk.status === 'completed' ? 'Concluído' : tk.status === 'in_progress' ? 'Em Andamento' : 'Pendente'
        ]),
        kpis: [
          { label: 'Total Chamados', value: String(filtered.length) },
          { label: 'Concluídos', value: String(filtered.filter((tk: any) => tk.status === 'completed').length) },
          { label: 'Em Aberto', value: String(filtered.filter((tk: any) => tk.status !== 'completed').length) }
        ]
      };
    }

    const filteredClients = clients.filter((cl: any) => {
      if (!inPeriod(cl.date)) return false;
      if (statusFilter !== 'ALL' && (cl.status || 'active') !== statusFilter) return false;
      return true;
    });

    return {
      title: 'Relatório da Base de Clientes',
      headers: ['ID', 'Cadastro', 'Nome / Empresa', 'E-mail', 'Telefone', 'Cidade / País', 'Status'],
      rows: filteredClients.map((cl: any) => [
        cl.id,
        cl.date || '—',
        cl.name,
        cl.email,
        cl.phone || '—',
        cl.cidade ? `${cl.cidade}${cl.estado ? ` - ${cl.estado}` : ''} (${cl.country || 'BR'})` : cl.country || 'BR',
        (cl.status || 'active') === 'active' ? 'Ativo' : 'Inativo'
      ]),
      kpis: [
        { label: 'Clientes Listados', value: String(filteredClients.length) },
        { label: 'Ativos', value: String(filteredClients.filter((c: any) => (c.status || 'active') === 'active').length) },
        { label: 'Países Atendidos', value: String(new Set(filteredClients.map((c: any) => c.country || 'BR')).size) }
      ]
    };
  };

  const dataset = buildReportDataset();

  const handleExportCSV = () => {
    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvLines = [
      dataset.headers.map(escapeCsv).join(';'),
      ...dataset.rows.map((row: any[]) => row.map(escapeCsv).join(';'))
    ];
    const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = `marchetti_relatorio_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.href = url;
    link.setAttribute('download', slug);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(
      lang === 'pt' ? `Arquivo ${slug} exportado com sucesso!` : `File ${slug} exported!`,
      'success'
    );
  };

  const handleExportPDF = () => {
    const nowStr = new Date().toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${dataset.title}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; padding: 28px; font-size: 12px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2b88c4; padding-bottom: 14px; margin-bottom: 18px; }
          .brand { font-size: 20px; font-weight: bold; color: #2b88c4; }
          .sub { font-size: 11px; color: #64748b; margin-top: 3px; }
          .kpis { display: flex; gap: 12px; margin-bottom: 18px; }
          .kpi { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #f8fafc; }
          .kpi-label { font-size: 10px; text-transform: uppercase; color: #64748b; }
          .kpi-val { font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #f1f5f9; color: #334155; font-size: 10px; text-transform: uppercase; text-align: left; padding: 8px; border-bottom: 1px solid #cbd5e1; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Marchetti Solutions</div>
            <div class="sub">${dataset.title}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:bold">Emitido em: ${nowStr}</div>
            <div class="sub">Cotação ref.: 1 AUD = R$ ${exchangeRates.AUD_BRL} | 1 USD = R$ ${exchangeRates.USD_BRL}</div>
          </div>
        </div>
        <div class="kpis">
          ${dataset.kpis
            .map(k => `<div class="kpi"><div class="kpi-label">${k.label}</div><div class="kpi-val">${k.value}</div></div>`)
            .join('')}
        </div>
        <table>
          <thead>
            <tr>${dataset.headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${
              dataset.rows.length === 0
                ? `<tr><td colspan="${dataset.headers.length}" style="text-align:center;padding:18px;color:#64748b">Nenhum registro encontrado para os filtros aplicados.</td></tr>`
                : dataset.rows
                    .map((r: any[]) => `<tr>${r.map((cell: any) => `<td>${cell}</td>`).join('')}</tr>`)
                    .join('')
            }
          </tbody>
        </table>
        <div class="footer">Marchetti Solutions — Painel Administrativo</div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1500);
      }, 250);
    }

    showToast(
      lang === 'pt' ? 'Janela de impressão/PDF preparada!' : 'Print/PDF view ready!',
      'info'
    );
  };

  const reportTabs = [
    { id: 'finance', label: 'Financeiro & Fluxo', icon: <Wallet size={16} /> },
    { id: 'invoices', label: 'Faturas (Invoices)', icon: <FileSpreadsheet size={16} /> },
    { id: 'contracts', label: 'Contratos (MRR)', icon: <Repeat size={16} /> },
    { id: 'tickets', label: 'Chamados', icon: <Headset size={16} /> },
    { id: 'clients', label: 'Clientes', icon: <Users size={16} /> }
  ];

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('desc_reports')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <Download size={16} /> Exportar CSV (Excel)
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="bg-[#2b88c4] hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
          >
            <Printer size={16} /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {reportTabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setReportType(tab.id as any);
              setStatusFilter('ALL');
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all border ${
              reportType === tab.id
                ? 'bg-[#2b88c4] text-white border-[#2b88c4] shadow-sm'
                : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {reportType !== 'contracts' ? (
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Período</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none"
            >
              <option value="this_month">Este Mês</option>
              <option value="last_30_days">Últimos 30 dias</option>
              <option value="this_quarter">Este Trimestre</option>
              <option value="this_year">Este Ano</option>
              <option value="all_time">Todo o Período</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Escopo</label>
            <input
              type="text"
              readOnly
              value="Carteira Completa de Contratos MRR"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-500"
            />
          </div>
        )}

        {(reportType === 'finance' || reportType === 'invoices' || reportType === 'contracts') ? (
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Moeda</label>
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none"
            >
              <option value="ALL">Todas as Moedas (Consolidado BRL)</option>
              <option value="BRL">Apenas BRL (R$)</option>
              <option value="AUD">Apenas AUD (A$)</option>
              <option value="USD">Apenas USD ($)</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Moeda</label>
            <input
              type="text"
              readOnly
              value="Não aplicável a este relatório"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Filtro de Status / Tipo</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none"
          >
            <option value="ALL">Todos</option>
            {reportType === 'finance' && (
              <>
                <option value="IN">Apenas Receitas / Entradas</option>
                <option value="OUT">Apenas Despesas / Saídas</option>
              </>
            )}
            {reportType === 'invoices' && (
              <>
                <option value="paid">Pagas</option>
                <option value="pending">Pendentes</option>
                <option value="overdue">Vencidas (Em Atraso)</option>
                <option value="cancelled">Canceladas</option>
              </>
            )}
            {reportType === 'contracts' && (
              <>
                <option value="active">Ativos</option>
                <option value="paused">Pausados</option>
                <option value="cancelled">Cancelados</option>
              </>
            )}
            {reportType === 'tickets' && (
              <>
                <option value="pending">Pendentes</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Concluídos</option>
              </>
            )}
            {reportType === 'clients' && (
              <>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </>
            )}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        {dataset.kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{kpi.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1.5">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{dataset.title}</h3>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {dataset.rows.length} {dataset.rows.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-slate-800">
                {dataset.headers.map((h, i) => (
                  <th key={i} className="px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
              {dataset.rows.length === 0 ? (
                <tr>
                  <td colSpan={dataset.headers.length} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Nenhum dado encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                dataset.rows.map((row: any[], rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    {row.map((cell: any, cIdx: number) => (
                      <td key={cIdx} className="px-5 py-3.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
 * VIEW: CÂMBIO + SIMULADORES + HISTÓRICO DE TAXAS SALVAS
 * ========================================== */
export function CambioView({ t, lang, exchangeRates, onRefreshRates }: any) {
  const [convAmount, setConvAmount] = useState('100');
  const [convFrom, setConvFrom] = useState('AUD');

  const [wiseAmount, setWiseAmount] = useState('1000');
  const [wiseCurrency, setWiseCurrency] = useState('AUD');
  const [iofRate, setIofRate] = useState('0.38');
  const [wiseFeePercent, setWiseFeePercent] = useState('1.10');

  const [stripeAmount, setStripeAmount] = useState('500');
  const [stripePlan, setStripePlan] = useState('BR_LOCAL');

  const [savedRateHistory, setSavedRateHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadRateHistory = () => {
      try {
        const storedHistory = JSON.parse(localStorage.getItem('marchetti_exchange_history') || '[]');
        // Também sincroniza qualquer fatura paga que tenha paidExchangeRate
        const invoices = JSON.parse(localStorage.getItem('marchetti_invoices') || '[]');
        const fromInvoices = invoices
          .filter((inv: any) => inv.status === 'paid' && inv.paidExchangeRate)
          .map((inv: any) => ({
            id: `FX-INV-${inv.id}`,
            invoiceId: inv.id,
            clientName: inv.clientName,
            currency: inv.currency || 'BRL',
            symbol: inv.symbol || CURRENCY_SYMBOLS[inv.currency] || 'R$',
            originalAmount: parseFloat(inv.rawAmount || inv.val || 0) || 0,
            rateApplied: Number(inv.paidExchangeRate),
            brlConsolidated: getInvoiceBRLAmount(inv, exchangeRates),
            paidAt: inv.paidAt || inv.date
          }));

        const mergedMap = new Map<string, any>();
        [...storedHistory, ...fromInvoices].forEach(item => {
          if (!mergedMap.has(item.invoiceId)) {
            mergedMap.set(item.invoiceId, item);
          }
        });
        setSavedRateHistory(Array.from(mergedMap.values()));
      } catch (e) {
        console.error(e);
      }
    };

    loadRateHistory();
    window.addEventListener('exchangeHistoryUpdated', loadRateHistory);
    window.addEventListener('invoicesUpdated', loadRateHistory);
    window.addEventListener('storage', loadRateHistory);

    return () => {
      window.removeEventListener('exchangeHistoryUpdated', loadRateHistory);
      window.removeEventListener('invoicesUpdated', loadRateHistory);
      window.removeEventListener('storage', loadRateHistory);
    };
  }, [exchangeRates]);

  const convertedPreview =
    (parseFloat(convAmount || '0') || 0) *
    (convFrom === 'AUD' ? exchangeRates.AUD_BRL : exchangeRates.USD_BRL);

  const numericWiseAmount = parseFloat(wiseAmount || '0') || 0;
  const activeWiseRate = wiseCurrency === 'AUD' ? exchangeRates.AUD_BRL : exchangeRates.USD_BRL;
  const grossBRL = numericWiseAmount * activeWiseRate;
  const iofAmountBRL = grossBRL * ((parseFloat(iofRate || '0') || 0) / 100);
  const wiseFeeBRL = grossBRL * ((parseFloat(wiseFeePercent || '0') || 0) / 100);
  const netWiseBRL = Math.max(0, grossBRL - iofAmountBRL - wiseFeeBRL);

  const STRIPE_PRESETS: any = {
    BR_LOCAL: { currency: 'BRL', symbol: 'R$', pct: 3.99, fixed: 0.39, label: 'Brasil Nacional (3,99% + R$ 0,39)' },
    BR_INTL: { currency: 'BRL', symbol: 'R$', pct: 4.99, fixed: 0.39, label: 'Brasil Internacional (4,99% + R$ 0,39)' },
    AU_LOCAL: { currency: 'AUD', symbol: 'A$', pct: 1.75, fixed: 0.30, label: 'Austrália Doméstico (1,75% + A$ 0,30)' },
    AU_INTL: { currency: 'AUD', symbol: 'A$', pct: 3.50, fixed: 0.30, label: 'Austrália Internacional (3,50% + A$ 0,30)' },
    US_LOCAL: { currency: 'USD', symbol: '$', pct: 2.90, fixed: 0.30, label: 'EUA Padrão (2,90% + $ 0,30)' }
  };
  const currentStripePreset = STRIPE_PRESETS[stripePlan] || STRIPE_PRESETS.BR_LOCAL;
  const numericStripeAmount = parseFloat(stripeAmount || '0') || 0;
  const stripeFeeOrig = numericStripeAmount > 0
    ? (numericStripeAmount * (currentStripePreset.pct / 100)) + currentStripePreset.fixed
    : 0;
  const stripeNetOrig = Math.max(0, numericStripeAmount - stripeFeeOrig);
  const stripeToBRLRate =
    currentStripePreset.currency === 'AUD'
      ? exchangeRates.AUD_BRL
      : currentStripePreset.currency === 'USD'
      ? exchangeRates.USD_BRL
      : 1;
  const stripeNetBRL = stripeNetOrig * stripeToBRLRate;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('exchange')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('desc_exchange')}</p>
      </div>

      {/* Card de Câmbio em Tempo Real + Conversor */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">Câmbio em Tempo Real</span>
              <button
                onClick={onRefreshRates}
                className="p-1 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                title="Atualizar Cotações"
              >
                <RefreshCw size={14} className={exchangeRates.loading ? 'animate-spin text-blue-600' : ''} />
              </button>
              {exchangeRates.updatedAt && (
                <span className="text-xs text-gray-400">({exchangeRates.updatedAt})</span>
              )}
            </div>
            <div className="flex flex-wrap gap-6 mt-2">
              <div className="bg-gray-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-700">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">1 AUD (Dólar Australiano)</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">R$ {exchangeRates.AUD_BRL.toFixed(4)}</span>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-700">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">1 USD (Dólar Americano)</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">R$ {exchangeRates.USD_BRL.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/70 dark:bg-slate-800/80 p-4 rounded-xl border border-blue-100 dark:border-slate-700 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Conversor:</span>
            <input
              type="number"
              value={convAmount}
              onChange={(e) => setConvAmount(e.target.value)}
              className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-semibold outline-none"
            />
            <select
              value={convFrom}
              onChange={(e) => setConvFrom(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-semibold outline-none"
            >
              <option value="AUD">AUD</option>
              <option value="USD">USD</option>
            </select>
            <span className="text-sm font-bold text-blue-700 dark:text-sky-400">
              = R$ {convertedPreview.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Histórico de Taxas de Câmbio Salvas (Congeladas no Pagamento) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock size={15} className="text-[#2b88c4]" />
              {lang === 'pt'
                ? 'Histórico de Taxas de Câmbio Salvas (Faturas Pagas)'
                : 'Saved Exchange Rate History (Paid Invoices)'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {lang === 'pt'
                ? 'Cotação exata registrada no dia do pagamento para manter os relatórios em BRL imutáveis.'
                : 'Exact exchange rate locked on the payment date to prevent retroactive BRL report drift.'}
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 dark:bg-sky-950/60 text-blue-700 dark:text-sky-300 self-start sm:self-auto">
            {savedRateHistory.length} {savedRateHistory.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-slate-800">
                <th className="px-6 py-3.5">Data Pagamento</th>
                <th className="px-6 py-3.5">Fatura</th>
                <th className="px-6 py-3.5">Cliente</th>
                <th className="px-6 py-3.5 text-right">Valor Original</th>
                <th className="px-6 py-3.5 text-right">Cotação Congelada</th>
                <th className="px-6 py-3.5 text-right">Consolidado Fixo (BRL)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
              {savedRateHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400 text-xs">
                    {lang === 'pt'
                      ? 'Nenhuma fatura paga registrada ainda. Ao dar baixa em uma fatura AUD/USD/BRL, a cotação do dia será salva aqui.'
                      : 'No paid invoices recorded yet. Settling an AUD/USD/BRL invoice locks its exchange rate here.'}
                  </td>
                </tr>
              ) : (
                savedRateHistory.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3.5 text-xs text-gray-500 dark:text-gray-400">{item.paidAt}</td>
                    <td className="px-6 py-3.5 font-bold text-blue-600 dark:text-sky-400">{item.invoiceId}</td>
                    <td className="px-6 py-3.5 font-medium text-gray-900 dark:text-white">{item.clientName}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-gray-800 dark:text-gray-200">
                      {item.symbol} {Number(item.originalAmount || 0).toFixed(2)} ({item.currency})
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-xs font-bold text-amber-700 dark:text-amber-300">
                      {item.currency === 'BRL'
                        ? '1,0000 (Base BRL)'
                        : `1 ${item.currency} = R$ ${Number(item.rateApplied).toFixed(4)}`}
                    </td>
                    <td className="px-6 py-3.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                      R$ {Number(item.brlConsolidated || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card Calculadora de Recebimento via Stripe (Cartão) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Calculadora de Recebimento via Stripe (Cartão de Crédito)
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Calcule o valor líquido após as tarifas percentuais e fixas por transação da Stripe.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 self-start sm:self-auto">
            Taxa: {currentStripePreset.pct.toFixed(2)}% + {currentStripePreset.symbol} {currentStripePreset.fixed.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Modalidade / Região da Conta Stripe</label>
            <select
              value={stripePlan}
              onChange={(e) => setStripePlan(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none"
            >
              <option value="BR_LOCAL">Brasil — Cartão Nacional (3,99% + R$ 0,39)</option>
              <option value="BR_INTL">Brasil — Cartão Internacional (4,99% + R$ 0,39)</option>
              <option value="AU_LOCAL">Austrália — Cartão Doméstico AUD (1,75% + A$ 0,30)</option>
              <option value="AU_INTL">Austrália — Cartão Internacional AUD (3,50% + A$ 0,30)</option>
              <option value="US_LOCAL">EUA — Cartão Padrão USD (2,90% + $ 0,30)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Valor Cobrado na Fatura ({currentStripePreset.currency})
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={stripeAmount}
              onChange={(e) => setStripeAmount(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold outline-none"
              placeholder="500.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">Valor Bruto Cobrado</span>
            <span className="text-base font-bold text-gray-900 dark:text-white">
              {currentStripePreset.symbol} {numericStripeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">Taxa Stripe ({currentStripePreset.pct.toFixed(2)}% + {currentStripePreset.symbol}{currentStripePreset.fixed.toFixed(2)})</span>
            <span className="text-base font-bold text-red-600 dark:text-red-400">
              - {currentStripePreset.symbol} {stripeFeeOrig.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">Líquido na Moeda ({currentStripePreset.currency})</span>
            <span className="text-base font-bold text-gray-900 dark:text-white">
              {currentStripePreset.symbol} {stripeNetOrig.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-950/60 px-4 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 block">Líquido Estimado em BRL</span>
            <span className="text-lg font-extrabold text-indigo-700 dark:text-indigo-300">
              R$ {stripeNetBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Card Calculadora de IOF & Recebimento via Wise */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Calculadora de IOF &amp; Recebimento via Wise
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Simule a conversão para Real (BRL) descontando o IOF e a tarifa de transferência Wise usando a cotação ao vivo.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 self-start sm:self-auto">
            1 {wiseCurrency} = R$ {activeWiseRate.toFixed(4)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Moeda de Origem</label>
            <select
              value={wiseCurrency}
              onChange={(e) => setWiseCurrency(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none"
            >
              <option value="AUD">AUD (Dólar Australiano)</option>
              <option value="USD">USD (Dólar Americano)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Valor a Receber ({wiseCurrency})</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={wiseAmount}
              onChange={(e) => setWiseAmount(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold outline-none"
              placeholder="1000.00"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Alíquota de IOF</label>
            <select
              value={iofRate}
              onChange={(e) => setIofRate(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none"
            >
              <option value="0.38">0,38% — Recebimento Serviços / PJ</option>
              <option value="1.10">1,10% — Remessa Conta Própria</option>
              <option value="3.50">3,50% — Cartão / Compra Internacional</option>
              <option value="0">0,00% — Isento / Exportação</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tarifa Wise (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={wiseFeePercent}
              onChange={(e) => setWiseFeePercent(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold outline-none"
              placeholder="1.10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">Valor Bruto (BRL)</span>
            <span className="text-base font-bold text-gray-900 dark:text-white">
              R$ {grossBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">Desconto IOF ({parseFloat(iofRate || '0').toFixed(2)}%)</span>
            <span className="text-base font-bold text-red-600 dark:text-red-400">
              - R$ {iofAmountBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">Taxa Wise ({parseFloat(wiseFeePercent || '0').toFixed(2)}%)</span>
            <span className="text-base font-bold text-amber-600 dark:text-amber-400">
              - R$ {wiseFeeBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 block">Líquido a Receber (Wise)</span>
            <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
              R$ {netWiseBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
 * VIEW: GESTÃO DE CHAMADOS (SUPORTE & OPERAÇÃO)
 * ========================================== */
export function ChamadosView({ t, lang, showToast, onOpenNewTicket, onCompleteTicket, onViewTicket, onDeleteTicket }: any) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterClient, setFilterClient] = useState('');

  useEffect(() => {
    const loadTickets = async () => {
      const supabase = createClient();
      const [{ data: records }, { data: profiles }] = await Promise.all([
        supabase.from('customer_records').select('kind, data').eq('kind', 'ticket'),
        supabase.from('profiles').select('id, email, display_name, phone, client_data').eq('role', 'client'),
      ]);
      const dbTickets = (records || []).map((record) => record.data);
      const dbClients = (profiles || []).map((profile) => ({
        ...(profile.client_data || {}),
        id: profile.id,
        email: profile.email,
        name: profile.display_name || profile.email,
        phone: profile.phone,
      }));
      localStorage.setItem('marchetti_tickets', JSON.stringify(dbTickets));
      localStorage.setItem('marchetti_clients', JSON.stringify(dbClients));
      setTickets(dbTickets);
      setClients(dbClients);
    };
    loadTickets();
    window.addEventListener('ticketsUpdated', loadTickets);
    window.addEventListener('clientAdded', loadTickets);
    window.addEventListener('storage', loadTickets);
    return () => {
      window.removeEventListener('ticketsUpdated', loadTickets);
      window.removeEventListener('clientAdded', loadTickets);
      window.removeEventListener('storage', loadTickets);
    };
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const updated = tickets.map(tk => (tk.id === id ? { ...tk, status: newStatus } : tk));
    setTickets(updated);
    localStorage.setItem('marchetti_tickets', JSON.stringify(updated));
    const changedTicket = updated.find((ticket) => ticket.id === id);
    if (changedTicket) await updateCustomerRecord('ticket', changedTicket);
    window.dispatchEvent(new CustomEvent('ticketsUpdated'));
    showToast(t('toast_status_upd'), 'success');

    if (newStatus === 'completed' && onCompleteTicket) {
      onCompleteTicket(id);
    }
  };

  const resolveClientPhone = (tk: any) => {
    if (tk.clientPhone) return tk.clientPhone;
    const found = clients.find(
      c =>
        (tk.clientEmail && c.email?.toLowerCase() === tk.clientEmail.toLowerCase()) ||
        (tk.clientName && c.name?.toLowerCase() === tk.clientName.toLowerCase())
    );
    return found?.phone || '';
  };

  const uniqueClients = Array.from(new Set(tickets.map(tk => tk.clientName).filter(Boolean)));

  const countAll = tickets.length;
  const countPending = tickets.filter(tk => tk.status === 'pending').length;
  const countInProgress = tickets.filter(tk => tk.status === 'in_progress').length;
  const countCompleted = tickets.filter(tk => tk.status === 'completed').length;
  const countSlaAlerts = tickets.filter(tk => getTicketSlaInfo(tk).level !== 'ok').length;

  const filteredTickets = tickets.filter(tk => {
    if (statusTab === 'pending' && tk.status !== 'pending') return false;
    if (statusTab === 'in_progress' && tk.status !== 'in_progress') return false;
    if (statusTab === 'completed' && tk.status !== 'completed') return false;
    if (statusTab === 'sla_alert' && getTicketSlaInfo(tk).level === 'ok') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const serviceLabel = (t(tk.servKey) || tk.servKey || '').toLowerCase();
      const matches =
        tk.id?.toLowerCase().includes(q) ||
        tk.clientName?.toLowerCase().includes(q) ||
        tk.clientEmail?.toLowerCase().includes(q) ||
        tk.desc?.toLowerCase().includes(q) ||
        serviceLabel.includes(q);
      if (!matches) return false;
    }

    const tkPriority = (tk.priority || 'normal').toLowerCase();
    if (filterPriority && tkPriority !== filterPriority) return false;

    const datePart = (tk.date || '').split(' ')[0];
    const parts = datePart.split('/');
    const m = parts[1] || '';
    const y = parts[2] || '';
    if (filterMonth && m !== filterMonth) return false;
    if (filterYear && y !== filterYear) return false;
    if (filterClient && tk.clientName !== filterClient) return false;

    return true;
  });

  const quickTabs = [
    { id: 'all', label: lang === 'pt' ? 'Todos' : 'All', count: countAll },
    { id: 'pending', label: lang === 'pt' ? 'Pendentes' : 'Pending', count: countPending },
    { id: 'in_progress', label: lang === 'pt' ? 'Em Andamento' : 'In Progress', count: countInProgress },
    { id: 'completed', label: lang === 'pt' ? 'Concluídos' : 'Completed', count: countCompleted }
  ];

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('tickets')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('desc_tickets')}</p>
        </div>
        <button
          onClick={onOpenNewTicket}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> {t('new_ticket')}
        </button>
      </div>

      {countSlaAlerts > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {lang === 'pt'
                  ? `Atenção SLA: ${countSlaAlerts} chamado(s) em aberto há mais de 24h`
                  : `SLA Alert: ${countSlaAlerts} open ticket(s) exceeding 24h`}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300/90">
                {lang === 'pt'
                  ? 'Priorize o atendimento ou envie um orçamento prévio ao cliente.'
                  : 'Prioritize response or send a pre-approval estimate to the client.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusTab(statusTab === 'sla_alert' ? 'all' : 'sla_alert')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              statusTab === 'sla_alert'
                ? 'bg-amber-700 text-white'
                : 'bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100/60'
            }`}
          >
            {statusTab === 'sla_alert'
              ? (lang === 'pt' ? 'Mostrar Todos' : 'Show All')
              : (lang === 'pt' ? 'Filtrar Críticos SLA' : 'Filter SLA Alerts')}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {quickTabs.map(tab => {
          const isActive = statusTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                isActive
                  ? 'bg-[#2b88c4] text-white border-[#2b88c4] shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  lang === 'pt'
                    ? 'Buscar por ticket (#TK), cliente, e-mail ou relato...'
                    : 'Search by ticket (#TK), client, email or notes...'
                }
                className="pl-10 pr-4 py-2 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2b88c4]"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none"
              >
                <option value="">{lang === 'pt' ? 'Todas as Prioridades' : 'All Priorities'}</option>
                <option value="urgent">{lang === 'pt' ? 'Urgente' : 'Urgent'}</option>
                <option value="high">{lang === 'pt' ? 'Alta' : 'High'}</option>
                <option value="normal">Normal</option>
                <option value="low">{lang === 'pt' ? 'Baixa' : 'Low'}</option>
              </select>
            </div>

            <div className="md:col-span-4">
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none"
              >
                <option value="">{lang === 'pt' ? 'Todos os Clientes' : 'All Clients'}</option>
                {uniqueClients.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none">
              <option value="">Todos os Meses</option>
              <option value="01">Janeiro</option>
              <option value="02">Fevereiro</option>
              <option value="03">Março</option>
              <option value="04">Abril</option>
              <option value="05">Maio</option>
              <option value="06">Junho</option>
              <option value="07">Julho</option>
              <option value="08">Agosto</option>
              <option value="09">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>

            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none">
              <option value="">Todos os Anos</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusTab('all');
                setFilterPriority('');
                setFilterMonth('');
                setFilterYear('');
                setFilterClient('');
              }}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-slate-800">
                <th className="py-4 px-5">Ticket / SLA</th>
                <th className="py-4 px-4">Prioridade</th>
                <th className="py-4 px-5">Cliente</th>
                <th className="py-4 px-5">Serviço &amp; Orçamento</th>
                <th className="py-4 px-4">Abertura</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-5 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500 dark:text-gray-400">
                    Nenhum chamado encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTickets.map(tk => {
                  const sla = getTicketSlaInfo(tk);
                  const phone = resolveClientPhone(tk);
                  const serviceName = t(tk.servKey) || tk.servKey;
                  const waMessage =
                    lang === 'pt'
                      ? `Olá ${tk.clientName}! Aqui é da Marchetti Solutions sobre o chamado ${tk.id} (${serviceName}).`
                      : `Hello ${tk.clientName}! This is Marchetti Solutions regarding ticket ${tk.id} (${serviceName}).`;

                  return (
                    <tr
                      key={tk.id}
                      className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${
                        sla.level === 'critical'
                          ? 'bg-red-50/30 dark:bg-red-950/15'
                          : sla.level === 'warning'
                          ? 'bg-amber-50/30 dark:bg-amber-950/15'
                          : ''
                      }`}
                    >
                      <td className="py-4 px-5 font-bold">
                        <button
                          onClick={() => onViewTicket(tk)}
                          className="text-blue-600 dark:text-sky-400 hover:underline block text-left"
                        >
                          {tk.id}
                        </button>
                        {sla.level === 'critical' && (
                          <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300">
                            <AlertTriangle size={10} /> {sla.label}
                          </span>
                        )}
                        {sla.level === 'warning' && (
                          <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                            <Clock size={10} /> {sla.label}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <PriorityBadge priority={tk.priority} lang={lang} />
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-semibold text-gray-900 dark:text-white block">{tk.clientName}</span>
                        {tk.clientEmail && (
                          <span className="text-xs text-gray-400 block">{tk.clientEmail}</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <span className="text-gray-700 dark:text-gray-200 font-medium block">
                          {serviceName}
                        </span>
                        {tk.estimate && (
                          <span
                            className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              tk.estimate.status === 'approved'
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                                : tk.estimate.status === 'rejected'
                                ? 'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300'
                                : 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                            }`}
                          >
                            Orç.: {tk.estimate.symbol || 'R$'} {Number(tk.estimate.amount || 0).toFixed(2)} •{' '}
                            {tk.estimate.status === 'approved'
                              ? 'Aprovado'
                              : tk.estimate.status === 'rejected'
                              ? 'Recusado'
                              : 'Aguardando'}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        <span className="block">{tk.date}</span>
                        {tk.status !== 'completed' && sla.hoursOpen > 0 && (
                          <span className="text-[11px] text-gray-400">há {sla.hoursOpen}h</span>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {tk.status === 'completed' && <span className="bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-medium">{t('completed')}</span>}
                        {tk.status === 'in_progress' && <span className="bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-medium">{t('in_progress')}</span>}
                        {tk.status === 'pending' && <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-medium">{t('pending')}</span>}
                      </td>

                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <a
                          href={buildWhatsAppLink(phone, waMessage)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-emerald-600 hover:text-emerald-700 p-2 mx-0.5 transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          title={phone ? `WhatsApp (${phone})` : 'Chamar no WhatsApp'}
                        >
                          <MessageCircle size={16} />
                        </a>
                        <button onClick={() => onViewTicket(tk)} className="text-gray-400 hover:text-blue-600 p-2 mx-0.5 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Detalhes & Orçamento"><Eye size={16} /></button>
                        <button onClick={() => handleStatusChange(tk.id, 'pending')} className="text-gray-400 hover:text-blue-600 p-2 mx-0.5 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30" title={t('pending')}><Clock size={16} /></button>
                        <button onClick={() => handleStatusChange(tk.id, 'in_progress')} className="text-gray-400 hover:text-yellow-600 p-2 mx-0.5 transition-colors rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30" title={t('in_progress')}><PlayCircle size={16} /></button>
                        <button onClick={() => handleStatusChange(tk.id, 'completed')} className="text-gray-400 hover:text-green-600 p-2 mx-0.5 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30" title={t('completed')}><CheckCircle size={16} /></button>
                        <button onClick={() => onDeleteTicket && onDeleteTicket(tk)} className="text-gray-400 hover:text-red-600 p-2 mx-0.5 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30" title="Excluir Chamado"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function FinancasView({ t, onOpenModal }: any) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');

  useEffect(() => {
    const loadFinances = () => {
      const entries = JSON.parse(localStorage.getItem('marchetti_entries') || '[]');
      const invoices = JSON.parse(localStorage.getItem('marchetti_invoices') || '[]');

      const paidInvoicesAsEntries = invoices
        .filter((inv: any) => inv.status === 'paid')
        .map((inv: any) => ({
          id: `INV-PAY-${inv.id}`,
          date: inv.date,
          desc: `Pagamento Fatura ${inv.id} (${inv.desc})`,
          category: inv.clientName,
          currency: inv.currency || 'BRL',
          symbol: inv.symbol || 'R$',
          amount: parseFloat(inv.rawAmount || inv.val || 0),
          type: 'in',
          status: 'paid'
        }));

      setTransactions([...paidInvoicesAsEntries, ...entries]);
    };

    loadFinances();
    window.addEventListener('entriesUpdated', loadFinances);
    window.addEventListener('invoicesUpdated', loadFinances);
    window.addEventListener('storage', loadFinances);

    return () => {
      window.removeEventListener('entriesUpdated', loadFinances);
      window.removeEventListener('invoicesUpdated', loadFinances);
      window.removeEventListener('storage', loadFinances);
    };
  }, []);

  const filteredTx = transactions.filter(tx => {
    const parts = (tx.date || '').split('/');
    const m = parts[1] || '';
    const y = parts[2] || '';
    if (filterMonth && m !== filterMonth) return false;
    if (filterYear && y !== filterYear) return false;
    if (filterCurrency && (tx.currency || 'BRL') !== filterCurrency) return false;
    return true;
  });

  const totalsByCurrency: any = {
    BRL: { income: 0, expense: 0 },
    AUD: { income: 0, expense: 0 },
    USD: { income: 0, expense: 0 }
  };

  filteredTx.forEach(tx => {
    const curr = tx.currency || 'BRL';
    if (!totalsByCurrency[curr]) totalsByCurrency[curr] = { income: 0, expense: 0 };
    if (tx.type === 'in') totalsByCurrency[curr].income += tx.amount;
    else totalsByCurrency[curr].expense += tx.amount;
  });

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('finances')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('desc_finances')}</p>
        </div>
        <button onClick={onOpenModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
          <Plus size={18} /> {t('new_entry')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {['BRL', 'AUD', 'USD'].map(curr => (
          <div key={curr} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-base text-gray-900 dark:text-white">{curr} ({CURRENCY_SYMBOLS[curr]})</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-sky-950/60 text-blue-600 dark:text-sky-400">Caixa {curr}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('income')}:</span>
                <span className="font-bold text-green-600 dark:text-green-400">+ {CURRENCY_SYMBOLS[curr]} {totalsByCurrency[curr].income.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('expense')}:</span>
                <span className="font-bold text-red-600 dark:text-red-400">- {CURRENCY_SYMBOLS[curr]} {totalsByCurrency[curr].expense.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{t('balance')}:</span>
                <span className="font-bold text-blue-600 dark:text-sky-400">
                  {CURRENCY_SYMBOLS[curr]} {(totalsByCurrency[curr].income - totalsByCurrency[curr].expense).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none">
            <option value="">Todos os Meses</option>
            <option value="01">Janeiro</option>
            <option value="02">Fevereiro</option>
            <option value="03">Março</option>
            <option value="04">Abril</option>
            <option value="05">Maio</option>
            <option value="06">Junho</option>
            <option value="07">Julho</option>
            <option value="08">Agosto</option>
            <option value="09">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>

          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none">
            <option value="">Todos os Anos</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>

          <select value={filterCurrency} onChange={(e) => setFilterCurrency(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none">
            <option value="">Todas as Moedas</option>
            <option value="BRL">BRL (R$)</option>
            <option value="AUD">AUD (A$)</option>
            <option value="USD">USD ($)</option>
          </select>

          <button
            onClick={() => {
              setFilterMonth('');
              setFilterYear('');
              setFilterCurrency('');
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-slate-800">
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Origem / Categoria</th>
                <th className="px-6 py-4">Moeda</th>
                <th className="px-6 py-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">Nenhuma movimentação encontrada.</td>
                </tr>
              ) : (
                filteredTx.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{tx.date}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{tx.desc}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{tx.category}</td>
                    <td className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">{tx.currency || 'BRL'}</td>
                    <td className={`px-6 py-4 text-right font-bold ${tx.type === 'in' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {tx.type === 'in' ? '+' : '-'} {tx.symbol || 'R$'} {tx.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
 * VIEW: FATURAS (COM VENCIMENTO, OVERDUE E LEMBRETE DE COBRANÇA)
 * ========================================== */
export function FaturasView({
  t,
  lang,
  onOpenModal,
  onViewInvoice,
  onEditInvoice,
  onMarkPaid,
  onEmailInvoice,
  onSendReminder,
  onCancelInvoice,
  onDeleteInvoice
}: any) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const loadInvoices = async () => {
      const supabase = createClient();
      const { data: records } = await supabase
        .from('customer_records')
        .select('data')
        .eq('kind', 'invoice')
        .order('created_at', { ascending: false });
      const dbInvoices = (records || []).map((record) => record.data);
      localStorage.setItem('marchetti_invoices', JSON.stringify(dbInvoices));
      setInvoices(dbInvoices);
    };
    loadInvoices();
    window.addEventListener('invoicesUpdated', loadInvoices);
    window.addEventListener('storage', loadInvoices);
    return () => {
      window.removeEventListener('invoicesUpdated', loadInvoices);
      window.removeEventListener('storage', loadInvoices);
    };
  }, []);

  const uniqueClients = Array.from(new Set(invoices.map(i => i.clientName).filter(Boolean)));
  const overdueInvoicesCount = invoices.filter(inv => getInvoiceOverdueInfo(inv).isOverdue).length;

  const filteredInvoices = invoices.filter(inv => {
    const parts = (inv.date || '').split('/');
    const m = parts[1] || '';
    const y = parts[2] || '';
    if (filterMonth && m !== filterMonth) return false;
    if (filterYear && y !== filterYear) return false;
    if (filterClient && inv.clientName !== filterClient) return false;

    const overdueInfo = getInvoiceOverdueInfo(inv);
    if (filterStatus === 'overdue') {
      if (!overdueInfo.isOverdue) return false;
    } else if (filterStatus && inv.status !== filterStatus) {
      return false;
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('invoices')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('desc_invoices')}</p>
        </div>
        <button onClick={onOpenModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
          <Plus size={18} /> {t('new_invoice')}
        </button>
      </div>

      {/* Alerta de Faturas Vencidas (Overdue) */}
      {overdueInvoicesCount > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-red-900 dark:text-red-200">
                {lang === 'pt'
                  ? `Atenção Financeira: ${overdueInvoicesCount} fatura(s) vencida(s) em aberto`
                  : `Billing Alert: ${overdueInvoicesCount} overdue invoice(s) pending`}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300/90">
                {lang === 'pt'
                  ? 'Envie um lembrete de cobrança ou dê baixa assim que o pagamento for compensado.'
                  : 'Send a payment reminder or mark as paid once settled.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'overdue' ? '' : 'overdue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              filterStatus === 'overdue'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-slate-900 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 hover:bg-red-100/60'
            }`}
          >
            {filterStatus === 'overdue'
              ? (lang === 'pt' ? 'Mostrar Todas' : 'Show All')
              : (lang === 'pt' ? 'Filtrar Vencidas' : 'Filter Overdue')}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none">
            <option value="">Todos os Meses</option>
            <option value="01">Janeiro</option>
            <option value="02">Fevereiro</option>
            <option value="03">Março</option>
            <option value="04">Abril</option>
            <option value="05">Maio</option>
            <option value="06">Junho</option>
            <option value="07">Julho</option>
            <option value="08">Agosto</option>
            <option value="09">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>

          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none">
            <option value="">Todos os Anos</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>

          <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none">
            <option value="">Todos os Clientes</option>
            {uniqueClients.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none">
            <option value="">Todos os Status</option>
            <option value="paid">{t('paid')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="overdue">{t('overdue')} (Em Atraso)</option>
            <option value="cancelled">{t('cancelled')}</option>
          </select>

          <button
            onClick={() => {
              setFilterMonth('');
              setFilterYear('');
              setFilterClient('');
              setFilterStatus('');
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-slate-800">
                <th className="px-5 py-4">Fatura #</th>
                <th className="px-5 py-4">Cliente</th>
                <th className="px-5 py-4">Serviço</th>
                <th className="px-4 py-4">Vencimento</th>
                <th className="px-5 py-4 text-right">Valor</th>
                <th className="px-4 py-4 text-center">{t('status')}</th>
                <th className="px-5 py-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">Nenhuma fatura encontrada.</td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const overdueInfo = getInvoiceOverdueInfo(inv);
                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${
                        overdueInfo.isOverdue ? 'bg-red-50/35 dark:bg-red-950/15' : ''
                      }`}
                    >
                      <td className="px-5 py-4">
                        <span className="font-bold text-gray-900 dark:text-white block">{inv.id}</span>
                        <span className="text-[11px] text-blue-600 dark:text-sky-400 font-medium">
                          {inv.ticketId || inv.contractId || 'Avulsa'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-gray-800 dark:text-gray-200 font-semibold block">{inv.clientName}</span>
                        {inv.clientEmail && <span className="text-xs text-gray-400">{inv.clientEmail}</span>}
                      </td>

                      <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{inv.desc}</td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold block ${
                            overdueInfo.isOverdue
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {inv.dueDate || '—'}
                        </span>
                        {overdueInfo.isOverdue && (
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                            {lang === 'pt'
                              ? `${overdueInfo.daysOverdue} dia(s) em atraso`
                              : `${overdueInfo.daysOverdue} day(s) overdue`}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <span className="font-bold text-gray-900 dark:text-white block">
                          {inv.symbol || 'R$'} {inv.val}
                        </span>
                        {inv.status === 'paid' && inv.currency && inv.currency !== 'BRL' && inv.paidExchangeRate && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                            R$ {Number(inv.paidAmountBRL || 0).toFixed(2)} (FX {Number(inv.paidExchangeRate).toFixed(4)})
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {overdueInfo.isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60">
                            <AlertTriangle size={11} />
                            {t('overdue')}
                          </span>
                        ) : (
                          <StatusBadge
                            status={inv.status}
                            text={
                              inv.status === 'paid'
                                ? t('paid')
                                : inv.status === 'cancelled'
                                ? t('cancelled')
                                : t('pending')
                            }
                          />
                        )}
                      </td>

                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-0.5">
                          {overdueInfo.isOverdue && (
                            <button
                              type="button"
                              onClick={() => onSendReminder && onSendReminder(inv)}
                              className="px-2.5 py-1.5 mr-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm inline-flex items-center gap-1 transition-colors"
                              title={t('send_reminder')}
                            >
                              <BellRing size={13} />
                              <span className="hidden xl:inline">
                                {lang === 'pt' ? 'Lembrete' : 'Remind'}
                              </span>
                            </button>
                          )}

                          {inv.status === 'pending' && (
                            <button
                              onClick={() => onMarkPaid && onMarkPaid(inv.id)}
                              className="text-gray-400 hover:text-emerald-600 p-2 transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              title={lang === 'pt' ? 'Marcar como Paga (Congelar Câmbio)' : 'Mark as Paid (Lock Rate)'}
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}

                          <button onClick={() => onViewInvoice(inv)} className="text-gray-400 hover:text-blue-600 p-2 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Visualizar / PDF"><Eye size={16} /></button>
                          <button onClick={() => onEditInvoice(inv)} className="text-gray-400 hover:text-amber-600 p-2 transition-colors rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30" title="Editar Fatura"><Edit size={16} /></button>
                          <button onClick={() => onEmailInvoice(inv)} className="text-gray-400 hover:text-green-600 p-2 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30" title="Enviar por E-mail"><Mail size={16} /></button>
                          {inv.status !== 'cancelled' && (
                            <button onClick={() => onCancelInvoice(inv)} className="text-gray-400 hover:text-orange-600 p-2 transition-colors rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30" title={t('cancel_invoice')}><Ban size={16} /></button>
                          )}
                          <button onClick={() => onDeleteInvoice && onDeleteInvoice(inv)} className="text-gray-400 hover:text-red-600 p-2 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30" title="Excluir Fatura"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ClientesView({ t, onOpenModal, onEditClient, onViewClient, onDeleteClient }: any) {
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const loadClients = async () => {
      const supabase = createClient();
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, phone, role, client_data, created_at')
        .eq('role', 'client')
        .order('display_name');
      if (error) {
        setLoadError('Não foi possível carregar os clientes. Verifique a conexão e as permissões da conta.');
        return;
      }

      setLoadError('');
      const dbClients = (profiles || []).map((profile) => ({
        ...(profile.client_data || {}),
        id: profile.id,
        email: profile.email,
        name: profile.display_name || profile.email,
        phone: profile.phone,
        status: profile.client_data?.status || 'active',
        created_at: profile.created_at,
      }));
      localStorage.setItem('marchetti_clients', JSON.stringify(dbClients));
      setClients(dbClients);
    };

    loadClients();
    window.addEventListener('storage', loadClients);
    window.addEventListener('clientAdded', loadClients);
    return () => {
      window.removeEventListener('storage', loadClients);
      window.removeEventListener('clientAdded', loadClients);
    };
  }, []);

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cidade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('clients')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('desc_clients')}</p>
        </div>
        <button onClick={onOpenModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
          <Plus size={18} /> {t('add_client')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loadError && (
          <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {loadError}
          </p>
        )}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex gap-4 bg-gray-50/50 dark:bg-slate-800/50">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, e-mail ou cidade..."
              className="pl-9 pr-4 py-2 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-slate-800">
                <th className="px-6 py-4">Nome / Empresa</th>
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">Cidade / País</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">Nenhum cliente cadastrado.</td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr
                    key={client.id}
                    onClick={() => onViewClient(client)}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-sky-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs uppercase">
                          {client.name.substring(0, 2)}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white hover:text-blue-600">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{client.email}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{client.phone || '—'}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {client.cidade ? `${client.cidade}${client.estado ? ` - ${client.estado}` : ''} (${client.country || 'BR'})` : 'Não informado'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={client.status} text={client.status === 'active' ? 'Ativo' : 'Inativo'} />
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => onViewClient(client)} className="text-gray-400 hover:text-blue-600 p-2 mx-0.5 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Visualizar Ficha"><Eye size={16} /></button>
                      <button onClick={() => onEditClient(client)} className="text-gray-400 hover:text-amber-600 p-2 mx-0.5 transition-colors rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30" title="Editar Cliente"><Edit size={16} /></button>
                      <button onClick={() => onDeleteClient && onDeleteClient(client)} className="text-gray-400 hover:text-red-600 p-2 mx-0.5 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30" title="Excluir Cliente"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ServicosView({ t, onOpenModal, onDeleteService }: any) {
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const loadServices = () => {
      const defaults = [
        { id: 'SRV-DEFAULT-1', name: t('srv_suporte'), desc: 'Manutenção preventiva, limpeza, remoção de malware e diagnóstico.', price: 'R$ 150,00' },
        { id: 'SRV-DEFAULT-2', name: t('srv_hardware'), desc: 'Formatação, instalação de sistemas e upgrade de SSD/RAM.', price: 'R$ 220,00' },
        { id: 'SRV-DEFAULT-3', name: t('srv_redes'), desc: 'Configuração de roteadores, cabeamento e Wi-Fi Mesh.', price: 'R$ 350,00' }
      ];
      const custom = JSON.parse(localStorage.getItem('marchetti_services') || '[]');
      const combined = [...defaults, ...custom];
      const uniqueServices = Array.from(new Map(combined.map(item => [item.id, item])).values());
      setServices(uniqueServices);
    };
    loadServices();
    window.addEventListener('servicesUpdated', loadServices);
    return () => window.removeEventListener('servicesUpdated', loadServices);
  }, []);

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('services')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('desc_services')}</p>
        </div>
        <button onClick={onOpenModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
          <Plus size={18} /> {t('add_service')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-slate-800">
              <th className="px-6 py-4">Serviço</th>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Preço Base</th>
              <th className="px-6 py-4 text-center">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
            {services.map((srv, idx) => (
              <tr key={`${srv.id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{srv.name}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs">{srv.desc}</td>
                <td className="px-6 py-4 font-medium">{srv.price}</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onDeleteService && onDeleteService(srv)}
                    className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Excluir Serviço"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ConfiguracoesView({ t, currentAdmin, onAdminUpdated, onSave }: any) {
  const [settings, setSettings] = useState({
    companyName: 'Marchetti Solutions',
    taxId: '00.000.000/0001-00',
    billingEmail: 'contato@marchettisolutions.com.br',
    supportEmail: 'suporte@marchettisolutions.com.br',
    location: 'Rio de Janeiro, RJ, Brasil',
    pixKey: '00.000.000/0001-00',
    brAgency: '',
    brCheckingAccount: '',
    auBsb: '062-000',
    auAccount: '1234 5678',
    auPayId: '',
  });

  const [adminProfile, setAdminProfile] = useState({
    name: currentAdmin?.name || 'Thalles Marchetti',
    email: currentAdmin?.email || 'admin@marchetti.com',
    newPassword: ''
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('marchetti_settings') || 'null');
      if (saved) setSettings(prev => ({ ...prev, ...saved }));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const previousSettings = JSON.parse(localStorage.getItem('marchetti_settings') || '{}');
    setAdminData('marchetti_settings', settings);
    logAuditEvent('settings.updated', { changedFields: (Object.keys(settings) as Array<keyof typeof settings>).filter(key => previousSettings[key] !== settings[key]) });

    try {
      const supabase = createClient();
      const userChanges: { email?: string; password?: string; data?: { display_name: string } } = {
        data: { display_name: adminProfile.name.trim() },
      };
      if (adminProfile.email.trim().toLowerCase() !== currentAdmin?.email?.toLowerCase()) {
        userChanges.email = adminProfile.email.trim().toLowerCase();
      }
      if (adminProfile.newPassword.trim()) userChanges.password = adminProfile.newPassword.trim();

      const { error: authError } = await supabase.auth.updateUser(userChanges);
      if (authError) {
        onSave(authError.message, 'error');
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: adminProfile.name.trim() })
        .eq('id', currentAdmin?.id || '');
      if (profileError) {
        onSave('Não foi possível atualizar o perfil.', 'error');
        return;
      }

      logAuditEvent('admin.profile_updated', { adminId: currentAdmin?.id });
      if (onAdminUpdated) onAdminUpdated({ ...currentAdmin, name: adminProfile.name.trim() });
      setAdminProfile(prev => ({ ...prev, newPassword: '' }));
    } catch {
      onSave('Não foi possível atualizar o perfil.', 'error');
      return;
    }

    onSave();
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('desc_settings')}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <form id="admin-settings" onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-slate-800 pb-3 mb-5 flex items-center gap-2">
              <Building size={18} className="text-[#2b88c4]" /> Dados da Empresa &amp; Recebimento (Faturas PDF)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ / ABN</label>
                <input
                  type="text"
                  value={settings.taxId}
                  onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail de Faturamento</label>
                <input
                  type="email"
                  value={settings.billingEmail}
                  onChange={(e) => setSettings({ ...settings, billingEmail: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail de Suporte</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  placeholder="suporte@marchettisolutions.com.br"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agência (Brasil)</label>
                  <input
                    type="text"
                    value={settings.brAgency}
                    onChange={(e) => setSettings({ ...settings, brAgency: e.target.value })}
                    placeholder="Número da agência"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conta corrente (Brasil)</label>
                  <input
                    type="text"
                    value={settings.brCheckingAccount}
                    onChange={(e) => setSettings({ ...settings, brCheckingAccount: e.target.value })}
                    placeholder="Número da conta corrente"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chave PIX (Brasil — BRL)</label>
                <input
                  type="text"
                  value={settings.pixKey}
                  onChange={(e) => setSettings({ ...settings, pixKey: e.target.value })}
                  placeholder="CNPJ, E-mail ou Chave Aleatória"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">BSB (Austrália)</label>
                  <input
                    type="text"
                    value={settings.auBsb}
                    onChange={(e) => setSettings({ ...settings, auBsb: e.target.value })}
                    placeholder="062-000"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account (AUD)</label>
                  <input
                    type="text"
                    value={settings.auAccount}
                    onChange={(e) => setSettings({ ...settings, auAccount: e.target.value })}
                    placeholder="1234 5678"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PayID (Austrália)</label>
                <input
                  type="text"
                  value={settings.auPayId}
                  onChange={(e) => setSettings({ ...settings, auPayId: e.target.value })}
                  placeholder="E-mail, telefone ou PayID"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Localização</label>
                <input
                  type="text"
                  value={settings.location}
                  onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-slate-800 pb-3 mb-5 flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#2b88c4]" /> Conta do Administrador
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Administrador</label>
                <input
                  type="text"
                  value={adminProfile.name}
                  onChange={(e) => setAdminProfile({ ...adminProfile, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail de Acesso</label>
                <input
                  type="email"
                  value={adminProfile.email}
                  onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova Senha (opcional)</label>
                <input
                  type="password"
                  value={adminProfile.newPassword}
                  onChange={(e) => setAdminProfile({ ...adminProfile, newPassword: e.target.value })}
                  placeholder="Deixe vazio para manter"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                />
              </div>
            </div>


          </div>

        </form>

        <AdminTeamManagement currentAdmin={currentAdmin} onNotify={onSave} />

        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-800">
          <button form="admin-settings" type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2">
            <Save size={18} /> {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ViewTicketModal({
  ticket,
  lang,
  onClose,
  onUpdateStatus,
  onUpdatePriority,
  onSaveEstimate,
  onDeleteTicket,
  onGenerateInvoice,
  t
}: any) {
  const allClients = JSON.parse(localStorage.getItem('marchetti_clients') || '[]');
  const allInvoices = JSON.parse(localStorage.getItem('marchetti_invoices') || '[]');
  const clientInfo = allClients.find(
    (c: any) =>
      (ticket.clientEmail && c.email?.toLowerCase() === ticket.clientEmail.toLowerCase()) ||
      (ticket.clientName && c.name?.toLowerCase() === ticket.clientName.toLowerCase())
  );
  const linkedInvoice = allInvoices.find((inv: any) => inv.ticketId === ticket.id && inv.status !== 'cancelled');
  const clientPhone = ticket.clientPhone || clientInfo?.phone || '';
  const sla = getTicketSlaInfo(ticket);

  const [estCurrency, setEstCurrency] = useState(ticket.estimate?.currency || 'BRL');
  const [estAmount, setEstAmount] = useState(
    ticket.estimate?.amount !== undefined ? String(ticket.estimate.amount) : ''
  );
  const [estNotes, setEstNotes] = useState(ticket.estimate?.notes || '');

  useEffect(() => {
    setEstCurrency(ticket.estimate?.currency || 'BRL');
    setEstAmount(ticket.estimate?.amount !== undefined ? String(ticket.estimate.amount) : '');
    setEstNotes(ticket.estimate?.notes || '');
  }, [ticket]);

  const handleSendEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(estAmount || '0');
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    const estimatePayload = {
      currency: estCurrency,
      symbol: CURRENCY_SYMBOLS[estCurrency] || 'R$',
      amount: Number(numericAmount.toFixed(2)),
      notes: estNotes.trim(),
      status: 'pending_approval',
      sentAt: new Date().toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    onSaveEstimate(estimatePayload);
  };

  const handleSetEstimateDecision = (decision: 'approved' | 'rejected') => {
    if (!ticket.estimate) return;
    onSaveEstimate({
      ...ticket.estimate,
      status: decision,
      respondedAt: new Date().toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });
  };

  const serviceName = t(ticket.servKey) || ticket.servKey;
  const estimateSnippet = ticket.estimate
    ? lang === 'pt'
      ? ` Enviamos também o orçamento prévio de ${ticket.estimate.symbol || 'R$'} ${Number(ticket.estimate.amount || 0).toFixed(2)} para sua aprovação.`
      : ` We also sent a pre-approval estimate of ${ticket.estimate.symbol || 'R$'} ${Number(ticket.estimate.amount || 0).toFixed(2)}.`
    : '';

  const waMessage =
    lang === 'pt'
      ? `Olá ${ticket.clientName || 'Cliente'}! Aqui é da Marchetti Solutions. Estamos entrando em contato sobre o seu chamado ${ticket.id} (${serviceName}).${estimateSnippet} Como podemos ajudar?`
      : `Hello ${ticket.clientName || 'Client'}! This is Marchetti Solutions reaching out regarding your ticket ${ticket.id} (${serviceName}).${estimateSnippet} How can we assist?`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-transparent dark:border-slate-800 w-full max-w-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-wrap justify-between items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-sky-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center">
              <Headset size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
                Chamado {ticket.id}
                {ticket.status === 'completed' && <span className="bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 px-2.5 py-0.5 rounded-full text-xs font-medium">{t('completed')}</span>}
                {ticket.status === 'in_progress' && <span className="bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-400 px-2.5 py-0.5 rounded-full text-xs font-medium">{t('in_progress')}</span>}
                {ticket.status === 'pending' && <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-xs font-medium">{t('pending')}</span>}
                <PriorityBadge priority={ticket.priority} lang={lang} />
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Aberto em: {ticket.date}
                {sla.level !== 'ok' && (
                  <span className="ml-2 font-bold text-amber-600 dark:text-amber-400">• {sla.label}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={buildWhatsAppLink(clientPhone, waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              title={clientPhone ? `Abrir WhatsApp: ${clientPhone}` : 'Abrir WhatsApp Web'}
            >
              <MessageCircle size={15} />
              {lang === 'pt' ? 'Chamar no WhatsApp' : 'Chat on WhatsApp'}
            </a>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">
                Dados do Cliente &amp; Prioridade (SLA)
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Prioridade:</span>
                <select
                  value={ticket.priority || 'normal'}
                  onChange={(e) => onUpdatePriority && onUpdatePriority(e.target.value)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none"
                >
                  <option value="low">{lang === 'pt' ? 'Baixa' : 'Low'}</option>
                  <option value="normal">Normal</option>
                  <option value="high">{lang === 'pt' ? 'Alta' : 'High'}</option>
                  <option value="urgent">{lang === 'pt' ? 'Urgente' : 'Urgent'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
              <div>
                <p className="text-xs text-gray-400">Nome</p>
                <p className="font-semibold text-gray-900 dark:text-white">{ticket.clientName || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">E-mail</p>
                <p className="font-medium text-gray-900 dark:text-white break-all">{ticket.clientEmail || clientInfo?.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Telefone / WhatsApp</p>
                <p className="font-semibold text-gray-900 dark:text-white">{clientPhone || 'Não cadastrado'}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400 mb-2">Detalhes do Serviço</h4>
            <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl border border-gray-100 dark:border-slate-800 space-y-3">
              <div>
                <p className="text-xs text-gray-400">Categoria / Serviço</p>
                <p className="font-bold text-gray-900 dark:text-white text-base">{serviceName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Descrição / Relato do Cliente</p>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {ticket.desc || 'Nenhuma descrição informada.'}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Orçamento / Aprovação Prévia do Cliente
              </h4>
              {ticket.estimate && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    ticket.estimate.status === 'approved'
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                      : ticket.estimate.status === 'rejected'
                      ? 'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300'
                      : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {ticket.estimate.status === 'approved'
                    ? (lang === 'pt' ? 'Aprovado pelo Cliente' : 'Approved by Client')
                    : ticket.estimate.status === 'rejected'
                    ? (lang === 'pt' ? 'Recusado pelo Cliente' : 'Rejected by Client')
                    : (lang === 'pt' ? 'Aguardando Aprovação no Portal' : 'Awaiting Portal Approval')}
                </span>
              )}
            </div>

            <div className="bg-indigo-50/40 dark:bg-slate-800/70 p-4 rounded-xl border border-indigo-100 dark:border-slate-700 space-y-4">
              {ticket.estimate && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-400">
                      Estimativa enviada em {ticket.estimate.sentAt}
                    </p>
                    <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                      {ticket.estimate.symbol || 'R$'} {Number(ticket.estimate.amount || 0).toFixed(2)}{' '}
                      <span className="text-xs font-normal text-gray-500">({ticket.estimate.currency})</span>
                    </p>
                    {ticket.estimate.notes && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{ticket.estimate.notes}</p>
                    )}
                  </div>

                  {ticket.estimate.status === 'pending_approval' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSetEstimateDecision('approved')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <ThumbsUp size={13} /> Aprovar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetEstimateDecision('rejected')}
                        className="px-3 py-1.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <ThumbsDown size={13} /> Recusar
                      </button>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSendEstimate} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Moeda</label>
                    <select
                      value={estCurrency}
                      onChange={(e) => setEstCurrency(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                    >
                      <option value="BRL">BRL (R$)</option>
                      <option value="AUD">AUD (A$)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Valor Estimado do Serviço
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={estAmount}
                      onChange={(e) => setEstAmount(e.target.value)}
                      placeholder="Ex: 280.00"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-semibold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Escopo / Detalhes para Aprovação do Cliente
                  </label>
                  <input
                    type="text"
                    value={estNotes}
                    onChange={(e) => setEstNotes(e.target.value)}
                    placeholder="Ex: Diagnóstico + troca de SSD NVMe 512GB + backup"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Send size={13} />
                    {ticket.estimate
                      ? (lang === 'pt' ? 'Atualizar e Reenviar Orçamento' : 'Update & Resend Estimate')
                      : (lang === 'pt' ? 'Enviar Orçamento para Aprovação' : 'Send Estimate for Approval')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400 mb-2">Faturamento Vinculado</h4>
            {linkedInvoice ? (
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{linkedInvoice.id} — {linkedInvoice.symbol || 'R$'} {linkedInvoice.val}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Emitida em {linkedInvoice.date}</p>
                </div>
                <StatusBadge status={linkedInvoice.status} text={linkedInvoice.status === 'paid' ? t('paid') : t('pending')} />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">Nenhuma fatura emitida para este chamado ainda.</span>
                <button
                  type="button"
                  onClick={onGenerateInvoice}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
                >
                  Emitir Fatura Agora
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 dark:bg-slate-800/50">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onUpdateStatus('pending')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 flex items-center gap-1">
              <Clock size={14} /> {t('pending')}
            </button>
            <button onClick={() => onUpdateStatus('in_progress')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-yellow-50 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 flex items-center gap-1">
              <PlayCircle size={14} /> {t('in_progress')}
            </button>
            <button onClick={() => onUpdateStatus('completed')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-400 hover:bg-green-100 flex items-center gap-1">
              <CheckCircle size={14} /> {t('completed')}
            </button>
            {onDeleteTicket && (
              <button onClick={onDeleteTicket} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-100 flex items-center gap-1">
                <Trash2 size={14} /> Excluir
              </button>
            )}
          </div>
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
 * MODAL: PDF DE FATURA REAL E PROFISSIONAL
 * - Logotipo Marchetti Solutions + Dados Fiscais
 * - Discriminação de Itens, Moeda, Vencimento e Câmbio
 * - Instruções PIX / BSB + Account (AU) / Cartão
 * - Impressão limpa e Download PDF
 * ========================================== */
export function ViewInvoiceModal({ invoice, exchangeRates, lang, onClose, t, showToast }: any) {
  const settings = (() => {
    try {
      return JSON.parse(localStorage.getItem('marchetti_settings') || '{}');
    } catch {
      return {};
    }
  })();

  const clients = (() => {
    try {
      return JSON.parse(localStorage.getItem('marchetti_clients') || '[]');
    } catch {
      return [];
    }
  })();

  const clientDetails = clients.find(
    (c: any) =>
      (invoice.clientEmail && c.email?.toLowerCase() === invoice.clientEmail.toLowerCase()) ||
      (invoice.clientName && c.name?.toLowerCase() === invoice.clientName.toLowerCase())
  );

  const companyName = settings.companyName || 'Marchetti Solutions';
  const taxId = settings.taxId || '00.000.000/0001-00';
  const billingEmail = settings.billingEmail || 'contato@marchettisolutions.com.br';
  const supportEmail = settings.supportEmail || 'suporte@marchettisolutions.com.br';
  const location = settings.location || 'Rio de Janeiro, RJ, Brasil';
  const pixKey = settings.pixKey || taxId;
  const brAgency = String(settings.brAgency || '').trim();
  const brCheckingAccount = String(settings.brCheckingAccount || '').trim();
  const auBsb = settings.auBsb || '062-000';
  const auAccount = settings.auAccount || '1234 5678';
  const auPayId = String(settings.auPayId || '').trim();

  const curr = (invoice.currency || 'BRL').toUpperCase();
  const symbol = invoice.symbol || CURRENCY_SYMBOLS[curr] || 'R$';
  const amountNum = parseFloat(String(invoice.rawAmount ?? invoice.val ?? 0)) || 0;
  const overdueInfo = getInvoiceOverdueInfo(invoice);

  const effectiveRate =
    curr === 'BRL'
      ? 1
      : invoice.status === 'paid' && invoice.paidExchangeRate
      ? Number(invoice.paidExchangeRate)
      : curr === 'AUD'
      ? Number(exchangeRates?.AUD_BRL || 3.75)
      : Number(exchangeRates?.USD_BRL || 5.75);

  const brlEquivalent =
    invoice.status === 'paid' && invoice.paidAmountBRL
      ? Number(invoice.paidAmountBRL)
      : Number((amountNum * effectiveRate).toFixed(2));

  const statusText =
    invoice.status === 'paid'
      ? 'PAGO / PAID'
      : invoice.status === 'cancelled'
      ? 'CANCELADA / CANCELLED'
      : overdueInfo.isOverdue
      ? `VENCIDA (${overdueInfo.daysOverdue}d)`
      : 'PENDENTE / DUE';

  const statusColors =
    invoice.status === 'paid'
      ? { bg: '#dcfce7', text: '#15803d', border: '#86efac' }
      : invoice.status === 'cancelled'
      ? { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' }
      : overdueInfo.isOverdue
      ? { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' }
      : { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' };

  const clientAddressLine = clientDetails
    ? [
        clientDetails.rua,
        clientDetails.numero,
        clientDetails.bairro,
        clientDetails.cidade ? `${clientDetails.cidade}${clientDetails.estado ? ` - ${clientDetails.estado}` : ''}` : '',
        clientDetails.zip,
        clientDetails.country
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  const buildCleanPrintableHTML = () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Fatura ${invoice.id} - ${companyName}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #1e293b; margin: 0; padding: 28px; background: #ffffff; font-size: 12px; }
        .sheet { max-width: 780px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 32px; }
        .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2b88c4; padding-bottom: 20px; margin-bottom: 22px; }
        .logo-row { display: flex; align-items: center; gap: 12px; }
        .logo-box { width: 42px; height: 42px; background: #2b88c4; color: #ffffff; font-weight: 800; font-size: 22px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .company-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
        .company-meta { font-size: 11px; color: #475569; line-height: 1.5; margin-top: 6px; }
        .inv-box { text-align: right; }
        .inv-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; }
        .inv-id { font-size: 18px; font-weight: 800; color: #2b88c4; margin: 2px 0 6px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 10px; font-weight: 800; background: ${statusColors.bg}; color: ${statusColors.text}; border: 1px solid ${statusColors.border}; }
        .dates { font-size: 11px; color: #475569; margin-top: 8px; line-height: 1.6; }
        .bill-to { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 22px; display: flex; justify-content: space-between; gap: 16px; }
        .section-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #2b88c4; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f1f5f9; color: #334155; font-size: 10px; text-transform: uppercase; padding: 10px 12px; text-align: left; border-bottom: 1px solid #cbd5e1; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
        .right { text-align: right; }
        .center { text-align: center; }
        .totals { display: flex; justify-content: flex-end; margin-bottom: 24px; }
        .totals-card { width: 290px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px 16px; }
        .tot-row { display: flex; justify-content: space-between; font-size: 11px; color: #475569; margin-bottom: 6px; }
        .tot-grand { display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #0f172a; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 6px; }
        .pay-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 8px; }
        .pay-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #f8fafc; }
        .pay-title { font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
        .pay-text { font-size: 10px; color: #475569; line-height: 1.5; }
        .footer { margin-top: 22px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="top">
          <div>
            <div class="logo-row">
              <div class="logo-box">M</div>
              <div>
                <h1 class="company-title">${companyName}</h1>
                <div style="font-size:11px;color:#2b88c4;font-weight:600">IT Solutions, Cloud &amp; Managed Services</div>
              </div>
            </div>
            <div class="company-meta">
              <strong>CNPJ / ABN:</strong> ${taxId}<br/>
              <strong>Endereço:</strong> ${location}<br/>
              <strong>Contato:</strong> ${billingEmail} | ${supportEmail}
            </div>
          </div>
          <div class="inv-box">
            <div class="inv-label">FATURA / INVOICE</div>
            <div class="inv-id">${invoice.id}</div>
            <div class="badge">${statusText}</div>
            <div class="dates">
              <strong>Emissão:</strong> ${invoice.date || '—'}<br/>
              <strong>Vencimento:</strong> ${invoice.dueDate || 'À vista'}<br/>
              ${invoice.ticketId ? `<strong>Chamado:</strong> ${invoice.ticketId}<br/>` : ''}
              ${invoice.contractId ? `<strong>Contrato MRR:</strong> ${invoice.contractId}<br/>` : ''}
            </div>
          </div>
        </div>

        <div class="bill-to">
          <div>
            <div class="section-tag">Faturado Para (Bill To)</div>
            <div style="font-size:14px;font-weight:800;color:#0f172a">${invoice.clientName}</div>
            ${invoice.clientEmail ? `<div style="font-size:11px;color:#475569;margin-top:2px">E-mail: ${invoice.clientEmail}</div>` : ''}
            ${clientDetails?.phone ? `<div style="font-size:11px;color:#475569">Telefone: ${clientDetails.phone}</div>` : ''}
            ${clientDetails?.cpf ? `<div style="font-size:11px;color:#475569">Documento: ${clientDetails.cpf}</div>` : ''}
            ${clientAddressLine ? `<div style="font-size:11px;color:#475569;margin-top:2px">${clientAddressLine}</div>` : ''}
          </div>
          <div style="text-align:right">
            <div class="section-tag">Moeda da Fatura</div>
            <div style="font-size:14px;font-weight:800;color:#0f172a">${curr} (${symbol})</div>
            ${
              curr !== 'BRL'
                ? `<div style="font-size:10px;color:#64748b;margin-top:4px">${
                    invoice.status === 'paid' && invoice.paidExchangeRate
                      ? `Câmbio pago: R$ ${effectiveRate.toFixed(4)}`
                      : `Ref. câmbio: R$ ${effectiveRate.toFixed(4)}`
                  }</div>`
                : ''
            }
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:45px">#</th>
              <th>Discriminação do Serviço / Item</th>
              <th class="center">Moeda</th>
              <th class="center">Qtd.</th>
              <th class="right">Valor Unit.</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>01</td>
              <td><strong>${invoice.desc}</strong></td>
              <td class="center">${curr}</td>
              <td class="center">1</td>
              <td class="right">${symbol} ${amountNum.toFixed(2)}</td>
              <td class="right"><strong>${symbol} ${amountNum.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-card">
            <div class="tot-row"><span>Subtotal:</span><span>${symbol} ${amountNum.toFixed(2)}</span></div>
            <div class="tot-row"><span>Taxas / Descontos:</span><span>${symbol} 0.00</span></div>
            <div class="tot-grand"><span>TOTAL (${curr}):</span><span>${symbol} ${amountNum.toFixed(2)}</span></div>
            ${
              curr !== 'BRL'
                ? `<div class="tot-row" style="margin-top:6px;padding-top:6px;border-top:1px dashed #cbd5e1"><span>Equivalente BRL:</span><strong>R$ ${brlEquivalent.toFixed(2)}</strong></div>`
                : ''
            }
          </div>
        </div>

        <div>
          <div class="section-tag">Instruções de Pagamento (Payment Instructions)</div>
          <div class="pay-grid">
            <div class="pay-card">
              <div class="pay-title">1. PIX (Brasil — BRL)</div>
              <div class="pay-text">
                <strong>Chave PIX:</strong> ${pixKey}<br/>
                ${brAgency ? `<strong>Agência:</strong> ${brAgency}<br/>` : ''}
                ${brCheckingAccount ? `<strong>Conta corrente:</strong> ${brCheckingAccount}<br/>` : ''}
                <strong>Favorecido:</strong> ${companyName}<br/>
                <strong>Identificador:</strong> ${invoice.id}
              </div>
            </div>
            <div class="pay-card">
              <div class="pay-title">2. Transferência Australiana (AUD)</div>
              <div class="pay-text">
                <strong>Account Name:</strong> ${companyName}<br/>
                <strong>BSB:</strong> ${auBsb} | <strong>Acc:</strong> ${auAccount}<br/>
                ${auPayId ? `<strong>PayID:</strong> ${auPayId}<br/>` : ''}
                <strong>Reference:</strong> ${invoice.id}
              </div>
            </div>
            <div class="pay-card">
              <div class="pay-title">3. Cartão / Internacional (USD/AUD)</div>
              <div class="pay-text">
                Pagamento via Stripe (Cartão de Crédito) ou remessa Wise.<br/>
                <strong>Solicitar link:</strong> ${billingEmail}
              </div>
            </div>
          </div>
        </div>

        <div class="footer">
          <span>Obrigado pela preferência! — ${companyName}</span>
          <span>Documento gerado eletronicamente • ${invoice.id}</span>
        </div>
      </div>
    </body>
    </html>
  `;

  const triggerCleanPrint = () => {
    const html = buildCleanPrintableHTML();
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1500);
      }, 250);
    }
  };

  const handleDownloadPDF = async () => {
    showToast(t('toast_pdf_gen'), 'info');
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('admin-invoice-pdf');
      if (!element) throw new Error('Invoice document is unavailable.');
      await html2pdf().set({
        margin: 0.4,
        filename: `${invoice.id}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { format: 'a4', orientation: 'portrait' }
      }).from(element).save();
    } catch {
      triggerCleanPrint();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-transparent dark:border-slate-800 w-full max-w-3xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-[#2b88c4]" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {lang === 'pt' ? `Fatura Profissional — ${invoice.id}` : `Professional Invoice — ${invoice.id}`}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
        </div>

        {/* Documento da Fatura */}
        <div className="p-4 sm:p-6 bg-gray-100/80 dark:bg-slate-950/60 max-h-[75vh] overflow-y-auto">
          <div id="admin-invoice-pdf" className="bg-white text-slate-800 p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
            {/* Cabeçalho com Logotipo e Dados Fiscais */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-[#2b88c4] pb-6 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-11 h-11 rounded-xl bg-[#2b88c4] text-white flex items-center justify-center font-extrabold text-2xl shadow-sm">
                    M
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{companyName}</h2>
                    <p className="text-xs font-semibold text-[#2b88c4]">IT Solutions, Cloud &amp; Managed Services</p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 space-y-0.5 mt-2">
                  <p><strong className="text-slate-700">CNPJ / ABN:</strong> {taxId}</p>
                  <p><strong className="text-slate-700">Endereço:</strong> {location}</p>
                  <p><strong className="text-slate-700">E-mail:</strong> {billingEmail} • {supportEmail}</p>
                </div>
              </div>

              <div className="sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">FATURA / INVOICE</p>
                <p className="text-xl font-extrabold text-[#2b88c4]">{invoice.id}</p>
                <span
                  className="inline-block mt-1 px-3 py-0.5 rounded-full text-[11px] font-extrabold"
                  style={{
                    backgroundColor: statusColors.bg,
                    color: statusColors.text,
                    border: `1px solid ${statusColors.border}`
                  }}
                >
                  {statusText}
                </span>
                <div className="text-xs text-slate-600 mt-2.5 space-y-0.5">
                  <p><strong>Emissão:</strong> {invoice.date}</p>
                  <p><strong>Vencimento:</strong> {invoice.dueDate || 'À vista'}</p>
                  {invoice.ticketId && <p><strong>Chamado:</strong> {invoice.ticketId}</p>}
                  {invoice.contractId && <p><strong>Contrato MRR:</strong> {invoice.contractId}</p>}
                </div>
              </div>
            </div>

            {/* Bloco do Cliente Faturado */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#2b88c4] mb-1">
                  Faturado Para (Bill To)
                </p>
                <p className="font-extrabold text-slate-900 text-base">{invoice.clientName}</p>
                {invoice.clientEmail && <p className="text-xs text-slate-600">{invoice.clientEmail}</p>}
                {clientDetails?.phone && <p className="text-xs text-slate-600">Tel: {clientDetails.phone}</p>}
                {clientDetails?.cpf && <p className="text-xs text-slate-600">Doc: {clientDetails.cpf}</p>}
                {clientAddressLine && <p className="text-xs text-slate-500 mt-1">{clientAddressLine}</p>}
              </div>

              <div className="sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#2b88c4] mb-1">
                  Moeda &amp; Câmbio
                </p>
                <p className="font-extrabold text-slate-900 text-base">{curr} ({symbol})</p>
                {curr !== 'BRL' && (
                  <p className="text-xs text-slate-500 mt-1">
                    {invoice.status === 'paid' && invoice.paidExchangeRate
                      ? `Câmbio congelado: R$ ${effectiveRate.toFixed(4)}`
                      : `Cotação ref.: R$ ${effectiveRate.toFixed(4)}`}
                  </p>
                )}
              </div>
            </div>

            {/* Discriminação dos Itens */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-[11px] uppercase border-b border-slate-300">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Discriminação do Serviço</th>
                    <th className="py-2.5 px-3 text-center">Moeda</th>
                    <th className="py-2.5 px-3 text-center">Qtd.</th>
                    <th className="py-2.5 px-3 text-right">Valor Unit.</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-3.5 px-3 text-slate-500">01</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-900">{invoice.desc}</td>
                    <td className="py-3.5 px-3 text-center text-slate-600">{curr}</td>
                    <td className="py-3.5 px-3 text-center text-slate-600">1</td>
                    <td className="py-3.5 px-3 text-right text-slate-700">{symbol} {amountNum.toFixed(2)}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900">{symbol} {amountNum.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Resumo de Totais */}
            <div className="flex justify-end mb-6">
              <div className="w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{symbol} {amountNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxas / Descontos:</span>
                  <span>{symbol} 0.00</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-300">
                  <span>TOTAL ({curr}):</span>
                  <span>{symbol} {amountNum.toFixed(2)}</span>
                </div>
                {curr !== 'BRL' && (
                  <div className="flex justify-between text-xs font-semibold text-emerald-700 pt-1 border-t border-dashed border-slate-300">
                    <span>Equivalente BRL:</span>
                    <span>R$ {brlEquivalent.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Instruções de Pagamento (PIX / BSB+Account AU / Cartão) */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#2b88c4] mb-2">
                Instruções de Pagamento (Payment Instructions)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-extrabold text-slate-900 mb-1">1. PIX (Brasil — BRL)</p>
                  <p className="text-slate-600 leading-relaxed">
                    <strong>Chave PIX:</strong> {pixKey}<br />
                    {brAgency && <><strong>Agência:</strong> {brAgency}<br /></>}
                    {brCheckingAccount && <><strong>Conta corrente:</strong> {brCheckingAccount}<br /></>}
                    <strong>Favorecido:</strong> {companyName}<br />
                    <strong>Ref.:</strong> {invoice.id}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-extrabold text-slate-900 mb-1">2. Transferência Australiana (AUD)</p>
                  <p className="text-slate-600 leading-relaxed">
                    <strong>Name:</strong> {companyName}<br />
                    <strong>BSB:</strong> {auBsb} | <strong>Acc:</strong> {auAccount}<br />
                    {auPayId && <><strong>PayID:</strong> {auPayId}<br /></>}
                    <strong>Ref.:</strong> {invoice.id}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-extrabold text-slate-900 mb-1">3. Cartão / Internacional</p>
                  <p className="text-slate-600 leading-relaxed">
                    Pagamento via Stripe (Cartão) ou remessa Wise.<br />
                    <strong>Contato:</strong> {billingEmail}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between text-[10px] text-slate-400 gap-1">
              <span>Obrigado pela preferência! — {companyName}</span>
              <span>Documento gerado eletronicamente • {invoice.id}</span>
            </div>
          </div>
        </div>

        {/* Rodapé com Imprimir e Baixar PDF */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-slate-900">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800">
            {t('close')}
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={triggerCleanPrint}
              className="px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Printer size={16} />
              {lang === 'pt' ? 'Imprimir' : 'Print'}
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm flex items-center gap-2 transition-colors"
            >
              <FileDown size={16} /> {t('download_pdf')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
 * MODAL: ENVIO DE FATURA OU LEMBRETE DE COBRANÇA
 * ========================================== */
export function EmailInvoiceModal({ invoice, mode = 'invoice', lang, onClose, t, showToast }: any) {
  const isReminder = mode === 'reminder';
  const overdueInfo = getInvoiceOverdueInfo(invoice);
  const symbol = invoice.symbol || CURRENCY_SYMBOLS[invoice.currency] || 'R$';

  const defaultSubject = isReminder
    ? lang === 'pt'
      ? `Lembrete de Cobrança: Fatura ${invoice.id} Vencida — Marchetti Solutions`
      : `Payment Reminder: Overdue Invoice ${invoice.id} — Marchetti Solutions`
    : lang === 'pt'
    ? `Fatura ${invoice.id} - Marchetti Solutions`
    : `Invoice ${invoice.id} - Marchetti Solutions`;

  const defaultBody = isReminder
    ? lang === 'pt'
      ? `Olá ${invoice.clientName},\n\nIdentificamos que a fatura ${invoice.id} no valor de ${symbol} ${invoice.val} (referente a: ${invoice.desc}), com vencimento em ${invoice.dueDate || '—'}${overdueInfo.isOverdue ? ` (${overdueInfo.daysOverdue} dia(s) em atraso)` : ''}, ainda consta em aberto em nosso sistema.\n\nCaso já tenha efetuado o pagamento, por favor desconsidere este aviso ou nos envie o comprovante.\n\nAtenciosamente,\nFinanceiro — Marchetti Solutions`
      : `Hello ${invoice.clientName},\n\nThis is a friendly reminder that invoice ${invoice.id} for ${symbol} ${invoice.val} (${invoice.desc}), due on ${invoice.dueDate || '—'}, remains unpaid.\n\nIf you have already processed this payment, please disregard this message.\n\nBest regards,\nBilling — Marchetti Solutions`
    : lang === 'pt'
    ? `Olá ${invoice.clientName},\n\nSegue em anexo a fatura ${invoice.id} no valor de ${symbol} ${invoice.val} referente a: ${invoice.desc}${invoice.dueDate ? ` (vencimento em ${invoice.dueDate})` : ''}.\n\nAtenciosamente,\nMarchetti Solutions`
    : `Hello ${invoice.clientName},\n\nPlease find attached invoice ${invoice.id} in the amount of ${symbol} ${invoice.val} for: ${invoice.desc}${invoice.dueDate ? ` (due on ${invoice.dueDate})` : ''}.\n\nBest regards,\nMarchetti Solutions`;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
    showToast(isReminder ? t('toast_reminder_sent') : t('toast_email_sent'), 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-transparent dark:border-slate-800 w-full max-w-lg z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {isReminder ? (
              <BellRing size={18} className="text-amber-500" />
            ) : (
              <Mail size={18} className="text-[#2b88c4]" />
            )}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {isReminder ? t('send_reminder') : 'Enviar Fatura por E-mail'}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSend} className="p-6 space-y-4">
          {isReminder && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
              {lang === 'pt'
                ? `Fatura ${invoice.id} vencida em ${invoice.dueDate} (${overdueInfo.daysOverdue} dia(s) em atraso).`
                : `Invoice ${invoice.id} was due on ${invoice.dueDate} (${overdueInfo.daysOverdue} day(s) overdue).`}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Para:</label>
            <input type="email" defaultValue={invoice.clientEmail || ''} required className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assunto:</label>
            <input type="text" defaultValue={defaultSubject} required className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensagem:</label>
            <textarea
              rows={5}
              defaultValue={defaultBody}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none resize-none"
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg">{t('cancel')}</button>
            <button
              type="submit"
              className={`px-5 py-2 text-sm font-semibold text-white rounded-lg flex items-center gap-2 ${
                isReminder ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Send size={15} /> {isReminder ? (lang === 'pt' ? 'Enviar Lembrete' : 'Send Reminder') : t('send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================
 * COMPONENTES AUXILIARES DE UI
 * ========================================== */

