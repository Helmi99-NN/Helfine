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

  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const allLedgers = useMemo(() => {
    const catsToRender = selectedCategory === 'Semua' ? categories : [selectedCategory];
    
    return catsToRender.map(cat => {
      const filtered = cashflowRecords.filter(r => r.category === cat);
      const sorted = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      let runningBalance = 0;
      const mapped = sorted.map(r => {
        let debet = 0;
        let kredit = 0;
        if (r.type === 'Income') {
          kredit = r.amount;
          runningBalance += r.amount;
        } else {
          debet = r.amount;
          runningBalance -= r.amount;
        }
        return { ...r, debet, kredit, saldo: runningBalance };
      });

      const totalDebet = mapped.reduce((sum, r) => sum + r.debet, 0);
      const totalKredit = mapped.reduce((sum, r) => sum + r.kredit, 0);

      return {
        category: cat,
        records: mapped.reverse(),
        totalDebet,
        totalKredit,
        finalSaldo: totalKredit - totalDebet
      };
    });
  }, [cashflowRecords, selectedCategory, categories]);

  const grandTotalDebet = allLedgers.reduce((sum, l) => sum + l.totalDebet, 0);
  const grandTotalKredit = allLedgers.reduce((sum, l) => sum + l.totalKredit, 0);
  const grandFinalSaldo = grandTotalKredit - grandTotalDebet;

  // -- Color tokens for light mode --
  const c = {
    pageBg: '#f4f6f8',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    headerBg: '#f8fafc',
    headerBorder: '#e2e8f0',
    thBg: '#f1f5f9',
    thText: '#64748b',
    rowBorder: '#f1f5f9',
    rowHover: '#f8fafc',
    rowStripe: '#fafbfc',
    textPrimary: '#0f172a',   // Judul, keterangan
    textSecondary: '#475569', // Tanggal, label
    textMuted: '#94a3b8',     // Placeholder, dash
    green: '#059669',         // Uang masuk
    red: '#dc2626',           // Uang keluar
    accent: '#2563eb',        // Aksen (biru, bukan ungu)
    accentLight: '#eff6ff',
    accentBorder: '#bfdbfe',
  };

  return (
    <main className="md:ml-64 pt-24 px-4 md:px-margin-page pb-margin-page w-full md:w-[calc(100%-16rem)] min-h-screen">
      <div className="max-w-[1600px] mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Page Title */}
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: c.textPrimary, letterSpacing: '-0.02em' }}>Buku Besar</h2>
          <p style={{ color: c.textSecondary, marginTop: 6, fontSize: 15 }}>Analisis mutasi dan saldo berjalan per kategori/akun.</p>
        </div>

        {/* Filter Bar */}
        <div style={{
          background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12,
          padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: c.thText, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Kategori
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%', padding: '8px 36px 8px 12px', fontSize: 14, fontWeight: 500,
                color: c.textPrimary, background: c.thBg, border: `1px solid ${c.cardBorder}`,
                borderRadius: 8, outline: 'none', appearance: 'none', cursor: 'pointer'
              }}
            >
              <option value="Semua">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <SummaryChip label="Total Keluar" value={`Rp ${formatCurrency(grandTotalDebet)}`} color={c.red} bg="#fef2f2" border="#fecaca" />
            <SummaryChip label="Total Masuk" value={`Rp ${formatCurrency(grandTotalKredit)}`} color={c.green} bg="#f0fdf4" border="#bbf7d0" />
            <SummaryChip label="Saldo" value={`Rp ${formatCurrency(grandFinalSaldo)}`} color={grandFinalSaldo >= 0 ? c.accent : c.red} bg={c.accentLight} border={c.accentBorder} large />
          </div>
        </div>

        {/* Tables */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {allLedgers.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: c.textMuted, background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12 }}>
              Belum ada data transaksi yang tercatat.
            </div>
          ) : (
            allLedgers.map((ledger) => (
              <div key={ledger.category} style={{
                borderRadius: 12, overflow: 'hidden',
                border: `1px solid ${c.cardBorder}`, background: c.cardBg,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                {/* Category Header */}
                <div style={{
                  padding: '14px 24px', background: c.headerBg,
                  borderBottom: `1px solid ${c.headerBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: c.accentLight, border: `1px solid ${c.accentBorder}`
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: c.accent }}>folder_open</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: c.textPrimary }}>{ledger.category}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <HeaderStat label="Keluar" value={`Rp ${formatCurrency(ledger.totalDebet)}`} color={c.red} />
                    <div style={{ width: 1, height: 24, background: c.cardBorder }}></div>
                    <HeaderStat label="Masuk" value={`Rp ${formatCurrency(ledger.totalKredit)}`} color={c.green} />
                    <div style={{ width: 1, height: 24, background: c.cardBorder }}></div>
                    <HeaderStat label="Saldo" value={`Rp ${formatCurrency(ledger.finalSaldo)}`} color={ledger.finalSaldo >= 0 ? c.textPrimary : c.red} bold />
                  </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${c.headerBorder}` }}>
                        <th style={{ ...th, paddingLeft: 24 }}>Tanggal</th>
                        <th style={th}>Keterangan</th>
                        <th style={{ ...th, textAlign: 'right' }}>Keluar</th>
                        <th style={{ ...th, textAlign: 'right' }}>Masuk</th>
                        <th style={{ ...th, textAlign: 'right', paddingRight: 24 }}>Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.records.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: 40, textAlign: 'center', color: c.textMuted }}>Tidak ada transaksi.</td>
                        </tr>
                      ) : (
                        ledger.records.map((record, idx) => (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: `1px solid ${c.rowBorder}`,
                              background: idx % 2 === 0 ? '#ffffff' : c.rowStripe,
                              transition: 'background 120ms'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = c.rowHover}
                            onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : c.rowStripe}
                          >
                            <td style={{ padding: '12px 16px 12px 24px', color: c.textSecondary, fontSize: 13, whiteSpace: 'nowrap' }}>
                              {new Date(record.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: c.textPrimary }}>
                                {record.notes ? record.notes : record.type === 'Income' ? 'Pemasukan' : 'Pengeluaran'}
                              </div>
                              {record.paymentMethod && (
                                <span style={{
                                  display: 'inline-block', marginTop: 3, fontSize: 10, padding: '2px 6px',
                                  borderRadius: 4, border: `1px solid ${c.cardBorder}`,
                                  color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500
                                }}>
                                  {record.paymentMethod}
                                </span>
                              )}
                            </td>
                            <td style={{
                              padding: '12px 16px', textAlign: 'right',
                              fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums',
                              color: record.debet > 0 ? c.red : c.textMuted
                            }}>
                              {record.debet > 0 ? `Rp ${formatCurrency(record.debet)}` : '-'}
                            </td>
                            <td style={{
                              padding: '12px 16px', textAlign: 'right',
                              fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums',
                              color: record.kredit > 0 ? c.green : c.textMuted
                            }}>
                              {record.kredit > 0 ? `Rp ${formatCurrency(record.kredit)}` : '-'}
                            </td>
                            <td style={{
                              padding: '12px 24px 12px 16px', textAlign: 'right',
                              fontWeight: 800, fontSize: 14, fontVariantNumeric: 'tabular-nums',
                              color: record.saldo >= 0 ? c.textPrimary : c.red
                            }}>
                              Rp {formatCurrency(record.saldo)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

/* ---- Sub-components ---- */

function SummaryChip({ label, value, color, bg, border, large }) {
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`, borderRadius: 10,
      padding: '8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: large ? 150 : 120
    }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontSize: large ? 17 : 14, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

function HeaderStat({ label, value, color, bold }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: bold ? 800 : 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

/* ---- Shared table header style ---- */

const th = {
  padding: '10px 16px',
  fontSize: 11,
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  textAlign: 'left',
  background: '#f8fafc'
};
