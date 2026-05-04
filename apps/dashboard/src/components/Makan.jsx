import React, { useState, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export default function Makan({ financialData }) {
  const { operationalWallets } = financialData || { operationalWallets: [] };
  const makanWallet = operationalWallets.find(w => w.id === 'makan') || { value: 750000 };
  const monthlyFoodBudget = makanWallet.value;
  const dailyFoodBudget = 30000;

  const today = new Date();
  const formatDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = formatDateStr(today);
  
  const getYesterdayStr = () => {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return formatDateStr(d);
  };
  const yesterdayStr = getYesterdayStr();

  // Period calculation (Mulai tgl 20)
  const startPeriod = new Date(today.getFullYear(), today.getMonth(), 20);
  if (today.getDate() < 20) {
    startPeriod.setMonth(startPeriod.getMonth() - 1);
  }
  const startPeriodStr = formatDateStr(startPeriod);
  const periodStartLabel = startPeriod.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

  const [foodTransactions, setFoodTransactions] = useState(() => {
    try {
      const stored = localStorage.getItem('makan_transactions');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  const [foodNominal, setFoodNominal] = useState('');
  const [foodDesc, setFoodDesc] = useState('');
  const [foodDate, setFoodDate] = useState(todayStr);
  const [foodMethod, setFoodMethod] = useState('Cash');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  const [baseCash, setBaseCash] = useState(0);
  const baseSaldo = monthlyFoodBudget - baseCash;
  
  // Refs for enter-key navigation
  const ketRef = useRef(null);
  const nomRef = useRef(null);

  const totalFoodSpent = foodTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalCashSpent = foodTransactions.filter(t => t.method === 'Cash').reduce((acc, curr) => acc + curr.amount, 0);
  const totalSaldoSpent = foodTransactions.filter(t => t.method === 'Saldo').reduce((acc, curr) => acc + curr.amount, 0);
  
  const remainingCash = baseCash - totalCashSpent;
  const remainingSaldo = baseSaldo - totalSaldoSpent;
  
  const remainingFoodBudget = monthlyFoodBudget - totalFoodSpent;
  const isFoodOverBudget = totalFoodSpent > monthlyFoodBudget;

  // Calculate Total Lebih & Hemat (since 20th) for days with records
  let totalLebih = 0;
  let totalHemat = 0;

  const currentPeriodGrouped = foodTransactions.reduce((acc, tx) => {
    if (tx.date >= startPeriodStr && tx.date <= todayStr) {
      if (!acc[tx.date]) acc[tx.date] = 0;
      acc[tx.date] += tx.amount;
    }
    return acc;
  }, {});

  Object.values(currentPeriodGrouped).forEach(dayTotal => {
    if (dayTotal > dailyFoodBudget) {
      totalLebih += (dayTotal - dailyFoodBudget);
    } else {
      totalHemat += (dailyFoodBudget - dayTotal);
    }
  });

  const netSavings = totalHemat - totalLebih;
  const isNetHemat = netSavings >= 0;
  const absNetSavings = Math.abs(netSavings);

  const handleRemainingCashChange = (e) => {
    const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
    setBaseCash(val + totalCashSpent);
  };

  const handleRemainingSaldoChange = (e) => {
    const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
    const newBaseSaldo = val + totalSaldoSpent;
    setBaseCash(monthlyFoodBudget - newBaseSaldo);
  };

  const handleNominalChange = (e) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    if (!numericValue) {
      setFoodNominal('');
      return;
    }
    const formatted = parseInt(numericValue, 10).toLocaleString('id-ID');
    setFoodNominal(formatted);
  };

  const handleAddFood = () => {
    const amount = parseInt(foodNominal.replace(/\D/g, ''), 10);
    if (!isNaN(amount) && amount > 0 && foodDesc.trim() !== '') {
      const newTxs = [{
        id: Date.now(),
        name: foodDesc,
        amount: amount,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: foodDate,
        method: foodMethod
      }, ...foodTransactions];
      
      setFoodTransactions(newTxs);
      localStorage.setItem('makan_transactions', JSON.stringify(newTxs));
      financialData.syncSheet && financialData.syncSheet('Makan', newTxs).catch(console.error);
      
      setFoodNominal('');
      setFoodDesc('');
      ketRef.current?.focus(); // Return focus to keterangan after saving
    }
  };

  // Keyboard Navigation
  const handleDateKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); ketRef.current?.focus(); } };
  const handleKetKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); nomRef.current?.focus(); } };
  const handleNomKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFood(); } };

  const handleDeleteFood = (id) => {
    const newTxs = foodTransactions.filter(tx => tx.id !== id);
    setFoodTransactions(newTxs);
    localStorage.setItem('makan_transactions', JSON.stringify(newTxs));
    financialData.syncSheet && financialData.syncSheet('Makan', newTxs).catch(console.error);
  };

  const formatDate = (dateString) => {
    if (dateString === todayStr) return 'Hari Ini';
    if (dateString === yesterdayStr) return 'Kemarin';
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // Apply Filter
  const filteredTransactions = foodTransactions.filter(tx => {
    if (filterStartDate && filterEndDate) {
      return tx.date >= filterStartDate && tx.date <= filterEndDate;
    } else if (filterStartDate) {
      return tx.date >= filterStartDate;
    } else if (filterEndDate) {
      return tx.date <= filterEndDate;
    }
    return true;
  });

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a));

  // Chart Data preparation (Last 7 days of transactions)
  const chartData = sortedDates.slice(0, 7).reverse().map(date => {
    const dayTxs = groupedTransactions[date];
    const dayTotal = dayTxs.reduce((sum, tx) => sum + tx.amount, 0);
    return {
      date: formatDate(date),
      pengeluaran: dayTotal,
      budget: dailyFoodBudget
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 rounded-lg border border-white/10 shadow-lg bg-surface/90 backdrop-blur-md">
          <p className="text-slate-400 text-xs mb-1">{label}</p>
          <p className="text-emerald-400 font-bold">
            Rp {financialData.formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="md:ml-64 pt-24 px-4 md:px-margin-page pb-margin-page w-full md:w-[calc(100%-16rem)] min-h-screen">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div>
          <h2 className="text-3xl md:text-display-lg font-display-lg text-slate-200 flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl md:text-4xl text-emerald-400">restaurant</span>
            Pencatatan Makan
          </h2>
          <p className="text-slate-400 mt-2 font-body-base text-body-base">Lacak pengeluaran konsumsi Anda dari jatah bulanan dan harian.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          
          {/* Main Tracker Panel */}
          <section className="col-span-12 lg:col-span-7 glass-panel rounded-xl p-8 flex flex-col justify-center hover:shadow-[0_0_30px_rgba(78,222,163,0.08)] transition-shadow duration-300">
            <div>
              <h3 className="text-label-lg text-slate-500 font-data-mono tracking-widest uppercase mb-4">Anggaran Bulan Ini</h3>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-6">
                <div className={`text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight ${isFoodOverBudget ? 'text-error' : 'text-emerald-400'}`}>
                  Rp {financialData.formatCurrency(totalFoodSpent)}
                </div>
                <div className="text-data-mono font-data-mono text-slate-500 text-sm md:text-xl mb-1 md:mb-2">/ Rp {financialData.formatCurrency(monthlyFoodBudget)}</div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-5 w-full bg-slate-800 rounded-full overflow-hidden mt-6 border border-white/10 relative shadow-inner">
                <div className={`h-full rounded-full transition-all duration-700 ease-out ${isFoodOverBudget ? 'bg-error shadow-[0_0_15px_rgba(255,180,171,0.6)] w-full' : 'bg-gradient-to-r from-primary to-[#4edea3] shadow-[0_0_15px_rgba(78,222,163,0.4)]'}`} style={{ width: isFoodOverBudget ? '100%' : `${(totalFoodSpent / monthlyFoodBudget) * 100}%` }}></div>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className={`flex items-center gap-2 bg-surface-container/50 px-5 py-2.5 rounded-full border ${isFoodOverBudget ? 'border-error/30' : 'border-emerald-500/30'}`}>
                  <span className="material-symbols-outlined text-lg" style={{ color: isFoodOverBudget ? '#ffb4ab' : '#4edea3' }}>
                    {isFoodOverBudget ? 'warning' : 'check_circle'}
                  </span>
                  <span className={`text-label-md font-label-md ${isFoodOverBudget ? 'text-error' : 'text-emerald-400'}`}>
                    {isFoodOverBudget ? `Overbudget Rp ${financialData.formatCurrency(Math.abs(remainingFoodBudget))}` : `Tersisa Rp ${financialData.formatCurrency(remainingFoodBudget)}`}
                  </span>
                </div>
                
                <div className="text-body-lg text-slate-500 font-data-mono">
                  {((totalFoodSpent / monthlyFoodBudget) * 100).toFixed(1)}% Terpakai
                </div>
              </div>
              
              {/* Rekap Net Lebih/Hemat Periode Ini */}
              <div className="mt-8">
                <div className={`border p-4 rounded-xl flex items-center justify-between ${isNetHemat ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-error-container/10 border-error/20'}`}>
                  <div>
                    <div className={`flex items-center gap-2 mb-1 ${isNetHemat ? 'text-emerald-400' : 'text-error'}`}>
                      <span className="material-symbols-outlined text-sm">
                        {isNetHemat ? 'savings' : 'trending_up'}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {isNetHemat ? 'TOTAL HEMAT' : 'TOTAL LEBIH'}
                      </span>
                    </div>
                    <div className={`text-[10px] uppercase tracking-wider ${isNetHemat ? 'text-emerald-400/70' : 'text-error/70'}`}>
                      SEJAK {periodStartLabel}
                    </div>
                  </div>
                  <div className={`text-xl sm:text-2xl md:text-3xl font-bold font-data-mono tracking-tight ${isNetHemat ? 'text-emerald-400' : 'text-error'}`}>
                    {isNetHemat ? '+' : '-'}Rp {financialData.formatCurrency(absNetSavings)}
                  </div>
                </div>
              </div>
              
              {/* Breakdown Cash vs Saldo */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-surface-container/40 p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center group transition-colors hover:bg-surface-container/60 hover:border-emerald-500/30">
                  <div className="text-xs text-slate-500 mb-1 font-medium tracking-wide uppercase">Sisa Cash</div>
                  <div className="flex items-center">
                    <span className="text-sm font-data-mono text-slate-400 mr-1">Rp</span>
                    <input 
                      className="w-full max-w-[140px] bg-transparent border-b border-transparent focus:border-emerald-500 text-lg sm:text-xl font-data-mono text-slate-200 text-center outline-none transition-colors"
                      value={remainingCash === 0 ? '' : remainingCash.toLocaleString('id-ID')}
                      onChange={handleRemainingCashChange}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="bg-surface-container/40 p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center group transition-colors hover:bg-surface-container/60 hover:border-secondary/30">
                  <div className="text-xs text-slate-500 mb-1 font-medium tracking-wide uppercase">Sisa Saldo</div>
                  <div className="flex items-center">
                    <span className="text-sm font-data-mono text-secondary/70 mr-1">Rp</span>
                    <input 
                      className="w-full max-w-[140px] bg-transparent border-b border-transparent focus:border-secondary text-lg sm:text-xl font-data-mono text-secondary text-center outline-none transition-colors"
                      value={remainingSaldo === 0 ? '' : remainingSaldo.toLocaleString('id-ID')}
                      onChange={handleRemainingSaldoChange}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Input Form Panel */}
          <section className="col-span-12 lg:col-span-5 glass-panel rounded-xl p-8 flex flex-col hover:shadow-[0_0_30px_rgba(78,222,163,0.08)] transition-shadow duration-300">
            <h3 className="text-headline-sm font-headline-sm text-slate-200 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">add_circle</span>
              Catat Pengeluaran
            </h3>
            
            <div className="space-y-4 flex-1">
              {/* Metode Pembayaran */}
              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Metode Pembayaran</label>
                <div className="flex gap-3 bg-surface-container-lowest/30 p-1.5 rounded-xl border border-outline-variant/50">
                  <button 
                    onClick={() => setFoodMethod('Cash')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${foodMethod === 'Cash' ? 'bg-emerald-500 text-on-primary shadow-[0_0_10px_rgba(78,222,163,0.3)]' : 'text-slate-500 hover:text-slate-200 hover:bg-surface-container/50'}`}
                  >
                    Cash
                  </button>
                  <button 
                    onClick={() => setFoodMethod('Saldo')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${foodMethod === 'Saldo' ? 'bg-secondary text-on-secondary shadow-[0_0_10px_rgba(100,181,246,0.3)]' : 'text-slate-500 hover:text-slate-200 hover:bg-surface-container/50'}`}
                  >
                    Saldo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Tanggal</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">calendar_today</span>
                  <input 
                    type="date" 
                    value={foodDate} 
                    onChange={(e) => setFoodDate(e.target.value)} 
                    onKeyDown={handleDateKeyDown}
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-3 pl-11 text-body-base text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner [color-scheme:dark]" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Keterangan</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">edit_note</span>
                  <input 
                    ref={ketRef}
                    type="text" 
                    value={foodDesc} 
                    onChange={(e) => setFoodDesc(e.target.value)} 
                    onKeyDown={handleKetKeyDown}
                    placeholder="Contoh: Nasi Padang..." 
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-3 pl-11 text-body-base text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Nominal</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-data-mono text-slate-400">Rp</span>
                  <input 
                    ref={nomRef}
                    type="text" 
                    value={foodNominal} 
                    onChange={handleNominalChange} 
                    onKeyDown={handleNomKeyDown}
                    placeholder="0" 
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-3 pl-12 text-data-mono font-data-mono text-lg text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner" 
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleAddFood} 
              disabled={!foodNominal || !foodDesc}
              className={`w-full mt-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2 font-bold shadow-[0_0_15px_rgba(78,222,163,0.3)] ${!foodNominal || !foodDesc ? 'bg-surface-container text-slate-500 cursor-not-allowed shadow-none' : 'bg-emerald-500 text-on-primary hover:bg-emerald-500-fixed'}`}
            >
              <span className="material-symbols-outlined">add_shopping_cart</span>
              Simpan Transaksi
            </button>
          </section>
          
        </div>

        {/* Chart Section */}
        {chartData.length > 0 && (
          <section className="glass-panel rounded-xl p-8 hover:shadow-[0_0_30px_rgba(78,222,163,0.08)] transition-shadow duration-300">
            <h3 className="text-headline-sm font-headline-sm text-slate-200 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">bar_chart</span>
              Grafik Pengeluaran (7 Hari Terakhir)
            </h3>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickFormatter={(value) => `Rp ${financialData.formatCurrency(value)}`} width={80} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <ReferenceLine y={dailyFoodBudget} stroke="#ffb4ab" strokeDasharray="3 3" label={{ position: 'top', value: 'Batas Harian (Rp 30.000)', fill: '#ffb4ab', fontSize: 12 }} />
                  <Bar dataKey="pengeluaran" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
        
        {/* Transaction History Full Width */}
        <section className="glass-panel rounded-xl p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-white/5 gap-4">
            <h3 className="text-headline-sm font-headline-sm text-slate-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">history</span>
              Riwayat Makan
            </h3>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="text-label-sm text-slate-500 hidden sm:inline-block">Filter Tanggal:</span>
              <div className="flex flex-wrap items-center gap-2">
                <input 
                  type="date" 
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="bg-surface-container-lowest/50 border border-outline-variant rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner [color-scheme:dark]"
                  title="Dari Tanggal"
                />
                <span className="text-slate-500 text-sm">-</span>
                <input 
                  type="date" 
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="bg-surface-container-lowest/50 border border-outline-variant rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner [color-scheme:dark]"
                  title="Sampai Tanggal"
                />
                {(filterStartDate || filterEndDate) && (
                  <button 
                    onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                    className="text-error hover:bg-error/10 p-1.5 rounded-lg transition-colors flex items-center justify-center"
                    title="Hapus Filter"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {sortedDates.length === 0 ? (
              <div className="text-center py-16 text-slate-500 bg-surface-container/20 rounded-xl border border-dashed border-white/10">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
                <p>{(filterStartDate || filterEndDate) ? 'Tidak ada transaksi pada rentang tanggal tersebut.' : 'Belum ada pengeluaran dicatat.'}</p>
              </div>
            ) : (
              sortedDates.map(date => {
                const dayTxs = groupedTransactions[date];
                const dayTotal = dayTxs.reduce((sum, tx) => sum + tx.amount, 0);
                const isDayOver = dayTotal > dailyFoodBudget;
                const dayDiff = Math.abs(dailyFoodBudget - dayTotal);
                
                return (
                  <div key={date} className="bg-surface-container-lowest/30 rounded-2xl border border-white/5 overflow-hidden shadow-sm">
                    {/* Date Header & Budget Info */}
                    <div className="bg-surface-container/40 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 shadow-inner">
                          <span className="material-symbols-outlined text-slate-500">event</span>
                        </div>
                        <div>
                          <div className="text-body-lg text-slate-200 font-semibold">{formatDate(date)}</div>
                          <div className="text-xs text-slate-400 font-data-mono mt-0.5">Total: Rp {financialData.formatCurrency(dayTotal)} / Rp 30.000</div>
                        </div>
                      </div>
                      
                      <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border ${isDayOver ? 'bg-error-container/10 border-error/20 text-error' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {isDayOver ? 'trending_up' : 'savings'}
                        </span>
                        <span className="text-label-sm font-bold tracking-wide">
                          {isDayOver ? `LEBIH Rp ${financialData.formatCurrency(dayDiff)}` : `HEMAT Rp ${financialData.formatCurrency(dayDiff)}`}
                        </span>
                      </div>
                    </div>
                    
                    {/* Daily Transactions */}
                    <div className="p-3 space-y-1">
                      {dayTxs.map(tx => (
                        <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl hover:bg-surface-container/40 transition-colors group gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tx.method === 'Saldo' ? 'bg-secondary/10 text-secondary' : 'bg-emerald-500/10 text-emerald-400'}`}>
                              <span className="material-symbols-outlined text-[18px]">
                                {tx.method === 'Saldo' ? 'account_balance_wallet' : 'payments'}
                              </span>
                            </div>
                            <div>
                              <div className="text-body-base text-slate-200 group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                                {tx.name}
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-widest ${tx.method === 'Saldo' ? 'border-secondary/30 text-secondary' : 'border-emerald-500/30 text-emerald-400'}`}>
                                  {tx.method}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 mt-1">{tx.time}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-14 sm:pl-0">
                            <div className="text-data-mono font-data-mono text-slate-200 font-medium text-lg">- Rp {financialData.formatCurrency(tx.amount)}</div>
                            <button 
                              onClick={() => handleDeleteFood(tx.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-error/20 hover:text-error transition-colors"
                              title="Hapus Transaksi"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
