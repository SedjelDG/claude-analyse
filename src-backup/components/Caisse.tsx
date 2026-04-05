import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Product } from '../utils/mockProducts';
import { generateMockProducts } from '../utils/mockProducts';
import { useHardware } from '../hooks/useHardware';

interface CartItem extends Product {
  quantity: number;
}

const Caisse: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  
  const allProducts = useMemo(() => generateMockProducts(20000), []);
  
  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id 
          ? { ...item, quantity: item.quantity + quantity } 
          : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setSearchTerm('');
    setShowSearch(false);
  }, []);

  const handleScan = useCallback((barcode: string) => {
    const product = allProducts.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
    }
  }, [allProducts, addToCart]);

  const { isPrinting, printReceipt, scaleWeight, readScale } = useHardware({ onScan: handleScan });
  const [weighingProduct, setWeighingProduct] = useState<Product | null>(null);

  const handleWeighClick = async (product: Product) => {
    setWeighingProduct(product);
    const weight = await readScale();
    // Simulate scale stabilization
    setTimeout(() => {
       addToCart(product, weight);
       setWeighingProduct(null);
    }, 1500);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    await printReceipt({ cart, total });
    setCart([]);
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(term) || p.barcode.includes(term)
    ).slice(0, 50); 
  }, [searchTerm, allProducts]);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        // Allow decimals if it's a weighed item, else integer math
        const newQty = item.isWeighed ? Math.max(0.001, item.quantity + (delta * 0.1)) : Math.max(1, item.quantity + delta);
        return { ...item, quantity: Number(newQty.toFixed(3)) };
      }
      return item;
    }));
  }, []);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="flex h-full gap-6 overflow-hidden p-6 pt-0 relative">
      {/* Hardware Overlays */}
      {isPrinting && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center rounded-[2.5rem] m-6 mt-0">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center animate-bounce">
            <svg className="w-16 h-16 text-primary mb-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Impression du Ticket...</h2>
            <p className="text-sm font-bold text-slate-400 mt-2">Veuillez patienter.</p>
          </div>
        </div>
      )}

      {weighingProduct && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center rounded-[2.5rem] m-6 mt-0">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center min-w-[300px]">
            <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-6">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight text-center mb-1">{weighingProduct.name}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Lecture de la Balance USB</p>
            <div className="bg-slate-900 text-secondary px-8 py-4 rounded-2xl font-display w-full text-center shadow-lg shadow-slate-900/20">
               <span className="text-5xl font-black tabular-nums">{scaleWeight ? scaleWeight.toFixed(3) : '0.000'}</span>
               <span className="text-xl font-bold ml-2">KG</span>
            </div>
          </div>
        </div>
      )}

      {/* Left Column: Cart & Checkout */}
      <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
        <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <h3 className="font-display font-black text-xl text-slate-800 tracking-tight">{t('pos.currentCart')}</h3>
          </div>
          <button onClick={() => setCart([])} className="text-xs font-black text-slate-400 hover:text-danger tracking-widest uppercase transition-colors">{t('pos.empty')}</button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
              <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <p className="font-bold tracking-widest uppercase text-[10px]">{t('pos.emptyCart')}</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-primary/20 transition-all group">
                <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-slate-800 truncate">{item.name}</h4>
                  <p className="text-xs font-bold text-slate-400 italic">{item.price.toLocaleString()} {t('common.currency')}</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100 font-display" dir="ltr">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:text-primary transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                  </button>
                  <span className="font-black text-sm w-12 text-center tabular-nums">{item.quantity} {item.isWeighed && <span className="text-[10px] text-slate-400">KG</span>}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:text-primary transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
                <div className="text-right min-w-[100px] rtl:min-w-[120px]">
                  <span className="block font-black text-slate-800">{(item.price * item.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })} {t('common.currency')}</span>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-danger transition-colors rtl:mr-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))
          )}
        </div>

        <footer className="p-8 bg-slate-900 text-white rounded-t-[3rem] shadow-2xl shadow-slate-900/40">
           <div className="flex items-center justify-between mb-6">
             <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t('common.total')}</span>
             <div className="text-right flex items-baseline gap-2">
               <span className="text-4xl font-display font-black tabular-nums">{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
               <span className="text-xl font-bold text-slate-400">{t('common.currency')}</span>
             </div>
           </div>
           <button 
             onClick={handleCheckout}
             disabled={cart.length === 0}
             className="w-full py-5 rounded-[1.5rem] bg-white text-slate-900 font-black tracking-widest uppercase hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-xl"
           >
             {t('pos.checkout')}
           </button>
        </footer>
      </div>

      <div className="w-[380px] flex flex-col gap-6 relative">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden">
           <div className="mb-4">
             <h3 className="font-bold text-slate-800 mb-4 px-2 tracking-tight">{t('common.search')}</h3>
             <div className="relative group">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSearch(true);
                  }}
                  onFocus={() => setShowSearch(true)}
                  placeholder={t('common.search')}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/30 focus:bg-white focus:outline-none rounded-2xl p-4 px-12 font-semibold transition-all shadow-inner"
                />
                <svg className="w-5 h-5 absolute left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
           </div>

           {showSearch && filteredProducts.length > 0 && (
             <div className="absolute top-[calc(100%+8px)] left-0 right-0 max-h-[400px] bg-white rounded-3xl border border-slate-200 shadow-2xl z-[100] overflow-y-auto">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id}
                    className="flex items-center justify-between px-6 py-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors group"
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">{product.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono italic">{product.barcode}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-primary">{product.price.toLocaleString()} {t('common.currency')}</span>
                    </div>
                  </div>
                ))}
             </div>
           )}
        </div>

        <div className="flex-1 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
           <h3 className="font-bold text-slate-800 mb-6 tracking-tight">{t('pos.weighedArticles')}</h3>
           <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-20">
             {allProducts.filter(p => p.isWeighed).slice(0, 8).map(p => (
               <div key={p.id} onClick={() => handleWeighClick(p)} className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/5 border border-transparent hover:border-secondary/20 hover:bg-white hover:shadow-lg transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-secondary">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-slate-700 truncate">{p.name}</h4>
                    <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{p.price} {t('common.currency')} / KG</span>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Caisse;
