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
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, UserPlus, Pencil, Trash2, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type User = {
  id: number;
  username: string;
  role: "admin" | "manager" | "cashier";
  permissions: string[];
  active: boolean;
};

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "manager", "cashier"]),
  permissions: z.array(z.string()),
  active: z.boolean().default(true),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const userUpdateSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum(["admin", "manager", "cashier"]),
  permissions: z.array(z.string()),
  active: z.boolean().default(true),
}).refine((data) => !data.password || data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type UserFormValues = z.infer<typeof userSchema>;
type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;

export default function UsersPage() {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Available permissions
  const availablePermissions = [
    { id: "manage_products", label: "Manage Products" },
    { id: "manage_inventory", label: "Manage Inventory" },
    { id: "manage_customers", label: "Manage Customers" },
    { id: "manage_sales", label: "Process Sales" },
    { id: "view_reports", label: "View Reports" },
    { id: "manage_users", label: "Manage Users" },
    { id: "manage_settings", label: "Manage Settings" },
  ];

  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Create user form
  const createForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      role: "cashier",
      permissions: [],
      active: true,
    },
  });

  // Edit user form
  const editForm = useForm<UserUpdateFormValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      role: "cashier",
      permissions: [],
      active: true,
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const { confirmPassword, ...userData } = data;
      const res = await apiRequest("POST", "/api/users", userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "User created",
        description: "User has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserUpdateFormValues & { id: number }) => {
      const { id, confirmPassword, ...userData } = data;
      const res = await apiRequest("PUT", `/api/users/${id}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "User updated",
        description: "User has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "User deleted",
        description: "User has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle create user submit
  const onCreateSubmit = (data: UserFormValues) => {
    createUserMutation.mutate(data);
  };

  // Handle edit user submit
  const onEditSubmit = (data: UserUpdateFormValues) => {
    if (selectedUser) {
      updateUserMutation.mutate({
        id: selectedUser.id,
        ...data,
      });
    }
  };

  // Handle delete user
  const onDeleteConfirm = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  // Set up edit form when a user is selected
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      username: user.username,
      password: "",
      confirmPassword: "",
      role: user.role,
      permissions: user.permissions,
      active: user.active,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Filter users based on search query
  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get role badge class
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-destructive/20 text-destructive";
      case "manager":
        return "bg-warning/20 text-warning";
      case "cashier":
        return "bg-primary/20 text-primary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Check if current user can manage the selected user
  const canManageUser = (targetUser: User) => {
    if (!currentUser) return false;
    
    // Admins can manage everyone
    if (currentUser.username === "admin") return true;
    
    // Cannot manage yourself or users with higher privileges
    if (targetUser.id === currentUser.id) return false;
    if (targetUser.role === "admin" && currentUser.username !== "admin") return false;
    
    return true;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPath="/users" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Users & Permissions" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {isOffline && <OfflineAlert />}
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Input
                  placeholder="Search users..."
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
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new user account with specific roles and permissions.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                      <FormField
                        control={createForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={createForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirm password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={createForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="cashier">Cashier</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Role determines the base level of access the user has.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="permissions"
                        render={() => (
                          <FormItem>
                            <div className="mb-4">
                              <FormLabel>Permissions</FormLabel>
                              <FormDescription>
                                Select specific permissions for this user.
                              </FormDescription>
                            </div>
                            {availablePermissions.map((permission) => (
                              <FormField
                                key={permission.id}
                                control={createForm.control}
                                name="permissions"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={permission.id}
                                      className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(permission.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, permission.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== permission.id
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="cursor-pointer font-normal">
                                          {permission.label}
                                        </FormLabel>
                                      </div>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="cursor-pointer font-normal">
                                Active Account
                              </FormLabel>
                              <FormDescription>
                                Inactive accounts cannot log in to the system.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          disabled={createUserMutation.isPending}
                        >
                          {createUserMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create User
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
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.username}
                          {user.role === "admin" && (
                            <Shield className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getRoleBadgeClass(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.length === 0 ? (
                            <span className="text-muted-foreground">No specific permissions</span>
                          ) : (
                            user.permissions.map((permission) => {
                              const permissionLabel = availablePermissions.find(p => p.id === permission)?.label || permission;
                              return (
                                <span key={permission} className="px-2 py-1 bg-muted text-xs rounded-full">
                                  {permissionLabel}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${user.active ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                          disabled={!canManageUser(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(user)}
                          disabled={!canManageUser(user) || user.username === "admin"}
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
          
          {/* Edit User Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user account details, roles and permissions.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password (Optional)</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter new password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Leave blank to keep current password.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="cashier">Cashier</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Role determines the base level of access the user has.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="permissions"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Permissions</FormLabel>
                          <FormDescription>
                            Select specific permissions for this user.
                          </FormDescription>
                        </div>
                        {availablePermissions.map((permission) => (
                          <FormField
                            key={permission.id}
                            control={editForm.control}
                            name="permissions"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={permission.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(permission.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, permission.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== permission.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="cursor-pointer font-normal">
                                      {permission.label}
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer font-normal">
                            Active Account
                          </FormLabel>
                          <FormDescription>
                            Inactive accounts cannot log in to the system.
                          </FormDescription>
                        </div>
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
                      disabled={updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update User
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
                  Are you sure you want to delete the user "{selectedUser?.username}"? This action cannot be undone.
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
                  disabled={deleteUserMutation.isPending}
                >
                  {deleteUserMutation.isPending && (
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
