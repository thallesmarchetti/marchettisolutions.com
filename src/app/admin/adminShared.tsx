/* ==========================================
 * DICIONÁRIO DE TRADUÇÕES
 * ========================================== */
export const translations: Record<string, Record<string, string>> = {
  pt: {
    overview: "Visão Geral",
    management: "Gestão",
    dashboard: "Dashboard",
    desc_dashboard: "Resumo geral de faturamento, recorrência (MRR), despesas e chamados.",
    exchange: "Câmbio",
    desc_exchange: "Cotações em tempo real, conversor, simuladores (Wise/Stripe) e histórico de taxas aplicadas.",
    finances: "Finanças",
    desc_finances: "Controle completo de receitas mensais, despesas operacionais e fluxo de caixa por moeda.",
    contracts: "Contratos (MRR)",
    desc_contracts: "Gerencie assinaturas e contratos recorrentes, acompanhe o MRR e gere faturas mensais em lote.",
    reports: "Relatórios",
    desc_reports: "Exporte relatórios gerenciais, financeiros, de faturas e chamados em CSV (Excel) ou PDF.",
    clients: "Clientes",
    desc_clients: "Gerencie seus clientes cadastrados, visualize endereços completos e edite informações.",
    invoices: "Faturas (Invoices)",
    desc_invoices: "Crie cobranças com vencimento, controle atrasos, envie lembretes e gere faturas profissionais.",
    services: "Catálogo de Serviços",
    desc_services: "Gerencie os serviços que os clientes podem solicitar no portal.",
    tickets: "Chamados",
    desc_tickets: "Acompanhe SLAs, prioridades, envie orçamentos prévios e atualize o status das solicitações.",
    settings: "Configurações",
    desc_settings: "Gerencie os dados da empresa, preferências de faturamento e conta administrativa.",
    finance_section: "Financeiro",
    system: "Sistema",
    logout: "Sair",
    admin: "Administrador",
    rev_monthly: "Faturamento Consolidado (BRL)",
    expenses_period: "Despesas Consolidado (BRL)",
    open_tickets: "Chamados no Período",
    pending_receivable: "A Receber Consolidado (BRL)",
    new_clients: "Base de Clientes",
    mrr: "Receita Recorrente (MRR)",
    closed_tickets: "Chamados Concluídos",
    avg_ticket: "Ticket Médio (BRL)",
    csat: "Satisfação (CSAT)",
    income: "Receitas / Entradas",
    expense: "Despesas / Saídas",
    balance: "Saldo Líquido",
    new_entry: "Novo Lançamento",
    new_contract: "Novo Contrato MRR",
    generate_month_invoices: "Gerar Faturas do Mês",
    new_ticket: "Novo Chamado",
    add_client: "Novo Cliente",
    add_service: "Adicionar Serviço",
    new_invoice: "Nova Fatura",
    status: "Status",
    actions: "Ações",
    paid: "Pago",
    pending: "Pendente",
    overdue: "Vencida",
    cancelled: "Cancelada",
    active: "Ativo",
    paused: "Pausado",
    cancel_invoice: "Cancelar Fatura",
    send_reminder: "Enviar Lembrete de Cobrança",
    in_progress: "Em andamento",
    completed: "Concluído",
    save: "Salvar",
    cancel: "Cancelar",
    close: "Fechar",
    send: "Enviar",
    download_pdf: "Baixar PDF",
    toast_saved: "Operação realizada com sucesso!",
    toast_status_upd: "Status atualizado com sucesso!",
    toast_ticket_del: "Chamado excluído com sucesso.",
    toast_client_del: "Cliente removido com sucesso.",
    toast_serv_del: "Serviço removido com sucesso.",
    toast_inv_del: "Fatura excluída com sucesso.",
    toast_contract_del: "Contrato removido com sucesso.",
    toast_inv_cancelled: "Fatura cancelada com sucesso!",
    toast_email_sent: "Fatura enviada para o e-mail do cliente!",
    toast_reminder_sent: "Lembrete de cobrança enviado ao cliente!",
    toast_pdf_gen: "Gerando PDF da fatura...",
    srv_suporte: "Suporte e Manutenção",
    srv_hardware: "Hardware e Sistemas",
    srv_redes: "Redes e Wi-Fi Mesh",
    srv_remoto: "Suporte Remoto",
    srv_web: "Criação de Websites"
  },
  en: {
    overview: "Overview",
    management: "Management",
    dashboard: "Dashboard",
    desc_dashboard: "General overview of revenue, recurring MRR, expenses, and tickets.",
    exchange: "Exchange",
    desc_exchange: "Real-time exchange rates, currency converter, simulators (Wise/Stripe), and saved rate history.",
    finances: "Finances",
    desc_finances: "Complete control of monthly revenues, operating expenses, and multi-currency cash flow.",
    contracts: "Contracts (MRR)",
    desc_contracts: "Manage recurring subscriptions and contracts, track MRR, and batch-generate monthly invoices.",
    reports: "Reports",
    desc_reports: "Export management, financial, invoice, and ticket reports in CSV (Excel) or PDF.",
    clients: "Clients",
    desc_clients: "Manage registered clients, view full addresses, and edit details.",
    invoices: "Invoices",
    desc_invoices: "Create invoices with due dates, track overdue bills, send reminders, and generate PDFs.",
    services: "Services Catalog",
    desc_services: "Manage services clients can request on the portal.",
    tickets: "Tickets",
    desc_tickets: "Track SLAs, priorities, send pre-approval quotes, and update support request statuses.",
    settings: "Settings",
    desc_settings: "Manage company details, billing preferences, and admin account.",
    finance_section: "Finance",
    system: "System",
    logout: "Logout",
    admin: "Administrator",
    rev_monthly: "Consolidated Revenue (BRL)",
    expenses_period: "Consolidated Expenses (BRL)",
    open_tickets: "Period Tickets",
    pending_receivable: "Consolidated Receivable (BRL)",
    new_clients: "Client Base",
    mrr: "Recurring Revenue (MRR)",
    closed_tickets: "Completed Tickets",
    avg_ticket: "Average Ticket (BRL)",
    csat: "Satisfaction (CSAT)",
    income: "Revenue / Income",
    expense: "Expenses / Outflow",
    balance: "Net Balance",
    new_entry: "New Entry",
    new_contract: "New MRR Contract",
    generate_month_invoices: "Generate Monthly Invoices",
    new_ticket: "New Ticket",
    add_client: "New Client",
    add_service: "Add Service",
    new_invoice: "New Invoice",
    status: "Status",
    actions: "Actions",
    paid: "Paid",
    pending: "Pending",
    overdue: "Overdue",
    cancelled: "Cancelled",
    active: "Active",
    paused: "Paused",
    cancel_invoice: "Cancel Invoice",
    send_reminder: "Send Payment Reminder",
    in_progress: "In Progress",
    completed: "Completed",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    send: "Send",
    download_pdf: "Download PDF",
    toast_saved: "Operation completed successfully!",
    toast_status_upd: "Status updated successfully!",
    toast_ticket_del: "Ticket deleted successfully.",
    toast_client_del: "Client removed successfully.",
    toast_serv_del: "Service removed successfully.",
    toast_inv_del: "Invoice deleted successfully.",
    toast_contract_del: "Contract removed successfully.",
    toast_inv_cancelled: "Invoice cancelled successfully!",
    toast_email_sent: "Invoice sent to client's email!",
    toast_reminder_sent: "Payment reminder sent to client!",
    toast_pdf_gen: "Generating invoice PDF...",
    srv_suporte: "Support & Maintenance",
    srv_hardware: "Hardware & Systems",
    srv_redes: "Networking & Wi-Fi Mesh",
    srv_remoto: "Remote Support",
    srv_web: "Website Creation"
  }
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  BRL: 'R$',
  AUD: 'A$',
  USD: '$'
};

