import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  LayoutGrid, 
  Package, 
  Filter,
  X,
  ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProductCard } from "@/components/pos/product-card";
import { useMobile } from "@/hooks/use-mobile";

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
  category_id: number;
  stock: number;
  barcode?: string; // Optional barcode/SKU
}

interface Category {
  id: number;
  name: string;
  image?: string;
}

interface EnhancedProductGridProps {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addToCart: (product: Product, quantity: number) => void;
  isTouchOptimized?: boolean;
}

export function EnhancedProductGrid({
  products,
  categories,
  isLoading,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  addToCart,
  isTouchOptimized = false
}: EnhancedProductGridProps) {
  const [sort, setSort] = useState<"name" | "price" | "stock">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [stockFilter, setStockFilter] = useState<"all" | "in-stock" | "low-stock" | "out-of-stock">("all");
  const [gridLayout, setGridLayout] = useState<"grid" | "list">("grid");
  const [viewMode, setViewMode] = useState<"grand" | "normal" | "compact">("normal");
  const isMobile = useMobile();
  
  // Set compact mode automatically on mobile
  useEffect(() => {
    if (isMobile && isTouchOptimized) {
      setViewMode("compact");
    }
  }, [isMobile, isTouchOptimized]);
  
  // Filter products by selected category and search query
  let filteredProducts = products.filter(product => {
    // Category filter
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    
    // Search query filter
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Stock filter
    let matchesStock = true;
    switch (stockFilter) {
      case "in-stock":
        matchesStock = product.stock > 0;
        break;
      case "low-stock":
        matchesStock = product.stock > 0 && product.stock < 10;
        break;
      case "out-of-stock":
        matchesStock = product.stock <= 0;
        break;
      default:
        matchesStock = true;
    }
    
    return matchesCategory && matchesSearch && matchesStock;
  });
  
  // Sort products
  filteredProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;
    
    switch (sort) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "price":
        comparison = a.price - b.price;
        break;
      case "stock":
        comparison = a.stock - b.stock;
        break;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setStockFilter("all");
    setSort("name");
    setSortOrder("asc");
  };
  
  // Get active filter count
  const activeFilterCount = 
    (searchQuery ? 1 : 0) + 
    (selectedCategory ? 1 : 0) + 
    (stockFilter !== "all" ? 1 : 0) +
    ((sort !== "name" || sortOrder !== "asc") ? 1 : 0);
  
  return (
    <div className="flex flex-col h-full">
      {/* Search, Filter, and View Controls */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10",
              searchQuery && "pr-10"
            )}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          {/* Filter button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-shrink-0"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 w-4 h-4 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Filters</h4>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock</label>
                  <Select 
                    value={stockFilter} 
                    onValueChange={(value) => setStockFilter(value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by stock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All items</SelectItem>
                      <SelectItem value="in-stock">In stock</SelectItem>
                      <SelectItem value="low-stock">Low stock</SelectItem>
                      <SelectItem value="out-of-stock">Out of stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Sort by</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                      className="-mr-2"
                    >
                      <ArrowUpDown className="h-4 w-4 mr-1" />
                      {sortOrder === "asc" ? "Ascending" : "Descending"}
                    </Button>
                  </div>
                  <Select 
                    value={sort} 
                    onValueChange={(value) => setSort(value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Reset filters
                  </Button>
                  <Button size="sm">Apply</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* View mode toggle */}
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={gridLayout === "grid" ? "default" : "ghost"}
              size="sm"
              className="rounded-none px-2"
              onClick={() => setGridLayout("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={gridLayout === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-none px-2"
              onClick={() => setGridLayout("list")}
            >
              <Package className="h-4 w-4" />
            </Button>
          </div>
          
          {/* View mode selection */}
          {(!isMobile || isTouchOptimized) && (
            <div className="ml-auto flex border rounded-md overflow-hidden">
              <Button
                variant={viewMode === "grand" ? "default" : "ghost"}
                size="sm"
                className="rounded-none px-2"
                onClick={() => setViewMode("grand")}
                title="Grand view - 2 products per row"
              >
                Grand
              </Button>
              <Button
                variant={viewMode === "normal" ? "default" : "ghost"}
                size="sm"
                className="rounded-none px-2"
                onClick={() => setViewMode("normal")}
                title="Normal view - 4 products per row"
              >
                Normal
              </Button>
              <Button
                variant={viewMode === "compact" ? "default" : "ghost"}
                size="sm"
                className="rounded-none px-2"
                onClick={() => setViewMode("compact")}
                title="Compact view - 6 products per row"
              >
                Compact
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Products Grid Display */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {isLoading ? (
            <ProductGridSkeleton gridLayout={gridLayout} viewMode={viewMode} />
          ) : filteredProducts.length > 0 ? (
            <div className={cn(
              "gap-4",
              gridLayout === "grid" 
                ? viewMode === "grand"
                  ? "grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2"
                  : viewMode === "normal"
                    ? "grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4"
                    : "grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6"
                : "space-y-2"
            )}>
              {filteredProducts.map((product) => (
                gridLayout === "grid" ? (
                  <ProductCard
                    key={product.id}
                    product={product}
                    addToCart={addToCart}
                    compact={viewMode === "compact"}
                  />
                ) : (
                  <Card key={product.id} className={cn(
                    "transition-shadow hover:shadow-md cursor-pointer",
                    product.stock <= 0 && "opacity-60"
                  )}
                  onClick={() => product.stock > 0 && addToCart(product, 1)}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className="h-12 w-12 bg-muted flex items-center justify-center mr-3 rounded-md overflow-hidden">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="h-full w-full object-cover" 
                            />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm truncate" title={product.name}>{product.name}</h3>
                          <div className="flex items-center flex-wrap gap-x-3 text-sm">
                            <span className="font-semibold">${typeof product.price === 'number' ? product.price.toFixed(2) : Number(product.price).toFixed(2)}</span>
                            <span className={cn(
                              "text-xs",
                              product.stock <= 0 
                                ? "text-destructive" 
                                : product.stock < 10 
                                  ? "text-warning" 
                                  : "text-success"
                            )}>
                              {product.stock <= 0 ? "Out of stock" : `${product.stock} in stock`}
                            </span>
                            {product.barcode && (
                              <span className="text-xs text-muted-foreground">ID: {product.barcode}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          product.stock > 0 && addToCart(product, 1);
                        }}
                        disabled={product.stock <= 0}
                      >
                        Add to cart
                      </Button>
                    </CardContent>
                  </Card>
                )
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground">
              <Package className="h-12 w-12 mb-4" />
              <p className="mb-2">No products found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
              {activeFilterCount > 0 && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

// Skeleton loader for product grid
function ProductGridSkeleton({ 
  gridLayout,
  viewMode
}: { 
  gridLayout: "grid" | "list",
  viewMode: "grand" | "normal" | "compact"
}) {
  return (
    <div className={cn(
      "gap-4",
      gridLayout === "grid" 
        ? viewMode === "grand"
          ? "grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2"
          : viewMode === "normal"
            ? "grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4"
            : "grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6"
        : "space-y-2"
    )}>
      {Array(12).fill(0).map((_, index) => (
        gridLayout === "grid" ? (
          <Card key={index} className="overflow-hidden">
            <Skeleton className={cn(
              "w-full", 
              viewMode === "compact" ? "h-24" : viewMode === "grand" ? "h-48" : "h-36"
            )} />
            <CardContent className="p-3">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-20 mb-2" />
              <div className="flex justify-between items-center mt-3">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16 rounded" />
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
              <Skeleton className="h-9 w-24 rounded" />
            </CardContent>
          </Card>
        )
      ))}
    </div>
  );
}