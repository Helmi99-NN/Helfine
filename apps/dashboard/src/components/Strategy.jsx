import React, { useState } from 'react';

export default function Strategy({ financialData }) {
  const { operationalWallets, setOperationalWallets, operationalBalance } = financialData || { operationalWallets: [], operationalBalance: 0 };
  const mainWallet = operationalWallets.find(w => w.id === 'main') || { value: 800000 };
  const monthlyPlayBudget = mainWallet.value;

  const handleValueChange = (id, newValue) => {
    const numericValue = parseInt(newValue.replace(/\D/g, '')) || 0;
    setOperationalWallets && setOperationalWallets(operationalWallets.map(w => 
      w.id === id ? { ...w, balance: numericValue } : w
    ));
  };

  // Read cashflow records to automate status
  const [cashflowRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('cashflow_records');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
  });

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const [isPullModalOpen, setIsPullModalOpen] = useState(false);
  const [pullAccount, setPullAccount] = useState('');
  const [pullAmount, setPullAmount] = useState('');
  const [pullMethod, setPullMethod] = useState('Saldo');

  const handleTransferWallets = () => {
    if (!transferFrom || !transferTo || !transferAmount) return;
    const amount = parseInt(transferAmount.replace(/\D/g, '')) || 0;
    if (amount <= 0) return;

    const fromWallet = financialData.operationalWallets.find(w => w.id === transferFrom);
    const toWallet = financialData.operationalWallets.find(w => w.id === transferTo);
    
    if (!fromWallet || !toWallet) return;
    
    if (amount > fromWallet.currentBalance) {
      alert("Saldo kantong asal tidak cukup untuk dipindahkan!");
      return;
    }

    const newWallets = operationalWallets.map(w => {
      if (w.id === transferFrom) return { ...w, balance: w.balance - amount };
      if (w.id === transferTo) return { ...w, balance: (w.balance || 0) + amount };
      return w;
    });

    setOperationalWallets && setOperationalWallets(newWallets);
    financialData.syncSheet && financialData.syncSheet('OperationalWallets', newWallets).catch(console.error);

    setIsTransferModalOpen(false);
    setTransferFrom('');
    setTransferTo('');
    setTransferAmount('');
  };

  const handleTransferToSavings = () => {
    if (financialData.operationalPoolBalance <= 0) {
      alert("Tidak ada sisa saldo di Pool Operasional untuk ditransfer.");
      return;
    }

    const confirmTransfer = window.confirm(`Pindahkan sisa saldo Pool sebesar Rp ${financialData.formatCurrency(financialData.operationalPoolBalance)} ke dompet Tabungan (Gaji) dan reset kantong operasional?`);
    if (!confirmTransfer) return;

    // Create Expense from Pool
    const expenseRecord = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'Expense',
      category: 'Sapu Bersih Sisa Pool ke Tabungan',
      amount: financialData.operationalPoolBalance,
      notes: 'Transfer akhir bulan otomatis',
      isPoolTransfer: true
    };

    const newRecords = [expenseRecord, ...cashflowRecords];
    localStorage.setItem('cashflow_records', JSON.stringify(newRecords));
    financialData.syncSheet && financialData.syncSheet('Cashflow', newRecords).catch(console.error);

    // Add to Tabungan (Gaji)
    const existingAccounts = financialData.accounts || [];
    let gajiAccount = existingAccounts.find(a => a.name.toLowerCase() === 'gaji' && a.type === 'Savings');
    
    let newAccounts;
    if (gajiAccount) {
      newAccounts = existingAccounts.map(a => 
        a.id === gajiAccount.id ? { ...a, value: a.value + financialData.operationalPoolBalance } : a
      );
    } else {
      newAccounts = [
        ...existingAccounts, 
        { id: `acc_${Date.now()}`, type: 'Savings', name: 'Gaji', value: financialData.operationalPoolBalance, icon: 'savings', color: 'text-primary', border: 'border-primary/20' }
      ];
    }
    
    financialData.setAccounts && financialData.setAccounts(newAccounts);
    financialData.syncSheet && financialData.syncSheet('Accounts', newAccounts).catch(console.error);
    
    // Reset all pocket balances to 0 (Keep Target value intact)
    const resetWallets = financialData.operationalWallets.map(w => ({ ...w, balance: 0 }));
    financialData.setOperationalWallets && financialData.setOperationalWallets(resetWallets);
    financialData.syncSheet && financialData.syncSheet('OperationalWallets', resetWallets).catch(console.error);

    alert("Berhasil menyapu bersih sisa Pool Operasional ke dompet Tabungan (Gaji)!");
    window.location.reload();
  };

  const handlePullFromSavings = () => {
    const parsedAmount = parseFloat(pullAmount.toString().replace(/\D/g, ''));
    if (!pullAccount || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const existingAccounts = financialData.accounts || [];
    const sourceAccount = existingAccounts.find(a => a.id === pullAccount);
    
    if (!sourceAccount) return;
    if (sourceAccount.value < parsedAmount) {
      alert("Saldo di portofolio/tabungan tidak mencukupi!");
      return;
    }

    const confirmPull = window.confirm(`Tarik Rp ${financialData.formatCurrency(parsedAmount)} dari ${sourceAccount.name} ke Saldo Operasional?`);
    if (!confirmPull) return;

    // Deduct from accounts
    const newAccounts = existingAccounts.map(a => 
      a.id === sourceAccount.id ? { ...a, value: a.value - parsedAmount } : a
    );

    // Create Income for Pool
    const incomeRecord = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'Income',
      category: `Tarik dari ${sourceAccount.name}`,
      amount: parsedAmount,
      notes: 'Pemindahan dari portofolio ke operasional',
      isOperationalPool: true,
      paymentMethod: pullMethod || 'Saldo',
      transferDirection: null
    };

    const newRecords = [incomeRecord, ...cashflowRecords];

    // Save
    localStorage.setItem('accounts_data', JSON.stringify(newAccounts));
    localStorage.setItem('cashflow_records', JSON.stringify(newRecords));
    
    financialData.setAccounts && financialData.setAccounts(newAccounts);
    financialData.syncSheet && financialData.syncSheet('Accounts', newAccounts).catch(console.error);
    financialData.syncSheet && financialData.syncSheet('Cashflow', newRecords).catch(console.error);

    alert("Berhasil memindahkan dana ke Saldo Operasional!");
    window.location.reload();
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
          
          {/* Section 1: Wallet Status Grid (Col span 12) */}
          <section className="col-span-12 glass-panel rounded-xl p-container-padding flex flex-col h-full hover:shadow-[0_0_20px_rgba(78,222,163,0.05)] transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-4">
              <div className="flex items-center gap-4">
                <h3 className="text-headline-md font-headline-md text-slate-200 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">account_tree</span>
                  Alokasi Operasional
                </h3>
                <button onClick={() => setIsTransferModalOpen(!isTransferModalOpen)} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center gap-2 border ${isTransferModalOpen ? 'bg-secondary/20 text-secondary border-secondary/50' : 'bg-surface-container hover:bg-surface-container-high border-outline-variant/50 text-slate-200'}`}>
                  <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                  Pindah Saldo
                </button>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-white/10 text-right">
                  <p className="font-label-sm text-label-sm text-slate-300">Total Operasional Terkini</p>
                  <p className="font-display-sm text-2xl text-slate-200 tracking-tight">Rp {financialData.formatCurrency(financialData.operationalBalance || 0)}</p>
                </div>
              </div>
            </div>

            {/* Transfer Form Panel */}
            {isTransferModalOpen && (
              <div className="mb-6 p-4 rounded-xl border border-secondary/30 bg-secondary/5 animate-in slide-in-from-top-4 duration-300">
                <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px]">sync_alt</span>
                  Pindah Saldo Antar Kantong
                </h4>
                <div className="flex flex-col md:flex-row items-end gap-4">
                  <div className="flex-1 w-full">
                    <label className="block text-xs text-slate-400 mb-1">Dari Kantong (Sumber)</label>
                    <select value={transferFrom} onChange={e => setTransferFrom(e.target.value)} className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-secondary [color-scheme:dark]">
                      <option value="" disabled>Pilih Kantong Sumber...</option>
                      {financialData.operationalWallets.filter(w => w.currentBalance > 0).map(w => (
                        <option key={w.id} value={w.id}>{w.name} (Sisa: Rp{financialData.formatCurrency(w.currentBalance)})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs text-slate-400 mb-1">Ke Kantong (Tujuan)</label>
                    <select value={transferTo} onChange={e => setTransferTo(e.target.value)} className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-secondary [color-scheme:dark]">
                      <option value="" disabled>Pilih Kantong Tujuan...</option>
                      {financialData.operationalWallets.filter(w => w.id !== transferFrom).map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs text-slate-400 mb-1">Nominal (Rp)</label>
                    <input type="text" value={transferAmount} onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setTransferAmount(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
                    }} placeholder="0" className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-secondary font-data-mono" />
                  </div>
                  <button onClick={handleTransferWallets} disabled={!transferFrom || !transferTo || !transferAmount} className="w-full md:w-auto bg-secondary hover:bg-secondary-fixed text-white font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[38px] flex items-center justify-center">
                    Transfer
                  </button>
                </div>
              </div>
            )}

            {/* Pool Status Widget */}
            <div className="mb-stack-md bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-label-sm text-label-sm text-primary mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">water_drop</span>
                  Saldo Induk Operasional (Pool)
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-200 tracking-tight">Rp {financialData.formatCurrency(financialData.operationalPoolBalance || 0)}</span>
                  <span className="text-xs text-slate-400">Sisa belum dibagikan</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => setIsPullModalOpen(!isPullModalOpen)}
                  className={`w-full sm:w-auto border text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${isPullModalOpen ? 'bg-primary/20 text-primary border-primary/50' : 'bg-surface-container hover:bg-surface-container-high text-slate-200 border-outline-variant/50'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">account_balance</span>
                  Tarik dari Tabungan
                </button>
                <button 
                  onClick={handleTransferToSavings}
                  disabled={!financialData.operationalPoolBalance || financialData.operationalPoolBalance <= 0}
                  className="w-full sm:w-auto bg-primary hover:bg-primary-fixed text-on-primary text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">cleaning_services</span>
                  Sapu Bersih ke Tabungan
                </button>
              </div>
            </div>
            
            {/* Pull Modal Panel */}
            {isPullModalOpen && (
              <div className="mb-stack-md p-4 rounded-xl border border-primary/30 bg-primary/5 animate-in slide-in-from-top-4 duration-300">
                <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">account_balance</span>
                  Tarik Dana dari Tabungan/Portofolio
                </h4>
                <div className="flex flex-col md:flex-row items-end gap-4">
                  <div className="flex-1 w-full">
                    <label className="block text-xs text-slate-400 mb-1">Sumber Tabungan</label>
                    <select value={pullAccount} onChange={e => setPullAccount(e.target.value)} className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary [color-scheme:dark]">
                      <option value="" disabled>Pilih Tabungan...</option>
                      {(financialData.accounts || []).filter(a => a.value > 0).map(a => (
                        <option key={a.id} value={a.id}>{a.name} (Sisa: Rp{financialData.formatCurrency(a.value)})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs text-slate-400 mb-1">Nominal (Rp)</label>
                    <input type="text" value={pullAmount} onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setPullAmount(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
                    }} placeholder="0" className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary font-data-mono" />
                  </div>
                  <div className="flex-1 w-full md:max-w-[150px]">
                    <label className="block text-xs text-slate-400 mb-1">Metode Masuk</label>
                    <select value={pullMethod} onChange={e => setPullMethod(e.target.value)} className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary [color-scheme:dark]">
                      <option value="Saldo">E-Money</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <button onClick={handlePullFromSavings} disabled={!pullAccount || !pullAmount} className="w-full md:w-auto bg-primary hover:bg-primary-fixed text-on-primary font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[38px] flex items-center justify-center">
                    Tarik
                  </button>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1 content-start">
              {financialData.operationalWallets && financialData.operationalWallets.map((wallet) => {
                return (
                  <div key={wallet.id} className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 flex flex-col relative overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${wallet.currentBalance > 0 ? 'bg-primary/10 text-primary' : 'bg-slate-500/10 text-slate-500 group-hover:bg-primary/5 group-hover:text-primary/70'}`}>
                          <span className="material-symbols-outlined text-[24px]">{wallet.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-200 text-base">{wallet.name}</h4>
                          <p className="text-[11px] text-slate-400 font-data-mono">Target: Rp {financialData.formatCurrency(wallet.value)}</p>
                        </div>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${wallet.currentBalance > 0 ? 'bg-primary shadow-[0_0_8px_rgba(78,222,163,0.6)]' : 'bg-slate-600'}`}></div>
                    </div>

                    <div className="mb-6">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Sisa Saldo</p>
                      <p className={`text-3xl font-bold tracking-tight font-data-mono ${wallet.currentBalance <= 0 ? 'text-error' : 'text-slate-200'}`}>
                        Rp {financialData.formatCurrency(wallet.currentBalance)}
                      </p>
                      {wallet.spent > 0 && (
                        <p className="text-xs text-error font-data-mono mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                          Rp {financialData.formatCurrency(wallet.spent)} terpakai
                        </p>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-outline-variant/30">
                      <div className="relative w-full">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-data-mono text-xs text-slate-400">Rp</span>
                        <input 
                          className="w-full bg-surface-container/30 border border-outline-variant/50 text-slate-200 font-data-mono text-sm focus:border-primary focus:bg-surface-container focus:ring-1 focus:ring-primary rounded-xl py-2 pl-9 pr-3 transition-all shadow-inner text-right placeholder-slate-500" 
                          type="text" 
                          value={!wallet.balance || wallet.balance === 0 ? '' : wallet.balance.toLocaleString('id-ID')}
                          onChange={(e) => handleValueChange(wallet.id, e.target.value)}
                          placeholder="Top Up Saldo" 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          
        </div>
      </div>
    </main>
  );
}
