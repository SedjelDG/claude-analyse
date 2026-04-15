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
  barcode?: string;
}
