import { Star, Crown, Shield, Sparkles, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SubscriptionTier = "free" | "plus" | "admin" | "grandfathered";

interface TierBadgeProps {
  tier: SubscriptionTier;
  size?: "sm" | "md" | "lg";
  className?: string;
}

interface TierConfig {
  label: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  iconColor: string;
}

const tierConfigs: Record<SubscriptionTier, TierConfig> = {
  free: {
    label: "Free",
    icon: Star,
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-700 dark:text-gray-300",
    iconColor: "text-gray-500 dark:text-gray-400",
  },
  plus: {
    label: "Plus",
    icon: Crown,
    bgColor: "bg-gradient-to-r from-purple-500 to-pink-500",
    textColor: "text-white",
    iconColor: "text-white",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    bgColor: "bg-gradient-to-r from-blue-500 to-cyan-500",
    textColor: "text-white",
    iconColor: "text-white",
  },
  grandfathered: {
    label: "Legacy",
    icon: Sparkles,
    bgColor: "bg-gradient-to-r from-amber-500 to-orange-500",
    textColor: "text-white",
    iconColor: "text-white",
  },
};

const sizeClasses = {
  sm: {
    container: "px-2 py-0.5 text-xs gap-1",
    icon: "h-3 w-3",
  },
  md: {
    container: "px-3 py-1 text-sm gap-1.5",
    icon: "h-4 w-4",
  },
  lg: {
    container: "px-4 py-1.5 text-base gap-2",
    icon: "h-5 w-5",
  },
};

export function TierBadge({ tier, size = "md", className }: TierBadgeProps) {
  const config = tierConfigs[tier];
  const sizes = sizeClasses[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        config.bgColor,
        config.textColor,
        sizes.container,
        className
      )}
    >
      <Icon className={cn(sizes.icon, config.iconColor)} />
      <span>{config.label}</span>
    </div>
  );
}
