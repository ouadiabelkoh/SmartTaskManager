import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface Product {
  id: number;
  name: string;
  sku?: string;
  stock: number;
  image?: string;
}

const inventorySchema = z.object({
  product_id: z.number(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  type: z.enum(["add", "remove"]),
  notes: z.string().optional(),
});

type InventoryFormValues = z.infer<typeof inventorySchema>;

export function LowStock() {
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch low stock items with the real API endpoint (now using product-specific thresholds)
  const { data: lowStockItems, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/dashboard/low-stock"],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/low-stock');
      if (!response.ok) {
        throw new Error('Failed to fetch low stock items');
      }
      return response.json();
    },
  });

  // Inventory adjustment form
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      quantity: 1,
      type: "add",
      notes: "",
    },
  });

  // Adjust inventory mutation
  const adjustInventoryMutation = useMutation({
    mutationFn: async (data: InventoryFormValues) => {
      const res = await apiRequest("POST", "/api/inventory/adjust", data);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      setIsAdjustDialogOpen(false);
      form.reset();
      toast({
        title: "Inventory adjusted",
        description: "The inventory has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to adjust inventory",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to handle restock action
  const handleRestock = (product: Product) => {
    setSelectedProduct(product);
    form.setValue("product_id", product.id);
    form.setValue("type", "add");
    form.setValue("quantity", 1);
    form.setValue("notes", "");
    setIsAdjustDialogOpen(true);
  };

  // Form submission handler
  const onSubmit = (data: InventoryFormValues) => {
    adjustInventoryMutation.mutate(data);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Low Stock Items</CardTitle>
            <Button 
              variant="link" 
              className="text-sm text-primary hover:text-primary/80 p-0 h-auto"
              onClick={() => navigate("/inventory")}
            >
              View all
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-y-auto" style={{ maxHeight: "340px" }}>
            <div className="divide-y divide-border">
              {isLoading ? (
                Array(4).fill(0).map((_, index) => (
                  <div key={`skeleton-${index}`} className="p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-md mr-3" />
                      <div>
                        <Skeleton className="h-4 w-28 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-6 w-12 rounded-full mb-1" />
                      <Skeleton className="h-4 w-14" />
                    </div>
                  </div>
                ))
              ) : lowStockItems && lowStockItems.length > 0 ? (
                lowStockItems.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center mr-3">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="h-10 w-10 object-cover rounded-md"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">SKU: {item.sku || "—"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-xs px-2 py-1 rounded-full mb-1",
                        item.stock <= 0 
                          ? "bg-destructive/20 text-destructive" 
                          : "bg-warning/20 text-warning flex items-center w-fit ml-auto"
                      )}>
                        {item.stock <= 0 ? "Out of stock" : (
                          <>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {item.stock} left
                          </>
                        )}
                      </div>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto text-xs text-primary hover:text-primary/80"
                        onClick={() => handleRestock(item)}
                      >
                        Restock
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  No low stock items found.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Adjustment Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adjust Inventory</DialogTitle>
            <DialogDescription>
              {selectedProduct ? `Update stock for ${selectedProduct.name}` : 'Update product stock'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center mr-3">
                    {selectedProduct?.image ? (
                      <img 
                        src={selectedProduct.image} 
                        alt={selectedProduct.name} 
                        className="h-10 w-10 object-cover rounded-md"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{selectedProduct?.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Current stock: <span className="font-medium">{selectedProduct?.stock || 0}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action</FormLabel>
                      <div className="flex">
                        <Button
                          type="button"
                          variant={field.value === "add" ? "default" : "outline"}
                          className={`flex-1 ${field.value === "add" ? "text-white" : ""}`}
                          onClick={() => form.setValue("type", "add")}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "remove" ? "default" : "outline"}
                          className={`flex-1 ml-2 ${field.value === "remove" ? "text-white" : ""}`}
                          onClick={() => form.setValue("type", "remove")}
                        >
                          <Minus className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="Enter quantity" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter notes about this inventory adjustment (optional)" 
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
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={adjustInventoryMutation.isPending}
                >
                  {adjustInventoryMutation.isPending ? "Updating..." : "Update Stock"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
