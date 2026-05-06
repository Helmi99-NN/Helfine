import React, { useState } from 'react';

export default function Strategy({ financialData }) {
  const { operationalWallets, setOperationalWallets, operationalBalance } = financialData || { operationalWallets: [], operationalBalance: 0 };
  const mainWallet = operationalWallets.find(w => w.id === 'main') || { value: 800000 };
  const monthlyPlayBudget = mainWallet.value;

  const [playTransactions, setPlayTransactions] = useState(() => {
    try {
      const stored = localStorage.getItem('strategy_transactions');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });
  const [playInput, setPlayInput] = useState('');
  
  const totalPlaySpent = playTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const remainingPlayBudget = monthlyPlayBudget - totalPlaySpent;
  const isPlayOverBudget = totalPlaySpent > monthlyPlayBudget;

  const handleValueChange = (id, newValue) => {
    const numericValue = parseInt(newValue.replace(/\D/g, '')) || 0;
    setOperationalWallets && setOperationalWallets(operationalWallets.map(w => 
      w.id === id ? { ...w, value: numericValue } : w
    ));
  };

  const handleToggleStatus = (id) => {
    setOperationalWallets && setOperationalWallets(operationalWallets.map(w => {
      if (w.id === id) {
        const currentStatus = w.status || 'filled'; // default to filled since they have values initially
        let nextStatus = 'empty';
        if (currentStatus === 'empty') nextStatus = 'filled';
        else if (currentStatus === 'filled') nextStatus = 'used';
        else if (currentStatus === 'used') nextStatus = 'empty';
        return { ...w, status: nextStatus };
      }
      return w;
    }));
  };

  const getToggleVisuals = (status) => {
    switch (status) {
      case 'empty':
        return { containerClass: 'bg-surface-variant/50 border-outline-variant/50', circleClass: 'bg-outline left-0.5', label: 'Belum Terisi' };
      case 'used':
        return { containerClass: 'bg-[#eab308]/20 border-[#eab308]/30', circleClass: 'bg-[#eab308] right-0.5', label: 'Terpakai' };
      case 'filled':
      default:
        return { containerClass: 'bg-primary/20 border-primary/30', circleClass: 'bg-primary left-[50%] -translate-x-[50%]', label: 'Terisi' };
    }
  };

  const handleAddPlay = () => {
    const amount = parseInt(playInput.replace(/\D/g, ''));
    if (!isNaN(amount) && amount > 0) {
      const newTxs = [{
        id: Date.now(),
        name: 'Kantong Main',
        amount: amount,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0]
      }, ...playTransactions];
      
      setPlayTransactions(newTxs);
      localStorage.setItem('strategy_transactions', JSON.stringify(newTxs));
      financialData.syncSheet && financialData.syncSheet('Strategy', newTxs).catch(console.error);
      setPlayInput('');
    }
  };

  const handleDeletePlay = (id) => {
    const newTxs = playTransactions.filter(tx => tx.id !== id);
    setPlayTransactions(newTxs);
    localStorage.setItem('strategy_transactions', JSON.stringify(newTxs));
    financialData.syncSheet && financialData.syncSheet('Strategy', newTxs).catch(console.error);
  };

  return (
    <main className="md:ml-64 pt-24 px-4 md:px-margin-page pb-margin-page w-full md:w-[calc(100%-16rem)] min-h-screen">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl md:text-display-lg font-display-lg text-slate-200">Operasional</h2>
          <p className="text-slate-300 mt-2 font-body-base text-body-base">Kelola pengeluaran harian dan strategi alokasi dompet.</p>
        </div>
        
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-gutter">
          
          {/* Section 1: Wallet Status Grid (Col span 8) */}
          <section className="col-span-12 xl:col-span-8 glass-panel rounded-xl p-container-padding flex flex-col h-full hover:shadow-[0_0_20px_rgba(78,222,163,0.05)] transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-4">
              <h3 className="text-headline-md font-headline-md text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">account_tree</span>
                Alokasi Operasional
              </h3>
              <div className="sm:text-right bg-slate-800/50 px-4 py-2 rounded-lg border border-white/10">
                <p className="font-label-sm text-label-sm text-slate-300">Total Operasional Terkini</p>
                <p className="font-display-sm text-2xl text-primary tracking-tight">Rp {financialData.formatCurrency(operationalBalance)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 flex-1 content-start">
              {operationalWallets && operationalWallets.map((wallet) => {
                const { containerClass, circleClass, label } = getToggleVisuals(wallet.status);
                
                return (
                  <div key={wallet.id} className="bg-surface-container/50 border border-white/10 rounded-lg p-4 flex flex-col gap-3 transition-colors group hover:border-primary/50">
                    <div className="flex justify-between items-start">
                      <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center border border-white/5 group-hover:bg-primary/10">
                        <span className="material-symbols-outlined text-lg text-primary/80 group-hover:text-primary transition-colors">{wallet.icon}</span>
                      </div>
                      
                      {/* 3-State Toggle */}
                      <div className="flex flex-col items-end gap-1">
                        <div 
                          onClick={() => handleToggleStatus(wallet.id)}
                          className={`w-10 h-4 rounded-full flex items-center p-0.5 relative border cursor-pointer transition-colors duration-300 ${containerClass}`}
                          title={label}
                        >
                          <div className={`w-3 h-3 rounded-full absolute transition-all duration-300 shadow-sm ${circleClass}`}></div>
                        </div>
                        <span className="text-[9px] text-slate-300 font-data-mono uppercase tracking-wider">{label}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-data-mono font-data-mono text-slate-200 group-hover:text-primary transition-colors truncate">{wallet.name}</div>
                    </div>
                    <div className="mt-auto">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 font-data-mono text-[10px] text-slate-300">Rp</span>
                        <input 
                          className="w-full bg-surface-container-lowest/50 border border-outline-variant text-primary font-data-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary rounded-md py-1.5 pl-6 pr-2 transition-all shadow-inner text-right" 
                          type="text" 
                          value={wallet.value === 0 ? '' : wallet.value.toLocaleString('id-ID')}
                          onChange={(e) => handleValueChange(wallet.id, e.target.value)}
                          placeholder="0" 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          
          {/* Section 2: Monthly Play Tracker (Col span 4) */}
          <section className="col-span-12 xl:col-span-4 glass-panel rounded-xl p-container-padding flex flex-col h-full hover:shadow-[0_0_20px_rgba(234,179,8,0.05)] transition-shadow duration-300">
            <h3 className="text-headline-md font-headline-md text-slate-200 flex items-center gap-2 mb-stack-md">
              <span className="material-symbols-outlined text-[#eab308]">sports_esports</span>
              Batas Main Bulanan
            </h3>
            
            <div className="mb-stack-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-2 gap-1">
                <div className={`text-3xl sm:text-4xl font-bold tracking-tight ${isPlayOverBudget ? 'text-error' : 'text-[#eab308]'}`}>
                  Rp {financialData.formatCurrency(totalPlaySpent)}
                </div>
                <div className="text-data-mono font-data-mono text-slate-500 text-sm md:text-base mb-1">/ Rp {financialData.formatCurrency(monthlyPlayBudget)}</div>
              </div>
              {/* Progress Bar */}
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mt-4 border border-white/10">
                <div className={`h-full rounded-full transition-all duration-500 ${isPlayOverBudget ? 'bg-error shadow-[0_0_10px_rgba(255,180,171,0.5)] w-full' : 'bg-gradient-to-r from-[#eab308] to-orange-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]'}`} style={{ width: isPlayOverBudget ? '100%' : `${(totalPlaySpent / monthlyPlayBudget) * 100}%` }}></div>
              </div>
              
              <div className={`mt-3 flex items-center gap-2 bg-surface-container/50 inline-flex px-3 py-1.5 rounded-full border border-white/10`}>
                <span className="text-[10px]">{isPlayOverBudget ? '🔴' : '🟡'}</span>
                <span className={`text-label-sm font-label-sm ${isPlayOverBudget ? 'text-error' : 'text-[#eab308]'}`}>
                  {isPlayOverBudget ? `Over Rp ${financialData.formatCurrency(Math.abs(remainingPlayBudget))}` : `Sisa Rp ${financialData.formatCurrency(remainingPlayBudget)}`}
                </span>
              </div>
            </div>
            
            {/* Quick Play Inputs */}
            <div className="mb-4 space-y-2 flex-1">
              <div className="text-label-sm font-label-sm text-slate-500">Bulan ini:</div>
              {playTransactions.map(tx => (
                <div key={tx.id} className="flex justify-between items-center text-sm py-1 border-b border-white/5">
                  <span className="text-slate-300">{tx.name}</span>
                  <div className="text-right">
                    <span className="block text-slate-200">Rp {financialData.formatCurrency(tx.amount)}</span>
                    <span className="block text-xs text-slate-500">{tx.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto">
              <div className="text-label-sm font-label-sm text-slate-500 mb-2">Input Cepat (Main)</div>
              <div className="flex gap-2 relative">
                <input 
                  value={playInput}
                  onChange={(e) => setPlayInput(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 text-data-mono font-data-mono text-slate-200 focus:outline-none focus:border-secondary-container focus:ring-1 focus:ring-secondary-container transition-all" 
                  placeholder="Nominal..." 
                  type="text" 
                />
                <button onClick={handleAddPlay} className="bg-slate-800 border border-outline-variant hover:border-[#eab308] text-[#eab308] px-4 py-2 rounded-lg transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </div>
          </section>
          
          {/* Section 3: Lifestyle Tracker Transaction List (Full Width under) */}
          <section className="col-span-12 glass-panel rounded-xl p-container-padding hover:shadow-[0_0_20px_rgba(78,222,163,0.05)] transition-shadow duration-300">
            <div className="flex items-center justify-between mb-stack-md border-b border-white/10 pb-4">
              <h3 className="text-headline-md font-headline-md text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">sports_esports</span>
                Riwayat Transaksi Kantong Main
              </h3>
              <div className="flex gap-2">
                <button className="bg-surface-container text-slate-200 text-label-sm font-label-sm px-3 py-1.5 rounded border border-outline-variant/50 hover:bg-surface-bright transition-colors">Filter</button>
                <button className="bg-surface-container text-slate-200 text-label-sm font-label-sm px-3 py-1.5 rounded border border-outline-variant/50 hover:bg-surface-bright transition-colors">Ekspor</button>
              </div>
            </div>
            
            <div className="space-y-1">
              {playTransactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">Belum ada transaksi main.</div>
              ) : (
                playTransactions.map(tx => (
                  <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg hover:bg-surface-container/50 transition-colors border border-transparent hover:border-white/10 group gap-2">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary flex-shrink-0">
                        <span className="material-symbols-outlined">sports_esports</span>
                      </div>
                      <div>
                        <div className="text-data-mono font-data-mono text-slate-200 group-hover:text-secondary transition-colors">{tx.name}</div>
                        <div className="text-label-sm font-label-sm text-slate-500">{tx.date || 'Today'}, {tx.time}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-14 sm:pl-0">
                      <div className="text-data-mono font-data-mono text-error">- Rp {financialData.formatCurrency(tx.amount)}</div>
                      <button 
                        onClick={() => handleDeletePlay(tx.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-error/20 hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
          
        </div>
      </div>
    </main>
  );
}
