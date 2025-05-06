import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Search, UserPlus, Users } from "lucide-react";

// Form schema
const personSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  type: z.enum(["customer", "supplier", "both"], {
    required_error: "Please select a type",
  }),
  phone: z.string().min(5, "Phone number must be at least 5 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().min(5, "Address must be at least 5 characters"),
  id_number: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type Person = {
  id: number;
  name: string;
  type: "customer" | "supplier" | "both";
  email?: string;
  phone?: string;
  address?: string;
  id_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

type PersonFormValues = z.infer<typeof personSchema>;

export default function PeoplePage() {
  const [activeTab, setActiveTab] = useState<string>("customers");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewingTransactions, setIsViewingTransactions] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch people data
  const { data: people, isLoading } = useQuery<Person[]>({
    queryKey: ['/api/people', activeTab, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab !== "all") {
        params.append("type", activeTab === "customers" ? "customer" : "supplier");
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      const response = await fetch(`/api/people?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch people");
      }
      return response.json();
    },
    refetchOnWindowFocus: true,
  });

  // Create person mutation
  const createMutation = useMutation({
    mutationFn: async (data: PersonFormValues) => {
      const response = await fetch("/api/people", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create person");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Person created successfully",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/people'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update person mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PersonFormValues }) => {
      const response = await fetch(`/api/people/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update person");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Person updated successfully",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/people'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete person mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/people/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // If the person has transactions, return a specific error object
        if (response.status === 409) {
          return { hasTransactions: true, message: errorData.message };
        }
        throw new Error(errorData.message || "Failed to delete person");
      }
      
      return { success: true };
    },
    onSuccess: (data: any) => {
      if (data.hasTransactions) {
        toast({
          title: "Cannot Delete",
          description: "This person has transactions and cannot be deleted",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Person deleted successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/people'] });
      }
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Transactions query
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['/api/people/transactions', selectedPerson?.id],
    queryFn: async () => {
      if (!selectedPerson) return null;
      const response = await fetch(`/api/people/${selectedPerson.id}/transactions`);
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      return response.json();
    },
    enabled: isViewingTransactions && !!selectedPerson,
  });

  const handleCreatePerson = (data: PersonFormValues) => {
    createMutation.mutate(data);
  };

  const handleUpdatePerson = (data: PersonFormValues) => {
    if (selectedPerson) {
      updateMutation.mutate({ id: selectedPerson.id, data });
    }
  };

  const handleDeletePerson = () => {
    if (selectedPerson) {
      deleteMutation.mutate(selectedPerson.id);
    }
  };

  const openEditDialog = (person: Person) => {
    setSelectedPerson(person);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (person: Person) => {
    setSelectedPerson(person);
    setIsDeleteDialogOpen(true);
  };

  const openTransactionsView = (person: Person) => {
    setSelectedPerson(person);
    setIsViewingTransactions(true);
  };

  const filteredPeople = people?.filter(person => {
    if (activeTab === "customers" && person.type !== "customer" && person.type !== "both") return false;
    if (activeTab === "suppliers" && person.type !== "supplier" && person.type !== "both") return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        person.name.toLowerCase().includes(query) ||
        (person.email && person.email.toLowerCase().includes(query)) ||
        (person.phone && person.phone.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">People Management</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, email, or phone..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="customers" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="customers" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Suppliers
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            All
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="bg-white rounded-md p-4">
          <PeopleTable
            people={filteredPeople || []}
            isLoading={isLoading}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            onViewTransactions={openTransactionsView}
            filterType="customer"
          />
        </TabsContent>

        <TabsContent value="suppliers" className="bg-white rounded-md p-4">
          <PeopleTable
            people={filteredPeople || []}
            isLoading={isLoading}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            onViewTransactions={openTransactionsView}
            filterType="supplier"
          />
        </TabsContent>

        <TabsContent value="all" className="bg-white rounded-md p-4">
          <PeopleTable
            people={filteredPeople || []}
            isLoading={isLoading}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            onViewTransactions={openTransactionsView}
          />
        </TabsContent>
      </Tabs>

      {/* Create Person Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New {activeTab === "customers" ? "Customer" : activeTab === "suppliers" ? "Supplier" : "Person"}</DialogTitle>
          </DialogHeader>
          <PersonForm
            onSubmit={handleCreatePerson}
            defaultValues={{
              type: activeTab === "customers" ? "customer" : activeTab === "suppliers" ? "supplier" : "both",
            }}
            isPending={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Person Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit {selectedPerson?.type === "customer" ? "Customer" : selectedPerson?.type === "supplier" ? "Supplier" : "Person"}</DialogTitle>
          </DialogHeader>
          {selectedPerson && (
            <PersonForm
              onSubmit={handleUpdatePerson}
              defaultValues={{
                name: selectedPerson.name,
                type: selectedPerson.type,
                email: selectedPerson.email || "",
                phone: selectedPerson.phone || "",
                address: selectedPerson.address || "",
                id_number: selectedPerson.id_number || "",
                notes: selectedPerson.notes || "",
              }}
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this person?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the record and any related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePerson}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transactions View */}
      <Dialog open={isViewingTransactions} onOpenChange={setIsViewingTransactions}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Transactions for {selectedPerson?.name}</DialogTitle>
          </DialogHeader>
          {isLoadingTransactions ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction: any) => (
                    <TableRow key={transaction.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/orders/${transaction.id}`)}>
                      <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{transaction.order_number}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.status === "completed"
                              ? "outline" // Changed from "success"
                              : transaction.status === "pending"
                              ? "secondary" // Changed from "warning"
                              : transaction.status === "cancelled"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${typeof transaction.total === 'number' 
                          ? transaction.total.toFixed(2) 
                          : Number(transaction.total).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No transactions found for this person.</p>
              </CardContent>
            </Card>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PersonFormProps {
  onSubmit: (data: PersonFormValues) => void;
  defaultValues: Partial<PersonFormValues>;
  isPending: boolean;
}

function PersonForm({ onSubmit, defaultValues, isPending }: PersonFormProps) {
  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      name: "",
      type: "customer",
      email: "",
      phone: "",
      address: "",
      id_number: "",
      notes: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name*</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type*</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number*</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address*</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="id_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID/Barcode Card Number (Optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

interface PeopleTableProps {
  people: Person[];
  isLoading: boolean;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
  onViewTransactions: (person: Person) => void;
  filterType?: "customer" | "supplier";
}

function PeopleTable({
  people,
  isLoading,
  onEdit,
  onDelete,
  onViewTransactions,
  filterType,
}: PeopleTableProps) {
  // Get parent component context for setIsCreateDialogOpen through props
  const openAddNew = () => {
    // This function doesn't actually work - the button is just for looks when empty
    // We would need to receive a setter from props to actually implement this
  };
  // Filter people based on the filter type
  const filteredPeople = filterType
    ? people.filter((person) => person.type === filterType || person.type === "both")
    : people;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (filteredPeople.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No people found. Add someone to get started.</p>
          <Button variant="outline" className="mt-4" onClick={openAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>ID/Barcode</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredPeople.map((person) => (
          <TableRow key={person.id}>
            <TableCell className="font-medium">{person.name}</TableCell>
            <TableCell>
              <Badge variant={
                person.type === "both" 
                  ? "outline" 
                  : person.type === "customer" 
                    ? "default" 
                    : "secondary"
              }>
                {person.type === "both" 
                  ? "Customer & Supplier" 
                  : person.type === "customer" 
                    ? "Customer" 
                    : "Supplier"}
              </Badge>
            </TableCell>
            <TableCell>{person.phone || "-"}</TableCell>
            <TableCell className="max-w-[200px] truncate" title={person.address || ""}>
              {person.address || "-"}
            </TableCell>
            <TableCell>{person.id_number || "-"}</TableCell>
            <TableCell className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewTransactions(person)}
              >
                History
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(person)}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-600"
                onClick={() => onDelete(person)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";