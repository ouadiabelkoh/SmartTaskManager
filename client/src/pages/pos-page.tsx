import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { OfflineAlert } from "@/components/layout/offline-alert";
import { ProductGrid } from "@/components/pos/product-grid";
import { Cart } from "@/components/pos/cart";
import { PaymentModal } from "@/components/pos/payment-modal";
import { isOnline, initOnlineListeners } from "@/lib/offline-sync";

export type Product = {
  id: number;
  name: string;
  price: number;
  image?: string;
  category_id: number;
  stock: number;
};

export type CartItem = {
  id: number;
  product: Product;
  quantity: number;
};

export type Category = {
  id: number;
  name: string;
};

export default function POSPage() {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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

  // Add item to cart
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prevCart, { id: Date.now(), product, quantity: 1 }];
      }
    });
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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPath="/pos" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Point of Sale" />
        
        <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {isOffline && <OfflineAlert />}
          
          {/* Products Section */}
          <div className="flex-1 overflow-y-auto p-4 bg-background">
            <ProductGrid 
              products={products || []} 
              categories={categories || []}
              isLoading={productsLoading || categoriesLoading}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              addToCart={addToCart}
            />
          </div>
          
          {/* Cart Section */}
          <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-border flex flex-col bg-card">
            <Cart 
              cartItems={cart}
              updateQuantity={updateCartItemQuantity}
              removeItem={removeCartItem}
              clearCart={clearCart}
              cartTotal={cartTotal}
              openPaymentModal={() => setIsPaymentModalOpen(true)}
            />
          </div>
        </main>
      </div>
      
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={cartTotal}
        onPayment={processPayment}
      />
    </div>
  );
}
