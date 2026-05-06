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
    const totalBuy = t.lot * 100 * t.buy;
    const isOpen = !t.sell || t.sell === 0;
    const result = isOpen ? 0 : (t.sell - t.buy) * t.lot * 100;
    const percentage = isOpen ? 0 : ((t.sell - t.buy) / t.buy) * 100;
    
    if (!isOpen) {
      totalProfitLoss += result;
      if (result > 0) winCount++;
      else if (result < 0) lossCount++;
    }

    return { ...t, totalBuy, result, percentage, isOpen };
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
            <span className="material-symbols-outlined text-4xl text-primary">candlestick_chart</span>
            Jurnal Trading
          </h2>
          <p className="text-slate-300 mt-2 font-body-base text-body-base">Catat dan evaluasi performa trading Anda secara sistematis.</p>
        </div>

        {/* Evaluasi Emosional Insight */}
        {dominantLossEmotion && (
          <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex items-start gap-4">
            <span className="material-symbols-outlined text-error text-3xl shrink-0">psychology_alt</span>
            <div>
              <h3 className="text-sm font-bold text-error mb-1">Evaluasi Emosional</h3>
              <p className="text-sm text-error/80">
                Sistem mendeteksi Anda paling sering mengalami <strong>Loss</strong> saat bertrading dengan emosi <strong className="uppercase bg-error/20 px-1.5 py-0.5 rounded">{dominantLossEmotion}</strong>. Cobalah untuk lebih tenang dan ikuti Trading Plan Anda!
              </p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-xl p-6 flex flex-col justify-between hover:border-primary/30 transition-colors">
            <h3 className="text-label-sm font-data-mono text-slate-500 uppercase tracking-wider mb-2">Total Net Profit/Loss</h3>
            <div className={`text-3xl font-bold tracking-tight ${totalProfitLoss >= 0 ? 'text-primary' : 'text-error'}`}>
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
              <span className="material-symbols-outlined text-primary">add_circle</span>
              Catat Trade Baru
            </h3>
            
            <div className="space-y-4 flex-1">
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
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-sm">calendar_today</span>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    onKeyDown={(e) => handleEnter(e, codeRef)}
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 pl-11 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner [color-scheme:dark]" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Kode Saham</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-sm">tag</span>
                  <input 
                    ref={codeRef}
                    type="text" 
                    value={code} 
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => handleEnter(e, lotRef)}
                    placeholder="Contoh: BUMI" 
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 pl-11 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner uppercase" 
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
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner" 
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
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner" 
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
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Target (Opsional)</label>
                  <input 
                    ref={targetRef}
                    type="number" 
                    value={target} 
                    onChange={(e) => setTarget(e.target.value)}
                    onKeyDown={(e) => handleEnter(e, stopLossRef)}
                    placeholder="0" 
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner" 
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
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Emosi Saat Entry</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Disiplin', 'FOMO', 'Balas Dendam', 'Panik'].map(emo => (
                    <button 
                      key={emo}
                      onClick={() => setEmotion(emo)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-all ${emotion === emo ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-container-lowest/50 border-outline-variant/50 text-slate-500 hover:text-slate-300'}`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
                  <div className="mt-4 bg-surface-container/30 border border-outline-variant/30 rounded-xl p-4 shadow-inner">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">Modal Diperlukan:</span>
                      <span className="text-sm font-data-mono font-bold text-slate-200">Rp {financialData.formatCurrency(totalBuy)}</span>
                    </div>
                    {calcSell > 0 && (
                      <div className="flex justify-between items-center pt-3 mt-1 border-t border-white/5">
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Potensi Hasil:</span>
                        <div className="text-right">
                          <span className={`text-sm font-data-mono font-bold block ${isProfit ? 'text-primary' : 'text-error'}`}>
                            {isProfit ? '+' : ''}Rp {financialData.formatCurrency(profitLoss)}
                          </span>
                          <span className={`text-[10px] font-data-mono ${isProfit ? 'text-primary' : 'text-error'}`}>
                            {isProfit ? '+' : ''}{percentage.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    )}
                    {rrRatio > 0 && (
                      <div className="flex justify-between items-center pt-3 mt-1 border-t border-white/5">
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Risk / Reward Ratio:</span>
                        <span className="text-sm font-data-mono font-bold text-slate-200">1 : {rrRatio}</span>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            <button 
              onClick={handleAddTrade} 
              disabled={!code || !lot || !buy}
              className={`w-full mt-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold shadow-[0_0_15px_rgba(78,222,163,0.3)] ${(!code || !lot || !buy) ? 'bg-surface-container text-slate-500 cursor-not-allowed shadow-none' : 'bg-primary text-on-primary hover:bg-primary-fixed'}`}
            >
              <span className="material-symbols-outlined text-sm">save</span>
              Simpan Trade
            </button>
          </section>

          {/* Table Panel */}
          <section className="col-span-12 lg:col-span-8 glass-panel rounded-xl p-0 flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.2)]">
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
                          <td className="p-4 text-right text-slate-200 font-data-mono">{trade.lot}</td>
                          <td className="p-4 text-right">
                            <div className="text-slate-200 font-data-mono">Rp {formatNumber(trade.buy)}</div>
                            {(trade.target || trade.stopLoss) ? (
                              <div className="text-[10px] text-slate-500 font-data-mono mt-1">
                                {trade.target ? `T: ${formatNumber(trade.target)}` : ''} {trade.stopLoss ? `SL: ${formatNumber(trade.stopLoss)}` : ''}
                                {trade.target > trade.buy && trade.buy > trade.stopLoss && (
                                  <span className="ml-1 text-primary">({( (trade.target - trade.buy) / (trade.buy - trade.stopLoss) ).toFixed(1)}R)</span>
                                )}
                              </div>
                            ) : null}
                          </td>
                          <td className="p-4 text-right text-slate-500 font-data-mono">Rp {formatNumber(trade.totalBuy)}</td>
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
                              `Rp ${formatNumber(trade.sell)}`
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
