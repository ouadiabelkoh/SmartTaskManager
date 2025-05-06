import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { OfflineAlert } from "@/components/layout/offline-alert";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { LowStock } from "@/components/dashboard/low-stock";
import { initOnlineListeners, isOnline } from "@/lib/offline-sync";
import { connectWebSocket, on } from "@/lib/websocket";
import { BarChart4, ShoppingBag, FileText, UserPlus, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type DateRange = "today" | "yesterday" | "week" | "month" | "custom";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [, setLocation] = useLocation();

  // Connect websocket and set up online/offline listeners
  useEffect(() => {
    connectWebSocket();
    
    initOnlineListeners(
      () => setIsOffline(false),
      () => setIsOffline(true)
    );
    
    // Listen for realtime updates
    const unsubscribe = on("dashboard_update", (data) => {
      // Invalidate queries to refresh data
      // This would be implemented when we have more specific queries
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Stats data
  const { data: stats, isLoading: statsLoading } = useQuery<any[]>({
    queryKey: ["/api/dashboard/stats", dateRange],
    queryFn: () => {
      // Stats normally would come from the server
      // This is placeholder data until the backend is ready
      return [
        {
          id: 1,
          title: "Today's Sales",
          value: "$1,248.42",
          change: 12.5,
          changeType: "increase",
          icon: <ShoppingBag className="h-6 w-6" />,
          color: "primary"
        },
        {
          id: 2,
          title: "Orders",
          value: "36",
          change: 8.2,
          changeType: "increase",
          icon: <FileText className="h-6 w-6" />,
          color: "success"
        },
        {
          id: 3,
          title: "New Customers",
          value: "5",
          change: 0,
          changeType: "none",
          icon: <UserPlus className="h-6 w-6" />,
          color: "warning"
        },
        {
          id: 4,
          title: "Low Stock Items",
          value: "8",
          change: 3,
          changeType: "increase",
          icon: <AlertTriangle className="h-6 w-6" />,
          color: "destructive"
        }
      ];
    }
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPath="/" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Dashboard" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {isOffline && <OfflineAlert />}
          
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h1 className="text-2xl font-semibold text-foreground mb-2 md:mb-0">Store Overview</h1>
              <div className="flex items-center">
                <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="ml-2">
                  <BarChart4 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {statsLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <StatsCard key={i} isLoading={true} />
                ))
              ) : (
                stats?.map((stat) => (
                  <StatsCard
                    key={stat.id}
                    title={stat.title}
                    value={stat.value}
                    change={stat.change}
                    changeType={stat.changeType}
                    icon={stat.icon}
                    color={stat.color}
                  />
                ))
              )}
            </div>

            {/* Recent Sales & Low Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RecentSales className="lg:col-span-2" />
              <LowStock />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
