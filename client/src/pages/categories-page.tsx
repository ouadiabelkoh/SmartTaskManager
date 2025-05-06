import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  ChevronRight, 
  Package
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type Category = {
  id: number;
  name: string;
  description?: string;
  image?: string;
  product_count?: number;
};

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch categories
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Create category form
  const createForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Edit category form
  const editForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const res = await apiRequest("POST", "/api/categories", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Category created",
        description: "Category has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues & { id: number }) => {
      const { id, ...categoryData } = data;
      const res = await apiRequest("PUT", `/api/categories/${id}`, categoryData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      toast({
        title: "Category updated",
        description: "Category has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
      toast({
        title: "Category deleted",
        description: "Category has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle file upload for create form
  const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCreateImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setCreateImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle file upload for edit form
  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload category with image
  const createCategoryWithImage = useMutation({
    mutationFn: async (data: { formData: FormData }) => {
      const res = await fetch('/api/categories/upload', {
        method: 'POST',
        body: data.formData,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to upload category');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      setCreateImageFile(null);
      setCreateImagePreview(null);
      toast({
        title: "Category created",
        description: "Category has been created successfully with image",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create category with image",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update category image
  const updateCategoryImage = useMutation({
    mutationFn: async (data: { id: number; formData: FormData }) => {
      const res = await fetch(`/api/categories/${data.id}/image`, {
        method: 'PUT',
        body: data.formData,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update category image');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      setEditImageFile(null);
      setEditImagePreview(null);
      toast({
        title: "Category updated",
        description: "Category image has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update category image",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle create category submit
  const onCreateSubmit = (data: CategoryFormValues) => {
    if (createImageFile) {
      // Create category with image
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      formData.append('image', createImageFile);
      
      createCategoryWithImage.mutate({ formData });
    } else {
      // Create category without image
      createCategoryMutation.mutate(data);
    }
  };

  // Handle edit category submit
  const onEditSubmit = (data: CategoryFormValues) => {
    if (selectedCategory) {
      // First update the category details
      updateCategoryMutation.mutate({
        id: selectedCategory.id,
        ...data,
      });
      
      // If there's a new image, upload it separately
      if (editImageFile) {
        const formData = new FormData();
        formData.append('image', editImageFile);
        
        updateCategoryImage.mutate({ 
          id: selectedCategory.id, 
          formData 
        });
      }
    }
  };

  // Handle delete category
  const onDeleteConfirm = () => {
    if (selectedCategory) {
      deleteCategoryMutation.mutate(selectedCategory.id);
    }
  };

  // Set up edit form when a category is selected
  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    editForm.reset({
      name: category.name,
      description: category.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPath="/categories" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Categories" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {isOffline && <OfflineAlert />}
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-semibold text-foreground">Category Management</h1>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                  <DialogDescription>
                    Create a new product category to organize your inventory.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter category name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter category description (optional)" 
                              {...field} 
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <Label htmlFor="create-image">Category Image</Label>
                      <div className="flex flex-col space-y-2">
                        {createImagePreview && (
                          <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                            <img 
                              src={createImagePreview} 
                              alt="Category preview" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => createFileInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {createImagePreview ? 'Change Image' : 'Upload Image'}
                          </Button>
                          {createImagePreview && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCreateImageFile(null);
                                setCreateImagePreview(null);
                                if (createFileInputRef.current) {
                                  createFileInputRef.current.value = '';
                                }
                              }}
                            >
                              Remove
                            </Button>
                          )}
                          <input
                            ref={createFileInputRef}
                            type="file"
                            id="create-image"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCreateFileChange}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Upload a square image for best results. Max file size 2MB.
                        </p>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createCategoryMutation.isPending || createCategoryWithImage.isPending}
                      >
                        {(createCategoryMutation.isPending || createCategoryWithImage.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Category
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Products</TableHead>
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
                ) : categories?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories?.map((category) => (
                    <TableRow 
                      key={category.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        // Navigate to products filtered by this category
                        navigate(`/products?category_id=${category.id}`);
                      }}
                    >
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          {category.image ? (
                            <AvatarImage src={category.image} alt={category.name} />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {category.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{category.product_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            openEditDialog(category);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            openDeleteDialog(category);
                          }}
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
          
          {/* Edit Category Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>
                  Update category details.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter category name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter category description (optional)" 
                            {...field} 
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-image">Category Image</Label>
                    <div className="flex flex-col space-y-2">
                      <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                        {editImagePreview ? (
                          <img 
                            src={editImagePreview} 
                            alt="Category preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : selectedCategory?.image ? (
                          <img 
                            src={selectedCategory.image} 
                            alt={selectedCategory.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => editFileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {editImagePreview || selectedCategory?.image ? 'Change Image' : 'Upload Image'}
                        </Button>
                        {(editImagePreview || selectedCategory?.image) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditImageFile(null);
                              setEditImagePreview(null);
                              if (editFileInputRef.current) {
                                editFileInputRef.current.value = '';
                              }
                            }}
                          >
                            Remove
                          </Button>
                        )}
                        <input
                          ref={editFileInputRef}
                          type="file"
                          id="edit-image"
                          accept="image/*"
                          className="hidden"
                          onChange={handleEditFileChange}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Upload a square image for best results. Max file size 2MB.
                      </p>
                    </div>
                  </div>
                  
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
                      disabled={updateCategoryMutation.isPending || updateCategoryImage.isPending}
                    >
                      {(updateCategoryMutation.isPending || updateCategoryImage.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Category
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
                  Are you sure you want to delete "{selectedCategory?.name}"? This will also affect products assigned to this category.
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
                  disabled={deleteCategoryMutation.isPending}
                >
                  {deleteCategoryMutation.isPending && (
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
