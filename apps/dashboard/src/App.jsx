import React, { useState, useEffect } from 'react';
import { fetchDatabase, syncSheet } from './services/api';

const INITIAL_ACCOUNTS = [
  { id: 'hana', name: 'Hana Ipot', type: 'Equity', value: 1001050, icon: 'trending_up', color: 'text-tertiary', bg: 'bg-tertiary/20', solidBg: 'bg-tertiary', border: 'border-tertiary/30' },
  { id: 'helmi', name: 'Helmi Stockbit', type: 'Equity', value: 9290289, icon: 'trending_up', color: 'text-secondary', bg: 'bg-secondary/20', solidBg: 'bg-secondary', border: 'border-secondary/30' },
  { id: 'bapak', name: 'Bapak Ipot', type: 'Equity', value: 520717, icon: 'trending_up', color: 'text-primary-fixed', bg: 'bg-primary-fixed/20', solidBg: 'bg-primary-fixed', border: 'border-primary-fixed/30' },
  { id: 'ibuk', name: 'Ibuk Ipot', type: 'Equity', value: 406737, icon: 'trending_up', color: 'text-secondary-fixed', bg: 'bg-secondary-fixed/20', solidBg: 'bg-secondary-fixed', border: 'border-secondary-fixed/30' },
  { id: 'byoh', name: 'Byoh Ajaib', type: 'Equity', value: 1036843, icon: 'trending_up', color: 'text-tertiary-fixed', bg: 'bg-tertiary-fixed/20', solidBg: 'bg-tertiary-fixed', border: 'border-tertiary-fixed/30' },
  { id: 'kb', name: 'KB Valburi', type: 'Equity', value: 1417857, icon: 'show_chart', color: 'text-primary', bg: 'bg-primary/20', solidBg: 'bg-primary', border: 'border-primary/30' },
  { id: 'jago', name: 'Bank Jago (Dana Darurat)', type: 'Savings', value: 339933, icon: 'account_balance', color: 'text-secondary', bg: 'bg-secondary/20', solidBg: 'bg-secondary', border: 'border-secondary/30' },
  { id: 'bca', name: 'BCA (Gaji)', type: 'Savings', value: 1654453, icon: 'account_balance', color: 'text-primary', bg: 'bg-primary/20', solidBg: 'bg-primary', border: 'border-primary/30' },
  { id: 'bonus', name: 'Bonus Mesin CV', type: 'Savings', value: 5000000, icon: 'redeem', color: 'text-primary-fixed', bg: 'bg-primary-fixed/20', solidBg: 'bg-primary-fixed', border: 'border-primary-fixed/30' },
];

