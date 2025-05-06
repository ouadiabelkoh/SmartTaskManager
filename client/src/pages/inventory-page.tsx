import { useState } from "react";
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
};

type Category = {
  id: number;
  name: string;
};

const inventoryUpdateSchema = z.object({
  product_id: z.coerce.number().positive("Please select a product"),
  quantity: z.coerce.number().int("Quantity must be a whole number"),
  type: z.enum(["add", "remove"]),
  notes: z.string().optional(),
});

type InventoryUpdateFormValues = z.infer<typeof inventoryUpdateSchema>;

export default function InventoryPage() {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

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
              <Button onClick={() => setIsAdjustDialogOpen(true)}>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            adjustForm.setValue("product_id", product.id);
                            setIsAdjustDialogOpen(true);
                          }}
                        >
                          Adjust
                        </Button>
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
        </main>
      </div>
    </div>
  );
}
