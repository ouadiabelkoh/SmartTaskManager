import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CreditCard, DollarSign, QrCode, Receipt } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onPayment: (paymentData: PaymentData) => void;
}

interface PaymentData {
  method: string;
  amount: number;
  cardDetails?: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
  };
  changeDue?: number;
}

const cashPaymentSchema = z.object({
  amountTendered: z.coerce
    .number()
    .positive("Amount must be positive")
    .min(0.01, "Amount must be greater than 0"),
});

const cardPaymentSchema = z.object({
  cardNumber: z.string().min(13, "Card number must be at least 13 digits").max(19, "Card number must be at most 19 digits"),
  cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry date must be in MM/YY format"),
  cardCVV: z.string().min(3, "CVV must be at least 3 digits").max(4, "CVV must be at most 4 digits"),
  cardHolderName: z.string().min(2, "Name must be at least 2 characters"),
});

type CashFormValues = z.infer<typeof cashPaymentSchema>;
type CardFormValues = z.infer<typeof cardPaymentSchema>;

export function PaymentModal({
  isOpen,
  onClose,
  total,
  onPayment,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [processing, setProcessing] = useState(false);
  
  // Cash payment form
  const cashForm = useForm<CashFormValues>({
    resolver: zodResolver(cashPaymentSchema),
    defaultValues: {
      amountTendered: total,
    },
  });
  
  // Card payment form
  const cardForm = useForm<CardFormValues>({
    resolver: zodResolver(cardPaymentSchema),
    defaultValues: {
      cardNumber: "",
      cardExpiry: "",
      cardCVV: "",
      cardHolderName: "",
    },
  });
  
  // Handle cash payment submission
  const onCashSubmit = async (data: CashFormValues) => {
    setProcessing(true);
    try {
      // Calculate change due
      const changeDue = data.amountTendered - total;
      
      // Process payment
      await onPayment({
        method: "cash",
        amount: total,
        changeDue: changeDue >= 0 ? changeDue : 0,
      });
      
      // Reset form
      cashForm.reset();
    } catch (error) {
      console.error("Payment processing error:", error);
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle card payment submission
  const onCardSubmit = async (data: CardFormValues) => {
    setProcessing(true);
    try {
      // Process payment
      await onPayment({
        method: "card",
        amount: total,
        cardDetails: {
          number: data.cardNumber,
          expiry: data.cardExpiry,
          cvv: data.cardCVV,
          name: data.cardHolderName,
        },
      });
      
      // Reset form
      cardForm.reset();
    } catch (error) {
      console.error("Payment processing error:", error);
    } finally {
      setProcessing(false);
    }
  };
  
  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, "")
      .match(/.{1,4}/g)
      ?.join(" ")
      .substr(0, 19) || "";
  };
  
  // Format expiry date with slash
  const formatExpiryDate = (value: string) => {
    value = value.replace(/\D/g, "");
    if (value.length > 2) {
      return `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }
    return value;
  };
  
  // Calculate change due for cash payment
  const calculateChangeDue = () => {
    const amountTendered = cashForm.watch("amountTendered");
    if (!amountTendered || amountTendered < total) return 0;
    return amountTendered - total;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>
            Complete payment to finish the transaction.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="cash" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Cash
            </TabsTrigger>
            <TabsTrigger value="card" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Card
            </TabsTrigger>
            <TabsTrigger value="other" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Other
            </TabsTrigger>
          </TabsList>
          
          <div className="mb-4 flex justify-between items-center py-2 px-4 bg-muted rounded-md">
            <span className="font-medium">Total Due:</span>
            <span className="text-lg font-bold">${total.toFixed(2)}</span>
          </div>
          
          {/* Cash Payment */}
          <TabsContent value="cash">
            <Form {...cashForm}>
              <form onSubmit={cashForm.handleSubmit(onCashSubmit)} className="space-y-4">
                <FormField
                  control={cashForm.control}
                  name="amountTendered"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Tendered</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="0.00"
                            className="pl-10"
                            {...field}
                            onChange={(e) => {
                              // Only allow numeric input with up to 2 decimal places
                              const value = e.target.value.replace(/[^0-9.]/g, "");
                              const parts = value.split(".");
                              if (parts.length > 2) {
                                return;
                              }
                              if (parts[1] && parts[1].length > 2) {
                                return;
                              }
                              field.onChange(value);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {calculateChangeDue() > 0 && (
                  <div className="p-4 bg-muted rounded-md flex justify-between items-center">
                    <span className="font-medium">Change Due:</span>
                    <span className="text-lg">${calculateChangeDue().toFixed(2)}</span>
                  </div>
                )}
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={processing}>
                    {processing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Receipt className="mr-2 h-4 w-4" />
                    )}
                    Complete Payment
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          {/* Card Payment */}
          <TabsContent value="card">
            <Form {...cardForm}>
              <form onSubmit={cardForm.handleSubmit(onCardSubmit)} className="space-y-4">
                <FormField
                  control={cardForm.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="•••• •••• •••• ••••"
                            className="pl-10"
                            {...field}
                            value={formatCardNumber(field.value)}
                            onChange={(e) => {
                              // Only allow numeric input
                              const value = e.target.value.replace(/[^\d\s]/g, "");
                              field.onChange(value);
                            }}
                            maxLength={19}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={cardForm.control}
                    name="cardExpiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="MM/YY"
                            {...field}
                            value={formatExpiryDate(field.value)}
                            onChange={(e) => {
                              field.onChange(formatExpiryDate(e.target.value));
                            }}
                            maxLength={5}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={cardForm.control}
                    name="cardCVV"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVV</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="•••"
                            type="password"
                            {...field}
                            onChange={(e) => {
                              // Only allow numeric input
                              const value = e.target.value.replace(/\D/g, "");
                              field.onChange(value);
                            }}
                            maxLength={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={cardForm.control}
                  name="cardHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cardholder Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Name on card" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={processing}>
                    {processing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Receipt className="mr-2 h-4 w-4" />
                    )}
                    Process Payment
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          {/* Other Payment Methods */}
          <TabsContent value="other">
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8">
                <QrCode className="h-24 w-24 mb-4 text-muted-foreground" />
                <p className="text-center mb-2">
                  Mobile payment options coming soon.
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  Please use cash or card payment methods for now.
                </p>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
