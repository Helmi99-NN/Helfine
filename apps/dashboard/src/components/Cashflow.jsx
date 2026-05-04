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

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('Income'); // 'Income' or 'Expense'
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const catRef = useRef(null);
  const amountRef = useRef(null);

  const handleAddRecord = () => {
    if (!category || !amount) return;
    
    const newRecord = {
      id: Date.now(),
      date,
      type,
      category,
      amount: parseFloat(amount),
      notes
    };

    const newRecords = [newRecord, ...records];
    setRecords(newRecords);
    localStorage.setItem('cashflow_records', JSON.stringify(newRecords));
    financialData.syncSheet && financialData.syncSheet('Cashflow', newRecords).catch(console.error);
    
    // Reset form
    setCategory('');
    setAmount('');
    setNotes('');
    catRef.current?.focus();
  };

  const handleDelete = (id) => {
    const newRecords = records.filter(t => t.id !== id);
    setRecords(newRecords);
    localStorage.setItem('cashflow_records', JSON.stringify(newRecords));
    financialData.syncSheet && financialData.syncSheet('Cashflow', newRecords).catch(console.error);
  };

  // Calculate summaries for current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthRecords = records.filter(r => {
    const d = new Date(r.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = currentMonthRecords.filter(r => r.type === 'Income').reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = currentMonthRecords.filter(r => r.type === 'Expense').reduce((sum, r) => sum + r.amount, 0);
  const netCashflow = totalIncome - totalExpense;

  const handleEnter = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef === 'submit') handleAddRecord();
      else nextRef?.current?.focus();
    }
  };

  return (
    <main className="md:ml-64 pt-24 px-4 md:px-margin-page pb-margin-page w-full md:w-[calc(100%-16rem)] min-h-screen">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div>
          <h2 className="text-3xl md:text-display-lg font-display-lg text-slate-200 flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl md:text-4xl text-emerald-400">account_balance_wallet</span>
            Arus Kas (Cashflow)
          </h2>
          <p className="text-slate-400 mt-2 font-body-base text-body-base">Catat semua pemasukan dan pengeluaran ekstra yang akan diakumulasikan secara otomatis setiap tanggal 20.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
            <h3 className="text-label-sm font-data-mono text-slate-500 uppercase tracking-wider mb-2">Total Pendapatan Bulan Ini</h3>
            <div className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-400">
              Rp {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
            <h3 className="text-label-sm font-data-mono text-slate-500 uppercase tracking-wider mb-2">Total Pengeluaran Bulan Ini</h3>
            <div className="text-2xl md:text-3xl font-bold tracking-tight text-[#FDE047]">
              Rp {formatCurrency(totalExpense)}
            </div>
          </div>
          <div className="glass-card rounded-xl p-6 flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
            <h3 className="text-label-sm font-data-mono text-slate-500 uppercase tracking-wider mb-2">Net Cashflow</h3>
            <div className={`text-2xl md:text-3xl font-bold tracking-tight ${netCashflow >= 0 ? 'text-emerald-400' : 'text-error'}`}>
              Rp {formatCurrency(netCashflow)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Input Form Panel */}
          <section className="col-span-12 lg:col-span-4 glass-panel rounded-xl p-6 flex flex-col h-fit shadow-[0_0_20px_rgba(0,0,0,0.2)]">
            <h3 className="text-headline-sm font-headline-sm text-slate-200 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">add_circle</span>
              Catat Transaksi Baru
            </h3>
            
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Jenis Transaksi</label>
                <div className="flex gap-3 bg-surface-container-lowest/30 p-1.5 rounded-xl border border-outline-variant/50">
                  <button 
                    onClick={() => setType('Income')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${type === 'Income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-slate-500 hover:text-slate-200 hover:bg-surface-container/50'}`}
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
                </div>
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Tanggal</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">calendar_today</span>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    onKeyDown={(e) => handleEnter(e, catRef)}
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 pl-11 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner [color-scheme:dark]" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Kategori / Nama</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">category</span>
                  <input 
                    ref={catRef}
                    type="text" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    onKeyDown={(e) => handleEnter(e, amountRef)}
                    placeholder={type === 'Income' ? "Misal: Gaji, Komisi Mesin..." : "Misal: Iklan Shopee..."}
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 pl-11 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-data-mono text-slate-400 text-sm">Rp</span>
                  <input 
                    ref={amountRef}
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyDown={(e) => handleEnter(e, 'submit')}
                    placeholder="0" 
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 pl-11 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner" 
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleAddRecord} 
              disabled={!category || !amount}
              className={`w-full mt-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold ${(!category || !amount) ? 'bg-surface-container text-slate-500 cursor-not-allowed' : type === 'Income' ? 'bg-emerald-500 text-on-primary hover:bg-emerald-500-fixed shadow-[0_0_15px_rgba(78,222,163,0.3)]' : 'bg-[#FDE047] text-slate-900 hover:bg-[#FEF08A] shadow-[0_0_15px_rgba(253,224,71,0.3)]'}`}
            >
              <span className="material-symbols-outlined text-sm">save</span>
              Simpan Transaksi
            </button>
          </section>

          {/* Table Panel */}
          <section className="col-span-12 lg:col-span-8 glass-panel rounded-xl p-0 flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.2)]">
            <div className="p-6 border-b border-white/5 bg-surface-container/20">
              <h3 className="text-headline-sm font-headline-sm text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">receipt_long</span>
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
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500">
                        Belum ada catatan arus kas.
                      </td>
                    </tr>
                  ) : (
                    records.sort((a,b) => new Date(b.date) - new Date(a.date)).map(record => (
                      <tr key={record.id} className="hover:bg-surface-container/20 transition-colors group">
                        <td className="p-4 text-slate-200 whitespace-nowrap">{new Date(record.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</td>
                        <td className="p-4">
                          <div className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-widest inline-flex items-center gap-1 font-bold ${record.type === 'Income' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-[#FDE047]/30 text-[#FDE047] bg-[#FDE047]/10'}`}>
                            <span className="material-symbols-outlined text-[12px]">
                              {record.type === 'Income' ? 'arrow_downward' : 'arrow_upward'}
                            </span>
                            {record.type === 'Income' ? 'Pemasukan' : 'Pengeluaran'}
                          </div>
                        </td>
                        <td className="p-4 font-medium text-slate-200">{record.category}</td>
                        <td className={`p-4 text-right font-data-mono font-bold ${record.type === 'Income' ? 'text-emerald-400' : 'text-[#FDE047]'}`}>
                          {record.type === 'Income' ? '+' : '-'}Rp {formatCurrency(record.amount)}
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => handleDelete(record.id)}
                            className="text-slate-500 hover:text-error transition-colors p-1 opacity-0 group-hover:opacity-100"
                            title="Hapus"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
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
