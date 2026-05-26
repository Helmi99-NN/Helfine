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
              <h3 className="text-headline-md font-headline-md text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">account_tree</span>
                Alokasi Operasional
              </h3>
              <div className="flex flex-col items-end gap-2">
                <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-white/10 text-right">
                  <p className="font-label-sm text-label-sm text-slate-300">Total Operasional Terkini</p>
                  <p className="font-display-sm text-2xl text-slate-200 tracking-tight">Rp {financialData.formatCurrency(financialData.operationalBalance || 0)}</p>
                </div>
              </div>
            </div>

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
              <button 
                onClick={handleTransferToSavings}
                disabled={!financialData.operationalPoolBalance || financialData.operationalPoolBalance <= 0}
                className="w-full sm:w-auto bg-primary hover:bg-primary-fixed text-on-primary font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">cleaning_services</span>
                Sapu Bersih ke Tabungan
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 flex-1 content-start">
              {financialData.operationalWallets && financialData.operationalWallets.map((wallet) => {
                return (
                  <div key={wallet.id} className="bg-surface-container/50 border border-white/10 rounded-lg p-4 flex flex-col gap-3 transition-colors group hover:border-primary/50 relative overflow-hidden">
                    {/* Visual indicator for static sync */}
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center border border-white/5 group-hover:bg-primary/10">
                        <span className="material-symbols-outlined text-lg text-primary/80 group-hover:text-primary transition-colors">{wallet.icon}</span>
                      </div>
                      
                      {/* Status Manual Indicator */}
                      <div className="flex flex-col items-end gap-1">
                        <div 
                          className={`w-10 h-4 rounded-full flex items-center p-0.5 relative border transition-colors duration-300 opacity-90 ${wallet.currentBalance > 0 ? 'bg-primary/20 border-primary/30' : 'bg-surface-variant/50 border-outline-variant/50'}`}
                          title={wallet.currentBalance > 0 ? 'Ada Sisa Uang' : 'Habis/Kosong'}
                        >
                          <div className={`w-3 h-3 rounded-full absolute transition-all duration-300 shadow-sm ${wallet.currentBalance > 0 ? 'bg-primary left-[50%] -translate-x-[50%]' : 'bg-outline left-0.5'}`}></div>
                        </div>
                        <span className="text-[9px] text-slate-400 font-data-mono uppercase tracking-wider">{wallet.currentBalance > 0 ? 'Tersedia' : 'Habis'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <div className="text-data-mono font-data-mono text-slate-200 group-hover:text-primary transition-colors truncate">{wallet.name}</div>
                        <div className="text-[10px] text-slate-500 font-data-mono" title="Target Budget Bulanan">Target: Rp {financialData.formatCurrency(wallet.value)}</div>
                      </div>
                      <div className="text-xs text-slate-400 flex justify-between items-center bg-surface-container-lowest/50 p-2 rounded-lg border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest opacity-60">Sisa Uang</span>
                          <span className={`font-data-mono font-bold ${wallet.currentBalance <= 0 ? 'text-error' : 'text-primary'}`}>Rp {financialData.formatCurrency(wallet.currentBalance)}</span>
                        </div>
                        {wallet.spent > 0 && (
                          <div className="flex flex-col items-end text-error opacity-90">
                            <span className="text-[9px] uppercase tracking-widest opacity-60">Terpakai</span>
                            <span className="font-data-mono font-bold">-Rp {financialData.formatCurrency(wallet.spent)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-auto pt-3 border-t border-white/5">
                      <div className="text-[10px] text-slate-500 mb-1 flex items-center justify-between">
                        <span>Isi Saldo (Top Up):</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 font-data-mono text-[10px] text-slate-300">Rp</span>
                        <input 
                          className="w-full bg-slate-800/80 border border-outline-variant text-slate-200 font-data-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary rounded-md py-1.5 pl-6 pr-2 transition-all shadow-inner text-right" 
                          type="text" 
                          value={!wallet.balance || wallet.balance === 0 ? '' : wallet.balance.toLocaleString('id-ID')}
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
          
        </div>
      </div>
    </main>
  );
}
