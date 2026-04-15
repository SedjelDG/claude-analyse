import re

with open(r"c:\Users\Administrator\Documents\Playground\codex take\src\pages\Register.tsx", "r", encoding="utf-8") as f:
    target_code = f.read()

with open(r"c:\Users\Administrator\Documents\skilled workspace\improve-it\Register_lovable_utf8.tsx", "r", encoding="utf-8") as f:
    source_code = f.read()

# Grab imports from source
if "ResizablePanelGroup" not in target_code:
    target_code = target_code.replace('import { ScrollArea } from "@/components/ui/scroll-area";',
                                      'import { ScrollArea } from "@/components/ui/scroll-area";\nimport { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";')

lucide_import_match = re.search(r'import {\s(.*?)\s} from "lucide-react";', target_code, re.DOTALL)
if lucide_import_match:
    lucide_imports = set([x.strip() for x in lucide_import_match.group(1).split(',') if x.strip()])
    source_lucide_match = re.search(r'import {\s(.*?)\s} from "lucide-react";', source_code, re.DOTALL)
    if source_lucide_match:
        source_lucides = set([x.strip() for x in source_lucide_match.group(1).split(',') if x.strip()])
        all_lucides = lucide_imports.union(source_lucides)
        new_lucide_import = 'import {\n  ' + ',\n  '.join(sorted(list(all_lucides))) + '\n} from "lucide-react";'
        target_code = target_code.replace(lucide_import_match.group(0), new_lucide_import)

