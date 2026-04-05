# MASTER Design System: Antigravity POS

## Aesthetic Direction: Retail / Modern E-commerce
- **Aesthetic Name**: Modern Shopping Core
- **DFII Score**: 14/15
- **Anchor**: Persistent Floating Dock + Action-Oriented Blue Accents

## Typography
- **Display**: **Rubik** (Bold, 32px+) — For headings and primary numbers.
- **Body**: **Nunito Sans** (Regular, 16px) — For readability and technical labels.
- **Import**:
```css
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&family=Rubik:wght@300;400;500;600;700&display=swap');
```

## Color Palette (DA/Algeria Focused)
| Token | Value | ARGB / Tailwind |
|-------|-------|-----------------|
| `primary` | `#3B82F6` | `blue-500` |
| `secondary` | `#10B981` | `emerald-500` (Success/Money) |
| `accent` | `#F59E0B` | `amber-500` (Alerts/Warnings) |
| `danger` | `#EF4444` | `red-500` |
| `surface` | `#FFFFFF` | `white` |
| `background` | `#F8FAFC` | `slate-50` |

## Interaction Rules
- **Cursor**: `cursor-pointer` on all interactive cards and buttons.
- **Hover**: 200ms `transition-colors` with subtle shadow elevation.
- **Animations**: Entrance slide-in for new sale items; staggered fade for dashboard charts.

## Implementation Standard
- **Virtualized Tables**: Required for 10k+ products.
- **Hardware Simulation**: Configurable via `src/hardware/config.js`.
- **I18n**: Namespace prefixing for AR/FR/EN translations.
