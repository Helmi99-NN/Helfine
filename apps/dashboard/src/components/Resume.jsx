import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

// Data Statis dari Spreadsheet
const months = ['20 Januari', '20 Februari', '20 Maret', '20 April'];

const initialBalances = [
  { name: 'Hana ipot', values: [998485, 1000620, 1001050, 1001050] },
  { name: 'Helmi stockbit', values: [14157662, 11624312, 7988457, 9290289] },
  { name: 'Bapak ipot', values: [918983, 919047, 520717, 520717] },
  { name: 'Ibuk ipot', values: [906673, 6737, 406737, 406737] },
  { name: 'Byoh ajaib', values: [1036603, 1036843, 1036843, 1036843] },
  { name: 'KB Valburi', values: [0, 0, 1500000, 1417857] },
  { name: 'Bank Jago', values: [1184214, 448582, 840354, 339933] },
  { name: 'BCA', values: [1128836, 1133755, 1081315, 1654453] },
  { name: 'Gaji', values: [1695002, 6398, 7507367, 6180668] },
  { name: 'Komisi Mesin', values: [3383917, 1040754, 1944043, 1944043] },
];
const totalInitial = [25410375, 17217048, 23826883, 23792590];

const incomes = [
  { name: 'Gaji Asianindo', values: [1500000, 1500000, 2000000, 1500000] },
  { name: 'Gaji Magang', values: [3500000, 3500000, 3800000, 3300000] },
  { name: 'Gaji Bolen', values: [200000, 200000, 0, 200000] },
  { name: 'Saham', values: [115379, -2533350, 0, 0], highlight: true },
  { name: 'IPO', values: [1185800, 0, 0, 0] },
  { name: 'Bolen laporan keu', values: [300000, 0, 0, 0] },
  { name: 'Bonus Bolen', values: [300000, 0, 0, 0] },
  { name: 'Bonus mesin', values: [176000, 0, 0, 0] },
];

const komisiMesin = [
  { name: 'Vacuum frying papua', values: [1000000, 1000000, 1000000, 0] },
  { name: 'Retort sterilisasi 50', values: [1000000, 600000, 0, 0] },
  { name: 'Destilasi lampung', values: [1500000, 900000, 0, 0] },
  { name: 'Retort sleman', values: [750000, 700000, 0, 0] },
  { name: 'Lainnya 1', values: [0, 3500000, 0, 0] },
  { name: 'Lainnya 2', values: [0, 1000000, 0, 0] },
];
const totalIncome = [11527179, 10366650, 6800000, 5000000];

const expenses = [
  { name: 'Operasional', values: [0, 0, 0, 2506000] },
  { name: 'Iklan Shopee', values: [0, 200000, 0, 2950000] },
  { name: 'Upgrade ilmu', values: [0, 1360566, 0, 2876000] },
  { name: 'Fee Edit', values: [0, 40000, 0, 0] },
  { name: 'Help People', values: [0, 14000000, 0, 0] },
];
const totalExpense = [0, 15600566, 0, 5826000];

