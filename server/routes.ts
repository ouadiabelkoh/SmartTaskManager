import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { orderItemsInsertSchema, ordersInsertSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('Client connected');
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection_established',
      data: { message: 'Connected to POS server' }
    }));
    
    // Handle messages from clients
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'sync_operation') {
          // Handle sync operations from offline clients
          console.log('Received sync operation', message.data);
          
          // Process the sync operation based on type
          const { id, type, endpoint, method, data: syncData } = message.data;
          
          // Send acknowledgment
          ws.send(JSON.stringify({
            type: 'sync_result',
            data: { id, success: true }
          }));
          
          // Broadcast update to all connected clients
          wss.clients.forEach(client => {
            if (client.readyState === ws.OPEN) {
              client.send(JSON.stringify({
                type: 'data_updated',
                data: { resource: type }
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Invalid message format' }
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
  
  // Categories API
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.listCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });
  
  app.post('/api/categories', async (req, res) => {
    try {
      const category = await storage.createCategory(req.body);
      
      // Notify connected clients about the update
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'data_updated',
            data: { resource: 'categories' }
          }));
        }
      });
      
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Failed to create category' });
    }
  });
  
  app.get('/api/categories/:id', async (req, res) => {
    try {
      const category = await storage.getCategory(Number(req.params.id));
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ message: 'Failed to fetch category' });
    }
  });
  
  app.put('/api/categories/:id', async (req, res) => {
    try {
      const updatedCategory = await storage.updateCategory(Number(req.params.id), req.body);
      
      // Notify connected clients about the update
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'data_updated',
            data: { resource: 'categories' }
          }));
        }
      });
      
      res.json(updatedCategory);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Failed to update category' });
    }
  });
  
  app.delete('/api/categories/:id', async (req, res) => {
    try {
      const result = await storage.deleteCategory(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Notify connected clients about the update
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'data_updated',
            data: { resource: 'categories' }
          }));
        }
      });
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Failed to delete category' });
    }
  });
  
  // Products API
  app.get('/api/products', async (req, res) => {
    try {
      const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;
      const products = await storage.listProducts({ categoryId });
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });
  
  app.post('/api/products', async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      
      // Notify connected clients about the update
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'data_updated',
            data: { resource: 'products' }
          }));
        }
      });
      
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Failed to create product' });
    }
  });
  
  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProduct(Number(req.params.id));
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Failed to fetch product' });
    }
  });
  
  app.put('/api/products/:id', async (req, res) => {
    try {
      const updatedProduct = await storage.updateProduct(Number(req.params.id), req.body);
      
      // Notify connected clients about the update
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'data_updated',
            data: { resource: 'products' }
          }));
        }
      });
      
      res.json(updatedProduct);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Failed to update product' });
    }
  });
  
  app.delete('/api/products/:id', async (req, res) => {
    try {
      const result = await storage.deleteProduct(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Notify connected clients about the update
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'data_updated',
            data: { resource: 'products' }
          }));
        }
      });
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  });
  
  // Inventory API
  app.post('/api/inventory/adjust', async (req, res) => {
    try {
      const inventoryTransaction = await storage.addInventory(req.body);
      
      // Notify connected clients about the update
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'data_updated',
            data: { 
              resource: 'inventory',
              productId: inventoryTransaction.product_id
            }
          }));
        }
      });
      
      res.status(201).json(inventoryTransaction);
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      res.status(500).json({ message: 'Failed to adjust inventory' });
    }
  });
  
  app.get('/api/inventory/history/:productId', async (req, res) => {
    try {
      const history = await storage.getInventoryHistory(Number(req.params.productId));
      res.json(history);
    } catch (error) {
      console.error('Error fetching inventory history:', error);
      res.status(500).json({ message: 'Failed to fetch inventory history' });
    }
  });
  
  // Customers API
  app.get('/api/customers', async (req, res) => {
    try {
      const customers = await storage.listCustomers();
      res.json(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ message: 'Failed to fetch customers' });
    }
  });
  
  app.post('/api/customers', async (req, res) => {
    try {
      const customer = await storage.createCustomer(req.body);
      
      // Notify connected clients about the update
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'data_updated',
            data: { resource: 'customers' }
          }));
        }
      });
      
      res.status(201).json(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ message: 'Failed to create customer' });
    }
  });
  
  app.get('/api/customers/:id', async (req, res) => {
    try {
      const customer = await storage.getCustomer(Number(req.params.id));
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json(customer);
    } catch (error) {
      console.error('Error fetching customer:', error);
      res.status(500).json({ message: 'Failed to fetch customer' });
    }
  });
  
  app.put('/api/customers/:id', async (req, res) => {
    try {
      const updatedCustomer = await storage.updateCustomer(Number(req.params.id), req.body);
      
      // Notify connected clients about the update
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'data_updated',
            data: { resource: 'customers' }
          }));
        }
      });
      
      res.json(updatedCustomer);
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ message: 'Failed to update customer' });
    }
  });
  
  app.delete('/api/customers/:id', async (req, res) => {
    try {
      const result = await storage.deleteCustomer(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      // Notify connected clients about the update
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'data_updated',
            data: { resource: 'customers' }
          }));
        }
      });
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({ message: 'Failed to delete customer' });
    }
  });
  
  // Orders API
  app.post('/api/orders', async (req, res) => {
    try {
      // Validate order data
      const { order, items } = req.body;
      
      // Validate order and items using Zod schemas
      const validatedOrder = ordersInsertSchema.parse(order);
      const validatedItems = orderItemsInsertSchema.array().parse(items);
      
      // Create order with items
      const createdOrder = await storage.createOrder(validatedOrder, validatedItems);
      
      // Notify connected clients about the update
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'data_updated',
            data: { resource: 'orders' }
          }));
        }
      });
      
      res.status(201).json(createdOrder);
    } catch (error) {
      console.error('Error creating order:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid order data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create order' });
    }
  });
  
  app.get('/api/orders', async (req, res) => {
    try {
      const options: any = {};
      
      if (req.query.customer_id) {
        options.customerId = Number(req.query.customer_id);
      }
      
      if (req.query.status) {
        options.status = req.query.status;
      }
      
      if (req.query.start_date) {
        options.startDate = new Date(req.query.start_date as string);
      }
      
      if (req.query.end_date) {
        options.endDate = new Date(req.query.end_date as string);
      }
      
      const orders = await storage.listOrders(options);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });
  
  app.get('/api/orders/:id', async (req, res) => {
    try {
      const orderWithItems = await storage.getOrderWithItems(Number(req.params.id));
      if (!orderWithItems) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json(orderWithItems);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: 'Failed to fetch order' });
    }
  });
  
  app.patch('/api/orders/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      const updatedOrder = await storage.updateOrderStatus(Number(req.params.id), status);
      
      // Notify connected clients about the update
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'data_updated',
            data: { resource: 'orders' }
          }));
        }
      });
      
      res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Failed to update order status' });
    }
  });
  
  // Dashboard API
  app.get('/api/dashboard/recent-sales', async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 5;
      const recentOrders = await storage.getRecentOrders(limit);
      res.json(recentOrders);
    } catch (error) {
      console.error('Error fetching recent sales:', error);
      res.status(500).json({ message: 'Failed to fetch recent sales' });
    }
  });
  
  app.get('/api/dashboard/low-stock', async (req, res) => {
    try {
      const threshold = req.query.threshold ? Number(req.query.threshold) : 10;
      const lowStockProducts = await storage.getLowStockProducts(threshold);
      res.json(lowStockProducts);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      res.status(500).json({ message: 'Failed to fetch low stock products' });
    }
  });
  
  // Reports API
  app.get('/api/reports/sales', async (req, res) => {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : new Date(new Date().setDate(new Date().getDate() - 30));
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : new Date();
      
      const salesReport = await storage.getSalesReport(startDate, endDate);
      res.json(salesReport);
    } catch (error) {
      console.error('Error generating sales report:', error);
      res.status(500).json({ message: 'Failed to generate sales report' });
    }
  });
  
  app.get('/api/reports/products', async (req, res) => {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : new Date(new Date().setDate(new Date().getDate() - 30));
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : new Date();
      
      const productReport = await storage.getProductPerformance(startDate, endDate);
      res.json(productReport);
    } catch (error) {
      console.error('Error generating product report:', error);
      res.status(500).json({ message: 'Failed to generate product report' });
    }
  });
  
  app.get('/api/reports/categories', async (req, res) => {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : new Date(new Date().setDate(new Date().getDate() - 30));
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : new Date();
      
      const categoryReport = await storage.getCategoryPerformance(startDate, endDate);
      res.json(categoryReport);
    } catch (error) {
      console.error('Error generating category report:', error);
      res.status(500).json({ message: 'Failed to generate category report' });
    }
  });
  
  // Users API
  app.get('/api/users', async (req, res) => {
    try {
      // Check if user is admin
      if (!req.isAuthenticated() || !req.user || !req.user.role || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const users = await storage.listUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });
  
  app.post('/api/users', async (req, res) => {
    try {
      // Check if user is admin
      if (!req.isAuthenticated() || !req.user || !req.user.role || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const user = await storage.createUser(req.body);
      
      // Notify connected clients about the update
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'data_updated',
            data: { resource: 'users' }
          }));
        }
      });
      
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });
  
  app.put('/api/users/:id', async (req, res) => {
    try {
      // Check if user is admin
      if (!req.isAuthenticated() || !req.user || !req.user.role || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const updatedUser = await storage.updateUser(Number(req.params.id), req.body);
      
      // Notify connected clients about the update
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'data_updated',
            data: { resource: 'users' }
          }));
        }
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });
  
  app.delete('/api/users/:id', async (req, res) => {
    try {
      // Check if user is admin
      if (!req.isAuthenticated() || !req.user || !req.user.role || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Prevent deleting yourself
      if (req.user.id === Number(req.params.id)) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }
      
      const result = await storage.deleteUser(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Notify connected clients about the update
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'data_updated',
            data: { resource: 'users' }
          }));
        }
      });
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });
  
  // Settings API
  // These would normally connect to a proper settings storage
  // For now, we'll just return mock data for the UI to function
  app.get('/api/settings/business', (req, res) => {
    res.json({
      storeName: "RetailPOS Store",
      storeAddress: "123 Main Street, Anytown, USA",
      storePhone: "(555) 123-4567",
      storeEmail: "info@retailpos.com",
      taxRate: 7.5,
      currency: "USD",
      timezone: "America/New_York"
    });
  });
  
  app.put('/api/settings/business', (req, res) => {
    // Would normally save to database
    res.json(req.body);
  });
  
  app.get('/api/settings/receipt', (req, res) => {
    res.json({
      showLogo: true,
      receiptTitle: "Sales Receipt",
      footerText: "Thank you for your purchase!",
      showTaxDetails: true,
      printCustomerInfo: true
    });
  });
  
  app.put('/api/settings/receipt', (req, res) => {
    // Would normally save to database
    res.json(req.body);
  });
  
  app.get('/api/settings/system', (req, res) => {
    res.json({
      autoBackup: true,
      backupFrequency: "daily",
      backupLocation: "cloud",
      allowOfflineMode: true,
      syncFrequency: "realtime",
      retentionDays: 30
    });
  });
  
  app.put('/api/settings/system', (req, res) => {
    // Would normally save to database
    res.json(req.body);
  });
  
  // Export data (mock implementation)
  app.get('/api/settings/export', (req, res) => {
    const mockExportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      data: {
        // Would include exported data
        message: "This is a mock export endpoint"
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=retailpos_export.json');
    res.json(mockExportData);
  });
  
  // Import data (mock implementation)
  app.post('/api/settings/import', (req, res) => {
    // Would normally process the uploaded file
    res.json({ success: true, message: "Data imported successfully" });
  });

  return httpServer;
}
