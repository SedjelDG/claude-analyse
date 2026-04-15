import type {
  CartItem,
  RegisterPackVariantMap,
  RegisterProductInput,
  RegisterTotals,
  DiscountState,
} from "@/types/register";

export function calculateRegisterTotals(cart: CartItem[], discount: DiscountState): RegisterTotals {
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  let discountRate = 0;
  let discountAmount = 0;

  if (discount.type === "percent") {
    discountRate = discount.value;
    discountAmount = subtotal * (discountRate / 100);
  } else {
    discountAmount = Math.min(discount.value, subtotal);
    discountRate = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
  }

  return {
    subtotal,
    discountRate,
    discountAmount,
    total: subtotal - discountAmount,
  };
}

export function addProductToCartItems(
  items: CartItem[],
  product: RegisterProductInput,
  createId: () => string = () => String(Date.now()),
): CartItem[] {
  const existing = items.find((item) => item.id === product.id && item.id !== "custom_misc");
  if (existing) {
    return items.map((item) =>
      item.id === product.id
        ? { ...item, quantity: item.quantity + (product.quantity || 1) }
        : item,
    );
  }

  return [
    ...items,
    {
      id: product.id || createId(),
      name: product.name,
      price: product.price,
      quantity: product.quantity || 1,
      originalPrice: product.price,
      originalName: product.name,
      packVariantIndex: -1,
      packSize: 1,
      barcode: product.barcode,
    },
  ];
}

export function removeProductFromCartItems(items: CartItem[], productId: string): CartItem[] {
  const existing = items.find((item) => item.id === productId);
  if (existing && existing.quantity > 1) {
    return items.map((item) =>
      item.id === productId ? { ...item, quantity: item.quantity - 1 } : item,
    );
  }

  return items.filter((item) => item.id !== productId);
}

export function removeCartItemById(items: CartItem[], productId: string): CartItem[] {
  return items.filter((item) => item.id !== productId);
}

export function updateCartItemQuantity(
  items: CartItem[],
  productId: string,
  quantity: number,
): CartItem[] {
  if (quantity <= 0) {
    return removeCartItemById(items, productId);
  }

  return items.map((item) => (item.id === productId ? { ...item, quantity } : item));
}

export function applyGiftToCartItem(items: CartItem[], productId: string): CartItem[] {
  return items.map((item) => (item.id === productId ? { ...item, price: 0 } : item));
}

export function cycleCartItemPackVariant(
  items: CartItem[],
  productId: string,
  variantsByProduct: RegisterPackVariantMap,
): { items: CartItem[]; description?: string; changed: boolean } {
  const item = items.find((entry) => entry.id === productId);
  if (!item) {
    return { items, changed: false };
  }

  const baseName = item.originalName || item.name;
  const variants = variantsByProduct[baseName];
  if (!variants?.length) {
    return { items, changed: false, description: baseName };
  }

  const currentIdx = item.packVariantIndex ?? -1;
  const nextIdx = currentIdx + 1 >= variants.length ? -1 : currentIdx + 1;
  const currentTotalUnits = item.quantity * (item.packSize || 1);

  if (nextIdx === -1) {
    const nextItems = items.map((entry) =>
      entry.id === productId
        ? {
            ...entry,
            name: baseName,
            quantity: 1,
            price: item.originalPrice || item.price,
            packVariantIndex: -1,
            packSize: 1,
            originalName: baseName,
          }
        : entry,
    );

    return {
      items: nextItems,
      changed: true,
      description: `${baseName}`,
    };
  }

  const variant = variants[nextIdx];
  const originalPrice = item.originalPrice || item.price;
  const quantity = Math.max(1, Math.floor(currentTotalUnits / variant.size));
  const nextItems = items.map((entry) =>
    entry.id === productId
      ? {
          ...entry,
          name: `${baseName} (${variant.name})`,
          quantity: 1,
          price: variant.price,
          packVariantIndex: nextIdx,
          packSize: variant.size,
          originalName: baseName,
          originalPrice,
        }
      : entry,
  );

  return {
    items: nextItems,
    changed: true,
    description: `${variant.name} (Qte: 1)`,
  };
}