export default function Resume({ financialData }) {
  const { formatCurrency } = financialData;
  const [dynamicHistory, setDynamicHistory] = useState([]);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('resume_dynamic_history');
      if (stored) setDynamicHistory(JSON.parse(stored));
    } catch (e) {}
  }, []);

  // Merge static and dynamic data
  const allMonths = [...months, ...dynamicHistory.map(d => d.month)];
  
  const getValues = (itemName, staticValues, type) => {
    const vals = [...staticValues];
    dynamicHistory.forEach(snapshot => {
      let found = null;
      if (type === 'balance') found = snapshot.balances.find(b => b.name === itemName || b.name.includes(itemName.split(' ')[0]));
      if (type === 'income') found = snapshot.incomes.find(b => b.name === itemName);
      if (type === 'expense') found = snapshot.expenses.find(b => b.name === itemName);
      vals.push(found ? found.value : 0);
    });
    return vals;
  };

  const discoveredBalances = new Set();
  const discoveredIncomes = new Set();
  const discoveredExpenses = new Set();
  
  dynamicHistory.forEach(snapshot => {
     snapshot.balances.forEach(b => discoveredBalances.add(b.name));
     snapshot.incomes.forEach(b => discoveredIncomes.add(b.name));
     snapshot.expenses.forEach(b => discoveredExpenses.add(b.name));
  });

  const mergedInitialBalances = initialBalances.map(item => ({
    name: item.name,
    values: getValues(item.name, item.values, 'balance')
  }));
  Array.from(discoveredBalances).forEach(name => {
     // Check if name approximately matches existing to prevent duplicates
     if (!initialBalances.find(i => i.name === name || name.includes(i.name.split(' ')[0]))) {
        const staticZeros = new Array(months.length).fill(0);
        mergedInitialBalances.push({ name, values: getValues(name, staticZeros, 'balance') });
     }
  });

  const mergedTotalInitial = allMonths.map((_, idx) => mergedInitialBalances.reduce((sum, item) => sum + item.values[idx], 0));

  const mergedIncomes = incomes.map(item => ({
    name: item.name,
    highlight: item.highlight,
    values: getValues(item.name, item.values, 'income')
  }));
  const mergedKomisiMesin = komisiMesin.map(item => ({
    name: item.name,
    values: getValues(item.name, item.values, 'income')
  }));

  Array.from(discoveredIncomes).forEach(name => {
     if (!incomes.find(i => i.name === name) && !komisiMesin.find(i => i.name === name)) {
        const staticZeros = new Array(months.length).fill(0);
        mergedIncomes.push({ name, values: getValues(name, staticZeros, 'income') });
     }
  });

  const mergedTotalIncome = allMonths.map((_, idx) => {
     let sum = mergedIncomes.reduce((s, item) => s + item.values[idx], 0);
     sum += mergedKomisiMesin.reduce((s, item) => s + item.values[idx], 0);
     return sum;
  });

  const mergedExpenses = expenses.map(item => ({
    name: item.name,
    values: getValues(item.name, item.values, 'expense')
  }));
  Array.from(discoveredExpenses).forEach(name => {
     if (!expenses.find(i => i.name === name)) {
        const staticZeros = new Array(months.length).fill(0);
        mergedExpenses.push({ name, values: getValues(name, staticZeros, 'expense') });
     }
  });

  const mergedTotalExpense = allMonths.map((_, idx) => mergedExpenses.reduce((sum, item) => sum + item.values[idx], 0));

  const chartData = allMonths.map((month, idx) => ({
    name: month.split(' ')[1],
    'Total Aset': mergedTotalInitial[idx],
    Pendapatan: mergedTotalIncome[idx],
    Pengeluaran: mergedTotalExpense[idx],
  }));

  // Custom tooltips
  const CustomAreaTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800est/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl">
          <p className="text-slate-300 text-xs mb-2 font-data-mono">{label}</p>
          <p className="text-primary font-bold text-lg">
            Rp {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800est/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl">
          <p className="text-slate-300 text-xs mb-2 font-data-mono">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm text-slate-300">{entry.name}</span>
              </div>
              <span className="font-bold text-sm" style={{ color: entry.color }}>
                Rp {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <main className="md:ml-64 pt-24 px-4 md:px-margin-page pb-margin-page w-full md:w-[calc(100%-16rem)] min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div>
          <h2 className="text-display-lg font-display-lg text-slate-200 flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-primary">history</span>
            Resume Bulanan
          </h2>
          <p className="text-slate-300 mt-2 font-body-base text-body-base max-w-3xl">
            Rangkuman historis pergerakan total aset, pendapatan, dan pengeluaran setiap bulan. Diadaptasi dari catatan manual spreadsheet Anda menjadi visual interaktif.
          </p>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Total Asset Trend Area Chart */}
          <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/10 transition-colors duration-500"></div>
            <h3 className="font-headline-sm text-headline-sm text-slate-200 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">monitoring</span>
              Tren Total Awal Bulan
            </h3>
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotalAset" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} dy={10} minTickGap={30} />
                  <YAxis hide domain={['dataMin - 2000000', 'dataMax + 2000000']} />
                  <RechartsTooltip content={<CustomAreaTooltip />} />
                  <Area type="monotone" dataKey="Total Aset" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotalAset)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Income vs Expense Bar Chart */}
          <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
            <h3 className="font-headline-sm text-headline-sm text-slate-200 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">compare_arrows</span>
              Pendapatan vs Pengeluaran
            </h3>
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} dy={10} minTickGap={30} />
                  <YAxis hide />
                  <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Pendapatan" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Pengeluaran" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Data Historis Table */}
        <div className="glass-panel rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.2)]">
          <div className="p-6 border-b border-white/5 bg-surface-container/20">
            <h3 className="text-headline-sm font-headline-sm text-slate-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">table_chart</span>
              Data Historis Keuangan
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container/40 border-b border-white/10 text-slate-500 text-xs font-data-mono uppercase tracking-wider">
                  <th className="p-4 font-bold text-slate-200 min-w-[200px] border-r border-white/5 sticky left-0 bg-[#0b1326] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">Keterangan</th>
                  {allMonths.map((m, idx) => (
                    <th key={idx} className="p-4 font-bold text-slate-200 text-right w-40">{m}</th>
                  ))}
                </tr>
              </thead>
              
              <tbody className="text-sm">
                <tr className="border-y border-white/10 bg-[#131b2e]">
                  <td colSpan={allMonths.length + 1} className="p-3 px-4 font-bold tracking-widest uppercase text-slate-200 text-xs">
                    Total Awal Bulan
                  </td>
                </tr>
                {mergedInitialBalances.map((item, idx) => (
                  <tr key={idx} className="border-b border-white/5 group">
                    <td className="p-3 px-4 text-slate-300 border-r border-white/5 sticky left-0 bg-[#0b1326] group-hover:bg-[#131b2e] transition-colors z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">{item.name}</td>
                    {item.values.map((val, i) => (
                      <td key={i} className="p-3 px-4 text-right font-data-mono text-slate-200">
                        {val === 0 ? '-' : `Rp ${formatCurrency(val)}`}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Total Awal Bulan */}
                <tr className="border-b border-primary/30">
                  <td className="p-4 font-bold text-primary uppercase tracking-widest border-r border-primary/30 sticky left-0 bg-[#063321] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">TOTAL</td>
                  {mergedTotalInitial.map((val, i) => (
                    <td key={i} className="p-4 text-right font-data-mono font-bold text-primary">
                      Rp {formatCurrency(val)}
                    </td>
                  ))}
                </tr>

                <tr className="border-y border-white/10 bg-[#131b2e]">
                  <td colSpan={allMonths.length + 1} className="p-3 px-4 font-bold tracking-widest uppercase text-slate-200 text-xs mt-4">
                    Pendapatan
                  </td>
                </tr>
                {mergedIncomes.map((item, idx) => (
                  <tr key={idx} className="border-b border-white/5 group">
                    <td className="p-3 px-4 text-slate-300 border-r border-white/5 sticky left-0 bg-[#0b1326] group-hover:bg-[#131b2e] transition-colors z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">{item.name}</td>
                    {item.values.map((val, i) => {
                      let colorClass = "text-slate-200";
                      let bgClass = "";
                      if (item.highlight && val > 0) { colorClass = "text-primary font-bold"; bgClass = "bg-primary/10"; }
                      else if (item.highlight && val < 0) { colorClass = "text-[#FDE047] font-bold"; bgClass = "bg-[#FDE047]/10"; }
                      
                      return (
                        <td key={i} className={`p-3 px-4 text-right font-data-mono ${colorClass} ${bgClass}`}>
                          {val === 0 ? '-' : `Rp ${formatCurrency(val)}`}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                <tr className="border-y border-white/5 bg-[#131b2e]">
                  <td colSpan={allMonths.length + 1} className="p-3 px-4 font-bold tracking-widest uppercase text-slate-300 text-xs">
                    Komisi Mesin
                  </td>
                </tr>
                {mergedKomisiMesin.map((item, idx) => (
                  <tr key={idx} className="border-b border-white/5 group">
                    <td className="p-3 px-4 pl-8 text-slate-300 border-r border-white/5 sticky left-0 bg-[#0b1326] group-hover:bg-[#131b2e] transition-colors z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">{item.name}</td>
                    {item.values.map((val, i) => (
                      <td key={i} className="p-3 px-4 text-right font-data-mono text-slate-200">
                        {val === 0 ? '-' : `Rp ${formatCurrency(val)}`}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Total Pendapatan */}
                <tr className="border-b border-primary/30">
                  <td className="p-4 font-bold text-primary uppercase tracking-widest border-r border-primary/30 sticky left-0 bg-[#063321] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">TTL PENDAPATAN</td>
                  {mergedTotalIncome.map((val, i) => (
                    <td key={i} className="p-4 text-right font-data-mono font-bold text-primary">
                      Rp {formatCurrency(val)}
                    </td>
                  ))}
                </tr>

                <tr className="border-y border-white/10 bg-[#131b2e]">
                  <td colSpan={allMonths.length + 1} className="p-3 px-4 font-bold tracking-widest uppercase text-slate-200 text-xs mt-4">
                    Pengeluaran
                  </td>
                </tr>
                {mergedExpenses.map((item, idx) => (
                  <tr key={idx} className="border-b border-white/5 group">
                    <td className="p-3 px-4 text-slate-300 border-r border-white/5 sticky left-0 bg-[#0b1326] group-hover:bg-[#131b2e] transition-colors z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">{item.name}</td>
                    {item.values.map((val, i) => (
                      <td key={i} className="p-3 px-4 text-right font-data-mono text-slate-200">
                        {val === 0 ? '-' : `Rp ${formatCurrency(val)}`}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Total Pengeluaran */}
                <tr className="border-b border-[#FDE047]/30">
                  <td className="p-4 font-bold text-[#FDE047] uppercase tracking-widest border-r border-[#FDE047]/30 sticky left-0 bg-[#422006] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">TTL PENGELUARAN</td>
                  {mergedTotalExpense.map((val, i) => (
                    <td key={i} className="p-4 text-right font-data-mono font-bold text-[#FDE047]">
                      {val === 0 ? '-' : `Rp ${formatCurrency(val)}`}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
