import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  items_count: number;
  total: number;
  status: "completed" | "processing" | "pending";
  created_at: string;
}

interface RecentSalesProps {
  className?: string;
}

export function RecentSales({ className }: RecentSalesProps) {
  const { data: recentSales, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/dashboard/recent-sales"],
  });
  
  // Helper function to get status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/20 text-success";
      case "processing":
        return "bg-primary/20 text-primary";
      case "pending":
        return "bg-warning/20 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  
  // Create time string (e.g., "5 minutes ago")
  const getTimeString = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Recent Sales</CardTitle>
          <a href="/orders" className="text-sm text-primary hover:text-primary/80">View all</a>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-medium">Order ID</TableHead>
                <TableHead className="font-medium">Customer</TableHead>
                <TableHead className="font-medium">Items</TableHead>
                <TableHead className="font-medium">Total</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : recentSales && recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <TableRow key={sale.id} className="border-b hover:bg-muted/50">
                    <TableCell className="text-foreground">{sale.order_number}</TableCell>
                    <TableCell className="text-foreground">{sale.customer_name}</TableCell>
                    <TableCell className="text-foreground">{sale.items_count}</TableCell>
                    <TableCell className="text-foreground">${sale.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-1 rounded-full text-xs", getStatusBadgeClass(sale.status))}>
                        {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getTimeString(sale.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No recent sales data available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
