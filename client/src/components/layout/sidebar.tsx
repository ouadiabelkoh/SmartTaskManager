import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingBag, 
  LayoutDashboard, 
  ShoppingCart,
  Archive, 
  Tag, 
  Layers,
  FileText, 
  UserCheck, 
  BarChart, 
  Users, 
  Users2,
  Settings, 
  LogOut,
  Wifi,
  WifiOff,
  X,
  Menu
} from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { isOnline } from "@/lib/offline-sync";

interface SidebarProps {
  currentPath: string;
}

export function Sidebar({ currentPath }: SidebarProps) {
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [online, setOnline] = useState(isOnline());
  const isMobile = useMobile();

  useEffect(() => {
    // Add event listeners for online/offline state
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initialize sidebar state
    setSidebarOpen(!isMobile);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isMobile]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/auth');
  };

  // Sidebar item definitions
  const mainMenuItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { path: "/pos", label: "Point of Sale", icon: <ShoppingCart className="h-5 w-5" /> },
  ];

  const catalogItems = [
    { path: "/products", label: "Products", icon: <Archive className="h-5 w-5" /> },
    { path: "/categories", label: "Categories", icon: <Tag className="h-5 w-5" /> },
    { path: "/inventory", label: "Inventory", icon: <Layers className="h-5 w-5" /> },
  ];

  const salesItems = [
    { path: "/orders", label: "Orders", icon: <FileText className="h-5 w-5" /> },
    { path: "/people", label: "People", icon: <Users2 className="h-5 w-5" /> },
    { path: "/customers", label: "Customers", icon: <UserCheck className="h-5 w-5" /> },
  ];

  const reportItems = [
    { path: "/reports", label: "Sales Reports", icon: <BarChart className="h-5 w-5" /> },
  ];

  const settingsItems = [
    { path: "/users", label: "Users & Permissions", icon: <Users className="h-5 w-5" /> },
    { path: "/settings", label: "System Settings", icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <>
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-4 left-4 z-40 md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <div 
        className={cn(
          "sidebar w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col shadow-sm z-50",
          isMobile && "fixed",
          isMobile && sidebarOpen ? "left-0" : isMobile && "-left-full"
        )}
      >
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground mr-2">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">RetailPOS</h1>
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-primary mr-2">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-sidebar-foreground">{user?.username || "User"}</h3>
              <p className="text-xs text-sidebar-foreground/60">Store Manager</p>
            </div>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-grow">
          <nav className="mt-2">
            <div className="px-4 py-2">
              <p className="text-xs uppercase text-sidebar-foreground/60 font-semibold tracking-wider">Main Menu</p>
            </div>
            
            {mainMenuItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a 
                  className={cn(
                    "sidebar-item flex items-center px-4 py-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent",
                    currentPath === item.path && "active"
                  )}
                >
                  <span className={cn(
                    "text-lg mr-3", 
                    currentPath === item.path ? "text-sidebar-primary" : "text-sidebar-foreground/60"
                  )}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>
              </Link>
            ))}
            
            <div className="px-4 py-2 mt-2">
              <p className="text-xs uppercase text-sidebar-foreground/60 font-semibold tracking-wider">Catalog</p>
            </div>
            
            {catalogItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a 
                  className={cn(
                    "sidebar-item flex items-center px-4 py-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent",
                    currentPath === item.path && "active"
                  )}
                >
                  <span className={cn(
                    "text-lg mr-3", 
                    currentPath === item.path ? "text-sidebar-primary" : "text-sidebar-foreground/60"
                  )}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>
              </Link>
            ))}
            
            <div className="px-4 py-2 mt-2">
              <p className="text-xs uppercase text-sidebar-foreground/60 font-semibold tracking-wider">Sales</p>
            </div>
            
            {salesItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a 
                  className={cn(
                    "sidebar-item flex items-center px-4 py-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent",
                    currentPath === item.path && "active"
                  )}
                >
                  <span className={cn(
                    "text-lg mr-3", 
                    currentPath === item.path ? "text-sidebar-primary" : "text-sidebar-foreground/60"
                  )}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>
              </Link>
            ))}
            
            <div className="px-4 py-2 mt-2">
              <p className="text-xs uppercase text-sidebar-foreground/60 font-semibold tracking-wider">Reports</p>
            </div>
            
            {reportItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a 
                  className={cn(
                    "sidebar-item flex items-center px-4 py-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent",
                    currentPath === item.path && "active"
                  )}
                >
                  <span className={cn(
                    "text-lg mr-3", 
                    currentPath === item.path ? "text-sidebar-primary" : "text-sidebar-foreground/60"
                  )}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>
              </Link>
            ))}
            
            <div className="px-4 py-2 mt-2">
              <p className="text-xs uppercase text-sidebar-foreground/60 font-semibold tracking-wider">Settings</p>
            </div>
            
            {settingsItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a 
                  className={cn(
                    "sidebar-item flex items-center px-4 py-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent",
                    currentPath === item.path && "active"
                  )}
                >
                  <span className={cn(
                    "text-lg mr-3", 
                    currentPath === item.path ? "text-sidebar-primary" : "text-sidebar-foreground/60"
                  )}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center text-sm">
            <div className={cn(
              "inline-flex items-center justify-center p-1 rounded-full mr-2",
              online ? "bg-success" : "bg-destructive"
            )}>
              <div className="h-2 w-2 rounded-full bg-white"></div>
            </div>
            <span>{online ? "Online - Data synced" : "Offline - Changes will sync when online"}</span>
          </div>
          <Button 
            variant="ghost" 
            className="mt-4 flex items-center w-full text-sm justify-start text-sidebar-foreground hover:text-destructive"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </Button>
        </div>
      </div>
    </>
  );
}
