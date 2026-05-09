import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, financialData, isOpen, onClose, isLightMode, setIsLightMode, isPrivacyMode, setIsPrivacyMode }) {
  const handleLogout = () => {
    sessionStorage.removeItem('helfine_auth');
    if (financialData?.setIsAuthenticated) {
      financialData.setIsAuthenticated(false);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose(); // Close sidebar on mobile after clicking a tab
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Content */}
      <nav className={`fixed left-0 top-0 h-full w-64 border-r border-white/10 bg-slate-950/95 backdrop-blur-2xl shadow-2xl flex flex-col py-8 divide-y divide-outline-variant/20 z-[70] font-['Plus_Jakarta_Sans'] text-sm text-primary transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="md:hidden absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="px-6 pb-8">
        <div 
          className="flex items-center gap-3 mb-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handleTabClick('portfolio')}
          title="Ke Halaman Utama"
        >
          <img alt="Quant Specialist Logo" className="w-8 h-8 rounded-full border border-primary/30" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvq9QeWgRopBc_39Wlxp_oxyFjYcZP1ce-J6D_n0ctCFncshDfCwDXmSzzzyfDgzdfO6pfzvRJFrVgJbR0RzV23LL0jSTX6oHoSxPNXHQjpjLyf8OpJxFIz528BA5ITm5BfQrU0o5AC4p46L2K2YZwGadwvLpdtvWHlI2UutLiRHTN8JkjvYlbu6M6tMONqt8UAq8BXIrNl3uNzGGqZv-gvNGGx8Kephz42V_9ow_rRXWp1tg5qtR07zU06OujhpPh0QJ5zzET8HgJ"/>
          <h1 className="text-primary font-black tracking-widest uppercase text-lg">HELFINE</h1>
        </div>
        <p className="text-slate-300 text-xs">Helmi Asset Management</p>
      </div>
      <div className="flex-1 py-4 space-y-2">
        {/* Navigation Tabs */}
        <button onClick={() => handleTabClick('portfolio')} className={`w-full ${activeTab === 'portfolio' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-slate-300 hover:bg-white/5 hover:text-slate-200'} flex items-center gap-3 px-6 py-4 transition-all hover:translate-x-1 duration-300`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'portfolio' ? "'FILL' 1" : "normal" }}>grid_view</span>
          <span>Portofolio</span>
        </button>
        <button onClick={() => handleTabClick('analytics')} className={`w-full ${activeTab === 'analytics' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-slate-300 hover:bg-white/5 hover:text-slate-200'} flex items-center gap-3 px-6 py-4 transition-all hover:translate-x-1 duration-300`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'analytics' ? "'FILL' 1" : "normal" }}>monitoring</span>
          <span>Analitik</span>
        </button>
        <button onClick={() => handleTabClick('cashflow')} className={`w-full ${activeTab === 'cashflow' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-slate-300 hover:bg-white/5 hover:text-slate-200'} flex items-center gap-3 px-6 py-4 transition-all hover:translate-x-1 duration-300`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'cashflow' ? "'FILL' 1" : "normal" }}>account_balance_wallet</span>
          <span>Arus Kas</span>
        </button>

        <button onClick={() => handleTabClick('strategy')} className={`w-full ${activeTab === 'strategy' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-slate-300 hover:bg-white/5 hover:text-slate-200'} flex items-center gap-3 px-6 py-4 transition-all hover:translate-x-1 duration-300`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'strategy' ? "'FILL' 1" : "normal" }}>ads_click</span>
          <span>Operasional</span>
        </button>
        <button onClick={() => handleTabClick('makan')} className={`w-full ${activeTab === 'makan' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-slate-300 hover:bg-white/5 hover:text-slate-200'} flex items-center gap-3 px-6 py-4 transition-all hover:translate-x-1 duration-300`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'makan' ? "'FILL' 1" : "normal" }}>restaurant</span>
          <span>Makan</span>
        </button>
        <button onClick={() => handleTabClick('trading')} className={`w-full ${activeTab === 'trading' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-slate-300 hover:bg-white/5 hover:text-slate-200'} flex items-center gap-3 px-6 py-4 transition-all hover:translate-x-1 duration-300`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'trading' ? "'FILL' 1" : "normal" }}>candlestick_chart</span>
          <span>Trading</span>
        </button>
        <button onClick={() => handleTabClick('resume')} className={`w-full ${activeTab === 'resume' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-slate-300 hover:bg-white/5 hover:text-slate-200'} flex items-center gap-3 px-6 py-4 transition-all hover:translate-x-1 duration-300`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'resume' ? "'FILL' 1" : "normal" }}>history</span>
          <span>Resume</span>
        </button>
      </div>
      <div className="px-6 mt-auto flex flex-col gap-4">

        
        <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
          {/* Mobile Only Toggles */}
          <div className="md:hidden flex gap-2 px-2 pb-2">
            <button 
              onClick={() => setIsLightMode?.(!isLightMode)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-surface-container border border-outline-variant text-slate-300 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">{isLightMode ? 'dark_mode' : 'light_mode'}</span>
              <span className="text-xs font-semibold">{isLightMode ? 'Gelap' : 'Terang'}</span>
            </button>
            <button 
              onClick={() => setIsPrivacyMode?.(!isPrivacyMode)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors ${isPrivacyMode ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-surface-container border-outline-variant text-slate-300 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-[18px]">{isPrivacyMode ? 'visibility_off' : 'visibility'}</span>
              <span className="text-xs font-semibold">{isPrivacyMode ? 'Tampil' : 'Sembunyi'}</span>
            </button>
          </div>

          <a href="#" className="text-slate-300 flex items-center gap-3 px-2 py-2 hover:text-slate-200 transition-colors">
            <span className="material-symbols-outlined text-[18px]">help</span>
            Bantuan
          </a>
          <a href="#" className="text-slate-300 flex items-center gap-3 px-2 py-2 hover:text-slate-200 transition-colors">
            <span className="material-symbols-outlined text-[18px]">feedback</span>
            Kirim Masukan
          </a>
          <button onClick={handleLogout} className="text-error flex items-center gap-3 px-2 py-2 hover:bg-error/10 hover:text-error/80 rounded-lg transition-all w-full text-left mt-2 border border-error/20 bg-error/5">
            <span className="material-symbols-outlined text-[18px]">lock</span>
            Kunci Aplikasi
          </button>
        </div>
      </div>
      </nav>
    </>
  );
}
