import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { OfflineAlert } from "@/components/layout/offline-alert";
import { isOnline } from "@/lib/offline-sync";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, Search, Eye, FileText, Trash, RefreshCcw, Share2, Calendar, CalendarIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

type Order = {
  id: number;
  order_number: string;
  customer_id: number | null;
  customer_name: string | null;
  total: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  payment_method: string;
  created_at: string;
  items: OrderItem[];
};

type OrderItem = {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type Customer = {
  id: number;
  name: string;
};

export default function OrdersPage() {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const { toast } = useToast();

  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Mutations for order actions
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order status updated",
        description: "The order status has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update order status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to cancel an order
  const cancelOrder = (id: number) => {
    updateOrderStatusMutation.mutate({ id, status: "cancelled" });
    setIsDetailsDialogOpen(false);
  };

  // Filter orders based on search query, status and date range
  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = !statusFilter || statusFilter === "all" || order.status === statusFilter;
    
    // Check if the order date is within the selected range
    let matchesDateRange = true;
    if (dateRange?.from) {
      const orderDate = new Date(order.created_at);
      matchesDateRange = orderDate >= dateRange.from;
      
      if (dateRange.to) {
        // Add one day to include the 'to' date fully
        const toDate = new Date(dateRange.to);
        toDate.setDate(toDate.getDate() + 1);
        matchesDateRange = matchesDateRange && orderDate < toDate;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Open order details dialog
  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsDialogOpen(true);
  };

  // Get status badge className based on status
  const getStatusBadgeClass = (status: string) => {
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
      <Sidebar currentPath="/orders" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Orders" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {isOffline && <OfflineAlert />}
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-semibold text-foreground">Order Management</h1>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1">
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="w-full sm:w-40">
                <Select 
                  value={statusFilter || "all"} 
                  onValueChange={(value) => setStatusFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full sm:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Filter by date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredOrders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{format(new Date(order.created_at), "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell>{order.customer_name || "Guest"}</TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{order.payment_method}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => viewOrderDetails(order)}
                          title="View Order Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Print Receipt"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Order Details Dialog */}
          <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
              </DialogHeader>
              
              {selectedOrder && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Order Number</h3>
                      <p className="text-foreground">{selectedOrder.order_number}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
                      <p className="text-foreground">
                        {format(new Date(selectedOrder.created_at), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                      <p className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(selectedOrder.status)}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Payment Method</h3>
                      <p className="text-foreground">{selectedOrder.payment_method}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                      <p className="text-foreground">{selectedOrder.customer_name || "Guest"}</p>
                    </div>
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                      <p className="text-foreground">
                        {selectedOrder.notes || "No notes for this order."}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Order Items</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.product_name}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${item.subtotal.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="font-medium">Total:</span>
                    <span className="text-lg font-bold">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled={selectedOrder.status === 'cancelled' || updateOrderStatusMutation.isPending}
                      onClick={() => cancelOrder(selectedOrder.id)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Cancel Order
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Resell
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Send WhatsApp
                    </Button>
                    <Button 
                      className="w-full"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Print Receipt
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
