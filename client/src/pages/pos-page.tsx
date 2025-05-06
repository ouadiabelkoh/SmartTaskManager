import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { OfflineAlert } from "@/components/layout/offline-alert";
import { PaymentModal } from "@/components/pos/payment-modal";
import { isOnline, initOnlineListeners } from "@/lib/offline-sync";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

// Import our new enhanced components
import { POSSidebar } from "@/components/pos/pos-sidebar";
import { EnhancedProductGrid } from "@/components/pos/enhanced-product-grid";
import { EnhancedCart } from "@/components/pos/enhanced-cart";

export type Product = {
  id: number;
  name: string;
  price: number;
  image?: string;
  category_id: number;
  stock: number;
  barcode?: string; // Added barcode field
};

export type CartItem = {
  id: number;
  product: Product;
  quantity: number;
};

export type Category = {
  id: number;
  name: string;
  image?: string; // Added image field for categories
};

export default function POSPage() {
  const isMobile = useMobile();
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showCart, setShowCart] = useState(!isMobile);
  const [isTouchOptimized, setIsTouchOptimized] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Check if device is touch-capable
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchOptimized(isTouchDevice);
    
    // On mobile, hide cart by default
    if (isMobile) {
      setShowCart(false);
    }
  }, [isMobile]);

  // Connect to online/offline listeners
  useEffect(() => {
    initOnlineListeners(
      () => setIsOffline(false),
      () => setIsOffline(true)
    );
  }, []);

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch products based on selected category
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", selectedCategory, searchQuery],
  });

  // Add item to cart with specific quantity
  const addToCart = (product: Product, quantity: number = 1) => {
    if (quantity <= 0) return;
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      } else {
        return [...prevCart, { id: Date.now(), product, quantity }];
      }
    });
    
    // On mobile, show cart after adding item
    if (isMobile && !showCart) {
      setShowCart(true);
    }
  };

  // Update cart item quantity
  const updateCartItemQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeCartItem(itemId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // Remove item from cart
  const removeCartItem = (itemId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Calculate cart total
  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity, 
    0
  );

  // Process payment
  const processPayment = async (paymentData: any) => {
    // Here we would normally send the payment to the server
    // and receive a confirmation
    
    // Create the order data
    const orderData = {
      items: cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.product.price * item.quantity
      })),
      total: cartTotal,
      payment: paymentData
    };
    
    // After successful payment, clear cart and close modal
    clearCart();
    setIsPaymentModalOpen(false);
    
    // Show success message (would be handled by toast)
    console.log("Payment processed successfully");
  };

  // Focus search input
  const focusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  // Toggle cart visibility on mobile
  const toggleCart = () => {
    setShowCart(prev => !prev);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Enhanced sidebar with category navigation */}
      <POSSidebar 
        categories={categories || []}
        isLoading={categoriesLoading}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onSearch={focusSearch}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header title="Point of Sale" />
        
        {isOffline && <OfflineAlert />}
        
        <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Products Section */}
          <div 
            className={cn(
              "flex-1 overflow-hidden transition-all duration-300",
              showCart && isMobile ? "hidden" : "block"
            )}
          >
            <div className="h-full p-4">
              <EnhancedProductGrid 
                products={products || []} 
                categories={categories || []}
                isLoading={productsLoading || categoriesLoading}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                addToCart={addToCart}
                isTouchOptimized={isTouchOptimized}
              />
            </div>
          </div>
          
          {/* Cart Section */}
          <div 
            className={cn(
              "border-t md:border-t-0 md:border-l border-border flex-shrink-0 bg-card transition-all duration-300",
              isMobile ? (showCart ? "w-full" : "hidden") : "w-96"
            )}
          >
            <EnhancedCart 
              cartItems={cart}
              updateQuantity={updateCartItemQuantity}
              removeItem={removeCartItem}
              clearCart={clearCart}
              cartTotal={cartTotal}
              openPaymentModal={() => setIsPaymentModalOpen(true)}
              isTouchOptimized={isTouchOptimized}
            />
          </div>
          
          {/* Mobile toggle cart button */}
          {isMobile && (
            <Button
              className={cn(
                "fixed bottom-4 right-4 rounded-full z-10 shadow-lg",
                cart.length > 0 && "has-badge"
              )}
              size="lg"
              variant={showCart ? "outline" : "default"}
              onClick={toggleCart}
              data-count={cart.length}
            >
              {showCart ? (
                <Search className="h-5 w-5" />
              ) : (
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-cart">
                    <circle cx="8" cy="21" r="1"/>
                    <circle cx="19" cy="21" r="1"/>
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                  </svg>
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cart.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                  )}
                </div>
              )}
            </Button>
          )}
        </main>
      </div>
      
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={cartTotal}
        onPayment={processPayment}
      />
      
      {/* The styles are now in global CSS */}
    </div>
  );
}
