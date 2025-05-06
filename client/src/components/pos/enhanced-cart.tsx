import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Trash, 
  ShoppingCart, 
  PackagePlus, 
  CreditCard, 
  Plus,
  Minus,
  QrCode,
  User,
  Receipt,
  ReceiptText,
  Save,
  Clock,
  ChevronRight
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
  category_id: number;
  stock: number;
  barcode?: string;
}

interface CartItem {
  id: number;
  product: Product;
  quantity: number;
}

interface EnhancedCartProps {
  cartItems: CartItem[];
  updateQuantity: (itemId: number, quantity: number) => void;
  removeItem: (itemId: number) => void;
  clearCart: () => void;
  cartTotal: number;
  openPaymentModal: () => void;
  isTouchOptimized?: boolean;
}

export function EnhancedCart({
  cartItems,
  updateQuantity,
  removeItem,
  clearCart,
  cartTotal,
  openPaymentModal,
  isTouchOptimized = false
}: EnhancedCartProps) {
  const [cartTab, setCartTab] = useState<"current" | "saved" | "recent">("current");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  // Calculate final total with tax and discount
  const discountAmount = (cartTotal * discount) / 100;
  const taxAmount = ((cartTotal - discountAmount) * tax) / 100;
  const finalTotal = cartTotal - discountAmount + taxAmount;
  
  // Scan barcode function (would be implemented with device's camera)
  const scanBarcode = () => {
    console.log("Scan barcode");
  };
  
  // Handle customer selection
  const selectCustomer = () => {
    console.log("Select customer");
  };
  
  // Handle save cart for later
  const saveCart = () => {
    console.log("Save cart for later");
  };
  
  // Responsive layout for touch screens
  const buttonSize = isTouchOptimized ? "default" : "sm";
  const iconSize = isTouchOptimized ? "h-5 w-5" : "h-4 w-4";
  
  return (
    <Card className="h-full flex flex-col shadow-none border-0 rounded-none">
      <CardHeader className="px-4 py-3 border-b flex-shrink-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            <span className="mr-2">Cart</span>
            {itemCount > 0 && (
              <Badge variant="secondary">{itemCount}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={selectCustomer}>
                    <User className={iconSize} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select customer</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={scanBarcode}>
                    <QrCode className={iconSize} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Scan barcode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {cartItems.length > 0 && cartTab === "current" && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={saveCart}>
                        <Save className={iconSize} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Save cart</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={clearCart}>
                        <Trash className={iconSize} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear cart</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <Tabs 
        value={cartTab} 
        onValueChange={(value) => setCartTab(value as "current" | "saved" | "recent")} 
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid grid-cols-3 sticky top-0 z-10">
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="flex-1 flex flex-col data-[state=active]:flex-1">
          <ScrollArea className="flex-1">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <PackagePlus className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Your cart is empty</p>
                <p className="text-sm text-muted-foreground">
                  Add products to get started
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-4 flex items-start">
                    {/* Product image */}
                    {item.product.image && (
                      <div className="h-12 w-12 bg-muted rounded-md overflow-hidden mr-3 flex-shrink-0">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          className="h-full w-full object-cover" 
                        />
                      </div>
                    )}
                    
                    {/* Product details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h3 className="font-medium text-sm text-foreground truncate mb-1" title={item.product.name}>
                          {item.product.name}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -mr-2 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            ${typeof item.product.price === 'number'
                              ? item.product.price.toFixed(2)
                              : Number(item.product.price).toFixed(2)} × {item.quantity}
                          </p>
                          <p className="font-medium text-sm">
                            ${(typeof item.product.price === 'number'
                              ? item.product.price * item.quantity
                              : Number(item.product.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center border rounded-md overflow-hidden">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-none"
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
                            className="w-10 h-7 text-center border-none p-0"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-none"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {/* Tax and discount controls */}
          {cartItems.length > 0 && (
            <div className="p-3 border-t border-border">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size={buttonSize} className="w-full justify-between">
                    <div className="flex items-center">
                      <ReceiptText className={cn(iconSize, "mr-2")} />
                      Tax & Discount
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      {(discount > 0 || tax > 0) && (
                        <span className="mr-1">
                          {discount > 0 && `-${discount}%`} 
                          {discount > 0 && tax > 0 && " · "} 
                          {tax > 0 && `+${tax}%`}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium">Tax & Discount</h4>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Discount (%)</label>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={discount} 
                        onChange={(e) => setDiscount(Number(e.target.value))}
                      />
                      {discount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Discount: ${typeof discountAmount === 'number' ? discountAmount.toFixed(2) : Number(discountAmount).toFixed(2)}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tax (%)</label>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={tax} 
                        onChange={(e) => setTax(Number(e.target.value))}
                      />
                      {tax > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Tax: ${taxAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
          
          {/* Cart totals and checkout button */}
          <CardFooter className="flex-col p-4 gap-4 border-t">
            <div className="w-full space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${typeof cartTotal === 'number' ? cartTotal.toFixed(2) : Number(cartTotal).toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount ({discount}%)</span>
                  <span className="text-destructive">-${typeof discountAmount === 'number' ? discountAmount.toFixed(2) : Number(discountAmount).toFixed(2)}</span>
                </div>
              )}
              
              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({tax}%)</span>
                  <span>${typeof taxAmount === 'number' ? taxAmount.toFixed(2) : Number(taxAmount).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-medium text-base pt-2 border-t">
                <span>Total</span>
                <span>${typeof finalTotal === 'number' ? finalTotal.toFixed(2) : Number(finalTotal).toFixed(2)}</span>
              </div>
            </div>
            
            <Button 
              className="w-full"
              size="lg"
              disabled={cartItems.length === 0}
              onClick={openPaymentModal}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Checkout {itemCount > 0 && `(${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}
            </Button>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="saved" className="flex-1 flex flex-col data-[state=active]:flex-1">
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Save className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No saved carts</p>
            <p className="text-sm text-muted-foreground">
              Save your current cart for later use
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="recent" className="flex-1 flex flex-col data-[state=active]:flex-1">
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No recent orders</p>
            <p className="text-sm text-muted-foreground">
              Your recent orders will appear here
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}