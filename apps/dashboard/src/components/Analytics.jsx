import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

export default function Analytics({ financialData }) {
  const [timeframe, setTimeframe] = useState('1M');

  const { totalAssets, totalInvestasi, totalTabungan, operationalBalance } = financialData || {
    totalAssets: 0, totalInvestasi: 0, totalTabungan: 0, operationalBalance: 0
  };

  const compositionData = [
    { name: 'Investasi', value: totalInvestasi, color: '#10B981' },
    { name: 'Tabungan', value: totalTabungan, color: '#3B82F6' },
    { name: 'Operasional', value: operationalBalance, color: '#F59E0B' }
  ].filter(item => item.value > 0);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    // Push label towards outer edge (e.g. 75% of the way out)
    const radius = innerRadius + (outerRadius - innerRadius) * 0.75;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Hide very small labels

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="font-data-mono text-[14px] font-bold tracking-wider" style={{ textShadow: '1px 2px 4px rgba(0,0,0,0.8)' }}>
        {`${(percent * 100).toFixed(0)} %`}
      </text>
    );
  };

  return (
    <main className="md:ml-64 pt-24 px-4 md:px-margin-page pb-margin-page w-full md:w-[calc(100%-16rem)] min-h-screen">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-gutter">
        
        {/* Overall Asset Performance (Header Card) - Span 12 */}
        <div className="col-span-12 bg-surface-container/40 backdrop-blur-[20px] border border-outline/20 rounded-xl p-container-padding hover:bg-surface-container/60 transition-all duration-300 relative overflow-hidden group">
          {/* Decorative Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-500"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md">
            <div>
              <p className="font-label-sm text-label-sm text-slate-300 uppercase tracking-wider mb-2">Total Aset Bulan Ini</p>
              <h3 className="font-display-lg text-display-lg text-slate-200 flex items-baseline gap-2">
                <span className="text-3xl text-slate-300 font-light">Rp</span>
                {financialData.formatCurrency(totalAssets)}
              </h3>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full backdrop-blur-md">
              <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
              <span className="font-data-mono text-data-mono text-primary">Naik Rp 138.000.000 vs Bulan Lalu (+12.4%)</span>
            </div>
          </div>
        </div>

        {/* Composition Donut Chart - Span 12 lg:span-4 */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container/40 backdrop-blur-[20px] border border-outline/20 rounded-xl p-container-padding flex flex-col hover:bg-surface-container/60 transition-all duration-300">
          <h4 className="font-headline-md text-headline-md text-slate-200 mb-stack-md">Komposisi Aset</h4>
          <div className="flex-1 w-full min-h-[250px] relative py-2">
            {compositionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="pieBevel" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="2" dy="8" stdDeviation="5" floodColor="#000000" floodOpacity="0.5" />
                      <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
                      <feSpecularLighting in="blur" surfaceScale="6" specularConstant="1" specularExponent="30" lightingColor="#ffffff" result="specularOut">
                        <fePointLight x="-100" y="-100" z="150" />
                      </feSpecularLighting>
                      <feComposite in="specularOut" in2="SourceAlpha" operator="in" result="specular" />
                      <feMerge>
                        <feMergeNode in="SourceGraphic" />
                        <feMergeNode in="specular" />
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <Pie
                    data={compositionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {compositionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        style={{ filter: 'url(#pieBevel)' }} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value) => `Rp ${financialData.formatCurrency(value)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">Belum ada data</div>
            )}
            
            {/* Center 3D Overlay Disk */}
            {compositionData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-[100px] h-[100px] rounded-full bg-gradient-to-b from-[#f8f9fa] to-[#e9ecef] flex flex-col items-center justify-center shadow-[0_8px_15px_rgba(0,0,0,0.5),inset_0_-4px_8px_rgba(0,0,0,0.15),inset_0_4px_8px_rgba(255,255,255,1)] border border-white/50 relative">
                  <span className="material-symbols-outlined text-slate-600 text-[32px] mb-1">groups</span>
                  <span className="font-display-sm text-[10px] font-extrabold text-slate-700 tracking-widest text-center leading-tight">TOTAL<br/>ASET</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-2 gap-stack-sm mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shadow-[0_0_5px_theme('colors.primary')]" style={{backgroundColor: '#10B981'}}></div>
              <span className="font-label-sm text-label-sm text-slate-200">Investasi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#3B82F6'}}></div>
              <span className="font-label-sm text-label-sm text-slate-200">Tabungan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#F59E0B'}}></div>
              <span className="font-label-sm text-label-sm text-slate-200">Operasional</span>
            </div>
          </div>
        </div>

        {/* Growth Trend Line Chart - Span 12 lg:span-8 */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container/40 backdrop-blur-[20px] border border-outline/20 rounded-xl p-container-padding flex flex-col hover:bg-surface-container/60 transition-all duration-300 relative overflow-hidden">
          <div className="flex justify-between items-center mb-stack-md relative z-10">
            <h4 className="font-headline-md text-headline-md text-slate-200">Pertumbuhan Total Aset</h4>
            <div className="flex bg-slate-800/50 rounded-lg p-1 border border-outline/10">
              {['1W', '1M', '1Y'].map(tf => (
                <button 
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-label-sm font-label-sm transition-colors rounded ${
                    timeframe === tf 
                      ? 'bg-surface-variant/80 text-slate-200 shadow-sm border border-outline/20' 
                      : 'text-slate-300 hover:text-slate-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[250px] relative z-10 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData[timeframe]} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValueAnalytic" x1="0" y1="0" x2="0" y2="1">
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
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
                  formatter={(value) => [`Rp ${financialData.formatCurrency(value)}`, 'Total Aset']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10B981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorValueAnalytic)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evaluation Box / Insights - Span 12 */}
        <div className="col-span-12 bg-surface-container/30 backdrop-blur-[40px] border border-outline/20 rounded-xl p-container-padding hover:scale-[1.005] transition-all duration-300">
          <div className="flex items-center gap-3 mb-stack-md">
            <span className="material-symbols-outlined text-secondary text-2xl">lightbulb</span>
            <h4 className="font-headline-md text-headline-md text-slate-200">Wawasan Analitik AI</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Insight 1: Rule-Based Alert for Makan */}
            {(() => {
              const makanWallet = financialData.operationalWallets?.find(w => w.id === 'makan');
              const makanSpent = makanWallet ? makanWallet.value : 0;
              const makanLimit = 900000; // Asumsi 30k x 30 hari
              const percentage = (makanSpent / makanLimit) * 100;
              
              if (percentage >= 80) {
                return (
                  <div className="bg-slate-800/30 border border-outline/10 p-4 rounded-lg border-l-4 border-l-red-500 flex flex-col justify-between">
                    <p className="font-body-base text-body-base text-slate-300 mb-4">
                      ⚠️ Pengeluaran Makan Anda mencapai <span className="text-red-400 font-bold">{percentage.toFixed(0)}%</span> dari batas wajar bulan ini.
                    </p>
                    <p className="font-data-mono text-data-mono text-slate-200 text-lg">Rp {financialData.formatCurrency(makanSpent)} <span className="text-red-500 text-sm font-label-sm ml-2">Overbudget Warning</span></p>
                  </div>
                );
              } else {
                return (
                  <div className="bg-slate-800/30 border border-outline/10 p-4 rounded-lg border-l-4 border-l-secondary flex flex-col justify-between">
                    <p className="font-body-base text-body-base text-slate-300 mb-4">Pengeluaran makan bulanan terjaga dengan baik di bawah batas Rp 900.000.</p>
                    <p className="font-data-mono text-data-mono text-slate-200 text-lg">Rp {financialData.formatCurrency(makanSpent)} <span className="text-primary text-sm font-label-sm ml-2">↓ Aman</span></p>
                  </div>
                );
              }
            })()}
            
            {/* Insight 2 */}
            <div className="bg-slate-800/30 border border-outline/10 p-4 rounded-lg border-l-4 border-l-primary flex flex-col justify-between">
              <p className="font-body-base text-body-base text-slate-300 mb-4">Portofolio saham mencatatkan kenaikan tertinggi bulan ini.</p>
              <p className="font-data-mono text-data-mono text-slate-200 text-lg">+ 8.2% <span className="text-slate-300 text-sm font-label-sm ml-2">Pertumbuhan Positif</span></p>
            </div>
            
            {/* Insight 3 */}
            <div className="bg-slate-800/30 border border-outline/10 p-4 rounded-lg border-l-4 border-l-tertiary flex flex-col justify-between">
              <p className="font-body-base text-body-base text-slate-300 mb-4">Peringatan likuiditas modal operasional. Disarankan untuk menambah buffer dompet harian.</p>
              <p className="font-data-mono text-data-mono text-tertiary text-lg">Butuh Tindakan <span className="material-symbols-outlined text-sm align-middle ml-1">warning</span></p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
