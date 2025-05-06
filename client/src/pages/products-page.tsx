import { useState, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Plus, Pencil, Trash2, Upload, Image as ImageIcon, Tag, Barcode, DollarSign, Box, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Define maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

type Product = {
  id: number;
  name: string;
  description: string;
  price: number | string;
  category_id: number;
  stock: number;
  barcode?: string;
  sku?: string;
  image?: string;
};

type Category = {
  id: number;
  name: string;
};

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number"),
  category_id: z.coerce.number().positive("Please select a category"),
  stock: z.coerce.number().nonnegative("Stock cannot be negative"),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  image: z.instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, `File size should be less than 5MB`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported"
    )
    .optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", searchQuery],
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Create product form
  const createForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category_id: 0,
      stock: 0,
      barcode: "",
      sku: "",
      image: undefined,
    },
  });
  
  // Handle image file change
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Update form
      createForm.setValue("image", file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Edit product form
  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category_id: 0,
      stock: 0,
      barcode: "",
      sku: "",
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Product created",
        description: "Product has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues & { id: number }) => {
      const { id, ...productData } = data;
      const res = await apiRequest("PUT", `/api/products/${id}`, productData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      toast({
        title: "Product updated",
        description: "Product has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      toast({
        title: "Product deleted",
        description: "Product has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle create product submit
  const onCreateSubmit = (data: ProductFormValues) => {
    // Create FormData for image upload
    if (data.image) {
      const formData = new FormData();
      
      // Append all form data
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'image' && value instanceof File) {
          formData.append(key, value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      // Handle form data submission with image
      const formDataMutation = async () => {
        try {
          const response = await fetch('/api/products/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Failed to upload product');
          }
          
          const result = await response.json();
          
          // Success handling
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
          setIsCreateDialogOpen(false);
          setImagePreview(null);
          createForm.reset();
          toast({
            title: "Product created",
            description: "Product has been created successfully with image",
          });
          
          return result;
        } catch (error) {
          toast({
            title: "Failed to create product",
            description: error instanceof Error ? error.message : "Unknown error occurred",
            variant: "destructive",
          });
          throw error;
        }
      };
      
      formDataMutation();
    } else {
      // Regular submission without image
      createProductMutation.mutate(data);
    }
  };

  // Handle edit product submit
  const onEditSubmit = (data: ProductFormValues) => {
    if (selectedProduct) {
      updateProductMutation.mutate({
        id: selectedProduct.id,
        ...data,
      });
    }
  };

  // Handle delete product
  const onDeleteConfirm = () => {
    if (selectedProduct) {
      deleteProductMutation.mutate(selectedProduct.id);
    }
  };

  // Set up edit form when a product is selected
  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    editForm.reset({
      name: product.name,
      description: product.description || "",
      price: typeof product.price === 'number' 
        ? product.price 
        : parseFloat(product.price as string),
      category_id: product.category_id,
      stock: product.stock,
      barcode: product.barcode || "",
      sku: product.sku || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Filter products based on search query
  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPath="/products" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Products" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {isOffline && <OfflineAlert />}
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-semibold text-foreground">Product Management</h1>
            
            <div className="flex w-full md:w-auto gap-2">
              <div className="relative flex-1 md:w-64">
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                      Create a new product with details and inventory information.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                      <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="basic" className="flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Basic Info
                          </TabsTrigger>
                          <TabsTrigger value="inventory" className="flex items-center gap-2">
                            <Box className="h-4 w-4" />
                            Inventory
                          </TabsTrigger>
                          <TabsTrigger value="image" className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Image
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="basic" className="pt-4">
                          <FormField
                            control={createForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter product name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="mt-4">
                            <FormField
                              control={createForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Enter product description" 
                                      {...field} 
                                      rows={3}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <FormField
                              control={createForm.control}
                              name="price"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <Input 
                                        type="number" 
                                        placeholder="0.00" 
                                        {...field}
                                        min={0}
                                        step="0.01"
                                        className="pl-8"
                                        onChange={(e) => {
                                          const value = e.target.value === "" ? "0" : e.target.value;
                                          field.onChange(value);
                                        }}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={createForm.control}
                              name="category_id"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select 
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                    defaultValue={field.value.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {categoriesLoading ? (
                                        <div className="flex justify-center p-2">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                      ) : (
                                        categories?.map(category => (
                                          <SelectItem 
                                            key={category.id} 
                                            value={category.id.toString()}
                                          >
                                            {category.name}
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="inventory" className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={createForm.control}
                              name="stock"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Stock Quantity</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0" 
                                      {...field}
                                      min={0}
                                      onChange={(e) => {
                                        const value = e.target.value === "" ? "0" : e.target.value;
                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    The current quantity available in inventory
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={createForm.control}
                              name="low_stock_threshold"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Low Stock Threshold</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="10" 
                                      min={0}
                                      {...field}
                                      onChange={(e) => {
                                        const value = e.target.value === "" ? "10" : e.target.value;
                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    <div className="space-y-1 mt-1">
                                      <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-destructive"></div>
                                        <span className="text-xs">Out of stock (0)</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-warning"></div>
                                        <span className="text-xs">Low stock (below threshold)</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-success"></div>
                                        <span className="text-xs">Sufficient stock</span>
                                      </div>
                                    </div>
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <FormField
                              control={createForm.control}
                              name="sku"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>SKU</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Tag className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <Input placeholder="SKU identifier" {...field} className="pl-8" />
                                    </div>
                                  </FormControl>
                                  <FormDescription>
                                    Stock Keeping Unit (unique identifier)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={createForm.control}
                              name="barcode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Barcode</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Barcode className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <Input placeholder="Barcode" {...field} className="pl-8" />
                                    </div>
                                  </FormControl>
                                  <FormDescription>
                                    Barcode number (UPC, EAN, etc.)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="image" className="pt-4">
                          <FormField
                            control={createForm.control}
                            name="image"
                            render={({ field: { onChange, value, ...field } }) => (
                              <FormItem>
                                <FormLabel>Product Image</FormLabel>
                                <FormControl>
                                  <div className="flex flex-col items-center justify-center gap-4">
                                    {imagePreview ? (
                                      <div className="relative w-full">
                                        <img 
                                          src={imagePreview} 
                                          alt="Product preview" 
                                          className="rounded-md mx-auto max-h-48 object-contain border" 
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="absolute top-2 right-2"
                                          onClick={() => {
                                            setImagePreview(null);
                                            createForm.setValue("image", undefined);
                                            if (fileInputRef.current) {
                                              fileInputRef.current.value = "";
                                            }
                                          }}
                                        >
                                          Clear
                                        </Button>
                                      </div>
                                    ) : (
                                      <div 
                                        className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 w-full cursor-pointer hover:border-primary/50 transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                      >
                                        <Upload className="h-10 w-10 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground text-center">
                                          Click to upload or drag and drop<br />
                                          JPG, PNG or WebP (max 5MB)
                                        </p>
                                      </div>
                                    )}
                                    <input
                                      type="file"
                                      ref={fileInputRef}
                                      onChange={handleImageChange}
                                      accept="image/jpeg,image/png,image/webp"
                                      className="hidden"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => fileInputRef.current?.click()}
                                    >
                                      <Upload className="mr-2 h-4 w-4" />
                                      {imagePreview ? "Choose another image" : "Upload image"}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Upload a product image to enhance your listing
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      </Tabs>
                      
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          disabled={createProductMutation.isPending}
                        >
                          {createProductMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create Product
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
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredProducts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts?.map((product) => {
                    const category = categories?.find(c => c.id === product.category_id);
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="h-10 w-10 object-cover rounded-md" />
                          ) : (
                            <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          {product.name}
                        </TableCell>
                        <TableCell>{category?.name || "Unknown"}</TableCell>
                        <TableCell>
                          ${typeof product.price === 'number' 
                            ? product.price.toFixed(2) 
                            : parseFloat(product.price as string).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            product.stock <= 0 
                              ? "bg-destructive/20 text-destructive" 
                              : product.stock < 10 
                                ? "bg-warning/20 text-warning" 
                                : "bg-success/20 text-success"
                          }`}>
                            {product.stock} in stock
                          </span>
                        </TableCell>
                        <TableCell>{product.sku || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(product)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Edit Product Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Update product details and inventory information.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
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
                            placeholder="Enter product description" 
                            {...field} 
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field}
                              min={0}
                              step="0.01"
                              onChange={(e) => {
                                const value = e.target.value === "" ? "0" : e.target.value;
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field}
                              min={0}
                              onChange={(e) => {
                                const value = e.target.value === "" ? "0" : e.target.value;
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoriesLoading ? (
                              <div className="flex justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              categories?.map(category => (
                                <SelectItem 
                                  key={category.id} 
                                  value={category.id.toString()}
                                >
                                  {category.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="SKU identifier" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Barcode</FormLabel>
                          <FormControl>
                            <Input placeholder="Barcode" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                      disabled={updateProductMutation.isPending}
                    >
                      {updateProductMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Product
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
                  Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
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
                  disabled={deleteProductMutation.isPending}
                >
                  {deleteProductMutation.isPending && (
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
