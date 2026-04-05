import React, { useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Product } from '../utils/mockProducts';
import { generateMockProducts } from '../utils/mockProducts';

const Products: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const allProducts = useMemo(() => {
    const products = generateMockProducts(20000);
    products[0] = { ...products[0], name: 'Couscous Fin 1kg', barcode: '613000000001', category: 'Épicerie', price: 120, stock: 45, unit: 'U', isWeighed: false };
    products[1] = { ...products[1], name: 'Lait Soummam 1L', barcode: '613000000002', category: 'Crèmerie', price: 95, stock: 120, unit: 'U', isWeighed: false };
    return products;
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return allProducts;
    const term = searchTerm.toLowerCase();
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(term) || p.barcode.includes(term) || p.category.toLowerCase().includes(term)
    );
  }, [searchTerm, allProducts]);

  const rowHeight = 64;
  const containerHeight = 600;
  const overscan = 5;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(filteredProducts.length, start + visibleCount + 2 * overscan);
  
  const visibleItems = useMemo(() => {
    return filteredProducts.slice(start, end).map((product, i) => ({
      product,
      index: start + i,
      style: {
        position: 'absolute',
        top: (start + i) * rowHeight,
        left: 0,
        right: 0,
        height: rowHeight
      } as React.CSSProperties
    }));
  }, [filteredProducts, start, end]);

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden m-6 mt-0">
      <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-display font-black text-slate-800 tracking-tight">{t('inventory.title')}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{filteredProducts.length.toLocaleString()} {t('inventory.subtitle')}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative group">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setScrollTop(0);
                if (containerRef.current) containerRef.current.scrollTop = 0;
              }}
              placeholder={t('common.search')}
              className="bg-slate-100 border-2 border-transparent focus:border-primary/30 focus:bg-white focus:outline-none rounded-2xl py-3 px-10 w-64 text-sm font-semibold transition-all shadow-inner"
            />
            <svg className="w-4 h-4 absolute left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <button className="bg-primary text-white px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">{t('inventory.newProduct')}</button>
        </div>
      </header>

      <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <div className="w-16">ID</div>
        <div className="flex-1">Désignation & Code-barres</div>
        <div className="w-32 px-4">{t('common.inventory')}</div>
        <div className="w-24 text-right px-4">{t('common.price')}</div>
        <div className="w-24 text-right px-4">{t('common.stock')}</div>
        <div className="w-16"></div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto relative"
        onScroll={handleScroll}
      >
        <div style={{ height: filteredProducts.length * rowHeight, position: 'relative' }}>
          {visibleItems.map(({ product, index, style }) => (
            <div 
              key={product.id} 
              style={style}
              className="flex items-center px-8 border-b border-slate-50 hover:bg-slate-50/80 transition-colors group"
            >
              <div className="w-16 text-[10px] font-black text-slate-300 uppercase tracking-tighter">#{index + 1}</div>
              <div className="flex-1 flex flex-col min-w-0 pr-4 rtl:pl-4 rtl:pr-0">
                <span className="text-sm font-bold text-slate-800 truncate group-hover:text-primary transition-colors">{product.name}</span>
                <span className="text-[10px] text-slate-400 font-mono italic">{product.barcode}</span>
              </div>
              <div className="w-32 px-4 whitespace-nowrap">
                <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-tight">{product.category}</span>
              </div>
              <div className="w-24 text-right px-4 font-mono font-bold text-slate-600">
                {product.price.toLocaleString()}
              </div>
              <div className="w-24 text-right px-4">
                <span className={`text-sm font-black ${product.stock < 10 ? 'text-danger' : 'text-slate-500'}`}>{product.stock} <small className="text-[9px] text-slate-400 uppercase">{product.unit}</small></span>
              </div>
              <div className="w-16 flex justify-end gap-2 pr-4 rtl:pl-4 rtl:pr-0 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                 </button>
              </div>
            </div>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-xs">Aucun résultat trouvé</div>
        )}
      </div>
    </div>
  );
};

export default Products;
