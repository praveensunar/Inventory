# SasthaStock — Modern Enterprise Inventory Management

> Built for the **SasthaSoft** Freelance Full Stack Developer assessment.  
> A premium, connected inventory management web application featuring real-time stock synchronization, multi-location warehouse hubs, interactive analytics, and centralized design tokens.
> 
> 🌐 **Live Demo (Vercel)**: [https://sasthastock.vercel.app/](https://sasthastock.vercel.app/)  
> 💻 **GitHub Repository**: [https://github.com/praveensunar/Inventory](https://github.com/praveensunar/Inventory)

---

## 🚀 Live Demo & Quick Start

- **Live Production URL**: [https://sasthastock.vercel.app/](https://sasthastock.vercel.app/)
- **GitHub Repository**: [https://github.com/praveensunar/Inventory](https://github.com/praveensunar/Inventory)
- **Local URL**: [http://localhost:3000](http://localhost:3000)

```bash
# Clone the repository
git clone https://github.com/praveensunar/Inventory.git
cd Inventory

# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev
```

---

## 🎨 Centralized Primary & Secondary Color Control

The application enforces **100% centralized color tokens** using CSS variables in `app/globals.css` wired into `tailwind.config.ts`. You can switch active palettes in real time from the **Theme Switcher** in the top header or via `/settings`:

| Palette Preset | Primary Token (`--primary`) | Secondary Token (`--secondary`) | Visual Persona |
| :--- | :--- | :--- | :--- |
| **Royal Sapphire** *(Default)* | `#2563EB` (Deep Royal Blue) | `#64748B` (Slate) | Big-Tech SaaS (Vercel / Linear) |
| **Emerald Operations** | `#0D9488` (Teal / Emerald) | `#71717A` (Zinc) | Supply Chain & Logistics |
| **Linear Violet** | `#7C3AED` (Electric Purple) | `#737373` (Neutral) | Modern Developer Tooling |
| **Industrial Amber** | `#D97706` (High-Vis Amber) | `#78716C` (Warm Stone) | Heavy Machinery & Warehouses |

*Also includes seamless **Dark Mode** and **Light Mode** switching with persistent local storage.*

---

## 🔄 Connected Workflow Engine

Every module is connected through a reactive state engine (`context/InventoryContext.tsx`) with localStorage persistence:

1. **Purchase Orders ➡️ Stock In**:
   - Marking a PO as **"Received & Stock In"** immediately increments product quantities, updates status badges from `OUT_OF_STOCK` / `LOW_STOCK` to `IN_STOCK`, and logs a `PURCHASE_RECEIPT` into the Stock History ledger.
2. **Sales Invoices ➡️ Stock Out**:
   - Creating a completed sales order validates stock levels, prevents negative inventory, decrements quantities, recalculates safety buffers, and records a `SALE_DEDUCTION` in the ledger.
3. **Live Dashboard Alerts**:
   - Any item falling below its minimum safety threshold immediately triggers real-time warning badges on the header, sidebar, and dashboard with 1-click restock actions.
4. **Physical Count Audit & Transfers**:
   - Manual count adjustments and inter-godown transfers are logged chronologically with before/after audit balances.

---

## 📦 Implemented Modules

1. **📊 Executive Dashboard** (`/`):
   - KPI metrics: Stock Valuation, Sales Revenue, Procurement Outlay, Low Stock alert count.
   - Recharts cashflow turnover bar chart & category distribution donut.
   - Pending inbound shipment restock buttons.
   - Real-time audit activity feed.
2. **📦 Stock Management** (`/stock`):
   - Multi-filter data table (search, category, status tabs, warehouse location).
   - Dynamic safety margin progress bars.
   - "Adjust Stock" audit modal & "Relocate Item" modal.
   - Full chronological **Stock Movement Ledger**.
   - 1-Click CSV export.
3. **🛒 Purchase Orders** (`/purchases`):
   - Procurement order list with expandable itemized breakdowns.
   - One-click **"Receive & Stock In"** connected action button.
   - "Create Purchase Order" multi-item modal.
   - CSV export.
4. **💳 Sales & Invoices** (`/sales`):
   - Customer invoicing table with payment method badges.
   - "New Sales Invoice" modal with live stock availability verification.
   - Print-ready Commercial Tax Invoice view.
   - CSV export.
5. **📈 Operational Reports** (`/reports`):
   - **Stock Report**: Asset allocation, category distribution, healthy stock ratio.
   - **Sales Report**: Revenue trends, top selling SKUs, volume breakdown.
   - **Purchase Report**: Vendor spend, order fulfillment rates.
   - CSV download for all reports.
6. **🏭 Godown / Warehouse Hubs** (`/godown`):
   - Chennai Central Hub (`GDN-CHN-01`), Bangalore Silicon Regional (`GDN-BLR-02`), Mumbai Western Transit (`GDN-MUM-03`).
   - Hub utilization progress bars, manager contacts, stored items list, and inter-godown transfer workflow.
7. **⚙️ Theme & Controls** (`/settings`):
   - Live color palette switcher, dark/light mode toggle, and sample data reset.

---

## 🌳 Git Feature Branch Architecture

Each module was developed on an isolated feature branch and merged into `main` with conventional commits:

```text
*   92536cb (HEAD -> main) Merge branch 'feature/07-reports-and-godown-view'
|\  
| * 9f0d6d9 feat(reports): implement stock, sales, purchase reports, godown hub view, and centralized theme control
|/  
*   74dcfe1 Merge branch 'feature/06-dashboard-analytics'
|\  
| * 20e31a0 feat(dashboard): implement real-time analytics KPIs, interactive charts, and low-stock workflow alerts
|/  
*   3d7805b Merge branch 'feature/05-sales-orders'
|\  
| * 9789ac2 feat(sales): implement sales invoices, customer billing, and auto stock deduction workflow
|/  
*   8701fde Merge branch 'feature/04-purchase-orders'
|\  
| * 53780d9 feat(purchase): implement purchase orders, supplier management, and stock increment workflow
|/  
*   5bc051b Merge branch 'feature/03-stock-management'
|\  
| * 6c9118a feat(stock): implement stock management, multi-filter ledger, and real-time adjustment modal
|/  
*   efb1a5e Merge branch 'feature/02-inventory-state-engine'
|\  
| * e407fdf feat(state): implement reactive inventory state engine, data flow, and app shell
|/  
*   a490ff1 Merge branch 'feature/01-foundation-and-centralized-theme'
|\  
| * 72f541a feat(theme): configure centralized primary & secondary color design tokens and UI shell
|/  
* e401e05 chore: initial project scaffold with Next.js, Tailwind and Framer Motion
```

---

## 🛠️ Tech Stack & UI Decisions

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with CSS variables
- **Design Inspiration**: shadcn/ui (Linear & Stripe aesthetic)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) (smooth tab transitions, modal spring pop-ins, staggered list reveals) & `tailwindcss-animate`
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
