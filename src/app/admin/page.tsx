"use client";
import React, { useState, useEffect } from 'react';
import { useThemePreference } from '@/lib/useThemePreference';
import { logAuditEvent } from '@/lib/audit';
import { createClient } from '@/lib/supabase/client';
import { deleteCustomerRecord, saveCustomerRecord, updateCustomerRecord } from '@/lib/customerData';
import { loadAdminData, setAdminData } from '@/lib/adminData';
import { canAccessAdminView, getDefaultAdminView, isSuperAdminRole } from '@/lib/adminPermissions';
import { Menu, Moon, Sun, Bell, LogOut, CheckCircle, AlertCircle, X, Headset, Lock, Mail, Key, FileText, PieChart, Users, Wallet, FileSpreadsheet, ListChecks, Settings, Trash2, RefreshCw, Ban, Repeat, MessageCircle } from 'lucide-react';
import { translations, CURRENCY_SYMBOLS, formatDateInputToBR, formatBRToDateInput, getInvoiceOverdueInfo, buildWhatsAppLink } from './adminShared';
import { NavItem, GenericModal } from './adminUi';
import { DashboardView, ContratosView, RelatoriosView, CambioView, ChamadosView, FinancasView, FaturasView, ClientesView, ServicosView, ConfiguracoesView, ViewTicketModal, ViewInvoiceModal, EmailInvoiceModal } from './adminViews';

const CLIENT_DETAIL_FIELDS = new Set([
  'id', 'name', 'email', 'phone', 'cpf', 'status', 'country', 'zip',
  'rua', 'numero', 'bairro', 'cidade', 'estado', 'complemento', 'created_at',
]);

