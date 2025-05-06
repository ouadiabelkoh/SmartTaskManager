import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { OfflineAlert } from "@/components/layout/offline-alert";
import { isOnline } from "@/lib/offline-sync";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Store, Database, NetworkIcon, Printer, ReceiptText, FileText, Upload, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { connectWebSocket, isConnected } from "@/lib/websocket";
import { initOfflineSync, syncQueuedOperations, getQueuedOperationsCount } from "@/lib/offline-sync";

// Business settings schema
const businessSettingsSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  storeAddress: z.string().optional(),
  storePhone: z.string().optional(),
  storeEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  taxRate: z.coerce.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100%"),
  currency: z.string().min(1, "Currency is required"),
  timezone: z.string().min(1, "Timezone is required"),
});

// Receipt settings schema
const receiptSettingsSchema = z.object({
  showLogo: z.boolean().default(true),
  receiptTitle: z.string().min(1, "Receipt title is required"),
  footerText: z.string().optional(),
  showTaxDetails: z.boolean().default(true),
  printCustomerInfo: z.boolean().default(true),
});

// System settings schema
const systemSettingsSchema = z.object({
  autoBackup: z.boolean().default(true),
  backupFrequency: z.string().min(1, "Backup frequency is required"),
  backupLocation: z.string().min(1, "Backup location is required"),
  allowOfflineMode: z.boolean().default(true),
  syncFrequency: z.string().min(1, "Sync frequency is required"),
  retentionDays: z.coerce.number().int().positive("Retention period must be a positive number"),
});

type BusinessSettingsFormValues = z.infer<typeof businessSettingsSchema>;
type ReceiptSettingsFormValues = z.infer<typeof receiptSettingsSchema>;
type SystemSettingsFormValues = z.infer<typeof systemSettingsSchema>;

