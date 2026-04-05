# POS Software Prompt

## Objective

Create a complete retail point-of-sale and shop management application for a real physical store.

This software is not just a cashier screen. It is the main operating system for the shop's daily sales flow, product management, stock control, purchasing workflow, weighed-item workflow, reporting, and store settings.

## Critical Product Constraints

These are non-negotiable:

- This is **not** a web app
- This is **not** a browser-based tool
- This must be a **native desktop application**
- It must be installed on the PC and run in its own dedicated application window
- It should feel like real store software, not like a website opened in a browser tab
- It must be able to handle at least **10,000 to 20,000 unique products**
- Product search, barcode lookup, filtering, sorting, and product-table workflows must remain practical at that catalog size
- Each product can have its own attributes such as barcode data, prices, stock values, category, unit type, PLU data, batch expiration data, wholesale rules, and related selling settings
- The software is for a physical retail store environment, especially one that may sell both normal products and weighed products

## Business Scope

The software should serve as an all-in-one store operations system for:

- Checkout at the register
- Product and pricing management
- Stock and low-stock monitoring
- Purchasing and receiving
- Supplier management
- Weighed-item and PLU workflows
- Daily dashboard visibility
- Basic operational settings and hardware setup

## Currency and Pricing

- Currency is **Algerian Dinar (DA)**
- Normal unit selling price
- Pack buying price
- Automatic unit-cost calculation from pack data
- Wholesale pricing support
- Wholesale enable/disable per product
- Minimum quantity for wholesale price
- Wholesale price value per product
- Profit margin calculation
- Display labels for **Total HT** and **Total TVA**
- Tax is displayed in the UI, but there is not yet a truly configurable tax-rate system

## Payment Methods

Supported payment methods:

- Cash (Especes)
- Card (Carte)

Not required yet:

- Cheque payments
- Mobile payments
- Credit tracking
- Debt tracking

## Register / Caisse Functions

The register side must support fast real-time cashier work.

Required functions:

- Add items to cart
- Remove items from cart
- Clear sale
- Adjust item quantity
- Apply a global percentage discount
- Mark an item as a gift by setting its price to zero
- Process returns
- Hold or pause a transaction
- Open the cash drawer
- Record deposits
- Access treasury-related actions
- Switch between client contexts such as Client Ndeg1, Client Ndeg2, and similar tabs
- Lock and unlock the screen with password protection
- Use product shortcut buttons for quick-add behavior
- Search by product name
- Search by barcode
- Scan products directly
- Use keyboard shortcuts with function keys and Ctrl combinations
- Sell by Pack: Cycle thru product pack variants (e.g. Unit -> Pack 6 -> Carton 12) using F8 or the Pack button
- Show live clock and date

## Product Management

The software must include a complete product-management area.

Required product functions:

- Full CRUD for products
- Multiple barcodes per product
- Product categories such as Alimentation, Boissons, Fruits, Hygiene, and similar retail categories
- Units such as pcs and kg
- PLU code for scale products
- Scale-enabled toggle per product
- Pack size support
- Pack buying price support
- Automatic unit-cost calculation from pack data
- Wholesale pricing controls
- Minimum stock threshold per product
- Sortable product table
- Searchable product table

## Batch and Expiration Management

Required expiration-related functions:

- Batch expiration date tracking
- Expiration warnings for products or batches expiring within 30 days or less
- Dashboard visibility for upcoming expirations

## Stock Management

The stock side must help the store control inventory clearly.

Required functions:

- Current stock level per product
- Low-stock alerts when stock is less than or equal to the minimum threshold
- Stock movement history
- Inbound stock records
- Outbound stock records
- Manual stock adjustment with reasons
- Stock-related alerts visible on the dashboard

## Purchases

The purchasing workflow must support real replenishment operations.

Required functions:

- Purchase orders
- Supplier selection within purchase flow
- Product selection within purchase flow
- Quantity and unit-cost entry
- Purchase status tracking with at least: pending, received, partial
- Product creation directly from purchase workflow through a "Product + Purchase" type action
- Purchase history table

## Supplier Management

Required supplier functions:

- Supplier list
- Supplier details
- Supplier creation and editing
- Supplier use within purchase orders

## Scale / PLU Integration

Weighed-product support is an important part of this software.

Required functions:

- PLU code management
- Separate price for weight-based selling
- Tare weight per product
- Label format selection such as Standard and Avec date
- Sync status tracking such as synced and unsynced
- Active/inactive toggle for scale-linked products
- Bulk sync all
- Export PLU list

## Dashboard

The dashboard must provide a useful store snapshot for the manager.

Required functions:

- Daily sales total with trend
- Transaction count
- Active product count
- Low-stock count
- Weekly sales area chart
- Sales by category pie chart
- Top 5 best-selling products
- Low-stock alerts list
- Upcoming expirations list

## Settings

The software must provide operational settings for the store.

Required settings:

- Language selection: French, Arabic, English
- Register-level multilingual support
- French and English already exist in the current idea/reference
- Arabic is declared but not yet fully implemented
- Theme selection: Light / Dark
- Layout selection: Desktop / Tactile
- Hardware connection settings for:
- Thermal or dot printer
- Barcode scanner via USB, serial, or bluetooth
- Electronic scale via serial or TCP
- Brand and port configuration where relevant
- Test-connection style behavior for configured hardware

## UX and Interaction Direction

The software should feel polished and intentional.

Required experience direction:

- Floating dock style navigation
- Rich interface animations
- Responsive layout behavior
- Suitable for mouse-driven desktop usage
- Suitable for touchscreen usage
- Dense but usable product and management views

## Current-State Notes That Must Be Included In Planning

These limitations must be explicitly kept in mind when generating plans, architecture, or implementation steps:

- Some versions still rely on mock data or local-only state rather than a fully finalized persistent business data flow
- A complete authentication and login system is not yet fully established across all versions
- Receipt or invoice printing may still be simulated in prototype flows
- Real hardware communication may still be simulated in some parts of the project

## Important Scope Notes

- This prompt describes the product scope and operational requirements
- It should be treated as a build brief for a native desktop POS application
- It should not be reduced to only a checkout screen
- It should not be reframed as a browser-first SaaS dashboard
- Large catalog support is part of the core requirement, not a future nice-to-have
- Weighed-product support is a real product feature, not a decorative extra

## Agent Execution Instructions

When using this prompt to create or guide an agent, the agent should:

- Use any available assets necessary to complete the work
- Use any available skills necessary to complete the work
- Use any available mockups, design references, product notes, and supporting documentation when relevant
- Reuse existing assets and reference material instead of ignoring them
- Treat local project files, design systems, and documented product context as important inputs
- Fill in missing implementation details in a way that stays faithful to this product brief
- Preserve the native desktop direction and retail-store workflow described in this prompt
- Avoid drifting into a generic web-dashboard interpretation of the product

## In Short

Build a native desktop retail POS and shop-management application for a real store in Algeria. It must handle cashier checkout, product administration, stock control, purchasing, suppliers, PLU and weighed-item workflows, dashboard reporting, and store settings, while remaining practical for a large catalog of 10,000 to 20,000 products and while acknowledging that some current reference flows are still mock-based or simulated.
