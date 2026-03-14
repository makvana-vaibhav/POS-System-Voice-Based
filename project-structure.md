# POS System — Full Project Structure & Schema

---

## Folder Tree

```
POS-System-Voice-Based/
│
├── backend/                        ← Node.js + Express API
│   ├── .env                        ← Your secret environment variables (never commit)
│   ├── .env.example                ← Template showing which variables are needed
│   ├── .gitignore
│   ├── package.json
│   └── src/
│       ├── index.js                ← Entry point: starts Express server
│       │
│       ├── config/
│       │   └── db.js               ← Creates & exports PostgreSQL connection pool
│       │
│       ├── db/
│       │   ├── schema.sql          ← All CREATE TABLE statements (run once to set up DB)
│       │   └── migrate.js          ← Node script that executes schema.sql against the DB
│       │
│       ├── controllers/            ← Business logic (what to do when a route is hit)
│       │   ├── tableController.js
│       │   ├── menuController.js
│       │   ├── orderController.js
│       │   ├── paymentController.js
│       │   ├── dashboardController.js
│       │   └── voiceController.js
│       │
│       ├── routes/                 ← URL path definitions (which controller to call)
│       │   ├── tableRoutes.js
│       │   ├── menuRoutes.js
│       │   ├── orderRoutes.js
│       │   ├── paymentRoutes.js
│       │   ├── dashboardRoutes.js
│       │   └── voiceRoutes.js
│       │
│       └── middleware/
│           └── errorMiddleware.js  ← Global 404 and error handlers
│
├── frontend/                       ← React + Vite + Tailwind CSS
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx                ← ReactDOM render root
│       ├── App.jsx                 ← Root component, router setup
│       │
│       ├── pages/                  ← One file per full screen/page
│       │   ├── TablesPage.jsx      ← Table selection screen
│       │   ├── OrderPage.jsx       ← Active order management
│       │   ├── KitchenPage.jsx     ← Kitchen Display System (KDS)
│       │   ├── BillingPage.jsx     ← Bill generation and payment
│       │   ├── MenuPage.jsx        ← Menu item management (admin)
│       │   └── DashboardPage.jsx   ← Sales analytics for owner
│       │
│       ├── components/             ← Reusable UI pieces
│       │   ├── layout/
│       │   │   ├── Navbar.jsx      ← Top navigation bar
│       │   │   └── Sidebar.jsx     ← Side navigation (optional)
│       │   ├── ui/
│       │   │   ├── Button.jsx
│       │   │   ├── Modal.jsx
│       │   │   ├── Badge.jsx       ← Status indicators (Pending, Ready, etc.)
│       │   │   └── Spinner.jsx
│       │   ├── order/
│       │   │   ├── OrderCard.jsx   ← Displays one order summary
│       │   │   ├── OrderItem.jsx   ← Single item row inside an order
│       │   │   └── OrderList.jsx   ← List of all orders
│       │   ├── menu/
│       │   │   ├── MenuGrid.jsx    ← Grid of menu items to tap/click
│       │   │   └── MenuItemCard.jsx
│       │   ├── kitchen/
│       │   │   └── KDSCard.jsx     ← Kitchen order ticket card
│       │   ├── billing/
│       │   │   └── BillSummary.jsx ← Shows subtotal, tax, total
│       │   ├── dashboard/
│       │   │   ├── StatCard.jsx    ← Single metric card (orders, revenue)
│       │   │   └── SalesChart.jsx  ← Bar/line chart for sales
│       │   └── voice/
│       │       └── VoiceButton.jsx ← Mic button that triggers voice ordering
│       │
│       ├── context/
│       │   └── OrderContext.jsx    ← Global state for current active order
│       │
│       ├── hooks/
│       │   ├── useOrders.js        ← Custom hook to fetch/manage orders
│       │   ├── useTables.js        ← Custom hook for table data
│       │   └── useVoice.js         ← Custom hook for mic recording + API call
│       │
│       ├── services/
│       │   └── api.js              ← Axios instance + all API call functions
│       │
│       └── utils/
│           └── formatCurrency.js   ← e.g. formatCurrency(147) → "₹147.00"
│
├── overview.md                     ← Original project brief
├── project-structure.md            ← This file
└── connectDB.md                    ← PostgreSQL setup guide
```