export default function SettingsPage() {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [activeTab, setActiveTab] = useState("business");
  const [isPerformingSync, setIsPerformingSync] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isImportingData, setIsImportingData] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const { toast } = useToast();

  // Fetch settings
  const { data: businessSettings, isLoading: businessSettingsLoading } = useQuery<BusinessSettingsFormValues>({
    queryKey: ["/api/settings/business"],
  });

  const { data: receiptSettings, isLoading: receiptSettingsLoading } = useQuery<ReceiptSettingsFormValues>({
    queryKey: ["/api/settings/receipt"],
  });

  const { data: systemSettings, isLoading: systemSettingsLoading } = useQuery<SystemSettingsFormValues>({
    queryKey: ["/api/settings/system"],
  });

  // Business settings form
  const businessForm = useForm<BusinessSettingsFormValues>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      storeName: "",
      storeAddress: "",
      storePhone: "",
      storeEmail: "",
      taxRate: 0,
      currency: "USD",
      timezone: "UTC",
    },
  });

  // Receipt settings form
  const receiptForm = useForm<ReceiptSettingsFormValues>({
    resolver: zodResolver(receiptSettingsSchema),
    defaultValues: {
      showLogo: true,
      receiptTitle: "Sales Receipt",
      footerText: "",
      showTaxDetails: true,
      printCustomerInfo: true,
    },
  });

  // System settings form
  const systemForm = useForm<SystemSettingsFormValues>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      autoBackup: true,
      backupFrequency: "daily",
      backupLocation: "cloud",
      allowOfflineMode: true,
      syncFrequency: "realtime",
      retentionDays: 30,
    },
  });

  // Update forms when data loads
  useState(() => {
    if (businessSettings) {
      businessForm.reset(businessSettings);
    }

    if (receiptSettings) {
      receiptForm.reset(receiptSettings);
    }

    if (systemSettings) {
      systemForm.reset(systemSettings);
    }
  });

  // Update business settings mutation
  const updateBusinessSettingsMutation = useMutation({
    mutationFn: async (data: BusinessSettingsFormValues) => {
      const res = await apiRequest("PUT", "/api/settings/business", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/business"] });
      toast({
        title: "Settings updated",
        description: "Business settings have been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update receipt settings mutation
  const updateReceiptSettingsMutation = useMutation({
    mutationFn: async (data: ReceiptSettingsFormValues) => {
      const res = await apiRequest("PUT", "/api/settings/receipt", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/receipt"] });
      toast({
        title: "Settings updated",
        description: "Receipt settings have been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update system settings mutation
  const updateSystemSettingsMutation = useMutation({
    mutationFn: async (data: SystemSettingsFormValues) => {
      const res = await apiRequest("PUT", "/api/settings/system", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/system"] });
      toast({
        title: "Settings updated",
        description: "System settings have been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit handlers
  const onBusinessSubmit = (data: BusinessSettingsFormValues) => {
    updateBusinessSettingsMutation.mutate(data);
  };

  const onReceiptSubmit = (data: ReceiptSettingsFormValues) => {
    updateReceiptSettingsMutation.mutate(data);
  };

  const onSystemSubmit = (data: SystemSettingsFormValues) => {
    updateSystemSettingsMutation.mutate(data);
  };

  // Sync data now
  const syncDataNow = async () => {
    setIsPerformingSync(true);
    try {
      // Try to connect if not connected
      if (!isConnected()) {
        connectWebSocket();
      }
      
      // Wait a bit for the connection to establish
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // If connected, sync data
      if (isConnected()) {
        const success = await syncQueuedOperations();
        if (success) {
          toast({
            title: "Sync completed",
            description: "All data has been synchronized successfully.",
          });
          
          // Refresh data
          queryClient.invalidateQueries();
          
          // Update pending sync count
          const count = await getQueuedOperationsCount();
          setPendingSyncCount(count);
        } else {
          toast({
            title: "Sync partially completed",
            description: "Some items could not be synchronized. Will retry later.",
            variant: "warning",
          });
        }
      } else {
        toast({
          title: "Sync failed",
          description: "Could not connect to the server. Please check your connection.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sync error",
        description: "An error occurred during synchronization.",
        variant: "destructive",
      });
    } finally {
      setIsPerformingSync(false);
    }
  };

  // Export data
  const exportData = async () => {
    setIsExportingData(true);
    try {
      const res = await apiRequest("GET", "/api/settings/export");
      const blob = await res.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export completed",
        description: "Data has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExportingData(false);
    }
  };

  // Import data
  const importData = () => {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) return;
      
      const file = target.files[0];
      setIsImportingData(true);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/api/settings/import', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!res.ok) {
          throw new Error(`Failed to import data: ${res.statusText}`);
        }
        
        toast({
          title: "Import completed",
          description: "Data has been imported successfully.",
        });
        
        // Refresh data
        queryClient.invalidateQueries();
      } catch (error) {
        toast({
          title: "Import failed",
          description: error instanceof Error ? error.message : "Could not import data.",
          variant: "destructive",
        });
      } finally {
        setIsImportingData(false);
      }
    };
    
    fileInput.click();
  };

  // Check pending sync operations on load
  useState(() => {
    const checkPendingSync = async () => {
      try {
        await initOfflineSync();
        const count = await getQueuedOperationsCount();
        setPendingSyncCount(count);
      } catch (error) {
        console.error("Error checking pending sync operations:", error);
      }
    };
    
    checkPendingSync();
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPath="/settings" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="System Settings" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {isOffline && <OfflineAlert />}
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start border-b rounded-none mb-4 overflow-x-auto">
              <TabsTrigger value="business" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Business
              </TabsTrigger>
              <TabsTrigger value="receipt" className="flex items-center gap-2">
                <ReceiptText className="h-4 w-4" />
                Receipts
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                System
              </TabsTrigger>
              <TabsTrigger value="sync" className="flex items-center gap-2">
                <NetworkIcon className="h-4 w-4" />
                Sync & Backup
              </TabsTrigger>
            </TabsList>
            
            {/* Business Settings */}
            <TabsContent value="business">
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>
                    Configure your store information and default settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...businessForm}>
                    <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                        <FormField
                          control={businessForm.control}
                          name="storeName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Store Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your Store Name" {...field} />
                              </FormControl>
                              <FormDescription>
                                This will appear on receipts and the application title.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={businessForm.control}
                          name="storeAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Store Address</FormLabel>
                              <FormControl>
                                <Input placeholder="Your Store Address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={businessForm.control}
                            name="storePhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Phone Number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={businessForm.control}
                            name="storeEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="Email Address" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={businessForm.control}
                            name="taxRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tax Rate (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="0.00" 
                                    {...field} 
                                    step="0.01"
                                    min="0"
                                    max="100"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Default tax rate applied to sales.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={businessForm.control}
                            name="currency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <Select 
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                    <SelectItem value="CAD">CAD ($)</SelectItem>
                                    <SelectItem value="AUD">AUD ($)</SelectItem>
                                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                                    <SelectItem value="CNY">CNY (¥)</SelectItem>
                                    <SelectItem value="INR">INR (₹)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={businessForm.control}
                            name="timezone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Timezone</FormLabel>
                                <Select 
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select timezone" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="UTC">UTC</SelectItem>
                                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                                    <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <CardFooter className="px-0 pb-0">
                        <Button 
                          type="submit" 
                          disabled={updateBusinessSettingsMutation.isPending || businessSettingsLoading}
                        >
                          {updateBusinessSettingsMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Save Changes
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Receipt Settings */}
            <TabsContent value="receipt">
              <Card>
                <CardHeader>
                  <CardTitle>Receipt Settings</CardTitle>
                  <CardDescription>
                    Configure how receipts are generated and printed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...receiptForm}>
                    <form onSubmit={receiptForm.handleSubmit(onReceiptSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={receiptForm.control}
                            name="receiptTitle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Receipt Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Receipt Title" {...field} />
                                </FormControl>
                                <FormDescription>
                                  The title displayed at the top of the receipt.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={receiptForm.control}
                            name="showLogo"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Display Logo</FormLabel>
                                  <FormDescription>
                                    Show your store logo on receipts.
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={receiptForm.control}
                          name="footerText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Footer Text</FormLabel>
                              <FormControl>
                                <Input placeholder="Thank you for your purchase!" {...field} />
                              </FormControl>
                              <FormDescription>
                                Custom message displayed at the bottom of receipts.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={receiptForm.control}
                            name="showTaxDetails"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Show Tax Details</FormLabel>
                                  <FormDescription>
                                    Display tax breakdown on receipts.
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={receiptForm.control}
                            name="printCustomerInfo"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Print Customer Info</FormLabel>
                                  <FormDescription>
                                    Include customer details when available.
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="pt-4">
                          <div className="bg-muted p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                              <Printer className="h-5 w-5 mr-2 text-muted-foreground" />
                              <h3 className="font-medium">Printer Settings</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                              Connect and configure receipt printers for your POS system.
                            </p>
                            <Button variant="outline" className="mr-2">
                              Set Up Printer
                            </Button>
                            <Button variant="outline">
                              Test Print
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <CardFooter className="px-0 pb-0">
                        <Button 
                          type="submit" 
                          disabled={updateReceiptSettingsMutation.isPending || receiptSettingsLoading}
                        >
                          {updateReceiptSettingsMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Save Changes
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* System Settings */}
            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>
                    Configure system behavior and database settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...systemForm}>
                    <form onSubmit={systemForm.handleSubmit(onSystemSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={systemForm.control}
                            name="autoBackup"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Automatic Backups</FormLabel>
                                  <FormDescription>
                                    Automatically backup your data periodically.
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={systemForm.control}
                            name="backupFrequency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Backup Frequency</FormLabel>
                                <Select 
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  disabled={!systemForm.watch("autoBackup")}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="hourly">Hourly</SelectItem>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={systemForm.control}
                            name="backupLocation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Backup Location</FormLabel>
                                <Select 
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select location" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="local">Local Storage</SelectItem>
                                    <SelectItem value="cloud">Cloud Storage</SelectItem>
                                    <SelectItem value="both">Both Local & Cloud</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Where backup files will be stored.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={systemForm.control}
                            name="retentionDays"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Retention Period (days)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    min="1"
                                  />
                                </FormControl>
                                <FormDescription>
                                  How long to keep backup files.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={systemForm.control}
                            name="allowOfflineMode"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Allow Offline Mode</FormLabel>
                                  <FormDescription>
                                    Enable operations when internet is unavailable.
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={systemForm.control}
                            name="syncFrequency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sync Frequency</FormLabel>
                                <Select 
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  disabled={!systemForm.watch("allowOfflineMode")}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="realtime">Real-time</SelectItem>
                                    <SelectItem value="minute">Every Minute</SelectItem>
                                    <SelectItem value="hourly">Hourly</SelectItem>
                                    <SelectItem value="manual">Manual Only</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  How often offline data syncs when online.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <CardFooter className="px-0 pb-0">
                        <Button 
                          type="submit" 
                          disabled={updateSystemSettingsMutation.isPending || systemSettingsLoading}
                        >
                          {updateSystemSettingsMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Save Changes
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Sync & Backup */}
            <TabsContent value="sync">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Data Synchronization</CardTitle>
                    <CardDescription>
                      Manage offline data and synchronization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">Connection Status</h3>
                          <p className="text-sm text-muted-foreground">
                            {isConnected() ? "Connected to server" : "Not connected to server"}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm ${
                          isConnected() ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                        }`}>
                          {isConnected() ? "Online" : "Offline"}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">Pending Synchronization</h3>
                          <p className="text-sm text-muted-foreground">
                            {pendingSyncCount} items waiting to be synchronized
                          </p>
                        </div>
                        <Button 
                          onClick={syncDataNow}
                          disabled={isPerformingSync || pendingSyncCount === 0 || !isConnected()}
                        >
                          {isPerformingSync ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <NetworkIcon className="mr-2 h-4 w-4" />
                          )}
                          Sync Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Backup & Restore</CardTitle>
                    <CardDescription>
                      Export or import system data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm mb-4">
                          Export a complete backup of your data for safekeeping or transfer to another system.
                        </p>
                        <Button 
                          variant="outline"
                          onClick={exportData}
                          disabled={isExportingData}
                        >
                          {isExportingData ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          Export Data
                        </Button>
                      </div>
                      
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm mb-2">
                          Import data from a backup file.
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Warning: This may override existing data. Make sure to backup first.
                        </p>
                        <Button 
                          variant="outline"
                          onClick={importData}
                          disabled={isImportingData}
                        >
                          {isImportingData ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          Import Data
                        </Button>
                      </div>
                      
                      <div className="mt-6">
                        <h3 className="font-medium mb-2">Backup History</h3>
                        <div className="border rounded-lg divide-y">
                          <div className="p-3 flex justify-between items-center">
                            <div>
                              <div className="font-medium">Daily Backup</div>
                              <div className="text-xs text-muted-foreground">Today at 03:00 AM</div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="p-3 flex justify-between items-center">
                            <div>
                              <div className="font-medium">Weekly Backup</div>
                              <div className="text-xs text-muted-foreground">Sunday at 02:00 AM</div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="p-3 flex justify-between items-center">
                            <div>
                              <div className="font-medium">Monthly Backup</div>
                              <div className="text-xs text-muted-foreground">May 1, 2023 at 01:00 AM</div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
