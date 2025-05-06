import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function OfflineAlert() {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed) {
    return null;
  }
  
  return (
    <Alert className="bg-warning/20 text-warning-foreground border-warning/50 mb-4 flex items-center justify-between">
      <div className="flex items-center">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <AlertDescription>
          You're currently offline. Data will be synced when connection is restored.
        </AlertDescription>
      </div>
      <button 
        onClick={() => setDismissed(true)}
        className="text-warning-foreground hover:text-warning-foreground/80"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}
