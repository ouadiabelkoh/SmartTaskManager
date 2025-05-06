import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { OfflineAlert } from "@/components/layout/offline-alert";
import { isOnline } from "@/lib/offline-sync";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Loader2, 
  Search, 
  ArrowUpDown, 
  AlertTriangle, 
  Edit, 
  Trash,
  Plus,
  Package,
  FileText,
  ImageIcon,
  Calendar,
  User,
  Clock
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  stock: number;
  barcode?: string;
  sku?: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
};

type Category = {
  id: number;
  name: string;
  image?: string;
};

type InventoryTransaction = {
  id: number;
  product_id: number;
  quantity: number;
  type: 'add' | 'remove';
  notes?: string;
  user_id?: number;
  created_at: string;
};

// Schema for adjusting inventory
const inventoryUpdateSchema = z.object({
  product_id: z.coerce.number().positive("Please select a product"),
  quantity: z.coerce.number().int("Quantity must be a whole number").positive("Quantity must be positive"),
  type: z.enum(["add", "remove"]),
  notes: z.string().optional(),
});

// Schema for editing product
const productEditSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  category_id: z.coerce.number().positive("Please select a category"),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  stock: z.coerce.number().int("Stock must be a whole number").nonnegative("Stock cannot be negative"),
  image: z.string().optional(),
});

type InventoryUpdateFormValues = z.infer<typeof inventoryUpdateSchema>;
type ProductEditFormValues = z.infer<typeof productEditSchema>;

