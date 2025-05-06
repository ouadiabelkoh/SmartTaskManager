import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, LayoutGrid, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
  category_id: number;
  stock: number;
}

interface Category {
  id: number;
  name: string;
}

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addToCart: (product: Product) => void;
}

export function ProductGrid({
  products,
  categories,
  isLoading,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  addToCart
}: ProductGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Filter products by selected category and search query
  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  // Group products by category for category tabs
  const getProductsByCategory = (categoryId: number) => {
    return products.filter(product => product.category_id === categoryId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter Bar */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            title="List View"
          >
            <Package className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Category Tabs */}
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="mb-4 flex flex-nowrap overflow-x-auto justify-start h-auto p-1">
          <TabsTrigger 
            value="all" 
            className="whitespace-nowrap"
            onClick={() => setSelectedCategory(null)}
          >
            All Products
          </TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id.toString()}
              className="whitespace-nowrap"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all" className="flex-1 overflow-y-auto">
          {isLoading ? (
            <ProductGridSkeleton viewMode={viewMode} />
          ) : filteredProducts.length > 0 ? (
            <div className={cn(
              viewMode === "grid" 
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" 
                : "space-y-2"
            )}>
              {filteredProducts.map((product) => (
                <ProductItem 
                  key={product.id} 
                  product={product} 
                  viewMode={viewMode} 
                  addToCart={addToCart} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Search className="h-12 w-12 mb-4" />
              <p className="mb-2">No products found</p>
              <p className="text-sm">Try adjusting your search or category filters</p>
            </div>
          )}
        </TabsContent>
        
        {categories.map((category) => (
          <TabsContent 
            key={category.id} 
            value={category.id.toString()} 
            className="flex-1 overflow-y-auto"
          >
            {isLoading ? (
              <ProductGridSkeleton viewMode={viewMode} />
            ) : getProductsByCategory(category.id).length > 0 ? (
              <div className={cn(
                viewMode === "grid" 
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" 
                  : "space-y-2"
              )}>
                {getProductsByCategory(category.id).map((product) => (
                  <ProductItem 
                    key={product.id} 
                    product={product} 
                    viewMode={viewMode} 
                    addToCart={addToCart} 
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Package className="h-12 w-12 mb-4" />
                <p>No products in this category</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Product Item Component
interface ProductItemProps {
  product: Product;
  viewMode: "grid" | "list";
  addToCart: (product: Product) => void;
}

function ProductItem({ product, viewMode, addToCart }: ProductItemProps) {
  const { id, name, price, stock, image } = product;
  
  if (viewMode === "grid") {
    return (
      <Card className={cn(
        "overflow-hidden transition-shadow hover:shadow-md",
        stock <= 0 && "opacity-60"
      )}>
        <div className="h-32 bg-muted flex items-center justify-center">
          {image ? (
            <img 
              src={image} 
              alt={name} 
              className="h-full w-full object-cover" 
            />
          ) : (
            <Package className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        <CardContent className="p-3">
          <div className="mb-2">
            <h3 className="font-medium text-sm truncate" title={name}>{name}</h3>
            <p className="text-sm font-semibold text-foreground">${price.toFixed(2)}</p>
          </div>
          <div className="flex justify-between items-center">
            <span className={cn(
              "text-xs",
              stock <= 0 
                ? "text-destructive" 
                : stock < 10 
                  ? "text-warning" 
                  : "text-success"
            )}>
              {stock <= 0 ? "Out of stock" : `${stock} in stock`}
            </span>
            <Button 
              size="sm" 
              onClick={() => addToCart(product)}
              disabled={stock <= 0}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  } else {
    return (
      <Card className={cn(
        "transition-shadow hover:shadow-md",
        stock <= 0 && "opacity-60"
      )}>
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="h-12 w-12 bg-muted flex items-center justify-center mr-3 rounded-md">
              {image ? (
                <img 
                  src={image} 
                  alt={name} 
                  className="h-full w-full object-cover rounded-md" 
                />
              ) : (
                <Package className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-sm" title={name}>{name}</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">${price.toFixed(2)}</p>
                <span className={cn(
                  "text-xs",
                  stock <= 0 
                    ? "text-destructive" 
                    : stock < 10 
                      ? "text-warning" 
                      : "text-success"
                )}>
                  {stock <= 0 ? "Out of stock" : `${stock} in stock`}
                </span>
              </div>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={() => addToCart(product)}
            disabled={stock <= 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </CardContent>
      </Card>
    );
  }
}

// Skeleton loader for product grid
function ProductGridSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  return (
    <div className={cn(
      viewMode === "grid" 
        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" 
        : "space-y-2"
    )}>
      {Array(10).fill(0).map((_, index) => (
        viewMode === "grid" ? (
          <Card key={index} className="overflow-hidden">
            <Skeleton className="h-32 w-full" />
            <CardContent className="p-3">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-20 mb-2" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card key={index}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center flex-1">
                <Skeleton className="h-12 w-12 mr-3 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-10 w-16 rounded" />
            </CardContent>
          </Card>
        )
      ))}
    </div>
  );
}