const INITIAL_OPERATIONAL = [
  { id: 'makan', name: 'Makan', icon: 'restaurant', value: 750000 },
  { id: 'bensin', name: 'Bensin', icon: 'local_gas_station', value: 150000 },
  { id: 'main', name: 'Main', icon: 'sports_esports', value: 800000 },
  { id: 'paketan', name: 'Paketan', icon: 'wifi', value: 70000 },
  { id: 'moist', name: 'Moist', icon: 'water_drop', value: 42000 },
  { id: 'parfum', name: 'Parfum', icon: 'air', value: 95000 },
  { id: 'kahf', name: 'Kahf', icon: 'face', value: 40000 },
  { id: 'sunscreen', name: 'Sunscreen', icon: 'light_mode', value: 45000 },
  { id: 'sedekah', name: 'Sedekah', icon: 'volunteer_activism', value: 100000 },
  { id: 'capcut', name: 'Capcut', icon: 'movie_edit', value: 23000 },
  { id: 'kos', name: 'Kos kosan', icon: 'home', value: 400000 },
  { id: 'spotify', name: 'Spotify', icon: 'headphones', value: 22000 },
  { id: 'gpt', name: 'Gpt', icon: 'smart_toy', value: 38000 },
  { id: 'vidio', name: 'Vidio.com', icon: 'play_circle', value: 23000 },
  { id: 'saham_hijau', name: 'Saham Hijau', icon: 'compost', value: 190000 },
];

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Investments from './components/Investments';
import Savings from './components/Savings';
import Strategy from './components/Strategy';
import Makan from './components/Makan';
import Trading from './components/Trading';
import Cashflow from './components/Cashflow';
import Resume from './components/Resume';
import Ledger from './components/Ledger';
import ProfitLoss from './components/ProfitLoss';
import Login from './components/Login';
import AIAssistant from './components/AIAssistant';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Disable lock during development
  const [activeTab, setActiveTab] = useState('portfolio');
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem('helfine_theme') === 'light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  
  // Auto-lock when app goes to background (Disabled for development)
  useEffect(() => {
    /*
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sessionStorage.removeItem('helfine_auth');
        setIsAuthenticated(false);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    */
  }, []);

  // Global Privacy Body Class
  useEffect(() => {
    if (isPrivacyMode) {
      document.body.classList.add('privacy-active');
    } else {
      document.body.classList.remove('privacy-active');
    }
  }, [isPrivacyMode]);

  // Global Theme Body Class
  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('helfine_theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      document.documentElement.classList.add('dark');
      localStorage.setItem('helfine_theme', 'dark');
    }
  }, [isLightMode]);
  
  // Global Financial State
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [operationalWallets, setOperationalWallets] = useState(INITIAL_OPERATIONAL);



  // Auto-sync Accounts with debounce
  useEffect(() => {
    if (isDbLoading) return;
    const timeout = setTimeout(() => {
      syncSheet('Accounts', accounts).catch(console.error);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [accounts, isDbLoading]);

  // Auto-sync OperationalWallets with debounce
  useEffect(() => {
    if (isDbLoading) return;
    const timeout = setTimeout(() => {
      syncSheet('OperationalWallets', operationalWallets).catch(console.error);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [operationalWallets, isDbLoading]);

  // Initial DB Load
  useEffect(() => {
    if (!isAuthenticated) return; // Wait until logged in
    const loadDB = async () => {
      try {
        const data = await fetchDatabase();
        if (data.Accounts && data.Accounts.length > 0) {
          setAccounts(data.Accounts);
          localStorage.setItem('accounts_data', JSON.stringify(data.Accounts));
        }
        if (data.OperationalWallets && data.OperationalWallets.length > 0) {
          setOperationalWallets(data.OperationalWallets);
          localStorage.setItem('operational_data', JSON.stringify(data.OperationalWallets));
        }
        
        // Sync to localStorage cache for components
        if (data.Cashflow) localStorage.setItem('cashflow_records', JSON.stringify(data.Cashflow));
        if (data.Strategy) localStorage.setItem('strategy_transactions', JSON.stringify(data.Strategy));
        if (data.Makan) localStorage.setItem('makan_transactions', JSON.stringify(data.Makan));
        if (data.Trading) localStorage.setItem('trading_journal', JSON.stringify(data.Trading));
        if (data.Resume) localStorage.setItem('resume_dynamic_history', JSON.stringify(data.Resume));
        
        setIsDbLoading(false);
      } catch (err) {
        console.error("DB Init Error:", err);
        setDbError(err.message);
        setIsDbLoading(false);
      }
    };
    loadDB();
  }, [isAuthenticated]);

  // Derived Totals
  const totalInvestasi = accounts.filter(a => a.type === 'Equity').reduce((sum, a) => sum + a.value, 0);
  const totalTabungan = accounts.filter(a => a.type === 'Savings').reduce((sum, a) => sum + a.value, 0);
  
  const cashflowRecords = (() => {
    try {
      const saved = localStorage.getItem('cashflow_records');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
  })();

  // Hitung total dana Gaji/Pemasukan yang dimasukkan ke Pool (Kas Induk)
  const totalPoolIn = cashflowRecords
    .filter(r => r.type === 'Income' && r.isOperationalPool)
    .reduce((sum, r) => sum + r.amount, 0);

  // Hitung total dana yang sudah ditarik/ditransfer dari Pool ke Tabungan
  const totalPoolTransferOut = cashflowRecords
    .filter(r => r.type === 'Expense' && r.isPoolTransfer)
    .reduce((sum, r) => sum + r.amount, 0);

  // Hitung pengeluaran operasional (expense biasa yang bukan transfer)
  const totalOperationalExpenses = cashflowRecords
    .filter(r => r.type === 'Expense' && !r.isPoolTransfer)
    .reduce((sum, r) => sum + r.amount, 0);

  // Mapping dompet untuk menghitung sisa saldo di masing-masing amplop
  const walletsWithBalance = operationalWallets.map(w => {
    const nameLower = w.name.toLowerCase();
    const spent = cashflowRecords
      .filter(r => r.type === 'Expense' && !r.isPoolTransfer && r.category.toLowerCase().includes(nameLower))
      .reduce((sum, r) => sum + r.amount, 0);
      
    const balance = w.balance || 0; // Mulai dari 0 jika belum pernah diisi
    const currentBalance = balance - spent;
    
    return { ...w, balance, spent, currentBalance };
  });

  // Total dana yang Asli dimasukkan ke kantong-kantong saat ini (Isi Saldo, bukan Target Budget)
  const totalAllocated = walletsWithBalance.reduce((sum, w) => sum + w.balance, 0);

  // Sisa Saldo Induk (Pool) yang belum dibagikan
  const operationalPoolBalance = totalPoolIn - totalPoolTransferOut - totalAllocated;

  // Hitung Sisa Saldo Operasional berdasarkan Metode Pembayaran
  const operationalBalanceCash = 
    cashflowRecords.filter(r => r.type === 'Income' && r.isOperationalPool && r.paymentMethod === 'Cash').reduce((sum, r) => sum + r.amount, 0)
    - cashflowRecords.filter(r => r.type === 'Expense' && r.paymentMethod === 'Cash').reduce((sum, r) => sum + r.amount, 0)
    + cashflowRecords.filter(r => r.type === 'Transfer' && r.transferDirection === 'ToCash').reduce((sum, r) => sum + r.amount, 0)
    - cashflowRecords.filter(r => r.type === 'Transfer' && r.transferDirection === 'ToEmoney').reduce((sum, r) => sum + r.amount, 0);

  const operationalBalanceEmoney = 
    cashflowRecords.filter(r => r.type === 'Income' && r.isOperationalPool && (r.paymentMethod === 'Saldo' || !r.paymentMethod)).reduce((sum, r) => sum + r.amount, 0)
    - cashflowRecords.filter(r => r.type === 'Expense' && (r.paymentMethod === 'Saldo' || !r.paymentMethod)).reduce((sum, r) => sum + r.amount, 0)
    + cashflowRecords.filter(r => r.type === 'Transfer' && r.transferDirection === 'ToEmoney').reduce((sum, r) => sum + r.amount, 0)
    - cashflowRecords.filter(r => r.type === 'Transfer' && r.transferDirection === 'ToCash').reduce((sum, r) => sum + r.amount, 0);

  // Grand Total Operasional tetap ada untuk aset
  const operationalBalance = operationalBalanceCash + operationalBalanceEmoney;
  
  const totalAssets = totalInvestasi + totalTabungan + operationalBalance;

  // Bundle to pass easily
  const formatCurrency = (amount) => {
    // Return formatted string. CSS will handle the blur via .privacy-active .money-value
    // But for places where CSS can't reach easily (like charts), we can still use bullets if needed.
    // For now, let's let CSS handle it where .money-value is applied, and use bullets as fallback 
    // actually, let's keep bullets for formatCurrency to ensure 100% coverage without manual class additions!
    if (isPrivacyMode) return '•••••••';
    return amount.toLocaleString('id-ID');
  };

  const financialData = {
    accounts,
    setAccounts,
    operationalWallets: walletsWithBalance,
    setOperationalWallets,
    operationalBalance,
    operationalBalanceCash,
    operationalBalanceEmoney,
    operationalPoolBalance,
    totalInvestasi,
    totalTabungan,
    totalAssets,
    isPrivacyMode,
    formatCurrency,
    syncSheet, // Pass sync function to components
    setIsAuthenticated
  };

  if (!isAuthenticated) {
    return (
      <Login 
        onAuthSuccess={() => {
          sessionStorage.setItem('helfine_auth', 'true');
          setIsAuthenticated(true);
        }} 
      />
    );
  }

  if (isDbLoading) {
    return (
      <>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} financialData={financialData} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} isLightMode={isLightMode} setIsLightMode={setIsLightMode} isPrivacyMode={isPrivacyMode} setIsPrivacyMode={setIsPrivacyMode} />
        <Header financialData={financialData} title="Memuat Data..." isPrivacyMode={isPrivacyMode} setIsPrivacyMode={setIsPrivacyMode} isLightMode={isLightMode} setIsLightMode={setIsLightMode} onMenuClick={() => setIsMobileMenuOpen(true)} onLogout={() => { sessionStorage.removeItem('helfine_auth'); setIsAuthenticated(false); }} onLogoClick={() => setActiveTab('portfolio')} />
        <main className="pt-24 pb-12 px-gutter md:px-margin-page md:ml-64 w-full md:w-[calc(100%-16rem)]">
          <div className="grid grid-cols-12 gap-6 md:gap-stack-lg max-w-7xl mx-auto">
            {/* Hero Skeleton */}
            <div className="col-span-12 glass-card rounded-xl p-container-padding flex flex-col justify-center h-48 animate-pulse bg-slate-200/50 dark:bg-white/5">
              <div className="w-32 h-4 bg-slate-300 dark:bg-white/10 rounded mb-4"></div>
              <div className="w-64 h-12 bg-slate-300 dark:bg-white/10 rounded-lg"></div>
            </div>
            
            {/* Cards Skeleton */}
            {[1, 2, 3].map(i => (
              <div key={i} className="col-span-12 lg:col-span-4 h-36 glass-card rounded-xl p-6 flex flex-col justify-center animate-pulse bg-slate-200/50 dark:bg-white/5">
                 <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-white/10 mb-4"></div>
                 <div className="w-24 h-4 bg-slate-300 dark:bg-white/10 rounded mb-2"></div>
                 <div className="w-32 h-6 bg-slate-300 dark:bg-white/10 rounded"></div>
              </div>
            ))}

            {/* Chart Skeleton */}
            <div className="col-span-12 h-96 glass-card rounded-xl p-6 animate-pulse bg-slate-200/50 dark:bg-white/5 flex flex-col">
              <div className="w-48 h-6 bg-slate-300 dark:bg-white/10 rounded mb-8"></div>
              <div className="flex-1 w-full bg-slate-300/50 dark:bg-white/5 rounded-lg"></div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} financialData={financialData} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} isLightMode={isLightMode} setIsLightMode={setIsLightMode} isPrivacyMode={isPrivacyMode} setIsPrivacyMode={setIsPrivacyMode} />
      <Header financialData={financialData} title={activeTab === 'analytics' ? 'Monthly Recap' : activeTab === 'investments' ? 'Investment' : activeTab === 'savings' ? 'Tabungan & Cadangan' : activeTab === 'strategy' ? 'Operational Menu' : activeTab === 'makan' ? 'Pencatatan Makan' : activeTab === 'trading' ? 'Jurnal Trading' : activeTab === 'cashflow' ? 'Arus Kas' : activeTab === 'resume' ? 'Resume Historis' : activeTab === 'ledger' ? 'Buku Besar' : activeTab === 'profitloss' ? 'Laba Rugi' : 'Dashboard'} isPrivacyMode={isPrivacyMode} setIsPrivacyMode={setIsPrivacyMode} isLightMode={isLightMode} setIsLightMode={setIsLightMode} onMenuClick={() => setIsMobileMenuOpen(true)} onLogout={() => { sessionStorage.removeItem('helfine_auth'); setIsAuthenticated(false); }} onLogoClick={() => setActiveTab('portfolio')} />
      <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        {activeTab === 'portfolio' && <Dashboard setActiveTab={setActiveTab} financialData={financialData} />}
        {activeTab === 'analytics' && <Analytics financialData={financialData} />}
        {activeTab === 'investments' && <Investments financialData={financialData} />}
        {activeTab === 'savings' && <Savings financialData={financialData} />}
        {activeTab === 'strategy' && <Strategy financialData={financialData} />}
        {activeTab === 'makan' && <Makan financialData={financialData} />}
        {activeTab === 'trading' && <Trading financialData={financialData} />}
        {activeTab === 'cashflow' && <Cashflow financialData={financialData} />}
        {activeTab === 'ledger' && <Ledger financialData={financialData} />}
        {activeTab === 'profitloss' && <ProfitLoss financialData={financialData} />}
        {activeTab === 'resume' && <Resume financialData={financialData} />}
      </div>
      <AIAssistant financialData={financialData} />
    </>
  );
}

export default App;
