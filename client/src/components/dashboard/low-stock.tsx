import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  sku: string;
  stock: number;
}

export function LowStock() {
  const { data: lowStockItems, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/dashboard/low-stock"],
  });
  
  // Function to handle restock action
  const handleRestock = (productId: number) => {
    console.log(`Restock product ${productId}`);
    // Would open a dialog to adjust inventory
  };

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Low Stock Items</CardTitle>
          <a href="/inventory" className="text-sm text-primary hover:text-primary/80">View all</a>
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
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
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
                      onClick={() => handleRestock(item.id)}
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
  );
}
