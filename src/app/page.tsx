"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Menu, X, Cpu, Lock, ArrowRight, Zap,
  Wrench, Laptop, Network, Headset, Code, Car, Home,
  Store, Building, UserPlus, LogIn, Clock, FileText,
  Globe, Award, Phone, Mail, MapPin, Check, CheckCircle,
  ChevronRight, Server
} from 'lucide-react';

/* ==========================================
 * DICIONÁRIO DE TRADUÇÕES (LANDING PAGE)
 * ========================================== */
const siteTranslations: any = {
  pt: {
    "nav-services": "Serviços",
    "nav-contact": "Contato",
    "nav-about": "Sobre Nós",
    "nav-client-area": "Área do Cliente",
    "hero-title-1": "A tecnologia a favor do seu",
    "hero-title-highlight": "sucesso e tranquilidade.",
    "hero-desc": "Engenharia de suporte técnico, manutenção preventiva e arquitetura de redes de alta disponibilidade para residências e empresas. Atendimento ágil e bilíngue (PT/EN).",
    "hero-btn-req": "Solicitar Atendimento",
    "hero-btn-rem": "Portal do Cliente",
    "srv-label": "Ecossistema de Serviços",
    "srv-title": "Precisão técnica para cada desafio",
    "srv-desc": "Diagnosticamos, otimizamos e blindamos seu ambiente digital com processos corporativos de padrão internacional.",
    "s1-title": "Suporte & Manutenção",
    "s1-desc": "Computadores e estações operando com máxima estabilidade, velocidade e zero travamentos.",
    "s1-l1": "Diagnóstico avançado e reparo de hardware.",
    "s1-l2": "Limpeza térmica e otimização profunda de OS.",
    "s1-l3": "Prevenção contra falhas e perda de dados.",
    "s2-title": "Hardware & Sistemas",
    "s2-desc": "Upgrades estratégicos e implantação limpa de sistemas para extrair 100% da sua máquina.",
    "s2-l1": "Instalação e configuração Windows / macOS.",
    "s2-l2": "Upgrades de performance (NVMe SSD & RAM).",
    "s2-l3": "Integração de impressoras e periféricos.",
    "s3-title": "Redes & Wi-Fi Mesh",
    "s3-desc": "Cobertura total sem zonas mortas, baixa latência e segurança de ponta a ponta.",
    "s3-l1": "Cabeamento estruturado e organização de rack.",
    "s3-l2": "Firewall, VLANs e segmentação segura.",
    "s3-l3": "Projetos de Wi-Fi Mesh de alta densidade.",
    "s4-title": "Suporte Remoto Instantâneo",
    "s4-desc": "Resolução imediata de software, e-mails e configurações críticas via conexão criptografada, sem esperar visita técnica.",
    "s5-title": "Engenharia Web & Landing Pages",
    "s5-desc": "Interfaces rápidas, responsivas e otimizadas para conversão e posicionamento no Google.",
    "s5-l1": "Design moderno de alta conversão.",
    "s5-l2": "Performance máxima em mobile e desktop.",
    "s5-l3": "Arquitetura preparada para SEO.",
    "s6-title": "Atendimento On-Site & Corporativo",
    "s6-desc": "Atuação presencial especializada sob medida para a escala da sua operação:",
    "s6-b1-title": "Residências Inteligentes",
    "s6-b1-desc": "Automação, workstations home-office e Wi-Fi uniforme em todos os ambientes.",
    "s6-b2-title": "Pequenas Empresas",
    "s6-b2-desc": "Redes locais estáveis, sistemas PDV e rotinas automatizadas de backup.",
    "s6-b3-title": "Médias Empresas",
    "s6-b3-desc": "Gestão contínua de infraestrutura, servidores locais e governança de dados.",
    "cta-title": "Pronto para elevar o nível da sua infraestrutura?",
    "cta-desc": "Crie sua conta gratuita em segundos e acompanhe chamados, diagnósticos e faturas em tempo real.",
    "cta-btn-create": "Criar Conta Gratuita",
    "cta-btn-login": "Acessar Painel",
    "cta-f1-title": "Abertura Expressa",
    "cta-f1-desc": "Solicite suporte técnico em poucos cliques.",
    "cta-f2-title": "Rastreabilidade Total",
    "cta-f2-desc": "Histórico completo de cada intervenção.",
    "cta-f3-title": "Faturamento Transparente",
    "cta-f3-desc": "Invoices em BRL, AUD ou USD com checkout seguro.",
    "abt-label": "Liderança & Experiência",
    "abt-role": "Fundador & Especialista em Infraestrutura de TI",
    "abt-p1": "Com <strong>mais de 20 anos de experiência</strong>, lidero pessoalmente os projetos da Marchetti Solutions, entregando soluções sólidas desde ambientes residenciais exigentes até infraestruturas corporativas.",
    "abt-p2": "Nos últimos 5 anos, integrei a equipe de tecnologia do prestigiado <strong>Brisbane Racing Club</strong>, na Austrália — vivência internacional que consolidou padrões rigorosos de disponibilidade, SLA e segurança operacional.",
    "abt-p3": "Hoje, trago essa engenharia corporativa diretamente para a sua empresa ou residência com atendimento próximo, transparente e bilíngue.",
    "abt-b1": "Padrão Internacional (BR / AU)",
    "abt-b2": "20+ Anos de Experiência",
    "log-back": "Voltar ao início",
    "log-title": "Portal do Cliente",
    "log-desc": "Acompanhe chamados técnicos em tempo real, aprove orçamentos e gerencie suas faturas.",
    "log-new-title": "Novo por aqui?",
    "log-new-desc": "Crie sua conta gratuita para abrir seu primeiro chamado agora.",
    "log-btn-new": "Criar Conta",
    "log-form-title": "Entrar na Marchetti Solutions",
    "log-form-desc": "Insira suas credenciais para acessar seu workspace",
    "log-lbl-email": "E-mail",
    "log-lbl-pass": "Senha",
    "log-forgot": "Esqueceu a senha?",
    "log-btn-enter": "Continuar com E-mail",
    "reg-back": "Voltar para Login",
    "reg-title": "Criar Conta",
    "reg-desc": "Cadastre-se em menos de 1 minuto para acessar o painel exclusivo de suporte.",
    "reg-has-title": "Já possui cadastro?",
    "reg-has-desc": "Faça login para visualizar seus chamados e faturas.",
    "reg-btn-login": "Fazer Login",
    "reg-form-title": "Comece agora",
    "reg-form-desc": "Preencha seus dados básicos para ativar seu acesso ao portal.",
    "reg-lbl-name": "Nome Completo",
    "reg-lbl-phone": "Telefone / WhatsApp",
    "reg-lbl-email": "E-mail",
    "reg-lbl-pass": "Senha (mín. 8 caracteres)",
    "reg-btn-create": "Criar Minha Conta",
    "reg-lbl-pass-confirm": "Confirmar Senha",
    "processing_auth": "Configurando seu workspace...",
    "auth_success": "Conta criada com sucesso!",
    "redirecting": "Redirecionando para o painel...",
    "auth_confirm_email": "Enviamos um link de confirmação para seu e-mail. Confirme-o para acessar o portal.",
    "auth_email_exists": "Este e-mail já possui uma conta. Faça login ou redefina sua senha.",
    "auth_signup_error": "Não foi possível criar a conta. Verifique os dados e tente novamente.",
    "auth_login_error": "E-mail ou senha inválidos.",
    "auth_email_not_confirmed": "Confirme seu e-mail pelo link enviado antes de entrar.",
    "err_pass_match": "As senhas não coincidem.",
    "processing_login": "Autenticando credenciais...",
    "login_success": "Acesso autorizado!",
    "pass_strength": "Força da senha:",
    "pass_weak": "Fraca (mín. 8 caracteres)",
    "pass_medium": "Média",
    "pass_strong": "Forte",
    "ft-desc": "Engenharia de suporte técnico, redes de alta performance e soluções digitais com padrão internacional.",
    "ft-contact-title": "Canais de Atendimento",
    "ft-phone-label": "Telefone / WhatsApp",
    "ft-email-label": "E-mail Direto",
    "ft-loc-label": "Base Operacional",
    "ft-loc-val": "Rio de Janeiro, Brasil • Brisbane, Austrália",
    "ft-copy": "© 2026 Marchetti Solutions. Todos os direitos reservados.",
    "ft-rights": "IT Infrastructure & Support Engineering",
    "toast_lang": "Idioma alterado para Português!"
  },
  en: {
    "nav-services": "Services",
    "nav-contact": "Contact",
    "nav-about": "About",
    "nav-client-area": "Client Portal",
    "hero-title-1": "Technology engineered for your",
    "hero-title-highlight": "success and peace of mind.",
    "hero-desc": "Technical support engineering, preventive maintenance, and high-availability network architecture for homes and businesses. Fast bilingual service (EN/PT).",
    "hero-btn-req": "Request Support",
    "hero-btn-rem": "Client Portal",
    "srv-label": "Service Ecosystem",
    "srv-title": "Technical precision for every challenge",
    "srv-desc": "We diagnose, optimize, and harden your digital environment using enterprise-grade international processes.",
    "s1-title": "Support & Maintenance",
    "s1-desc": "Workstations and computers running at peak speed, stability, and zero crashes.",
    "s1-l1": "Advanced diagnostics and hardware repair.",
    "s1-l2": "Thermal cleaning and deep OS optimization.",
    "s1-l3": "Failure prevention and data loss protection.",
    "s2-title": "Hardware & Systems",
    "s2-desc": "Strategic hardware upgrades and clean OS deployments to unlock 100% performance.",
    "s2-l1": "Windows / macOS installation and setup.",
    "s2-l2": "Speed upgrades (NVMe SSD & RAM).",
    "s2-l3": "Printers and peripherals integration.",
    "s3-title": "Networking & Wi-Fi Mesh",
    "s3-desc": "Seamless coverage with zero dead zones, low latency, and end-to-end security.",
    "s3-l1": "Structured cabling and rack organization.",
    "s3-l2": "Firewalls, VLANs, and secure segmentation.",
    "s3-l3": "High-density Wi-Fi Mesh deployments.",
    "s4-title": "Instant Remote Support",
    "s4-desc": "Immediate resolution for software, email, and critical settings via encrypted connection without waiting for an on-site visit.",
    "s5-title": "Web Engineering & Landing Pages",
    "s5-desc": "Fast, responsive interfaces built for conversion and search engine visibility.",
    "s5-l1": "High-converting modern design.",
    "s5-l2": "Peak performance on mobile and desktop.",
    "s5-l3": "SEO-ready architecture.",
    "s6-title": "On-Site & Enterprise Operations",
    "s6-desc": "Specialized on-site engineering tailored to the scale of your environment:",
    "s6-b1-title": "Smart Homes",
    "s6-b1-desc": "Home automation, home-office workstations, and seamless whole-home Wi-Fi.",
    "s6-b2-title": "Small Businesses",
    "s6-b2-desc": "Reliable local networks, POS systems, and automated backup routines.",
    "s6-b3-title": "Medium Enterprises",
    "s6-b3-desc": "Continuous infrastructure management, local servers, and data governance.",
    "cta-title": "Ready to upgrade your tech infrastructure?",
    "cta-desc": "Create your free account in seconds and track support tickets, diagnostics, and invoices in real time.",
    "cta-btn-create": "Create Free Account",
    "cta-btn-login": "Access Portal",
    "cta-f1-title": "Express Dispatch",
    "cta-f1-desc": "Request technical support in just a few clicks.",
    "cta-f2-title": "Full Traceability",
    "cta-f2-desc": "Complete history of every technical intervention.",
    "cta-f3-title": "Transparent Billing",
    "cta-f3-desc": "Invoices in BRL, AUD, or USD with secure checkout.",
    "abt-label": "Leadership & Track Record",
    "abt-role": "Founder & IT Infrastructure Specialist",
    "abt-p1": "With <strong>over 20 years of experience</strong>, I personally lead Marchetti Solutions projects, delivering resilient setups from demanding home offices to enterprise infrastructures.",
    "abt-p2": "For the past 5 years, I worked on the IT team at the prestigious <strong>Brisbane Racing Club</strong> in Australia — an international background that solidified strict standards of uptime, SLA, and operational security.",
    "abt-p3": "Today, I bring that enterprise engineering directly to your business or home with transparent, responsive, bilingual support.",
    "abt-b1": "Global Standard (BR / AU)",
    "abt-b2": "20+ Years Experience",
    "log-back": "Back to home",
    "log-title": "Client Portal",
    "log-desc": "Track live support tickets, approve quotes, and manage your invoices.",
    "log-new-title": "New to Marchetti?",
    "log-new-desc": "Create your free account to open your first ticket now.",
    "log-btn-new": "Sign Up",
    "log-form-title": "Sign in to Marchetti Solutions",
    "log-form-desc": "Enter your credentials to access your workspace",
    "log-lbl-email": "Email",
    "log-lbl-pass": "Password",
    "log-forgot": "Forgot password?",
    "log-btn-enter": "Continue with Email",
    "reg-back": "Back to Login",
    "reg-title": "Create Account",
    "reg-desc": "Sign up in under a minute to access your dedicated support portal.",
    "reg-has-title": "Already have an account?",
    "reg-has-desc": "Sign in to view your active tickets and invoices.",
    "reg-btn-login": "Sign In",
    "reg-form-title": "Get started",
    "reg-form-desc": "Fill in your details to activate your client portal.",
    "reg-lbl-name": "Full Name",
    "reg-lbl-phone": "Phone / WhatsApp",
    "reg-lbl-email": "Email",
    "reg-lbl-pass": "Password (min. 8 chars)",
    "reg-btn-create": "Create Account",
    "reg-lbl-pass-confirm": "Confirm Password",
    "processing_auth": "Setting up your workspace...",
    "auth_success": "Account created successfully!",
    "redirecting": "Redirecting to portal...",
    "auth_confirm_email": "We sent a confirmation link to your email. Confirm it to access the portal.",
    "auth_email_exists": "An account already uses this email. Sign in or reset your password.",
    "auth_signup_error": "Could not create the account. Check your details and try again.",
    "auth_login_error": "Invalid email or password.",
    "auth_email_not_confirmed": "Confirm your email using the link we sent before signing in.",
    "err_pass_match": "Passwords do not match.",
    "processing_login": "Authenticating credentials...",
    "login_success": "Access granted!",
    "pass_strength": "Password strength:",
    "pass_weak": "Weak (min. 8 chars)",
    "pass_medium": "Medium",
    "pass_strong": "Strong",
    "ft-desc": "Technical support engineering, high-performance networks, and digital solutions built to international standards.",
    "ft-contact-title": "Contact Channels",
    "ft-phone-label": "Phone / WhatsApp",
    "ft-email-label": "Direct Email",
    "ft-loc-label": "Operations",
    "ft-loc-val": "Rio de Janeiro, Brazil • Brisbane, Australia",
    "ft-copy": "© 2026 Marchetti Solutions. All rights reserved.",
    "ft-rights": "IT Infrastructure & Support Engineering",
    "toast_lang": "Language changed to English!"
  }
};

