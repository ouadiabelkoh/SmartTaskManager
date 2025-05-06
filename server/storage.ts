import { db } from "@db";
import connectPg from "connect-pg-simple";
import { eq, desc, and, or, like, gte, lte, isNull, count } from "drizzle-orm";
import session from "express-session";
import { pool } from "@db";
import {
  users,
  products,
  categories,
  customers,
  inventory,
  orders,
  orderItems,
  people,
  User,
  InsertUser,
  Product,
  InsertProduct,
  Category,
  InsertCategory,
  Customer,
  InsertCustomer,
  Person,
  InsertPerson,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  InventoryTransaction,
  InsertInventoryTransaction
} from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User functions
  getUserByUsername(username: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(): Promise<User[]>;

  // Category functions
  createCategory(categoryData: InsertCategory): Promise<Category>;
  getCategory(id: number): Promise<Category | undefined>;
  updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<boolean>;
  listCategories(): Promise<Category[]>;

  // Product functions
  createProduct(productData: InsertProduct): Promise<Product>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;
  listProducts(options?: { categoryId?: number }): Promise<Product[]>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;
  
  // People (Customers & Suppliers) functions
  createPerson(personData: InsertPerson): Promise<Person>;
  getPerson(id: number): Promise<Person | undefined>;
  updatePerson(id: number, personData: Partial<InsertPerson>): Promise<Person>;
  deletePerson(id: number): Promise<boolean>;
  listPeople(filter?: { type?: string, search?: string }): Promise<Person[]>;
  checkPersonHasTransactions(id: number): Promise<boolean>;
  getPersonTransactions(id: number): Promise<any[]>;

  // Customer functions (now using People underneath)
  createCustomer(customerData: InsertCustomer): Promise<Customer>;
  getCustomer(id: number): Promise<Customer | undefined>;
  updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<boolean>;
  listCustomers(): Promise<Customer[]>;

  // Inventory functions
  addInventory(data: InsertInventoryTransaction): Promise<InventoryTransaction>;
  getInventoryHistory(productId: number): Promise<InventoryTransaction[]>;

  // Order functions
  createOrder(orderData: InsertOrder, orderItems: InsertOrderItem[]): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderWithItems(id: number): Promise<{ order: Order; items: OrderItem[] } | undefined>;
  updateOrderStatus(id: number, status: Order['status']): Promise<Order>;
  listOrders(options?: { 
    customerId?: number; 
    startDate?: Date; 
    endDate?: Date; 
    status?: Order['status'] 
  }): Promise<Order[]>;
  getRecentOrders(limit?: number): Promise<any[]>;

  // Reports
  getSalesReport(startDate: Date, endDate: Date): Promise<any>;
  getProductPerformance(startDate: Date, endDate: Date): Promise<any>;
  getCategoryPerformance(startDate: Date, endDate: Date): Promise<any>;

  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true,
      tableName: 'sessions'
    });
  }

  // User functions
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }

  // Category functions
  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(categoryData).returning();
    return result[0];
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0];
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category> {
    const result = await db.update(categories).set(categoryData).where(eq(categories.id, id)).returning();
    return result[0];
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  async listCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  // Product functions
  async createProduct(productData: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(productData).returning();
    return result[0];
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.barcode, barcode)).limit(1);
    return result[0];
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product> {
    const result = await db.update(products).set(productData).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  async listProducts(options?: { categoryId?: number }): Promise<Product[]> {
    let query = db.select().from(products);
    
    if (options?.categoryId) {
      query = query.where(eq(products.category_id, options.categoryId));
    }
    
    return await query.orderBy(products.name);
  }

  async getLowStockProducts(): Promise<Product[]> {
    // Get all products where stock is less than or equal to their low_stock_threshold
    // Using a raw SQL query to compare stock with low_stock_threshold
    const result = await db.$queryRaw`
      SELECT * FROM products 
      WHERE stock <= low_stock_threshold
      ORDER BY stock ASC
      LIMIT 10
    `;
    return result as Product[];
  }

  // People (Customers & Suppliers) functions
  async createPerson(personData: InsertPerson): Promise<Person> {
    const result = await db.insert(people).values(personData).returning();
    return result[0];
  }

  async getPerson(id: number): Promise<Person | undefined> {
    const result = await db.select().from(people).where(eq(people.id, id)).limit(1);
    return result[0];
  }

  async updatePerson(id: number, personData: Partial<InsertPerson>): Promise<Person> {
    const result = await db.update(people).set(personData).where(eq(people.id, id)).returning();
    return result[0];
  }

  async deletePerson(id: number): Promise<boolean> {
    const result = await db.delete(people).where(eq(people.id, id)).returning();
    return result.length > 0;
  }

  async listPeople(filter?: { type?: string, search?: string }): Promise<Person[]> {
    let query = db.select().from(people);
    
    if (filter?.type && filter.type !== 'all') {
      query = query.where(eq(people.type, filter.type));
    }
    
    if (filter?.search) {
      query = query.where(
        or(
          like(people.name, `%${filter.search}%`),
          like(people.email, `%${filter.search}%`),
          like(people.phone, `%${filter.search}%`)
        )
      );
    }
    
    return await query.orderBy(people.name);
  }
  
  async checkPersonHasTransactions(id: number): Promise<boolean> {
    // Check if this person has any orders associated with them
    const result = await db.select({ count: count() })
      .from(orders)
      .where(eq(orders.customer_id, id));
      
    return result[0].count > 0;
  }
  
  async getPersonTransactions(id: number): Promise<any[]> {
    // Get all orders for this person
    const personOrders = await db.select()
      .from(orders)
      .where(eq(orders.customer_id, id))
      .orderBy(desc(orders.created_at));
      
    // Enhance each order with its items
    const ordersWithItems = await Promise.all(
      personOrders.map(async (order) => {
        const items = await db.select()
          .from(orderItems)
          .where(eq(orderItems.order_id, order.id));
          
        return {
          ...order,
          items
        };
      })
    );
    
    return ordersWithItems;
  }
  
  // Maintain backward compatibility with Customer functions
  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const personData = {
      ...customerData,
      type: "customer" as const
    };
    return this.createPerson(personData);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.getPerson(id);
  }

  async updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer> {
    return this.updatePerson(id, customerData);
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.deletePerson(id);
  }

  async listCustomers(): Promise<Customer[]> {
    return this.listPeople({ type: 'customer' });
  }

  // Inventory functions
  async addInventory(data: InsertInventoryTransaction): Promise<InventoryTransaction> {
    // Start a transaction to update inventory and product stock atomically
    const result = await db.transaction(async (tx) => {
      // Create inventory transaction record
      const inventoryRecord = await tx.insert(inventory).values(data).returning();
      
      // Update product stock
      const productResult = await tx.select().from(products).where(eq(products.id, data.product_id)).limit(1);
      const product = productResult[0];
      
      if (!product) {
        throw new Error(`Product with ID ${data.product_id} not found`);
      }
      
      // Calculate new stock
      let newStock = product.stock;
      if (data.type === 'add') {
        newStock += data.quantity;
      } else if (data.type === 'remove') {
        newStock -= data.quantity;
        if (newStock < 0) {
          throw new Error(`Insufficient stock for product ID ${data.product_id}`);
        }
      }
      
      // Update product stock
      await tx.update(products)
        .set({ stock: newStock })
        .where(eq(products.id, data.product_id));
      
      return inventoryRecord[0];
    });
    
    return result;
  }

  async getInventoryHistory(productId: number): Promise<InventoryTransaction[]> {
    return await db.select()
      .from(inventory)
      .where(eq(inventory.product_id, productId))
      .orderBy(desc(inventory.created_at));
  }

  // Order functions
  async createOrder(orderData: InsertOrder, orderItemsData: InsertOrderItem[]): Promise<Order> {
    // Start a transaction to ensure all operations succeed or fail together
    const result = await db.transaction(async (tx) => {
      // Create the order
      const orderResult = await tx.insert(orders).values(orderData).returning();
      const order = orderResult[0];
      
      // Add order items
      for (const itemData of orderItemsData) {
        const fullItemData = {
          ...itemData,
          order_id: order.id
        };
        
        await tx.insert(orderItems).values(fullItemData);
        
        // Update product stock
        const productResult = await tx.select().from(products).where(eq(products.id, itemData.product_id)).limit(1);
        const product = productResult[0];
        
        if (!product) {
          throw new Error(`Product with ID ${itemData.product_id} not found`);
        }
        
        // Calculate new stock
        const newStock = product.stock - itemData.quantity;
        if (newStock < 0) {
          throw new Error(`Insufficient stock for product ID ${itemData.product_id}`);
        }
        
        // Update product stock
        await tx.update(products)
          .set({ stock: newStock })
          .where(eq(products.id, itemData.product_id));
        
        // Add inventory transaction record
        await tx.insert(inventory).values({
          product_id: itemData.product_id,
          quantity: itemData.quantity,
          type: 'remove',
          reference_id: order.id,
          reference_type: 'order',
          notes: `Order #${order.order_number}`
        });
      }
      
      return order;
    });
    
    return result;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async getOrderWithItems(id: number): Promise<{ order: Order; items: OrderItem[] } | undefined> {
    const orderResult = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (orderResult.length === 0) {
      return undefined;
    }
    
    const order = orderResult[0];
    const items = await db.select().from(orderItems).where(eq(orderItems.order_id, id));
    
    return { order, items };
  }

  async updateOrderStatus(id: number, status: Order['status']): Promise<Order> {
    const result = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    
    return result[0];
  }

  async listOrders(options?: { 
    customerId?: number; 
    startDate?: Date; 
    endDate?: Date; 
    status?: Order['status'] 
  }): Promise<Order[]> {
    let query = db.select().from(orders);
    
    if (options?.customerId) {
      query = query.where(eq(orders.customer_id, options.customerId));
    }
    
    if (options?.status) {
      query = query.where(eq(orders.status, options.status));
    }
    
    if (options?.startDate) {
      query = query.where(gte(orders.created_at, options.startDate));
    }
    
    if (options?.endDate) {
      query = query.where(lte(orders.created_at, options.endDate));
    }
    
    return await query.orderBy(desc(orders.created_at));
  }

  async getRecentOrders(limit: number = 5): Promise<any[]> {
    const recentOrders = await db
      .select({
        id: orders.id,
        order_number: orders.order_number,
        customer_name: customers.name,
        total: orders.total,
        status: orders.status,
        created_at: orders.created_at
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customer_id, customers.id))
      .orderBy(desc(orders.created_at))
      .limit(limit);
    
    // For each order, get the count of items
    const result = await Promise.all(
      recentOrders.map(async (order) => {
        const itemsCount = await db
          .select({ count: db.fn.count() })
          .from(orderItems)
          .where(eq(orderItems.order_id, order.id));
        
        return {
          ...order,
          items_count: Number(itemsCount[0]?.count || 0)
        };
      })
    );
    
    return result;
  }

  // Reports
  async getSalesReport(startDate: Date, endDate: Date): Promise<any> {
    const salesData = await db
      .select({
        date: orders.created_at,
        total: orders.total,
      })
      .from(orders)
      .where(
        and(
          gte(orders.created_at, startDate),
          lte(orders.created_at, endDate),
          eq(orders.status, 'completed')
        )
      )
      .orderBy(orders.created_at);
    
    const totalSales = salesData.reduce((sum, sale) => sum + Number(sale.total), 0);
    const orderCount = salesData.length;
    
    return {
      salesData,
      totalSales,
      orderCount,
      averageOrderValue: orderCount > 0 ? totalSales / orderCount : 0
    };
  }

  async getProductPerformance(startDate: Date, endDate: Date): Promise<any> {
    return await db
      .select({
        product_id: orderItems.product_id,
        product_name: products.name,
        quantity: db.fn.sum(orderItems.quantity),
        revenue: db.fn.sum(orderItems.subtotal)
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.order_id, orders.id))
      .innerJoin(products, eq(orderItems.product_id, products.id))
      .where(
        and(
          gte(orders.created_at, startDate),
          lte(orders.created_at, endDate),
          eq(orders.status, 'completed')
        )
      )
      .groupBy(orderItems.product_id, products.name)
      .orderBy(desc(db.fn.sum(orderItems.quantity)));
  }

  async getCategoryPerformance(startDate: Date, endDate: Date): Promise<any> {
    return await db
      .select({
        category_id: products.category_id,
        category_name: categories.name,
        quantity: db.fn.sum(orderItems.quantity),
        revenue: db.fn.sum(orderItems.subtotal)
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.order_id, orders.id))
      .innerJoin(products, eq(orderItems.product_id, products.id))
      .innerJoin(categories, eq(products.category_id, categories.id))
      .where(
        and(
          gte(orders.created_at, startDate),
          lte(orders.created_at, endDate),
          eq(orders.status, 'completed')
        )
      )
      .groupBy(products.category_id, categories.name)
      .orderBy(desc(db.fn.sum(orderItems.subtotal)));
  }
}

export const storage = new DatabaseStorage();
