import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  LayoutGrid,
  Search,
  Package,
  Tag,
  BarChart,
  Settings,
  Home,
  ShoppingBag,
  Plus,
  History,
  User
} from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";

interface Category {
  id: number;
  name: string;
  image?: string; // Optional image URL for the category
}

interface TouchOptimizedSidebarProps {
  categories: Category[];
  isLoading: boolean;
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
  onSearch: () => void;
}

export function TouchOptimizedSidebar({
  categories,
  isLoading,
  selectedCategory,
  setSelectedCategory,
  onSearch
}: TouchOptimizedSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  useEffect(() => {
    // Close sidebar by default on mobile
    if (isMobile && isOpen) {
      setIsOpen(false);
    } else if (!isMobile && !isOpen) {
      setIsOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsOpen(prev => !prev);
  };

  const toggleCollapse = () => {
    setCollapsed(prev => !prev);
  };

  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    // On mobile, close sidebar after selection
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile sidebar toggle button - only visible on mobile */}
      {isMobile && (
        <Button
          variant="secondary"
          size="lg"
          className="fixed top-4 left-4 z-40 md:hidden shadow-md rounded-full h-12 w-12 p-0"
          onClick={toggleSidebar}
        >
          {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
        </Button>
      )}

      {/* Sidebar overlay for mobile - only visible when sidebar is open on mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Main sidebar container */}
      <div
        className={cn(
          "h-full bg-sidebar border-r border-sidebar-border flex flex-col shadow-md transition-all duration-300 z-30",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isMobile ? "fixed" : "relative",
          collapsed ? "w-[80px]" : "w-[240px]"
        )}
      >
        {/* Sidebar header with logo */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between h-[70px]">
          <div className="flex items-center overflow-hidden">
            <div className="h-10 w-10 rounded-md bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center text-primary-foreground mr-3 flex-shrink-0 shadow-sm">
              <ShoppingCart className="h-6 w-6" />
            </div>
            {!collapsed && <h1 className="text-lg font-bold text-sidebar-foreground truncate bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">نقاط البيع</h1>}
          </div>
          {!isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleCollapse} className="flex-shrink-0">
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Quick action buttons */}
        <div className={cn("p-3 border-b border-sidebar-border grid gap-2", 
          collapsed ? "grid-cols-1" : "grid-cols-2"
        )}>
          <Button 
            variant="default" 
            size={collapsed ? "icon" : "default"}
            className={cn(
              "h-14 shadow-sm",
              collapsed && "w-14"
            )}
            onClick={() => handleCategoryClick(null)}
          >
            <LayoutGrid className={cn("h-5 w-5", !collapsed && "mr-2")} />
            {!collapsed && <span>All Items</span>}
          </Button>
          <Button 
            variant="outline" 
            size={collapsed ? "icon" : "default"}
            className={cn(
              "h-14 shadow-sm",
              collapsed && "w-14"
            )}
            onClick={onSearch}
          >
            <Search className={cn("h-5 w-5", !collapsed && "mr-2")} />
            {!collapsed && <span>Search</span>}
          </Button>
          <Button 
            variant="outline" 
            size={collapsed ? "icon" : "default"}
            className={cn(
              "h-14 shadow-sm",
              collapsed && "w-14",
              collapsed ? "" : "col-span-2"
            )}
            onClick={() => window.location.href = '/products/new'}
          >
            <Plus className={cn("h-5 w-5", !collapsed && "mr-2")} />
            {!collapsed && <span>New Product</span>}
          </Button>
        </div>

        {/* Categories section */}
        <div className="flex-1 overflow-hidden">
          <div className="px-4 py-3 border-b border-sidebar-border">
            <h2 className={cn(
              "font-semibold text-sidebar-foreground/80",
              collapsed ? "sr-only" : "text-sm uppercase tracking-wider"
            )}>
              Categories
            </h2>
          </div>
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {isLoading ? (
                // Loading skeleton
                [...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse mb-1" />
                ))
              ) : categories.length === 0 ? (
                // No categories message
                <div className={cn(
                  "text-center py-4 text-sidebar-foreground/50",
                  collapsed && "sr-only"
                )}>
                  <Package className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm">No categories available</p>
                </div>
              ) : (
                // List of categories
                categories.map(category => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start font-medium h-12 text-base",
                      collapsed && "justify-center p-2"
                    )}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    {category.image ? (
                      <div className="h-6 w-6 rounded-full overflow-hidden mr-2 flex-shrink-0 bg-primary/10">
                        <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <Tag className={cn("flex-shrink-0", collapsed ? "h-6 w-6" : "h-5 w-5 mr-3")} />
                    )}
                    {!collapsed && <span className="truncate">{category.name}</span>}
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Bottom menu items */}
        <div className="border-t border-sidebar-border p-3">
          <div className={cn("grid gap-2", collapsed ? "grid-cols-1" : "grid-cols-2")}>
            <Button 
              variant="ghost" 
              className={cn(
                "h-12 justify-start shadow-sm",
                collapsed && "justify-center w-full p-0"
              )}
              onClick={() => window.location.href = '/'}
            >
              <Home className={cn("h-5 w-5", !collapsed && "mr-2")} />
              {!collapsed && <span>Dashboard</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "h-12 justify-start shadow-sm",
                collapsed && "justify-center w-full p-0"
              )}
              onClick={() => window.location.href = '/reports'}
            >
              <BarChart className={cn("h-5 w-5", !collapsed && "mr-2")} />
              {!collapsed && <span>Reports</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "h-12 justify-start shadow-sm",
                collapsed && "justify-center w-full p-0"
              )}
              onClick={() => window.location.href = '/orders'}
            >
              <History className={cn("h-5 w-5", !collapsed && "mr-2")} />
              {!collapsed && <span>Orders</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "h-12 justify-start shadow-sm",
                collapsed && "justify-center w-full p-0"
              )}
              onClick={() => window.location.href = '/settings'}
            >
              <Settings className={cn("h-5 w-5", !collapsed && "mr-2")} />
              {!collapsed && <span>Settings</span>}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}