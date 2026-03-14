-- ============================================================
-- POS System Database Schema
-- Run with: psql -U postgres -d pos_db -f schema.sql
-- ============================================================

-- Create database (run separately if needed)
-- CREATE DATABASE pos_db;

-- ============================================================
-- RESTAURANT TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id          SERIAL PRIMARY KEY,
  table_number INT NOT NULL UNIQUE,
  capacity    INT NOT NULL DEFAULT 4,
  status      VARCHAR(20) NOT NULL DEFAULT 'available'
                CHECK (status IN ('available', 'occupied', 'reserved')),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- MENU CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- MENU ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id          SERIAL PRIMARY KEY,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  is_available BOOLEAN DEFAULT TRUE,
  image_url   TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id          SERIAL PRIMARY KEY,
  table_id    INT REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
  order_type  VARCHAR(20) NOT NULL DEFAULT 'dine-in'
                CHECK (order_type IN ('dine-in', 'takeaway')),
  note        TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity    INT NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(10, 2) NOT NULL,
  note        TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS / BILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id             SERIAL PRIMARY KEY,
  order_id       INT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  subtotal       NUMERIC(10, 2) NOT NULL,
  tax_rate       NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
  tax_amount     NUMERIC(10, 2) NOT NULL,
  total_amount   NUMERIC(10, 2) NOT NULL,
  payment_method VARCHAR(30) DEFAULT 'cash'
                   CHECK (payment_method IN ('cash', 'card', 'upi', 'other')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  paid_at        TIMESTAMP,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);

-- ============================================================
-- SEED: Default restaurant tables (10 tables)
-- ============================================================
INSERT INTO restaurant_tables (table_number, capacity) VALUES
  (1, 2), (2, 2), (3, 4), (4, 4), (5, 4),
  (6, 6), (7, 6), (8, 8), (9, 8), (10, 10)
ON CONFLICT (table_number) DO NOTHING;

-- ============================================================
-- SEED: Default menu categories
-- ============================================================
INSERT INTO categories (name) VALUES
  ('Starters'), ('Main Course'), ('Beverages'), ('Desserts'), ('Sides')
ON CONFLICT (name) DO NOTHING;
