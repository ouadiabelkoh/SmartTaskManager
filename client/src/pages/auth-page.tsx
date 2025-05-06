import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/use-theme";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { 
  Loader2, 
  ShoppingBag, 
  Moon, 
  Sun, 
  Smartphone, 
  KeyRound, 
  UserCircle, 
  ScanLine,
  ChevronDown,
  ChevronLeft
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Schema for traditional username/password login
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Schema for PIN login
const pinLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  pin: z.string().min(4, "PIN must be at least 4 digits").max(6, "PIN cannot exceed 6 digits"),
});

type PinLoginData = z.infer<typeof pinLoginSchema>;

// Schema for barcode login
const barcodeLoginSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
});

type BarcodeLoginData = z.infer<typeof barcodeLoginSchema>;

// Schema for phone number login
const phoneLoginSchema = z.object({
  phone_number: z.string().min(8, "Enter a valid phone number"),
});

type PhoneLoginData = z.infer<typeof phoneLoginSchema>;

// Schema for registration
const registerSchema = insertUserSchema
  .extend({
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// Auth mode types
type AuthMode = "full" | "touch";
type LoginMethod = "password" | "pin" | "barcode" | "phone";

export default function AuthPage() {
  const [tab, setTab] = useState<string>("login");
  const [authMode, setAuthMode] = useState<AuthMode>("full");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [pinValue, setPinValue] = useState<string>("");
  const { user, loginMutation, pinLoginMutation, barcodeLoginMutation, phoneLoginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const isMobile = useMobile();
  const { theme, toggleTheme } = useTheme();
  
  // Choose appropriate welcome message for time of day
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning!";
    if (hour < 18) return "Good afternoon!";
    return "Good evening!";
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Use touch mode automatically on mobile devices
  useEffect(() => {
    if (isMobile) {
      setAuthMode("touch");
    }
  }, [isMobile]);

  // Forms for different login methods
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const pinLoginForm = useForm<PinLoginData>({
    resolver: zodResolver(pinLoginSchema),
    defaultValues: {
      username: "",
      pin: "",
    },
  });

  const barcodeLoginForm = useForm<BarcodeLoginData>({
    resolver: zodResolver(barcodeLoginSchema),
    defaultValues: {
      barcode: "",
    },
  });

  const phoneLoginForm = useForm<PhoneLoginData>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: {
      phone_number: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      role: "cashier",
    },
  });

  // Form submission handlers
  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onPinLoginSubmit = (data: PinLoginData) => {
    pinLoginMutation.mutate(data);
  };

  const onBarcodeLoginSubmit = (data: BarcodeLoginData) => {
    barcodeLoginMutation.mutate(data);
  };

  const onPhoneLoginSubmit = (data: PhoneLoginData) => {
    phoneLoginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  };

  // Handle PIN pad input
  const handlePinPadClick = (digit: string) => {
    if (digit === "clear") {
      setPinValue("");
      pinLoginForm.setValue("pin", "");
    } else if (digit === "backspace") {
      const newVal = pinValue.slice(0, -1);
      setPinValue(newVal);
      pinLoginForm.setValue("pin", newVal);
    } else if (pinValue.length < 6) { // Limit PIN to 6 digits
      const newVal = pinValue + digit;
      setPinValue(newVal);
      pinLoginForm.setValue("pin", newVal);
    }
  };

  // Render a PIN pad button
  const PinButton = ({ value, label, onClick, className, children }: { value: string; label?: string; onClick: (value: string) => void; className?: string; children?: React.ReactNode }) => (
    <Button
      type="button"
      variant="outline"
      className={cn("h-14 text-xl font-semibold", className)}
      onClick={() => onClick(value)}
    >
      {children || label || value}
    </Button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Auth Form Section */}
      <div className="md:w-1/2 p-4 md:p-12 flex flex-col">
        {/* Mode Switch and Theme Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Label htmlFor="auth-mode" className="text-sm text-muted-foreground">Touch Mode</Label>
            <Switch 
              id="auth-mode" 
              checked={authMode === "touch"}
              onCheckedChange={(checked) => setAuthMode(checked ? "touch" : "full")}
            />
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        {/* Main Auth Card */}
        <div className="flex-1 flex items-center justify-center">
          <Card className={cn(
            "w-full transition-all duration-300",
            authMode === "touch" ? "max-w-md" : "max-w-md"
          )}>
            <CardHeader className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center text-white">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">
                {authMode === "touch" ? getWelcomeMessage() : "RetailPOS"}
              </CardTitle>
              <CardDescription>
                {authMode === "touch" 
                  ? "Sign in to continue" 
                  : "Sign in to access your point of sale system"
                }
              </CardDescription>
            </CardHeader>

            {/* Full Mode - Traditional Login UI */}
            {authMode === "full" && (
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                {/* Login Tab Content */}
                <TabsContent value="login">
                  {/* Login Method Selection */}
                  <div className="px-6 pt-2 pb-0">
                    <Select
                      value={loginMethod}
                      onValueChange={(value) => setLoginMethod(value as LoginMethod)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select login method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="password">
                          <div className="flex items-center">
                            <UserCircle className="mr-2 h-4 w-4" />
                            <span>Username & Password</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="pin">
                          <div className="flex items-center">
                            <KeyRound className="mr-2 h-4 w-4" />
                            <span>PIN Code</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="barcode">
                          <div className="flex items-center">
                            <ScanLine className="mr-2 h-4 w-4" />
                            <span>Barcode</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="phone">
                          <div className="flex items-center">
                            <Smartphone className="mr-2 h-4 w-4" />
                            <span>Phone Number</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Username & Password Login Form */}
                  {loginMethod === "password" && (
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                      <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            {...loginForm.register("username")}
                          />
                          {loginForm.formState.errors.username && (
                            <p className="text-sm text-destructive">
                              {loginForm.formState.errors.username.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            {...loginForm.register("password")}
                          />
                          {loginForm.formState.errors.password && (
                            <p className="text-sm text-destructive">
                              {loginForm.formState.errors.password.message}
                            </p>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Sign In
                        </Button>
                      </CardFooter>
                    </form>
                  )}

                  {/* PIN Code Login Form */}
                  {loginMethod === "pin" && (
                    <form onSubmit={pinLoginForm.handleSubmit(onPinLoginSubmit)}>
                      <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                          <Label htmlFor="pin-username">Username</Label>
                          <Input
                            id="pin-username"
                            type="text"
                            placeholder="Enter your username"
                            {...pinLoginForm.register("username")}
                          />
                          {pinLoginForm.formState.errors.username && (
                            <p className="text-sm text-destructive">
                              {pinLoginForm.formState.errors.username.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pin-code">PIN Code</Label>
                          <Input
                            id="pin-code"
                            type="password"
                            placeholder="Enter your PIN"
                            maxLength={6}
                            value={pinValue}
                            onChange={(e) => {
                              setPinValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
                              pinLoginForm.setValue("pin", e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
                            }}
                          />
                          {pinLoginForm.formState.errors.pin && (
                            <p className="text-sm text-destructive">
                              {pinLoginForm.formState.errors.pin.message}
                            </p>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={pinLoginMutation.isPending}
                        >
                          {pinLoginMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Sign In with PIN
                        </Button>
                      </CardFooter>
                    </form>
                  )}

                  {/* Barcode Login Form */}
                  {loginMethod === "barcode" && (
                    <form onSubmit={barcodeLoginForm.handleSubmit(onBarcodeLoginSubmit)}>
                      <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                          <Label htmlFor="barcode">Scan Barcode</Label>
                          <Input
                            id="barcode"
                            type="text"
                            placeholder="Scan or enter barcode"
                            autoFocus
                            {...barcodeLoginForm.register("barcode")}
                          />
                          {barcodeLoginForm.formState.errors.barcode && (
                            <p className="text-sm text-destructive">
                              {barcodeLoginForm.formState.errors.barcode.message}
                            </p>
                          )}
                        </div>
                        <div className="pt-2 text-center">
                          <ScanLine className="h-16 w-16 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mt-2">
                            Position your employee badge barcode in front of the scanner
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={barcodeLoginMutation.isPending}
                        >
                          {barcodeLoginMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Sign In with Barcode
                        </Button>
                      </CardFooter>
                    </form>
                  )}

                  {/* Phone Number Login Form */}
                  {loginMethod === "phone" && (
                    <form onSubmit={phoneLoginForm.handleSubmit(onPhoneLoginSubmit)}>
                      <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                          <Label htmlFor="phone_number">Phone Number</Label>
                          <Input
                            id="phone_number"
                            type="tel"
                            placeholder="Enter your phone number"
                            {...phoneLoginForm.register("phone_number")}
                          />
                          {phoneLoginForm.formState.errors.phone_number && (
                            <p className="text-sm text-destructive">
                              {phoneLoginForm.formState.errors.phone_number.message}
                            </p>
                          )}
                        </div>
                        <div className="pt-2 text-center">
                          <Smartphone className="h-16 w-16 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mt-2">
                            In a real implementation, we would send a verification code to this phone number
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={phoneLoginMutation.isPending}
                        >
                          {phoneLoginMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Sign In with Phone
                        </Button>
                      </CardFooter>
                    </form>
                  )}
                </TabsContent>

                {/* Registration Tab Content */}
                <TabsContent value="register">
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                    <CardContent className="space-y-4 pt-6">
                      <div className="space-y-2">
                        <Label htmlFor="register-username">Username</Label>
                        <Input
                          id="register-username"
                          type="text"
                          placeholder="Choose a username"
                          {...registerForm.register("username")}
                        />
                        {registerForm.formState.errors.username && (
                          <p className="text-sm text-destructive">
                            {registerForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Create a password"
                          {...registerForm.register("password")}
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-destructive">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-confirm">Confirm Password</Label>
                        <Input
                          id="register-confirm"
                          type="password"
                          placeholder="Confirm your password"
                          {...registerForm.register("confirmPassword")}
                        />
                        {registerForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-destructive">
                            {registerForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                          defaultValue="cashier"
                          onValueChange={(value) => registerForm.setValue("role", value)}
                        >
                          <SelectTrigger id="role">
                            <SelectValue placeholder="Select user role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cashier">Cashier</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Account
                      </Button>
                    </CardFooter>
                  </form>
                </TabsContent>
              </Tabs>
            )}

            {/* Touch Mode - Touchscreen Optimized UI */}
            {authMode === "touch" && (
              <div>
                {/* Login Method Selection */}
                <div className="px-6 pt-2 pb-4 flex space-x-2">
                  <Button
                    variant={loginMethod === "pin" ? "default" : "outline"}
                    className="flex-1 h-12"
                    onClick={() => setLoginMethod("pin")}
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    PIN
                  </Button>
                  <Button
                    variant={loginMethod === "barcode" ? "default" : "outline"}
                    className="flex-1 h-12"
                    onClick={() => setLoginMethod("barcode")}
                  >
                    <ScanLine className="mr-2 h-4 w-4" />
                    Barcode
                  </Button>
                  <Button
                    variant={loginMethod === "password" ? "default" : "outline"}
                    className="flex-1 h-12"
                    onClick={() => setLoginMethod("password")}
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    Password
                  </Button>
                </div>

                {/* Touch Mode - PIN Entry */}
                {loginMethod === "pin" && (
                  <form onSubmit={pinLoginForm.handleSubmit(onPinLoginSubmit)}>
                    <CardContent className="p-4 pt-0">
                      <div className="mb-6">
                        <Label htmlFor="touch-username" className="text-lg font-medium">Username</Label>
                        <Input
                          id="touch-username"
                          type="text"
                          className="h-12 text-lg mt-1"
                          placeholder="Enter your username"
                          {...pinLoginForm.register("username")}
                        />
                        {pinLoginForm.formState.errors.username && (
                          <p className="text-sm text-destructive mt-1">
                            {pinLoginForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>

                      <div className="mb-4">
                        <Label htmlFor="touch-pin" className="text-lg font-medium">PIN</Label>
                        <Input
                          id="touch-pin"
                          type="password"
                          className="h-12 text-lg text-center tracking-widest font-bold mt-1"
                          value={pinValue}
                          placeholder="Enter PIN"
                          readOnly
                        />
                        {pinLoginForm.formState.errors.pin && (
                          <p className="text-sm text-destructive mt-1">
                            {pinLoginForm.formState.errors.pin.message}
                          </p>
                        )}
                      </div>

                      {/* PIN Pad */}
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <PinButton value="1" onClick={handlePinPadClick} />
                        <PinButton value="2" onClick={handlePinPadClick} />
                        <PinButton value="3" onClick={handlePinPadClick} />
                        <PinButton value="4" onClick={handlePinPadClick} />
                        <PinButton value="5" onClick={handlePinPadClick} />
                        <PinButton value="6" onClick={handlePinPadClick} />
                        <PinButton value="7" onClick={handlePinPadClick} />
                        <PinButton value="8" onClick={handlePinPadClick} />
                        <PinButton value="9" onClick={handlePinPadClick} />
                        <PinButton value="clear" label="Clear" onClick={handlePinPadClick} className="col-span-1" />
                        <PinButton value="0" onClick={handlePinPadClick} />
                        <PinButton 
                          value="backspace" 
                          onClick={handlePinPadClick} 
                          className="col-span-1"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </PinButton>
                      </div>
                    </CardContent>
                    <CardFooter className="px-4 pb-6">
                      <Button 
                        type="submit" 
                        size="lg"
                        className="w-full h-14 text-lg" 
                        disabled={pinLoginMutation.isPending || !pinLoginForm.getValues().username || !pinValue}
                      >
                        {pinLoginMutation.isPending ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <KeyRound className="mr-2 h-5 w-5" />
                        )}
                        Sign In
                      </Button>
                    </CardFooter>
                  </form>
                )}

                {/* Touch Mode - Barcode Entry */}
                {loginMethod === "barcode" && (
                  <form onSubmit={barcodeLoginForm.handleSubmit(onBarcodeLoginSubmit)}>
                    <CardContent className="p-6 pt-0">
                      <div className="text-center mb-6 p-6">
                        <ScanLine className="h-24 w-24 mx-auto text-primary" />
                        <p className="text-lg text-muted-foreground mt-4">
                          Scan your employee badge
                        </p>
                      </div>
                      <div className="mb-4">
                        <Label htmlFor="touch-barcode" className="text-lg font-medium">Barcode</Label>
                        <Input
                          id="touch-barcode"
                          type="text"
                          className="h-12 text-lg mt-1"
                          placeholder="Scan or type barcode"
                          autoFocus
                          {...barcodeLoginForm.register("barcode")}
                        />
                        {barcodeLoginForm.formState.errors.barcode && (
                          <p className="text-sm text-destructive mt-1">
                            {barcodeLoginForm.formState.errors.barcode.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="px-6 pb-6">
                      <Button 
                        type="submit" 
                        size="lg"
                        className="w-full h-14 text-lg" 
                        disabled={barcodeLoginMutation.isPending}
                      >
                        {barcodeLoginMutation.isPending ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <ScanLine className="mr-2 h-5 w-5" />
                        )}
                        Authenticate
                      </Button>
                    </CardFooter>
                  </form>
                )}

                {/* Touch Mode - Username/Password Entry */}
                {loginMethod === "password" && (
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                    <CardContent className="p-6 pt-0">
                      <div className="mb-4">
                        <Label htmlFor="touch-user-username" className="text-lg font-medium">Username</Label>
                        <Input
                          id="touch-user-username"
                          type="text"
                          className="h-12 text-lg mt-1"
                          placeholder="Enter your username"
                          {...loginForm.register("username")}
                        />
                        {loginForm.formState.errors.username && (
                          <p className="text-sm text-destructive mt-1">
                            {loginForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>
                      <div className="mb-4">
                        <Label htmlFor="touch-user-password" className="text-lg font-medium">Password</Label>
                        <Input
                          id="touch-user-password"
                          type="password"
                          className="h-12 text-lg mt-1"
                          placeholder="Enter your password"
                          {...loginForm.register("password")}
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-destructive mt-1">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="px-6 pb-6">
                      <Button 
                        type="submit" 
                        size="lg"
                        className="w-full h-14 text-lg" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <UserCircle className="mr-2 h-5 w-5" />
                        )}
                        Sign In
                      </Button>
                    </CardFooter>
                  </form>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Hero Section */}
      <div className="md:w-1/2 bg-primary text-white p-6 md:p-12 flex flex-col justify-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-bold mb-6">Welcome to RetailPOS</h2>
          <p className="text-lg mb-8">
            A comprehensive point of sale system designed for modern retail businesses.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Inventory Management</h3>
                <p className="text-white/80">Track stock levels and monitor product availability</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4Z"></path>
                  <path d="M18 14V8m-4 8v-4m-4 4v-2m-4 2v-6"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Sales Analytics</h3>
                <p className="text-white/80">Real-time reporting and performance insights</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 5 2 12l19 6.952V5Z"></path>
                  <path d="m21 5-9.667 7h4.952L21 5Z"></path>
                  <path d="M2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-1.048L2 12Z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Offline Mode</h3>
                <p className="text-white/80">Continue operations even without internet connection</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Customer Management</h3>
                <p className="text-white/80">Build customer profiles and track purchase history</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
