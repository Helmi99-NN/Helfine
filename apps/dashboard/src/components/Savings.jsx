import React, { useState } from 'react';

export default function Savings({ financialData }) {
  const { accounts, setAccounts, totalTabungan } = financialData;
  const savingsAccounts = accounts.filter(a => a.type === 'Savings');

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState('Savings');

  const handleAddNewAsset = () => {
    if (!newAssetName.trim()) return;

    const newId = `asset-${Date.now()}`;
    const isEquity = newAssetType === 'Equity';
    
    // Pick a random color scheme from our theme
    const schemes = [
      { color: 'text-primary', bg: 'bg-primary/20', solidBg: 'bg-primary', border: 'border-primary/30' },
      { color: 'text-secondary', bg: 'bg-secondary/20', solidBg: 'bg-secondary', border: 'border-secondary/30' },
      { color: 'text-tertiary', bg: 'bg-tertiary/20', solidBg: 'bg-tertiary', border: 'border-tertiary/30' },
      { color: 'text-emerald-300', bg: 'bg-primary-fixed/20', solidBg: 'bg-primary-fixed', border: 'border-primary-fixed/30' },
    ];
    const randomScheme = schemes[Math.floor(Math.random() * schemes.length)];

    const newAsset = {
      id: newId,
      name: newAssetName,
      type: newAssetType,
      value: 0,
      icon: isEquity ? 'trending_up' : 'account_balance',
      ...randomScheme
    };

    setAccounts([...accounts, newAsset]);
    setIsAddModalOpen(false);
    setNewAssetName('');
    setNewAssetType('Savings');
  };

  const handleDeleteAsset = () => {
    if (!deleteTargetId) return;
    setAccounts(accounts.filter(acc => acc.id !== deleteTargetId));
    setDeleteTargetId(null);
  };

  const handleStartEdit = (id, currentName) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveEdit = (id) => {
    if (editName.trim()) {
      setAccounts(accounts.map(acc => 
        acc.id === id ? { ...acc, name: editName.trim() } : acc
      ));
    }
    setEditingId(null);
  };

  const handleValueChange = (id, newValue) => {
    const numericValue = parseInt(newValue.replace(/\D/g, '')) || 0;
    setAccounts(accounts.map(acc => 
      acc.id === id ? { ...acc, value: numericValue } : acc
    ));
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Fix for Firefox: dataTransfer must have some data
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Reorder array in real-time
    const newAccounts = [...accounts];
    const draggedItem = newAccounts[draggedIndex];
    newAccounts.splice(draggedIndex, 1);
    newAccounts.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setAccounts(newAccounts);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const totalValue = totalTabungan;

  // Sort accounts for the chart from highest to lowest
  const sortedAccounts = [...savingsAccounts].sort((a, b) => b.value - a.value);

  return (
    <>
      <main className="md:ml-64 pt-24 px-4 md:px-margin-page pb-[140px] relative z-10 w-full md:w-[calc(100%-16rem)] min-h-screen">
        {/* Header Section */}
        <div className="mb-stack-lg">
          <h2 className="font-display-lg text-display-lg text-slate-200 mb-stack-sm tracking-tight">Tabungan & Cadangan</h2>
          <p className="font-body-base text-body-base text-slate-300 max-w-2xl">
            Kelola tabungan, dana darurat, dan pemasukan pasif Anda dengan mudah.
          </p>
        </div>

        {/* Allocation Bar Chart */}
        <div className="glass-card rounded-xl p-container-padding mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 relative z-10 gap-4">
            <h3 className="font-headline-md text-headline-md text-slate-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">bar_chart</span>
              Alokasi Dompet Tabungan
            </h3>
            <div className="sm:text-right bg-slate-800/50 px-4 py-2 rounded-lg border border-white/10">
              <p className="font-label-sm text-label-sm text-slate-300">Total Tabungan Terkini</p>
              <p className="font-display-sm text-2xl text-secondary tracking-tight">Rp {financialData.formatCurrency(totalValue)}</p>
            </div>
          </div>
          
          <div className={`relative z-10 h-[380px] flex items-end ${sortedAccounts.length <= 4 ? 'justify-center gap-16 md:gap-32' : 'justify-between gap-4 md:gap-6'} overflow-x-auto pb-6 pt-32 scrollbar-hide px-4`}>
            {sortedAccounts.map((acc) => {
              const percentage = totalValue > 0 ? ((acc.value / totalValue) * 100).toFixed(1) : 0;
              const maxPercentage = Math.max(...savingsAccounts.map(a => totalValue > 0 ? (a.value / totalValue) * 100 : 0));
              // Normalize height so the tallest bar is 100% of the container (minus the pt-32 padding for text)
              const normalizedHeight = maxPercentage > 0 ? (percentage / maxPercentage) * 100 : 0;
              
              // Split full name for elegant 2-line rendering
              const nameParts = acc.name.split(' ');

              return (
                <div key={`chart-${acc.id}`} className={`flex flex-col items-center justify-end h-full group relative ${sortedAccounts.length <= 4 ? 'w-[80px] md:w-[100px]' : 'flex-1 min-w-[56px] max-w-[64px]'}`}>
                  
                  {/* The Bar */}
                  <div className="w-full relative flex justify-center items-end" style={{ height: `${normalizedHeight}%` }}>
                    
                    {/* The Value Text above the bar */}
                    <div className="absolute bottom-full mb-3 w-full flex justify-center">
                      <span 
                        className={`font-data-mono text-[11px] sm:text-xs text-slate-200 group-hover:text-secondary transition-colors tracking-tight whitespace-nowrap ${sortedAccounts.length <= 4 ? 'mb-2 text-sm' : ''}`} 
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        Rp {financialData.formatCurrency(acc.value)}
                      </span>
                    </div>

                    <div 
                      className={`w-full ${sortedAccounts.length <= 4 ? 'max-w-[80px] md:max-w-[100px]' : 'max-w-[56px]'} rounded-t-xl ${acc.solidBg} opacity-90 shadow-[0_0_20px_var(--color-outline-variant)] transition-all duration-500 ease-out group-hover:opacity-100 group-hover:shadow-[0_0_25px_rgba(78,222,163,0.4)] border-t border-white/20 relative overflow-hidden`} 
                      style={{ height: '100%', minHeight: '6px' }}
                    >
                      {/* Subtle inner gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  </div>
                  
                  {/* The Label below the bar */}
                  <div className="mt-4 flex flex-col items-center justify-start h-10 w-full px-1 group-hover:-translate-y-1 transition-transform">
                    {nameParts.map((word, idx) => (
                      <span key={idx} className={`font-label-sm text-[11px] sm:text-[12px] text-center leading-tight truncate w-full ${idx === 0 ? 'text-slate-200 font-semibold' : 'text-slate-300'}`}>
                        {word}
                      </span>
                    ))}
                  </div>
                  <span className="font-data-mono text-[10px] text-primary/70 mt-1 font-bold">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bento Grid of Glassmorphism Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {savingsAccounts.map((acc, index) => (
            <div 
              key={acc.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              className={`bg-surface-container/40 backdrop-blur-[20px] border border-outline-variant/50 rounded-xl p-container-padding relative overflow-hidden group transition-all duration-300 shadow-lg cursor-grab active:cursor-grabbing ${draggedIndex === index ? 'opacity-40 scale-[0.98] border-primary/50 bg-primary/5' : 'hover:bg-surface-container/60 hover:border-outline-variant'}`}
            >
              <div className="absolute inset-0 rounded-xl border border-white/5 pointer-events-none"></div>
              
              {/* Delete Handle Icon */}
              <button 
                onClick={() => setDeleteTargetId(acc.id)}
                className="absolute top-4 right-12 w-6 h-6 flex items-center justify-center text-error/40 hover:text-error opacity-0 group-hover:opacity-100 transition-all hover:bg-error/10 rounded-md pointer-events-auto"
                title="Hapus Aset"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>

              {/* Drag Handle Icon */}
              <div className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-slate-300/50 group-hover:text-slate-300 transition-colors pointer-events-none cursor-grab active:cursor-grabbing">
                <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
              </div>

              <div className="flex items-start justify-between mb-stack-md pr-12">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border ${acc.border} ${acc.color}`}>
                    <span className="material-symbols-outlined">{acc.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    {editingId === acc.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => handleSaveEdit(acc.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(acc.id)}
                          className="bg-surface-container-lowest border border-primary text-slate-200 font-headline-md text-headline-md rounded px-2 py-0.5 w-32 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group/edit cursor-pointer" onClick={() => handleStartEdit(acc.id, acc.name)}>
                        <h3 className="font-headline-md text-headline-md text-slate-200">{acc.name}</h3>
                        <span className="material-symbols-outlined text-[14px] text-slate-300/0 group-hover/edit:text-slate-300 transition-colors">edit</span>
                      </div>
                    )}
                    <span className="font-label-sm text-label-sm text-slate-300 uppercase tracking-wider">{acc.type}</span>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded ${acc.bg} ${acc.color} font-label-sm text-label-sm border ${acc.border}`}>IDR</div>
              </div>
              <div className="relative mt-stack-lg">
                <label className="font-label-sm text-label-sm text-slate-300 block mb-2">Nilai Portofolio</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-data-mono text-data-mono text-slate-300">Rp</span>
                  <input 
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant text-emerald-300 font-data-mono text-data-mono focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-2.5 pl-10 pr-3 transition-all text-right shadow-inner" 
                    type="text" 
                    value={acc.value === 0 ? '' : acc.value.toLocaleString('id-ID')}
                    onChange={(e) => handleValueChange(acc.id, e.target.value)}
                    placeholder="0" 
                  />
                </div>
              </div>
              <div className="mt-stack-sm flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-slate-300/70 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">update</span>
                  Terakhir diperbarui: Hari ini
                </span>
                <button className="text-primary hover:text-emerald-300 font-label-sm text-label-sm transition-colors">Sync</button>
              </div>
            </div>
          ))}

          {/* Add New Asset Card (Empty State Style) */}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-surface-container/20 backdrop-blur-[10px] border border-dashed border-outline-variant rounded-xl p-container-padding flex flex-col items-center justify-center min-h-[180px] group hover:bg-surface-container/40 hover:border-primary/50 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-stack-md group-hover:bg-primary/20 group-hover:text-primary transition-colors text-slate-300">
              <span className="material-symbols-outlined text-3xl">add</span>
            </div>
            <span className="font-headline-md text-headline-md text-slate-300 group-hover:text-primary transition-colors">Tambah Aset</span>
            <span className="font-label-sm text-label-sm text-slate-300/50 mt-1">Lacak investasi manual</span>
          </button>
        </div>
      </main>

      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="font-headline-md text-headline-md text-slate-200 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">add_circle</span>
              Tambah Dompet Baru
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="font-label-sm text-label-sm text-slate-300 block mb-2">Nama Aset (Sekuritas / Bank)</label>
                <input 
                  type="text" 
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  placeholder="Contoh: Mandiri Sekuritas" 
                  className="w-full bg-surface-container-lowest border border-outline-variant text-slate-200 font-body-base focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-4 transition-all"
                />
              </div>
              
              <div>
                <label className="font-label-sm text-label-sm text-slate-300 block mb-2">Tipe Aset</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setNewAssetType('Equity')}
                    className={`py-3 rounded-lg border font-label-sm flex items-center justify-center gap-2 transition-all ${newAssetType === 'Equity' ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container border-outline-variant text-slate-300 hover:border-outline'}`}
                  >
                    <span className="material-symbols-outlined text-sm">trending_up</span> Investasi
                  </button>
                  <button 
                    onClick={() => setNewAssetType('Savings')}
                    className={`py-3 rounded-lg border font-label-sm flex items-center justify-center gap-2 transition-all ${newAssetType === 'Savings' ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-surface-container border-outline-variant text-slate-300 hover:border-outline'}`}
                  >
                    <span className="material-symbols-outlined text-sm">account_balance</span> Tabungan
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 justify-end">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 rounded-lg text-slate-300 hover:bg-surface-container hover:text-slate-200 font-label-sm transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleAddNewAsset}
                disabled={!newAssetName.trim()}
                className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-error/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(255,180,171,0.2)]">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-slate-200 mb-2">Hapus Aset?</h3>
            <p className="font-body-base text-body-base text-slate-300 mb-6">
              Kartu aset ini dan riwayat alokasinya akan dihapus dari portofolio Anda.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setDeleteTargetId(null)}
                className="px-5 py-2.5 rounded-lg border border-outline-variant text-slate-300 hover:bg-surface-container hover:text-slate-200 font-label-sm transition-colors flex-1"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteAsset}
                className="px-5 py-2.5 rounded-lg bg-error text-white font-label-sm font-bold shadow-lg shadow-error/20 hover:bg-error/90 transition-all flex-1"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
