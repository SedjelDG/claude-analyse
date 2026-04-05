import React from 'react';
import { useTranslation } from 'react-i18next';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const sparklineData = "M0 20 L20 15 L40 18 L60 10 L80 12 L100 5 L120 8 L140 3 L160 10 L180 15 L200 12";

  return (
    <section className="p-8">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: t('dashboard.dailyVentes'), val: '142,500', unit: t('common.currency'), change: '+12.5%', color: 'blue', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
          { label: t('dashboard.transactions'), val: '84', unit: 'Tickets', change: '+4.2%', color: 'emerald', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
          { label: t('dashboard.avgCart'), val: '1,696', unit: t('common.currency'), change: '-2.1%', color: 'amber', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /> },
          { label: t('dashboard.activeProducts'), val: '12,402', unit: 'Ref', change: '+120', color: 'indigo', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /> }
        ].map((card, i) => (
          <div key={i} className="group bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-500">
             <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 bg-${card.color}-50 rounded-3xl flex items-center justify-center text-${card.color}-500 group-hover:scale-110 transition-transform duration-500`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">{card.icon}</svg>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${card.change.includes('+') ? 'bg-secondary/10 text-secondary' : 'bg-danger/10 text-danger'}`}>
                     {card.change}
                   </span>
                   <svg className="w-20 h-8 opacity-40" viewBox="0 0 200 40">
                     <path d={sparklineData} fill="none" stroke={card.change.includes('+') ? '#10B981' : '#EF4444'} strokeWidth="3" />
                   </svg>
                </div>
             </div>
             <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase mb-1">{card.label}</p>
             <h3 className="text-3xl font-display font-black text-slate-800 tabular-nums">
               {card.val} <span className="text-sm font-bold text-slate-300 mx-1 tracking-tight">{card.unit}</span>
             </h3>
          </div>
        ))}
      </div>
      
      {/* Charts & Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200/60 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-primary/10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{t('dashboard.performance')}</h3>
                <p className="text-xs font-bold text-slate-400 tracking-wide">{t('dashboard.performanceSub')}</p>
              </div>
              <div className="flex gap-2" dir="ltr">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(day => (
                  <div key={day} className="flex flex-col items-center gap-1 group/day cursor-pointer">
                    <div className="w-8 bg-slate-100 rounded-lg overflow-hidden h-32 flex flex-col justify-end gap-1 p-1">
                      <div className={`w-full rounded-md bg-primary/40 group-hover/day:bg-primary transition-all duration-500`} style={{height: `${Math.random() * 80 + 20}%`}}></div>
                    </div>
                    <span className="text-[10px] font-black text-slate-300 group-hover/day:text-primary transition-colors">{day}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full h-80 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 group-hover:border-primary/30 transition-colors">
               <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
               <p className="font-bold tracking-widest text-[10px] uppercase">Initialisation...</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-8">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200/60 shadow-sm flex-1">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-slate-800 tracking-tight">{t('dashboard.vigilance')}</h3>
               <span className="w-6 h-6 bg-danger/10 text-danger rounded-full flex items-center justify-center text-[10px] font-black">!</span>
             </div>
             <div className="space-y-4">
                <div className="flex items-center gap-4 p-5 rounded-[2rem] bg-slate-50/50 border border-transparent hover:border-slate-200 transition-all group/item">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-amber-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-700">Couscous 1kg</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">STOCK BAS • 4 U</p>
                  </div>
                </div>
             </div>
             <button className="w-full mt-8 py-4 rounded-2xl bg-primary/5 hover:bg-primary text-[10px] font-black text-primary hover:text-white tracking-widest uppercase transition-all duration-300">Inventaire Complet</button>
          </div>
          
          <div className="bg-gradient-to-br from-primary to-blue-700 p-8 rounded-[3rem] shadow-2xl shadow-primary/30 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-lg font-black tracking-tight mb-2 relative">{t('dashboard.readyToSell')}</h3>
            <p className="text-xs font-bold text-white/70 mb-6 leading-relaxed relative">{t('dashboard.readyToSellSub')}</p>
            <button className="bg-white text-primary px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-xl hover:scale-105 active:scale-95 transition-all relative">{t('dashboard.launchPOS')}</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