/* ==========================================
 * UTILITÁRIOS DE DATA, VENCIMENTO, CÂMBIO E SLA
 * ========================================== */
export function formatDateInputToBR(isoDate: string): string {
  if (!isoDate) return '';
  if (isoDate.includes('/')) return isoDate;
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
}

export function formatBRToDateInput(brDate: string | undefined, fallbackOffsetDays = 7): string {
  if (brDate) {
    const raw = String(brDate).trim().split(' ')[0];
    if (raw.includes('-') && raw.length >= 10) return raw.slice(0, 10);
    if (raw.includes('/')) {
      const [d, m, y] = raw.split('/');
      if (d && m && y) {
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
  }
  const d = new Date();
  d.setDate(d.getDate() + fallbackOffsetDays);
  return d.toISOString().split('T')[0];
}

export function parseTicketTimestamp(dateStr: any): Date | null {
  if (!dateStr) return null;
  const raw = String(dateStr).trim();
  const [datePart, timePart] = raw.split(/[\s,]+/);
  let hours = 9;
  let minutes = 0;

  if (timePart && timePart.includes(':')) {
    const tParts = timePart.split(':').map(Number);
    if (!isNaN(tParts[0])) hours = tParts[0];
    if (!isNaN(tParts[1])) minutes = tParts[1];
  }

  if (datePart.includes('-')) {
    const [y, m, d] = datePart.split('-').map(Number);
    if (!y || !m || !d) return null;
    const dt = new Date(y, m - 1, d, hours, minutes, 0);
    return isNaN(dt.getTime()) ? null : dt;
  }

  if (datePart.includes('/')) {
    const parts = datePart.split('/').map(Number);
    if (parts.length < 3 || !parts[0] || !parts[1] || !parts[2]) return null;
    let day = parts[0];
    let month = parts[1];
    const year = parts[2];
    if (month > 12 && day <= 12) {
      const tmp = day;
      day = month;
      month = tmp;
    }
    const dt = new Date(year, month - 1, day, hours, minutes, 0);
    return isNaN(dt.getTime()) ? null : dt;
  }

  const fallback = new Date(raw);
  return isNaN(fallback.getTime()) ? null : fallback;
}

// Verifica se uma fatura pendente está vencida (Overdue)
export function getInvoiceOverdueInfo(inv: any): { isOverdue: boolean; daysOverdue: number } {
  if (!inv || inv.status !== 'pending' || !inv.dueDate) {
    return { isOverdue: false, daysOverdue: 0 };
  }
  const dueDt = parseTicketTimestamp(inv.dueDate);
  if (!dueDt) return { isOverdue: false, daysOverdue: 0 };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const dueStart = new Date(dueDt.getFullYear(), dueDt.getMonth(), dueDt.getDate(), 0, 0, 0, 0);

  if (todayStart > dueStart) {
    const daysOverdue = Math.max(1, Math.floor((todayStart.getTime() - dueStart.getTime()) / (1000 * 60 * 60 * 24)));
    return { isOverdue: true, daysOverdue };
  }
  return { isOverdue: false, daysOverdue: 0 };
}

// Retorna o valor consolidado em BRL respeitando a cotação congelada no dia do pagamento
export function getInvoiceBRLAmount(inv: any, liveRates: any): number {
  const raw = parseFloat(String(inv.rawAmount ?? inv.val ?? 0)) || 0;
  const curr = (inv.currency || 'BRL').toUpperCase();

  if (inv.status === 'paid') {
    if (typeof inv.paidAmountBRL === 'number' && !isNaN(inv.paidAmountBRL) && inv.paidAmountBRL > 0) {
      return inv.paidAmountBRL;
    }
    if (typeof inv.paidExchangeRate === 'number' && !isNaN(inv.paidExchangeRate) && inv.paidExchangeRate > 0) {
      return Number((raw * inv.paidExchangeRate).toFixed(2));
    }
  }

  if (curr === 'AUD') return raw * (liveRates.AUD_BRL || 3.75);
  if (curr === 'USD') return raw * (liveRates.USD_BRL || 5.75);
  return raw;
}

export function getTicketSlaInfo(ticket: any) {
  if (!ticket || ticket.status === 'completed') {
    return { level: 'ok', hoursOpen: 0, label: '' };
  }
  const dt = parseTicketTimestamp(ticket.createdAt || ticket.date);
  if (!dt) return { level: 'ok', hoursOpen: 0, label: '' };

  const diffMs = Math.max(0, Date.now() - dt.getTime());
  const hoursOpen = Math.floor(diffMs / (1000 * 60 * 60));

  if (hoursOpen >= 48) {
    return { level: 'critical', hoursOpen, label: `SLA +48h (${hoursOpen}h)` };
  }
  if (hoursOpen >= 24) {
    return { level: 'warning', hoursOpen, label: `SLA +24h (${hoursOpen}h)` };
  }
  return { level: 'ok', hoursOpen, label: hoursOpen > 0 ? `${hoursOpen}h` : 'Hoje' };
}

export function buildWhatsAppLink(phone: string | undefined, message: string) {
  const digits = String(phone || '').replace(/\D/g, '');
  let normalized = digits;
  if (normalized.length === 10 || normalized.length === 11) {
    normalized = `55${normalized}`;
  }
  const encodedText = encodeURIComponent(message);
  return normalized
    ? `https://wa.me/${normalized}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
}


