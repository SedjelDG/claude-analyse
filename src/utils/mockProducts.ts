export interface ExpirationEntry {
  date: string;
  quantity: number;
}

export interface Product {
  id: string;
  barcodes: string[];
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  plu: string;
  scaleEnabled: boolean;
  packSize: number;
  packBuyingPrice: number;
  wholesaleEnabled: boolean;
  wholesalePrice: number;
  wholesaleMinQty: number;
  expirationDates: ExpirationEntry[];
  barcode?: string; // For legacy register compat if needed
}

export const generateMockProducts = (count: number): Product[] => {
  const categories = ['Alimentation', 'Boissons', 'Fruits', 'Hygiene', 'Entretien'];
  const units = ['pcs', 'kg'];
  
  return Array.from({ length: count }, (_, i) => {
    const isScale = Math.random() > 0.8;
    const barcodeStr = `613${Math.floor(Math.random() * 1000000000).toString().padStart(10, '0')}`;
    return {
      id: `prod-${i}`,
      name: `Produit Article #${i + 1}`,
      barcodes: [barcodeStr],
      barcode: barcodeStr,
      price: Math.floor(Math.random() * 2000) + 50,
      cost: Math.floor(Math.random() * 1000) + 20,
      category: categories[Math.floor(Math.random() * categories.length)],
      stock: Math.floor(Math.random() * 100),
      minStock: 10,
      unit: units[Math.floor(Math.random() * units.length)],
      plu: isScale ? `PLU${Math.floor(Math.random() * 999)}` : "",
      scaleEnabled: isScale,
      packSize: 1,
      packBuyingPrice: 0,
      wholesaleEnabled: false,
      wholesalePrice: 0,
      wholesaleMinQty: 0,
      expirationDates: []
    };
  });
};
