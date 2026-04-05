export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  category: string;
  stock: number;
  unit: string;
  isWeighed: boolean;
}

export const generateMockProducts = (count: number): Product[] => {
  const categories = ['Alimentation', 'Boissons', 'Fruits', 'Hygiene', 'Entretien'];
  const units = ['pcs', 'kg'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `prod-${i}`,
    name: `Produit Article #${i + 1}`,
    barcode: `613${Math.floor(Math.random() * 1000000000).toString().padStart(10, '0')}`,
    price: Math.floor(Math.random() * 2000) + 50,
    category: categories[Math.floor(Math.random() * categories.length)],
    stock: Math.floor(Math.random() * 100),
    unit: units[Math.floor(Math.random() * units.length)],
    isWeighed: Math.random() > 0.8
  }));
};
