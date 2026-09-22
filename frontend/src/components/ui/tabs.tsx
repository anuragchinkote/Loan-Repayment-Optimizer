import * as React from "react";
import { cn } from "../../lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>");
  return ctx;
}

function Tabs({
  value,
  onValueChange,
  defaultValue,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const setValue = React.useCallback(
    (next: string) => {
      if (!controlled) setInternal(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );

  const context = React.useMemo(
    () => ({ value: current, onValueChange: setValue }),
    [current, setValue],
  );

  return (
    <TabsContext.Provider value={context}>
      <div className={cn(className)} {...props} />
    </TabsContext.Provider>
  );
}

function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { value } = useTabs();
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      data-state={value}
      className={cn(className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  value: triggerValue,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { value, onValueChange } = useTabs();
  const selected = value === triggerValue;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      data-state={selected ? "active" : "inactive"}
      aria-controls={`tabpanel-${triggerValue}`}
      id={`tab-${triggerValue}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => onValueChange(triggerValue)}
      onKeyDown={(event) => {
        let next: string | null = null;
        if (event.key === "ArrowRight") {
          next = "next";
        } else if (event.key === "ArrowLeft") {
          next = "prev";
        }
        if (next) {
          event.preventDefault();
          const siblings = Array.from(
            event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
              '[role="tab"]',
            ) ?? [],
          );
          const idx = siblings.indexOf(event.currentTarget);
          const targetIdx =
            next === "next"
              ? (idx + 1) % siblings.length
              : (idx - 1 + siblings.length) % siblings.length;
          siblings[targetIdx]?.focus();
          siblings[targetIdx]?.click();
        }
      }}
      className={cn(
        "cursor-pointer border py-2.5 px-3 text-center font-label-md text-label-md uppercase tracking-wider transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low active:bg-surface-container-low",
        selected
          ? "border-primary bg-primary-container text-on-primary hover:bg-primary"
          : "border-outline bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:bg-surface-container hover:text-primary",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  value: contentValue,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { value } = useTabs();
  if (value !== contentValue) return null;
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${contentValue}`}
      aria-labelledby={`tab-${contentValue}`}
      data-state="active"
      className={cn(className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };