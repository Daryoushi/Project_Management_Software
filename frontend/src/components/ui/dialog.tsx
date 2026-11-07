import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{ onClose?: () => void }>({});

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ onClose: () => onOpenChange(false) }}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        onClick={() => onOpenChange(false)}
      >
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        />
        <div
          className="relative z-50 w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onOpenChange(false);
            }
          }}
        >
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
}

export function DialogContent({
  children,
  className,
  onClose,
}: {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}) {
  const ctx = React.useContext(DialogContext);
  const handleClose = onClose || ctx.onClose;

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl transition-all duration-200 animate-in zoom-in-95 max-h-[88vh] overflow-y-auto",
        className
      )}
      style={{ direction: "ltr" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top left close cross button */}
      {handleClose && (
        <button
          type="button"
          onClick={handleClose}
          style={{ left: "16px", right: "auto", top: "16px" }}
          className="absolute top-4 left-4 z-50 rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          title="بستن پنجره (Esc)"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div style={{ direction: "rtl", textAlign: "start" }} className="w-full">
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-start mb-4", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-bold leading-none tracking-tight", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-6", className)} {...props} />;
}
