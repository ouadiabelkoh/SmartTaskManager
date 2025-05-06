import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Package, Plus, Minus, Info } from "lucide-react";
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
}

interface ProductCardProps {
  product: Product;
  addToCart: (product: Product, quantity: number) => void;
  compact?: boolean; // For touch-optimized smaller cards
}

export function ProductCard({ product, addToCart, compact = false }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const { id, name, price, stock, image, barcode } = product;
  
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
  
  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-md h-full cursor-pointer select-none",
        stock <= 0 && "opacity-60",
        compact ? "max-w-[140px]" : ""
      )}
      onClick={() => stock > 0 && handleAddToCart()}
    >
      {/* Product Image */}
      <div className={cn(
        "bg-muted flex items-center justify-center relative",
        compact ? "h-24" : "h-36"
      )}>
        {image ? (
          <img 
            src={image} 
            alt={name} 
            className="h-full w-full object-cover" 
          />
        ) : (
          <Package className="h-12 w-12 text-muted-foreground" />
        )}
        
        {/* Stock indicator badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={
            stock <= 0 
              ? "destructive" 
              : stock < 10 
                ? "secondary" 
                : "default"
          }>
            {stock <= 0 ? "Out of stock" : `${stock} in stock`}
          </Badge>
        </div>
      </div>
      
      {/* Product Details */}
      <div className={cn("p-3", compact && "p-2")}>
        <div className="space-y-1 mb-2">
          <div className="flex justify-between items-start">
            <h3 className={cn(
              "font-medium truncate",
              compact ? "text-xs" : "text-sm"
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
                    <p>ID: {barcode}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          <p className={cn(
            "font-semibold text-foreground",
            compact ? "text-xs" : "text-sm"
          )}>
            ${typeof price === 'number' 
                ? price.toFixed(2) 
                : Number(price).toFixed(2)}
          </p>
          
          {barcode && !compact && (
            <p className="text-xs text-muted-foreground">ID: {barcode}</p>
          )}
        </div>
        
        {/* Action buttons */}
        {stock > 0 && (
          <div className="flex justify-between items-center">
            {/* Quantity selector */}
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "rounded-none",
                  compact ? "h-6 w-6" : "h-8 w-8"
                )}
                onClick={decrementQuantity}
              >
                <Minus className={compact ? "h-2 w-2" : "h-3 w-3"} />
              </Button>
              <span className={cn(
                "px-2 font-medium",
                compact ? "text-xs" : "text-sm"
              )}>
                {quantity}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "rounded-none",
                  compact ? "h-6 w-6" : "h-8 w-8"
                )}
                onClick={incrementQuantity}
              >
                <Plus className={compact ? "h-2 w-2" : "h-3 w-3"} />
              </Button>
            </div>
            
            {/* Add to cart button */}
            <Button 
              size="sm"
              onClick={handleAddToCart}
              className={cn(
                "flex-shrink-0",
                compact && "h-7 px-2 text-xs"
              )}
            >
              <Plus className={cn(
                compact ? "h-3 w-3" : "h-4 w-4",
                !compact && "mr-1"
              )} />
              {!compact && "Add"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}