target_return_idx = target_code.find('  return (\n    <div className="h-screen flex bg-register-bg overflow-hidden select-none">')
if target_return_idx != -1:
    before_return = target_code[:target_return_idx]
    
    if 'const dateStr =' not in before_return:
        before_return += '\n  const dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });\n'
        before_return += '  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });\n\n'
        
    if 'const getBadgeColor =' not in before_return:
        before_return += '  const getBadgeColor = (index: number) => {\n'
        before_return += '    const col = index % 3;\n'
        before_return += '    return col === 0 ? "bg-accent text-accent-foreground" : col === 1 ? "bg-success text-success-foreground" : "bg-info text-info-foreground";\n'
        before_return += '  };\n\n'

    source_return_idx = source_code.find('  return (\n    <div className="h-screen flex bg-register-bg overflow-hidden select-none">')
    source_return_end_idx = source_code.find('// ─── Tactile Register Layout ───', source_return_idx)
    if source_return_end_idx == -1:
        source_return_end_idx = source_code.find('const TactileRegisterLayout = ', source_return_idx)
        if source_return_end_idx == -1:
            source_return_end_idx = source_code.find('export default Register', source_return_idx)
    
    source_return = source_code[source_return_idx:source_return_end_idx].strip()
    source_return_patched = source_return.replace('{total.toFixed(2)} DA', '{subtotal.toFixed(2)} DA')
    
    sales_history_tag = """
      <SalesHistoryDialog 
        open={salesHistoryOpen} 
        onClose={() => setSalesHistoryOpen(false)} 
        sales={sales}
        refundSale={refundSale}
        refundItems={refundItems}
      />
    </div>
  );
};
"""
    source_return_patched = source_return_patched.rsplit('</div>', 1)[0].rsplit(');', 1)[0].rsplit('};', 1)[0]
    source_return_patched += sales_history_tag
    
    source_return_patched = source_return_patched.replace('discount > 0', 'discount.value > 0')
    source_return_patched = source_return_patched.replace('(${discount}%)', '(${discount.type === "percent" ? `${discount.value}%` : `${discount.value} DA`})')
    
    source_return_patched = source_return_patched.replace(
        'onClick={confirmDiscount}',
        'onClick={() => { setDiscount({ type: discountTypeLocal, value: Number(discountValue) }); setDiscountDialog(false); }}'
    )
    source_return_patched = source_return_patched.replace(
        'onKeyDown={(e) => e.key === "Enter" && confirmDiscount()}',
        'onKeyDown={(e) => e.key === "Enter" && (setDiscount({ type: discountTypeLocal, value: Number(discountValue) }), setDiscountDialog(false))}'
    )
    
    discount_dialog_custom = """
              <h3 className="text-sm font-bold text-foreground mb-3">{t("dialog.discount.title")}</h3>
              <div className="flex items-center gap-2 mb-4 bg-muted p-1 rounded">
                <button onClick={() => setDiscountTypeLocal("percent")} className={`flex-1 py-1 text-[10px] font-bold uppercase ${discountTypeLocal === 'percent' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'}`}>Pourcentage %</button>
                <button onClick={() => setDiscountTypeLocal("fixed")} className={`flex-1 py-1 text-[10px] font-bold uppercase ${discountTypeLocal === 'fixed' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'}`}>Montant FIXE</button>
              </div>
              <input type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (setDiscount({ type: discountTypeLocal, value: Number(discountValue) }), setDiscountDialog(false))} placeholder={discountTypeLocal === 'percent' ? '%...' : 'DA...'} className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground outline-none mb-3" autoFocus />
              <div className="flex gap-2">
                <button onClick={() => setDiscountDialog(false)} className="flex-1 py-2 bg-muted text-foreground text-[10px] font-bold uppercase">{t("dialog.cancel")}</button>
                <button onClick={() => { setDiscount({ type: discountTypeLocal, value: Number(discountValue) }); setDiscountDialog(false); }} className="flex-1 py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase">{t("dialog.confirm")}</button>
              </div>
"""
    discount_dialog_pattern = re.compile(r'<h3 className="text-sm font-bold text-foreground mb-3">\{t\("dialog\.discount\.title"\)\}</h3>.*?</motion\.div>', re.DOTALL)
    source_return_patched = discount_dialog_pattern.sub(discount_dialog_custom + '</motion.div>', source_return_patched)
    
    source_return_patched = source_return_patched.replace(
        'onClick={confirmQuantity}',
        'onClick={() => selectedItemId && (updateCart((prev) => updateCartItemQuantity(prev, selectedItemId, Number(quantityValue))), setQuantityDialog(false))}'
    )
    source_return_patched = source_return_patched.replace(
        'onKeyDown={(e) => e.key === "Enter" && confirmQuantity()}',
        'onKeyDown={(e) => e.key === "Enter" && selectedItemId && (updateCart((prev) => updateCartItemQuantity(prev, selectedItemId, Number(quantityValue))), setQuantityDialog(false))}'
    )
    
    if "const handleShortcutClick =" not in before_return:
        before_return += '\n  const handleShortcutClick = (productId: string) => {\n'
        before_return += '    const product = shortcutProducts[productId];\n'
        before_return += '    if (product) addProductToCart(product as any);\n'
        before_return += '  };\n\n'

    if "const visibleButtons" not in before_return:
        before_return += '\n  const hiddenActions = settings.hiddenActions || [];\n'
        before_return += '  const visibleButtons = ALL_ACTION_BUTTONS.filter((btn) => !hiddenActions.includes(btn.key));\n'

    if "const handleUnlock =" not in before_return:
        before_return += '\n  const handleUnlock = () => {\n'
        before_return += '    if (lockPassword === "1234" || lockPassword === "") {\n'
        before_return += '      setIsLocked(false);\n'
        before_return += '      setLockPassword("");\n'
        before_return += '      toast({ title: t("toast.unlocked") });\n'
        before_return += '    }\n'
        before_return += '  };\n\n'

    if "const confirmCash =" not in before_return:
        before_return += '\n  const confirmCash = () => {\n'
        before_return += '    const amount = parseFloat(cashAmount);\n'
        before_return += '    if (isNaN(amount) || amount <= 0) return;\n'
        before_return += '    addMovement({\n'
        before_return += '      type: cashDialog === "add" ? "add" : "remove",\n'
        before_return += '      amount,\n'
        before_return += '      note: cashNote || (cashDialog === "add" ? t("toast.cashAdded") : t("toast.cashRemoved")),\n'
        before_return += '      userId: activeUser.id,\n'
        before_return += '      userName: activeUser.name,\n'
        before_return += '    });\n'
        before_return += '    toast({ title: cashDialog === "add" ? t("toast.cashAdded") : t("toast.cashRemoved"), description: `${amount.toFixed(2)} DA` });\n'
        before_return += '    setCashDialog(null);\n'
        before_return += '    setCashAmount("");\n'
        before_return += '    setCashNote("");\n'
        before_return += '  };\n'

    target_code = before_return + source_return_patched + '\n\nexport default Register;\n'

with open(r"c:\Users\Administrator\Documents\Playground\codex take\src\pages\Register.tsx", "w", encoding="utf-8") as f:
    f.write(target_code)
