import React, { useState, useEffect, useRef } from 'react';

export default function Header({ title = 'Dashboard', isPrivacyMode, setIsPrivacyMode, isLightMode, setIsLightMode, onMenuClick, onLogout, onLogoClick }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const headerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name) => {
    setActiveDropdown(prev => prev === name ? null : name);
  };

  return (
    <header ref={headerRef} className="fixed top-0 right-0 left-0 md:left-64 h-16 flex items-center justify-between px-8 z-50 bg-slate-900/40 backdrop-blur-md docked full-width border-b border-white/10 shadow-sm font-['Plus_Jakarta_Sans'] tracking-tight text-primary transition-colors duration-300">
      {/* Brand / Title Area */}
      <div className="flex items-center gap-4">
        <button onClick={onLogoClick} className="text-2xl font-black text-primary italic font-['Plus_Jakarta_Sans'] tracking-tight md:hidden focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg px-1">HELFINE</button>
        <h2 className="hidden md:block font-headline-md text-headline-md text-slate-200">{title}</h2>
      </div>
      {/* Search */}
      <div className="hidden md:flex flex-1 max-w-md relative group ml-auto mr-8">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">search</span>
        <input className="w-full bg-slate-800 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Cari transaksi atau kategori..." type="text"/>
      </div>
      {/* Trailing Actions */}
      <div className="flex items-center gap-4">
        
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications')}
            className={`p-2 hover:bg-white/5 hover:text-primary transition-all duration-200 rounded-full scale-95 active:scale-90 relative ${activeDropdown === 'notifications' ? 'bg-white/10 text-primary' : 'text-slate-300'}`}
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full border-[1.5px] border-surface"></span>
          </button>
          
          {activeDropdown === 'notifications' && (
            <div className="fixed sm:absolute top-[72px] sm:top-auto right-4 left-4 sm:left-auto sm:right-0 sm:mt-2 w-[calc(100vw-32px)] sm:w-80 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl shadow-xl py-2 overflow-hidden transform origin-top sm:origin-top-right animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="px-4 py-2 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-slate-50/80 dark:bg-surface-container/50">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Notifikasi</span>
                <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">2 Baru</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <button className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5 flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">account_balance</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Dana darurat terisi</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">Alokasi ke Bank Jago sukses Rp 500.000</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-data-mono">2 jam yang lalu</p>
                  </div>
                </button>
                <button className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#FDE047]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[#EAB308] dark:text-[#FDE047] text-[18px]">trending_up</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Target Ipot tercapai</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">Portofolio Hana melewati Rp 1.000.000</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-data-mono">1 hari yang lalu</p>
                  </div>
                </button>
              </div>
              <div className="px-4 py-2 border-t border-slate-200 dark:border-white/5 text-center bg-slate-50/80 dark:bg-surface-container/50">
                <a href="#" className="text-xs text-primary hover:underline font-bold">Tandai semua dibaca</a>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Toggle */}
        <button 
          onClick={() => setIsPrivacyMode?.(!isPrivacyMode)}
          className={`p-2 text-slate-300 hover:bg-white/5 hover:text-primary transition-all duration-200 rounded-full scale-95 active:scale-90 hidden sm:block ${isPrivacyMode ? 'text-primary' : ''}`} 
          title={isPrivacyMode ? "Tampilkan Nominal" : "Sembunyikan Nominal"}
        >
          <span className="material-symbols-outlined">
            {isPrivacyMode ? 'visibility_off' : 'visibility'}
          </span>
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={() => setIsLightMode?.(!isLightMode)}
          className={`p-2 text-slate-300 hover:bg-white/5 hover:text-primary transition-all duration-200 rounded-full scale-95 active:scale-90 hidden sm:block`} 
          title={isLightMode ? "Ganti ke Mode Gelap" : "Ganti ke Mode Terang"}
        >
          <span className="material-symbols-outlined">
            {isLightMode ? 'dark_mode' : 'light_mode'}
          </span>
        </button>

        {/* Settings */}
        <div className="relative hidden sm:block">
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'settings' ? null : 'settings')}
            className={`p-2 hover:bg-white/5 hover:text-primary transition-all duration-200 rounded-full scale-95 active:scale-90 ${activeDropdown === 'settings' ? 'bg-white/10 text-primary' : 'text-slate-300'}`}
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
          
          {activeDropdown === 'settings' && (
            <div className="fixed sm:absolute top-[72px] sm:top-auto right-4 left-4 sm:left-auto sm:right-0 sm:mt-2 w-[calc(100vw-32px)] sm:w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl shadow-xl py-2 overflow-hidden transform origin-top sm:origin-top-right animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="px-4 py-2 border-b border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-surface-container/50">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Pengaturan</span>
              </div>
              <div className="py-1">
                <button className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200">
                  <span className="material-symbols-outlined text-[18px]">account_circle</span>
                  Pengaturan Akun
                </button>
                <button className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200">
                  <span className="material-symbols-outlined text-[18px] text-primary">palette</span>
                  Tampilan & Tema
                </button>
                <button className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200">
                  <span className="material-symbols-outlined text-[18px]">security</span>
                  Keamanan & Privasi
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block"></div>
        
        {/* Profile */}
        <div className="relative">
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')}
            className={`w-8 h-8 rounded-full overflow-hidden border transition-colors scale-95 active:scale-90 ${activeDropdown === 'profile' ? 'border-primary ring-2 ring-primary/20' : 'border-white/10 hover:border-primary'}`}
          >
            <img alt="Wealth Manager Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5GAo0Ip1NBCypzIgiRdZrSI6jkhMOk4ttICN93IriFIb9LkQRJPLmVUVazMGzefLaK6Naxb0RyYmxW391WsL_j1C2aPn5wLRSeEZcOnpm5ixULQwjIMYxhsdxgpgihDOdRnX2s5myQiwH3Amxp0E_8TayNr7hvTXUat81VnmiSVTpHXXYMjxHoIl5OaXWk422-EuX9sZScxdeN6MohbG6M0DlftALp0MsP-emB2BzndKTOM8_I7kGkJM8QegapLBH4hh7ON6Ris90"/>
          </button>
          
          {activeDropdown === 'profile' && (
            <div className="fixed sm:absolute top-[72px] sm:top-auto right-4 left-4 sm:left-auto sm:right-0 sm:mt-3 w-[calc(100vw-32px)] sm:w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl shadow-xl py-2 overflow-hidden transform origin-top sm:origin-top-right animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5 flex items-center gap-3 mb-1 bg-slate-50/80 dark:bg-surface-container/50">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-surface">
                  <img alt="Wealth Manager Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5GAo0Ip1NBCypzIgiRdZrSI6jkhMOk4ttICN93IriFIb9LkQRJPLmVUVazMGzefLaK6Naxb0RyYmxW391WsL_j1C2aPn5wLRSeEZcOnpm5ixULQwjIMYxhsdxgpgihDOdRnX2s5myQiwH3Amxp0E_8TayNr7hvTXUat81VnmiSVTpHXXYMjxHoIl5OaXWk422-EuX9sZScxdeN6MohbG6M0DlftALp0MsP-emB2BzndKTOM8_I7kGkJM8QegapLBH4hh7ON6Ris90"/>
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Helmi</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Asset Manager</p>
                </div>
              </div>
              <button className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex gap-3 items-center text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200 group">
                <span className="material-symbols-outlined text-[18px] group-hover:text-primary transition-colors">person</span>
                Profil Saya
              </button>
              <button className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex gap-3 items-center text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200 group">
                <span className="material-symbols-outlined text-[18px] group-hover:text-primary transition-colors">verified_user</span>
                Premium Status <span className="ml-auto text-[10px] bg-primary/10 dark:bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold tracking-widest border border-primary/20">Pro</span>
              </button>
              <div className="h-px bg-slate-200 dark:bg-white/5 my-1"></div>
              <button onClick={onLogout} className="w-full text-left px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-[#F43F5E]/10 transition-colors flex gap-3 items-center text-sm text-rose-600 dark:text-[#F43F5E] hover:text-rose-700 dark:hover:text-[#F43F5E]">
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Keluar
              </button>
            </div>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center md:hidden gap-1 ml-1">
          <button 
            onClick={onLogout}
            className="p-2 text-error hover:bg-error/10 rounded-full transition-colors"
            title="Kunci Aplikasi"
          >
            <span className="material-symbols-outlined text-xl">lock</span>
          </button>
          <button 
            onClick={onMenuClick}
            className="p-2 text-slate-300 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>

      </div>
    </header>
  );
}
