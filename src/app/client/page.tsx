"use client";
import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useThemePreference } from '@/lib/useThemePreference';
import {
  Menu, Moon, Sun, LogOut, CheckCircle, X, Download,
  HelpCircle, History, Receipt, UserCircle, Wrench, Network, Headset,
  Laptop, Code, CreditCard, MapPin, Send, Save, Trash2
} from 'lucide-react';

const clientTranslations: Record<string, Record<string, string>> = {
  pt: {
    client: "Cliente",
    logout: "Sair",
    menu_main: "Menu Principal",
    nav_services: "Solicitar Serviços",
    nav_history: "Meus Chamados",
    nav_invoices: "Minhas Faturas",
    nav_profile: "Meu Perfil",
    title_services: "Solicitar Novo Serviço",
    desc_services: "Escolha uma das categorias abaixo para abrir um chamado técnico com nossa equipe.",
    title_history: "Histórico de Chamados",
    desc_history: "Acompanhe o status e os detalhes de todas as suas solicitações.",
    title_invoices: "Minhas Faturas",
    desc_invoices: "Visualize suas cobranças, baixe comprovantes em PDF e realize pagamentos online.",
    title_profile: "Meu Perfil e Endereço",
    desc_profile: "Mantenha seus dados cadastrais e endereço atualizados para atendimentos presenciais.",
    srv_suporte: "Suporte e Manutenção",
    srv_suporte_desc: "Reparo de computadores, limpeza interna, remoção de vírus e otimização.",
    srv_hardware: "Hardware e Sistemas",
    srv_hardware_desc: "Formatação, instalação de Windows/MacOS e upgrades de SSD ou memória RAM.",
    srv_redes: "Redes e Wi-Fi Mesh",
    srv_redes_desc: "Instalação de cabeamento, roteadores e eliminação de pontos cegos de internet.",
    srv_remoto: "Suporte Remoto",
    srv_remoto_desc: "Atendimento imediato à distância para configurações, e-mails e softwares.",
    srv_web: "Criação de Websites",
    srv_web_desc: "Desenvolvimento de sites modernos, responsivos e otimizados para o Google.",
    btn_request: "Solicitar Serviço",
    describe_issue: "Descreva sua necessidade detalhadamente:",
    send_request: "Enviar Solicitação",
    cancel: "Cancelar",
    close: "Fechar",
    save: "Salvar Dados",
    pending: "Pendente",
    in_progress: "Em andamento",
    completed: "Concluído",
    paid: "Pago",
    cancelled: "Cancelada",
    pay_now: "Pagar Agora",
    checkout_title: "Pagamento Seguro",
    invoice_hash: "Fatura #",
    card_holder: "Nome Impresso no Cartão",
    card_number: "Número do Cartão",
    expiry: "Validade (MM/AA)",
    cvv: "CVV",
    confirm_payment: "Confirmar Pagamento",
    processing_request: "Enviando solicitação...",
    request_success: "Solicitação Enviada com Sucesso!",
    processing_payment: "Validando cartão e processando pagamento...",
    payment_success: "Pagamento Aprovado com Sucesso!",
    payment_failed_title: "Transação Recusada",
    payment_locked_title: "Pagamento Bloqueado",
    payment_locked_desc: "Você atingiu o limite máximo de 3 tentativas sem sucesso. Retornando ao painel...",
    try_again: "Tentar Novamente",
    attempt_count: "Tentativa",
    of: "de",
    err_card_number: "Número de cartão inválido. Verifique os dígitos informados.",
    err_card_expiry: "Data de validade inválida ou cartão vencido.",
    err_card_cvv: "Código de segurança (CVV) inválido.",
    err_card_holder: "Informe o nome do titular do cartão.",
    toast_profile_saved: "Perfil e endereço atualizados com sucesso!",
    toast_pdf_gen: "Gerando PDF da fatura...",
    delete_ticket: "Excluir Chamado",
    confirm_delete_title: "Excluir Chamado",
    confirm_delete_desc: "Tem certeza que deseja excluir este chamado aberto por engano? Essa ação não poderá ser desfeita.",
    confirm_delete_btn: "Sim, Excluir",
    toast_ticket_deleted: "Chamado excluído com sucesso!",
    cannot_delete_active: "Chamados em andamento ou concluídos não podem ser excluídos."
  },
  en: {
    client: "Client",
    logout: "Logout",
    menu_main: "Main Menu",
    nav_services: "Request Services",
    nav_history: "My Tickets",
    nav_invoices: "My Invoices",
    nav_profile: "My Profile",
    title_services: "Request New Service",
    desc_services: "Choose one of the categories below to open a support ticket with our team.",
    title_history: "Ticket History",
    desc_history: "Track the status and details of all your support requests.",
    title_invoices: "My Invoices",
    desc_invoices: "View your bills, download PDF receipts, and pay online.",
    title_profile: "My Profile & Address",
    desc_profile: "Keep your registration details and address updated for on-site visits.",
    srv_suporte: "Support & Maintenance",
    srv_suporte_desc: "Computer repair, internal cleaning, virus removal, and optimization.",
    srv_hardware: "Hardware & Systems",
    srv_hardware_desc: "Formatting, Windows/MacOS installation, and SSD or RAM upgrades.",
    srv_redes: "Networking & Wi-Fi Mesh",
    srv_redes_desc: "Cabling installation, routers setup, and Wi-Fi dead-zone elimination.",
    srv_remoto: "Remote Support",
    srv_remoto_desc: "Instant remote assistance for software, email, and system issues.",
    srv_web: "Website Creation",
    srv_web_desc: "Modern, responsive website development optimized for Google.",
    btn_request: "Request Service",
    describe_issue: "Describe your issue in detail:",
    send_request: "Send Request",
    cancel: "Cancel",
    close: "Close",
    save: "Save Details",
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    paid: "Paid",
    cancelled: "Cancelled",
    pay_now: "Pay Now",
    checkout_title: "Secure Checkout",
    invoice_hash: "Invoice #",
    card_holder: "Cardholder Name",
    card_number: "Card Number",
    expiry: "Expiry (MM/YY)",
    cvv: "CVV",
    confirm_payment: "Confirm Payment",
    processing_request: "Sending request...",
    request_success: "Request Sent Successfully!",
    processing_payment: "Validating card and processing payment...",
    payment_success: "Payment Approved Successfully!",
    payment_failed_title: "Transaction Declined",
    payment_locked_title: "Payment Locked",
    payment_locked_desc: "You have reached the maximum limit of 3 failed attempts. Returning to dashboard...",
    try_again: "Try Again",
    attempt_count: "Attempt",
    of: "of",
    err_card_number: "Invalid card number. Please check the digits entered.",
    err_card_expiry: "Invalid expiration date or expired card.",
    err_card_cvv: "Invalid security code (CVV).",
    err_card_holder: "Please enter the cardholder's name.",
    toast_profile_saved: "Profile and address updated successfully!",
    toast_pdf_gen: "Generating invoice PDF...",
    delete_ticket: "Delete Ticket",
    confirm_delete_title: "Delete Ticket",
    confirm_delete_desc: "Are you sure you want to delete this ticket opened by mistake? This action cannot be undone.",
    confirm_delete_btn: "Yes, Delete",
    toast_ticket_deleted: "Ticket deleted successfully!",
    cannot_delete_active: "In-progress or completed tickets cannot be deleted."
  }
};