export default function InventoryPage() {
  const { user } = useAuth();
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isProductDetailDialogOpen, setIsProductDetailDialogOpen] = useState(false);
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("products");
  const { toast } = useToast();

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Fetch inventory history for selected product
  const { data: inventoryHistory, isLoading: historyLoading } = useQuery<InventoryTransaction[]>({
    queryKey: ["/api/inventory/history", selectedProductId],
    enabled: !!selectedProductId && isHistoryDialogOpen,
  });
  
  // Get selected product
  const selectedProduct = selectedProductId 
    ? products?.find(p => p.id === selectedProductId) 
    : null;
  
  // Product edit form
  const productEditForm = useForm<ProductEditFormValues>({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      name: selectedProduct?.name || "",
      description: selectedProduct?.description || "",
      price: selectedProduct?.price || 0,
      category_id: selectedProduct?.category_id || 0,
      barcode: selectedProduct?.barcode || "",
      sku: selectedProduct?.sku || "",
      stock: selectedProduct?.stock || 0,
      image: selectedProduct?.image || "",
    },
  });
  
  // Update form values when selected product changes
  React.useEffect(() => {
    if (selectedProduct && isEditProductDialogOpen) {
      productEditForm.reset({
        name: selectedProduct.name,
        description: selectedProduct.description,
        price: selectedProduct.price,
        category_id: selectedProduct.category_id,
        barcode: selectedProduct.barcode || "",
        sku: selectedProduct.sku || "",
        stock: selectedProduct.stock,
        image: selectedProduct.image || "",
      });
    }
  }, [selectedProduct, isEditProductDialogOpen, productEditForm]);
  
  // New product form
  const newProductForm = useForm<ProductEditFormValues>({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category_id: 0,
      barcode: "",
      sku: "",
      stock: 0,
      image: "",
    },
  });
  
  // Edit product mutation
  const editProductMutation = useMutation({
    mutationFn: async (data: ProductEditFormValues) => {
      const res = await apiRequest("PATCH", `/api/products/${selectedProductId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsEditProductDialogOpen(false);
      toast({
        title: "Product updated",
        description: "Product has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create new product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductEditFormValues) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsNewProductDialogOpen(false);
      newProductForm.reset({
        name: "",
        description: "",
        price: 0,
        category_id: 0,
        barcode: "",
        sku: "",
        stock: 0,
        image: "",
      });
      toast({
        title: "Product created",
        description: "New product has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle edit product submit
  const onProductEditSubmit = (data: ProductEditFormValues) => {
    editProductMutation.mutate(data);
  };
  
  // Handle new product submit
  const onNewProductSubmit = (data: ProductEditFormValues) => {
    createProductMutation.mutate(data);
  };

  // Filter products based on search query, category, and stock level
  const filteredProducts = products?.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !categoryFilter || categoryFilter === "all" || product.category_id.toString() === categoryFilter;
    
    const matchesStock = !stockFilter || (
      stockFilter === "low" ? product.stock < 10 :
      stockFilter === "out" ? product.stock <= 0 :
      stockFilter === "in" ? product.stock > 0 : true
    );
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Adjust inventory form
  const adjustForm = useForm<InventoryUpdateFormValues>({
    resolver: zodResolver(inventoryUpdateSchema),
    defaultValues: {
      product_id: 0,
      quantity: 1,
      type: "add",
      notes: "",
    },
  });

  // Adjust inventory mutation
  const adjustInventoryMutation = useMutation({
    mutationFn: async (data: InventoryUpdateFormValues) => {
      const res = await apiRequest("POST", "/api/inventory/adjust", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsAdjustDialogOpen(false);
      adjustForm.reset({
        product_id: 0,
        quantity: 1,
        type: "add",
        notes: "",
      });
      toast({
        title: "Inventory updated",
        description: "Inventory has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update inventory",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle adjust inventory submit
  const onAdjustSubmit = (data: InventoryUpdateFormValues) => {
    adjustInventoryMutation.mutate(data);
  };

  // Sort products by stock level (low to high)
  const sortedProducts = [...(filteredProducts || [])].sort((a, b) => a.stock - b.stock);

  // Get category name from category id
  const getCategoryName = (categoryId: number) => {
    return categories?.find(c => c.id === categoryId)?.name || "Unknown";
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPath="/inventory" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Inventory" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {isOffline && <OfflineAlert />}
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-semibold text-foreground">Inventory Management</h1>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button onClick={() => setIsNewProductDialogOpen(true)} variant="default">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
              <Button onClick={() => setIsAdjustDialogOpen(true)} variant="outline">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Adjust Inventory
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            
            <Select value={categoryFilter || "all"} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={stockFilter || "all"} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Stock Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="in">In Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading || categoriesLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : sortedProducts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedProducts?.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku || "—"}</TableCell>
                      <TableCell>{getCategoryName(product.category_id)}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        {product.stock <= 0 ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-destructive/20 text-destructive">
                            Out of Stock
                          </span>
                        ) : product.stock < 10 ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-warning/20 text-warning flex items-center w-fit">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-success/20 text-success">
                            In Stock
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProductId(product.id);
                              setIsProductDetailDialogOpen(true);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProductId(product.id);
                              setIsEditProductDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              adjustForm.setValue("product_id", product.id);
                              setIsAdjustDialogOpen(true);
                            }}
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProductId(product.id);
                              setIsHistoryDialogOpen(true);
                            }}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Adjust Inventory Dialog */}
          <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adjust Inventory</DialogTitle>
                <DialogDescription>
                  Add or remove stock from your inventory.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...adjustForm}>
                <form onSubmit={adjustForm.handleSubmit(onAdjustSubmit)} className="space-y-4">
                  <FormField
                    control={adjustForm.control}
                    name="product_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value.toString() === "0" ? "" : field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {productsLoading ? (
                              <div className="flex justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              products?.map(product => (
                                <SelectItem 
                                  key={product.id} 
                                  value={product.id.toString()}
                                >
                                  {product.name} {product.sku ? `(${product.sku})` : ""}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={adjustForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adjustment Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="add">Add Stock</SelectItem>
                            <SelectItem value="remove">Remove Stock</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={adjustForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1}
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value === "" ? "1" : e.target.value;
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={adjustForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Reason for adjustment" 
                            {...field} 
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAdjustDialogOpen(false)}
                      className="mr-2"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={adjustInventoryMutation.isPending}
                    >
                      {adjustInventoryMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Adjust Inventory
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Product Edit Dialog */}
          <Dialog open={isEditProductDialogOpen} onOpenChange={setIsEditProductDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Update product information and details.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...productEditForm}>
                <form onSubmit={productEditForm.handleSubmit(onProductEditSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={productEditForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={productEditForm.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categoriesLoading ? (
                                <div className="flex justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : (
                                categories?.map(category => (
                                  <SelectItem 
                                    key={category.id} 
                                    value={category.id.toString()}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={productEditForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === "" ? "0" : e.target.value;
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={productEditForm.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Stock *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === "" ? "0" : e.target.value;
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={productEditForm.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={productEditForm.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Barcode</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={productEditForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Product description" 
                            {...field} 
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productEditForm.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditProductDialogOpen(false)}
                      className="mr-2"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={editProductMutation.isPending}
                    >
                      {editProductMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Inventory History Dialog */}
          <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Inventory History</DialogTitle>
                <DialogDescription>
                  {selectedProduct ? `Transaction history for ${selectedProduct.name}` : 'Loading...'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Updated By</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : inventoryHistory?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No history found for this product.
                        </TableCell>
                      </TableRow>
                    ) : (
                      inventoryHistory?.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {transaction.created_at ? format(new Date(transaction.created_at), 'PPP p') : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === 'add' ? 'default' : 'destructive'} className={transaction.type === 'add' ? 'bg-success/20 text-success hover:bg-success/20' : ''}>
                              {transaction.type === 'add' ? 'Added' : 'Removed'}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.quantity}</TableCell>
                          <TableCell>{transaction.user_id || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {transaction.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Product Detail Dialog */}
          <Dialog open={isProductDetailDialogOpen} onOpenChange={setIsProductDetailDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Product Details</DialogTitle>
                <DialogDescription>
                  {selectedProduct ? `Detailed information for ${selectedProduct.name}` : 'Loading...'}
                </DialogDescription>
              </DialogHeader>
              
              {selectedProduct ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden">
                      {selectedProduct.image ? (
                        <img 
                          src={selectedProduct.image} 
                          alt={selectedProduct.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-24 w-24 text-muted-foreground opacity-50" />
                      )}
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Card className="col-span-1">
                        <CardHeader className="p-3">
                          <CardTitle className="text-sm">Price</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <p className="text-xl font-semibold">${selectedProduct.price.toFixed(2)}</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="col-span-1">
                        <CardHeader className="p-3">
                          <CardTitle className="text-sm">Stock</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <p className="text-xl font-semibold">{selectedProduct.stock}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedProduct.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getCategoryName(selectedProduct.category_id)}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Description</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedProduct.description || 'No description available.'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-1">SKU</h4>
                        <p className="text-sm">{selectedProduct.sku || 'N/A'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Barcode</h4>
                        <p className="text-sm">{selectedProduct.barcode || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 mt-6">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsProductDetailDialogOpen(false);
                          setIsEditProductDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          adjustForm.setValue("product_id", selectedProduct.id);
                          setIsProductDetailDialogOpen(false);
                          setIsAdjustDialogOpen(true);
                        }}
                      >
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        Adjust Stock
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsProductDetailDialogOpen(false);
                          setIsHistoryDialogOpen(true);
                        }}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        History
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          {/* New Product Dialog */}
          <Dialog open={isNewProductDialogOpen} onOpenChange={setIsNewProductDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Create a new product in your inventory.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...newProductForm}>
                <form onSubmit={newProductForm.handleSubmit(onNewProductSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={newProductForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newProductForm.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value === 0 ? "" : field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categoriesLoading ? (
                                <div className="flex justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : (
                                categories?.map(category => (
                                  <SelectItem 
                                    key={category.id} 
                                    value={category.id.toString()}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newProductForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === "" ? "0" : e.target.value;
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newProductForm.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Stock *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === "" ? "0" : e.target.value;
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newProductForm.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newProductForm.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Barcode</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={newProductForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Product description" 
                            {...field} 
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={newProductForm.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsNewProductDialogOpen(false)}
                      className="mr-2"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createProductMutation.isPending}
                    >
                      {createProductMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Product
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
