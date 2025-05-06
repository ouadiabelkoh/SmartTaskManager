import { useState } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, HelpCircle, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New order received", time: "5 minutes ago", read: false },
    { id: 2, message: "Low stock alert: Wireless Headphones", time: "20 minutes ago", read: false },
    { id: 3, message: "Daily sales report available", time: "1 hour ago", read: true },
  ]);
  
  const isMobile = useMobile();
  
  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <header className="bg-card border-b border-border p-4 flex items-center justify-between">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        {!isMobile && (
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 w-48"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-2 px-4 text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem 
                  key={notification.id}
                  className={`flex flex-col items-start p-3 cursor-pointer ${notification.read ? 'opacity-60' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between w-full">
                    <span className="font-medium text-sm">{notification.message}</span>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{notification.time}</span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary text-sm cursor-pointer">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}
