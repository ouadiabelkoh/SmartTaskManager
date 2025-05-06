import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  pin_code: text("pin_code"),
  phone_number: text("phone_number"),
  barcode: text("barcode"),
  role: text("role", { enum: ["admin", "manager", "cashier", "staff"] }).default("cashier").notNull(),
  permissions: text("permissions").array().default([]).notNull(),
  active: boolean("active").default(true).notNull(),
  failed_login_attempts: integer("failed_login_attempts").default(0),
  last_login_at: timestamp("last_login_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  // We don't validate PIN because it could be either plain digits (from user input) or
  // hashed value (from database). Auth.ts handles the actual PIN validation.
  pin_code: (schema) => schema.optional(),
  // Simplified phone validation as we store various formats for testing
  phone_number: (schema) => schema.optional(),
  barcode: (schema) => schema.optional()
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertCategorySchema = createInsertSchema(categories, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category_id: integer("category_id").references(() => categories.id).notNull(),
  stock: integer("stock").default(0).notNull(),
  low_stock_threshold: integer("low_stock_threshold").default(10).notNull(),
  barcode: text("barcode"),
  sku: text("sku"),
  image: text("image"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  low_stock_threshold: (schema) => schema.nonnegative("Threshold cannot be negative"),
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// People (Customers and Suppliers)
export const people = pgTable("people", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["customer", "supplier", "both"] }).notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  id_number: text("id_number"),  // For ID card or barcode
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPersonSchema = createInsertSchema(people, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  type: (schema) => schema.refine(val => ["customer", "supplier", "both"].includes(val), {
    message: "Type must be customer, supplier, or both"
  }),
  email: (schema) => schema.email("Please provide a valid email").optional().or(z.literal("")),
});

export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof people.$inferSelect;

// Maintain backward compatibility with existing 'customers' references
export const customers = people;
export const insertCustomerSchema = insertPersonSchema;
export type InsertCustomer = InsertPerson;
export type Customer = Person;

// Inventory Transactions
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  type: text("type", { enum: ["add", "remove"] }).notNull(),
  reference_id: integer("reference_id"),
  reference_type: text("reference_type"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertInventorySchema = createInsertSchema(inventory);

export type InsertInventoryTransaction = z.infer<typeof insertInventorySchema>;
export type InventoryTransaction = typeof inventory.$inferSelect;

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  order_number: varchar("order_number", { length: 50 }).notNull(),
  customer_id: integer("customer_id").references(() => customers.id),
  customer_name: text("customer_name"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "processing", "completed", "cancelled"] }).default("pending").notNull(),
  payment_method: text("payment_method").notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const ordersInsertSchema = createInsertSchema(orders);

export type InsertOrder = z.infer<typeof ordersInsertSchema>;
export type Order = typeof orders.$inferSelect;

// Order Items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").references(() => orders.id).notNull(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  product_name: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
});

export const orderItemsInsertSchema = createInsertSchema(orderItems);

export type InsertOrderItem = z.infer<typeof orderItemsInsertSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Define Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.category_id], references: [categories.id] }),
  orderItems: many(orderItems),
  inventoryTransactions: many(inventory),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customer_id], references: [customers.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.order_id], references: [orders.id] }),
  product: one(products, { fields: [orderItems.product_id], references: [products.id] }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, { fields: [inventory.product_id], references: [products.id] }),
}));
