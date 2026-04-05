export interface ExpirationEntry {
  date: string;
  quantity: number;
}

export interface PackVariant {
  size: number;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  barcodes: string[];
  name: string;
  category: string;
  brand: string;
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
  vatRate: number;
  packVariants: PackVariant[];
  supplier: string;
  image: string;
  shortLabel: string;
  buttonColor: string;
  allowPriceOverride: boolean;
  isActive: boolean;
  tareWeight: number;
  labelFormat: string;
  barcode?: string; // legacy compat
}

const CATEGORIES = ['Alimentation', 'Boissons', 'Fruits', 'Légumes', 'Hygiène', 'Entretien', 'Autres'];
const UNITS = ['pcs', 'kg', 'l'];
const BRANDS = ['Candia', 'Ifri', 'Cevital', 'Danone', 'Nestlé', 'SIM', ''];

export const generateMockProducts = (count: number): Product[] => {
  return Array.from({ length: count }, (_, i) => {
    const isScale = Math.random() > 0.8;
    const barcodeStr = `613${Math.floor(Math.random() * 1_000_000_000).toString().padStart(10, '0')}`;
    const price = Math.floor(Math.random() * 2000) + 50;
    const cost = Math.floor(price * (0.4 + Math.random() * 0.4));
    return {
      id: `prod-${i}`,
      name: `Produit Article #${i + 1}`,
      barcodes: [barcodeStr],
      barcode: barcodeStr,
      brand: BRANDS[Math.floor(Math.random() * BRANDS.length)],
      price,
      cost,
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
      stock: Math.floor(Math.random() * 200),
      minStock: 10,
      unit: isScale ? 'kg' : UNITS[Math.floor(Math.random() * UNITS.length)],
      plu: isScale ? `PLU${Math.floor(Math.random() * 999)}` : '',
      scaleEnabled: isScale,
      packSize: 1,
      packBuyingPrice: 0,
      wholesaleEnabled: false,
      wholesalePrice: 0,
      wholesaleMinQty: 0,
      expirationDates: [],
      vatRate: 0,
      packVariants: [],
      supplier: '',
      image: '',
      shortLabel: '',
      buttonColor: '',
      allowPriceOverride: false,
      isActive: true,
      tareWeight: 0,
      labelFormat: 'standard',
    };
  });
};
