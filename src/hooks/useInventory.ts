import { useState, useEffect, useCallback } from "react";
import { getTauriInvoke } from "@/lib/desktop-runtime";
import { Product } from "@/types/product";
import { useToast } from "@/hooks/use-toast";

export const useInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTauriInvoke()<Product[]>("get_products");
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products", err);
      setError(String(err));
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les produits de la base de données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const saveProduct = async (product: Partial<Product>) => {
    try {
      const saved = await getTauriInvoke()<Product>("upsert_product", { product });
      setProducts((prev) => {
        const idx = prev.findIndex((p) => p.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      return saved;
    } catch (err) {
      console.error("Failed to save product", err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le produit.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const removeProduct = async (id: string) => {
    try {
      await getTauriInvoke()("delete_product", { id });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete product", err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const bulkImport = async (productsToImport: Partial<Product>[]) => {
    try {
      const count = await getTauriInvoke()<number>("bulk_import_products", { products: productsToImport });
      await loadProducts();
      return count;
    } catch (err) {
      console.error("Failed to import products", err);
      toast({
        title: "Erreur d'import",
        description: "Certains produits n'ont pas pu être importés.",
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    saveProduct,
    removeProduct,
    bulkImport,
    reload: loadProducts,
  };
};
