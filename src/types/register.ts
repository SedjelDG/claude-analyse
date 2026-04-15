import type { PackVariant } from "@/types/product";

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  barcode?: string;
  packVariantIndex?: number;
  packSize: number;
  originalName?: string;
  originalPrice?: number;
  isReturn?: boolean;
}

export interface RegisterProductInput {
  id?: string;
  name: string;
  price: number;
  barcode?: string;
  quantity?: number;
}

export interface RegisterTotals {
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  total: number;
}

export interface DiscountState {
  type: "percent" | "fixed";
  value: number;
}

export interface RegisterSessionState {
  registerId: string;
  activeClient: number;
  discount: number;
  discountType?: "percent" | "fixed";
  clientCarts: Record<number, CartItem[]>;
  assignedClients: Record<number, any>;
  updatedAt: string;
}

export interface ScaleBarcodeSettings {
  enabled: boolean;
  prefix: string;
}

export interface ParsedScaleBarcode {
  kind: "weighted";
  rawCode: string;
  plu: string;
  weight: number;
}

export type RegisterPackVariantMap = Record<string, PackVariant[]>;
