import React, { useState, useMemo } from 'react';

const indonesianMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function getInitialDates() {
  const today = new Date();
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth();
  let day = today.getDate();
  
  let startD;
  if (day > 20) {
    startD = new Date(currentYear, currentMonth, 21);
  } else {
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear--;
    }
    startD = new Date(prevYear, prevMonth, 21);
  }

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return {
    start: formatDate(startD),
    end: formatDate(today)
  };
}

export default function ProfitLoss({ financialData }) {
  const { formatCurrency } = financialData;

  const initialDates = getInitialDates();
  const [startDateStr, setStartDateStr] = useState(initialDates.start);
  const [endDateStr, setEndDateStr] = useState(initialDates.end);

  const data = useMemo(() => {
    const startDate = startDateStr ? new Date(startDateStr) : new Date(0);
    if (startDateStr) startDate.setHours(0,0,0,0);
    
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    if (endDateStr) endDate.setHours(23,59,59,999);

    let incomes = [];
    let expenses = [];

    // Parse main cashflow
    try {
      const cf = JSON.parse(localStorage.getItem('cashflow_records') || '[]');
      const filtered = cf.filter(r => {
        const d = new Date(r.date);
        return d >= startDate && d <= endDate;
      });
      filtered.forEach(r => {
        if (r.type === 'Income') incomes.push(r);
        else if (r.type === 'Expense') expenses.push(r);
      });
    } catch (e) {}

    // Parse strategy
    try {
      const stratTxs = JSON.parse(localStorage.getItem('strategy_transactions') || '[]');
      const stratFiltered = stratTxs.filter(r => {
        const d = new Date(r.date); return d >= startDate && d <= endDate;
      });
      stratFiltered.forEach(r => {
        expenses.push({ ...r, category: 'Beban Operasional Khusus' });
      });
    } catch (e) {}

    // Parse makan
    try {
      const makanTxs = JSON.parse(localStorage.getItem('makan_transactions') || '[]');
      const makanFiltered = makanTxs.filter(r => {
        const d = new Date(r.date); return d >= startDate && d <= endDate;
      });
      makanFiltered.forEach(r => {
        expenses.push({ ...r, category: 'Konsumsi / Makan' });
      });
    } catch (e) {}

    // Aggregate Incomes
    const incomeMap = {};
    incomes.forEach(inc => {
      if (!incomeMap[inc.category]) incomeMap[inc.category] = { amount: 0, records: [] };
      incomeMap[inc.category].amount += inc.amount;
      incomeMap[inc.category].records.push(inc);
    });
    const aggregatedIncomes = Object.keys(incomeMap).map(cat => ({
      category: cat,
      amount: incomeMap[cat].amount,
      records: incomeMap[cat].records.sort((a,b) => new Date(b.date) - new Date(a.date))
    })).sort((a,b) => b.amount - a.amount);

    // Aggregate Expenses
    const expenseMap = {};
    expenses.forEach(exp => {
      if (!expenseMap[exp.category]) expenseMap[exp.category] = { amount: 0, records: [] };
      expenseMap[exp.category].amount += exp.amount;
      
      // Do not store detailed records for "Konsumsi / Makan" to prevent long lists
      if (exp.category !== 'Konsumsi / Makan') {
        expenseMap[exp.category].records.push(exp);
      }
    });
    const aggregatedExpenses = Object.keys(expenseMap).map(cat => ({
      category: cat,
      amount: expenseMap[cat].amount,
      records: expenseMap[cat].records.sort((a,b) => new Date(b.date) - new Date(a.date))
    })).sort((a,b) => b.amount - a.amount);

    const totalIncome = aggregatedIncomes.reduce((s, i) => s + i.amount, 0);
    const totalExpense = aggregatedExpenses.reduce((s, e) => s + e.amount, 0);
    const netIncome = totalIncome - totalExpense;

    return {
      aggregatedIncomes,
      aggregatedExpenses,
      totalIncome,
      totalExpense,
      netIncome,
      startDate,
      endDate
    };
  }, [startDateStr, endDateStr]);

  // -- Color tokens for light mode --
  const c = {
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    headerBg: '#f8fafc',
    headerBorder: '#e2e8f0',
    rowBorder: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    green: '#059669',
    greenLight: '#d1fae5',
    red: '#dc2626',
    redLight: '#fee2e2',
    accent: '#2563eb',
    accentLight: '#dbeafe',
  };

  return (
    <main className="md:ml-64 pt-24 px-4 md:px-margin-page pb-margin-page w-full md:w-[calc(100%-16rem)] min-h-screen">
      <div className="max-w-[1000px] mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* Header & Filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: c.textPrimary, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: c.accent }}>request_quote</span>
              Laba Rugi
            </h2>
            <p style={{ color: c.textSecondary, marginTop: 6, fontSize: 15, maxWidth: 600 }}>
              Laporan ringkasan pendapatan dan beban secara real-time maupun historis. Membantu Anda mengukur profitabilitas bulanan.
            </p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Filter Rentang Waktu
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input 
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                style={{
                  background: '#ffffff', border: `1px solid ${c.cardBorder}`, color: c.textPrimary,
                  fontSize: 14, borderRadius: 8, padding: '8px 12px', outline: 'none'
                }}
              />
              <span style={{ color: c.textMuted }}>-</span>
              <input 
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                style={{
                  background: '#ffffff', border: `1px solid ${c.cardBorder}`, color: c.textPrimary,
                  fontSize: 14, borderRadius: 8, padding: '8px 12px', outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          <SummaryCard 
            title="Total Pendapatan" 
            amount={`Rp ${formatCurrency(data.totalIncome)}`} 
            icon="arrow_downward" 
            color={c.green} 
            bg={c.greenLight}
            c={c}
          />
          <SummaryCard 
            title="Total Beban" 
            amount={`Rp ${formatCurrency(data.totalExpense)}`} 
            icon="arrow_upward" 
            color={c.red} 
            bg={c.redLight}
            c={c}
          />
          <SummaryCard 
            title="Laba Bersih" 
            amount={`${data.netIncome >= 0 ? '+' : '-'}Rp ${formatCurrency(Math.abs(data.netIncome))}`} 
            icon="account_balance" 
            color={data.netIncome >= 0 ? c.accent : c.red} 
            bg={data.netIncome >= 0 ? c.accentLight : c.redLight}
            c={c}
            highlight
          />
        </div>

        {/* Detailed Report Table */}
        <div style={{ 
          background: c.cardBg, borderRadius: 16, overflow: 'hidden', 
          border: `1px solid ${c.cardBorder}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' 
        }}>
          <div style={{ 
            padding: '20px 24px', borderBottom: `1px solid ${c.headerBorder}`, background: c.headerBg,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: c.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: c.accent }}>analytics</span>
              Rincian Laba Rugi
            </h3>
            <span style={{ fontSize: 13, color: c.textSecondary, fontFamily: 'Plus Jakarta Sans, monospace', fontWeight: 500 }}>
              {data.startDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} - {data.endDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <tbody style={{ fontSize: 14 }}>
                
                {/* INCOMES */}
                <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.cardBorder}` }}>
                  <td colSpan="2" style={{ padding: '16px 24px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: c.textPrimary, fontSize: 12 }}>
                    PENDAPATAN (REVENUE)
                  </td>
                </tr>
                {data.aggregatedIncomes.length === 0 ? (
                  <tr>
                    <td colSpan="2" style={{ padding: '16px 24px 16px 40px', color: c.textMuted, fontStyle: 'italic' }}>Tidak ada pendapatan tercatat.</td>
                  </tr>
                ) : (
                  data.aggregatedIncomes.map((inc, idx) => (
                    <React.Fragment key={`inc-${idx}`}>
                      <tr style={{ borderBottom: `1px solid ${c.rowBorder}` }}>
                        <td style={{ padding: '16px 24px 16px 40px', color: c.textPrimary, fontWeight: 700 }}>{inc.category}</td>
                        <td style={{ padding: '16px 24px', textAlign: 'right', fontFamily: 'Plus Jakarta Sans, monospace', fontWeight: 700, color: c.green }}>
                          Rp {formatCurrency(inc.amount)}
                        </td>
                      </tr>
                      {inc.records.map(record => (
                        <tr key={record.id} style={{ borderBottom: `1px solid ${c.rowBorder}`, background: '#fafbfc' }}>
                          <td style={{ padding: '10px 24px 10px 56px', color: c.textSecondary, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: 'Plus Jakarta Sans, monospace', opacity: 0.7, width: 64 }}>
                              {new Date(record.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                            </span>
                            <span style={{ color: c.textMuted }}>•</span>
                            <span>{record.notes || 'Catatan transaksi'}</span>
                            {record.paymentMethod && (
                              <span style={{ 
                                fontSize: 9, padding: '2px 6px', borderRadius: 4, 
                                border: `1px solid ${c.cardBorder}`, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#ffffff'
                              }}>
                                {record.paymentMethod}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 24px', textAlign: 'right', fontFamily: 'Plus Jakarta Sans, monospace', color: c.textSecondary, fontSize: 13, opacity: 0.9 }}>
                            Rp {formatCurrency(record.amount)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
                <tr style={{ background: c.greenLight, borderBottom: `2px solid ${c.cardBorder}` }}>
                  <td style={{ padding: '16px 24px 16px 40px', fontWeight: 700, color: c.green }}>Total Pendapatan</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontFamily: 'Plus Jakarta Sans, monospace', fontWeight: 800, color: c.green }}>
                    Rp {formatCurrency(data.totalIncome)}
                  </td>
                </tr>

                {/* EXPENSES */}
                <tr style={{ background: c.headerBg, borderBottom: `1px solid ${c.cardBorder}` }}>
                  <td colSpan="2" style={{ padding: '24px 24px 16px 24px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: c.textPrimary, fontSize: 12 }}>
                    BEBAN (EXPENSES)
                  </td>
                </tr>
                {data.aggregatedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="2" style={{ padding: '16px 24px 16px 40px', color: c.textMuted, fontStyle: 'italic' }}>Tidak ada beban tercatat.</td>
                  </tr>
                ) : (
                  data.aggregatedExpenses.map((exp, idx) => (
                    <React.Fragment key={`exp-${idx}`}>
                      <tr style={{ borderBottom: `1px solid ${c.rowBorder}` }}>
                        <td style={{ padding: '16px 24px 16px 40px', color: c.textPrimary, fontWeight: 700 }}>{exp.category}</td>
                        <td style={{ padding: '16px 24px', textAlign: 'right', fontFamily: 'Plus Jakarta Sans, monospace', fontWeight: 700, color: c.red }}>
                          Rp {formatCurrency(exp.amount)}
                        </td>
                      </tr>
                      {exp.records.map(record => (
                        <tr key={record.id} style={{ borderBottom: `1px solid ${c.rowBorder}`, background: '#fafbfc' }}>
                          <td style={{ padding: '10px 24px 10px 56px', color: c.textSecondary, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: 'Plus Jakarta Sans, monospace', opacity: 0.7, width: 64 }}>
                              {new Date(record.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                            </span>
                            <span style={{ color: c.textMuted }}>•</span>
                            <span>{record.notes || 'Catatan transaksi'}</span>
                            {record.paymentMethod && (
                              <span style={{ 
                                fontSize: 9, padding: '2px 6px', borderRadius: 4, 
                                border: `1px solid ${c.cardBorder}`, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#ffffff'
                              }}>
                                {record.paymentMethod}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 24px', textAlign: 'right', fontFamily: 'Plus Jakarta Sans, monospace', color: c.textSecondary, fontSize: 13, opacity: 0.9 }}>
                            Rp {formatCurrency(record.amount)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
                <tr style={{ background: c.redLight, borderBottom: `2px solid ${c.cardBorder}` }}>
                  <td style={{ padding: '16px 24px 16px 40px', fontWeight: 700, color: c.red }}>Total Beban</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontFamily: 'Plus Jakarta Sans, monospace', fontWeight: 800, color: c.red }}>
                    Rp {formatCurrency(data.totalExpense)}
                  </td>
                </tr>

                {/* NET INCOME */}
                <tr style={{ background: '#f8fafc' }}>
                  <td style={{ padding: '24px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: c.textPrimary, fontSize: 14 }}>
                    LABA BERSIH (NET INCOME)
                  </td>
                  <td style={{ 
                    padding: '24px', textAlign: 'right', fontFamily: 'Plus Jakarta Sans, monospace', 
                    fontWeight: 800, fontSize: 20, color: data.netIncome >= 0 ? c.accent : c.red 
                  }}>
                    {data.netIncome >= 0 ? '+' : '-'}Rp {formatCurrency(Math.abs(data.netIncome))}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({ title, amount, icon, color, bg, c, highlight }) {
  return (
    <div style={{ 
      background: c.cardBg, borderRadius: 16, padding: 24,
      border: `1px solid ${highlight ? color : c.cardBorder}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      position: 'relative', overflow: 'hidden'
    }}>
      {highlight && (
        <div style={{ 
          position: 'absolute', top: -20, right: -20, width: 100, height: 100, 
          borderRadius: '50%', background: bg, filter: 'blur(30px)', zIndex: 0 
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: '50%', 
            background: bg, color: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </h3>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: c.textPrimary, fontFamily: 'Plus Jakarta Sans, monospace' }}>
          {amount}
        </div>
      </div>
    </div>
  );
}
