import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const performanceData = {
  '1W': [
    { name: 'Sen', value: 21500000 },
    { name: 'Sel', value: 21800000 },
    { name: 'Rab', value: 21400000 },
    { name: 'Kam', value: 22100000 },
    { name: 'Jum', value: 22500000 },
    { name: 'Sab', value: 23100000 },
    { name: 'Min', value: 23455879 },
  ],
  '1M': [
    { name: 'Mg 1', value: 20100000 },
    { name: 'Mg 2', value: 21500000 },
    { name: 'Mg 3', value: 22800000 },
    { name: 'Mg 4', value: 23455879 },
  ],
  '1Y': [
    { name: 'Jan', value: 15000000 },
    { name: 'Feb', value: 15500000 },
    { name: 'Mar', value: 16200000 },
    { name: 'Apr', value: 17100000 },
    { name: 'Mei', value: 18500000 },
    { name: 'Jun', value: 19200000 },
    { name: 'Jul', value: 19800000 },
    { name: 'Ags', value: 20500000 },
    { name: 'Sep', value: 21200000 },
    { name: 'Okt', value: 22100000 },
    { name: 'Nov', value: 22800000 },
    { name: 'Des', value: 23455879 },
  ]
};

export default function Dashboard({ setActiveTab, financialData }) {
  const [timeframe, setTimeframe] = useState('1M');

  const { totalAssets, totalInvestasi, totalTabungan, operationalBalance } = financialData || {
    totalAssets: 0, totalInvestasi: 0, totalTabungan: 0, operationalBalance: 0
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 rounded-lg border border-white/10 shadow-lg bg-surface/90 backdrop-blur-md">
          <p className="text-slate-300 text-xs mb-1">{label}</p>
          <p className="text-primary font-bold">
            Rp {financialData.formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const getPercentage = (value) => totalAssets > 0 ? ((value / totalAssets) * 100).toFixed(1) : 0;

  return (
    <main className="pt-24 pb-12 px-gutter md:px-margin-page md:ml-64 w-full md:w-[calc(100%-16rem)]">
      <div className="grid grid-cols-12 gap-6 md:gap-stack-lg max-w-7xl mx-auto">
        {/* Hero Section: Total Assets */}
        <div className="col-span-12 glass-card rounded-xl p-container-padding flex flex-col md:flex-row md:items-center justify-between relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          
          {/* Left: Total Assets info */}
          <div className="relative z-10 space-y-stack-sm md:w-1/2">
            <h2 className="font-label-sm text-label-sm text-slate-300 uppercase tracking-widest">Total Aset</h2>
            <div className="font-display-lg text-4xl sm:text-5xl md:text-6xl text-slate-200 tracking-tight">
              Rp {financialData.formatCurrency(totalAssets)}
            </div>
            <div className="inline-flex items-center bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 mt-2">
              <span className="font-data-mono text-data-mono text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">arrow_drop_up</span>
                Naik Rp 5.000.000 (+3.45%)
              </span>
            </div>
          </div>
          
          {/* Right: Stats & Mini Chart Ornament */}
          <div className="relative z-10 mt-stack-lg md:mt-0 flex flex-col items-end md:w-1/2">
            <div className="flex gap-8 mb-6 w-full justify-start md:justify-end">
              <div className="border-l-2 border-primary/30 pl-3">
                <p className="font-label-sm text-label-sm text-slate-300">24 Jam</p>
                <p className="font-data-mono text-data-mono text-slate-200 text-lg">+1.2%</p>
              </div>
              <div className="border-l-2 border-primary/30 pl-3">
                <p className="font-label-sm text-label-sm text-slate-300">7 Hari</p>
                <p className="font-data-mono text-data-mono text-slate-200 text-lg">+3.45%</p>
              </div>
              <div className="border-l-2 border-primary/30 pl-3">
                <p className="font-label-sm text-label-sm text-slate-300">30 Hari</p>
                <p className="font-data-mono text-data-mono text-slate-200 text-lg">+8.9%</p>
              </div>
            </div>
            
            {/* Sparkline Ornament */}
            <div className="w-full md:w-64 h-16 opacity-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData['1W']}>
                  <defs>
                    <linearGradient id="sparkline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#sparkline)" />
                  <YAxis hide domain={['dataMin', 'dataMax']} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Asset Breakdown Cards */}
        <div 
          onClick={() => setActiveTab && setActiveTab('investments')} 
          className="col-span-12 md:col-span-4 glass-card rounded-2xl p-6 relative overflow-hidden cursor-pointer border border-white/5 hover:border-primary/30 transition-all duration-500 group shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] bg-gradient-to-b from-white/[0.02] to-transparent"
        >
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors duration-700 pointer-events-none"></div>
          
          <div className="flex items-start justify-between mb-8 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <span className="material-symbols-outlined text-primary text-[24px]">trending_up</span>
            </div>
            <button className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors">
              <span className="material-symbols-outlined text-lg">more_horiz</span>
            </button>
          </div>
          
          <div className="relative z-10">
            <h3 className="font-medium text-[11px] text-slate-300 mb-1.5 uppercase tracking-[0.15em]">Total Investasi</h3>
            <p className="font-bold text-2xl md:text-3xl text-white tracking-tight mb-6">Rp {financialData.formatCurrency(totalInvestasi)}</p>
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-slate-500 font-bold tracking-widest">PORSI</span>
              <span className="text-xs text-primary font-bold">{getPercentage(totalInvestasi)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900/80 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000 relative shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                style={{ width: `${getPercentage(totalInvestasi)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30"></div>
              </div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab && setActiveTab('savings')} 
          className="col-span-12 md:col-span-4 glass-card rounded-2xl p-6 relative overflow-hidden cursor-pointer border border-white/5 hover:border-indigo-400/30 transition-all duration-500 group shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] bg-gradient-to-b from-white/[0.02] to-transparent"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-colors duration-700 pointer-events-none"></div>
          
          <div className="flex items-start justify-between mb-8 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 flex items-center justify-center border border-indigo-400/20 group-hover:scale-110 transition-transform duration-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <span className="material-symbols-outlined text-indigo-400 text-[24px]">savings</span>
            </div>
            <button className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors">
              <span className="material-symbols-outlined text-lg">more_horiz</span>
            </button>
          </div>
          
          <div className="relative z-10">
            <h3 className="font-medium text-[11px] text-slate-300 mb-1.5 uppercase tracking-[0.15em]">Total Tabungan</h3>
            <p className="font-bold text-2xl md:text-3xl text-white tracking-tight mb-6">Rp {financialData.formatCurrency(totalTabungan)}</p>
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-slate-500 font-bold tracking-widest">PORSI</span>
              <span className="text-xs text-indigo-400 font-bold">{getPercentage(totalTabungan)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900/80 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-indigo-400 rounded-full transition-all duration-1000 relative shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                style={{ width: `${getPercentage(totalTabungan)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30"></div>
              </div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab && setActiveTab('strategy')} 
          className="col-span-12 md:col-span-4 glass-card rounded-2xl p-6 relative overflow-hidden cursor-pointer border border-white/5 hover:border-rose-400/30 transition-all duration-500 group shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)] bg-gradient-to-b from-white/[0.02] to-transparent"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-rose-500/20 transition-colors duration-700 pointer-events-none"></div>
          
          <div className="flex items-start justify-between mb-8 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-500/5 flex items-center justify-center border border-rose-400/20 group-hover:scale-110 transition-transform duration-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <span className="material-symbols-outlined text-rose-400 text-[24px]">account_balance_wallet</span>
            </div>
            <button className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors">
              <span className="material-symbols-outlined text-lg">more_horiz</span>
            </button>
          </div>
          
          <div className="relative z-10">
            <h3 className="font-medium text-[11px] text-slate-300 mb-1.5 uppercase tracking-[0.15em]">Operasional</h3>
            <p className="font-bold text-2xl md:text-3xl text-white tracking-tight mb-6">Rp {financialData.formatCurrency(operationalBalance)}</p>
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-slate-500 font-bold tracking-widest">PORSI</span>
              <span className="text-xs text-rose-400 font-bold">{getPercentage(operationalBalance)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900/80 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-rose-400 rounded-full transition-all duration-1000 relative shadow-[0_0_10px_rgba(244,63,94,0.5)]" 
                style={{ width: `${getPercentage(operationalBalance)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Active Chart Area */}
        <div className="col-span-12 lg:col-span-8 glass-card rounded-xl p-container-padding h-96 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 z-10 relative">
            <h3 className="font-headline-md text-headline-md text-slate-200">Ringkasan Performa</h3>
            <div className="flex gap-2">
              {['1W', '1M', '1Y'].map(tf => (
                <button 
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    timeframe === tf 
                      ? 'bg-primary text-on-primary font-medium' 
                      : 'bg-slate-800 text-slate-200 border border-white/10 hover:bg-white/5'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 w-full relative z-0 mt-2 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData[timeframe]} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} 
                  dy={10} 
                  minTickGap={30}
                />
                <YAxis hide domain={['dataMin - 1000000', 'dataMax + 1000000']} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10B981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 3 Pengeluaran */}
        <div className="col-span-12 lg:col-span-4 glass-card rounded-xl p-container-padding flex flex-col relative overflow-hidden bg-gradient-to-br from-surface-variant/40 to-transparent">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline-md text-headline-md text-slate-200">Top Pengeluaran</h3>
            <button className="text-primary hover:text-primary-fixed text-sm font-bold flex items-center gap-1">
              Lihat <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
          
          <div className="flex flex-col gap-4 flex-1 justify-center">
            {/* Item 1 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-white/5 hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                  <span className="material-symbols-outlined text-orange-400 text-[20px]">restaurant</span>
                </div>
                <div>
                  <p className="font-bold text-slate-200 text-sm">Makan & Minum</p>
                  <p className="text-xs text-slate-400">12 Transaksi</p>
                </div>
              </div>
              <p className="font-data-mono text-primary font-bold">Rp {financialData.formatCurrency(750000)}</p>
            </div>
            
            {/* Item 2 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-white/5 hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <span className="material-symbols-outlined text-blue-400 text-[20px]">shopping_bag</span>
                </div>
                <div>
                  <p className="font-bold text-slate-200 text-sm">Belanja Bulanan</p>
                  <p className="text-xs text-slate-400">3 Transaksi</p>
                </div>
              </div>
              <p className="font-data-mono text-slate-200 font-bold">Rp {financialData.formatCurrency(450000)}</p>
            </div>
            
            {/* Item 3 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-white/5 hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                  <span className="material-symbols-outlined text-purple-400 text-[20px]">directions_car</span>
                </div>
                <div>
                  <p className="font-bold text-slate-200 text-sm">Transportasi</p>
                  <p className="text-xs text-slate-400">8 Transaksi</p>
                </div>
              </div>
              <p className="font-data-mono text-slate-200 font-bold">Rp {financialData.formatCurrency(200000)}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
