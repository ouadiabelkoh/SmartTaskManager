import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  pinLoginMutation: UseMutationResult<SelectUser, Error, PinLoginData>;
  barcodeLoginMutation: UseMutationResult<SelectUser, Error, BarcodeLoginData>;
  phoneLoginMutation: UseMutationResult<SelectUser, Error, PhoneLoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  logoutAllMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  setPinMutation: UseMutationResult<SelectUser, Error, SetPinData>;
  setBarcodeMutation: UseMutationResult<SelectUser, Error, SetBarcodeData>;
};

// Different authentication methods data structures
type LoginData = Pick<InsertUser, "username" | "password">;
type PinLoginData = { username: string; pin: string };
type BarcodeLoginData = { barcode: string };
type PhoneLoginData = { phone_number: string };
type SetPinData = { pin_code: string; current_password: string };
type SetBarcodeData = { barcode: string };

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Username + Password login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // PIN login
  const pinLoginMutation = useMutation({
    mutationFn: async (credentials: PinLoginData) => {
      const res = await apiRequest("POST", "/api/login/pin", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "PIN Login successful",
        description: `Welcome, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "PIN Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Barcode login
  const barcodeLoginMutation = useMutation({
    mutationFn: async (credentials: BarcodeLoginData) => {
      const res = await apiRequest("POST", "/api/login/barcode", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Phone number login
  const phoneLoginMutation = useMutation({
    mutationFn: async (credentials: PhoneLoginData) => {
      const res = await apiRequest("POST", "/api/login/phone", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // User registration
  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout from current device
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout from all devices
  const logoutAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout-all");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out from all devices",
        description: "You have been successfully logged out from all devices.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set PIN code
  const setPinMutation = useMutation({
    mutationFn: async (data: SetPinData) => {
      const res = await apiRequest("POST", "/api/user/set-pin", data);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "PIN updated",
        description: "Your PIN has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update PIN",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set barcode
  const setBarcodeMutation = useMutation({
    mutationFn: async (data: SetBarcodeData) => {
      const res = await apiRequest("POST", "/api/user/set-barcode", data);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Barcode updated",
        description: "Your login barcode has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update barcode",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        pinLoginMutation,
        barcodeLoginMutation,
        phoneLoginMutation,
        logoutMutation,
        logoutAllMutation,
        registerMutation,
        setPinMutation,
        setBarcodeMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
