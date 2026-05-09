import React, { useState, useEffect, useRef } from 'react';
import { initialTradingData } from '../data/trading_history';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, PieChart, Pie } from 'recharts';

export default function Trading({ financialData }) {
  const [trades, setTrades] = useState(() => {
    try {
      const saved = localStorage.getItem('trading_journal');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    
    // Fallback to imported initial data
    const seed = initialTradingData.map((t, i) => ({
      id: Date.now() + i,
      date: t.date,
      code: t.code,
      lot: t.lot,
      buy: t.buy,
      sell: t.sell,
      hasil: t.hasil,
      sekuritas: 'Stockbit',
      emotion: 'Disiplin',
      target: 0,
      stopLoss: 0
    }));
    
    localStorage.setItem('trading_journal', JSON.stringify(seed));
    return seed;
  });

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [code, setCode] = useState('');
  const [lot, setLot] = useState('');
  const [buy, setBuy] = useState('');
  const [sell, setSell] = useState('');
  const [target, setTarget] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [emotion, setEmotion] = useState('Disiplin');
  const [sekuritas, setSekuritas] = useState('Stockbit');

  const [editingTradeId, setEditingTradeId] = useState(null);
  const [editSellPrice, setEditSellPrice] = useState('');

  const codeRef = useRef(null);
  const lotRef = useRef(null);
  const buyRef = useRef(null);
  const targetRef = useRef(null);
  const stopLossRef = useRef(null);
  const sellRef = useRef(null);

  const formatNumber = (num) => financialData.formatCurrency(Math.round(num));

  const handleAddTrade = () => {
    if (!code || !lot || !buy) return;
    
    const newTrade = {
      id: Date.now(),
      date,
      code: code.toUpperCase(),
      lot: parseInt(lot, 10),
      buy: parseFloat(buy),
      sell: sell ? parseFloat(sell) : 0,
      target: target ? parseFloat(target) : 0,
      stopLoss: stopLoss ? parseFloat(stopLoss) : 0,
      emotion,
      sekuritas
    };

    const newTxs = [newTrade, ...trades];
    setTrades(newTxs);
    localStorage.setItem('trading_journal', JSON.stringify(newTxs));
    financialData.syncSheet && financialData.syncSheet('Trading', newTxs).catch(console.error);
    
    // Reset form but keep date
    setCode('');
    setLot('');
    setBuy('');
    setTarget('');
    setStopLoss('');
    setSell('');
    setEmotion('Disiplin');
    codeRef.current?.focus();
  };

  const handleSaveSellPrice = (id) => {
    const newSell = parseFloat(editSellPrice);
    if (!newSell) return;
    const newTxs = trades.map(t => t.id === id ? { ...t, sell: newSell } : t);
    setTrades(newTxs);
    localStorage.setItem('trading_journal', JSON.stringify(newTxs));
    financialData.syncSheet && financialData.syncSheet('Trading', newTxs).catch(console.error);
    setEditingTradeId(null);
    setEditSellPrice('');
  };

  const handleDeleteTrade = (id) => {
    const newTxs = trades.filter(t => t.id !== id);
    setTrades(newTxs);
    localStorage.setItem('trading_journal', JSON.stringify(newTxs));
    financialData.syncSheet && financialData.syncSheet('Trading', newTxs).catch(console.error);
  };

  // Calculate global summary
  let totalProfitLoss = 0;
  let winCount = 0;
  let lossCount = 0;

  const enrichedTrades = trades.map(t => {
    const isManualHasil = t.lot === 0 && t.hasil !== undefined;
    const totalBuy = isManualHasil ? 0 : t.lot * 100 * t.buy;
    const isOpen = isManualHasil ? false : (!t.sell || t.sell === 0);
    const result = isManualHasil ? t.hasil : (isOpen ? 0 : (t.sell - t.buy) * t.lot * 100);
    const percentage = isManualHasil ? 0 : (isOpen ? 0 : ((t.sell - t.buy) / t.buy) * 100);
    
    if (!isOpen || isManualHasil) {
      totalProfitLoss += result;
      if (result > 0) winCount++;
      else if (result < 0) lossCount++;
    }

    return { ...t, totalBuy, result, percentage, isOpen, isManualHasil };
  });

  // Sort by date descending
  enrichedTrades.sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalTrades = winCount + lossCount;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

  // Emotion Engine
  const lossEmotions = enrichedTrades.filter(t => !t.isOpen && t.result < 0 && t.emotion).map(t => t.emotion);
  let dominantLossEmotion = null;
  if (lossEmotions.length > 0) {
    const counts = lossEmotions.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});
    dominantLossEmotion = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  // Calculate Monthly P/L Summary
  const monthlySummary = {};
  enrichedTrades.forEach(t => {
    if (t.isOpen) return;
    
    const dateObj = new Date(t.date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const date = dateObj.getDate();

    let startMonth, startYear, endMonth, endYear;
    if (date >= 20) {
      startMonth = month;
      startYear = year;
      endMonth = (month + 1) % 12;
      endYear = month === 11 ? year + 1 : year;
    } else {
      startMonth = (month - 1 + 12) % 12;
      startYear = month === 0 ? year - 1 : year;
      endMonth = month;
      endYear = year;
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const sortKey = `${endYear}-${String(endMonth + 1).padStart(2, '0')}`;
    const name = `20 ${monthNames[startMonth]} - 19 ${monthNames[endMonth]} '${String(endYear).slice(2)}`;

    if (!monthlySummary[sortKey]) {
      monthlySummary[sortKey] = { name, sortKey, totalPL: 0, win: 0, loss: 0 };
    }
    monthlySummary[sortKey].totalPL += t.result;
    if (t.result >= 0) monthlySummary[sortKey].win++;
    else monthlySummary[sortKey].loss++;
  });

  const sortedMonthlySummary = Object.values(monthlySummary).sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  const handleEnter = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef === 'submit') handleAddTrade();
      else nextRef?.current?.focus();
    }
  };

  const formatAxisNumber = (num) => {
    if (Math.abs(num) >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}M`;
    if (Math.abs(num) >= 1000) return `Rp ${(num / 1000).toFixed(0)}K`;
    return `Rp ${num}`;
  };

  return (
    <main className="md:ml-64 pt-24 px-4 md:px-margin-page pb-margin-page w-full md:w-[calc(100%-16rem)] min-h-screen">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-display-lg font-display-lg text-slate-200 flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-primary">candlestick_chart</span>
              Jurnal Trading
            </h2>
            <button 
              onClick={() => {
                if(window.confirm('Muat ulang data dari Excel? Semua catatan manual Anda saat ini akan ditimpa!')) {
                  localStorage.removeItem('trading_journal');
                  window.location.reload();
                }
              }}
              className="text-xs bg-primary/10 text-primary px-4 py-2 rounded-lg border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              Muat Data Excel
            </button>
          </div>
          <p className="text-slate-300 mt-2 font-body-base text-body-base">Catat dan evaluasi performa trading Anda secara sistematis.</p>
        </div>

        {/* Evaluasi Emosional Insight */}
        {dominantLossEmotion && (
          <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex items-start gap-4">
            <span className="material-symbols-outlined text-error text-3xl shrink-0">psychology_alt</span>
            <div>
              <h3 className="text-sm font-bold text-error mb-1">Evaluasi Emosional</h3>
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                Sistem mendeteksi Anda paling sering mengalami <strong className="text-error font-bold drop-shadow-md">Loss</strong> saat bertrading dengan emosi <strong className="uppercase bg-error/20 text-error px-1.5 py-0.5 rounded font-bold">{dominantLossEmotion}</strong>. Cobalah untuk lebih tenang dan ikuti Trading Plan Anda!
              </p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Profit Card */}
          <div className="glass-card rounded-2xl p-6 flex flex-col justify-center items-center hover:border-primary/30 transition-colors relative overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/5 blur-[80px] pointer-events-none rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000"></div>
            
            <h3 className="text-sm font-bold text-slate-400 mb-4 z-10">Total Net Profit / Loss</h3>
            <div className={`text-4xl md:text-5xl font-bold tracking-tight mb-4 z-10 ${totalProfitLoss >= 0 ? 'text-primary drop-shadow-[0_0_20px_rgba(78,222,163,0.3)]' : 'text-error drop-shadow-[0_0_20px_rgba(255,82,82,0.3)]'}`}>
              Rp {formatNumber(totalProfitLoss)}
            </div>
            <div className="flex items-center gap-4 z-10 bg-surface-container/50 px-4 py-2 rounded-xl border border-outline-variant/30">
              <span className="text-sm text-slate-400">Win Rate</span>
              <span className="text-lg font-bold text-slate-200">{winRate.toFixed(1)}%</span>
            </div>
          </div>

          {/* Trade Summary Gauge */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 relative overflow-hidden flex flex-col">
            <div className="w-full flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                Trade Summary
              </h3>
              <select className="bg-surface-container/50 border border-outline-variant/30 text-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-primary hover:bg-surface-container transition-colors cursor-pointer appearance-none pr-8 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[position:right_10px_center] bg-no-repeat">
                <option>Last 1 Year</option>
                <option>All Time</option>
                <option>This Month</option>
              </select>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-end pb-2">
              <div className="relative w-[280px] h-[140px] flex justify-center drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        winCount + lossCount === 0 
                        ? [{ name: 'None', value: 1, color: '#334155' }]
                        : [
                            { name: 'Wins', value: winCount, color: '#10b981' },
                            { name: 'Losses', value: lossCount, color: '#ef4444' }
                          ]
                      }
                      cx="50%"
                      cy="100%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={90}
                      outerRadius={120}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      {(winCount + lossCount === 0 
                        ? [{ name: 'None', value: 1, color: '#334155' }]
                        : [
                            { name: 'Wins', value: winCount, color: '#10b981' },
                            { name: 'Losses', value: lossCount, color: '#ef4444' }
                          ]
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="text-3xl font-bold text-slate-200">{totalTrades}</span>
                  <span className="text-sm text-slate-500 font-data-mono uppercase tracking-wider">Trades</span>
                </div>
              </div>

              {/* Bottom Labels */}
              <div className="w-full flex justify-between mt-4 px-10">
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold text-[#10b981]">{winCount}</span>
                  <span className="text-xs text-slate-400 font-data-mono uppercase tracking-widest mt-1">Wins</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold text-[#ef4444]">{lossCount}</span>
                  <span className="text-xs text-slate-400 font-data-mono uppercase tracking-widest mt-1">Losses</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Summary Chart */}
        {sortedMonthlySummary.length > 0 && (
          <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5 relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/5 blur-[100px] pointer-events-none rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h3 className="text-xl font-display-lg text-slate-200 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 shadow-[0_0_15px_rgba(78,222,163,0.15)]">
                  <span className="material-symbols-outlined text-primary">monitoring</span>
                </div>
                Performa P/L Bulanan
              </h3>
              <div className="text-xs font-data-mono text-slate-400 bg-surface-container-lowest/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md w-fit">
                Siklus Transaksi: Tgl 20
              </div>
            </div>
            
            <div className="h-[360px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...sortedMonthlySummary].reverse()} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4edea3" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#4edea3" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff5252" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ff5252" stopOpacity={0.9}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="4 4" stroke="#ffffff0a" vertical={false} />
                  
                  <XAxis 
                    dataKey="name" 
                    stroke="transparent" 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    tickFormatter={(val) => {
                      const parts = val.split(' ');
                      return parts.length >= 6 ? `${parts[1]} - ${parts[4]}` : val;
                    }}
                    tickMargin={16}
                    axisLine={false}
                    tickLine={false}
                  />
                  
                  <YAxis 
                    stroke="transparent" 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    tickFormatter={formatAxisNumber}
                    width={70}
                    tickMargin={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  
                  <ReferenceLine y={0} stroke="#ffffff1a" strokeWidth={1} />
                  
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const isProfit = data.totalPL >= 0;
                        return (
                          <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl min-w-[200px]">
                            <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-3">
                              <span className="material-symbols-outlined text-[18px] text-slate-400">calendar_month</span>
                              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">{data.name}</p>
                            </div>
                            <p className={`text-2xl font-bold tracking-tight mb-4 ${isProfit ? 'text-primary drop-shadow-[0_0_15px_rgba(78,222,163,0.4)]' : 'text-error drop-shadow-[0_0_15px_rgba(255,82,82,0.4)]'}`}>
                              {isProfit ? '+' : ''}Rp {formatNumber(data.totalPL)}
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="bg-surface-container/80 px-3 py-1.5 rounded-lg border border-outline-variant/30 flex items-center gap-2 flex-1 justify-center">
                                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(78,222,163,0.8)]"></span>
                                <span className="text-xs font-bold text-slate-300">{data.win} W</span>
                              </div>
                              <div className="bg-surface-container/80 px-3 py-1.5 rounded-lg border border-outline-variant/30 flex items-center gap-2 flex-1 justify-center">
                                <span className="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_rgba(255,82,82,0.8)]"></span>
                                <span className="text-xs font-bold text-slate-300">{data.loss} L</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  <Bar dataKey="totalPL" barSize={40} radius={[6, 6, 6, 6]}>
                    {[...sortedMonthlySummary].reverse().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.totalPL >= 0 ? 'url(#colorProfit)' : 'url(#colorLoss)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-8">
          
          {/* Input Form Panel */}
          <section className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col hover:shadow-[0_0_30px_rgba(78,222,163,0.08)] transition-shadow duration-300">
            <h3 className="text-headline-sm font-headline-sm text-slate-200 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">add_circle</span>
              Catat Trade Baru
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Sekuritas</label>
                <div className="flex gap-3 bg-surface-container-lowest/30 p-1.5 rounded-xl border border-outline-variant/50">
                  <button 
                    onClick={() => setSekuritas('Stockbit')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${sekuritas === 'Stockbit' ? 'bg-primary text-on-primary shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-slate-500 hover:text-slate-200 hover:bg-surface-container/50'}`}
                  >
                    Stockbit
                  </button>
                  <button 
                    onClick={() => setSekuritas('KB Valburi')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${sekuritas === 'KB Valburi' ? 'bg-secondary text-on-secondary shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'text-slate-500 hover:text-slate-200 hover:bg-surface-container/50'}`}
                  >
                    KB Valburi
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Tanggal</label>
                <div className="relative h-[46px]">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-sm pointer-events-none">calendar_today</span>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    onKeyDown={(e) => handleEnter(e, codeRef)}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    className="w-full h-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 pl-11 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner [color-scheme:dark] cursor-pointer" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Kode Saham</label>
                <div className="relative h-[46px]">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-sm">tag</span>
                  <input 
                    ref={codeRef}
                    type="text" 
                    value={code} 
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => handleEnter(e, lotRef)}
                    placeholder="Contoh: BUMI" 
                    className="w-full h-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 pl-11 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner uppercase" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Lot</label>
                <input 
                  ref={lotRef}
                  type="number" 
                  value={lot} 
                  onChange={(e) => setLot(e.target.value)}
                  onKeyDown={(e) => handleEnter(e, buyRef)}
                  placeholder="0" 
                  className="w-full h-[46px] bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner" 
                />
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Harga Beli</label>
                <input 
                  ref={buyRef}
                  type="number" 
                  value={buy} 
                  onChange={(e) => setBuy(e.target.value)}
                  onKeyDown={(e) => handleEnter(e, sellRef)}
                  placeholder="0" 
                  className="w-full h-[46px] bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner" 
                />
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Harga Jual</label>
                <input 
                  ref={sellRef}
                  type="number" 
                  value={sell} 
                  onChange={(e) => setSell(e.target.value)}
                  onKeyDown={(e) => handleEnter(e, 'submit')}
                  placeholder="0" 
                  className="w-full h-[46px] bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner" 
                />
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Target (Opsional)</label>
                <input 
                  ref={targetRef}
                  type="number" 
                  value={target} 
                  onChange={(e) => setTarget(e.target.value)}
                  onKeyDown={(e) => handleEnter(e, stopLossRef)}
                  placeholder="0" 
                  className="w-full h-[46px] bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner" 
                />
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Stop Loss (Opsional)</label>
                <input 
                  ref={stopLossRef}
                  type="number" 
                  value={stopLoss} 
                  onChange={(e) => setStopLoss(e.target.value)}
                  onKeyDown={(e) => handleEnter(e, sellRef)}
                  placeholder="0" 
                  className="w-full h-[46px] bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner" 
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Emosi Saat Entry</label>
                <div className="flex flex-wrap gap-3">
                  {['Disiplin', 'FOMO', 'Balas Dendam', 'Panik'].map(emo => (
                    <button 
                      key={emo}
                      onClick={() => setEmotion(emo)}
                      className={`px-6 py-2.5 rounded-lg text-xs font-semibold border transition-all ${emotion === emo ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(78,222,163,0.2)]' : 'bg-surface-container-lowest/50 border-outline-variant/50 text-slate-500 hover:text-slate-300 hover:bg-surface-container/50'}`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col lg:flex-row gap-6 items-end">
              <div className="flex-1 w-full">
                {/* Live Calculator */}
                {(() => {
                  const calcLot = parseInt(lot, 10) || 0;
                  const calcBuy = parseFloat(buy) || 0;
                  const calcSell = parseFloat(sell) || 0;
                  const calcTarget = parseFloat(target) || 0;
                  const calcStopLoss = parseFloat(stopLoss) || 0;
                  
                  const totalBuy = calcLot * 100 * calcBuy;
                  const totalSell = calcLot * 100 * calcSell;
                  const profitLoss = totalSell - totalBuy;
                  const percentage = calcBuy > 0 ? ((calcSell - calcBuy) / calcBuy) * 100 : 0;
                  const isProfit = profitLoss >= 0;

                  const reward = calcTarget > calcBuy ? calcTarget - calcBuy : 0;
                  const risk = calcBuy > calcStopLoss ? calcBuy - calcStopLoss : 0;
                  const rrRatio = (risk > 0 && reward > 0) ? (reward / risk).toFixed(1) : 0;

                  if (calcLot > 0 && calcBuy > 0) {
                    return (
                      <div className="bg-surface-container/30 border border-outline-variant/30 rounded-xl p-5 shadow-inner flex flex-wrap gap-6 items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Modal Diperlukan</span>
                          <span className="text-lg font-data-mono font-bold text-slate-200">Rp {financialData.formatCurrency(totalBuy)}</span>
                        </div>
                        {calcSell > 0 && (
                          <div className="border-l border-white/10 pl-6">
                            <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Potensi Hasil</span>
                            <div className="flex items-center gap-3">
                              <span className={`text-lg font-data-mono font-bold ${isProfit ? 'text-primary' : 'text-error'}`}>
                                {isProfit ? '+' : ''}Rp {financialData.formatCurrency(profitLoss)}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded bg-surface-container font-data-mono ${isProfit ? 'text-primary' : 'text-error'}`}>
                                {isProfit ? '+' : ''}{percentage.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        )}
                        {rrRatio > 0 && (
                          <div className="border-l border-white/10 pl-6">
                            <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Risk / Reward</span>
                            <span className="text-lg font-data-mono font-bold text-slate-200">1 : {rrRatio}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="w-full lg:w-[280px]">
                <button 
                  onClick={handleAddTrade} 
                  disabled={!code || !lot || !buy}
                  className={`w-full h-[60px] rounded-xl transition-all flex items-center justify-center gap-2 font-bold shadow-[0_0_15px_rgba(78,222,163,0.3)] ${(!code || !lot || !buy) ? 'bg-surface-container text-slate-500 cursor-not-allowed shadow-none' : 'bg-primary text-on-primary hover:bg-primary-fixed'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Simpan Trade
                </button>
              </div>
            </div>
          </section>

          {/* Table Panel */}
          <section className="glass-panel rounded-2xl p-0 flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.2)] w-full">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-headline-sm font-headline-sm text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">table_view</span>
                Riwayat Transaksi
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 text-xs font-data-mono uppercase tracking-wider bg-surface-container/20">
                    <th className="p-4 font-medium">Tanggal</th>
                    <th className="p-4 font-medium">Kode Saham</th>
                    <th className="p-4 font-medium text-right">Lot</th>
                    <th className="p-4 font-medium text-right">Beli</th>
                    <th className="p-4 font-medium text-right">Total Beli</th>
                    <th className="p-4 font-medium text-right">Jual</th>
                    <th className="p-4 font-medium text-right">Persentase</th>
                    <th className="p-4 font-medium text-right">Hasil</th>
                    <th className="p-4 font-medium text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-sm">
                  {enrichedTrades.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-16 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center opacity-80">
                          <span className="material-symbols-outlined text-6xl mb-4 text-slate-600">query_stats</span>
                          <p className="text-lg font-medium text-slate-300">Belum Ada Catatan Trading</p>
                          <p className="text-sm mt-1 text-slate-500">Mulai catat transaksi pertama Anda di panel sebelah kiri.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    enrichedTrades.map(trade => {
                      const isProfit = trade.result >= 0;
                      return (
                        <tr key={trade.id} className="hover:bg-surface-container/20 transition-colors group">
                          <td className="p-4 text-slate-200 whitespace-nowrap">{new Date(trade.date).toLocaleDateString('id-ID')}</td>
                          <td className="p-4">
                            <div className="font-bold text-slate-200">{trade.code}</div>
                            <div className="flex gap-1 mt-1">
                              <div className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-widest inline-block ${trade.sekuritas === 'KB Valburi' ? 'border-secondary/30 text-secondary' : 'border-primary/30 text-primary'}`}>
                                {trade.sekuritas || 'Stockbit'}
                              </div>
                              {trade.emotion && (
                                <div className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant text-slate-400 uppercase tracking-widest inline-block">
                                  {trade.emotion}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right text-slate-200 font-data-mono">{trade.isManualHasil ? '-' : trade.lot}</td>
                          <td className="p-4 text-right">
                            <div className="text-slate-200 font-data-mono">{trade.isManualHasil ? '-' : `Rp ${formatNumber(trade.buy)}`}</div>
                            {(!trade.isManualHasil && (trade.target || trade.stopLoss)) ? (
                              <div className="text-[10px] text-slate-500 font-data-mono mt-1">
                                {trade.target ? `T: ${formatNumber(trade.target)}` : ''} {trade.stopLoss ? `SL: ${formatNumber(trade.stopLoss)}` : ''}
                                {trade.target > trade.buy && trade.buy > trade.stopLoss && (
                                  <span className="ml-1 text-primary">({( (trade.target - trade.buy) / (trade.buy - trade.stopLoss) ).toFixed(1)}R)</span>
                                )}
                              </div>
                            ) : null}
                          </td>
                          <td className="p-4 text-right text-slate-500 font-data-mono">{trade.isManualHasil ? '-' : `Rp ${formatNumber(trade.totalBuy)}`}</td>
                          <td className="p-4 text-right text-slate-200 font-data-mono">
                            {trade.isOpen ? (
                              editingTradeId === trade.id ? (
                                <div className="flex items-center gap-2 justify-end">
                                  <input 
                                    type="number" 
                                    value={editSellPrice} 
                                    onChange={(e) => setEditSellPrice(e.target.value)}
                                    placeholder="Jual..."
                                    className="w-20 bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-primary"
                                  />
                                  <button onClick={() => handleSaveSellPrice(trade.id)} className="text-primary hover:text-primary-fixed">
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                  </button>
                                  <button onClick={() => setEditingTradeId(null)} className="text-error hover:text-error-container">
                                    <span className="material-symbols-outlined text-sm">cancel</span>
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setEditingTradeId(trade.id)}
                                  className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded hover:bg-primary/20 transition-colors"
                                >
                                  Open
                                </button>
                              )
                            ) : (
                              trade.isManualHasil ? '-' : `Rp ${formatNumber(trade.sell)}`
                            )}
                          </td>
                          <td className={`p-4 text-right font-data-mono font-semibold ${trade.isOpen ? 'text-slate-500' : isProfit ? 'bg-primary/20 text-primary border-l-4 border-primary' : 'bg-error/20 text-error border-l-4 border-error'}`}>
                            {trade.isOpen ? '-' : `${isProfit ? '+' : ''}${trade.percentage.toFixed(2)}%`}
                          </td>
                          <td className={`p-4 text-right font-data-mono font-semibold ${trade.isOpen ? 'text-slate-500' : isProfit ? 'bg-primary/20 text-primary' : 'bg-error/20 text-error'}`}>
                            {trade.isOpen ? 'Running' : `${isProfit ? '+' : ''}Rp ${formatNumber(trade.result)}`}
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => handleDeleteTrade(trade.id)}
                              className="text-slate-500 hover:text-error transition-colors p-1 opacity-0 group-hover:opacity-100"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
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
