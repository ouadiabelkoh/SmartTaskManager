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
  FilePdf,
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
  ArrowUp
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

type DateRange = "today" | "yesterday" | "week" | "month" | "custom";
type ReportType = "sales" | "products" | "categories" | "customers";

export default function ReportsPage() {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [reportType, setReportType] = useState<ReportType>("sales");
  const [dateRange, setDateRange] = useState<DateRange>("week");
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date>(new Date());
  
  // Update date range when selection changes
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    const now = new Date();
    
    switch (range) {
      case "today":
        setStartDate(startOfDay(now));
        setEndDate(now);
        break;
      case "yesterday":
        setStartDate(startOfDay(subDays(now, 1)));
        setEndDate(subDays(now, 1));
        break;
      case "week":
        setStartDate(startOfWeek(now, { weekStartsOn: 1 }));
        setEndDate(now);
        break;
      case "month":
        setStartDate(startOfMonth(now));
        setEndDate(now);
        break;
      // For custom, don't update dates automatically
    }
  };
  
  // Format date range for display
  const getDateRangeText = () => {
    if (dateRange === "today") {
      return format(new Date(), "MMMM d, yyyy");
    } else if (dateRange === "yesterday") {
      return format(subDays(new Date(), 1), "MMMM d, yyyy");
    } else {
      return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
    }
  };
  
  // Fetch report data based on type and date range
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["/api/reports", reportType, startDate.toISOString(), endDate.toISOString()],
  });
  
  // Generate chart data based on report type
  const getSalesChartData = () => {
    // This would normally use the real API data
    const labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: [650, 590, 800, 810, 960, 1100, 980],
          borderColor: 'hsl(var(--primary))',
          backgroundColor: 'hsla(var(--primary), 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Transactions',
          data: [25, 20, 30, 22, 35, 40, 38],
          borderColor: 'hsl(var(--chart-2))',
          backgroundColor: 'hsla(var(--chart-2), 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y1',
        },
      ],
    };
  };
  
  const getProductsChartData = () => {
    return {
      labels: ['Wireless Headphones', 'Smart Watch', 'Laptop', 'Smartphone', 'HDMI Cable'],
      datasets: [
        {
          label: 'Units Sold',
          data: [65, 59, 80, 81, 56],
          backgroundColor: [
            'hsla(var(--primary), 0.7)',
            'hsla(var(--chart-2), 0.7)',
            'hsla(var(--chart-3), 0.7)',
            'hsla(var(--chart-4), 0.7)',
            'hsla(var(--chart-5), 0.7)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  const getCategoriesChartData = () => {
    return {
      labels: ['Electronics', 'Accessories', 'Clothing', 'Home Goods', 'Office Supplies'],
      datasets: [
        {
          label: 'Revenue by Category',
          data: [4300, 2500, 1800, 1200, 900],
          backgroundColor: [
            'hsla(var(--primary), 0.7)',
            'hsla(var(--chart-2), 0.7)',
            'hsla(var(--chart-3), 0.7)',
            'hsla(var(--chart-4), 0.7)',
            'hsla(var(--chart-5), 0.7)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  const getCustomersChartData = () => {
    const labels = ['New', 'Returning', 'Regular', 'VIP'];
    
    return {
      labels,
      datasets: [
        {
          label: 'Customer Types',
          data: [25, 35, 30, 10],
          backgroundColor: [
            'hsla(var(--primary), 0.7)',
            'hsla(var(--chart-2), 0.7)',
            'hsla(var(--chart-3), 0.7)',
            'hsla(var(--chart-4), 0.7)',
          ],
        },
      ],
    };
  };
  
  // Chart options
  const salesChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Revenue ($)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Transactions',
        },
      },
    },
  };
  
  const productsChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };
  
  const categoriesChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };
  
  const customersChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };
  
  // Export report data
  const exportReport = () => {
    console.log("Exporting report...");
    // This would generate a CSV or PDF file with the report data
  };
  
  // Print report
  const printReport = () => {
    window.print();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPath="/reports" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Reports" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {isOffline && <OfflineAlert />}
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-semibold text-foreground">Sales Reports</h1>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Select value={dateRange} onValueChange={(value) => handleDateRangeChange(value as DateRange)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button variant="outline" size="icon" title="Export Report" onClick={exportReport}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Print Report" onClick={printReport}>
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Refresh Data">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" disabled={dateRange === "custom"}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{getDateRangeText()}</span>
              <Button variant="ghost" size="icon" disabled={dateRange === "custom"}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {dateRange === "custom" && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Custom range selector would go here</span>
                </div>
                <Button size="sm">Apply</Button>
              </div>
            )}
          </div>
          
          <Tabs value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
            <TabsList className="w-full justify-start border-b rounded-none mb-4 overflow-x-auto">
              <TabsTrigger value="sales" className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                Sales Trends
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Top Products
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Customer Insights
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="sales" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] lg:h-[400px]">
                    {isLoading ? (
                      <Skeleton className="w-full h-full" />
                    ) : (
                      <Line options={salesChartOptions} data={getSalesChartData()} />
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$4,890.00</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="text-success font-medium">↑ 12.5%</span> from previous period
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">185</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="text-success font-medium">↑ 8.2%</span> from previous period
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Average Order Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$26.43</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="text-success font-medium">↑ 3.1%</span> from previous period
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24.8%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="text-destructive font-medium">↓ 1.2%</span> from previous period
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="products" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] lg:h-[400px]">
                      {isLoading ? (
                        <Skeleton className="w-full h-full" />
                      ) : (
                        <Bar options={productsChartOptions} data={getProductsChartData()} />
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
                      <div className="p-4 flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">Wireless Headphones</h3>
                          <p className="text-sm text-muted-foreground">65 units sold</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">$1,950</p>
                          <p className="text-xs text-success">↑ 24%</p>
                        </div>
                      </div>
                      <div className="p-4 flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">Smart Watch</h3>
                          <p className="text-sm text-muted-foreground">59 units sold</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">$1,770</p>
                          <p className="text-xs text-success">↑ 12%</p>
                        </div>
                      </div>
                      <div className="p-4 flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">Laptop</h3>
                          <p className="text-sm text-muted-foreground">80 units sold</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">$6,400</p>
                          <p className="text-xs text-success">↑ 18%</p>
                        </div>
                      </div>
                      <div className="p-4 flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">Smartphone</h3>
                          <p className="text-sm text-muted-foreground">81 units sold</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">$5,670</p>
                          <p className="text-xs text-destructive">↓ 3%</p>
                        </div>
                      </div>
                      <div className="p-4 flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">HDMI Cable</h3>
                          <p className="text-sm text-muted-foreground">56 units sold</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">$840</p>
                          <p className="text-xs text-success">↑ 9%</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="categories" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Revenue by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] lg:h-[400px]">
                      {isLoading ? (
                        <Skeleton className="w-full h-full" />
                      ) : (
                        <Bar options={productsChartOptions} data={getCategoriesChartData()} />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Category Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {isLoading ? (
                        <Skeleton className="w-full h-full" />
                      ) : (
                        <Pie options={categoriesChartOptions} data={getCategoriesChartData()} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="customers" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Customer Purchase Frequency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] lg:h-[400px]">
                      {isLoading ? (
                        <Skeleton className="w-full h-full" />
                      ) : (
                        <Bar options={productsChartOptions} data={getCustomersChartData()} />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {isLoading ? (
                        <Skeleton className="w-full h-full" />
                      ) : (
                        <Pie options={customersChartOptions} data={getCustomersChartData()} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Customers</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    <div className="p-4 flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">Emma Wilson</h3>
                        <p className="text-sm text-muted-foreground">12 orders this month</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$1,245</p>
                        <p className="text-xs text-muted-foreground">Lifetime: $5,890</p>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">James Smith</h3>
                        <p className="text-sm text-muted-foreground">8 orders this month</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$985</p>
                        <p className="text-xs text-muted-foreground">Lifetime: $3,450</p>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">Sarah Johnson</h3>
                        <p className="text-sm text-muted-foreground">7 orders this month</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$875</p>
                        <p className="text-xs text-muted-foreground">Lifetime: $2,980</p>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">Michael Brown</h3>
                        <p className="text-sm text-muted-foreground">5 orders this month</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$650</p>
                        <p className="text-xs text-muted-foreground">Lifetime: $1,870</p>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">David Miller</h3>
                        <p className="text-sm text-muted-foreground">4 orders this month</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$520</p>
                        <p className="text-xs text-muted-foreground">Lifetime: $1,650</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
