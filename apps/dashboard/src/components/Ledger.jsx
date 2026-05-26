import React, { useState, useMemo } from 'react';

export default function Ledger({ financialData }) {
  const { formatCurrency } = financialData;
  const [cashflowRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('cashflow_records');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
  });

  const categories = useMemo(() => {
    const cats = new Set(cashflowRecords.map(r => r.category));
    return Array.from(cats).sort();
  }, [cashflowRecords]);

  const [selectedCategory, setSelectedCategory] = useState(categories.length > 0 ? categories[0] : '');

  const ledgerData = useMemo(() => {
    if (!selectedCategory) return [];

    // Filter by category
    const filtered = cashflowRecords.filter(r => r.category === selectedCategory);
    
    // Sort oldest first to calculate running balance
    const sorted = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let runningBalance = 0;
    const mapped = sorted.map(r => {
      let debet = 0;
      let kredit = 0;
      
      // Standard Cash Accounting: Income = Kredit, Expense = Debet
      if (r.type === 'Income') {
        kredit = r.amount;
        runningBalance += r.amount;
      } else {
        debet = r.amount;
        runningBalance -= r.amount;
      }

      return {
        ...r,
        debet,
        kredit,
        saldo: runningBalance
      };
    });

    // Reverse to show newest at the top
    return mapped.reverse();
  }, [cashflowRecords, selectedCategory]);

  const totalDebet = ledgerData.reduce((sum, r) => sum + r.debet, 0);
  const totalKredit = ledgerData.reduce((sum, r) => sum + r.kredit, 0);
  const finalSaldo = totalKredit - totalDebet;

  return (
    <main className="md:ml-64 pt-24 px-4 md:px-margin-page pb-margin-page w-full md:w-[calc(100%-16rem)] min-h-screen">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <div>
          <h2 className="text-3xl md:text-display-lg font-display-lg text-slate-200">Buku Besar</h2>
          <p className="text-slate-300 mt-2 font-body-base text-body-base">Analisis mutasi dan saldo berjalan per kategori/akun.</p>
        </div>

        <section className="glass-panel rounded-xl p-container-padding shadow-[0_0_20px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col md:flex-row md:items-start md:items-center justify-between gap-6 mb-8">
            <div className="w-full md:w-1/3">
              <label className="block text-label-sm font-label-sm text-slate-500 mb-2">Pilih Akun / Kategori</label>
              <div className="relative">
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-surface-container-lowest/50 border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer [color-scheme:dark]"
                >
                  <option value="" disabled>Belum ada data</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none">expand_more</span>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              <div className="bg-surface-container/50 px-4 py-3 rounded-xl border border-white/5 flex flex-col items-end min-w-[120px]">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Total Debet</span>
                <span className="font-data-mono font-bold text-error">Rp {formatCurrency(totalDebet)}</span>
              </div>
              <div className="bg-surface-container/50 px-4 py-3 rounded-xl border border-white/5 flex flex-col items-end min-w-[120px]">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Total Kredit</span>
                <span className="font-data-mono font-bold text-primary">Rp {formatCurrency(totalKredit)}</span>
              </div>
              <div className="bg-primary/10 px-4 py-3 rounded-xl border border-primary/20 flex flex-col items-end min-w-[120px]">
                <span className="text-[10px] uppercase tracking-widest text-primary/80">Saldo Akhir</span>
                <span className={`font-data-mono font-bold text-lg ${finalSaldo >= 0 ? 'text-primary' : 'text-error'}`}>
                  Rp {formatCurrency(finalSaldo)}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 text-xs font-data-mono uppercase tracking-wider bg-surface-container/20">
                  <th className="p-4 font-medium">Tanggal</th>
                  <th className="p-4 font-medium">Keterangan</th>
                  <th className="p-4 font-medium text-right">Debet</th>
                  <th className="p-4 font-medium text-right">Kredit</th>
                  <th className="p-4 font-medium text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-sm">
                {ledgerData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-16 text-center text-slate-500">
                      Silakan pilih kategori/akun untuk melihat buku besar.
                    </td>
                  </tr>
                ) : (
                  ledgerData.map((record, index) => (
                    <tr key={index} className="hover:bg-surface-container/20 transition-colors">
                      <td className="p-4 text-slate-300 whitespace-nowrap">
                        {new Date(record.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-200">
                          {record.notes ? record.notes : record.type === 'Income' ? 'Pemasukan' : 'Pengeluaran'}
                        </div>
                        {record.paymentMethod && (
                          <div className="text-[10px] mt-1 px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/30 text-slate-400 uppercase tracking-widest inline-block">
                            {record.paymentMethod}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right font-data-mono text-error">
                        {record.debet > 0 ? `Rp ${formatCurrency(record.debet)}` : '-'}
                      </td>
                      <td className="p-4 text-right font-data-mono text-primary">
                        {record.kredit > 0 ? `Rp ${formatCurrency(record.kredit)}` : '-'}
                      </td>
                      <td className={`p-4 text-right font-data-mono font-bold ${record.saldo >= 0 ? 'text-slate-200' : 'text-error'}`}>
                        Rp {formatCurrency(record.saldo)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
