import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

interface StatsCardProps {
  title?: string;
  value?: string;
  change?: number;
  changeType?: "increase" | "decrease" | "none";
  icon?: ReactNode;
  color?: "primary" | "success" | "warning" | "destructive";
  isLoading?: boolean;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "none",
  icon,
  color = "primary",
  isLoading = false
}: StatsCardProps) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive"
  };
  
  const changeColor = {
    increase: "text-success",
    decrease: "text-destructive",
    none: "text-muted-foreground"
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-6 w-[80px]" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-semibold mt-1 text-foreground">{value}</h3>
            {changeType !== "none" && typeof change !== "undefined" && (
              <div className="flex items-center mt-1 text-xs">
                <span className={cn("flex items-center mr-1", changeColor[changeType])}>
                  {changeType === "increase" ? <ArrowUp className="h-3 w-3 mr-0.5" /> : 
                   changeType === "decrease" ? <ArrowDown className="h-3 w-3 mr-0.5" /> : null}
                  {change}%
                </span>
                <span className="text-muted-foreground">vs yesterday</span>
              </div>
            )}
          </div>
          <div className={cn(
            "h-10 w-10 rounded-md flex items-center justify-center",
            colorClasses[color]
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