---

## Database Schema

The database is named `pos_db` and has **5 tables**. Here is how they all relate to each other:

```
restaurant_tables
      │
      │  (a table has many orders)
      ▼
   orders  ──────────────────────────────────┐
      │                                       │
      │  (an order has many order_items)      │  (an order has one payment)
      ▼                                       ▼
  order_items                             payments
      │
      │  (each order_item references one menu_item)
      ▼
  menu_items  ←──  categories
                   (a category has many menu_items)
```

---

### Table: `restaurant_tables`

Stores the physical tables in the restaurant.

| Column        | Type        | Description                              |
|---------------|-------------|------------------------------------------|
| id            | SERIAL PK   | Auto-increment ID                        |
| table_number  | INT UNIQUE  | Human-facing table number (1, 2, 3…)    |
| capacity      | INT         | How many people the table seats          |
| status        | VARCHAR(20) | `available` / `occupied` / `reserved`   |
| created_at    | TIMESTAMP   | When the record was created              |

---

### Table: `categories`

Organizes menu items into groups.

| Column     | Type        | Description             |
|------------|-------------|-------------------------|
| id         | SERIAL PK   | Auto-increment ID       |
| name       | VARCHAR(100)| e.g. Starters, Desserts |
| created_at | TIMESTAMP   |                         |

---

### Table: `menu_items`

Every dish or drink the restaurant sells.

| Column       | Type          | Description                                  |
|--------------|---------------|----------------------------------------------|
| id           | SERIAL PK     |                                              |
| category_id  | INT FK        | Links to `categories.id`                    |
| name         | VARCHAR(150)  | e.g. "Chocolate Ice Cream"                  |
| description  | TEXT          | Optional description                         |
| price        | NUMERIC(10,2) | Price in ₹                                   |
| is_available | BOOLEAN       | Hide item from menu without deleting it      |
| image_url    | TEXT          | Optional image path                          |
| created_at   | TIMESTAMP     |                                              |
| updated_at   | TIMESTAMP     | Updated when price or availability changes   |

---

### Table: `orders`

One order per table visit (or takeaway).

| Column     | Type        | Description                                                    |
|------------|-------------|----------------------------------------------------------------|
| id         | SERIAL PK   |                                                                |
| table_id   | INT FK      | Links to `restaurant_tables.id` (null for takeaway)           |
| status     | VARCHAR(20) | `pending` → `preparing` → `ready` → `served` / `cancelled`  |
| order_type | VARCHAR(20) | `dine-in` or `takeaway`                                       |
| note       | TEXT        | Optional waiter note for the whole order                       |
| created_at | TIMESTAMP   |                                                                |
| updated_at | TIMESTAMP   | Updated when status changes                                    |

**Order Status Flow:**
```
pending  →  preparing  →  ready  →  served
   └──────────────────────────────→  cancelled
```

---

### Table: `order_items`

Each individual dish inside an order.

| Column       | Type          | Description                                     |
|--------------|---------------|-------------------------------------------------|
| id           | SERIAL PK     |                                                 |
| order_id     | INT FK        | Links to `orders.id` — deletes with the order   |
| menu_item_id | INT FK        | Links to `menu_items.id`                        |
| quantity     | INT           | How many of this item                           |
| unit_price   | NUMERIC(10,2) | Price at time of order (snapshot, not live)     |
| note         | TEXT          | e.g. "no onions"                                |
| created_at   | TIMESTAMP     |                                                 |

> **Why snapshot the price?** If the menu price changes later, old bills should still show the original price.

---

### Table: `payments`

One bill per order.

| Column         | Type          | Description                                      |
|----------------|---------------|--------------------------------------------------|
| id             | SERIAL PK     |                                                  |
| order_id       | INT FK UNIQUE | One bill per order                               |
| subtotal       | NUMERIC(10,2) | Sum of all order_items                           |
| tax_rate       | NUMERIC(5,2)  | e.g. `5.00` for 5% GST                          |
| tax_amount     | NUMERIC(10,2) | `subtotal × tax_rate / 100`                     |
| total_amount   | NUMERIC(10,2) | `subtotal + tax_amount`                          |
| payment_method | VARCHAR(30)   | `cash` / `card` / `upi` / `other`               |
| payment_status | VARCHAR(20)   | `pending` → `paid` / `refunded`                 |
| paid_at        | TIMESTAMP     | Set when payment_status becomes `paid`           |
| created_at     | TIMESTAMP     |                                                  |

