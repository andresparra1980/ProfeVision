import * as React from "react";
import { cn } from "@/lib/utils";

const dashboardCardClassName =
  "relative overflow-hidden rounded-2xl border border-black/8 bg-gradient-to-br from-card via-card to-muted/35 text-card-foreground shadow-[0_26px_58px_-36px_rgba(15,23,42,0.42)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-16 before:bg-gradient-to-r before:from-sky-500/12 before:via-cyan-400/5 before:to-emerald-400/10 before:blur-2xl before:content-[''] dark:border-white/10 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900/80 dark:shadow-[0_30px_72px_-42px_rgba(0,0,0,0.92)]";

const dashboardCardSectionClassName =
  "relative border-t border-border/15 bg-muted/25 dark:border-white/10 dark:bg-zinc-950/55";

const dashboardInsetCardClassName =
  "rounded-2xl border border-black/8 bg-gradient-to-br from-background/95 via-background/90 to-muted/40 shadow-sm dark:border-white/10 dark:from-zinc-950/95 dark:via-zinc-950/90 dark:to-zinc-900/75 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    data-slot="card"
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    data-slot="card-header"
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    data-slot="card-title"
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    data-slot="card-description"
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div data-slot="card-content" ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    data-slot="card-footer"
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  dashboardCardClassName,
  dashboardCardSectionClassName,
  dashboardInsetCardClassName,
};
