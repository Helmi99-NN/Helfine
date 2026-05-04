import React, { useState, useEffect, useRef } from 'react';

export default function Trading({ financialData }) {
  const [trades, setTrades] = useState(() => {
    try {
      const saved = localStorage.getItem('trading_journal');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [code, setCode] = useState('');
  const [lot, setLot] = useState('');
  const [buy, setBuy] = useState('');
  const [sell, setSell] = useState('');
  const [sekuritas, setSekuritas] = useState('Stockbit');

  const codeRef = useRef(null);
  const lotRef = useRef(null);
  const buyRef = useRef(null);
  const sellRef = useRef(null);

  const formatNumber = (num) => financialData.formatCurrency(Math.round(num));

  const handleAddTrade = () => {
    if (!code || !lot || !buy || !sell) return;
    
    const newTrade = {
      id: Date.now(),
      date,
      code: code.toUpperCase(),
      lot: parseInt(lot, 10),
      buy: parseFloat(buy),
      sell: parseFloat(sell),
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
    setSell('');
    codeRef.current?.focus();
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
    const totalBuy = t.lot * 100 * t.buy;
    const result = (t.sell - t.buy) * t.lot * 100;
    const percentage = ((t.sell - t.buy) / t.buy) * 100;
    
    totalProfitLoss += result;
    if (result > 0) winCount++;
    else if (result < 0) lossCount++;

    return { ...t, totalBuy, result, percentage };
  });

  // Sort by date descending
  enrichedTrades.sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalTrades = winCount + lossCount;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

  const handleEnter = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef === 'submit') handleAddTrade();
      else nextRef?.current?.focus();
    }
  };

  return (
    <main className="md:ml-64 pt-24 px-4 md:px-margin-page pb-margin-page w-full md:w-[calc(100%-16rem)] min-h-screen">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div>
          <h2 className="text-display-lg font-display-lg text-slate-200 flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-emerald-400">candlestick_chart</span>
            Jurnal Trading
          </h2>
          <p className="text-slate-400 mt-2 font-body-base text-body-base">Catat dan evaluasi performa trading Anda secara sistematis.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-xl p-6 flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
            <h3 className="text-label-sm font-data-mono text-slate-500 uppercase tracking-wider mb-2">Total Net Profit/Loss</h3>
            <div className={`text-3xl font-bold tracking-tight ${totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-error'}`}>
              Rp {formatNumber(totalProfitLoss)}
            </div>
          </div>
          <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
            <h3 className="text-label-sm font-data-mono text-slate-500 uppercase tracking-wider mb-2">Win Rate</h3>
            <div className="text-3xl font-bold tracking-tight text-slate-200">
              {winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-500 mt-2">{winCount} Win / {lossCount} Loss</p>
          </div>
          <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
            <h3 className="text-label-sm font-data-mono text-slate-500 uppercase tracking-wider mb-2">Total Trades</h3>
            <div className="text-3xl font-bold tracking-tight text-slate-200">
              {totalTrades}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          
          {/* Input Form Panel */}
          <section className="col-span-12 lg:col-span-4 glass-panel rounded-xl p-6 flex flex-col hover:shadow-[0_0_30px_rgba(78,222,163,0.08)] transition-shadow duration-300 h-fit">
            <h3 className="text-headline-sm font-headline-sm text-slate-200 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">add_circle</span>
              Catat Trade Baru
            </h3>
            
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Sekuritas</label>
                <div className="flex gap-3 bg-surface-container-lowest/30 p-1.5 rounded-xl border border-outline-variant/50">
                  <button 
                    onClick={() => setSekuritas('Stockbit')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${sekuritas === 'Stockbit' ? 'bg-emerald-500 text-on-primary shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-slate-500 hover:text-slate-200 hover:bg-surface-container/50'}`}
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
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">calendar_today</span>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    onKeyDown={(e) => handleEnter(e, codeRef)}
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 pl-11 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner [color-scheme:dark]" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Kode Saham</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">tag</span>
                  <input 
                    ref={codeRef}
                    type="text" 
                    value={code} 
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => handleEnter(e, lotRef)}
                    placeholder="Contoh: BUMI" 
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 pl-11 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner uppercase" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Lot</label>
                  <input 
                    ref={lotRef}
                    type="number" 
                    value={lot} 
                    onChange={(e) => setLot(e.target.value)}
                    onKeyDown={(e) => handleEnter(e, buyRef)}
                    placeholder="0" 
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Harga Beli</label>
                  <input 
                    ref={buyRef}
                    type="number" 
                    value={buy} 
                    onChange={(e) => setBuy(e.target.value)}
                    onKeyDown={(e) => handleEnter(e, sellRef)}
                    placeholder="0" 
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner" 
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
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner" 
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleAddTrade} 
              disabled={!code || !lot || !buy || !sell}
              className={`w-full mt-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold shadow-[0_0_15px_rgba(78,222,163,0.3)] ${(!code || !lot || !buy || !sell) ? 'bg-surface-container text-slate-500 cursor-not-allowed shadow-none' : 'bg-emerald-500 text-on-primary hover:bg-emerald-500-fixed'}`}
            >
              <span className="material-symbols-outlined text-sm">save</span>
              Simpan Trade
            </button>
          </section>

          {/* Table Panel */}
          <section className="col-span-12 lg:col-span-8 glass-panel rounded-xl p-0 flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.2)]">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-headline-sm font-headline-sm text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">table_view</span>
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
                      <td colSpan="9" className="p-8 text-center text-slate-500">
                        Belum ada catatan trading.
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
                            <div className={`text-[9px] px-1.5 py-0.5 mt-1 rounded border uppercase tracking-widest inline-block ${trade.sekuritas === 'KB Valburi' ? 'border-secondary/30 text-secondary' : 'border-emerald-500/30 text-emerald-400'}`}>
                              {trade.sekuritas || 'Stockbit'}
                            </div>
                          </td>
                          <td className="p-4 text-right text-slate-200 font-data-mono">{trade.lot}</td>
                          <td className="p-4 text-right text-slate-200 font-data-mono">Rp {formatNumber(trade.buy)}</td>
                          <td className="p-4 text-right text-slate-500 font-data-mono">Rp {formatNumber(trade.totalBuy)}</td>
                          <td className="p-4 text-right text-slate-200 font-data-mono">Rp {formatNumber(trade.sell)}</td>
                          <td className={`p-4 text-right font-data-mono font-semibold ${isProfit ? 'bg-emerald-500/20 text-emerald-400 border-l-4 border-emerald-500' : 'bg-error/20 text-error border-l-4 border-error'}`}>
                            {isProfit ? '+' : ''}{trade.percentage.toFixed(2)}%
                          </td>
                          <td className={`p-4 text-right font-data-mono font-semibold ${isProfit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-error/20 text-error'}`}>
                            {isProfit ? '+' : ''}Rp {formatNumber(trade.result)}
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
