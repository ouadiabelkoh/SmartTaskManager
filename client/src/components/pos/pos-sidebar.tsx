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
  Home
} from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";

interface Category {
  id: number;
  name: string;
  image?: string; // Optional image URL for the category
}

interface POSSidebarProps {
  categories: Category[];
  isLoading: boolean;
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
  onSearch: () => void;
}

export function POSSidebar({
  categories,
  isLoading,
  selectedCategory,
  setSelectedCategory,
  onSearch
}: POSSidebarProps) {
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
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-40 md:hidden"
          onClick={toggleSidebar}
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
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
          "h-full bg-sidebar border-r border-sidebar-border flex flex-col shadow-sm transition-all duration-300 z-30",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isMobile ? "fixed" : "relative",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Sidebar header with logo */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between h-16">
          <div className="flex items-center overflow-hidden">
            <div className="h-8 w-8 rounded-md bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground mr-2 flex-shrink-0">
              <ShoppingCart className="h-5 w-5" />
            </div>
            {!collapsed && <h1 className="text-lg font-semibold text-sidebar-foreground truncate">Point of Sale</h1>}
          </div>
          {!isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleCollapse} className="flex-shrink-0">
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Quick action buttons */}
        <div className={cn("p-3 border-b border-sidebar-border", collapsed ? "flex justify-center" : "")}>
          <div className={cn("flex", collapsed ? "flex-col space-y-2" : "space-x-2")}>
            <Button 
              variant="default" 
              size={collapsed ? "icon" : "sm"}
              className="flex-1"
              onClick={() => handleCategoryClick(null)}
            >
              <LayoutGrid className="h-4 w-4" />
              {!collapsed && <span className="ml-2">All Items</span>}
            </Button>
            <Button 
              variant="outline" 
              size={collapsed ? "icon" : "sm"}
              className="flex-1"
              onClick={onSearch}
            >
              <Search className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Search</span>}
            </Button>
          </div>
        </div>

        {/* Categories section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-4 py-2">
            <p className={cn(
              "text-xs uppercase text-sidebar-foreground/60 font-semibold tracking-wider",
              collapsed && "text-center"
            )}>
              {collapsed ? "CAT." : "Categories"}
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className={cn("space-y-1 p-2", collapsed && "flex flex-col items-center")}>
              {isLoading ? (
                // Loading skeletons
                Array(5).fill(0).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-10 bg-muted/40 rounded-md animate-pulse",
                      collapsed ? "w-12" : "w-full"
                    )} 
                  />
                ))
              ) : categories.length === 0 ? (
                <div className={cn(
                  "flex flex-col items-center justify-center py-4 text-center text-muted-foreground",
                  collapsed && "px-2"
                )}>
                  <Tag className="h-8 w-8 mb-2" />
                  {!collapsed && <p className="text-sm">No categories</p>}
                </div>
              ) : (
                // Category list
                categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      collapsed && "justify-center px-2",
                      selectedCategory === category.id && "bg-sidebar-accent"
                    )}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    {category.image ? (
                      <div className="h-6 w-6 rounded-md overflow-hidden mr-2 flex-shrink-0">
                        <img 
                          src={category.image} 
                          alt={category.name} 
                          className="h-full w-full object-cover" 
                        />
                      </div>
                    ) : (
                      <Tag className={cn("h-4 w-4", !collapsed && "mr-2")} />
                    )}
                    {!collapsed && <span className="truncate">{category.name}</span>}
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Bottom menu items */}
        <div className="border-t border-sidebar-border p-2">
          <div className={cn("space-y-1", collapsed && "flex flex-col items-center")}>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start",
                collapsed && "justify-center px-2"
              )}
              onClick={() => window.location.href = '/'}
            >
              <Home className={cn("h-4 w-4", !collapsed && "mr-2")} />
              {!collapsed && <span>Dashboard</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start",
                collapsed && "justify-center px-2"
              )}
              onClick={() => window.location.href = '/reports'}
            >
              <BarChart className={cn("h-4 w-4", !collapsed && "mr-2")} />
              {!collapsed && <span>Reports</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start",
                collapsed && "justify-center px-2"
              )}
              onClick={() => window.location.href = '/settings'}
            >
              <Settings className={cn("h-4 w-4", !collapsed && "mr-2")} />
              {!collapsed && <span>Settings</span>}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}