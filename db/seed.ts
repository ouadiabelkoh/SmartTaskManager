import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(pin, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    console.log("Starting database seeding...");

    console.log("Running database schema update...");
    console.log("Note: The schema should already be updated via drizzle schema definition in shared/schema.ts");
    console.log("If you're experiencing schema issues, please run 'npm run db:push' to apply schema changes")

    // Check if admin user exists
    const existingAdmin = await db.query.users.findFirst({
      where: eq(schema.users.username, "admin"),
    });

    // Create admin user if it doesn't exist
    if (!existingAdmin) {
      console.log("Creating admin user...");
      const adminUser = schema.insertUserSchema.parse({
        username: "admin",
        password: await hashPassword("admin123"),
        role: "admin",
        pin_code: await hashPin("1234"), // Hash the PIN
        phone_number: "555-ADMIN",
        barcode: "ADMIN-BARCODE-123",
      });
      await db.insert(schema.users).values(adminUser);
      console.log("Admin user created.");
    } else {
      // Update admin user with new fields if they're missing
      console.log("Updating admin user with authentication methods...");
      if (!existingAdmin.pin_code) {
        await db.update(schema.users)
          .set({ 
            pin_code: await hashPin("1234"), // Hash the PIN
            phone_number: existingAdmin.phone_number || "555-ADMIN",
            barcode: existingAdmin.barcode || "ADMIN-BARCODE-123" 
          })
          .where(eq(schema.users.id, existingAdmin.id));
        console.log("Admin user updated with additional authentication methods.");
      } else {
        console.log("Admin user already has authentication methods, skipping update.");
      }
    }
    
    // Create other test users with different authentication methods
    const testUsers = [
      {
        username: "cashier",
        password: await hashPassword("cashier123"),
        pin_code: await hashPin("5678"), // Hash the PIN
        role: "cashier",
      },
      {
        username: "manager",
        password: await hashPassword("manager123"),
        phone_number: "555-MANAGER",
        role: "manager",
      },
      {
        username: "staff",
        password: await hashPassword("staff123"),
        barcode: "STAFF-BARCODE-456",
        role: "staff",
      }
    ];
    
    for (const user of testUsers) {
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.username, user.username),
      });
      
      if (!existingUser) {
        console.log(`Creating ${user.username} user...`);
        const validUser = schema.insertUserSchema.parse(user);
        await db.insert(schema.users).values(validUser);
        console.log(`${user.username} user created.`);
      } else {
        // If it's the cashier and PIN is not set, update it
        if (user.username === "cashier" && user.pin_code && !existingUser.pin_code) {
          console.log(`Updating PIN for ${user.username} user...`);
          await db.update(schema.users)
            .set({ pin_code: user.pin_code })
            .where(eq(schema.users.id, existingUser.id));
          console.log(`Updated PIN for ${user.username} user.`);
        } else {
          console.log(`${user.username} user already exists, skipping creation.`);
        }
      }
    }

    // Create categories if they don't exist
    const existingCategories = await db.query.categories.findMany();
    if (existingCategories.length === 0) {
      console.log("Creating categories...");
      const categories = [
        { name: "Beverages", description: "Drinks, coffee, tea, juice" },
        { name: "Food", description: "Prepared food items" },
        { name: "Snacks", description: "Packaged snacks and finger foods" },
        { name: "Bakery", description: "Bread, pastries, and baked goods" },
        { name: "Merchandise", description: "Store branded items and accessories" },
      ];
      
      for (const category of categories) {
        const validCategory = schema.insertCategorySchema.parse(category);
        await db.insert(schema.categories).values(validCategory);
      }
      console.log("Categories created.");
    } else {
      console.log(`${existingCategories.length} categories already exist, skipping creation.`);
    }

    // Get category IDs for product creation
    const allCategories = await db.query.categories.findMany();
    const categoryMap = allCategories.reduce((map, category) => {
      map[category.name] = category.id;
      return map;
    }, {} as Record<string, number>);

    // Create products if they don't exist
    const existingProducts = await db.query.products.findMany();
    if (existingProducts.length === 0 && Object.keys(categoryMap).length > 0) {
      console.log("Creating products...");
      const products = [
        {
          name: "Coffee - Large",
          description: "Large freshly brewed coffee",
          price: "3.99",
          category_id: categoryMap["Beverages"],
          stock: 100,
          sku: "COF-LRG-001",
        },
        {
          name: "Coffee - Medium",
          description: "Medium freshly brewed coffee",
          price: "2.99",
          category_id: categoryMap["Beverages"],
          stock: 100,
          sku: "COF-MED-001",
        },
        {
          name: "Tea - Herbal",
          description: "Herbal tea infusion",
          price: "2.50",
          category_id: categoryMap["Beverages"],
          stock: 75,
          sku: "TEA-HRB-001",
        },
        {
          name: "Sandwich - Chicken",
          description: "Chicken sandwich with fresh vegetables",
          price: "6.99",
          category_id: categoryMap["Food"],
          stock: 25,
          sku: "SND-CHK-001",
        },
        {
          name: "Sandwich - Vegetarian",
          description: "Vegetarian sandwich with hummus",
          price: "6.50",
          category_id: categoryMap["Food"],
          stock: 20,
          sku: "SND-VEG-001",
        },
        {
          name: "Chips - Regular",
          description: "Regular potato chips",
          price: "1.50",
          category_id: categoryMap["Snacks"],
          stock: 50,
          sku: "SNC-CHP-001",
        },
        {
          name: "Chocolate Bar",
          description: "Premium chocolate bar",
          price: "2.25",
          category_id: categoryMap["Snacks"],
          stock: 40,
          sku: "SNC-CHC-001",
        },
        {
          name: "Croissant",
          description: "Freshly baked croissant",
          price: "2.75",
          category_id: categoryMap["Bakery"],
          stock: 30,
          sku: "BAK-CRS-001",
        },
        {
          name: "Muffin - Blueberry",
          description: "Blueberry muffin",
          price: "3.25",
          category_id: categoryMap["Bakery"],
          stock: 35,
          sku: "BAK-MUF-001",
        },
        {
          name: "Store Mug",
          description: "Branded ceramic mug",
          price: "9.99",
          category_id: categoryMap["Merchandise"],
          stock: 15,
          sku: "MER-MUG-001",
        },
      ];
      
      for (const product of products) {
        const validProduct = schema.insertProductSchema.parse(product);
        await db.insert(schema.products).values(validProduct);
      }
      console.log("Products created.");
    } else {
      console.log(`${existingProducts.length} products already exist, skipping creation.`);
    }

    // Create sample customers if they don't exist
    const existingCustomers = await db.query.customers.findMany();
    if (existingCustomers.length === 0) {
      console.log("Creating customers...");
      const customers = [
        {
          name: "John Doe",
          email: "john.doe@example.com",
          phone: "555-123-4567",
          address: "123 Main St, Anytown, USA",
          notes: "Regular customer, prefers dark roast coffee",
        },
        {
          name: "Jane Smith",
          email: "jane.smith@example.com",
          phone: "555-987-6543",
          address: "456 Oak Ave, Somecity, USA",
          notes: "Loyalty program member",
        },
        {
          name: "Bob Johnson",
          email: "bob.johnson@example.com",
          phone: "555-555-5555",
          address: "789 Pine Rd, Othertown, USA",
          notes: "Catering customer",
        },
      ];
      
      for (const customer of customers) {
        const validCustomer = schema.insertCustomerSchema.parse(customer);
        await db.insert(schema.customers).values(validCustomer);
      }
      console.log("Customers created.");
    } else {
      console.log(`${existingCustomers.length} customers already exist, skipping creation.`);
    }

    console.log("Database seeding completed successfully.");
  } catch (error) {
    console.error("Error during database seeding:", error);
  } finally {
    process.exit(0);
  }
}

seed();
