import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { OfflineAlert } from "@/components/layout/offline-alert";
import { isOnline } from "@/lib/offline-sync";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, Plus, Pencil, Trash2, UserPlus, UserCheck, Mail, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  // Fetch customers
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Create customer form
  const createForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  // Edit customer form
  const editForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Customer created",
        description: "Customer has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create customer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormValues & { id: number }) => {
      const { id, ...customerData } = data;
      const res = await apiRequest("PUT", `/api/customers/${id}`, customerData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      toast({
        title: "Customer updated",
        description: "Customer has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update customer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
      toast({
        title: "Customer deleted",
        description: "Customer has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete customer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle create customer submit
  const onCreateSubmit = (data: CustomerFormValues) => {
    createCustomerMutation.mutate(data);
  };

  // Handle edit customer submit
  const onEditSubmit = (data: CustomerFormValues) => {
    if (selectedCustomer) {
      updateCustomerMutation.mutate({
        id: selectedCustomer.id,
        ...data,
      });
    }
  };

  // Handle delete customer
  const onDeleteConfirm = () => {
    if (selectedCustomer) {
      deleteCustomerMutation.mutate(selectedCustomer.id);
    }
  };

  // Set up edit form when a customer is selected
  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    editForm.reset({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      notes: customer.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  // Filter customers based on search query
  const filteredCustomers = customers?.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (customer.phone && customer.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPath="/customers" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Customers" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {isOffline && <OfflineAlert />}
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-semibold text-foreground">Customer Management</h1>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>
                      Create a new customer record to manage customer information and track purchases.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                      <FormField
                        control={createForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter customer name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input placeholder="Email address" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={createForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input placeholder="Phone number" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={createForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Customer address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Additional notes about this customer" 
                                {...field} 
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          disabled={createCustomerMutation.isPending}
                        >
                          {createCustomerMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create Customer
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No customers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers?.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email || "—"}</TableCell>
                      <TableCell>{customer.phone || "—"}</TableCell>
                      <TableCell className="truncate max-w-[200px]">{customer.address || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(customer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(customer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Edit Customer Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Customer</DialogTitle>
                <DialogDescription>
                  Update customer information.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter customer name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Email address" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Phone number" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Customer address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional notes about this customer" 
                            {...field} 
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                      className="mr-2"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateCustomerMutation.isPending}
                    >
                      {updateCustomerMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Customer
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{selectedCustomer?.name}"? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={onDeleteConfirm}
                  disabled={deleteCustomerMutation.isPending}
                >
                  {deleteCustomerMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
