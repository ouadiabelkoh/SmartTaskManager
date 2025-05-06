import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Package, Plus, Minus, Info, ShoppingBag } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
  category_id: number;
  stock: number;
  barcode?: string; // Optional barcode/SKU
  unit?: string;    // Unit of measurement (kg, gram, each, pack)
}

interface ProductCardProps {
  product: Product;
  addToCart: (product: Product, quantity: number) => void;
  compact?: boolean; // For touch-optimized smaller cards
}

export function ProductCard({ product, addToCart, compact = false }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const { id, name, price, stock, image, barcode, unit } = product;
  
  const handleAddToCart = () => {
    addToCart(product, quantity);
    setQuantity(1); // Reset quantity after adding to cart
  };
  
  const incrementQuantity = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setQuantity(prev => prev + 1);
  };
  
  const decrementQuantity = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // Format price with currency
  const formattedPrice = typeof price === 'number' 
    ? price.toFixed(2) 
    : Number(price).toFixed(2);
  
  // Format price with unit if needed
  const priceDisplay = unit && !["each", "piece"].includes(unit.toLowerCase())
    ? `$${formattedPrice}/${unit}` 
    : `$${formattedPrice}`;
  
  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-md h-full cursor-pointer select-none",
        "border border-border/60 hover:border-primary/20 touch-manipulation",
        stock <= 0 && "opacity-60",
        compact ? "max-w-[160px]" : ""
      )}
      onClick={() => stock > 0 && handleAddToCart()}
    >
      {/* Product Image */}
      <div className={cn(
        "bg-muted flex items-center justify-center relative",
        compact ? "h-28" : "h-40"
      )}>
        {image ? (
          <img 
            src={image} 
            alt={name} 
            className="h-full w-full object-cover" 
          />
        ) : (
          <div className="bg-primary/10 h-full w-full flex items-center justify-center">
            <Package className="h-12 w-12 text-primary/50" />
          </div>
        )}
        
        {/* Stock indicator badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={
            stock <= 0 
              ? "destructive" 
              : stock < 10 
                ? "secondary" 
                : "default"
          }
          className="shadow-sm">
            {stock <= 0 ? "Out of stock" : `${stock} ${unit || 'in stock'}`}
          </Badge>
        </div>
      </div>
      
      {/* Product Details */}
      <div className={cn("p-3", compact && "p-2")}>
        <div className="space-y-1 mb-2">
          <div className="flex justify-between items-start">
            <h3 className={cn(
              "font-semibold truncate",
              compact ? "text-sm" : "text-base"
            )} title={name}>
              {name}
            </h3>
            
            {/* Product ID/Barcode tooltip */}
            {barcode && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className={cn(
                      "text-muted-foreground flex-shrink-0",
                      compact ? "h-3 w-3 ml-1" : "h-4 w-4 ml-1"
                    )} />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Barcode: {barcode}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <p className={cn(
              "font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent",
              compact ? "text-base" : "text-lg"
            )}>
              {priceDisplay}
            </p>
            
            {barcode && !compact && (
              <p className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {barcode}
              </p>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        {stock > 0 && (
          <div className="flex justify-between items-center gap-2">
            {/* Quantity selector */}
            <div className="flex items-center border rounded-md overflow-hidden shadow-sm">
              <Button 
                variant="secondary" 
                size="icon" 
                className={cn(
                  "rounded-none",
                  compact ? "h-8 w-8" : "h-10 w-10"
                )}
                onClick={decrementQuantity}
              >
                <Minus className={compact ? "h-3 w-3" : "h-4 w-4"} />
              </Button>
              <span className={cn(
                "px-2 font-medium min-w-[2rem] text-center",
                compact ? "text-sm" : "text-base"
              )}>
                {quantity}
              </span>
              <Button 
                variant="secondary" 
                size="icon" 
                className={cn(
                  "rounded-none",
                  compact ? "h-8 w-8" : "h-10 w-10"
                )}
                onClick={incrementQuantity}
              >
                <Plus className={compact ? "h-3 w-3" : "h-4 w-4"} />
              </Button>
            </div>
            
            {/* Add to cart button */}
            <Button 
              size={compact ? "sm" : "default"}
              onClick={handleAddToCart}
              className={cn(
                "flex-shrink-0 shadow-sm",
                compact ? "w-8 h-8 p-0" : "px-3"
              )}
            >
              {compact ? (
                <Plus className="h-4 w-4" />
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Add
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}