---

## API Routes Reference

### Tables — `/api/tables`
| Method | Path               | What it does                    |
|--------|--------------------|---------------------------------|
| GET    | `/`                | Get all tables with status      |
| GET    | `/:id`             | Get one table                   |
| PATCH  | `/:id/status`      | Update table status             |

### Menu — `/api/menu`
| Method | Path               | What it does                    |
|--------|--------------------|---------------------------------|
| GET    | `/categories`      | List all categories             |
| GET    | `/items`           | List all available menu items   |
| GET    | `/items/:id`       | Get one menu item               |
| POST   | `/items`           | Create a new menu item          |
| PUT    | `/items/:id`       | Update a menu item              |
| DELETE | `/items/:id`       | Delete a menu item              |

### Orders — `/api/orders`
| Method | Path                    | What it does                       |
|--------|-------------------------|------------------------------------|
| GET    | `/`                     | Get all orders (filter by status)  |
| GET    | `/:id`                  | Get one order with its items       |
| POST   | `/`                     | Create a new order                 |
| POST   | `/:id/items`            | Add item to an existing order      |
| DELETE | `/:id/items/:itemId`    | Remove item from order             |
| PATCH  | `/:id/status`           | Update order status                |
| DELETE | `/:id`                  | Cancel order                       |

### Payments — `/api/payments`
| Method | Path                        | What it does              |
|--------|-----------------------------|---------------------------|
| GET    | `/order/:orderId`           | Get bill for an order     |
| POST   | `/order/:orderId/bill`      | Generate bill             |
| POST   | `/order/:orderId/pay`       | Mark order as paid        |

### Dashboard — `/api/dashboard`
| Method | Path           | What it does                             |
|--------|----------------|------------------------------------------|
| GET    | `/summary`     | Today's orders, revenue, available tables|
| GET    | `/sales`       | Sales by date range                      |
| GET    | `/top-items`   | Most ordered items                       |

### Voice — `/api/voice`
| Method | Path        | What it does                              |
|--------|-------------|-------------------------------------------|
| POST   | `/process`  | Parse transcript text into order items    |

---

## How Data Flows (Full Example)

```
1. Waiter opens app → sees table grid (GET /api/tables)

2. Waiter taps Table 4 → sees menu (GET /api/menu/items)

3. Waiter adds items (POST /api/orders)
   → order created in DB
   → table status set to "occupied"

4. Order appears on Kitchen screen (GET /api/orders?status=pending)

5. Chef taps "Preparing" → (PATCH /api/orders/:id/status { status: "preparing" })

6. Chef taps "Ready"    → (PATCH /api/orders/:id/status { status: "ready" })

7. Waiter serves food  → (PATCH /api/orders/:id/status { status: "served" })
   → table status set back to "available"

8. Cashier generates bill (POST /api/payments/order/:id/bill)
   → subtotal, tax, total calculated and saved

9. Customer pays → (POST /api/payments/order/:id/pay { payment_method: "cash" })
   → payment_status = "paid", paid_at = NOW()

10. Dashboard updates automatically (GET /api/dashboard/summary)
```

---

## What to Build in Order (Recommended)

| Step | What                         | Why                                  |
|------|------------------------------|--------------------------------------|
| 1    | Connect DB, run migration    | Everything depends on the DB         |
| 2    | Menu management (CRUD)       | Orders depend on menu items existing |
| 3    | Table listing                | Orders need a table                  |
| 4    | Create & view orders         | Core POS feature                     |
| 5    | Kitchen Display (KDS)        | Real-time order status               |
| 6    | Billing & payments           | Complete the order lifecycle         |
| 7    | Dashboard                    | Needs payment data to be meaningful  |
| 8    | Voice ordering               | AI feature built on top of everything|
