import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn("w-full", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { activeValue: value, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({
  children,
  className,
  activeValue,
  onValueChange,
}: {
  children: React.ReactNode;
  className?: string;
  activeValue?: string;
  onValueChange?: (val: string) => void;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { activeValue, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  activeValue,
  onValueChange,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeValue?: string;
  onValueChange?: (val: string) => void;
}) {
  const isActive = activeValue === value;
  return (
    <button
      type="button"
      onClick={() => onValueChange?.(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive
          ? "bg-background text-foreground shadow-sm font-semibold"
          : "hover:bg-background/50 hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  activeValue,
  className,
}: {
  value: string;
  children: React.ReactNode;
  activeValue?: string;
  className?: string;
}) {
  if (value !== activeValue) return null;
  return <div className={cn("mt-4 animate-in fade-in-50 duration-200", className)}>{children}</div>;
}