function formatClientDetailLabel(field: string) {
  return field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatClientDetailValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Não informado';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) {
    return value.map((item) => typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)).join(', ');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function App() {
  // Controle de Autenticação do Administrador
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [authStep, setAuthStep] = useState('idle');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [currentView, setCurrentView] = useState('dashboard');
  const { isDarkMode, toggleTheme } = useThemePreference();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lang, setLang] = useState('pt');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Modais e estados de edição/visualização
  const [activeModal, setActiveModal] = useState<any>(null);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [viewingClient, setViewingClient] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [emailModalMode, setEmailModalMode] = useState<'invoice' | 'reminder'>('invoice');
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [contractClientChoice, setContractClientChoice] = useState('');
  const [newTicketClientChoice, setNewTicketClientChoice] = useState('');
  const [viewingTicket, setViewingTicket] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [cancelInvoiceConfirm, setCancelInvoiceConfirm] = useState<any>(null);
  const [selectedTicketForInvoice, setSelectedTicketForInvoice] = useState('');

  // Listas auxiliares para modais
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [invoicesList, setInvoicesList] = useState<any[]>([]);

  // Notificações em tempo real
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Cotações de câmbio (base BRL)
  const [exchangeRates, setExchangeRates] = useState<any>({
    AUD_BRL: 3.75,
    USD_BRL: 5.75,
    updatedAt: null,
    loading: false
  });

  const t = (key: string) => (translations[lang] && translations[lang][key]) || key;

  const showToast = (message: string, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3800);
  };

  const switchLanguage = (newLang: string) => {
    setLang(newLang);
    showToast(newLang === 'pt' ? 'Idioma alterado para Português' : 'Language changed to English', 'info');
  };

  // A sessão administrativa vem exclusivamente do Supabase Auth.
  useEffect(() => {
    const supabase = createClient();
    let alive = true;

    const applySession = async (user: { id: string; email?: string } | null) => {
      if (!user) {
        if (alive) {
          setAdminUser(null);
          setIsAuthenticated(false);
          setIsAuthReady(true);
        }
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, display_name, role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        if (alive) {
          setLoginError('Não foi possível verificar as permissões da conta. Tente atualizar a página.');
          setIsAuthReady(true);
        }
        return;
      }

      if (!profile || !['admin', 'technician'].includes(profile.role)) {
        await supabase.auth.signOut();
        if (alive) {
          setAdminUser(null);
          setIsAuthenticated(false);
          setLoginError('Esta conta não tem acesso ao painel administrativo.');
          setIsAuthReady(true);
        }
        return;
      }

      if (alive) {
        setLoginError('');
        setAdminUser({
          id: profile.id,
          email: profile.email || user.email || '',
          name: profile.display_name || profile.email || user.email || 'Administrador',
          role: profile.role === 'admin' ? 'Super Admin' : 'Técnico',
        });
        setIsAuthenticated(true);
        setIsAuthReady(true);
      }
    };

    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        if (alive) {
          setLoginError('Não foi possível restaurar a sessão. Verifique sua conexão e atualize a página.');
          setIsAuthReady(true);
        }
        return;
      }
      void applySession(data.user);
    }).catch(() => {
      if (alive) {
        setLoginError('Não foi possível restaurar a sessão. Verifique sua conexão e atualize a página.');
        setIsAuthReady(true);
      }
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        queueMicrotask(() => applySession(session?.user ?? null));
      }
    });

    return () => {
      alive = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setAuthStep('processing');
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim().toLowerCase(),
      password: loginPassword,
    });

    if (error || !data.user) {
      logAuditEvent('admin.login_failed', { email: loginEmail.trim().toLowerCase() });
      setAuthStep('idle');
      setLoginError('E-mail ou senha inválidos.');
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, display_name, role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      setAuthStep('idle');
      setLoginError('Não foi possível verificar as permissões da conta. Tente novamente.');
      return;
    }

    if (!profile || !['admin', 'technician'].includes(profile.role)) {
      await supabase.auth.signOut();
      setAuthStep('idle');
      setLoginError('Esta conta não tem acesso ao painel administrativo.');
      return;
    }

    const sessionData = {
      id: profile.id,
      email: profile.email || data.user.email || '',
      name: profile.display_name || profile.email || 'Administrador',
      role: profile.role === 'admin' ? 'Super Admin' : 'Técnico',
    };
    setAdminUser(sessionData);
    setAuthStep('success');
    setLoginPassword('');
    setIsAuthenticated(true);
    logAuditEvent('admin.login', { email: sessionData.email, method: 'supabase_password' });
  };

  const handleAdminLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    logAuditEvent('admin.logout', { email: adminUser?.email });
    setIsAuthenticated(false);
    setAdminUser(null);
    setAuthStep('idle');
    setCurrentView('dashboard');
    showToast(lang === 'pt' ? 'Sessão administrativa encerrada.' : 'Admin session ended.', 'info');
  };

  const isSuperAdmin = isSuperAdminRole(adminUser?.role);
  const navigateTo = (view: string) => {
    const destination = canAccessAdminView(adminUser?.role, view) ? view : getDefaultAdminView(adminUser?.role);
    setCurrentView(destination);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    if (isAuthenticated && !canAccessAdminView(adminUser?.role, currentView)) {
      setCurrentView(getDefaultAdminView(adminUser?.role));
    }
  }, [isAuthenticated, isSuperAdmin, adminUser?.role, currentView]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;
    const syncCustomerData = async () => {
      const supabase = createClient();
      const [{ data: profiles, error: profilesError }, { data: records, error: recordsError }, { data: adminData }] = await Promise.all([
        supabase.from('profiles').select('id, email, display_name, phone, role, client_data').eq('role', 'client'),
        supabase.from('customer_records').select('owner_id, kind, app_id, data').in('kind', ['ticket', 'invoice']),
        loadAdminData(),
      ]);
      if (!alive || profilesError || recordsError) return;

      const clients = (profiles || []).map((profile) => ({
        ...(profile.client_data || {}),
        id: profile.id,
        name: profile.display_name || profile.email,
        email: profile.email,
        phone: profile.phone,
        status: 'active',
      }));
      const tickets = (records || []).filter((record) => record.kind === 'ticket').map((record) => record.data);
      const invoices = (records || []).filter((record) => record.kind === 'invoice').map((record) => record.data);

      localStorage.setItem('marchetti_clients', JSON.stringify(clients));
      localStorage.setItem('marchetti_tickets', JSON.stringify(tickets));
      localStorage.setItem('marchetti_invoices', JSON.stringify(invoices));
      adminData.forEach((row) => localStorage.setItem(row.key, JSON.stringify(row.value)));
      setClientsList(clients);
      setTicketsList(tickets);
      setInvoicesList(invoices);
      window.dispatchEvent(new CustomEvent('clientAdded'));
      window.dispatchEvent(new CustomEvent('ticketsUpdated'));
      window.dispatchEvent(new CustomEvent('invoicesUpdated'));
    };

    void syncCustomerData();
    return () => { alive = false; };
  }, [isAuthenticated]);

  // Sincroniza dados compartilhados do localStorage e notificações
  const syncSharedData = () => {
    try {
      const rawClients = JSON.parse(localStorage.getItem('marchetti_clients') || '[]');
      const cleanedClients = rawClients.filter(
        (c: any) => c.name?.toLowerCase() !== 'john doe' && c.email?.toLowerCase() !== 'john@doe.com'
      );
      if (cleanedClients.length !== rawClients.length) {
        localStorage.setItem('marchetti_clients', JSON.stringify(cleanedClients));
      }
      setClientsList(cleanedClients);

      const rawTickets = JSON.parse(localStorage.getItem('marchetti_tickets') || '[]');
      setTicketsList(rawTickets);

      const rawInvoices = JSON.parse(localStorage.getItem('marchetti_invoices') || '[]');
      setInvoicesList(rawInvoices);

      const rawEntries = JSON.parse(localStorage.getItem('marchetti_entries') || '[]');
      const rawContracts = JSON.parse(localStorage.getItem('marchetti_contracts') || '[]');

      const readIds = JSON.parse(localStorage.getItem('marchetti_admin_read_notifs') || '[]');
      const generated: any[] = [];

      rawTickets.forEach((tk: any) => {
        generated.push({
          id: `notif-tk-${tk.id}`,
          type: 'ticket',
          title: lang === 'pt' ? `Chamado ${tk.id}` : `Ticket ${tk.id}`,
          desc: `${tk.clientName} — ${t(tk.servKey) || tk.servKey}`,
          time: tk.date || '',
          targetView: 'chamados',
          unread: !readIds.includes(`notif-tk-${tk.id}`)
        });

        if (tk.estimate?.status === 'approved') {
          generated.push({
            id: `notif-tk-est-ok-${tk.id}`,
            type: 'ticket',
            title: lang === 'pt' ? `Orçamento Aprovado (${tk.id})` : `Estimate Approved (${tk.id})`,
            desc: `${tk.clientName} — ${tk.estimate.symbol || 'R$'} ${Number(tk.estimate.amount || 0).toFixed(2)}`,
            time: tk.estimate.respondedAt || tk.date || '',
            targetView: 'chamados',
            unread: !readIds.includes(`notif-tk-est-ok-${tk.id}`)
          });
        }
      });

      cleanedClients.forEach((cl: any) => {
        generated.push({
          id: `notif-cl-${cl.id}`,
          type: 'client',
          title: lang === 'pt' ? 'Novo Cliente Cadastrado' : 'New Client Registered',
          desc: `${cl.name} (${cl.email})`,
          time: cl.date || '',
          targetView: 'clientes',
          unread: !readIds.includes(`notif-cl-${cl.id}`)
        });
      });

      rawContracts.forEach((ct: any) => {
        if (ct.status === 'active') {
          generated.push({
            id: `notif-ct-${ct.id}`,
            type: 'contract',
            title: lang === 'pt' ? `Contrato MRR Ativo (${ct.id})` : `Active MRR Contract (${ct.id})`,
            desc: `${ct.clientName} — ${ct.symbol || 'R$'} ${parseFloat(ct.monthlyValue || 0).toFixed(2)}`,
            time: ct.startDate || '',
            targetView: 'contratos',
            unread: !readIds.includes(`notif-ct-${ct.id}`)
          });
        }
      });

      rawInvoices.forEach((inv: any) => {
        const overdueInfo = getInvoiceOverdueInfo(inv);
        if (overdueInfo.isOverdue) {
          generated.push({
            id: `notif-inv-overdue-${inv.id}`,
            type: 'payment',
            title: lang === 'pt' ? `Fatura Vencida (${inv.id})` : `Overdue Invoice (${inv.id})`,
            desc: `${inv.clientName} — ${inv.symbol || 'R$'} ${inv.val} (há ${overdueInfo.daysOverdue}d)`,
            time: inv.dueDate || inv.date || '',
            targetView: 'faturas',
            unread: !readIds.includes(`notif-inv-overdue-${inv.id}`)
          });
        }
        if (inv.status === 'paid') {
          generated.push({
            id: `notif-inv-paid-${inv.id}`,
            type: 'payment',
            title: lang === 'pt' ? `Fatura Paga (${inv.id})` : `Invoice Paid (${inv.id})`,
            desc: `${inv.clientName} — ${inv.symbol || 'R$'} ${inv.val}`,
            time: inv.paidAt || inv.date || '',
            targetView: 'financas',
            unread: !readIds.includes(`notif-inv-paid-${inv.id}`)
          });
        }
      });

      rawEntries.forEach((ent: any) => {
        generated.push({
          id: `notif-ent-${ent.id}`,
          type: 'finance',
          title: ent.type === 'in' ? (lang === 'pt' ? 'Nova Receita Registrada' : 'New Income Recorded') : (lang === 'pt' ? 'Nova Despesa Registrada' : 'New Expense Recorded'),
          desc: `${ent.desc} (${ent.symbol || 'R$'} ${parseFloat(ent.amount || 0).toFixed(2)})`,
          time: ent.date || '',
          targetView: 'financas',
          unread: !readIds.includes(`notif-ent-${ent.id}`)
        });
      });

      setNotifications(generated);
    } catch (error) {
      console.error(error);
    }
  };

  const markAllNotificationsRead = () => {
    const allIds = notifications.map(n => n.id);
    setAdminData('marchetti_admin_read_notifs', allIds);
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (notif: any) => {
    const readIds = JSON.parse(localStorage.getItem('marchetti_admin_read_notifs') || '[]');
    if (!readIds.includes(notif.id)) {
      setAdminData('marchetti_admin_read_notifs', [...readIds, notif.id]);
    }
    setNotifications(prev => prev.map(n => (n.id === notif.id ? { ...n, unread: false } : n)));
    setIsNotifOpen(false);
    if (notif.targetView) navigateTo(notif.targetView);
  };

  const fetchExchangeRates = async () => {
    setExchangeRates((prev: any) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/BRL');
      const data = await res.json();
      if (data && data.rates && data.rates.AUD && data.rates.USD) {
        setExchangeRates({
          AUD_BRL: Number((1 / data.rates.AUD).toFixed(4)),
          USD_BRL: Number((1 / data.rates.USD).toFixed(4)),
          updatedAt: new Date().toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
          loading: false
        });
      } else {
        setExchangeRates((prev: any) => ({ ...prev, loading: false }));
      }
    } catch {
      setExchangeRates((prev: any) => ({
        ...prev,
        updatedAt: new Date().toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
        loading: false
      }));
    }
  };

  useEffect(() => {
    syncSharedData();
    fetchExchangeRates();

    const handleSync = () => syncSharedData();
    window.addEventListener('storage', handleSync);
    window.addEventListener('clientAdded', handleSync);
    window.addEventListener('ticketsUpdated', handleSync);
    window.addEventListener('invoicesUpdated', handleSync);
    window.addEventListener('entriesUpdated', handleSync);
    window.addEventListener('contractsUpdated', handleSync);
    window.addEventListener('exchangeHistoryUpdated', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('clientAdded', handleSync);
      window.removeEventListener('ticketsUpdated', handleSync);
      window.removeEventListener('invoicesUpdated', handleSync);
      window.removeEventListener('entriesUpdated', handleSync);
      window.removeEventListener('contractsUpdated', handleSync);
      window.removeEventListener('exchangeHistoryUpdated', handleSync);
    };
  }, []);

  const closeModal = () => {
    setActiveModal(null);
    setEditingClient(null);
    setViewingClient(null);
    setSelectedInvoice(null);
    setEmailModalMode('invoice');
    setEditingInvoice(null);
    setEditingContract(null);
    setContractClientChoice('');
    setNewTicketClientChoice('');
    setViewingTicket(null);
    setDeleteConfirm(null);
    setCancelInvoiceConfirm(null);
    setSelectedTicketForInvoice('');
  };

  // Helper para congelar a cotação de câmbio no momento em que uma fatura é paga
  const applyFrozenExchangeRateOnPayment = (invoiceObj: any, forceRecalculate = false) => {
    const curr = (invoiceObj.currency || 'BRL').toUpperCase();
    const rawAmount = parseFloat(String(invoiceObj.rawAmount ?? invoiceObj.val ?? 0)) || 0;

    if (!forceRecalculate && typeof invoiceObj.paidExchangeRate === 'number' && invoiceObj.paidExchangeRate > 0) {
      return invoiceObj;
    }

    const rateApplied =
      curr === 'AUD'
        ? Number(exchangeRates.AUD_BRL || 3.75)
        : curr === 'USD'
        ? Number(exchangeRates.USD_BRL || 5.75)
        : 1;

    const paidAmountBRL = Number((rawAmount * rateApplied).toFixed(2));
    const paidAt = new Date().toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Registra no histórico de taxas de câmbio salvas (localStorage)
    try {
      const existingHistory = JSON.parse(localStorage.getItem('marchetti_exchange_history') || '[]');
      const historyRecord = {
        id: `FX-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        invoiceId: invoiceObj.id,
        clientName: invoiceObj.clientName,
        currency: curr,
        symbol: CURRENCY_SYMBOLS[curr] || 'R$',
        originalAmount: rawAmount,
        rateApplied,
        brlConsolidated: paidAmountBRL,
        paidAt
      };
      const filteredHistory = existingHistory.filter((h: any) => h.invoiceId !== invoiceObj.id);
      setAdminData('marchetti_exchange_history', [historyRecord, ...filteredHistory]);
      window.dispatchEvent(new CustomEvent('exchangeHistoryUpdated'));
    } catch (err) {
      console.error(err);
    }

    return {
      ...invoiceObj,
      paidExchangeRate: rateApplied,
      paidAmountBRL,
      paidAt
    };
  };

  // Criar ou Editar Cliente
  const handleSaveClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientData = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      cpf: String(formData.get('cpf') || '').trim(),
      status: String(formData.get('status') || 'active'),
      country: String(formData.get('country') || 'BR'),
      zip: String(formData.get('zip') || '').trim(),
      numero: String(formData.get('numero') || '').trim(),
      rua: String(formData.get('rua') || '').trim(),
      bairro: String(formData.get('bairro') || '').trim(),
      cidade: String(formData.get('cidade') || '').trim(),
      estado: String(formData.get('estado') || '').trim(),
      complemento: String(formData.get('complemento') || '').trim()
    };

    const endpoint = '/api/admin/team';
    const response = await fetch(endpoint, {
      method: editingClient ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(editingClient ? { userId: editingClient.id } : { role: 'client' }),
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        clientData,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      showToast(result.error || 'Não foi possível salvar o cliente.', 'error');
      return;
    }

    const savedClient = {
      ...clientData,
      id: editingClient?.id || result.userId,
      date: editingClient?.date || new Date().toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US'),
    };
    const existingClients = JSON.parse(localStorage.getItem('marchetti_clients') || '[]');
    const updatedClients = editingClient
      ? existingClients.map((client: any) => client.id === editingClient.id ? savedClient : client)
      : [savedClient, ...existingClients];
    localStorage.setItem('marchetti_clients', JSON.stringify(updatedClients));
    setClientsList(updatedClients);
    window.dispatchEvent(new CustomEvent('clientAdded'));
    showToast(t('toast_saved'), 'success');
    closeModal();
  };

  // Criar Novo Chamado
  const handleAddTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedClientId = String(formData.get('clientId') || '').trim();
    const matchedClient = clientsList.find(c => c.id === selectedClientId);

    const clientName = matchedClient
      ? matchedClient.name
      : String(formData.get('customClientName') || '').trim();
    const clientEmail = matchedClient
      ? matchedClient.email
      : String(formData.get('customClientEmail') || '').trim();
    const clientPhone = matchedClient
      ? matchedClient.phone
      : String(formData.get('customClientPhone') || '').trim();

    const servKey = String(formData.get('servKey') || 'srv_suporte');
    const priority = String(formData.get('priority') || 'normal');
    const desc = String(formData.get('desc') || '').trim();

    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US')} ${now.toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const newTicket = {
      id: 'TK-' + Math.floor(1000 + Math.random() * 9000),
      clientId: matchedClient ? matchedClient.id : null,
      clientName: clientName || 'Cliente',
      clientEmail,
      clientPhone,
      servKey,
      priority,
      desc,
      date: dateFormatted,
      createdAt: now.toISOString(),
      status: 'pending',
      estimate: null
    };

    const existingTickets = JSON.parse(localStorage.getItem('marchetti_tickets') || '[]');
    const updatedTickets = [newTicket, ...existingTickets];
    localStorage.setItem('marchetti_tickets', JSON.stringify(updatedTickets));
    const { error: persistError } = await saveCustomerRecord('ticket', newTicket);
    setTicketsList(updatedTickets);
    window.dispatchEvent(new CustomEvent('ticketsUpdated'));
    showToast(persistError ? `Chamado salvo localmente: ${persistError.message}` : t('toast_saved'), persistError ? 'error' : 'success');
    closeModal();
  };

  const handleUpdateTicketPriority = async (ticketId: string, newPriority: string) => {
    const existingTickets = JSON.parse(localStorage.getItem('marchetti_tickets') || '[]');
    const updated = existingTickets.map((tk: any) =>
      tk.id === ticketId ? { ...tk, priority: newPriority } : tk
    );
    localStorage.setItem('marchetti_tickets', JSON.stringify(updated));
    const changed = updated.find((tk: any) => tk.id === ticketId);
    if (changed) await updateCustomerRecord('ticket', changed);
    setTicketsList(updated);
    setViewingTicket((prev: any) => (prev && prev.id === ticketId ? { ...prev, priority: newPriority } : prev));
    window.dispatchEvent(new CustomEvent('ticketsUpdated'));
    showToast(
      lang === 'pt' ? 'Prioridade do chamado atualizada!' : 'Ticket priority updated!',
      'success'
    );
  };

  const handleSaveTicketEstimate = async (ticketId: string, estimateData: any) => {
    const existingTickets = JSON.parse(localStorage.getItem('marchetti_tickets') || '[]');
    const updated = existingTickets.map((tk: any) =>
      tk.id === ticketId ? { ...tk, estimate: estimateData } : tk
    );
    localStorage.setItem('marchetti_tickets', JSON.stringify(updated));
    const changed = updated.find((tk: any) => tk.id === ticketId);
    if (changed) await updateCustomerRecord('ticket', changed);
    setTicketsList(updated);
    setViewingTicket((prev: any) => (prev && prev.id === ticketId ? { ...prev, estimate: estimateData } : prev));
    window.dispatchEvent(new CustomEvent('ticketsUpdated'));

    if (estimateData?.status === 'approved') {
      showToast(lang === 'pt' ? 'Orçamento marcado como aprovado!' : 'Estimate marked as approved!', 'success');
    } else if (estimateData?.status === 'rejected') {
      showToast(lang === 'pt' ? 'Orçamento marcado como recusado.' : 'Estimate marked as rejected.', 'info');
    } else {
      showToast(
        lang === 'pt'
          ? 'Orçamento enviado para aprovação do cliente no portal!'
          : 'Estimate sent to client portal for approval!',
        'success'
      );
    }
  };

  // Criar ou Editar Contrato Recorrente (MRR)
  const handleSaveContract = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedClientId = String(formData.get('clientId') || '').trim();
    const matchedClient = clientsList.find(c => c.id === selectedClientId);

    const clientName = matchedClient
      ? matchedClient.name
      : String(formData.get('customClientName') || '').trim();
    const clientEmail = matchedClient
      ? matchedClient.email
      : String(formData.get('customClientEmail') || '').trim();

    const title = String(formData.get('title') || '').trim();
    const currency = String(formData.get('currency') || 'BRL').toUpperCase();
    const monthlyValue = parseFloat(String(formData.get('monthlyValue') || '0')) || 0;
    const cycle = String(formData.get('cycle') || 'monthly');
    const billingDay = parseInt(String(formData.get('billingDay') || '10'), 10) || 10;
    const startDateRaw = String(formData.get('startDate') || '').trim();
    const status = String(formData.get('status') || 'active');
    const notes = String(formData.get('notes') || '').trim();

    let formattedStartDate = new Date().toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US');
    if (startDateRaw && startDateRaw.includes('-')) {
      const [y, m, d] = startDateRaw.split('-');
      formattedStartDate = `${d}/${m}/${y}`;
    } else if (startDateRaw) {
      formattedStartDate = startDateRaw;
    }

    const existingContracts = JSON.parse(localStorage.getItem('marchetti_contracts') || '[]');
    let updatedContracts;

    if (editingContract) {
      updatedContracts = existingContracts.map((ct: any) =>
        ct.id === editingContract.id
          ? {
              ...ct,
              clientId: matchedClient ? matchedClient.id : ct.clientId || null,
              clientName: clientName || ct.clientName,
              clientEmail: clientEmail || ct.clientEmail,
              title,
              currency,
              symbol: CURRENCY_SYMBOLS[currency] || 'R$',
              monthlyValue,
              cycle,
              billingDay,
              startDate: formattedStartDate,
              status,
              notes
            }
          : ct
      );
    } else {
      const newContract = {
        id: 'CTR-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 900 + 100),
        clientId: matchedClient ? matchedClient.id : null,
        clientName: clientName || 'Cliente Recorrente',
        clientEmail,
        title,
        currency,
        symbol: CURRENCY_SYMBOLS[currency] || 'R$',
        monthlyValue,
        cycle,
        billingDay,
        startDate: formattedStartDate,
        status,
        notes,
        lastBilledPeriod: null
      };
      updatedContracts = [newContract, ...existingContracts];
    }

    setAdminData('marchetti_contracts', updatedContracts);
    window.dispatchEvent(new CustomEvent('contractsUpdated'));
    showToast(t('toast_saved'), 'success');
    closeModal();
  };

  const handleToggleContractStatus = (contractId: string, newStatus: string) => {
    const existingContracts = JSON.parse(localStorage.getItem('marchetti_contracts') || '[]');
    const updatedContracts = existingContracts.map((ct: any) =>
      ct.id === contractId ? { ...ct, status: newStatus } : ct
    );
    setAdminData('marchetti_contracts', updatedContracts);
    window.dispatchEvent(new CustomEvent('contractsUpdated'));
    showToast(t('toast_status_upd'), 'success');
  };

  // Constrói o objeto de fatura para um contrato no mês vigente
  const buildMonthlyInvoiceForContract = (contract: any, now: Date, periodTag: string) => {
    const yearNum = now.getFullYear();
    const monthNum = now.getMonth() + 1;
    const monthStr = String(monthNum).padStart(2, '0');
    const yearStr = String(yearNum);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const safeDay = String(Math.min(Math.max(1, Number(contract.billingDay || 10)), daysInMonth)).padStart(2, '0');
    const dueDateStr = `${safeDay}/${monthStr}/${yearStr}`;

    const currency = (contract.currency || 'BRL').toUpperCase();
    const rawAmount = parseFloat(contract.monthlyValue || 0) || 0;
    const cycleAmount = contract.cycle === 'yearly' ? rawAmount / 12 : rawAmount;

    return {
      id: 'INV-' + yearStr + '-' + Math.floor(100 + Math.random() * 899),
      ticketId: null,
      contractId: contract.id,
      billingPeriod: periodTag,
      clientName: contract.clientName,
      clientEmail: contract.clientEmail || '',
      desc: `${contract.title} (MRR ${periodTag})`,
      currency,
      symbol: CURRENCY_SYMBOLS[currency] || 'R$',
      val: cycleAmount.toFixed(2),
      rawAmount: Number(cycleAmount.toFixed(2)),
      date: now.toLocaleDateString('pt-BR'),
      dueDate: dueDateStr,
      status: 'pending'
    };
  };

  // Gera Fatura Mensal individual vinculada ao Contrato MRR
  const handleGenerateInvoiceFromContract = async (contract: any) => {
    const now = new Date();
    const periodTag = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const existingInvoices = JSON.parse(localStorage.getItem('marchetti_invoices') || '[]');
    const alreadyBilled = existingInvoices.find(
      (inv: any) => inv.contractId === contract.id && inv.billingPeriod === periodTag && inv.status !== 'cancelled'
    );

    if (alreadyBilled) {
      showToast(
        lang === 'pt'
          ? `A fatura ${alreadyBilled.id} já foi emitida para o período ${periodTag}.`
          : `Invoice ${alreadyBilled.id} was already issued for ${periodTag}.`,
        'info'
      );
      return;
    }

    const newInvoice = buildMonthlyInvoiceForContract(contract, now, periodTag);
    const { error: persistError } = await saveCustomerRecord('invoice', newInvoice);
    if (persistError) {
      showToast(`Fatura não sincronizada: ${persistError.message}`, 'error');
      return;
    }
    const updatedInvoices = [newInvoice, ...existingInvoices];
    localStorage.setItem('marchetti_invoices', JSON.stringify(updatedInvoices));
    setInvoicesList(updatedInvoices);

    const existingContracts = JSON.parse(localStorage.getItem('marchetti_contracts') || '[]');
    const updatedContracts = existingContracts.map((ct: any) =>
      ct.id === contract.id ? { ...ct, lastBilledPeriod: periodTag } : ct
    );
    setAdminData('marchetti_contracts', updatedContracts);

    window.dispatchEvent(new CustomEvent('invoicesUpdated'));
    window.dispatchEvent(new CustomEvent('contractsUpdated'));
    showToast(
      lang === 'pt'
        ? `Fatura ${newInvoice.id} (${newInvoice.symbol} ${newInvoice.val}) gerada com vencimento em ${newInvoice.dueDate}!`
        : `Invoice ${newInvoice.id} (${newInvoice.symbol} ${newInvoice.val}) generated due ${newInvoice.dueDate}!`,
      'success'
    );
  };

  // Geração Automática em Lote de Faturas do Mês para todos os contratos ativos (com trava anti-duplicidade)
  const handleGenerateAllMonthlyInvoices = async () => {
    const now = new Date();
    const periodTag = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const existingContracts = JSON.parse(localStorage.getItem('marchetti_contracts') || '[]');
    const activeContracts = existingContracts.filter((ct: any) => ct.status === 'active');

    if (activeContracts.length === 0) {
      showToast(
        lang === 'pt'
          ? 'Nenhum contrato ativo encontrado para gerar faturas.'
          : 'No active contracts found to generate invoices.',
        'info'
      );
      return;
    }

    const existingInvoices = JSON.parse(localStorage.getItem('marchetti_invoices') || '[]');
    const newlyGeneratedInvoices: any[] = [];
    let skippedCount = 0;

    activeContracts.forEach((ct: any) => {
      const alreadyBilled = existingInvoices.find(
        (inv: any) => inv.contractId === ct.id && inv.billingPeriod === periodTag && inv.status !== 'cancelled'
      );
      if (alreadyBilled) {
        skippedCount += 1;
        return;
      }

      const inv = buildMonthlyInvoiceForContract(ct, now, periodTag);
      // Garante ID único dentro do mesmo lote
      inv.id = `INV-${now.getFullYear()}-${Math.floor(100 + Math.random() * 800)}-${newlyGeneratedInvoices.length + 1}`;
      newlyGeneratedInvoices.push(inv);
    });

    if (newlyGeneratedInvoices.length === 0) {
      showToast(
        lang === 'pt'
          ? `Todos os ${activeContracts.length} contrato(s) ativo(s) já possuem fatura emitida para ${periodTag}.`
          : `All ${activeContracts.length} active contract(s) already have invoices issued for ${periodTag}.`,
        'info'
      );
      return;
    }

    const saveResults = await Promise.all(newlyGeneratedInvoices.map((invoice) => saveCustomerRecord('invoice', invoice)));
    const persistedInvoices = newlyGeneratedInvoices.filter((_, index) => !saveResults[index].error);
    if (persistedInvoices.length === 0) {
      showToast('Nenhuma fatura foi salva. Confirme se os clientes possuem contas ativas.', 'error');
      return;
    }
    const persistedContractIds = new Set(persistedInvoices.map((invoice) => invoice.contractId));
    const updatedInvoices = [...persistedInvoices, ...existingInvoices];
    localStorage.setItem('marchetti_invoices', JSON.stringify(updatedInvoices));
    setInvoicesList(updatedInvoices);

    const updatedContracts = existingContracts.map((ct: any) =>
      persistedContractIds.has(ct.id) ? { ...ct, lastBilledPeriod: periodTag } : ct
    );
    setAdminData('marchetti_contracts', updatedContracts);

    window.dispatchEvent(new CustomEvent('invoicesUpdated'));
    window.dispatchEvent(new CustomEvent('contractsUpdated'));

    const msgPT =
      skippedCount > 0
        ? `${persistedInvoices.length} fatura(s) gerada(s) para ${periodTag}! (${skippedCount} já emitida(s) anteriormente)`
        : `${persistedInvoices.length} fatura(s) mensal(is) gerada(s) com sucesso para ${periodTag}!`;

    const msgEN =
      skippedCount > 0
        ? `${persistedInvoices.length} invoice(s) generated for ${periodTag}! (${skippedCount} already issued)`
        : `${persistedInvoices.length} monthly invoice(s) generated for ${periodTag}!`;

    showToast(
      `${lang === 'pt' ? msgPT : msgEN}${persistedInvoices.length < newlyGeneratedInvoices.length ? ' Alguns clientes não têm conta ativa e foram ignorados.' : ''}`,
      persistedInvoices.length < newlyGeneratedInvoices.length ? 'info' : 'success'
    );
  };

  // Marcar fatura como paga rapidamente (congelando taxa de câmbio do dia)
  const handleMarkInvoicePaid = async (invoiceId: string) => {
    const existingInvoices = JSON.parse(localStorage.getItem('marchetti_invoices') || '[]');
    let paidInvoiceInfo: any = null;

    const updatedInvoices = existingInvoices.map((inv: any) => {
      if (inv.id !== invoiceId) return inv;
      const withFrozenRate = applyFrozenExchangeRateOnPayment(
        { ...inv, status: 'paid' },
        true
      );
      paidInvoiceInfo = withFrozenRate;
      return withFrozenRate;
    });

    localStorage.setItem('marchetti_invoices', JSON.stringify(updatedInvoices));
    if (paidInvoiceInfo) await updateCustomerRecord('invoice', paidInvoiceInfo);
    setInvoicesList(updatedInvoices);
    window.dispatchEvent(new CustomEvent('invoicesUpdated'));

    if (paidInvoiceInfo && paidInvoiceInfo.currency !== 'BRL') {
      showToast(
        lang === 'pt'
          ? `Fatura ${paidInvoiceInfo.id} paga! Câmbio congelado em R$ ${paidInvoiceInfo.paidExchangeRate.toFixed(4)} (R$ ${paidInvoiceInfo.paidAmountBRL.toFixed(2)}).`
          : `Invoice ${paidInvoiceInfo.id} paid! Rate locked at R$ ${paidInvoiceInfo.paidExchangeRate.toFixed(4)} (R$ ${paidInvoiceInfo.paidAmountBRL.toFixed(2)}).`,
        'success'
      );
    } else {
      showToast(t('toast_status_upd'), 'success');
    }
  };

  // Cancelar fatura após confirmação (status = 'cancelled')
  const handleConfirmCancelInvoice = async () => {
    if (!cancelInvoiceConfirm) return;
    const invoiceId = cancelInvoiceConfirm.id;
    logAuditEvent('invoice.cancelled', { invoiceId, label: cancelInvoiceConfirm.label });
    const existingInvoices = JSON.parse(localStorage.getItem('marchetti_invoices') || '[]');
    const updatedInvoices = existingInvoices.map((inv: any) =>
      inv.id === invoiceId ? { ...inv, status: 'cancelled' } : inv
    );
    localStorage.setItem('marchetti_invoices', JSON.stringify(updatedInvoices));
    const cancelledInvoice = updatedInvoices.find((invoice: any) => invoice.id === invoiceId);
    if (cancelledInvoice) await updateCustomerRecord('invoice', cancelledInvoice);
    setInvoicesList(updatedInvoices);
    window.dispatchEvent(new CustomEvent('invoicesUpdated'));
    showToast(t('toast_inv_cancelled'), 'info');
    closeModal();
  };

  // Confirmação unificada de exclusão
  const handleExecuteDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    logAuditEvent(`${type}.deleted`, { id, label: deleteConfirm.label });

    if (type === 'ticket') {
      const existingTickets = JSON.parse(localStorage.getItem('marchetti_tickets') || '[]');
      const updated = existingTickets.filter((tk: any) => tk.id !== id);
      localStorage.setItem('marchetti_tickets', JSON.stringify(updated));
      await deleteCustomerRecord('ticket', String(id));
      setTicketsList(updated);
      window.dispatchEvent(new CustomEvent('ticketsUpdated'));
      showToast(t('toast_ticket_del'), 'success');
    } else if (type === 'client') {
      const response = await fetch('/api/admin/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id }),
      });
      const result = await response.json();
      if (!response.ok) {
        showToast(result.error || 'Não foi possível remover o cliente.', 'error');
        return;
      }
      const updated = clientsList.filter((client: any) => client.id !== id);
      localStorage.setItem('marchetti_clients', JSON.stringify(updated));
      setClientsList(updated);
      window.dispatchEvent(new CustomEvent('clientAdded'));
      showToast(t('toast_client_del'), 'success');
    } else if (type === 'invoice') {
      const existingInvoices = JSON.parse(localStorage.getItem('marchetti_invoices') || '[]');
      const updated = existingInvoices.filter((inv: any) => inv.id !== id);
      localStorage.setItem('marchetti_invoices', JSON.stringify(updated));
      await deleteCustomerRecord('invoice', String(id));
      setInvoicesList(updated);
      window.dispatchEvent(new CustomEvent('invoicesUpdated'));
      showToast(t('toast_inv_del'), 'success');
    } else if (type === 'service') {
      const existingServices = JSON.parse(localStorage.getItem('marchetti_services') || '[]');
      const updated = existingServices.filter((s: any) => s.id !== id);
      setAdminData('marchetti_services', updated);
      window.dispatchEvent(new CustomEvent('servicesUpdated'));
      showToast(t('toast_serv_del'), 'success');
    } else if (type === 'contract') {
      const existingContracts = JSON.parse(localStorage.getItem('marchetti_contracts') || '[]');
      const updated = existingContracts.filter((ct: any) => ct.id !== id);
      setAdminData('marchetti_contracts', updated);
      window.dispatchEvent(new CustomEvent('contractsUpdated'));
      showToast(t('toast_contract_del'), 'success');
    }

    closeModal();
  };

  // Criar nova fatura vinculada ao ticket (com Data de Vencimento)
  const handleAddInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ticketId = String(formData.get('ticketId') || '');
    const currency = String(formData.get('currency') || 'BRL').toUpperCase();
    const rawAmount = parseFloat(String(formData.get('amount') || '0'));
    const dueDateRaw = String(formData.get('dueDate') || '').trim();
    const dueDateFormatted = formatDateInputToBR(dueDateRaw);

    const existingInvoices = JSON.parse(localStorage.getItem('marchetti_invoices') || '[]');

    if (ticketId) {
      const duplicate = existingInvoices.find((inv: any) => inv.ticketId === ticketId && inv.status !== 'cancelled');
      if (duplicate) {
        showToast(
          lang === 'pt'
            ? `Bloqueado: o chamado ${ticketId} já possui a fatura ${duplicate.id}.`
            : `Blocked: ticket ${ticketId} already has invoice ${duplicate.id}.`,
          'error'
        );
        return;
      }
    }

    const ticket = ticketsList.find(tk => tk.id === ticketId);
    const clientName = ticket ? ticket.clientName : String(formData.get('clientName') || 'Cliente');
    const clientEmail = ticket ? ticket.clientEmail : '';
    const serviceDesc = ticket ? (t(ticket.servKey) || ticket.servKey) : String(formData.get('service') || 'Serviço de TI');

    const newInvoice = {
      id: 'INV-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 900 + 100),
      ticketId: ticketId || null,
      clientName,
      clientEmail,
      desc: serviceDesc,
      currency,
      symbol: CURRENCY_SYMBOLS[currency] || 'R$',
      val: rawAmount.toFixed(2),
      rawAmount,
      date: new Date().toLocaleDateString('pt-BR'),
      dueDate: dueDateFormatted || formatDateInputToBR(formatBRToDateInput(undefined, 7)),
      status: 'pending'
    };

    const updatedInvoices = [newInvoice, ...existingInvoices];
    localStorage.setItem('marchetti_invoices', JSON.stringify(updatedInvoices));
    const { error: persistError } = await saveCustomerRecord('invoice', newInvoice);
    setInvoicesList(updatedInvoices);
    window.dispatchEvent(new CustomEvent('invoicesUpdated'));
    showToast(persistError ? `Fatura não sincronizada: ${persistError.message}` : t('toast_saved'), persistError ? 'error' : 'success');
    closeModal();
  };

  // Atualizar fatura existente (com Data de Vencimento e congelamento de câmbio ao marcar como paga)
  const handleUpdateInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingInvoice) return;
    const formData = new FormData(e.currentTarget);
    const desc = String(formData.get('desc') || editingInvoice.desc).trim();
    const currency = String(formData.get('currency') || editingInvoice.currency || 'BRL').toUpperCase();
    const rawAmount = parseFloat(String(formData.get('amount') || editingInvoice.rawAmount || '0'));
    const status = String(formData.get('status') || editingInvoice.status);
    const dueDateRaw = String(formData.get('dueDate') || '').trim();
    const dueDateFormatted = dueDateRaw ? formatDateInputToBR(dueDateRaw) : editingInvoice.dueDate;

    const existingInvoices = JSON.parse(localStorage.getItem('marchetti_invoices') || '[]');
    const updatedInvoices = existingInvoices.map((inv: any) => {
      if (inv.id !== editingInvoice.id) return inv;

      let nextInv: any = {
        ...inv,
        desc,
        currency,
        symbol: CURRENCY_SYMBOLS[currency] || 'R$',
        rawAmount,
        val: rawAmount.toFixed(2),
        dueDate: dueDateFormatted,
        status
      };

      if (status === 'paid') {
        const shouldRecalc =
          inv.status !== 'paid' ||
          inv.currency !== currency ||
          Number(inv.rawAmount || inv.val || 0) !== rawAmount;
        nextInv = applyFrozenExchangeRateOnPayment(nextInv, shouldRecalc);
      } else {
        delete nextInv.paidExchangeRate;
        delete nextInv.paidAmountBRL;
        delete nextInv.paidAt;
      }

      return nextInv;
    });

    localStorage.setItem('marchetti_invoices', JSON.stringify(updatedInvoices));
    const changedInvoice = updatedInvoices.find((inv: any) => inv.id === editingInvoice.id);
    if (changedInvoice) await updateCustomerRecord('invoice', changedInvoice);
    setInvoicesList(updatedInvoices);
    window.dispatchEvent(new CustomEvent('invoicesUpdated'));
    showToast(t('toast_saved'), 'success');
    closeModal();
  };

  // Adicionar lançamento financeiro manual
  const handleAddEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const desc = String(formData.get('desc') || '');
    const category = String(formData.get('category') || '');
    const currency = String(formData.get('currency') || 'BRL');
    const amount = parseFloat(String(formData.get('amount') || '0'));
    const type = String(formData.get('type') || 'in');

    const newEntry = {
      id: 'ENT-' + Date.now(),
      date: new Date().toLocaleDateString('pt-BR'),
      desc,
      category,
      currency,
      symbol: CURRENCY_SYMBOLS[currency] || 'R$',
      amount,
      type,
      status: 'paid'
    };

    const existingEntries = JSON.parse(localStorage.getItem('marchetti_entries') || '[]');
    setAdminData('marchetti_entries', [newEntry, ...existingEntries]);
    window.dispatchEvent(new CustomEvent('entriesUpdated'));
    showToast(t('toast_saved'), 'success');
    closeModal();
  };

  // Adicionar serviço ao catálogo
  const handleAddService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newService = {
      id: `SRV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: String(formData.get('name') || ''),
      desc: String(formData.get('desc') || ''),
      price: String(formData.get('price') || '')
    };
    const existingServices = JSON.parse(localStorage.getItem('marchetti_services') || '[]');
    setAdminData('marchetti_services', [...existingServices, newService]);
    window.dispatchEvent(new CustomEvent('servicesUpdated'));
    showToast(t('toast_saved'), 'success');
    closeModal();
  };

  // Abre modal de Nova Fatura já vinculado ao ticket concluído
  const handleOpenInvoiceFromTicket = (ticketId = '') => {
    if (ticketId) {
      const existingInvoices = JSON.parse(localStorage.getItem('marchetti_invoices') || '[]');
      const alreadyInvoiced = existingInvoices.find((inv: any) => inv.ticketId === ticketId && inv.status !== 'cancelled');
      if (alreadyInvoiced) {
        showToast(
          lang === 'pt'
            ? `Chamado concluído! Fatura ${alreadyInvoiced.id} já emitida para este ticket.`
            : `Ticket completed! Invoice ${alreadyInvoiced.id} already issued for this ticket.`,
          'info'
        );
        return;
      }
    }
    setSelectedTicketForInvoice(ticketId);
    setActiveModal('invoice');
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    const existingTickets = JSON.parse(localStorage.getItem('marchetti_tickets') || '[]');
    const updated = existingTickets.map((tk: any) => (tk.id === ticketId ? { ...tk, status: newStatus } : tk));
    localStorage.setItem('marchetti_tickets', JSON.stringify(updated));
    const changed = updated.find((ticket: any) => ticket.id === ticketId);
    if (changed) await updateCustomerRecord('ticket', changed);
    setTicketsList(updated);
    setViewingTicket((prev: any) => (prev && prev.id === ticketId ? { ...prev, status: newStatus } : prev));
    window.dispatchEvent(new CustomEvent('ticketsUpdated'));
    showToast(t('toast_status_upd'), 'success');

    if (newStatus === 'completed') {
      closeModal();
      handleOpenInvoiceFromTicket(ticketId);
    }
  };

  const prefillTicketObj = ticketsList.find(tk => tk.id === selectedTicketForInvoice);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-white/15 border-t-sky-400 rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400">
          {lang === 'pt' ? 'Restaurando sessão administrativa...' : 'Restoring admin session...'}
        </p>
      </div>
    );
  }

  // TELA DE LOGIN DO ADMINISTRADOR
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen font-sans bg-[#07090e] flex flex-col justify-center p-6 sm:p-10 transition-colors duration-200 ${isDarkMode ? 'dark' : ''}`}>
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex justify-between items-center mb-6">
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="text-xs sm:text-sm text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"
            >
              <LogOut className="rotate-180" size={16} />
              {lang === 'pt' ? 'Voltar ao Site' : 'Back to Website'}
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => switchLanguage('pt')}
                className={`hover:scale-110 transition-transform ${lang !== 'pt' && 'opacity-60 hover:opacity-100'}`}
                title="Português"
              >
                <img src="https://flagcdn.com/w20/br.png" alt="Brasil" className="rounded shadow-sm w-6 h-4 object-cover" />
              </button>
              <button
                type="button"
                onClick={() => switchLanguage('en')}
                className={`hover:scale-110 transition-transform ${lang !== 'en' && 'opacity-60 hover:opacity-100'}`}
                title="English"
              >
                <img src="https://flagcdn.com/w20/au.png" alt="Australia" className="rounded shadow-sm w-6 h-4 object-cover" />
              </button>
            </div>
          </div>

          <div className="max-w-md mx-auto w-full rounded-3xl bg-gradient-to-b from-white/[0.12] to-white/[0.03] p-[1px] shadow-[0_25px_80px_-15px_rgba(37,99,235,0.3)]">
            <div className="w-full p-8 sm:p-10 bg-[#090b10] rounded-[23px] flex flex-col justify-center relative min-h-[430px]">
              {authStep === 'idle' && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-blue-600/20 border border-sky-500/30 rounded-lg flex items-center justify-center text-sky-400 font-bold text-sm">M</div>
                    <span className="font-bold text-white text-base">Marchetti Solutions</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {lang === 'pt' ? 'Login do Administrador' : 'Administrator Login'}
                  </h3>
                  <p className="text-sm text-zinc-400 mb-6">
                    {lang === 'pt' ? 'Insira suas credenciais administrativas para continuar.' : 'Enter your administrative credentials to continue.'}
                  </p>

                  {loginError && (
                    <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleAdminLogin} className="space-y-5">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        {lang === 'pt' ? 'E-mail do Administrador' : 'Administrator E-mail'}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                        <input
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          autoComplete="username"
                          placeholder="admin@empresa.com"
                          className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        {lang === 'pt' ? 'Senha' : 'Password'}
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                        <input
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="text-right -mt-2">
                      <a href="/forgot-password?next=/admin" className="text-xs text-[#2b88c4] hover:underline">
                        {lang === 'pt' ? 'Esqueceu a senha?' : 'Forgot password?'}
                      </a>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-white text-zinc-950 hover:bg-sky-50 font-semibold py-3.5 rounded-xl shadow-[0_0_30px_rgba(56,189,248,0.25)] flex items-center justify-center gap-2 transition-all"
                    >
                      <Lock size={18} />
                      {lang === 'pt' ? 'Entrar no Painel Admin' : 'Sign In to Admin Panel'}
                    </button>
                  </form>
                </div>
              )}

              {authStep === 'processing' && (
                <div className="text-center flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 border-4 border-gray-200 dark:border-slate-700 border-t-[#2b88c4] rounded-full animate-spin mb-5"></div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {lang === 'pt' ? 'Verificando credenciais...' : 'Verifying credentials...'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {lang === 'pt' ? 'Autenticando acesso administrativo...' : 'Authenticating administrative access...'}
                  </p>
                </div>
              )}

              {authStep === 'success' && (
                <div className="text-center flex flex-col items-center justify-center animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-950/60 rounded-full flex items-center justify-center mb-5">
                    <CheckCircle size={40} className="text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {lang === 'pt' ? 'Acesso Autorizado!' : 'Access Granted!'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {lang === 'pt' ? 'Abrindo Painel Administrativo...' : 'Opening Admin Dashboard...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`font-sans text-gray-800 dark:text-gray-100 bg-[#f4f5f7] dark:bg-slate-950 flex flex-col h-screen overflow-hidden transition-colors duration-200 ${isDarkMode ? 'dark' : ''}`}>
      {/* TOAST NOTIFICATION */}
      <div className={`fixed top-5 right-5 z-[100] transform transition-all duration-300 ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
        <div className={`bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 border-l-4 ${toast.type === 'error' ? 'border-red-500' : toast.type === 'info' ? 'border-blue-500' : 'border-green-500'}`}>
          {toast.type === 'error' ? <AlertCircle size={20} className="text-red-400" /> : <CheckCircle size={20} className="text-green-400" />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm h-16 flex items-center justify-between px-6 z-30 shrink-0 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-blue-600 focus:outline-none">
            <Menu size={24} />
          </button>
          <div onClick={() => navigateTo('dashboard')} className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-[#2b88c4] rounded flex items-center justify-center text-white font-bold text-lg shadow-sm">M</div>
            <span className="text-[#4a4953] dark:text-white font-bold text-lg hidden sm:block">Marchetti Solutions</span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-amber-400 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            title="Alternar Tema"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="flex gap-3 border-r pr-4 sm:pr-6 border-gray-200 dark:border-slate-700">
            <button onClick={() => switchLanguage('pt')} className={`hover:scale-110 transition-transform ${lang !== 'pt' && 'opacity-60 hover:opacity-100'}`} title="Português">
              <img src="https://flagcdn.com/w20/br.png" alt="Brasil" className="rounded shadow-sm w-6 h-4 object-cover" />
            </button>
            <button onClick={() => switchLanguage('en')} className={`hover:scale-110 transition-transform ${lang !== 'en' && 'opacity-60 hover:opacity-100'}`} title="English">
              <img src="https://flagcdn.com/w20/au.png" alt="Australia" className="rounded shadow-sm w-6 h-4 object-cover" />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => {
                syncSharedData();
                setIsNotifOpen(prev => !prev);
              }}
              className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors"
              title={lang === 'pt' ? 'Notificações' : 'Notifications'}
            >
              <Bell size={20} />
              {notifications.filter(n => n.unread).length > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-[10px] text-white items-center justify-center font-bold animate-in zoom-in duration-200">
                  {notifications.filter(n => n.unread).length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/70 dark:bg-slate-800/70">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {lang === 'pt' ? 'Notificações do Sistema' : 'System Notifications'}
                    </span>
                    {notifications.some(n => n.unread) && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline"
                      >
                        {lang === 'pt' ? 'Marcar todas como lidas' : 'Mark all as read'}
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        {lang === 'pt' ? 'Nenhuma movimentação registrada ainda.' : 'No activity recorded yet.'}
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <button
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition-colors flex items-start gap-3 ${
                            notif.unread ? 'bg-blue-50/50 dark:bg-sky-950/30' : ''
                          }`}
                        >
                          <div className="mt-0.5 p-2 rounded-lg bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-sky-400 shrink-0">
                            {notif.type === 'ticket' && <Headset size={15} />}
                            {notif.type === 'client' && <Users size={15} />}
                            {notif.type === 'contract' && <Repeat size={15} />}
                            {(notif.type === 'payment' || notif.type === 'finance') && <Wallet size={15} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{notif.title}</p>
                              {notif.unread && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-0.5">{notif.desc}</p>
                            {notif.time && <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div onClick={() => navigateTo('config')} className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer group">
            <div className="w-9 h-9 rounded-full bg-[#2b88c4] text-white flex items-center justify-center font-bold shadow-sm">
              {adminUser?.name ? adminUser.name.substring(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold leading-tight text-gray-800 dark:text-gray-100">{adminUser?.name || t('admin')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{adminUser?.email || 'admin@marchetti.com'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden relative">
        {isSidebarOpen && (
          <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-20 lg:hidden" />
        )}

        {/* SIDEBAR */}
        <aside className={`w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex-shrink-0 fixed lg:static inset-y-0 left-0 transform transition-transform duration-300 ease-in-out z-30 flex flex-col py-6 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <nav className="flex-1 overflow-y-auto px-4 space-y-1">
            {isSuperAdmin && <>
            <p className="px-4 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-2">{t('overview')}</p>
            <NavItem icon={<PieChart size={18} />} label={t('dashboard')} active={currentView === 'dashboard'} onClick={() => navigateTo('dashboard')} />
            </>}

            {isSuperAdmin && <p className="px-4 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-6">{t('management')}</p>}
            <NavItem icon={<Headset size={18} />} label={t('tickets')} active={currentView === 'chamados'} onClick={() => navigateTo('chamados')} />
            <NavItem icon={<Users size={18} />} label={t('clients')} active={currentView === 'clientes'} onClick={() => navigateTo('clientes')} />
            {isSuperAdmin && <>
            <NavItem icon={<ListChecks size={18} />} label={t('services')} active={currentView === 'servicos'} onClick={() => navigateTo('servicos')} />

            <p className="px-4 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-6">{t('finance_section')}</p>
            <NavItem icon={<Wallet size={18} />} label={t('finances')} active={currentView === 'financas'} onClick={() => navigateTo('financas')} />
            <NavItem icon={<Repeat size={18} />} label={t('contracts')} active={currentView === 'contratos'} onClick={() => navigateTo('contratos')} />
            <NavItem icon={<RefreshCw size={18} />} label={t('exchange')} active={currentView === 'cambio'} onClick={() => navigateTo('cambio')} />
            <NavItem icon={<FileSpreadsheet size={18} />} label={t('invoices')} active={currentView === 'faturas'} onClick={() => navigateTo('faturas')} />
            <NavItem icon={<FileText size={18} />} label={t('reports')} active={currentView === 'relatorios'} onClick={() => navigateTo('relatorios')} />

            <p className="px-4 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-6">{t('system')}</p>
            <NavItem icon={<Settings size={18} />} label={t('settings')} active={currentView === 'config'} onClick={() => navigateTo('config')} />
            </>}
          </nav>

          <div className="px-4 mt-auto pt-6 border-t border-gray-100 dark:border-slate-800">
            <button onClick={handleAdminLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
              <LogOut size={18} />
              <span>{t('logout')}</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
          {isSuperAdmin && currentView === 'dashboard' && (
            <DashboardView t={t} exchangeRates={exchangeRates} lang={lang} />
          )}
          {isSuperAdmin && currentView === 'contratos' && (
            <ContratosView
              t={t}
              lang={lang}
              exchangeRates={exchangeRates}
              onOpenModal={() => {
                setEditingContract(null);
                setContractClientChoice(clientsList[0]?.id || 'CUSTOM');
                setActiveModal('contract');
              }}
              onEditContract={(ct: any) => {
                setEditingContract(ct);
                setContractClientChoice(ct.clientId || 'CUSTOM');
                setActiveModal('contract');
              }}
              onToggleStatus={handleToggleContractStatus}
              onGenerateInvoice={handleGenerateInvoiceFromContract}
              onGenerateAllMonthInvoices={handleGenerateAllMonthlyInvoices}
              onDeleteContract={(ct: any) => {
                setDeleteConfirm({
                  type: 'contract',
                  id: ct.id,
                  label: `${ct.id} — ${ct.title} (${ct.clientName})`
                });
                setActiveModal('confirmDelete');
              }}
            />
          )}
          {isSuperAdmin && currentView === 'relatorios' && (
            <RelatoriosView
              t={t}
              lang={lang}
              exchangeRates={exchangeRates}
              showToast={showToast}
            />
          )}
          {isSuperAdmin && currentView === 'cambio' && (
            <CambioView t={t} lang={lang} exchangeRates={exchangeRates} onRefreshRates={fetchExchangeRates} />
          )}
          {currentView === 'chamados' && (
            <ChamadosView
              t={t}
              lang={lang}
              showToast={showToast}
              onOpenNewTicket={() => {
                setNewTicketClientChoice(clientsList[0]?.id || 'CUSTOM');
                setActiveModal('newTicket');
              }}
              onCompleteTicket={isSuperAdmin ? handleOpenInvoiceFromTicket : undefined}
              onViewTicket={(ticket: any) => {
                setViewingTicket(ticket);
                setActiveModal('viewTicket');
              }}
              onDeleteTicket={(ticket: any) => {
                setDeleteConfirm({
                  type: 'ticket',
                  id: ticket.id,
                  label: `${ticket.id} (${ticket.clientName})`
                });
                setActiveModal('confirmDelete');
              }}
            />
          )}
          {isSuperAdmin && currentView === 'financas' && (
            <FinancasView
              t={t}
              exchangeRates={exchangeRates}
              onOpenModal={() => setActiveModal('entry')}
            />
          )}
          {isSuperAdmin && currentView === 'faturas' && (
            <FaturasView
              t={t}
              lang={lang}
              exchangeRates={exchangeRates}
              onOpenModal={() => handleOpenInvoiceFromTicket('')}
              onViewInvoice={(inv: any) => {
                setSelectedInvoice(inv);
                setActiveModal('viewInvoice');
              }}
              onEditInvoice={(inv: any) => {
                setEditingInvoice(inv);
                setActiveModal('editInvoice');
              }}
              onMarkPaid={handleMarkInvoicePaid}
              onEmailInvoice={(inv: any) => {
                setSelectedInvoice(inv);
                setEmailModalMode('invoice');
                setActiveModal('emailInvoice');
              }}
              onSendReminder={(inv: any) => {
                setSelectedInvoice(inv);
                setEmailModalMode('reminder');
                setActiveModal('emailInvoice');
              }}
              onCancelInvoice={(inv: any) => {
                setCancelInvoiceConfirm({
                  id: inv.id,
                  label: `${inv.id} (${inv.clientName})`
                });
                setActiveModal('confirmCancelInvoice');
              }}
              onDeleteInvoice={(inv: any) => {
                setDeleteConfirm({
                  type: 'invoice',
                  id: inv.id,
                  label: `${inv.id} (${inv.clientName})`
                });
                setActiveModal('confirmDelete');
              }}
            />
          )}
          {currentView === 'clientes' && (
            <ClientesView
              t={t}
              onOpenModal={() => {
                setEditingClient(null);
                setActiveModal('client');
              }}
              onEditClient={(client: any) => {
                setEditingClient(client);
                setActiveModal('client');
              }}
              onViewClient={(client: any) => {
                setViewingClient(client);
                setActiveModal('viewClient');
              }}
              onDeleteClient={(client: any) => {
                setDeleteConfirm({
                  type: 'client',
                  id: client.id,
                  label: client.name
                });
                setActiveModal('confirmDelete');
              }}
            />
          )}
          {isSuperAdmin && currentView === 'servicos' && (
            <ServicosView
              t={t}
              onOpenModal={() => setActiveModal('service')}
              onDeleteService={(srv: any) => {
                setDeleteConfirm({
                  type: 'service',
                  id: srv.id,
                  label: srv.name
                });
                setActiveModal('confirmDelete');
              }}
            />
          )}

          {isSuperAdmin && currentView === 'config' && (
            <ConfiguracoesView
              t={t}
              currentAdmin={adminUser}
              onAdminUpdated={(updatedAdmin: any) => setAdminUser(updatedAdmin)}
              onSave={(message?: string, type = 'success') => showToast(message || t('toast_saved'), type)}
            />
          )}
        </main>
      </div>

      {/* MODAL: NOVO CHAMADO */}
      {activeModal === 'newTicket' && (
        <GenericModal title={t('new_ticket')} onClose={closeModal} onSubmit={handleAddTicket} t={t}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'pt' ? 'Cliente Solicitante' : 'Client'}
              </label>
              <select
                name="clientId"
                value={newTicketClientChoice}
                onChange={(e) => setNewTicketClientChoice(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
              >
                {clientsList.map(cl => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name} ({cl.email})
                  </option>
                ))}
                <option value="CUSTOM">
                  {lang === 'pt' ? '+ Informar cliente manualmente' : '+ Enter client manually'}
                </option>
              </select>
            </div>

            {newTicketClientChoice === 'CUSTOM' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nome</label>
                  <input
                    type="text"
                    name="customClientName"
                    required
                    placeholder="Ex: João Silva"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">E-mail</label>
                  <input
                    type="email"
                    name="customClientEmail"
                    placeholder="joao@email.com"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">WhatsApp / Tel.</label>
                  <input
                    type="text"
                    name="customClientPhone"
                    placeholder="(21) 99999-9999"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serviço</label>
                <select
                  name="servKey"
                  defaultValue="srv_suporte"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
                >
                  <option value="srv_suporte">{t('srv_suporte')}</option>
                  <option value="srv_hardware">{t('srv_hardware')}</option>
                  <option value="srv_redes">{t('srv_redes')}</option>
                  <option value="srv_remoto">{t('srv_remoto')}</option>
                  <option value="srv_web">{t('srv_web')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade (SLA)</label>
                <select
                  name="priority"
                  defaultValue="normal"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
                >
                  <option value="low">{lang === 'pt' ? 'Baixa' : 'Low'}</option>
                  <option value="normal">Normal</option>
                  <option value="high">{lang === 'pt' ? 'Alta' : 'High'}</option>
                  <option value="urgent">{lang === 'pt' ? 'Urgente' : 'Urgent'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'pt' ? 'Descrição do Problema / Solicitação' : 'Issue / Request Description'}
              </label>
              <textarea
                name="desc"
                rows={3}
                required
                placeholder="Descreva o atendimento solicitado..."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm resize-none"
              />
            </div>
          </div>
        </GenericModal>
      )}

      {/* MODAL: CONTRATO MRR */}
      {activeModal === 'contract' && (
        <GenericModal
          title={editingContract ? `Editar Contrato ${editingContract.id}` : t('new_contract')}
          onClose={closeModal}
          onSubmit={handleSaveContract}
          t={t}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'pt' ? 'Cliente Vinculado' : 'Linked Client'}
              </label>
              <select
                name="clientId"
                value={contractClientChoice}
                onChange={(e) => setContractClientChoice(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
              >
                {clientsList.map(cl => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name} ({cl.email})
                  </option>
                ))}
                <option value="CUSTOM">
                  {lang === 'pt' ? '+ Informar cliente manualmente' : '+ Enter client manually'}
                </option>
              </select>
            </div>

            {contractClientChoice === 'CUSTOM' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nome do Cliente</label>
                  <input
                    type="text"
                    name="customClientName"
                    defaultValue={editingContract?.clientName || ''}
                    required
                    placeholder="Ex: Empresa ABC Ltda"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">E-mail de Cobrança</label>
                  <input
                    type="email"
                    name="customClientEmail"
                    defaultValue={editingContract?.clientEmail || ''}
                    placeholder="financeiro@empresa.com"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'pt' ? 'Plano / Serviço Recorrente' : 'Plan / Recurring Service'}
              </label>
              <input
                type="text"
                name="title"
                defaultValue={editingContract?.title || ''}
                required
                placeholder="Ex: Suporte Gerenciado TI + Backup Cloud"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moeda</label>
                <select
                  name="currency"
                  defaultValue={editingContract?.currency || 'BRL'}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor do Ciclo</label>
                <input
                  type="number"
                  name="monthlyValue"
                  step="0.01"
                  min="0.01"
                  defaultValue={editingContract?.monthlyValue || ''}
                  required
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ciclo</label>
                <select
                  name="cycle"
                  defaultValue={editingContract?.cycle || 'monthly'}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
                >
                  <option value="monthly">{lang === 'pt' ? 'Mensal' : 'Monthly'}</option>
                  <option value="yearly">{lang === 'pt' ? 'Anual (÷12 MRR)' : 'Yearly (÷12 MRR)'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dia Vencimento</label>
                <input
                  type="number"
                  name="billingDay"
                  min="1"
                  max="28"
                  defaultValue={editingContract?.billingDay || 10}
                  required
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Início</label>
                <input
                  type="date"
                  name="startDate"
                  defaultValue={formatBRToDateInput(editingContract?.startDate, 0)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status')}</label>
                <select
                  name="status"
                  defaultValue={editingContract?.status || 'active'}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
                >
                  <option value="active">{t('active')}</option>
                  <option value="paused">{t('paused')}</option>
                  <option value="cancelled">{t('cancelled')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações / SLA (opcional)</label>
              <input
                type="text"
                name="notes"
                defaultValue={editingContract?.notes || ''}
                placeholder="Ex: SLA 4h, até 15 estações de trabalho"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </GenericModal>
      )}

      {/* MODAL: DETALHES DO CHAMADO */}
      {activeModal === 'viewTicket' && viewingTicket && (
        <ViewTicketModal
          ticket={viewingTicket}
          lang={lang}
          onClose={closeModal}
          onUpdateStatus={(newStatus: string) => handleUpdateTicketStatus(viewingTicket.id, newStatus)}
          onUpdatePriority={(newPriority: string) => handleUpdateTicketPriority(viewingTicket.id, newPriority)}
          onSaveEstimate={(estData: any) => handleSaveTicketEstimate(viewingTicket.id, estData)}
          onDeleteTicket={() => {
            const target = viewingTicket;
            setViewingTicket(null);
            setDeleteConfirm({
              type: 'ticket',
              id: target.id,
              label: `${target.id} (${target.clientName})`
            });
            setActiveModal('confirmDelete');
          }}
          onGenerateInvoice={() => {
            const ticketId = viewingTicket.id;
            closeModal();
            handleOpenInvoiceFromTicket(ticketId);
          }}
          t={t}
        />
      )}

      {activeModal === 'confirmDelete' && deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-transparent dark:border-slate-800 w-full max-w-md z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-950/60 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={26} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {lang === 'pt' ? 'Confirmar Exclusão' : 'Confirm Deletion'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                {lang === 'pt' ? (
                  <>
                    Tem certeza que deseja excluir{' '}
                    <span className="font-bold text-gray-900 dark:text-white">{deleteConfirm.label}</span>? Esta ação não poderá ser desfeita.
                  </>
                ) : (
                  <>
                    Are you sure you want to delete{' '}
                    <span className="font-bold text-gray-900 dark:text-white">{deleteConfirm.label}</span>? This action cannot be undone.
                  </>
                )}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-500/20"
                >
                  {lang === 'pt' ? 'Sim, Excluir' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'confirmCancelInvoice' && cancelInvoiceConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-transparent dark:border-slate-800 w-full max-w-md z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-950/60 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ban size={26} className="text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {lang === 'pt' ? 'Confirmar Cancelamento' : 'Confirm Cancellation'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                {lang === 'pt' ? (
                  <>
                    Tem certeza que deseja cancelar a fatura{' '}
                    <span className="font-bold text-gray-900 dark:text-white">{cancelInvoiceConfirm.label}</span>? Ela receberá a tag <span className="font-semibold text-red-600">Cancelada</span>.
                  </>
                ) : (
                  <>
                    Are you sure you want to cancel invoice{' '}
                    <span className="font-bold text-gray-900 dark:text-white">{cancelInvoiceConfirm.label}</span>? It will be marked as <span className="font-semibold text-red-600">Cancelled</span>.
                  </>
                )}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelInvoice}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-lg shadow-orange-500/20"
                >
                  {lang === 'pt' ? 'Sim, Cancelar Fatura' : 'Yes, Cancel Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVA FATURA (COM DATA DE VENCIMENTO) */}
      {activeModal === 'invoice' && (
        <GenericModal title={t('new_invoice')} onClose={closeModal} onSubmit={handleAddInvoice} t={t}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ticket / Chamado Referente</label>
              <select
                name="ticketId"
                defaultValue={selectedTicketForInvoice}
                required
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
              >
                <option value="">Selecione um chamado...</option>
                {ticketsList.map(tk => {
                  const inv = invoicesList.find(i => i.ticketId === tk.id && i.status !== 'cancelled');
                  return (
                    <option key={tk.id} value={tk.id} disabled={Boolean(inv)}>
                      {tk.id} - {tk.clientName} ({t(tk.servKey) || tk.servKey}) {inv ? `[Já faturado: ${inv.id}]` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            {prefillTicketObj?.estimate && (
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                Orçamento vinculado ao chamado ({prefillTicketObj.estimate.symbol || 'R$'} {Number(prefillTicketObj.estimate.amount || 0).toFixed(2)}) preenchido automaticamente.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moeda</label>
                <select
                  name="currency"
                  defaultValue={prefillTicketObj?.estimate?.currency || 'BRL'}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor a Cobrar</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0.01"
                  defaultValue={prefillTicketObj?.estimate?.amount || ''}
                  required
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'pt' ? 'Data de Vencimento' : 'Due Date'}
                </label>
                <input
                  type="date"
                  name="dueDate"
                  defaultValue={formatBRToDateInput(undefined, 7)}
                  required
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        </GenericModal>
      )}

      {/* MODAL: EDITAR FATURA (COM DATA DE VENCIMENTO E CONGELAMENTO DE CÂMBIO) */}
      {activeModal === 'editInvoice' && editingInvoice && (
        <GenericModal title={`Editar Fatura ${editingInvoice.id}`} onClose={closeModal} onSubmit={handleUpdateInvoice} t={t}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente</label>
              <input type="text" readOnly value={editingInvoice.clientName} className="w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição / Serviço</label>
              <input type="text" name="desc" defaultValue={editingInvoice.desc} required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moeda</label>
                <select name="currency" defaultValue={editingInvoice.currency || 'BRL'} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm">
                  <option value="BRL">BRL (R$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor</label>
                <input type="number" name="amount" step="0.01" defaultValue={editingInvoice.rawAmount || editingInvoice.val} required className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vencimento</label>
                <input
                  type="date"
                  name="dueDate"
                  defaultValue={formatBRToDateInput(editingInvoice.dueDate, 7)}
                  required
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status')}</label>
                <select name="status" defaultValue={editingInvoice.status} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm">
                  <option value="pending">{t('pending')}</option>
                  <option value="paid">{t('paid')}</option>
                  <option value="cancelled">{t('cancelled')}</option>
                </select>
              </div>
            </div>
            {(editingInvoice.currency === 'AUD' || editingInvoice.currency === 'USD') && (
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-sky-950/40 border border-blue-100 dark:border-sky-800 text-xs text-blue-800 dark:text-sky-300">
                {editingInvoice.status === 'paid' && editingInvoice.paidExchangeRate
                  ? `Cotação histórica congelada no pagamento: 1 ${editingInvoice.currency} = R$ ${Number(editingInvoice.paidExchangeRate).toFixed(4)} (R$ ${Number(editingInvoice.paidAmountBRL || 0).toFixed(2)}).`
                  : `Ao marcar como Pago, a cotação atual (1 ${editingInvoice.currency} = R$ ${(editingInvoice.currency === 'AUD' ? exchangeRates.AUD_BRL : exchangeRates.USD_BRL).toFixed(4)}) será congelada para esta fatura.`}
              </div>
            )}
          </div>
        </GenericModal>
      )}

      {activeModal === 'entry' && (
        <GenericModal title={t('new_entry')} onClose={closeModal} onSubmit={handleAddEntry} t={t}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
              <input type="text" name="desc" required placeholder="Ex: Assinatura Cloud / Consultoria" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria / Origem</label>
              <input type="text" name="category" required placeholder="Ex: Infraestrutura / Cliente" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moeda</label>
                <select name="currency" defaultValue="BRL" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm">
                  <option value="BRL">BRL (R$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor</label>
                <input type="number" name="amount" step="0.01" min="0.01" required placeholder="0.00" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <select name="type" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm">
                  <option value="in">{t('income')}</option>
                  <option value="out">{t('expense')}</option>
                </select>
              </div>
            </div>
          </div>
        </GenericModal>
      )}

      {activeModal === 'service' && (
        <GenericModal title={t('add_service')} onClose={closeModal} onSubmit={handleAddService} t={t}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Serviço</label>
              <input type="text" name="name" required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
              <textarea name="desc" rows={3} required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço Base</label>
              <input type="text" name="price" required placeholder="Ex: R$ 250,00" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:border-blue-500 text-sm" />
            </div>
          </div>
        </GenericModal>
      )}

      {activeModal === 'client' && (
        <GenericModal title={editingClient ? `Editar Cliente ${editingClient.name}` : t('add_client')} onClose={closeModal} onSubmit={handleSaveClient} t={t}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome / Empresa</label>
                <input type="text" name="name" defaultValue={editingClient?.name || ''} required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                <input type="email" name="email" defaultValue={editingClient?.email || ''} required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone / WhatsApp</label>
                <input type="text" name="phone" defaultValue={editingClient?.phone || ''} placeholder="(21) 99999-9999" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF / CNPJ / ABN</label>
                <input type="text" name="cpf" defaultValue={editingClient?.cpf || ''} placeholder="000.000.000-00" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">País</label>
                <select name="country" defaultValue={editingClient?.country || 'BR'} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none">
                  <option value="BR">Brasil (BR)</option>
                  <option value="AU">Austrália (AU)</option>
                  <option value="US">Estados Unidos (US)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                <input type="text" name="cidade" defaultValue={editingClient?.cidade || ''} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado / Província</label>
                <input type="text" name="estado" defaultValue={editingClient?.estado || ''} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status')}</label>
                <select name="status" defaultValue={editingClient?.status || 'active'} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none">
                  <option value="active">{t('active')}</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
          </div>
        </GenericModal>
      )}

      {/* MODAL: DETALHES DO CLIENTE (COM WHATSAPP) */}
      {activeModal === 'viewClient' && viewingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-transparent dark:border-slate-800 w-full max-w-2xl max-h-[90vh] z-10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="shrink-0 flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-sky-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm uppercase">
                  {viewingClient.name?.substring(0, 2) || 'CL'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{viewingClient.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{viewingClient.id}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6 text-sm">
              <section aria-labelledby="client-contact-heading" className="mb-5">
                <h4 id="client-contact-heading" className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Dados cadastrais</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ['E-mail', viewingClient.email],
                    ['Telefone / WhatsApp', viewingClient.phone],
                    ['Documento (CPF/CNPJ/ABN)', viewingClient.cpf],
                    ['Status', viewingClient.status === 'inactive' ? 'Inativo' : 'Ativo'],
                    ['Data de cadastro', viewingClient.created_at ? new Date(viewingClient.created_at).toLocaleString('pt-BR') : 'Não informado'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                      <p className="mb-1 text-xs text-gray-400">{label}</p>
                      <p className="break-words font-medium text-gray-900 dark:text-white">{formatClientDetailValue(value)}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section aria-labelledby="client-address-heading" className="mb-5">
                <h4 id="client-address-heading" className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Endereço</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ['País', viewingClient.country],
                    ['CEP / Postcode', viewingClient.zip],
                    ['Rua / Logradouro', viewingClient.rua],
                    ['Número', viewingClient.numero],
                    ['Bairro / Suburb', viewingClient.bairro],
                    ['Cidade', viewingClient.cidade],
                    ['Estado / Província', viewingClient.estado],
                    ['Complemento', viewingClient.complemento],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                      <p className="mb-1 text-xs text-gray-400">{label}</p>
                      <p className="break-words font-medium text-gray-900 dark:text-white">{formatClientDetailValue(value)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {Object.entries(viewingClient).filter(([field, value]) => (
                !CLIENT_DETAIL_FIELDS.has(field) && value !== null && value !== undefined && value !== ''
              )).length > 0 && (
                <section aria-labelledby="client-extra-heading">
                  <h4 id="client-extra-heading" className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Outros dados do perfil</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(viewingClient)
                      .filter(([field, value]) => !CLIENT_DETAIL_FIELDS.has(field) && value !== null && value !== undefined && value !== '')
                      .map(([field, value]) => (
                        <div key={field} className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                          <p className="mb-1 text-xs text-gray-400">{formatClientDetailLabel(field)}</p>
                          <p className="break-words font-medium text-gray-900 dark:text-white">{formatClientDetailValue(value)}</p>
                        </div>
                      ))}
                  </div>
                </section>
              )}
            </div>
            <div className="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 dark:bg-slate-800/50">
              <a
                href={buildWhatsAppLink(
                  viewingClient.phone,
                  lang === 'pt'
                    ? `Olá ${viewingClient.name}! Aqui é da equipe Marchetti Solutions. Como podemos ajudar hoje?`
                    : `Hello ${viewingClient.name}! This is the Marchetti Solutions team. How can we assist you today?`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-2 transition-colors"
              >
                <MessageCircle size={16} />
                {lang === 'pt' ? 'Chamar no WhatsApp' : 'Chat on WhatsApp'}
              </a>

              <div className="flex items-center gap-2">
                <button onClick={closeModal} className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-xl">{t('close')}</button>
                <button
                  onClick={() => {
                    setEditingClient(viewingClient);
                    setViewingClient(null);
                    setActiveModal('client');
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PDF PROFISSIONAL DA FATURA */}
      {activeModal === 'viewInvoice' && selectedInvoice && (
        <ViewInvoiceModal
          invoice={selectedInvoice}
          exchangeRates={exchangeRates}
          lang={lang}
          onClose={closeModal}
          t={t}
          showToast={showToast}
        />
      )}

      {/* MODAL: ENVIO DE FATURA OU LEMBRETE DE COBRANÇA */}
      {activeModal === 'emailInvoice' && selectedInvoice && (
        <EmailInvoiceModal
          invoice={selectedInvoice}
          mode={emailModalMode}
          lang={lang}
          onClose={closeModal}
          t={t}
          showToast={showToast}
        />
      )}
    </div>
  );
}

/* ==========================================
 * SUB-COMPONENTES DE VIEWS
 * ========================================== */

