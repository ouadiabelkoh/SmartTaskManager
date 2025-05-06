import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { OfflineAlert } from "@/components/layout/offline-alert";
import { isOnline } from "@/lib/offline-sync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  BarChart, 
  LineChart,
  PieChart, 
  Download, 
  FileDown,
  FileSpreadsheet,
  FileText,
  Calendar as CalendarIcon,
  Printer,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Search,
  Filter,
  Eye,
  Users,
  User,
  CreditCard,
  Wallet,
  BanknoteIcon,
  ArrowDown,
  ArrowUp,
  Loader2
} from "lucide-react";
import { 
  format, 
  startOfDay, 
  startOfMonth, 
  startOfWeek, 
  subDays, 
  endOfDay,
  endOfMonth,
  endOfWeek
} from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Type definitions
type DateRangeType = "today" | "yesterday" | "this_week" | "this_month" | "custom";
type ReportTab = "summary" | "products" | "categories" | "customers" | "payments";
type PaymentMethod = "cash" | "card" | "credit" | "other";
type OrderStatus = "completed" | "cancelled" | "pending" | "processing";
type SortDirection = "asc" | "desc";

// Sale item interface for reports
interface SaleItem {
  id: number;
  order_number: string;
  customer_name: string | null;
  total: number;
  payment_method: string;
  cashier_name: string;
  status: OrderStatus;
  created_at: string;
}

// Report filter state interface
interface ReportFilters {
  cashier?: string;
  paymentMethod?: PaymentMethod;
  productId?: number;
  categoryId?: number;
  customerId?: number;
  status?: OrderStatus;
  sortBy: string;
  sortDir: SortDirection;
  searchQuery: string;
}

