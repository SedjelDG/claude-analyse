import re

with open(r"c:\Users\Administrator\Documents\Playground\codex take\src\pages\Register.tsx", "r", encoding="utf-8") as f:
    target_code = f.read()

with open(r"c:\Users\Administrator\Documents\skilled workspace\src\pages\Register.tsx", "r", encoding="utf-8") as f:
    source_code = f.read()

# Grab the UI state and hooks from source (lines 780 to EOF)
# We find exactly: const LEFT_PANEL_MIN = 160;
start_idx = source_code.find('const LEFT_PANEL_MIN = 160;')
if start_idx == -1:
    print("Could not find LEFT_PANEL_MIN in source.")
    exit(1)

# Backtrack to the comment: // ── Resizable left panel
comment_idx = source_code.rfind('// ── Resizable left panel', 0, start_idx)
if comment_idx != -1:
    start_idx = comment_idx

source_render_block = source_code[start_idx:]

# We need to find the equivalent spot in target. 
# Target's return statement starts with: return (
target_return_idx = target_code.find('  return (\n')
if target_return_idx == -1:
    # Just find the first return
    target_return_idx = target_code.find('return (')

target_before_render = target_code[:target_return_idx]

# However, target might have left-over layout variables from the previous script.
# We should remove dateStr, timeStr, getBadgeColor, etc if they exist in target, because we're replacing them.
# Let's cleanly preserve target's logic up to `const panelWidth = 340;` roughly?
# In our target, we have: const { subtotal, discountAmount, total: totalTTC } = calculateRegisterTotals(cart, discount);
calc_totals_idx = target_code.find('const { subtotal, discountAmount, total: totalTTC } = calculateRegisterTotals(cart, discount);')
if calc_totals_idx != -1:
    # Everything up to and including calculating register totals is logic we want.
    end_of_calc = target_code.find('\n', calc_totals_idx) + 1
    target_before_render = target_code[:end_of_calc]
else:
    print("Could not find calculateRegisterTotals in target.")

# Now we need to append the UI state and return block from source.
# But source uses `total`, we have `subtotal`. Source uses `totalTTC`, we have `totalTTC`.
# Let's patch `source_render_block`:
source_render_block = source_render_block.replace('total.toFixed(2)', 'subtotal.toFixed(2)')
# Wait, skilled workspace uses `total * 0` for TVA: `{(total * 0).toFixed(2)}`
source_render_block = source_render_block.replace('{total ', '{subtotal ')
source_render_block = source_render_block.replace('(total *', '(subtotal *')

# For the imports, let's just make sure all imports from source are there.
# We will just merge them.
lucide_import_match = re.search(r'import {\s(.*?)\s} from "lucide-react";', target_before_render, re.DOTALL)
if lucide_import_match:
    lucide_imports = set([x.strip() for x in lucide_import_match.group(1).split(',') if x.strip()])
    source_lucide_match = re.search(r'import {\s(.*?)\s} from "lucide-react";', source_code, re.DOTALL)
    if source_lucide_match:
        source_lucides = set([x.strip() for x in source_lucide_match.group(1).split(',') if x.strip()])
        all_lucides = lucide_imports.union(source_lucides)
        new_lucide_import = 'import {\n  ' + ',\n  '.join(sorted(list(all_lucides))) + '\n} from "lucide-react";'
        target_before_render = target_before_render.replace(lucide_import_match.group(0), new_lucide_import)

# Also copy ACTION_THEMES, ALL_ACTION_BUTTONS, getBadgeColor from source if they don't exist
constants_to_inject = ""
if "ACTION_THEMES" not in target_before_render:
    action_themes_match = re.search(r'const ACTION_THEMES: Record.*?};', source_code, re.DOTALL)
    if action_themes_match:
        constants_to_inject += action_themes_match.group(0) + '\n\n'
        constants_to_inject += 'const FALLBACK_THEME = { text: "text-primary", bg: "bg-primary", border: "border-primary/40" };\n'
        constants_to_inject += 'const getActionTheme = (actionKey: string) => ACTION_THEMES[actionKey] ?? FALLBACK_THEME;\n\n'

if "getBadgeColor" not in target_before_render:
    badge_color_match = re.search(r'const getBadgeColor =.*?};\n', source_code, re.DOTALL)
    if badge_color_match:
        constants_to_inject += badge_color_match.group(0) + '\n'

# We should inject constants_to_inject right after the imports.
import_end_idx = target_before_render.find('const REGISTER_ID')
if import_end_idx != -1:
    target_before_render = target_before_render[:import_end_idx] + constants_to_inject + target_before_render[import_end_idx:]

# The source_render_block uses `dateStr` and `timeStr`, we need to define them if missing:
if 'const dateStr =' not in target_before_render:
    time_defs = '  const dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });\n  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });\n\n'
    source_render_block = time_defs + source_render_block

# In skilled workspace, `shortcutProducts` uses `{ p14: { name: "...", price: 60 }, ... }`
# In codex take, we might have different ones, but it's handled. `handleShortcutClick` is needed.
if 'const handleShortcutClick' not in target_before_render:
    shortcut_def = '  const handleShortcutClick = (productId: string) => { const p = shortcutProducts[productId]; if (p) addProductToCart(p as any); };\n\n'
    source_render_block = shortcut_def + source_render_block

# `visibleButtons`: 
if 'const visibleButtons =' not in target_before_render:
    vis_def = '  const hiddenActions = settings.hiddenActions || [];\n  const visibleButtons = ALL_ACTION_BUTTONS.filter(btn => !hiddenActions.includes(btn.key));\n\n'
    source_render_block = vis_def + source_render_block

# We want to replace SalesHistoryDialog from skilled workspace with our decoupled one? 
# No, let's keep skilled space's if possible. But skilled space doesn't have the `sales={sales}` props because of decoupled hooks.
# So we need to patch SalesHistoryDialog.
sales_history_pattern = re.compile(r'<SalesHistoryDialog.*?/>', re.DOTALL)
our_sales_history = """<SalesHistoryDialog 
        open={salesHistoryOpen} 
        onClose={() => setSalesHistoryOpen(false)} 
        sales={sales}
        refundSale={refundSale}
        refundItems={refundItems}
      />"""
source_render_block = sales_history_pattern.sub(our_sales_history, source_render_block)

# One more thing: skilled workspace's discount logic. 
# `{discount ? (discount.type === "percent" ? \`${discount.value}%\` : \`${discount.value.toFixed(2)} DA\`) : "0.00"}`
# Inside target, discount might be `{ type: "percent", value: 0}` consistently instead of `null`.
# So `{discount.value > 0 ? (discount.type === "percent" ? \`${discount.value}%\` : \`${discount.value.toFixed(2)} DA\`) : "0.00"}`
source_render_block = source_render_block.replace('discount ?', 'discount.value > 0 ?')

new_file_content = target_before_render + "\n  " + source_render_block

with open(r"c:\Users\Administrator\Documents\Playground\codex take\src\pages\Register.tsx", "w", encoding="utf-8") as f:
    f.write(new_file_content)

print("Merge completed successfully.")
