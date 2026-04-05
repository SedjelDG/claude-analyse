import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Dashboard from './components/Dashboard';
import Caisse from './components/Caisse';
import Products from './components/Products';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Handle RTL/LTR based on language
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'caisse': return <Caisse />;
      case 'products': return <Products />;
      default: return <Dashboard />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return t('common.dashboard');
      case 'caisse': return t('common.pos');
      case 'products': return t('common.inventory');
      default: return 'Antigravity POS';
    }
  };

  const navItems = [
    { id: 'dashboard', label: t('common.dashboard'), icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    { id: 'caisse', label: t('common.pos'), icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /> },
    { id: 'products', label: t('common.inventory'), icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /> },
    { id: 'reports', label: t('common.reports'), icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> }
  ];

  return (
    <div className={`flex h-screen overflow-hidden bg-[#f8fafc] font-body text-slate-800 ${i18n.language === 'ar' ? 'font-arabic' : ''}`}>
      {/* Sidebar */}
      <aside className={`w-20 bg-white border-slate-200/60 flex flex-col items-center py-8 z-50 ${i18n.language === 'ar' ? 'border-l' : 'border-r'}`}>
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 mb-10 hover:rotate-6 transition-transform cursor-pointer">
           <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        
        <div className="flex-1 flex flex-col gap-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
              title={item.label}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
            </button>
          ))}
        </div>

        <div className="mt-auto space-y-4">
           <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
           </button>
           <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky" alt="avatar" />
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-20 flex items-center justify-between px-10">
          <div>
            <h1 className="text-2xl font-display font-black text-slate-800 tracking-tight">{getTitle()}</h1>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
               <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Système Opérationnel • 31 Mars 2026</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-3">
                <span className="text-xs font-black text-slate-400 tracking-widest uppercase">{t('common.language')}:</span>
                <div className="flex gap-1" dir="ltr">
                  {['FR', 'AR', 'EN'].map(l => (
                    <button 
                      key={l} 
                      onClick={() => changeLanguage(l.toLowerCase())}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${i18n.language === l.toLowerCase() ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
             </div>
          </div>
        </header>

        <section className="flex-1 overflow-hidden relative">
          {renderContent()}
        </section>

        {/* Floating Dock */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 glass-dock px-6 py-4 flex items-center gap-6 z-50">
           {navItems.map(item => (
             <button
               key={item.id}
               onClick={() => setActiveTab(item.id)}
               className={`group relative flex flex-col items-center gap-1.5 transition-all ${activeTab === item.id ? 'scale-110' : 'hover:scale-105'}`}
             >
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-2xl shadow-primary/40' : 'bg-white/50 text-slate-400 border border-slate-200/50 hover:bg-white hover:text-primary'}`}>
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
               </div>
               <span className={`text-[9px] font-black uppercase tracking-widest absolute -top-8 bg-slate-900 text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl`}>
                 {item.label}
               </span>
               {activeTab === item.id && (
                 <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
               )}
             </button>
           ))}
           <div className="w-px h-8 bg-slate-200/60 mx-2"></div>
           <button className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-2xl shadow-slate-900/20 hover:scale-110 active:scale-95 transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
           </button>
        </div>
      </main>
    </div>
  );
};

export default App;
