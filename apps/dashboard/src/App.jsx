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
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('helfine_auth') === 'true');
  const [activeTab, setActiveTab] = useState('portfolio');
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  
  // Auto-lock when app goes to background
  useEffect(() => {
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
  }, []);
  
  // Global Financial State
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [operationalWallets, setOperationalWallets] = useState(INITIAL_OPERATIONAL);

  // Auto-Snapshot Engine (Tanggal 20)
  React.useEffect(() => {
    const checkAndRunSnapshot = () => {
      const today = new Date();
      if (today.getDate() >= 20) {
        const monthYear = today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }); // e.g., "Mei 2026"
        const monthLabel = `20 ${monthYear.split(' ')[0]}`; // e.g., "20 Mei"
        
        let savedHistory = [];
        try {
          const stored = localStorage.getItem('resume_dynamic_history');
          if (stored) savedHistory = JSON.parse(stored);
        } catch (e) {}
        
        if (!savedHistory.some(s => s.month === monthLabel)) {
          // 1. Snapshot Accounts
          const balances = accounts.map(acc => ({ name: acc.name, value: acc.value }));
          
          // 2. Snapshot Cashflow
          let incomes = [];
          let extraExpenses = [];
          try {
            const cf = JSON.parse(localStorage.getItem('cashflow_records') || '[]');
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            const currentMonthRecords = cf.filter(r => {
              const d = new Date(r.date);
              return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
            const incMap = {};
            const expMap = {};
            currentMonthRecords.forEach(r => {
              if (r.type === 'Income') incMap[r.category] = (incMap[r.category] || 0) + r.amount;
              else expMap[r.category] = (expMap[r.category] || 0) + r.amount;
            });
            incomes = Object.keys(incMap).map(k => ({ name: k, value: incMap[k] }));
            extraExpenses = Object.keys(expMap).map(k => ({ name: k, value: expMap[k] }));
          } catch (e) {}

          // 3. Snapshot Operational & Makan
          try {
            const txs = JSON.parse(localStorage.getItem('strategy_transactions') || '[]');
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            const currentTxs = txs.filter(r => new Date(r.date).getMonth() === currentMonth && new Date(r.date).getFullYear() === currentYear);
            const operationalSpent = currentTxs.reduce((sum, r) => sum + r.amount, 0);
            if (operationalSpent > 0) extraExpenses.push({ name: 'Operasional', value: operationalSpent });
          } catch (e) {}

          try {
            const txs = JSON.parse(localStorage.getItem('makan_transactions') || '[]');
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            const currentTxs = txs.filter(r => new Date(r.date).getMonth() === currentMonth && new Date(r.date).getFullYear() === currentYear);
            const makanSpent = currentTxs.reduce((sum, r) => sum + r.amount, 0);
            if (makanSpent > 0) extraExpenses.push({ name: 'Makan', value: makanSpent });
          } catch (e) {}

          // Create snapshot
          const newSnapshot = {
            id: Date.now(),
            month: monthLabel,
            balances,
            incomes,
            expenses: extraExpenses,
            timestamp: today.toISOString()
          };
          
          savedHistory.push(newSnapshot);
          localStorage.setItem('resume_dynamic_history', JSON.stringify(savedHistory));
          syncSheet('Resume', savedHistory).catch(console.error); // Sync to DB
        }
      }
    };
    if (isAuthenticated && !isDbLoading) checkAndRunSnapshot();
  }, [accounts, isDbLoading, isAuthenticated]);

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
        if (data.Accounts && data.Accounts.length > 0) setAccounts(data.Accounts);
        if (data.OperationalWallets && data.OperationalWallets.length > 0) setOperationalWallets(data.OperationalWallets);
        
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
  const operationalBalance = operationalWallets.reduce((sum, w) => {
    const status = w.status || 'filled';
    return status === 'filled' ? sum + w.value : sum;
  }, 0);
  const totalAssets = totalInvestasi + totalTabungan + operationalBalance;

  // Bundle to pass easily
  const formatCurrency = (amount) => {
    if (isPrivacyMode) return '•••••••';
    return amount.toLocaleString('id-ID');
  };

  const financialData = {
    accounts,
    setAccounts,
    operationalWallets,
    setOperationalWallets,
    operationalBalance,
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-emerald-400">
        <span className="material-symbols-outlined text-6xl animate-spin mb-4">sync</span>
        <h2 className="text-xl font-bold tracking-widest uppercase">Connecting to Database...</h2>
      </div>
    );
  }

  return (
    <>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} financialData={financialData} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <Header title={activeTab === 'analytics' ? 'Monthly Recap' : activeTab === 'investments' ? 'Investment' : activeTab === 'savings' ? 'Tabungan & Cadangan' : activeTab === 'strategy' ? 'Operational Menu' : activeTab === 'makan' ? 'Pencatatan Makan' : activeTab === 'trading' ? 'Jurnal Trading' : activeTab === 'cashflow' ? 'Arus Kas' : activeTab === 'resume' ? 'Resume Historis' : 'Dashboard'} isPrivacyMode={isPrivacyMode} setIsPrivacyMode={setIsPrivacyMode} onMenuClick={() => setIsMobileMenuOpen(true)} onLogout={() => { sessionStorage.removeItem('helfine_auth'); setIsAuthenticated(false); }} />
      {activeTab === 'portfolio' && <Dashboard setActiveTab={setActiveTab} financialData={financialData} />}
      {activeTab === 'analytics' && <Analytics financialData={financialData} />}
      {activeTab === 'investments' && <Investments financialData={financialData} />}
      {activeTab === 'savings' && <Savings financialData={financialData} />}
      {activeTab === 'strategy' && <Strategy financialData={financialData} />}
      {activeTab === 'makan' && <Makan financialData={financialData} />}
      {activeTab === 'trading' && <Trading financialData={financialData} />}
      {activeTab === 'cashflow' && <Cashflow financialData={financialData} />}
      {activeTab === 'resume' && <Resume financialData={financialData} />}
    </>
  );
}

export default App;
