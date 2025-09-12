"use client";

import React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

type ForceRefreshButtonProps = Omit<ButtonProps, "onClick"> & {
  children?: React.ReactNode;
  href?: string; // Optional path to navigate after forcing refresh (default '/')
};

export function ForceRefreshButton({ className, children, variant, size, href = "/", ...rest }: ForceRefreshButtonProps) {
  const handleForceRefresh = () => {
    try {
      const url = new URL(href, window.location.origin);
      url.searchParams.set("_ts", Date.now().toString());
      window.location.replace(url.toString());
    } catch (_e) {
      // Fallback: attempt hard reload
      window.location.assign(href || "/");
    }
  };

  return (
    <Button onClick={handleForceRefresh} className={className} variant={variant} size={size} {...rest}>
      {children ?? "Hacer click acá (forzar refresco)"}
    </Button>
  );
}