export default function ClientDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('servicos');
  const { isDarkMode, toggleTheme } = useThemePreference();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lang, setLang] = useState('pt');
  const [logoutStatus, setLogoutStatus] = useState('idle');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Dados do usuário logado
  const [currentUser, setCurrentUser] = useState<Record<string, any>>({
    id: '',
    name: 'Cliente',
    email: '',
    phone: '',
    cpf: '',
    country: 'BR',
    zip: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    complemento: ''
  });

  // Chamados e faturas do cliente
  const [tickets, setTickets] = useState<Record<string, any>[]>([]);
  const [invoices, setInvoices] = useState<Record<string, any>[]>([]);

  // Modal de Solicitação de Serviço
  const [reqModal, setReqModal] = useState({ open: false, servKey: '', status: 'idle', desc: '' });
  const [viewingTicket, setViewingTicket] = useState<any>(null);
  const [ticketToDelete, setTicketToDelete] = useState<any>(null);

  // Modal de Checkout / Pagamento com Cartão e Controle de 3 Tentativas
  const [payModal, setPayModal] = useState<any>({
    open: false,
    invoice: null,
    status: 'idle', // 'idle' | 'processing' | 'failed' | 'locked' | 'success'
    attempts: 0,
    errorReason: ''
  });


  const t = (key: string) => (clientTranslations[lang] && clientTranslations[lang][key]) || key;

  const showToast = (message: string, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
  };

  const loadUserAndData = async () => {
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      showToast('Não foi possível verificar sua sessão. Confira sua conexão e tente novamente.', 'error');
      return;
    }
    if (!authData.user) {
      router.replace('/?view=login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, display_name, phone, client_data')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profile) {
      setCurrentUser((prev) => ({
        ...prev,
        ...(profile.client_data || {}),
        id: profile.id,
        name: profile.display_name || authData.user.user_metadata?.display_name || 'Cliente',
        email: profile.email || authData.user.email || '',
        phone: profile.phone || '',
      }));
    }

    const { data: records, error } = await supabase
      .from('customer_records')
      .select('kind, data')
      .eq('owner_id', authData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      showToast('Não foi possível carregar seus dados.', 'error');
      return;
    }
    setTickets((records || []).filter((record) => record.kind === 'ticket').map((record) => record.data));
    setInvoices((records || []).filter((record) => record.kind === 'invoice').map((record) => record.data));
  };

  useEffect(() => {
    const supabase = createClient();
    let alive = true;

    void loadUserAndData()
      .catch((error: unknown) => {
        console.error('Não foi possível restaurar a sessão do cliente.', error);
        showToast('Não foi possível carregar sua sessão. Tente novamente.', 'error');
      })
      .finally(() => {
        if (alive) setIsAuthLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/?view=login');
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    setLogoutStatus('processing');
    const supabase = createClient();
    await supabase.auth.signOut();
    setLogoutStatus('success');
    router.replace('/?view=login');
  };

  // Abertura de Chamado
  const handleOpenServiceModal = (servKey: string) => {
    setReqModal({ open: true, servKey, status: 'idle', desc: '' });
  };

  const handleSubmitRequest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setReqModal(prev => ({ ...prev, status: 'processing' }));

    const supabase = createClient();
    const now = new Date();
    const dateStr = `${now.toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US')} ${now.toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`;
    const ticket = {
      id: `TK-${crypto.randomUUID()}`,
      servKey: reqModal.servKey,
      desc: reqModal.desc,
      date: dateStr,
      status: 'pending',
      clientName: currentUser.name,
      clientEmail: currentUser.email,
    };
    const { error } = await supabase.from('customer_records').insert({
      owner_id: currentUser.id,
      kind: 'ticket',
      app_id: ticket.id,
      data: ticket,
    });
    if (error) {
      setReqModal((prev) => ({ ...prev, status: 'idle' }));
      showToast('Não foi possível salvar o chamado. Tente novamente.', 'error');
      return;
    }

    setReqModal((prev) => ({ ...prev, status: 'success' }));
    await loadUserAndData();
    window.setTimeout(() => {
      setReqModal({ open: false, servKey: '', status: 'idle', desc: '' });
      setActiveTab('historico');
    }, 1000);
  };

  // Salvar Perfil e Endereço
  const handleSaveProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update({
      display_name: currentUser.name,
      phone: currentUser.phone,
      client_data: currentUser,
    }).eq('id', currentUser.id);
    if (error) {
      showToast('Não foi possível salvar seu perfil.', 'error');
      return;
    }
    showToast(t('toast_profile_saved'), 'success');
  };

  // Excluir chamado aberto por engano (permitido quando status === 'pending')
  const handleRequestDeleteTicket = (e: React.MouseEvent, ticket: Record<string, any>) => {
    if (e) e.stopPropagation();
    if (ticket.status !== 'pending') {
      showToast(t('cannot_delete_active'), 'error');
      return;
    }
    setTicketToDelete(ticket);
  };

  const handleConfirmDeleteTicket = async () => {
    if (!ticketToDelete) return;
    const supabase = createClient();
    const { error } = await supabase.from('customer_records')
      .delete()
      .eq('owner_id', currentUser.id)
      .eq('kind', 'ticket')
      .eq('app_id', ticketToDelete.id);
    if (error) {
      showToast('Não foi possível excluir o chamado.', 'error');
      return;
    }
    await loadUserAndData();
    if (viewingTicket && viewingTicket.id === ticketToDelete.id) {
      setViewingTicket(null);
    }
    setTicketToDelete(null);
    showToast(t('toast_ticket_deleted'), 'success');
  };

  const openPaymentModal = (invoice: Record<string, any>) => {
    setPayModal({ open: true, invoice, status: 'idle' });
  };

  const handleDownloadInvoicePDF = async (inv: Record<string, any>) => {
    showToast(t('toast_pdf_gen'), 'info');
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const el = document.createElement('div');
      el.style.padding = '40px';
      el.style.fontFamily = 'Inter, sans-serif';
      const title = document.createElement('h2');
      title.textContent = 'Marchetti Solutions';
      title.style.color = '#2b88c4';
      el.append(title);
      const fields = [
        ['Fatura', inv.id], ['Cliente', inv.clientName], ['Serviço', inv.desc],
        ['Data', inv.date], ['Valor', `${inv.symbol || 'R$'} ${inv.val}`],
        ['Status', inv.status === 'paid' ? 'PAGO' : 'PENDENTE'],
      ];
      fields.forEach(([label, value]) => {
        const line = document.createElement('p');
        line.textContent = `${label}: ${value ?? ''}`;
        el.append(line);
      });
      await html2pdf().set({ margin: 0.5, filename: `${inv.id}.pdf` }).from(el).save();
    } catch {
      showToast('Não foi possível gerar o PDF.', 'error');
    }
  };

  const servicesCatalog = [
    { key: 'srv_suporte', title: t('srv_suporte'), desc: t('srv_suporte_desc'), icon: <Wrench size={24} /> },
    { key: 'srv_hardware', title: t('srv_hardware'), desc: t('srv_hardware_desc'), icon: <Laptop size={24} /> },
    { key: 'srv_redes', title: t('srv_redes'), desc: t('srv_redes_desc'), icon: <Network size={24} /> },
    { key: 'srv_remoto', title: t('srv_remoto'), desc: t('srv_remoto_desc'), icon: <Headset size={24} /> },
    { key: 'srv_web', title: t('srv_web'), desc: t('srv_web_desc'), icon: <Code size={24} /> }
  ];

  const initials = currentUser.name
    ? currentUser.name
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CL';

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f5f7] text-gray-700 dark:bg-slate-950 dark:text-gray-200">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#2b88c4] rounded-full animate-spin mb-4" />
        <p className="text-sm">{lang === 'pt' ? 'Restaurando sua sessão...' : 'Restoring your session...'}</p>
      </div>
    );
  }

  return (
    <div className={`user-portal font-sans text-gray-800 dark:text-gray-100 bg-[#f4f5f7] dark:bg-slate-950 flex flex-col h-screen overflow-hidden transition-colors duration-200 ${isDarkMode ? 'dark' : ''}`}>

      {/* LOGOUT OVERLAY */}
      {logoutStatus !== 'idle' && (
        <div className="fixed inset-0 z-[120] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
          {logoutStatus === 'processing' && (
            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-gray-200 dark:border-slate-700 border-t-[#2b88c4] rounded-full animate-spin mb-6"></div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {lang === 'pt' ? 'Encerrando sessão...' : 'Logging out...'}
              </h3>
            </div>
          )}
          {logoutStatus === 'success' && (
            <div className="text-center flex flex-col items-center animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-950/60 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {lang === 'pt' ? 'Sessão Encerrada com Sucesso!' : 'Logged Out Successfully!'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {lang === 'pt' ? 'Redirecionando para a página inicial...' : 'Redirecting to home page...'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TOAST */}
      <div className={`fixed top-5 right-5 z-[100] transform transition-all duration-300 ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
        <div className={`bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 border-l-4 ${toast.type === 'error' ? 'border-red-500' : toast.type === 'info' ? 'border-blue-500' : 'border-green-500'}`}>
          <CheckCircle size={20} className="text-green-400" />
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm h-16 flex items-center justify-between px-6 z-30 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-blue-600">
            <Menu size={24} />
          </button>
          <div onClick={() => setActiveTab('servicos')} className="flex items-center gap-2 cursor-pointer">
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
            <button onClick={() => setLang('pt')} className={`hover:scale-110 transition-transform ${lang !== 'pt' && 'opacity-60 hover:opacity-100'}`} title="Português">
              <img src="https://flagcdn.com/w20/br.png" alt="Brasil" className="rounded shadow-sm w-6 h-4 object-cover" />
            </button>
            <button onClick={() => setLang('en')} className={`hover:scale-110 transition-transform ${lang !== 'en' && 'opacity-60 hover:opacity-100'}`} title="English">
              <img src="https://flagcdn.com/w20/au.png" alt="Australia" className="rounded shadow-sm w-6 h-4 object-cover" />
            </button>
          </div>

          <div onClick={() => setActiveTab('perfil')} className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-[#2b88c4] text-white flex items-center justify-center font-bold shadow-sm">{initials}</div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold leading-tight text-gray-800 dark:text-gray-100">{currentUser.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.email || t('client')}</p>
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
            <p className="px-4 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-2">{t('menu_main')}</p>
            <SidebarBtn icon={<HelpCircle size={18} />} label={t('nav_services')} active={activeTab === 'servicos'} onClick={() => { setActiveTab('servicos'); setIsSidebarOpen(false); }} />
            <SidebarBtn icon={<History size={18} />} label={t('nav_history')} active={activeTab === 'historico'} onClick={() => { setActiveTab('historico'); setIsSidebarOpen(false); }} />
            <SidebarBtn
              icon={<Receipt size={18} />}
              label={t('nav_invoices')}
              badge={invoices.filter(i => i.status === 'pending').length}
              active={activeTab === 'faturas'}
              onClick={() => { setActiveTab('faturas'); setIsSidebarOpen(false); }}
            />
            <SidebarBtn icon={<UserCircle size={18} />} label={t('nav_profile')} active={activeTab === 'perfil'} onClick={() => { setActiveTab('perfil'); setIsSidebarOpen(false); }} />
          </nav>

          <div className="px-4 mt-auto pt-6 border-t border-gray-100 dark:border-slate-800">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
              <LogOut size={18} />
              <span>{t('logout')}</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50 dark:bg-slate-950">

          {/* TAB: SOLICITAR SERVIÇOS */}
          {activeTab === 'servicos' && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title_services')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('desc_services')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servicesCatalog.map(srv => (
                  <div key={srv.key} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-sky-950/60 text-[#2b88c4] dark:text-sky-400 flex items-center justify-center mb-4">
                        {srv.icon}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{srv.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{srv.desc}</p>
                    </div>
                    <button
                      onClick={() => handleOpenServiceModal(srv.key)}
                      className="w-full py-2.5 px-4 bg-[#2b88c4] hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Send size={15} /> {t('btn_request')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: MEUS CHAMADOS */}
          {activeTab === 'historico' && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title_history')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('desc_history')}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-slate-800">
                        <th className="py-4 px-6">Ticket</th>
                        <th className="py-4 px-6">Serviço</th>
                        <th className="py-4 px-6">Data</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-center">{lang === 'pt' ? 'Ações' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
                      {tickets.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                            {lang === 'pt' ? 'Nenhum chamado aberto ainda.' : 'No tickets opened yet.'}
                          </td>
                        </tr>
                      ) : (
                        tickets.map(tk => (
                          <tr key={tk.id} onClick={() => setViewingTicket(tk)} className="hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                            <td className="py-4 px-6 font-bold text-[#2b88c4] dark:text-sky-400">{tk.id}</td>
                            <td className="py-4 px-6 text-gray-700 dark:text-gray-200">{t(tk.servKey) || tk.servKey}</td>
                            <td className="py-4 px-6 text-gray-500 dark:text-gray-400">{tk.date}</td>
                            <td className="py-4 px-6">
                              {tk.status === 'completed' && <span className="bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-medium">{t('completed')}</span>}
                              {tk.status === 'in_progress' && <span className="bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-medium">{t('in_progress')}</span>}
                              {tk.status === 'pending' && <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-medium">{t('pending')}</span>}
                            </td>
                            <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                              {tk.status === 'pending' ? (
                                <button
                                  type="button"
                                  onClick={(e) => handleRequestDeleteTicket(e, tk)}
                                  className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                  title={t('delete_ticket')}
                                >
                                  <Trash2 size={16} />
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MINHAS FATURAS */}
          {activeTab === 'faturas' && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title_invoices')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('desc_invoices')}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-slate-800">
                        <th className="py-4 px-6">Fatura #</th>
                        <th className="py-4 px-6">Descrição</th>
                        <th className="py-4 px-6">Data</th>
                        <th className="py-4 px-6 text-right">Valor</th>
                        <th className="py-4 px-6 text-center">Status</th>
                        <th className="py-4 px-6 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                            {lang === 'pt' ? 'Nenhuma fatura emitida para sua conta.' : 'No invoices issued for your account.'}
                          </td>
                        </tr>
                      ) : (
                        invoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">{inv.id}</td>
                            <td className="py-4 px-6 text-gray-700 dark:text-gray-200">{inv.desc}</td>
                            <td className="py-4 px-6 text-gray-500 dark:text-gray-400">{inv.date}</td>
                            <td className="py-4 px-6 text-right font-bold text-gray-900 dark:text-white">{inv.symbol || 'R$'} {inv.val}</td>
                            <td className="py-4 px-6 text-center">
                              {inv.status === 'paid' ? (
                                <span className="bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-medium">{t('paid')}</span>
                              ) : inv.status === 'cancelled' ? (
                                <span className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-xs font-medium">{t('cancelled')}</span>
                              ) : (
                                <span className="bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-medium">{t('pending')}</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center whitespace-nowrap">
                              <button onClick={() => handleDownloadInvoicePDF(inv)} className="text-gray-400 hover:text-red-500 p-2 mx-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Baixar PDF">
                                <Download size={16} />
                              </button>
                              {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                                <button
                                  onClick={() => openPaymentModal(inv)}
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg ml-1 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                                >
                                  <CreditCard size={14} /> {t('pay_now')}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MEU PERFIL */}
          {activeTab === 'perfil' && (
            <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title_profile')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('desc_profile')}</p>
              </div>

              <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                    <input type="text" value={currentUser.name} onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })} required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                    <input type="email" value={currentUser.email} onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })} required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                    <input type="text" value={currentUser.phone} onChange={(e) => setCurrentUser({ ...currentUser, phone: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF / CNPJ / ABN</label>
                    <input type="text" value={currentUser.cpf} onChange={(e) => setCurrentUser({ ...currentUser, cpf: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-slate-800 pt-5">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <MapPin size={16} className="text-[#2b88c4]" /> Endereço
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">País</label>
                      <select value={currentUser.country} onChange={(e) => setCurrentUser({ ...currentUser, country: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none">
                        <option value="BR">Brasil</option>
                        <option value="AU">Australia</option>
                        <option value="US">United States</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">CEP / Postcode</label>
                      <input type="text" value={currentUser.zip} onChange={(e) => setCurrentUser({ ...currentUser, zip: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Número</label>
                      <input type="text" value={currentUser.numero} onChange={(e) => setCurrentUser({ ...currentUser, numero: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rua / Logradouro</label>
                      <input type="text" value={currentUser.rua} onChange={(e) => setCurrentUser({ ...currentUser, rua: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Bairro / Suburb</label>
                      <input type="text" value={currentUser.bairro} onChange={(e) => setCurrentUser({ ...currentUser, bairro: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cidade</label>
                      <input type="text" value={currentUser.cidade} onChange={(e) => setCurrentUser({ ...currentUser, cidade: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Estado</label>
                      <input type="text" value={currentUser.estado} onChange={(e) => setCurrentUser({ ...currentUser, estado: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Complemento</label>
                      <input type="text" value={currentUser.complemento} onChange={(e) => setCurrentUser({ ...currentUser, complemento: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-800">
                  <button type="submit" className="bg-[#2b88c4] hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl shadow-lg flex items-center gap-2">
                    <Save size={18} /> {t('save')}
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: SOLICITAR SERVIÇO */}
      {reqModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => reqModal.status === 'idle' && setReqModal({ open: false, servKey: '', status: 'idle', desc: '' })}></div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-transparent dark:border-slate-800 w-full max-w-lg z-10 overflow-hidden">
            {reqModal.status === 'idle' && (
              <>
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t(reqModal.servKey)}</h3>
                  <button onClick={() => setReqModal({ open: false, servKey: '', status: 'idle', desc: '' })} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmitRequest} className="p-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('describe_issue')}</label>
                  <textarea
                    required
                    value={reqModal.desc}
                    onChange={(e) => setReqModal(prev => ({ ...prev, desc: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl outline-none resize-none h-32 text-sm"
                  />
                  <div className="flex justify-end gap-3 mt-5">
                    <button type="button" onClick={() => setReqModal({ open: false, servKey: '', status: 'idle', desc: '' })} className="px-5 py-2.5 text-sm border border-gray-300 dark:border-slate-700 rounded-lg">{t('cancel')}</button>
                    <button type="submit" className="px-5 py-2.5 text-sm text-white bg-[#2b88c4] hover:bg-blue-700 rounded-lg font-medium">{t('send_request')}</button>
                  </div>
                </form>
              </>
            )}
            {reqModal.status === 'processing' && (
              <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-[#2b88c4] rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('processing_request')}</h3>
              </div>
            )}
            {reqModal.status === 'success' && (
              <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={40} className="text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('request_success')}</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: DETALHES DO CHAMADO */}
      {viewingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setViewingTicket(null)}></div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-transparent dark:border-slate-800 w-full max-w-lg z-10 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chamado {viewingTicket.id}</h3>
              <button onClick={() => setViewingTicket(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <p><strong>Serviço:</strong> {t(viewingTicket.servKey) || viewingTicket.servKey}</p>
              <p><strong>Data:</strong> {viewingTicket.date}</p>
              <div>
                <p className="font-semibold mb-1">Descrição enviada:</p>
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 whitespace-pre-wrap">
                  {viewingTicket.desc}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center">
              {viewingTicket.status === 'pending' ? (
                <button
                  type="button"
                  onClick={(e) => handleRequestDeleteTicket(e, viewingTicket)}
                  className="px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 size={15} /> {t('delete_ticket')}
                </button>
              ) : (
                <div />
              )}
              <button onClick={() => setViewingTicket(null)} className="px-5 py-2 text-sm text-white bg-[#2b88c4] rounded-lg">{t('close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO DE CHAMADO */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setTicketToDelete(null)}></div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-transparent dark:border-slate-800 w-full max-w-md z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-950/60 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={26} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {t('confirm_delete_title')} ({ticketToDelete.id})
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                {t('confirm_delete_desc')}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setTicketToDelete(null)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteTicket}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-500/20"
                >
                  {t('confirm_delete_btn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {payModal.open && payModal.invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button aria-label={t('close')} className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setPayModal({ open: false, invoice: null, status: 'idle' })} />
          <section role="dialog" aria-modal="true" aria-labelledby="payment-unavailable-title" className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 id="payment-unavailable-title" className="text-lg font-bold">{t('checkout_title')}</h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Pagamento online ainda não está configurado. Nenhum dado de cartão será solicitado ou processado.</p>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setPayModal({ open: false, invoice: null, status: 'idle' })} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{t('close')}</button>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}

function SidebarBtn({ icon, label, active, badge, onClick }: { icon: React.ReactNode; label: string; active: boolean; badge?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-left ${
        active
          ? 'bg-gray-200 dark:bg-slate-800 border-l-4 border-[#2b88c4] dark:border-sky-400 text-[#2b88c4] dark:text-sky-400 font-semibold'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}
