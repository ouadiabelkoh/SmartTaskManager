import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Trash, 
  ShoppingCart, 
  PackagePlus, 
  CreditCard, 
  Trash2,
  Search,
  Plus,
  Minus,
  QrCode,
  User
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CartProps {
  cartItems: CartItem[];
  updateQuantity: (itemId: number, quantity: number) => void;
  removeItem: (itemId: number) => void;
  clearCart: () => void;
  cartTotal: number;
  openPaymentModal: () => void;
}

interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
  };
  quantity: number;
}

export function Cart({
  cartItems,
  updateQuantity,
  removeItem,
  clearCart,
  cartTotal,
  openPaymentModal
}: CartProps) {
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  // Search customer function (would be implemented with actual customer lookup)
  const searchCustomer = () => {
    console.log("Search customer");
  };
  
  // Scan barcode function (would be implemented with device's camera)
  const scanBarcode = () => {
    console.log("Scan barcode");
  };

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Current Sale
          </CardTitle>
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={searchCustomer}>
                    <User className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add customer</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={scanBarcode}>
                    <QrCode className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Scan barcode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {cartItems.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={clearCart}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear cart</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-0">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <PackagePlus className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">
              Add products from the list on the left
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {cartItems.map((item) => (
              <div key={item.id} className="p-4 flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <h3 className="font-medium text-sm text-foreground mb-1">{item.product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ${item.product.price.toFixed(2)} × {item.quantity} = ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                
                <div className="flex items-center">
                  <div className="flex items-center border rounded-md overflow-hidden mr-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-none"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          updateQuantity(item.id, value);
                        }
                      }}
                      className="w-12 h-8 text-center border-none"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-none"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex-col p-4 gap-4 border-t">
        <div className="w-full space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>$0.00</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span>$0.00</span>
          </div>
          <div className="flex justify-between font-medium text-base pt-2 border-t">
            <span>Total</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
        </div>
        
        <Button 
          className="w-full"
          size="lg"
          disabled={cartItems.length === 0}
          onClick={openPaymentModal}
        >
          <CreditCard className="mr-2 h-5 w-5" />
          Pay Now ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </Button>
      </CardFooter>
    </div>
  );
}