export default function LandingPage() {
  const [lang, setLang] = useState('pt');
  const [view, setView] = useState<'home' | 'login' | 'register'>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [authStatus, setAuthStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [isRedirectingAdmin, setIsRedirectingAdmin] = useState(false);
  const [isLeavingClientArea, setIsLeavingClientArea] = useState(false);
  const [regPassword, setRegPassword] = useState('');
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);

  const t = (key: string) => (siteTranslations[lang] && siteTranslations[lang][key]) || key;

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: '', color: 'bg-white/10', width: 'w-0' };
    if (pwd.length < 8) return { level: 1, label: t('pass_weak'), color: 'bg-rose-500', width: 'w-1/3' };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const score = (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
    if (score >= 2) return { level: 3, label: t('pass_strong'), color: 'bg-sky-400', width: 'w-full' };
    return { level: 2, label: t('pass_medium'), color: 'bg-amber-400', width: 'w-2/3' };
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const changeLanguage = (newLang: string) => {
    setLang(newLang);
    showToast(siteTranslations[newLang]['toast_lang']);
  };

  const navigateToRoute = (path: string) => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        window.location.assign(path);
      }
    } catch {
      showToast(`Navegando para ${path}`);
    }
  };

  const handleAdminAccess = () => {
    setIsRedirectingAdmin(true);
    setTimeout(() => {
      navigateToRoute('/admin');
    }, 1500);
  };

  const handleLeaveClientArea = () => {
    setIsLeavingClientArea(true);
    setTimeout(() => {
      setIsLeavingClientArea(false);
      setAuthStatus('idle');
      setView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 900);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleNavClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (view !== 'home') {
      setView('home');
      setTimeout(() => scrollToSection(sectionId), 150);
    } else {
      scrollToSection(sectionId);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('loginEmail') || '').trim().toLowerCase();
    const password = String(formData.get('loginPassword') || '');

    setAuthStatus('processing');
    setRequiresEmailConfirmation(false);

    try {
      const { data, error } = await createClient().auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        setAuthStatus('idle');
        showToast(error?.code === 'email_not_confirmed' ? t('auth_email_not_confirmed') : t('auth_login_error'));
        return;
      }

      setAuthStatus('success');
      setTimeout(() => navigateToRoute('/client'), 1200);
    } catch {
      setAuthStatus('idle');
      showToast(t('auth_login_error'));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const passConfirm = String(formData.get('passConfirm') || '');

    if (regPassword !== passConfirm) {
      showToast(t('err_pass_match'));
      return;
    }

    setAuthStatus('processing');
    setRequiresEmailConfirmation(false);

    try {
      const { data, error } = await createClient().auth.signUp({
        email,
        password: regPassword,
        options: {
          data: { display_name: name, phone },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/client`,
        },
      });

      if (error) {
        setAuthStatus('idle');
        showToast(error.code === 'user_already_exists' ? t('auth_email_exists') : t('auth_signup_error'));
        return;
      }

      if (!data.user || data.user.identities?.length === 0) {
        setAuthStatus('idle');
        showToast(data.user ? t('auth_email_exists') : t('auth_signup_error'));
        return;
      }

      const needsEmailConfirmation = !data.session;
      setRequiresEmailConfirmation(needsEmailConfirmation);
      setAuthStatus('success');
      if (!needsEmailConfirmation) {
        setTimeout(() => navigateToRoute('/client'), 1200);
      }
    } catch {
      setAuthStatus('idle');
      showToast(t('auth_signup_error'));
    }
  };

  return (
    <div className="landing-page font-sans text-zinc-100 bg-[#050507] antialiased selection:bg-blue-500 selection:text-white min-h-screen relative overflow-x-hidden">
      {/* Background Ambient Glows & Subtle Grid (Resend Style) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '64px 64px'
          }}
        />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[440px] rounded-full bg-gradient-to-b from-blue-600/25 via-sky-500/10 to-transparent blur-[120px]" />
      </div>

      {/* ADMIN LOADING OVERLAY */}
      {isRedirectingAdmin && (
        <div className="fixed inset-0 z-[120] bg-[#050507]/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="w-12 h-12 border-2 border-white/15 border-t-sky-400 rounded-full animate-spin mb-5" />
          <h3 className="text-lg font-semibold text-white tracking-tight mb-1">
            {lang === 'pt' ? 'Acessando Painel Administrativo...' : 'Accessing Admin Console...'}
          </h3>
          <p className="text-xs text-zinc-400">
            {lang === 'pt' ? 'Preparando ambiente de gestão segura...' : 'Preparing secure management console...'}
          </p>
        </div>
      )}

      {/* CLIENT AREA EXIT OVERLAY */}
      {isLeavingClientArea && (
        <div className="fixed inset-0 z-[120] bg-[#050507]/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="w-12 h-12 border-2 border-white/15 border-t-sky-400 rounded-full animate-spin mb-5" />
          <h3 className="text-lg font-semibold text-white tracking-tight mb-1">
            {lang === 'pt' ? 'Retornando à página inicial...' : 'Returning to homepage...'}
          </h3>
        </div>
      )}

      {/* Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-[100] transform transition-all duration-300 ${
          toast.show ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-zinc-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-xl border border-white/15 shadow-2xl flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      </div>

      {view === 'home' && (
        <div className="relative z-10">
          {/* NAVBAR GLASSMINIMAL */}
          <nav
            className={`fixed w-full z-50 transition-all duration-300 ${
              isScrolled
                ? 'bg-[#050507]/80 backdrop-blur-xl border-b border-white/[0.08]'
                : 'bg-transparent border-b border-transparent'
            }`}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-20">
                {/* Logo */}
                <div
                  className="flex items-center gap-2.5 cursor-pointer group"
                  onClick={(e) => handleNavClick(e, 'inicio')}
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white via-sky-100 to-blue-500 p-[1px] shadow-lg shadow-blue-500/20">
                    <div className="w-full h-full bg-[#090d16] rounded-[11px] flex items-center justify-center text-sky-400 group-hover:text-white transition-colors">
                      <Cpu size={19} />
                    </div>
                  </div>
                  <span className="font-semibold text-lg tracking-tight text-white flex items-center gap-1.5">
                    <span>Marchetti</span>
                    <span className="text-sky-400 font-light">Solutions</span>
                  </span>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                  <a
                    href="#servicos"
                    onClick={(e) => handleNavClick(e, 'servicos')}
                    className="text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {t('nav-services')}
                  </a>
                  <a
                    href="#sobre"
                    onClick={(e) => handleNavClick(e, 'sobre')}
                    className="text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {t('nav-about')}
                  </a>
                  <a
                    href="#contato"
                    onClick={(e) => handleNavClick(e, 'contato')}
                    className="text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {t('nav-contact')}
                  </a>

                  {/* Language Switcher */}
                  <div className="flex items-center gap-2 border-l border-white/10 pl-5">
                    <button
                      onClick={() => changeLanguage('pt')}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                        lang === 'pt'
                          ? 'bg-white/10 text-white border border-white/15'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <img src="https://flagcdn.com/w20/br.png" alt="PT" className="w-4 h-3 rounded-[2px] object-cover" />
                      PT
                    </button>
                    <button
                      onClick={() => changeLanguage('en')}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                        lang === 'en'
                          ? 'bg-white/10 text-white border border-white/15'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <img src="https://flagcdn.com/w20/au.png" alt="EN" className="w-4 h-3 rounded-[2px] object-cover" />
                      EN
                    </button>
                  </div>

                  {/* CTA Pill (White High-Contrast Resend Button) */}
                  <button
                    onClick={() => {
                      setView('login');
                      setAuthStatus('idle');
                    }}
                    className="bg-white text-zinc-950 hover:bg-sky-50 px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 shadow-[0_0_25px_rgba(56,189,248,0.25)]"
                  >
                    <span>{t('nav-client-area')}</span>
                    <ChevronRight size={15} />
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-zinc-300 hover:text-white p-2"
                  >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Dropdown */}
            {isMobileMenuOpen && (
              <div className="md:hidden bg-[#090a0f]/95 backdrop-blur-xl border-b border-white/10 px-6 py-6 space-y-4">
                <a
                  href="#servicos"
                  onClick={(e) => handleNavClick(e, 'servicos')}
                  className="block text-sm font-medium text-zinc-300 hover:text-white"
                >
                  {t('nav-services')}
                </a>
                <a
                  href="#sobre"
                  onClick={(e) => handleNavClick(e, 'sobre')}
                  className="block text-sm font-medium text-zinc-300 hover:text-white"
                >
                  {t('nav-about')}
                </a>
                <a
                  href="#contato"
                  onClick={(e) => handleNavClick(e, 'contato')}
                  className="block text-sm font-medium text-zinc-300 hover:text-white"
                >
                  {t('nav-contact')}
                </a>

                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                  <button
                    onClick={() => changeLanguage('pt')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                      lang === 'pt' ? 'bg-white/15 text-white' : 'text-zinc-400'
                    }`}
                  >
                    <img src="https://flagcdn.com/w20/br.png" alt="PT" className="w-4 h-3 rounded-[2px]" /> PT
                  </button>
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                      lang === 'en' ? 'bg-white/15 text-white' : 'text-zinc-400'
                    }`}
                  >
                    <img src="https://flagcdn.com/w20/au.png" alt="EN" className="w-4 h-3 rounded-[2px]" /> EN
                  </button>
                </div>

                <button
                  onClick={() => {
                    setView('login');
                    setAuthStatus('idle');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Lock size={15} /> {t('nav-client-area')}
                </button>
              </div>
            )}
          </nav>

          {/* HERO SECTION (Resend-Inspired Centered Editorial + Live Telemetry Card) */}
          <header id="inicio" className="pt-36 pb-24 lg:pt-44 lg:pb-32 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto text-center">
              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-bold tracking-tight leading-[1.06] text-white mb-6">
                {t('hero-title-1')}{' '}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-300 to-blue-500">
                  {t('hero-title-highlight')}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
                {t('hero-desc')}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => {
                    setView('register');
                    setAuthStatus('idle');
                  }}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white text-zinc-950 hover:bg-sky-50 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(59,130,246,0.35)]"
                >
                  <span>{t('hero-btn-req')}</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => {
                    setView('login');
                    setAuthStatus('idle');
                  }}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/10 font-medium text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Headset size={16} className="text-sky-400" />
                  <span>{t('hero-btn-rem')}</span>
                </button>
              </div>

            </div>
          </header>

          {/* SERVIÇOS — BENTO GRID 2026 */}
          <section id="servicos" className="py-24 border-t border-white/[0.07] px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="max-w-2xl mb-16">
                <p className="text-xs font-semibold uppercase tracking-widest text-sky-400 mb-3">
                  {t('srv-label')}
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                  {t('srv-title')}
                </h2>
                <p className="text-zinc-400 text-base leading-relaxed">{t('srv-desc')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <BentoServiceCard
                  icon={<Wrench size={22} />}
                  title={t('s1-title')}
                  desc={t('s1-desc')}
                  bullets={[t('s1-l1'), t('s1-l2'), t('s1-l3')]}
                />
                <BentoServiceCard
                  icon={<Laptop size={22} />}
                  title={t('s2-title')}
                  desc={t('s2-desc')}
                  bullets={[t('s2-l1'), t('s2-l2'), t('s2-l3')]}
                />
                <BentoServiceCard
                  icon={<Network size={22} />}
                  title={t('s3-title')}
                  desc={t('s3-desc')}
                  bullets={[t('s3-l1'), t('s3-l2'), t('s3-l3')]}
                />
                <BentoServiceCard
                  icon={<Headset size={22} />}
                  title={t('s4-title')}
                  desc={t('s4-desc')}
                />
                <BentoServiceCard
                  icon={<Code size={22} />}
                  title={t('s5-title')}
                  desc={t('s5-desc')}
                  bullets={[t('s5-l1'), t('s5-l2'), t('s5-l3')]}
                />
                <div className="rounded-2xl bg-gradient-to-br from-blue-600/20 via-[#0b101d] to-[#080a10] border border-sky-500/25 p-7 flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-300 mb-5">
                      <Server size={22} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">SLA & Monitoramento</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {lang === 'pt'
                        ? 'Planos contínuos de prevenção para empresas que não podem parar.'
                        : 'Continuous preventive plans for businesses that cannot afford downtime.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setView('register');
                      setAuthStatus('idle');
                    }}
                    className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 hover:text-white transition-colors"
                  >
                    <span>{t('hero-btn-req')}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Full-width On-Site & Enterprise Bento Card */}
                <div className="md:col-span-2 lg:col-span-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] p-8 sm:p-10 mt-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-white/[0.07]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-400/25 flex items-center justify-center text-sky-400 shrink-0">
                        <Car size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{t('s6-title')}</h3>
                        <p className="text-sm text-zinc-400 mt-1">{t('s6-desc')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                    <SubBentoCard icon={<Home size={20} />} title={t('s6-b1-title')} desc={t('s6-b1-desc')} />
                    <SubBentoCard icon={<Store size={20} />} title={t('s6-b2-title')} desc={t('s6-b2-desc')} />
                    <SubBentoCard icon={<Building size={20} />} title={t('s6-b3-title')} desc={t('s6-b3-desc')} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SOBRE NÓS — FOUNDER CREDENTIALS */}
          <section id="sobre" className="py-24 border-t border-white/[0.07] px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="rounded-3xl bg-gradient-to-b from-white/[0.05] to-transparent border border-white/[0.08] p-8 sm:p-12">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-8 border-b border-white/[0.08]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-sky-400 mb-2">
                      {t('abt-label')}
                    </p>
                    <h2 className="text-3xl font-bold text-white">Thalles Marchetti</h2>
                    <p className="text-sm text-zinc-400 mt-1">{t('abt-role')}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-medium text-zinc-200">
                      <Globe size={16} className="text-sky-400" />
                      <span>{t('abt-b1')}</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-medium text-zinc-200">
                      <Award size={16} className="text-sky-400" />
                      <span>{t('abt-b2')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-zinc-300 text-base leading-relaxed [&_strong]:text-white [&_strong]:font-semibold">
                  <p dangerouslySetInnerHTML={{ __html: t('abt-p1') }} />
                  <p dangerouslySetInnerHTML={{ __html: t('abt-p2') }} />
                  <p dangerouslySetInnerHTML={{ __html: t('abt-p3') }} />
                </div>
              </div>
            </div>
          </section>

          {/* CTA SECTION — HIGH CONTRAST BLUE/WHITE */}
          <section id="contato" className="py-24 border-t border-white/[0.07] px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-blue-600/20 via-[#0a0f1c] to-[#050507] border border-sky-400/25 p-8 sm:p-14 text-center relative overflow-hidden">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[220px] bg-sky-400/20 blur-[90px] pointer-events-none" />

              <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-5 relative z-10">
                {t('cta-title')}
              </h2>
              <p className="text-zinc-300 text-base sm:text-lg max-w-2xl mx-auto mb-9 relative z-10">
                {t('cta-desc')}
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 relative z-10">
                <button
                  onClick={() => {
                    setView('register');
                    setAuthStatus('idle');
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-zinc-950 hover:bg-sky-50 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  <UserPlus size={16} />
                  <span>{t('cta-btn-create')}</span>
                </button>
                <button
                  onClick={() => {
                    setView('login');
                    setAuthStatus('idle');
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/15 font-medium text-sm transition-all flex items-center justify-center gap-2"
                >
                  <LogIn size={16} />
                  <span>{t('cta-btn-login')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-14 pt-10 border-t border-white/10 text-left relative z-10">
                <FeaturePill icon={<Zap size={18} />} title={t('cta-f1-title')} desc={t('cta-f1-desc')} />
                <FeaturePill icon={<Clock size={18} />} title={t('cta-f2-title')} desc={t('cta-f2-desc')} />
                <FeaturePill icon={<FileText size={18} />} title={t('cta-f3-title')} desc={t('cta-f3-desc')} />
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="border-t border-white/[0.08] bg-[#040406] py-16 px-4 sm:px-6 lg:px-8 text-zinc-400">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/[0.07]">
                <div className="md:col-span-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Cpu size={18} />
                    </div>
                    <span className="font-semibold text-lg tracking-tight text-white flex items-center gap-1.5">
                      <span>Marchetti</span>
                      <span className="text-sky-400 font-light">Solutions</span>
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">{t('ft-desc')}</p>
                </div>

                <div className="md:col-span-6 md:col-start-7">
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-white mb-5">
                    {t('ft-contact-title')}
                  </h4>
                  <ul className="space-y-3.5 text-sm">
                    <li className="flex items-center gap-3">
                      <Phone size={16} className="text-sky-400 shrink-0" />
                      <span>{t('ft-phone-label')}: (XX) XXXX-XXXX</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Mail size={16} className="text-sky-400 shrink-0" />
                      <span>contato@marchettisolutions.com.br</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <MapPin size={16} className="text-sky-400 shrink-0" />
                      <span>{t('ft-loc-val')}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
                <p>{t('ft-copy')}</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleAdminAccess}
                    className="text-zinc-400 hover:text-sky-400 transition-colors font-medium"
                  >
                    Admin Console
                  </button>
                  <span>•</span>
                  <span>{t('ft-rights')}</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* ==========================================
       * LOGIN VIEW (RESEND MINIMALIST AUTH CARD)
       * ========================================== */}
      {view === 'login' && (
        <div className="min-h-screen relative z-10 flex flex-col justify-between p-6 sm:p-10">
          {/* Top Bar */}
          <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
            <button
              onClick={handleLeaveClientArea}
              className="text-xs sm:text-sm text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"
            >
              <ArrowRight className="rotate-180" size={16} />
              <span>{t('log-back')}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => changeLanguage('pt')}
                className={`px-2.5 py-1 rounded-md text-xs ${
                  lang === 'pt' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                PT
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2.5 py-1 rounded-md text-xs ${
                  lang === 'en' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Centered Auth Card */}
          <div className="w-full max-w-md mx-auto my-auto py-10">
            <div className="rounded-3xl bg-gradient-to-b from-white/[0.12] to-white/[0.03] p-[1px] shadow-[0_25px_80px_-15px_rgba(37,99,235,0.3)]">
              <div className="bg-[#090b10] rounded-[23px] p-8 sm:p-10 relative min-h-[430px] flex flex-col justify-center">
                {authStatus === 'idle' && (
                  <div className="animate-in fade-in duration-300">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400/20 to-blue-600/20 border border-sky-400/30 flex items-center justify-center text-sky-400 mb-6">
                      <Cpu size={22} />
                    </div>

                    <h2 className="text-2xl font-bold text-white tracking-tight mb-1.5">
                      {t('log-form-title')}
                    </h2>
                    <p className="text-sm text-zinc-400 mb-7">{t('log-form-desc')}</p>

                    <form
                      onSubmit={handleAuthSubmit}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                          {t('log-lbl-email')}
                        </label>
                        <input
                          type="email"
                          name="loginEmail"
                          required
                          placeholder="voce@empresa.com"
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 text-sm outline-none focus:border-sky-400 transition-colors"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-medium text-zinc-300">
                            {t('log-lbl-pass')}
                          </label>
                          <a
                            href="/forgot-password?next=/client"
                            className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                          >
                            {t('log-forgot')}
                          </a>
                        </div>
                        <input
                          type="password"
                          name="loginPassword"
                          required
                          minLength={8}
                          placeholder="••••••••"
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 text-sm outline-none focus:border-sky-400 transition-colors"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full mt-2 py-3.5 rounded-xl bg-white text-zinc-950 hover:bg-sky-50 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(56,189,248,0.25)]"
                      >
                        <span>{t('log-btn-enter')}</span>
                        <ArrowRight size={16} />
                      </button>
                    </form>

                    <div className="mt-7 pt-6 border-t border-white/[0.08] text-center text-xs text-zinc-400">
                      {t('log-new-title')}{' '}
                      <button
                        onClick={() => {
                          setView('register');
                          setAuthStatus('idle');
                        }}
                        className="text-white font-semibold hover:text-sky-400 underline underline-offset-4 ml-1"
                      >
                        {t('log-btn-new')}
                      </button>
                    </div>
                  </div>
                )}

                {authStatus === 'processing' && (
                  <div className="text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="w-12 h-12 border-2 border-white/15 border-t-sky-400 rounded-full animate-spin mb-5" />
                    <h3 className="text-lg font-semibold text-white">{t('processing_login')}</h3>
                  </div>
                )}

                {authStatus === 'success' && (
                  <div className="text-center flex flex-col items-center justify-center animate-in zoom-in duration-300">
                    <div className="w-16 h-16 rounded-full bg-sky-500/15 border border-sky-400/30 flex items-center justify-center mb-5 text-sky-400">
                      <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{t('login_success')}</h3>
                    <p className="text-xs text-zinc-400">{t('redirecting')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-zinc-600">{t('ft-copy')}</div>
        </div>
      )}

      {/* ==========================================
       * REGISTER VIEW (RESEND MINIMALIST SIGNUP)
       * ========================================== */}
      {view === 'register' && (
        <div className="min-h-screen relative z-10 flex flex-col justify-between p-6 sm:p-10">
          {/* Top Bar */}
          <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
            <button
              onClick={() => {
                setView('login');
                setAuthStatus('idle');
              }}
              className="text-xs sm:text-sm text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"
            >
              <ArrowRight className="rotate-180" size={16} />
              <span>{t('reg-back')}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => changeLanguage('pt')}
                className={`px-2.5 py-1 rounded-md text-xs ${
                  lang === 'pt' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                PT
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2.5 py-1 rounded-md text-xs ${
                  lang === 'en' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Centered Register Card */}
          <div className="w-full max-w-lg mx-auto my-auto py-8">
            <div className="rounded-3xl bg-gradient-to-b from-white/[0.12] to-white/[0.03] p-[1px] shadow-[0_25px_80px_-15px_rgba(37,99,235,0.3)]">
              <div className="bg-[#090b10] rounded-[23px] p-8 sm:p-10 relative min-h-[490px] flex flex-col justify-center">
                {authStatus === 'idle' && (
                  <div className="animate-in fade-in duration-300">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400/20 to-blue-600/20 border border-sky-400/30 flex items-center justify-center text-sky-400 mb-6">
                      <UserPlus size={22} />
                    </div>

                    <h2 className="text-2xl font-bold text-white tracking-tight mb-1.5">
                      {t('reg-form-title')}
                    </h2>
                    <p className="text-sm text-zinc-400 mb-7">{t('reg-form-desc')}</p>

                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                            {t('reg-lbl-name')}
                          </label>
                          <input
                            type="text"
                            name="name"
                            required
                            placeholder="João Silva"
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 text-sm outline-none focus:border-sky-400 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                            {t('reg-lbl-phone')}
                          </label>
                          <input
                            type="text"
                            name="phone"
                            required
                            placeholder="+55 (21) 99999-9999"
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 text-sm outline-none focus:border-sky-400 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                          {t('reg-lbl-email')}
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder="voce@empresa.com"
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 text-sm outline-none focus:border-sky-400 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                            {t('reg-lbl-pass')}
                          </label>
                          <input
                            type="password"
                            name="pass"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            required
                            minLength={8}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 text-sm outline-none focus:border-sky-400 transition-colors"
                          />
                          {regPassword.length > 0 && (
                            <div className="mt-2">
                              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    getPasswordStrength(regPassword).color
                                  } ${getPasswordStrength(regPassword).width}`}
                                />
                              </div>
                              <p className="text-[11px] mt-1 text-zinc-400">
                                {t('pass_strength')}{' '}
                                <span className="text-white font-medium">
                                  {getPasswordStrength(regPassword).label}
                                </span>
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                            {t('reg-lbl-pass-confirm')}
                          </label>
                          <input
                            type="password"
                            name="passConfirm"
                            required
                            minLength={8}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 text-sm outline-none focus:border-sky-400 transition-colors"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full mt-2 py-3.5 rounded-xl bg-white text-zinc-950 hover:bg-sky-50 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(56,189,248,0.25)]"
                      >
                        <span>{t('reg-btn-create')}</span>
                        <ArrowRight size={16} />
                      </button>
                    </form>

                    <div className="mt-7 pt-6 border-t border-white/[0.08] text-center text-xs text-zinc-400">
                      {t('reg-has-title')}{' '}
                      <button
                        onClick={() => {
                          setView('login');
                          setAuthStatus('idle');
                        }}
                        className="text-white font-semibold hover:text-sky-400 underline underline-offset-4 ml-1"
                      >
                        {t('reg-btn-login')}
                      </button>
                    </div>
                  </div>
                )}

                {authStatus === 'processing' && (
                  <div className="text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="w-12 h-12 border-2 border-white/15 border-t-sky-400 rounded-full animate-spin mb-5" />
                    <h3 className="text-lg font-semibold text-white">{t('processing_auth')}</h3>
                  </div>
                )}

                {authStatus === 'success' && (
                  <div className="text-center flex flex-col items-center justify-center animate-in zoom-in duration-300">
                    <div className="w-16 h-16 rounded-full bg-sky-500/15 border border-sky-400/30 flex items-center justify-center mb-5 text-sky-400">
                      <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{t('auth_success')}</h3>
                    <p className="text-xs text-zinc-400">
                      {requiresEmailConfirmation ? t('auth_confirm_email') : t('redirecting')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-zinc-600">{t('ft-copy')}</div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
 * COMPONENTES BENTO & ESTRUTURA
 * ========================================== */

function BentoServiceCard({
  icon,
  title,
  desc,
  bullets
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  bullets?: string[];
}) {
  return (
    <div className="group rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] hover:border-sky-400/30 p-7 transition-all duration-300 flex flex-col justify-between">
      <div>
        <div className="w-11 h-11 rounded-xl bg-white/[0.05] group-hover:bg-sky-500/15 border border-white/10 group-hover:border-sky-400/30 flex items-center justify-center text-sky-400 mb-5 transition-colors">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2.5 tracking-tight">{title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed mb-5">{desc}</p>
      </div>

      {bullets && bullets.length > 0 && (
        <ul className="space-y-2.5 pt-4 border-t border-white/[0.06]">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-300">
              <Check size={14} className="text-sky-400 mt-0.5 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SubBentoCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.07] p-6 hover:border-white/15 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 mb-4">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-white mb-1.5">{title}</h4>
      <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function FeaturePill({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-sky-300 shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
