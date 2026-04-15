export interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  barcode?: string;
}

export interface Sale {
  id: string;
  timestamp: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  discountType?: "percent" | "fixed";
  total: number;
  paymentMethod: "cash" | "card" | "credit";
  clientNumber: number;
  clientName?: string;
  cashierName: string;
  cashierId: string;
  refundedItems?: string[];
  fullyRefunded?: boolean;
}

export interface SaleDraft extends Omit<Sale, "id" | "timestamp"> { }
