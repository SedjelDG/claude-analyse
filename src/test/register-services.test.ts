import {
  addProductToCartItems,
  applyGiftToCartItem,
  calculateRegisterTotals,
  cycleCartItemPackVariant,
  removeProductFromCartItems,
  updateCartItemQuantity,
} from "@/services/register/cart";
import { parseScaleBarcode } from "@/services/register/barcode";
import type { CartItem } from "@/types/register";

describe("register cart services", () => {
  it("increments quantity when the same product is added twice", () => {
    const firstAdd = addProductToCartItems([], { id: "milk", name: "Lait 1L", price: 100 });
    const secondAdd = addProductToCartItems(firstAdd, { id: "milk", name: "Lait 1L", price: 100 });

    expect(secondAdd).toHaveLength(1);
    expect(secondAdd[0].quantity).toBe(2);
    expect(secondAdd[0].originalName).toBe("Lait 1L");
    expect(secondAdd[0].originalPrice).toBe(100);
  });

  it("computes totals and discount amounts deterministically", () => {
    const cart: CartItem[] = [
      { id: "1", name: "Lait", quantity: 2, price: 100, packSize: 1 },
      { id: "2", name: "Pain", quantity: 1, price: 50, packSize: 1 },
    ];

    expect(calculateRegisterTotals(cart, 10)).toEqual({
      subtotal: 250,
      discountRate: 10,
      discountAmount: 25,
      total: 225,
    });
  });

  it("decrements first, then removes when quantity reaches zero", () => {
    const cart: CartItem[] = [{ id: "1", name: "Pain", quantity: 2, price: 50, packSize: 1 }];
    const decremented = removeProductFromCartItems(cart, "1");
    const removed = removeProductFromCartItems(decremented, "1");

    expect(decremented[0].quantity).toBe(1);
    expect(removed).toEqual([]);
  });

  it("updates quantity and gift status through pure helpers", () => {
    const cart: CartItem[] = [{ id: "1", name: "Chocolat", quantity: 1, price: 150, packSize: 1 }];
    const updated = updateCartItemQuantity(cart, "1", 4);
    const gifted = applyGiftToCartItem(updated, "1");

    expect(updated[0].quantity).toBe(4);
    expect(gifted[0].price).toBe(0);
  });

  it("cycles pack variants while preserving total unit intent", () => {
    const cart: CartItem[] = [
      {
        id: "1",
        name: "Eau 1.5L",
        originalName: "Eau 1.5L",
        originalPrice: 25,
        quantity: 6,
        price: 25,
        packSize: 1,
        packVariantIndex: -1,
      },
    ];

    const packed = cycleCartItemPackVariant(cart, "1", {
      "Eau 1.5L": [{ size: 6, name: "Pack 6", price: 140 }],
    });

    expect(packed.changed).toBe(true);
    expect(packed.items[0].name).toContain("Pack 6");
    expect(packed.items[0].quantity).toBe(1);
    expect(packed.items[0].packSize).toBe(6);
  });
});

describe("register barcode services", () => {
  it("parses weighted scale barcodes", () => {
    expect(parseScaleBarcode("2012340150000", { enabled: true, prefix: "20" })).toEqual({
      kind: "weighted",
      rawCode: "2012340150000",
      plu: "1234",
      weight: 1.5,
    });
  });

  it("ignores non-scale barcodes", () => {
    expect(parseScaleBarcode("6191234000001", { enabled: true, prefix: "20" })).toBeNull();
  });
});