export default function ReportsPage() {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [activeTab, setActiveTab] = useState<ReportTab>("summary");
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>("this_week");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: new Date(),
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    sortBy: "created_at",
    sortDir: "desc",
    searchQuery: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleItem | null>(null);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  
  // Fetch data from API based on date range and filters
  const { data: reportData, isLoading: isLoadingReport, refetch: refetchReports } = useQuery({
    queryKey: [
      `/api/reports/sales`, 
      selectedDateRange?.from?.toISOString(), 
      selectedDateRange?.to?.toISOString(),
      filters,
    ],
  });
  
  // Fetch additional data needed for filters
  const { data: cashiers } = useQuery({ queryKey: ["/api/users"] });
  const { data: products } = useQuery({ queryKey: ["/api/products"] });
  const { data: categories } = useQuery({ queryKey: ["/api/categories"] });
  const { data: customers } = useQuery({ queryKey: ["/api/customers"] });
  
  // Update date range when selection changes
  const handleDateRangeTypeChange = (type: DateRangeType) => {
    setDateRangeType(type);
    const now = new Date();
    
    switch (type) {
      case "today":
        setSelectedDateRange({
          from: startOfDay(now),
          to: endOfDay(now)
        });
        break;
      case "yesterday": {
        const yesterday = subDays(now, 1);
        setSelectedDateRange({
          from: startOfDay(yesterday),
          to: endOfDay(yesterday)
        });
        break;
      }
      case "this_week":
        setSelectedDateRange({
          from: startOfWeek(now, { weekStartsOn: 1 }),
          to: now
        });
        break;
      case "this_month":
        setSelectedDateRange({
          from: startOfMonth(now),
          to: now
        });
        break;
      case "custom":
        setIsDatePickerOpen(true);
        break;
    }
  };
  
  // Apply custom date range
  const applyCustomDateRange = (range: DateRange | undefined) => {
    if (range?.from) {
      setSelectedDateRange(range);
      setIsDatePickerOpen(false);
    }
  };
  
  // Format date range for display
  const getDateRangeText = () => {
    if (!selectedDateRange?.from) return "";
    
    if (dateRangeType === "today") {
      return format(selectedDateRange.from, "MMMM d, yyyy");
    } else if (dateRangeType === "yesterday") {
      return format(selectedDateRange.from, "MMMM d, yyyy");
    } else if (selectedDateRange.to) {
      return `${format(selectedDateRange.from, "MMM d, yyyy")} - ${format(selectedDateRange.to, "MMM d, yyyy")}`;
    } else {
      return format(selectedDateRange.from, "MMM d, yyyy");
    }
  };

  // Navigate to previous period
  const goToPreviousPeriod = () => {
    if (!selectedDateRange?.from) return;
    
    const from = selectedDateRange.from;
    const to = selectedDateRange.to || from;
    const diff = to.getTime() - from.getTime();
    const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    
    const newFrom = subDays(from, diffDays);
    const newTo = subDays(to, diffDays);
    
    setSelectedDateRange({
      from: newFrom,
      to: newTo
    });
  };
  
  // Navigate to next period
  const goToNextPeriod = () => {
    if (!selectedDateRange?.from) return;
    
    const from = selectedDateRange.from;
    const to = selectedDateRange.to || from;
    const diff = to.getTime() - from.getTime();
    const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    
    const now = new Date();
    let newFrom = new Date(from.getTime() + diff + (1000 * 3600 * 24));
    let newTo = new Date(to.getTime() + diff + (1000 * 3600 * 24));
    
    // Don't go beyond today
    if (newTo > now) {
      newTo = now;
      newFrom = subDays(now, diffDays);
    }
    
    setSelectedDateRange({
      from: newFrom,
      to: newTo
    });
  };
  
  // Summary data for cards at the top of the report
  const summaryData = {
    totalSales: reportData?.totalSales || 0,
    totalSalesChange: 12.5, // Change percentage from previous period
    totalOrders: reportData?.totalOrders || 0,
    totalOrdersChange: 8.2,
    totalItems: reportData?.totalItems || 0,
    totalItemsChange: 15.3,
    avgOrderValue: reportData?.avgOrderValue || 0,
    avgOrderValueChange: 3.1,
    paymentMethods: {
      cash: reportData?.paymentMethods?.cash || 35,
      card: reportData?.paymentMethods?.card || 60,
      credit: reportData?.paymentMethods?.credit || 5,
      other: reportData?.paymentMethods?.other || 0,
    }
  };
  
  // Chart data for sales over time
  const salesChartData = {
    labels: reportData?.dailySales?.map((sale: any) => format(new Date(sale.date), "MMM d")) || [],
    datasets: [
      {
        label: 'Sales ($)',
        data: reportData?.dailySales?.map((sale: any) => sale.amount) || [],
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsla(var(--primary), 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Orders',
        data: reportData?.dailySales?.map((sale: any) => sale.count) || [],
        borderColor: 'hsl(var(--secondary))',
        backgroundColor: 'hsla(var(--secondary), 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };
  
  // Chart data for top products
  const productsChartData = {
    labels: reportData?.topProducts?.map((product: any) => product.name) || [],
    datasets: [
      {
        label: 'Items Sold',
        data: reportData?.topProducts?.map((product: any) => product.quantity) || [],
        backgroundColor: 'hsla(var(--primary), 0.7)',
        borderColor: 'hsl(var(--primary))',
        borderWidth: 1,
      },
    ],
  };
  
  // Chart data for categories
  const categoriesChartData = {
    labels: reportData?.categoryBreakdown?.map((cat: any) => cat.name) || [],
    datasets: [
      {
        label: 'Sales by Category',
        data: reportData?.categoryBreakdown?.map((cat: any) => cat.amount) || [],
        backgroundColor: [
          'hsla(var(--primary), 0.7)',
          'hsla(var(--secondary), 0.7)',
          'hsla(var(--accent), 0.7)',
          'hsla(var(--muted), 0.7)',
          'hsla(var(--card), 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Chart data for payment methods
  const paymentMethodsChartData = {
    labels: ['Cash', 'Card', 'Credit', 'Other'],
    datasets: [
      {
        label: 'Payment Methods',
        data: [
          summaryData.paymentMethods.cash,
          summaryData.paymentMethods.card,
          summaryData.paymentMethods.credit,
          summaryData.paymentMethods.other,
        ],
        backgroundColor: [
          'hsla(var(--success), 0.7)',
          'hsla(var(--primary), 0.7)',
          'hsla(var(--warning), 0.7)',
          'hsla(var(--muted), 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Sales ($)',
        },
        ticks: {
          callback: (value: any) => `$${value}`
        }
      },
      y1: {
        beginAtZero: true,
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Orders',
        },
      },
    },
  };
  
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };
  
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };
  
  // Sample sales data for the table
  const salesData: SaleItem[] = reportData?.sales || [
    {
      id: 1,
      order_number: '00125',
      customer_name: 'Ahmed Mohamed',
      total: 85.00,
      payment_method: 'Cash',
      cashier_name: 'Youssef',
      status: 'completed',
      created_at: '2025-05-06T10:30:00Z',
    },
    {
      id: 2,
      order_number: '00126',
      customer_name: 'Sara Hassan',
      total: 120.50,
      payment_method: 'Card',
      cashier_name: 'Youssef',
      status: 'completed',
      created_at: '2025-05-06T11:15:00Z',
    },
    {
      id: 3,
      order_number: '00127',
      customer_name: 'Mohammed Ali',
      total: 45.75,
      payment_method: 'Cash',
      cashier_name: 'Aisha',
      status: 'completed',
      created_at: '2025-05-06T12:45:00Z',
    },
    {
      id: 4,
      order_number: '00128',
      customer_name: 'Fatima Khalid',
      total: 210.25,
      payment_method: 'Credit',
      cashier_name: 'Youssef',
      status: 'pending',
      created_at: '2025-05-06T13:20:00Z',
    },
    {
      id: 5,
      order_number: '00129',
      customer_name: 'Hassan Ibrahim',
      total: 65.30,
      payment_method: 'Card',
      cashier_name: 'Aisha',
      status: 'cancelled',
      created_at: '2025-05-06T14:10:00Z',
    }
  ];
  
  // Filter sales data based on search query and filters
  const filteredSales = salesData.filter(sale => {
    // Match search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesOrderNumber = sale.order_number.toLowerCase().includes(query);
      const matchesCustomer = sale.customer_name?.toLowerCase()?.includes(query) || false;
      const matchesCashier = sale.cashier_name.toLowerCase().includes(query);
      
      if (!matchesOrderNumber && !matchesCustomer && !matchesCashier) {
        return false;
      }
    }
    
    // Match status filter
    if (filters.status && sale.status !== filters.status) {
      return false;
    }
    
    // Match payment method filter
    if (filters.paymentMethod && sale.payment_method.toLowerCase() !== filters.paymentMethod) {
      return false;
    }
    
    // Match cashier filter
    if (filters.cashier && sale.cashier_name !== filters.cashier) {
      return false;
    }
    
    return true;
  });
  
  // Sort filtered sales
  const sortedSales = [...filteredSales].sort((a, b) => {
    const direction = filters.sortDir === 'asc' ? 1 : -1;
    
    switch (filters.sortBy) {
      case 'order_number':
        return direction * a.order_number.localeCompare(b.order_number);
      case 'customer_name':
        return direction * ((a.customer_name || '') > (b.customer_name || '') ? 1 : -1);
      case 'total':
        return direction * (a.total - b.total);
      case 'created_at':
        return direction * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      default:
        return 0;
    }
  });
  
  // Update sort order
  const updateSort = (column: string) => {
    if (filters.sortBy === column) {
      setFilters({
        ...filters,
        sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setFilters({
        ...filters,
        sortBy: column,
        sortDir: 'desc'
      });
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      sortBy: 'created_at',
      sortDir: 'desc',
      searchQuery: '',
    });
  };
  
  // View sale details
  const viewSaleDetails = (sale: SaleItem) => {
    setSelectedSale(sale);
    setShowSaleDetails(true);
  };
  
  // Export reports
  const exportToExcel = () => {
    // This would generate and download an Excel file with the report data
    console.log('Exporting to Excel...');
  };
  
  const exportToPDF = () => {
    // This would generate and download a PDF file with the report data
    console.log('Exporting to PDF...');
  };
  
  // Print report
  const printReport = () => {
    window.print();
  };
  
  // Refresh report data
  const refreshData = () => {
    refetchReports();
  };
  
  // Get status badge class based on status
  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case "completed":
        return "bg-success/20 text-success";
      case "processing":
        return "bg-primary/20 text-primary";
      case "pending":
        return "bg-warning/20 text-warning";
      case "cancelled":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPath="/reports" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Reports" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background print:p-0">
          {isOffline && <OfflineAlert />}
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
            <h1 className="text-2xl font-semibold text-foreground">Sales Reports</h1>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              {/* Date Range Selector */}
              <div className="flex items-center gap-2">
                <Select value={dateRangeType} onValueChange={(value) => handleDateRangeTypeChange(value as DateRangeType)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                
                {dateRangeType === "custom" && (
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDateRange?.from ? (
                          selectedDateRange.to ? (
                            <>
                              {format(selectedDateRange.from, "LLL dd, y")} -{" "}
                              {format(selectedDateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(selectedDateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        initialFocus
                        mode="range"
                        defaultMonth={selectedDateRange?.from}
                        selected={selectedDateRange}
                        onSelect={applyCustomDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              
              {/* Export and Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="icon" title="Export to Excel" onClick={exportToExcel}>
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Export to PDF" onClick={exportToPDF}>
                  <FileText className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Print Report" onClick={printReport}>
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Refresh Data" onClick={refreshData}>
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Date Navigation */}
          <div className="mb-6 flex justify-between items-center print:hidden">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={dateRangeType === "custom"}
                onClick={goToPreviousPeriod}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{getDateRangeText()}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={dateRangeType === "custom"}
                onClick={goToNextPeriod}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportTab)} className="print:hidden">
            <TabsList className="w-full justify-start border-b rounded-none mb-8 overflow-x-auto">
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Top Products
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Payment Methods
              </TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Customer Insights
              </TabsTrigger>
            </TabsList>
            
            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${summaryData.totalSales.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className={summaryData.totalSalesChange >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>
                        {summaryData.totalSalesChange >= 0 ? "↑" : "↓"} {Math.abs(summaryData.totalSalesChange)}%
                      </span>{" "}
                      from previous period
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summaryData.totalOrders}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className={summaryData.totalOrdersChange >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>
                        {summaryData.totalOrdersChange >= 0 ? "↑" : "↓"} {Math.abs(summaryData.totalOrdersChange)}%
                      </span>{" "}
                      from previous period
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Items Sold</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summaryData.totalItems}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className={summaryData.totalItemsChange >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>
                        {summaryData.totalItemsChange >= 0 ? "↑" : "↓"} {Math.abs(summaryData.totalItemsChange)}%
                      </span>{" "}
                      from previous period
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Average Order Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${summaryData.avgOrderValue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className={summaryData.avgOrderValueChange >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>
                        {summaryData.avgOrderValueChange >= 0 ? "↑" : "↓"} {Math.abs(summaryData.avgOrderValueChange)}%
                      </span>{" "}
                      from previous period
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Daily Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] lg:h-[400px]">
                      {isLoadingReport ? (
                        <Skeleton className="w-full h-full" />
                      ) : (
                        <Line options={lineChartOptions} data={salesChartData} />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {isLoadingReport ? (
                        <Skeleton className="w-full h-full" />
                      ) : (
                        <Doughnut options={pieChartOptions} data={paymentMethodsChartData} />
                      )}
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <span className="w-3 h-3 rounded-full bg-success mr-2"></span>
                          <span>Cash</span>
                        </div>
                        <div className="font-medium">${(summaryData.totalSales * summaryData.paymentMethods.cash / 100).toFixed(2)} ({summaryData.paymentMethods.cash}%)</div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <span className="w-3 h-3 rounded-full bg-primary mr-2"></span>
                          <span>Card</span>
                        </div>
                        <div className="font-medium">${(summaryData.totalSales * summaryData.paymentMethods.card / 100).toFixed(2)} ({summaryData.paymentMethods.card}%)</div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <span className="w-3 h-3 rounded-full bg-warning mr-2"></span>
                          <span>Credit</span>
                        </div>
                        <div className="font-medium">${(summaryData.totalSales * summaryData.paymentMethods.credit / 100).toFixed(2)} ({summaryData.paymentMethods.credit}%)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Sales Detail Table */}
              <Card>
                <CardHeader className="pb-0">
                  <div className="flex justify-between items-center">
                    <CardTitle>Sales Details</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search orders..."
                          className="pl-8 w-[200px] lg:w-[300px]"
                          value={filters.searchQuery}
                          onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters {showFilters ? "↑" : "↓"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Filter Controls */}
                {showFilters && (
                  <div className="px-6 pb-2 pt-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Status</label>
                      <Select 
                        value={filters.status} 
                        onValueChange={(value) => setFilters({...filters, status: value as OrderStatus})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Statuses</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Payment Method</label>
                      <Select 
                        value={filters.paymentMethod} 
                        onValueChange={(value) => setFilters({...filters, paymentMethod: value as PaymentMethod})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Methods" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Methods</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Cashier</label>
                      <Select 
                        value={filters.cashier} 
                        onValueChange={(value) => setFilters({...filters, cashier: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Cashiers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Cashiers</SelectItem>
                          <SelectItem value="Youssef">Youssef</SelectItem>
                          <SelectItem value="Aisha">Aisha</SelectItem>
                          <SelectItem value="Mohammed">Mohammed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={resetFilters}
                        className="w-full"
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </div>
                )}
                
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead 
                            className="cursor-pointer"
                            onClick={() => updateSort('order_number')}
                          >
                            Invoice # {filters.sortBy === 'order_number' && (
                              <span>{filters.sortDir === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer"
                            onClick={() => updateSort('created_at')}
                          >
                            Date {filters.sortBy === 'created_at' && (
                              <span>{filters.sortDir === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer"
                            onClick={() => updateSort('customer_name')}
                          >
                            Customer {filters.sortBy === 'customer_name' && (
                              <span>{filters.sortDir === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer text-right"
                            onClick={() => updateSort('total')}
                          >
                            Total {filters.sortBy === 'total' && (
                              <span>{filters.sortDir === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Cashier</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingReport ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                              <TableCell colSpan={8}>
                                <Skeleton className="h-8 w-full" />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : sortedSales.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                              No sales found matching the criteria.
                            </TableCell>
                          </TableRow>
                        ) : (
                          sortedSales.map((sale) => (
                            <TableRow key={sale.id}>
                              <TableCell className="font-medium">{sale.order_number}</TableCell>
                              <TableCell>{format(new Date(sale.created_at), "MMM d, yyyy")}</TableCell>
                              <TableCell>{sale.customer_name || "Guest"}</TableCell>
                              <TableCell className="text-right">${sale.total.toFixed(2)}</TableCell>
                              <TableCell>
                                {sale.payment_method === 'Cash' ? (
                                  <div className="flex items-center">
                                    <BanknoteIcon className="h-4 w-4 mr-1 text-success" />
                                    <span>Cash</span>
                                  </div>
                                ) : sale.payment_method === 'Card' ? (
                                  <div className="flex items-center">
                                    <CreditCard className="h-4 w-4 mr-1 text-primary" />
                                    <span>Card</span>
                                  </div>
                                ) : sale.payment_method === 'Credit' ? (
                                  <div className="flex items-center">
                                    <User className="h-4 w-4 mr-1 text-warning" />
                                    <span>Credit</span>
                                  </div>
                                ) : (
                                  sale.payment_method
                                )}
                              </TableCell>
                              <TableCell>{sale.cashier_name}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(sale.status)}`}>
                                  {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => viewSaleDetails(sale)}
                                  className="h-8 px-2"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      {isLoadingReport ? (
                        <Skeleton className="w-full h-full" />
                      ) : (
                        <Bar options={barChartOptions} data={productsChartData} />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Products Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {isLoadingReport ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <div key={index} className="p-4">
                            <Skeleton className="h-8 w-full" />
                          </div>
                        ))
                      ) : (
                        reportData?.topProducts?.map((product: any, index: number) => (
                          <div key={index} className="p-4 flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-sm text-muted-foreground">{product.quantity} units sold</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${product.revenue.toFixed(2)}</p>
                              <p className={`text-xs ${product.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {product.change >= 0 ? '↑' : '↓'} {Math.abs(product.change)}%
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Sales by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      {isLoadingReport ? (
                        <Skeleton className="w-full h-full" />
                      ) : (
                        <Pie options={pieChartOptions} data={categoriesChartData} />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Category Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {isLoadingReport ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <div key={index} className="p-4">
                            <Skeleton className="h-8 w-full" />
                          </div>
                        ))
                      ) : (
                        reportData?.categoryBreakdown?.map((category: any, index: number) => (
                          <div key={index} className="p-4 flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{category.name}</h3>
                              <p className="text-sm text-muted-foreground">{category.percentage}% of total sales</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${category.amount.toFixed(2)}</p>
                              <p className={`text-xs ${category.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {category.change >= 0 ? '↑' : '↓'} {Math.abs(category.change)}%
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Payment Methods Tab */}
            <TabsContent value="payments" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      {isLoadingReport ? (
                        <Skeleton className="w-full h-full" />
                      ) : (
                        <Doughnut options={pieChartOptions} data={paymentMethodsChartData} />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Cash</span>
                          <span>{summaryData.paymentMethods.cash}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success"
                            style={{ width: `${summaryData.paymentMethods.cash}%` }}
                          />
                        </div>
                        <div className="text-sm font-medium">
                          ${(summaryData.totalSales * summaryData.paymentMethods.cash / 100).toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Card</span>
                          <span>{summaryData.paymentMethods.card}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${summaryData.paymentMethods.card}%` }}
                          />
                        </div>
                        <div className="text-sm font-medium">
                          ${(summaryData.totalSales * summaryData.paymentMethods.card / 100).toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Credit</span>
                          <span>{summaryData.paymentMethods.credit}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-warning"
                            style={{ width: `${summaryData.paymentMethods.credit}%` }}
                          />
                        </div>
                        <div className="text-sm font-medium">
                          ${(summaryData.totalSales * summaryData.paymentMethods.credit / 100).toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Other</span>
                          <span>{summaryData.paymentMethods.other}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-muted-foreground"
                            style={{ width: `${summaryData.paymentMethods.other}%` }}
                          />
                        </div>
                        <div className="text-sm font-medium">
                          ${(summaryData.totalSales * summaryData.paymentMethods.other / 100).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    {isLoadingReport ? (
                      <Skeleton className="w-full h-full" />
                    ) : (
                      <Line 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              stacked: true,
                              beginAtZero: true
                            },
                            x: {
                              grid: { display: false }
                            }
                          }
                        }} 
                        data={{
                          labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                          datasets: [
                            {
                              label: 'Cash',
                              data: [250, 220, 300, 250, 400, 480, 350],
                              borderColor: 'hsl(var(--success))',
                              backgroundColor: 'hsla(var(--success), 0.5)',
                              fill: true,
                            },
                            {
                              label: 'Card',
                              data: [350, 320, 400, 450, 500, 550, 500],
                              borderColor: 'hsl(var(--primary))',
                              backgroundColor: 'hsla(var(--primary), 0.5)',
                              fill: true,
                            },
                            {
                              label: 'Credit',
                              data: [50, 50, 100, 110, 60, 70, 130],
                              borderColor: 'hsl(var(--warning))',
                              backgroundColor: 'hsla(var(--warning), 0.5)',
                              fill: true,
                            }
                          ]
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Customers Tab */}
            <TabsContent value="customers" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Top Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      {isLoadingReport ? (
                        <Skeleton className="w-full h-full" />
                      ) : (
                        <Bar 
                          options={{
                            indexAxis: 'y' as const,
                            responsive: true,
                            maintainAspectRatio: false,
                          }}
                          data={{
                            labels: ["Ahmed Mohamed", "Sara Hassan", "Mohammed Ali", "Fatima Khalid", "Hassan Ibrahim"],
                            datasets: [
                              {
                                label: 'Total Spent',
                                data: [850, 620, 580, 480, 420],
                                backgroundColor: 'hsla(var(--primary), 0.7)',
                              }
                            ]
                          }}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Returning Customers</h3>
                        <div className="mt-1 flex justify-between">
                          <span className="text-2xl font-bold">65%</span>
                          <span className="text-sm font-medium text-success">↑ 12%</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-muted-foreground">New Customers</h3>
                        <div className="mt-1 flex justify-between">
                          <span className="text-2xl font-bold">35%</span>
                          <span className="text-sm font-medium text-destructive">↓ 8%</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Avg. Orders per Customer</h3>
                        <div className="mt-1 flex justify-between">
                          <span className="text-2xl font-bold">3.2</span>
                          <span className="text-sm font-medium text-success">↑ 5%</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Customer Lifetime Value</h3>
                        <div className="mt-1 flex justify-between">
                          <span className="text-2xl font-bold">$240.50</span>
                          <span className="text-sm font-medium text-success">↑ 15%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Sale Details Dialog */}
          <Dialog open={showSaleDetails} onOpenChange={setShowSaleDetails}>
            <DialogContent className="sm:max-w-[600px]">
              {selectedSale && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">Invoice #{selectedSale.order_number}</h2>
                      <p className="text-muted-foreground">
                        {format(new Date(selectedSale.created_at), "MMMM d, yyyy h:mm a")}
                      </p>
                    </div>
                    <Badge className={cn(
                      "px-3 py-1 text-xs uppercase",
                      selectedSale.status === "completed" ? "bg-success/20 text-success" :
                      selectedSale.status === "cancelled" ? "bg-destructive/20 text-destructive" :
                      selectedSale.status === "pending" ? "bg-warning/20 text-warning" :
                      "bg-primary/20 text-primary"
                    )}>
                      {selectedSale.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                      <p className="font-medium">{selectedSale.customer_name || "Guest"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Cashier</h3>
                      <p className="font-medium">{selectedSale.cashier_name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Payment Method</h3>
                      <p className="font-medium">{selectedSale.payment_method}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
                      <p className="font-medium">${selectedSale.total.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Order Items</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingReport ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                              </TableCell>
                            </TableRow>
                          ) : (
                            <>
                              <TableRow>
                                <TableCell>Product A</TableCell>
                                <TableCell className="text-right">2</TableCell>
                                <TableCell className="text-right">$25.00</TableCell>
                                <TableCell className="text-right">$50.00</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Product B</TableCell>
                                <TableCell className="text-right">1</TableCell>
                                <TableCell className="text-right">$35.00</TableCell>
                                <TableCell className="text-right">$35.00</TableCell>
                              </TableRow>
                            </>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between">
                      <span className="font-medium">Subtotal:</span>
                      <span>${(selectedSale.total * 0.85).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tax (15%):</span>
                      <span>${(selectedSale.total * 0.15).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>${selectedSale.total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowSaleDetails(false)}>
                      Close
                    </Button>
                    <Button>
                      <Printer className="mr-2 h-4 w-4" />
                      Print Receipt
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          {/* Print Layout - Only visible when printing */}
          <div className="hidden print:block p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold">Sales Report</h1>
              <p className="text-lg">{getDateRangeText()}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-xl font-bold mb-4">Summary</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Sales:</span>
                    <span>${summaryData.totalSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Orders:</span>
                    <span>{summaryData.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Items Sold:</span>
                    <span>{summaryData.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Average Order Value:</span>
                    <span>${summaryData.avgOrderValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Cash:</span>
                    <span>${(summaryData.totalSales * summaryData.paymentMethods.cash / 100).toFixed(2)} ({summaryData.paymentMethods.cash}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Card:</span>
                    <span>${(summaryData.totalSales * summaryData.paymentMethods.card / 100).toFixed(2)} ({summaryData.paymentMethods.card}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Credit:</span>
                    <span>${(summaryData.totalSales * summaryData.paymentMethods.credit / 100).toFixed(2)} ({summaryData.paymentMethods.credit}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Other:</span>
                    <span>${(summaryData.totalSales * summaryData.paymentMethods.other / 100).toFixed(2)} ({summaryData.paymentMethods.other}%)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-4">Sales Details</h2>
            <table className="w-full border-collapse mb-8">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="py-2 text-left">Invoice #</th>
                  <th className="py-2 text-left">Date</th>
                  <th className="py-2 text-left">Customer</th>
                  <th className="py-2 text-right">Total</th>
                  <th className="py-2 text-left">Payment</th>
                  <th className="py-2 text-left">Cashier</th>
                  <th className="py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-200">
                    <td className="py-2">{sale.order_number}</td>
                    <td className="py-2">{format(new Date(sale.created_at), "MMM d, yyyy")}</td>
                    <td className="py-2">{sale.customer_name || "Guest"}</td>
                    <td className="py-2 text-right">${sale.total.toFixed(2)}</td>
                    <td className="py-2">{sale.payment_method}</td>
                    <td className="py-2">{sale.cashier_name}</td>
                    <td className="py-2">{sale.status}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black">
                  <td colSpan={3} className="py-2 text-right font-bold">Total:</td>
                  <td className="py-2 text-right font-bold">
                    ${sortedSales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
            
            <div className="text-center text-sm text-muted-foreground mt-8">
              <p>Report generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}