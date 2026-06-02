import React, { useState, useEffect, useRef } from 'react';

export default function Cashflow({ financialData }) {
  const { formatCurrency } = financialData;
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('cashflow_records');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
  });

  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('custom_categories');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
  });

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('Income'); // 'Income' or 'Expense'
  const [category, setCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isOperationalPool, setIsOperationalPool] = useState(false); // Default tidak dicentang untuk Income
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash' or 'Saldo'
  const [transferDirection, setTransferDirection] = useState('ToCash'); // 'ToCash' (E-Money -> Cash) or 'ToEmoney' (Cash -> E-Money)

  const [editingRecordId, setEditingRecordId] = useState(null);

  // Filtering State
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const today = new Date();
    const isPast20 = today.getDate() > 20;
    const start = isPast20 
      ? new Date(today.getFullYear(), today.getMonth(), 20) 
      : new Date(today.getFullYear(), today.getMonth() - 1, 20);
    
    const sy = start.getFullYear();
    const sm = String(start.getMonth() + 1).padStart(2, '0');
    const sd = String(start.getDate()).padStart(2, '0');
    return `${sy}-${sm}-${sd}`;
  });
  const [filterEndDate, setFilterEndDate] = useState('');

  const catRef = useRef(null);
  const amountRef = useRef(null);

  const handleAddRecord = () => {
    if (type !== 'Transfer' && !category) return;
    if (!amount) return;
    
    const parsedAmount = parseFloat(amount.replace(/\D/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newRecord = {
      id: Date.now(),
      date,
      type,
      category: type === 'Transfer' ? (transferDirection === 'ToCash' ? 'Tarik Tunai' : 'Setor Tunai') : category,
      amount: parsedAmount,
      notes,
      isOperationalPool: type === 'Income' ? isOperationalPool : (type === 'Transfer' ? true : false),
      paymentMethod: (type === 'Expense' || isOperationalPool) ? paymentMethod : null,
      transferDirection: type === 'Transfer' ? transferDirection : null
    };

    const newRecords = [newRecord, ...records];
    setRecords(newRecords);
    localStorage.setItem('cashflow_records', JSON.stringify(newRecords));
    financialData.syncSheet && financialData.syncSheet('Cashflow', newRecords).catch(console.error);
    
    // Auto-Sync with Portofolio (Savings/Equity)
    if (type !== 'Transfer' && !newRecord.isOperationalPool) {
      const existingAccounts = financialData.accounts || [];
      let accountChanged = false;
      const newAccounts = existingAccounts.map(acc => {
        if (acc.name.toLowerCase() === newRecord.category.toLowerCase()) {
          accountChanged = true;
          if (newRecord.type === 'Income') {
            return { ...acc, value: acc.value + newRecord.amount };
          } else if (newRecord.type === 'Expense') {
            return { ...acc, value: Math.max(0, acc.value - newRecord.amount) };
          }
        }
        return acc;
      });

      if (accountChanged) {
        financialData.setAccounts && financialData.setAccounts(newAccounts);
        localStorage.setItem('accounts_data', JSON.stringify(newAccounts));
        financialData.syncSheet && financialData.syncSheet('Accounts', newAccounts).catch(console.error);
      }
    }

    // Save custom category if new
    if (type !== 'Transfer' && newRecord.category) {
      const standardCategories = ['Gaji', 'Bonus', 'Hasil Investasi', 'Tagihan', 'Belanja Bulanan', 'Kesehatan'];
      const accountNames = (financialData.accounts || []).map(a => a.name);
      const walletNames = (financialData.operationalWallets || []).map(w => w.name);
      
      if (!standardCategories.includes(newRecord.category) && !accountNames.includes(newRecord.category) && !walletNames.includes(newRecord.category) && !customCategories.includes(newRecord.category)) {
        const newCustomCats = [...customCategories, newRecord.category];
        setCustomCategories(newCustomCats);
        localStorage.setItem('custom_categories', JSON.stringify(newCustomCats));
      }
    }

    // Reset form
    setCategory('');
    setIsCustomCategory(false);
    setAmount('');
    setNotes('');
    catRef.current?.focus();
  };

  const handleEditClick = (record) => {
    setEditingRecordId(record.id);
    setDate(record.date.split('T')[0]);
    setType(record.type);
    setCategory(record.category);
    setIsCustomCategory(true); // Biar gampang dan tidak bug kalau optionnya ga ada
    setAmount(record.amount.toLocaleString('id-ID'));
    setNotes(record.notes || '');
    setPaymentMethod(record.paymentMethod || 'Cash');
    setIsOperationalPool(record.isOperationalPool || false);
    if (record.type === 'Transfer') {
      setTransferDirection(record.transferDirection || 'ToCash');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateRecord = () => {
    if (!editingRecordId) return;
    if (type !== 'Transfer' && !category) return;
    if (!amount) return;
    
    const parsedAmount = parseFloat(amount.toString().replace(/\D/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    // First, undo the old record from Portofolio
    const oldRecord = records.find(r => r.id === editingRecordId);
    if (oldRecord && oldRecord.type !== 'Transfer' && !oldRecord.isOperationalPool) {
      const existingAccounts = financialData.accounts || [];
      let accountChanged = false;
      const newAccounts = existingAccounts.map(acc => {
        if (acc.name.toLowerCase() === oldRecord.category.toLowerCase()) {
           accountChanged = true;
           if (oldRecord.type === 'Income') return { ...acc, value: Math.max(0, acc.value - oldRecord.amount) };
           else if (oldRecord.type === 'Expense') return { ...acc, value: acc.value + oldRecord.amount };
        }
        return acc;
      });
      if (accountChanged) {
        financialData.setAccounts && financialData.setAccounts(newAccounts);
        localStorage.setItem('accounts_data', JSON.stringify(newAccounts));
      }
    }

    // Create updated record
    const updatedRecord = {
      id: editingRecordId,
      date,
      type,
      category: type === 'Transfer' ? (transferDirection === 'ToCash' ? 'Tarik Tunai' : 'Setor Tunai') : category,
      amount: parsedAmount,
      notes,
      isOperationalPool: type === 'Income' ? isOperationalPool : (type === 'Transfer' ? true : false),
      paymentMethod: (type === 'Expense' || isOperationalPool) ? paymentMethod : null,
      transferDirection: type === 'Transfer' ? transferDirection : null
    };

    const newRecords = records.map(r => r.id === editingRecordId ? updatedRecord : r);
    setRecords(newRecords);
    localStorage.setItem('cashflow_records', JSON.stringify(newRecords));
    financialData.syncSheet && financialData.syncSheet('Cashflow', newRecords).catch(console.error);

    // Apply new record to Portofolio
    if (updatedRecord.type !== 'Transfer' && !updatedRecord.isOperationalPool) {
      const currentAccounts = JSON.parse(localStorage.getItem('accounts_data')) || financialData.accounts || [];
      let accountChanged = false;
      const newAccounts = currentAccounts.map(acc => {
        if (acc.name.toLowerCase() === updatedRecord.category.toLowerCase()) {
           accountChanged = true;
           if (updatedRecord.type === 'Income') return { ...acc, value: acc.value + updatedRecord.amount };
           else if (updatedRecord.type === 'Expense') return { ...acc, value: Math.max(0, acc.value - updatedRecord.amount) };
        }
        return acc;
      });
      if (accountChanged) {
        financialData.setAccounts && financialData.setAccounts(newAccounts);
        localStorage.setItem('accounts_data', JSON.stringify(newAccounts));
        financialData.syncSheet && financialData.syncSheet('Accounts', newAccounts).catch(console.error);
      }
    }

    // Save custom category if new
    if (type !== 'Transfer' && updatedRecord.category) {
      const standardCategories = ['Gaji', 'Bonus', 'Hasil Investasi', 'Tagihan', 'Belanja Bulanan', 'Kesehatan'];
      const accountNames = (financialData.accounts || []).map(a => a.name);
      const walletNames = (financialData.operationalWallets || []).map(w => w.name);
      
      if (!standardCategories.includes(updatedRecord.category) && !accountNames.includes(updatedRecord.category) && !walletNames.includes(updatedRecord.category) && !customCategories.includes(updatedRecord.category)) {
        const newCustomCats = [...customCategories, updatedRecord.category];
        setCustomCategories(newCustomCats);
        localStorage.setItem('custom_categories', JSON.stringify(newCustomCats));
      }
    }

    // Reset
    setEditingRecordId(null);
    setCategory('');
    setIsCustomCategory(false);
    setAmount('');
    setNotes('');
  };

  const handleDelete = (id) => {
    const recordToDelete = records.find(t => t.id === id);
    const newRecords = records.filter(t => t.id !== id);
    setRecords(newRecords);
    localStorage.setItem('cashflow_records', JSON.stringify(newRecords));
    financialData.syncSheet && financialData.syncSheet('Cashflow', newRecords).catch(console.error);

    // Undo Sync with Portofolio
    if (recordToDelete && recordToDelete.type !== 'Transfer' && !recordToDelete.isOperationalPool) {
      const existingAccounts = financialData.accounts || [];
      let accountChanged = false;
      const newAccounts = existingAccounts.map(acc => {
        if (acc.name.toLowerCase() === recordToDelete.category.toLowerCase()) {
          accountChanged = true;
          if (recordToDelete.type === 'Income') {
            return { ...acc, value: Math.max(0, acc.value - recordToDelete.amount) };
          } else if (recordToDelete.type === 'Expense') {
            return { ...acc, value: acc.value + recordToDelete.amount };
          }
        }
        return acc;
      });

      if (accountChanged) {
        financialData.setAccounts && financialData.setAccounts(newAccounts);
        localStorage.setItem('accounts_data', JSON.stringify(newAccounts));
        financialData.syncSheet && financialData.syncSheet('Accounts', newAccounts).catch(console.error);
      }
    }
  };

  // Apply Date Range Filter
  const filteredRecords = records.filter(r => {
    if (filterStartDate && new Date(r.date) < new Date(filterStartDate)) return false;
    if (filterEndDate && new Date(r.date) > new Date(filterEndDate)) return false;
    return true;
  });

  const totalIncome = filteredRecords.filter(r => r.type === 'Income').reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = filteredRecords.filter(r => r.type === 'Expense').reduce((sum, r) => sum + r.amount, 0);
  const netCashflow = totalIncome - totalExpense;

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert("Tidak ada data untuk diekspor pada rentang tanggal ini.");
      return;
    }
    const headers = ['Tanggal', 'Jenis', 'Kategori', 'Nominal'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.sort((a,b) => new Date(b.date) - new Date(a.date)).map(r => 
        `"${r.date}","${r.type === 'Income' ? 'Pemasukan' : 'Pengeluaran'}","${r.category}","${r.amount}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Arus_Kas_${filterStartDate || 'All'}_sd_${filterEndDate || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEnter = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef === 'submit') {
        if (editingRecordId) handleUpdateRecord();
        else handleAddRecord();
      }
      else nextRef?.current?.focus();
    }
  };

  return (
    <main className="md:ml-64 pt-24 px-4 md:px-margin-page pb-margin-page w-full md:w-[calc(100%-16rem)] min-h-screen">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div>
          <h2 className="text-3xl md:text-display-lg font-display-lg text-slate-200 flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl md:text-4xl text-primary">account_balance_wallet</span>
            Arus Kas (Cashflow)
          </h2>
          <p className="text-slate-300 mt-2 font-body-base text-body-base">Catat semua pemasukan dan pengeluaran ekstra yang akan diakumulasikan secara otomatis setiap tanggal 20.</p>
        </div>

        {/* Filter and Export Header */}
        <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-outline-variant/30">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="material-symbols-outlined text-primary text-[20px]">date_range</span>
              <span className="text-sm font-bold">Filter Rentang Waktu:</span>
            </div>
            
            <input 
              type="date" 
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              className="bg-surface-container-lowest/50 border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-primary [color-scheme:dark] cursor-pointer"
            />
            <span className="text-slate-500 font-bold">-</span>
            <input 
              type="date" 
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              className="bg-surface-container-lowest/50 border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-primary [color-scheme:dark] cursor-pointer"
            />
            
            {(filterStartDate || filterEndDate) && (
              <button 
                onClick={() => {setFilterStartDate(''); setFilterEndDate('');}}
                className="text-xs text-error hover:bg-error/10 px-2 py-1 rounded transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <button 
            onClick={handleExportCSV}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 px-4 py-2 rounded-lg text-sm font-bold text-slate-200 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export ke CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
            <h3 className="text-label-sm font-data-mono text-slate-500 uppercase tracking-wider mb-2">Total Pendapatan Terfilter</h3>
            <div className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
              Rp {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
            <h3 className="text-label-sm font-data-mono text-slate-500 uppercase tracking-wider mb-2">Total Pengeluaran Terfilter</h3>
            <div className="text-2xl md:text-3xl font-bold tracking-tight text-[#FDE047]">
              Rp {formatCurrency(totalExpense)}
            </div>
          </div>
          <div className="glass-card rounded-xl p-6 flex flex-col justify-between hover:border-primary/30 transition-colors">
            <h3 className="text-label-sm font-data-mono text-slate-500 uppercase tracking-wider mb-2">Net Cashflow</h3>
            <div className={`text-2xl md:text-3xl font-bold tracking-tight ${netCashflow >= 0 ? 'text-primary' : 'text-error'}`}>
              Rp {formatCurrency(netCashflow)}
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 flex flex-col justify-between bg-primary/5 border border-primary/20">
            <h3 className="text-[10px] font-data-mono text-primary/80 uppercase tracking-wider mb-2">Sisa Saldo Operasional</h3>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Cash:</span>
                <span className={`font-data-mono font-bold ${financialData.operationalBalanceCash >= 0 ? 'text-primary' : 'text-error'}`}>
                  Rp {formatCurrency(financialData.operationalBalanceCash)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">E-Money:</span>
                <span className={`font-data-mono font-bold ${financialData.operationalBalanceEmoney >= 0 ? 'text-primary' : 'text-error'}`}>
                  Rp {formatCurrency(financialData.operationalBalanceEmoney)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Input Form Panel */}
          <section className="col-span-12 lg:col-span-4 glass-panel rounded-xl p-6 flex flex-col h-fit shadow-[0_0_20px_rgba(0,0,0,0.2)]">
            <h3 className="text-headline-sm font-headline-sm text-slate-200 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">{editingRecordId ? 'edit_square' : 'add_circle'}</span>
              {editingRecordId ? 'Revisi Transaksi' : 'Catat Transaksi Baru'}
            </h3>
            
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Jenis Transaksi</label>
                <div className="flex gap-3 bg-surface-container-lowest/30 p-1.5 rounded-xl border border-outline-variant/50">
                  <button 
                    onClick={() => setType('Income')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${type === 'Income' ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-slate-500 hover:text-slate-200 hover:bg-surface-container/50'}`}
                  >
                    <span className="material-symbols-outlined text-sm">arrow_downward</span>
                    Pemasukan
                  </button>
                  <button 
                    onClick={() => setType('Expense')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${type === 'Expense' ? 'bg-[#FDE047]/20 text-[#FDE047] border border-[#FDE047]/30 shadow-[0_0_10px_rgba(253,224,71,0.2)]' : 'text-slate-500 hover:text-slate-200 hover:bg-surface-container/50'}`}
                  >
                    <span className="material-symbols-outlined text-sm">arrow_upward</span>
                    Pengeluaran
                  </button>
                  <button 
                    onClick={() => setType('Transfer')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${type === 'Transfer' ? 'bg-secondary/20 text-secondary border border-secondary/30 shadow-[0_0_10px_rgba(167,139,250,0.2)]' : 'text-slate-500 hover:text-slate-200 hover:bg-surface-container/50'}`}
                  >
                    <span className="material-symbols-outlined text-sm">sync_alt</span>
                    Transfer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Tanggal</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-sm pointer-events-none">calendar_today</span>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    onKeyDown={(e) => handleEnter(e, catRef)}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 pl-11 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner [color-scheme:dark] cursor-pointer" 
                  />
                </div>
              </div>
              
              {type !== 'Transfer' && (
                <div>
                  <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Kategori / Nama</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-sm z-10">category</span>
                    
                    {isCustomCategory ? (
                      <div className="flex w-full gap-2">
                        <input 
                          id="cf-category"
                          ref={catRef}
                          type="text" 
                          value={category} 
                          onChange={(e) => setCategory(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && document.getElementById('cf-amount')?.focus()}
                          placeholder="Ketik nama kategori..."
                          className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 pl-11 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner" 
                          autoFocus
                        />
                        <button 
                          onClick={() => { setIsCustomCategory(false); setCategory(''); }}
                          className="bg-surface-container-high hover:bg-surface-variant flex items-center justify-center px-3 rounded-xl border border-outline-variant text-slate-400 hover:text-error transition-colors"
                          title="Batal custom kategori"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <select
                          id="cf-category"
                          ref={catRef}
                          value={category}
                          onChange={(e) => {
                            if (e.target.value === 'LAINNYA') {
                              setIsCustomCategory(true);
                              setCategory('');
                            } else {
                              setCategory(e.target.value);
                            }
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && document.getElementById('cf-amount')?.focus()}
                          className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 pl-11 pr-10 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner appearance-none cursor-pointer [color-scheme:dark]" 
                        >
                          <option value="" disabled>Pilih Kategori...</option>
                          {/* Operational Wallets */}
                          {financialData.operationalWallets && financialData.operationalWallets.length > 0 && (
                            <optgroup label="Alokasi Operasional">
                              {financialData.operationalWallets.map(w => (
                                <option key={w.id} value={w.name}>{w.name}</option>
                              ))}
                            </optgroup>
                          )}
                          
                          {/* Portofolio Accounts */}
                          {financialData.accounts && financialData.accounts.length > 0 && (
                            <optgroup label="Portofolio (Tabungan & Investasi)">
                              {financialData.accounts.map(acc => (
                                <option key={acc.id} value={acc.name}>{acc.name} - Rp{formatCurrency(acc.value)}</option>
                              ))}
                            </optgroup>
                          )}
                          
                          {customCategories.length > 0 && (
                            <optgroup label="Kategori Tambahan Anda">
                              {customCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </optgroup>
                          )}
                          
                          <optgroup label="Lainnya">
                            {type === 'Income' ? (
                              <>
                                <option value="Gaji">Gaji</option>
                                <option value="Bonus">Bonus</option>
                                <option value="Hasil Investasi">Hasil Investasi</option>
                              </>
                            ) : (
                              <>
                                <option value="Tagihan">Tagihan (Listrik, Air)</option>
                                <option value="Belanja Bulanan">Belanja Bulanan</option>
                                <option value="Kesehatan">Kesehatan</option>
                              </>
                            )}
                            <option value="LAINNYA">+ Ketik Kategori Lainnya...</option>
                          </optgroup>
                        </select>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none">expand_more</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {type === 'Transfer' && (
                <div>
                  <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Arah Transfer</label>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${transferDirection === 'ToCash' ? 'bg-secondary/10 border-secondary/50 text-secondary' : 'border-outline-variant text-slate-400 hover:bg-surface-variant/30'}`}>
                      <input type="radio" name="direction" value="ToCash" checked={transferDirection === 'ToCash'} onChange={() => setTransferDirection('ToCash')} className="hidden" />
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-[18px]">payments</span>
                        <span className="text-sm font-medium">Tarik Tunai</span>
                      </div>
                      <span className="text-[10px] opacity-70">(E-Money → Cash)</span>
                    </label>
                    <label className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${transferDirection === 'ToEmoney' ? 'bg-secondary/10 border-secondary/50 text-secondary' : 'border-outline-variant text-slate-400 hover:bg-surface-variant/30'}`}>
                      <input type="radio" name="direction" value="ToEmoney" checked={transferDirection === 'ToEmoney'} onChange={() => setTransferDirection('ToEmoney')} className="hidden" />
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                        <span className="text-sm font-medium">Setor Tunai</span>
                      </div>
                      <span className="text-[10px] opacity-70">(Cash → E-Money)</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-data-mono text-slate-300 text-sm">Rp</span>
                  <input 
                    id="cf-amount"
                    ref={amountRef}
                    type="text" 
                    value={amount} 
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      if (raw) {
                        setAmount(parseInt(raw, 10).toLocaleString('id-ID'));
                      } else {
                        setAmount('');
                      }
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && document.getElementById('cf-notes')?.focus()}
                    placeholder="0" 
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 pl-11 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Keterangan (Opsional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-sm">notes</span>
                  <input 
                    id="cf-notes"
                    type="text" 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('cf-submit')?.click(); } }}
                    placeholder="Tulis catatan tambahan..." 
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 pl-11 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner" 
                  />
                </div>
              </div>

              {(type === 'Expense' || (type === 'Income' && isOperationalPool)) && (
                <div>
                  <label className="block text-label-sm font-label-sm text-slate-500 mb-2">
                    {type === 'Income' ? 'Uang Masuk ke' : 'Metode Pembayaran'}
                  </label>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'Cash' ? 'bg-[#FDE047]/10 border-[#FDE047]/50 text-[#FDE047]' : 'border-outline-variant text-slate-400 hover:bg-surface-variant/30'}`}>
                      <input type="radio" name="payment" value="Cash" checked={paymentMethod === 'Cash'} onChange={() => setPaymentMethod('Cash')} className="hidden" />
                      <span className="material-symbols-outlined text-[18px]">payments</span>
                      <span className="text-sm font-medium">Cash</span>
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'Saldo' ? 'bg-[#FDE047]/10 border-[#FDE047]/50 text-[#FDE047]' : 'border-outline-variant text-slate-400 hover:bg-surface-variant/30'}`}>
                      <input type="radio" name="payment" value="Saldo" checked={paymentMethod === 'Saldo'} onChange={() => setPaymentMethod('Saldo')} className="hidden" />
                      <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                      <span className="text-sm font-medium">E-Money</span>
                    </label>
                  </div>
                </div>
              )}

              {type === 'Income' && (
                <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 p-3 rounded-xl mt-2 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setIsOperationalPool(!isOperationalPool)}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isOperationalPool ? 'bg-primary border-primary text-white' : 'border-outline-variant text-transparent'}`}>
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-bold text-slate-200 block">Masukkan ke Saldo Operasional?</span>
                    <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">Uang ini akan ditampung di Pool Operasional untuk Anda bagikan ke kantong-kantong.</span>
                  </div>
                </div>
              )}
            </div>

            <button 
              id="cf-submit"
              onClick={editingRecordId ? handleUpdateRecord : handleAddRecord} 
              disabled={(!category && type !== 'Transfer') || !amount}
              className={`w-full mt-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold ${(!category && type !== 'Transfer' || !amount) ? 'bg-surface-container text-slate-500 cursor-not-allowed' : type === 'Income' ? 'bg-primary text-on-primary hover:bg-primary-fixed shadow-[0_0_15px_rgba(78,222,163,0.3)]' : type === 'Expense' ? 'bg-[#FDE047] text-slate-900 hover:bg-[#FEF08A] shadow-[0_0_15px_rgba(253,224,71,0.3)]' : 'bg-secondary text-white hover:bg-secondary-fixed shadow-[0_0_15px_rgba(167,139,250,0.3)]'}`}
            >
              <span className="material-symbols-outlined text-sm">{editingRecordId ? 'update' : 'save'}</span>
              {editingRecordId ? 'Update Transaksi' : 'Simpan Transaksi'}
            </button>
            {editingRecordId && (
              <button 
                onClick={() => {
                  setEditingRecordId(null);
                  setCategory('');
                  setIsCustomCategory(false);
                  setAmount('');
                  setNotes('');
                }}
                className="w-full mt-3 py-3 rounded-xl border border-outline-variant text-slate-400 hover:text-slate-200 hover:bg-surface-variant/30 transition-all font-bold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                Batal Revisi
              </button>
            )}
          </section>

          {/* Table Panel */}
          <section className="col-span-12 lg:col-span-8 glass-panel rounded-xl p-0 flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.2)]">
            <div className="p-6 border-b border-white/5 bg-surface-container/20">
              <h3 className="text-headline-sm font-headline-sm text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                Riwayat Arus Kas
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 text-xs font-data-mono uppercase tracking-wider bg-surface-container/20">
                    <th className="p-4 font-medium">Tanggal</th>
                    <th className="p-4 font-medium">Jenis</th>
                    <th className="p-4 font-medium">Kategori</th>
                    <th className="p-4 font-medium text-right">Nominal</th>
                    <th className="p-4 font-medium text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-sm">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-16 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center opacity-80">
                          <span className="material-symbols-outlined text-6xl mb-4 text-slate-600">account_balance_wallet</span>
                          <p className="text-lg font-medium text-slate-300">Belum Ada Arus Kas</p>
                          <p className="text-sm mt-1 text-slate-500">Tidak ada catatan yang ditemukan untuk rentang tanggal ini.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    [...filteredRecords].sort((a,b) => b.id - a.id).map(record => (
                      <tr key={record.id} className="hover:bg-surface-container/20 transition-colors group">
                        <td className="p-4 text-slate-200 whitespace-nowrap">{new Date(record.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</td>
                        <td className="p-4">
                          <div className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-widest inline-flex items-center gap-1 font-bold ${record.type === 'Income' ? 'border-primary/30 text-primary bg-primary/10' : record.type === 'Expense' ? 'border-[#FDE047]/30 text-[#FDE047] bg-[#FDE047]/10' : 'border-secondary/30 text-secondary bg-secondary/10'}`}>
                            <span className="material-symbols-outlined text-[12px]">
                              {record.type === 'Income' ? 'arrow_downward' : record.type === 'Expense' ? 'arrow_upward' : 'sync_alt'}
                            </span>
                            {record.type === 'Income' ? 'Pemasukan' : record.type === 'Expense' ? 'Pengeluaran' : 'Transfer'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-200">{record.category}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {record.paymentMethod && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/30 text-slate-400 uppercase tracking-widest">{record.paymentMethod}</span>
                            )}
                            {record.notes && <span className="text-xs text-slate-400">{record.notes}</span>}
                          </div>
                        </td>
                        <td className={`p-4 text-right font-data-mono font-bold ${record.type === 'Income' ? 'text-primary' : record.type === 'Expense' ? 'text-[#FDE047]' : 'text-secondary'}`}>
                          {record.type === 'Income' ? '+' : record.type === 'Expense' ? '-' : ''}Rp {formatCurrency(record.amount)}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEditClick(record)}
                              className="text-slate-500 hover:text-primary transition-colors p-1"
                              title="Edit/Revisi"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDelete(record.id)}
                              className="text-slate-500 hover:text-error transition-colors p-1"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
